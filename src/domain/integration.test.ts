import { describe, expect, it } from 'vitest'
import { AuditLog } from '../audit'
import { executeAuthorized } from '../auth'
import type { AuthSession } from '../auth'
import { CanonicalReporting } from '../reporting'
import {
  InMemorySyncServer,
  MemoryStorage,
  SyncCoordinator,
  type JsonValue,
  type SyncOperation,
} from '../sync/offlineSync'
import {
  CashReconciliationEngine,
  CashReconciliationError,
  type CashReconciliationSnapshot,
} from './cashReconciliation'
import { CatalogPricing } from './catalogPricing'
import { CustomersCreditEngine, CustomersCreditError } from './customersCredit'
import { InventoryEngine, quantity as inventoryQuantity } from './inventory'
import { PurchasingEngine, PurchasingError } from './purchasing'
import { IntegrityError, ReturnsCorrectionsEngine } from './returnsCorrections'
import {
  SalesError,
  SalesTransactionEngine,
  type CompletedSale,
  type PaymentComponent,
} from './sales'
import type { Role } from './stateMachines'

const BUSINESS = 'biz-main'
const OTHER_BUSINESS = 'biz-other'
const STAFF = 'user-staff'
const MANAGER = 'user-manager'
const MANAGER_TWO = 'user-manager-two'
const OWNER = 'user-owner'
const TAX_RATE = 750n

/**
 * Every journey runs against one composed engine graph, mirroring how the
 * authoritative adapter must wire the domain slices together. Nothing here
 * mutates an engine's private records; journeys only use public commands and
 * reads, so the same contracts can be replayed behind a durable boundary.
 */
function world() {
  const pricing = new CatalogPricing()
  const inventory = new InventoryEngine()
  const sales = new SalesTransactionEngine(pricing, inventory, {
    'agent-collection': 'cash',
    'ussd-transfer': 'non_cash',
  })
  const credit = new CustomersCreditEngine()
  const integrity = new ReturnsCorrectionsEngine({ sales, inventory, credit })
  const purchasing = new PurchasingEngine(inventory)
  const cash = new CashReconciliationEngine()
  return { pricing, inventory, sales, credit, integrity, purchasing, cash }
}

type World = ReturnType<typeof world>

function addProduct(
  target: World,
  id: string,
  sellingPriceKobo: number,
  priceFloorKobo?: number,
) {
  return target.pricing.createProduct({
    id,
    sku: `SKU-${id}`,
    name: `Product ${id}`,
    category: 'parts',
    unit: 'each',
    aliases: [],
    sellingPriceKobo,
    priceFloorKobo,
    active: true,
    availableForSale: true,
  })
}

function receive(
  target: World,
  input: {
    productId: string
    units: number
    unitCostKobo: number
    clientEventId: string
    occurredAt?: string
    businessId?: string
  },
) {
  return target.inventory.receive({
    businessId: input.businessId ?? BUSINESS,
    productId: input.productId,
    quantity: inventoryQuantity(input.units),
    unitCost: BigInt(input.unitCostKobo),
    actorId: MANAGER,
    reason: 'stock receipt',
    clientEventId: input.clientEventId,
    occurredAt: input.occurredAt,
  })
}

const cashPayment = (id: string, amountKobo: number): PaymentComponent => ({
  id,
  method: 'cash',
  amountKobo,
  confirmation: { state: 'confirmed_success', confirmedBy: STAFF },
})

const creditPayment = (id: string, amountKobo: number): PaymentComponent => ({
  id,
  method: 'customer_credit',
  amountKobo,
  confirmation: { state: 'confirmed_success', confirmedBy: MANAGER },
})

const customPayment = (
  id: string,
  customMethodId: string,
  amountKobo: number,
): PaymentComponent => ({
  id,
  method: 'custom',
  customMethodId,
  amountKobo,
  confirmation: { state: 'confirmed_success', confirmedBy: STAFF },
})

type SaleRequest = {
  saleId: string
  actorId?: string
  actorRole?: Role
  lines: Array<{
    id: string
    productId: string
    quantity: number
    unitPriceKobo?: number
  }>
  payments: PaymentComponent[]
  customer?: { id: string; name: string; phone: string }
  creditApproval?: { approverId: string; approverRole: Role }
  overLimitApproval?: { approverId: string; approverRole: Role }
  occurredAt: string
  taxRateBasisPoints?: bigint
}

/**
 * Composition contract for a completed sale:
 *
 * 1. Credit eligibility is validated BEFORE the sale is committed, so the
 *    credit engine's authoritative rejection can never leave a completed
 *    sale without its debt (INV-GLOBAL-004).
 * 2. The sales engine commits the payment, pricing, inventory and report
 *    effects atomically at its own boundary.
 * 3. A credit sale then records its debt in the credit ledger, idempotent by
 *    client event id.
 */
function completeSale(target: World, request: SaleRequest): CompletedSale {
  const actorId = request.actorId ?? STAFF
  const actorRole = request.actorRole ?? 'staff'
  const creditKobo = request.payments
    .filter((payment) => payment.method === 'customer_credit')
    .reduce((sum, payment) => sum + payment.amountKobo, 0)
  if (creditKobo > 0) assertCreditEligible(target, request, creditKobo)

  const sale = target.sales.complete({
    businessId: BUSINESS,
    id: request.saleId,
    clientRequestId: `request:${request.saleId}`,
    actorId,
    actorRole,
    lines: request.lines,
    payments: request.payments,
    customer: request.customer,
    creditApproval: request.creditApproval,
    taxRateBasisPoints: request.taxRateBasisPoints ?? TAX_RATE,
    taxMode: 'exclusive',
    occurredAt: request.occurredAt,
  })

  if (sale.creditKobo > 0 && request.customer) {
    target.credit.recordCreditSale({
      businessId: BUSINESS,
      customerId: request.customer.id,
      debtId: `debt:${request.saleId}`,
      saleId: sale.id,
      amountMinor: BigInt(sale.creditKobo),
      actorId,
      actorRole,
      clientEventId: `credit:${sale.clientRequestId}`,
      creditApproval: request.creditApproval!,
      overLimitApproval: request.overLimitApproval,
      occurredAt: request.occurredAt,
    })
  }
  return sale
}

function assertCreditEligible(
  target: World,
  request: SaleRequest,
  creditKobo: number,
): void {
  // A missing customer is rejected by the sales engine before it commits,
  // so this pre-check covers only what the credit engine would otherwise
  // refuse after the sale had already completed.
  const customer = target.credit.getCustomer(
    BUSINESS,
    request.customer?.id ?? '',
  )
  if (!customer)
    throw new CustomersCreditError(
      'CUSTOMER_NOT_FOUND',
      'Customer was not found in this business',
    )
  if (customer.creditStatus === 'blocked')
    throw new CustomersCreditError(
      'CREDIT_NOT_ALLOWED',
      'Blocked customers cannot complete a credit sale',
    )
  if (customer.creditStatus === 'restricted')
    throw new CustomersCreditError(
      'RESTRICTED_CREDIT_CONFIGURATION_REQUIRED',
      'Restricted credit requires a configured management-handling rule',
    )
  if (customer.creditLimitMinor !== undefined) {
    const outstanding = target.credit.getOutstandingForCustomer(
      BUSINESS,
      customer.id,
    ).minor
    if (
      outstanding + BigInt(creditKobo) > customer.creditLimitMinor &&
      !request.overLimitApproval
    )
      throw new CustomersCreditError(
        'OVER_LIMIT_EXCEPTION_REQUIRED',
        'A credit sale above the limit requires a separate management exception',
      )
  }
}

/**
 * The documented cash integration boundary (Handoff 12/26): the cash engine
 * records explicit events; an integration adapter feeds completed-sale cash
 * into the business day so Expected Cash reconciles with the sale ledger.
 */
function recordSaleCash(
  target: World,
  sale: CompletedSale,
  sessionId: string,
): void {
  if (sale.cashKobo <= 0) return
  target.cash.recordCashEvent({
    businessId: BUSINESS,
    sessionId,
    id: `cash-event:${sale.id}`,
    kind: 'cash_sale',
    amountKobo: sale.cashKobo,
    actorId: sale.actorId,
    actorRole: 'staff',
    reason: `sale:${sale.id}`,
  })
}

const ALL_TIME = {
  from: '2000-01-01T00:00:00.000Z',
  to: '2100-01-01T00:00:00.000Z',
}

function project(
  target: World,
  options: {
    period?: { from: string; to: string }
    businessId?: string
    cashSnapshots?: CashReconciliationSnapshot[]
  } = {},
) {
  return new CanonicalReporting({
    sales: target.sales,
    inventory: target.inventory,
    credit: target.credit,
    purchasing: target.purchasing,
    returns: target.integrity,
    cashSnapshots: options.cashSnapshots ?? [],
    cashEvents: (options.cashSnapshots ?? []).flatMap((snapshot) =>
      target.cash.listEvents(snapshot.businessId, snapshot.sessionId),
    ),
  }).project(options.businessId ?? BUSINESS, options.period ?? ALL_TIME)
}

function effectCounts(target: World) {
  return {
    inventoryEvents: target.inventory.listEvents().length,
    saleReports: target.sales.listReports().length,
    saleAudits: target.sales.listAudits().length,
    integrityReports: target.integrity.listReportEvents(BUSINESS).length,
    integrityAudits: target.integrity.listAuditEvents().length,
    creditEvents: target.credit.listHistory(BUSINESS).length,
    purchases: target.purchasing.listPurchases(BUSINESS).length,
    supplierPayments: target.purchasing.listPayments(BUSINESS).length,
    supplierReturns: target.purchasing.listReturns(BUSINESS).length,
    cashAudits: target.cash.listAudits(BUSINESS).length,
  }
}

function replaySale(target: World, payload: JsonValue): CompletedSale {
  const record = payload as Record<string, unknown>
  return target.sales.complete({
    businessId: String(record.businessId),
    id: String(record.saleId),
    clientRequestId: String(record.clientRequestId),
    actorId: String(record.actorId),
    actorRole: record.actorRole as Role,
    lines: (record.lines as Array<Record<string, unknown>>).map(
      (line, index) => ({
        id: String(line.id ?? `line-${index + 1}`),
        productId: String(line.productId),
        quantity: Number(line.quantity),
        unitPriceKobo: Number(line.unitPriceKobo),
      }),
    ),
    payments: (record.payments as Array<Record<string, unknown>>).map(
      (payment, index) => ({
        id: String(payment.id ?? `payment-${index + 1}`),
        method: payment.method as PaymentComponent['method'],
        amountKobo: Number(payment.amountKobo),
        customMethodId:
          payment.customMethodId === undefined
            ? undefined
            : String(payment.customMethodId),
        confirmation: payment.confirmation as PaymentComponent['confirmation'],
      }),
    ),
    taxRateBasisPoints: BigInt(Number(record.taxRateBasisPoints)),
    taxMode: 'exclusive',
    occurredAt: String(record.occurredAt),
  })
}

describe('Sabi Shop cross-domain integration journeys', () => {
  it('J1: product → sale → payment → inventory → COGS → reporting stays consistent', () => {
    const w = world()
    addProduct(w, 'p1', 1000, 800)
    receive(w, {
      productId: 'p1',
      units: 10,
      unitCostKobo: 400,
      clientEventId: 'receipt-open',
    })
    receive(w, {
      productId: 'p1',
      units: 10,
      unitCostKobo: 600,
      clientEventId: 'receipt-two',
    })
    expect(w.inventory.getValuation('p1').weightedAverageCost).toBe(500n)

    const sale = completeSale(w, {
      saleId: 'sale-1',
      occurredAt: '2026-09-09T09:00:00.000Z',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 2 }],
      payments: [cashPayment('pay-1', 2150)],
    })

    expect(sale).toMatchObject({
      totalDueKobo: 2150,
      taxKobo: 150,
      cogsKobo: 1000,
      grossProfitKobo: 1000,
      cashKobo: 2150,
      nonCashKobo: 0,
    })
    expect(w.inventory.getStock('p1')).toMatchObject({
      sellable: 18000n,
      total: 18000n,
      negative: false,
      exception: null,
    })
    expect(w.pricing.getIncentivePricingFacts('line-1')).toMatchObject({
      saleLineId: 'line-1',
      actualSellingValueKobo: 2000,
    })
    expect(w.sales.listReports()).toEqual([
      expect.objectContaining({
        type: 'sale.completed',
        businessId: BUSINESS,
        saleId: 'sale-1',
        totalDueKobo: 2150,
        taxKobo: 150,
        cogsKobo: 1000,
        grossProfitKobo: 1000,
        cashKobo: 2150,
      }),
    ])

    const report = project(w)
    expect(report.sales).toMatchObject({
      netRecognizedSellingValueKobo: 2000,
      taxKobo: 150,
      cogsKobo: 1000,
      grossProfitKobo: 1000,
      cashKobo: 2150,
      nonCashKobo: 0,
      creditKobo: 0,
    })
    expect(report.inventory).toMatchObject({
      remainingQuantity: 18000n,
      valueKobo: 9000n,
      negativeStockProductIds: [],
    })
    expect(report.sales.sourceEventIds).toContain('sale.completed:sale-1')
    expect(
      report.traces.some((trace) => trace.sourceId === 'sale.completed:sale-1'),
    ).toBe(true)

    const beforeSaleWindow = project(w, {
      period: {
        from: '2026-09-09T00:00:00.000Z',
        to: '2026-09-09T08:00:00.000Z',
      },
    })
    expect(beforeSaleWindow.sales.netRecognizedSellingValueKobo).toBe(0)

    // A later receipt changes the weighted average but never rewrites the
    // completed sale's historical COGS or its report event (INV-004).
    receive(w, {
      productId: 'p1',
      units: 6,
      unitCostKobo: 700,
      clientEventId: 'receipt-three',
    })
    expect(w.inventory.getValuation('p1').weightedAverageCost).toBe(546n)
    expect(w.sales.getSale(BUSINESS, 'sale-1')?.cogsKobo).toBe(1000)
    expect(project(w).sales.cogsKobo).toBe(1000)
    expect(project(w).inventory.valueKobo).toBe(13104n)

    // A failed payment settlement must leave every touched domain untouched.
    const before = effectCounts(w)
    expect(() =>
      completeSale(w, {
        saleId: 'sale-bad-payment',
        occurredAt: '2026-09-09T09:05:00.000Z',
        lines: [{ id: 'line-1', productId: 'p1', quantity: 1 }],
        payments: [cashPayment('pay-bad', 999)],
      }),
    ).toThrowError(SalesError)
    expect(effectCounts(w)).toEqual(before)
    expect(w.sales.getSale(BUSINESS, 'sale-bad-payment')).toBeUndefined()
  })

  it('J2: credit sale → debt → repayment → reporting clears the receivable exactly', () => {
    const w = world()
    addProduct(w, 'p1', 1000)
    receive(w, {
      productId: 'p1',
      units: 10,
      unitCostKobo: 300,
      clientEventId: 'receipt-open',
    })
    const ada = { id: 'c-ada', name: 'Ada Obi', phone: '08031112233' }
    w.credit.createCustomer({
      businessId: BUSINESS,
      id: 'c-ada',
      name: ada.name,
      phone: ada.phone,
      creditStatus: 'allowed',
      creditLimitMinor: 5000n,
      actorId: STAFF,
    })
    w.credit.createCustomer({
      businessId: BUSINESS,
      id: 'c-tunde',
      name: 'Tunde Bala',
      phone: '08109993355',
      creditStatus: 'blocked',
      actorId: MANAGER,
    })

    const sale = completeSale(w, {
      saleId: 'sale-credit-1',
      occurredAt: '2026-09-09T09:00:00.000Z',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 3 }],
      payments: [creditPayment('pay-1', 3225)],
      customer: ada,
      creditApproval: { approverId: MANAGER, approverRole: 'manager' },
    })
    expect(sale.creditKobo).toBe(3225)
    expect(
      w.credit.getDebt(BUSINESS, 'c-ada', 'debt:sale-credit-1'),
    ).toMatchObject({
      outstandingMinor: 3225n,
      state: 'outstanding',
      saleId: 'sale-credit-1',
    })
    expect(project(w).credit.outstandingKobo).toBe(3225n)

    w.credit.recordRepayment({
      businessId: BUSINESS,
      customerId: 'c-ada',
      repaymentId: 'rep-1',
      actorId: STAFF,
      actorRole: 'staff',
      clientEventId: 'repayment-event-1',
      components: [
        {
          method: 'cash',
          amountMinor: 1000n,
          confirmation: { state: 'confirmed_success', confirmedBy: STAFF },
        },
      ],
      allocations: [{ debtId: 'debt:sale-credit-1', amountMinor: 1000n }],
      occurredAt: '2026-09-09T09:30:00.000Z',
    })
    expect(
      w.credit.getDebt(BUSINESS, 'c-ada', 'debt:sale-credit-1'),
    ).toMatchObject({
      outstandingMinor: 2225n,
      state: 'partially_repaid',
    })

    w.credit.recordRepayment({
      businessId: BUSINESS,
      customerId: 'c-ada',
      repaymentId: 'rep-2',
      actorId: MANAGER,
      actorRole: 'manager',
      clientEventId: 'repayment-event-2',
      components: [
        {
          method: 'bank_transfer',
          amountMinor: 2225n,
          confirmation: { state: 'confirmed_success', confirmedBy: MANAGER },
        },
      ],
      allocations: [{ debtId: 'debt:sale-credit-1', amountMinor: 2225n }],
      occurredAt: '2026-09-09T10:00:00.000Z',
    })
    expect(
      w.credit.getDebt(BUSINESS, 'c-ada', 'debt:sale-credit-1'),
    ).toMatchObject({
      outstandingMinor: 0n,
      state: 'paid',
    })
    const settled = project(w)
    expect(settled.credit.outstandingKobo).toBe(0n)
    expect(settled.sales.creditKobo).toBe(3225)
    expect(
      settled.traces.some((trace) => trace.sourceType === 'credit_event'),
    ).toBe(true)

    // A repayment allocation above the outstanding debt changes nothing.
    expect(() =>
      w.credit.recordRepayment({
        businessId: BUSINESS,
        customerId: 'c-ada',
        repaymentId: 'rep-3',
        actorId: STAFF,
        actorRole: 'staff',
        clientEventId: 'repayment-event-3',
        components: [
          {
            method: 'cash',
            amountMinor: 100n,
            confirmation: { state: 'confirmed_success', confirmedBy: STAFF },
          },
        ],
        allocations: [{ debtId: 'debt:sale-credit-1', amountMinor: 100n }],
      }),
    ).toThrowError(CustomersCreditError)
    expect(w.credit.getOutstandingForCustomer(BUSINESS, 'c-ada').minor).toBe(0n)

    // A blocked customer's credit sale must fail before any domain commits.
    const before = effectCounts(w)
    expect(() =>
      completeSale(w, {
        saleId: 'sale-blocked',
        occurredAt: '2026-09-09T11:00:00.000Z',
        lines: [{ id: 'line-1', productId: 'p1', quantity: 1 }],
        payments: [creditPayment('pay-blocked', 1075)],
        customer: { id: 'c-tunde', name: 'Tunde Bala', phone: '08109993355' },
        creditApproval: { approverId: MANAGER, approverRole: 'manager' },
      }),
    ).toThrowError(CustomersCreditError)
    expect(effectCounts(w)).toEqual(before)
    expect(w.sales.getSale(BUSINESS, 'sale-blocked')).toBeUndefined()
    expect(w.inventory.getStock('p1').sellable).toBe(7000n)

    // An over-limit credit sale without a separate exception leaves no sale.
    expect(() =>
      completeSale(w, {
        saleId: 'sale-over-limit',
        occurredAt: '2026-09-09T11:05:00.000Z',
        lines: [{ id: 'line-1', productId: 'p1', quantity: 6 }],
        payments: [creditPayment('pay-over', 6450)],
        customer: ada,
        creditApproval: { approverId: MANAGER, approverRole: 'manager' },
      }),
    ).toThrowError(CustomersCreditError)
    expect(effectCounts(w)).toEqual(before)

    // The same over-limit sale with a separate exception approval completes
    // and the debt ledger records the full obligation.
    const exceptional = completeSale(w, {
      saleId: 'sale-over-limit',
      occurredAt: '2026-09-09T11:10:00.000Z',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 6 }],
      payments: [creditPayment('pay-over', 6450)],
      customer: ada,
      creditApproval: { approverId: MANAGER, approverRole: 'manager' },
      overLimitApproval: { approverId: OWNER, approverRole: 'owner' },
    })
    expect(exceptional.creditKobo).toBe(6450)
    expect(w.credit.getOutstandingForCustomer(BUSINESS, 'c-ada').minor).toBe(
      6450n,
    )
    expect(w.inventory.getStock('p1').sellable).toBe(1000n)
  })

  it('J3: purchase → receiving → inventory → supplier obligation reconciles', () => {
    const w = world()
    addProduct(w, 'p1', 1000)
    w.purchasing.createSupplier({
      businessId: BUSINESS,
      id: 'sup-1',
      name: 'Lagos Parts Ltd',
    })

    const purchaseOne = w.purchasing.receivePurchase({
      id: 'purchase-1',
      businessId: BUSINESS,
      supplierId: 'sup-1',
      actorId: MANAGER,
      clientEventId: 'purchase-event-1',
      lines: [
        { productId: 'p1', quantity: inventoryQuantity(10), unitCost: 400n },
      ],
    })
    expect(purchaseOne.total).toBe(4000n)
    expect(w.inventory.getStock('p1').sellable).toBe(10000n)
    expect(w.purchasing.supplierOutstanding(BUSINESS, 'sup-1')).toBe(4000n)

    w.purchasing.receivePurchase({
      id: 'purchase-2',
      businessId: BUSINESS,
      supplierId: 'sup-1',
      actorId: MANAGER,
      clientEventId: 'purchase-event-2',
      lines: [
        { productId: 'p1', quantity: inventoryQuantity(10), unitCost: 600n },
      ],
    })
    expect(w.purchasing.supplierOutstanding(BUSINESS, 'sup-1')).toBe(10000n)
    expect(w.inventory.getValuation('p1').weightedAverageCost).toBe(500n)

    w.purchasing.recordPayment({
      id: 'payment-1',
      businessId: BUSINESS,
      purchaseId: 'purchase-1',
      amount: 4000n,
      method: 'transfer',
      reference: 'TRF-1',
      actorId: MANAGER,
      clientEventId: 'payment-event-1',
    })
    expect(w.purchasing.supplierOutstanding(BUSINESS, 'sup-1')).toBe(6000n)

    // A failed payment attempt is recorded but never settles the obligation.
    w.purchasing.recordPayment({
      id: 'payment-2',
      businessId: BUSINESS,
      purchaseId: 'purchase-2',
      amount: 2000n,
      method: 'transfer',
      reference: 'TRF-2',
      actorId: MANAGER,
      clientEventId: 'payment-event-2',
      state: 'failed',
    })
    expect(w.purchasing.supplierOutstanding(BUSINESS, 'sup-1')).toBe(6000n)

    const report = project(w)
    expect(report.suppliers.outstandingKobo).toBe(6000n)
    expect(report.suppliers.sourceEventIds).toContain('purchase-1')
    expect(report.suppliers.sourceEventIds).toContain('payment-1')

    // Duplicate delivery of the same purchase creates one receipt only.
    const eventsBefore = w.inventory.listEvents().length
    const retry = w.purchasing.receivePurchase({
      id: 'purchase-1',
      businessId: BUSINESS,
      supplierId: 'sup-1',
      actorId: MANAGER,
      clientEventId: 'purchase-event-1',
      lines: [
        { productId: 'p1', quantity: inventoryQuantity(10), unitCost: 400n },
      ],
    })
    expect(retry.id).toBe('purchase-1')
    expect(w.inventory.listEvents()).toHaveLength(eventsBefore)
    expect(w.purchasing.listPurchases(BUSINESS)).toHaveLength(2)

    // Another business's purchasing never reaches this business's report.
    addProduct(w, 'p-other', 2000)
    w.purchasing.createSupplier({
      businessId: OTHER_BUSINESS,
      id: 'sup-other',
      name: 'Other Business Supplier',
    })
    w.purchasing.receivePurchase({
      id: 'purchase-other-1',
      businessId: OTHER_BUSINESS,
      supplierId: 'sup-other',
      actorId: MANAGER_TWO,
      clientEventId: 'purchase-other-event-1',
      lines: [
        {
          productId: 'p-other',
          quantity: inventoryQuantity(5),
          unitCost: 500n,
        },
      ],
    })
    expect(w.purchasing.supplierOutstanding(OTHER_BUSINESS, 'sup-other')).toBe(
      2500n,
    )
    expect(project(w).suppliers.outstandingKobo).toBe(6000n)
    expect(w.inventory.listEvents('p1')).toHaveLength(eventsBefore)

    // A payment against a missing purchase is refused without effects.
    expect(() =>
      w.purchasing.recordPayment({
        id: 'payment-bad',
        businessId: BUSINESS,
        purchaseId: 'missing-purchase',
        amount: 100n,
        method: 'transfer',
        reference: null,
        actorId: MANAGER,
        clientEventId: 'payment-bad-event',
      }),
    ).toThrowError(PurchasingError)
    expect(w.purchasing.listPayments(BUSINESS)).toHaveLength(2)
  })

  it('J4: supplier return → payable/credit → inventory and settlement stay distinct', () => {
    const w = world()
    addProduct(w, 'p1', 1000)
    addProduct(w, 'p2', 2000)
    w.purchasing.createSupplier({
      businessId: BUSINESS,
      id: 'sup-a',
      name: 'Unpaid Supplier',
    })
    w.purchasing.createSupplier({
      businessId: BUSINESS,
      id: 'sup-b',
      name: 'Paid Supplier',
    })

    // Unpaid purchase: an applied return reduces the payable (SUP-003).
    const purchaseA = w.purchasing.receivePurchase({
      id: 'purchase-a',
      businessId: BUSINESS,
      supplierId: 'sup-a',
      actorId: MANAGER,
      clientEventId: 'purchase-event-a',
      lines: [
        { productId: 'p1', quantity: inventoryQuantity(10), unitCost: 600n },
      ],
    })
    w.purchasing.requestReturn({
      id: 'return-a',
      businessId: BUSINESS,
      purchaseId: 'purchase-a',
      actorId: MANAGER,
      clientEventId: 'return-event-a',
      reason: 'Defective units',
      condition: 'sellable',
      lines: [{ productId: 'p1', quantity: inventoryQuantity(4) }],
    })
    w.purchasing.verifyReturn(BUSINESS, 'return-a')
    w.purchasing.approveReturn(BUSINESS, 'return-a')
    w.purchasing.applyReturn(BUSINESS, 'return-a')
    expect(w.inventory.getStock('p1').sellable).toBe(6000n)
    expect(w.purchasing.supplierOutstanding(BUSINESS, 'sup-a')).toBe(3600n)
    const appliedA = w.purchasing
      .listReturns(BUSINESS)
      .find((item) => item.id === 'return-a')
    expect(appliedA).toMatchObject({
      state: 'applied',
      unpaidPayableReduction: 2400n,
      supplierCredit: 0n,
    })
    const supplierReturnEvent = w.inventory
      .listEvents('p1')
      .find((event) => event.type === 'supplier_return')
    expect(supplierReturnEvent?.referenceId).toBe(
      purchaseA.lines[0].receiptEventId,
    )

    // Paid purchase: an applied return creates a supplier credit, and a
    // confirmed settlement consumes it (SUP-004).
    w.purchasing.receivePurchase({
      id: 'purchase-b',
      businessId: BUSINESS,
      supplierId: 'sup-b',
      actorId: MANAGER,
      clientEventId: 'purchase-event-b',
      lines: [
        { productId: 'p2', quantity: inventoryQuantity(5), unitCost: 1000n },
      ],
    })
    w.purchasing.recordPayment({
      id: 'payment-b',
      businessId: BUSINESS,
      purchaseId: 'purchase-b',
      amount: 5000n,
      method: 'transfer',
      reference: 'TRF-B',
      actorId: MANAGER,
      clientEventId: 'payment-event-b',
    })
    expect(w.purchasing.supplierOutstanding(BUSINESS, 'sup-b')).toBe(0n)
    w.purchasing.requestReturn({
      id: 'return-b',
      businessId: BUSINESS,
      purchaseId: 'purchase-b',
      actorId: MANAGER,
      clientEventId: 'return-event-b',
      reason: 'Wrong specification',
      condition: 'held',
      lines: [{ productId: 'p2', quantity: inventoryQuantity(2) }],
    })
    w.purchasing.verifyReturn(BUSINESS, 'return-b')
    w.purchasing.approveReturn(BUSINESS, 'return-b')
    w.purchasing.applyReturn(BUSINESS, 'return-b')
    expect(w.inventory.getStock('p2').sellable).toBe(3000n)
    expect(w.purchasing.supplierOutstanding(BUSINESS, 'sup-b')).toBe(-2000n)
    expect(project(w).suppliers.outstandingKobo).toBe(1600n)

    const settlement = w.purchasing.settleReturn({
      id: 'settlement-b',
      businessId: BUSINESS,
      returnId: 'return-b',
      amount: 2000n,
      method: 'credit-note',
      reference: 'CN-1',
      actorId: MANAGER,
      clientEventId: 'settlement-event-b',
    })
    expect(settlement.state).toBe('confirmed_success')
    expect(
      w.purchasing.listReturns(BUSINESS).find((item) => item.id === 'return-b')
        ?.state,
    ).toBe('settled')
    expect(w.purchasing.supplierOutstanding(BUSINESS, 'sup-b')).toBe(0n)

    // The derived report must reconcile with the authoritative engine after
    // settlement, and drill down to the settlement record.
    const report = project(w)
    expect(report.suppliers.outstandingKobo).toBe(3600n)
    expect(report.suppliers.sourceEventIds).toContain('settlement-b')

    // Applying a return before approval is refused without inventory effects.
    w.purchasing.requestReturn({
      id: 'return-early',
      businessId: BUSINESS,
      purchaseId: 'purchase-a',
      actorId: MANAGER,
      clientEventId: 'return-event-early',
      reason: 'Not yet approved',
      condition: 'sellable',
      lines: [{ productId: 'p1', quantity: inventoryQuantity(1) }],
    })
    const stockBefore = w.inventory.getStock('p1').sellable
    expect(() =>
      w.purchasing.applyReturn(BUSINESS, 'return-early'),
    ).toThrowError(PurchasingError)
    expect(
      w.purchasing
        .listReturns(BUSINESS)
        .find((item) => item.id === 'return-early')?.state,
    ).toBe('requested')
    expect(w.inventory.getStock('p1').sellable).toBe(stockBefore)

    // A return above the received line is refused outright.
    expect(() =>
      w.purchasing.requestReturn({
        id: 'return-too-much',
        businessId: BUSINESS,
        purchaseId: 'purchase-a',
        actorId: MANAGER,
        clientEventId: 'return-event-too-much',
        reason: 'Impossible quantity',
        condition: 'sellable',
        lines: [{ productId: 'p1', quantity: inventoryQuantity(99) }],
      }),
    ).toThrowError(PurchasingError)
    expect(w.purchasing.listReturns(BUSINESS)).toHaveLength(3)
  })

  it('J5: sale return → inventory, financial, refund and reporting consequences', () => {
    const w = world()
    addProduct(w, 'p1', 1000)
    receive(w, {
      productId: 'p1',
      units: 10,
      unitCostKobo: 500,
      clientEventId: 'receipt-open',
    })
    const sale = completeSale(w, {
      saleId: 'sale-1',
      occurredAt: '2026-09-09T09:00:00.000Z',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 2 }],
      payments: [cashPayment('pay-1', 2150)],
    })
    expect(w.inventory.getStock('p1').sellable).toBe(8000n)

    w.integrity.requestReturn({
      businessId: BUSINESS,
      saleId: sale.id,
      returnId: 'return-1',
      clientEventId: 'return-event-1',
      requestedById: STAFF,
      requestedByRole: 'staff',
      reason: 'Wrong fitting',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
    })
    w.integrity.verifyReturn(BUSINESS, 'return-1', MANAGER, 'manager')
    w.integrity.approveReturn(BUSINESS, 'return-1', MANAGER_TWO, 'manager', {
      condition: 'held',
    })
    const applied = w.integrity.applyReturn(
      BUSINESS,
      'return-1',
      MANAGER,
      'manager',
    )

    expect(applied.state).toBe('applied')
    expect(w.inventory.getStock('p1')).toMatchObject({
      sellable: 8000n,
      held: 1000n,
      total: 9000n,
    })
    // The tax-inclusive reversal: the customer paid ₦1,075 for that unit.
    expect(applied.financialEffect).toMatchObject({
      totalDueKobo: -1075,
      taxKobo: -75,
      cogsKobo: -500,
      grossProfitKobo: -500,
      cashKobo: -1075,
    })
    expect(applied.refund).toMatchObject({ state: 'due', amountKobo: 1075 })
    expect(w.sales.getSale(BUSINESS, sale.id)).toMatchObject({
      totalDueKobo: 2150,
      cogsKobo: 1000,
    })

    const settled = w.integrity.settleRefund(BUSINESS, 'return-1', MANAGER, {
      method: 'cash',
      externalReference: 'till-refund-1',
    })
    expect(settled.state).toBe('settled')
    expect(settled.refund).toMatchObject({ state: 'settled', amountKobo: 1075 })

    const report = project(w)
    expect(report.sales).toMatchObject({
      netRecognizedSellingValueKobo: 1000,
      taxKobo: 75,
      cogsKobo: 500,
      grossProfitKobo: 500,
      cashKobo: 1075,
    })
    expect(
      report.traces.some((trace) => trace.sourceId === 'sale.completed:sale-1'),
    ).toBe(true)
    expect(
      report.traces.some(
        (trace) => trace.sourceId === 'sale.return.applied:sale-1',
      ),
    ).toBe(true)

    // A second legitimate return of the remaining unit is allowed...
    w.integrity.requestReturn({
      businessId: BUSINESS,
      saleId: sale.id,
      returnId: 'return-2',
      clientEventId: 'return-event-2',
      requestedById: STAFF,
      requestedByRole: 'staff',
      reason: 'Customer changed mind',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
    })
    // ...but a request that would exceed the sold quantity is refused.
    expect(() =>
      w.integrity.requestReturn({
        businessId: BUSINESS,
        saleId: sale.id,
        returnId: 'return-3',
        clientEventId: 'return-event-3',
        requestedById: STAFF,
        requestedByRole: 'staff',
        reason: 'Over-return attempt',
        lines: [{ lineId: 'line-1', productId: 'p1', quantity: 2 }],
      }),
    ).toThrowError(IntegrityError)
    expect(w.integrity.getReturn(BUSINESS, 'return-3')).toBeUndefined()

    // Applying a return that was never approved has no inventory effect.
    expect(() =>
      w.integrity.applyReturn(BUSINESS, 'return-2', MANAGER, 'manager'),
    ).toThrowError(IntegrityError)
    expect(w.inventory.getStock('p1')).toMatchObject({
      sellable: 8000n,
      held: 1000n,
    })
  })

  it('J6: correction → audit lineage → downstream recalculation', () => {
    const w = world()
    addProduct(w, 'p1', 1000)
    receive(w, {
      productId: 'p1',
      units: 10,
      unitCostKobo: 500,
      clientEventId: 'receipt-open',
    })
    const sale = completeSale(w, {
      saleId: 'sale-1',
      occurredAt: '2026-09-09T09:00:00.000Z',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 3 }],
      payments: [cashPayment('pay-1', 3225)],
    })
    expect(sale.cogsKobo).toBe(1500)

    // Staff cannot apply a material correction.
    const before = effectCounts(w)
    expect(() =>
      w.integrity.correctSale({
        businessId: BUSINESS,
        saleId: sale.id,
        clientEventId: 'correction-unauthorized',
        actorId: STAFF,
        actorRole: 'staff',
        reason: 'Staff attempted material correction',
        change: {
          field: 'quantity',
          lineId: 'line-1',
          productId: 'p1',
          correctedQuantity: 2,
        },
      }),
    ).toThrowError(IntegrityError)
    expect(effectCounts(w)).toEqual(before)

    const correction = w.integrity.correctSale({
      businessId: BUSINESS,
      saleId: sale.id,
      clientEventId: 'correction-1',
      actorId: MANAGER,
      actorRole: 'manager',
      reason: 'Customer bought two, not three',
      approval: { approverId: OWNER, approverRole: 'owner' },
      occurredAt: '2026-09-09T09:10:00.000Z',
      change: {
        field: 'quantity',
        lineId: 'line-1',
        productId: 'p1',
        correctedQuantity: 2,
      },
    })
    expect(correction.state).toBe('applied')
    expect(correction.severity).toBe('material')
    expect(correction.financialEffect).toMatchObject({
      totalDueKobo: -1075,
      taxKobo: -75,
      cogsKobo: -500,
      grossProfitKobo: -500,
    })
    expect(w.inventory.getStock('p1').sellable).toBe(8000n)

    const audit = w.integrity
      .listAuditEvents()
      .find((event) => event.type === 'sale.correction.applied')
    expect(audit?.original.lines[0]).toMatchObject({ quantity: 3 })
    expect(audit?.corrected?.lines[0]).toMatchObject({ quantity: 2 })
    expect(audit?.downstream.inventoryEventIds).toEqual(
      correction.downstream.inventoryEventIds,
    )

    // The original sale record is preserved; the report recalculates to
    // exactly a clean two-unit sale.
    expect(w.sales.getSale(BUSINESS, sale.id)?.totalDueKobo).toBe(3225)
    const report = project(w)
    expect(report.sales).toMatchObject({
      netRecognizedSellingValueKobo: 2000,
      taxKobo: 150,
      cogsKobo: 1000,
      grossProfitKobo: 1000,
      cashKobo: 2150,
    })

    // A dependent applied return blocks a further material correction.
    w.integrity.requestReturn({
      businessId: BUSINESS,
      saleId: sale.id,
      returnId: 'return-1',
      clientEventId: 'return-event-1',
      requestedById: STAFF,
      requestedByRole: 'staff',
      reason: 'One corrected unit came back',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
    })
    w.integrity.verifyReturn(BUSINESS, 'return-1', MANAGER, 'manager')
    w.integrity.approveReturn(BUSINESS, 'return-1', OWNER, 'owner', {
      condition: 'sellable',
    })
    w.integrity.applyReturn(BUSINESS, 'return-1', MANAGER, 'manager')
    const stockAfterReturn = w.inventory.getStock('p1').sellable
    expect(() =>
      w.integrity.correctSale({
        businessId: BUSINESS,
        saleId: sale.id,
        clientEventId: 'correction-2',
        actorId: MANAGER,
        actorRole: 'manager',
        reason: 'Dependent return exists',
        approval: { approverId: OWNER, approverRole: 'owner' },
        change: {
          field: 'quantity',
          lineId: 'line-1',
          productId: 'p1',
          correctedQuantity: 1,
        },
      }),
    ).toThrowError(IntegrityError)
    expect(w.inventory.getStock('p1').sellable).toBe(stockAfterReturn)
  })

  it('J7: cash sale → Expected Cash → reconciliation with a visible discrepancy', () => {
    const w = world()
    addProduct(w, 'p1', 1000)
    receive(w, {
      productId: 'p1',
      units: 10,
      unitCostKobo: 500,
      clientEventId: 'receipt-open',
    })
    w.cash.openBusinessDay({
      businessId: BUSINESS,
      sessionId: 'day-1',
      custodyMode: 'shared_drawer',
      actorId: STAFF,
      actorRole: 'staff',
    })

    // Cash movements require a confirmed opening float first.
    expect(() =>
      w.cash.recordCashEvent({
        businessId: BUSINESS,
        sessionId: 'day-1',
        id: 'cash-event-early',
        kind: 'cash_sale',
        amountKobo: 100,
        actorId: STAFF,
        actorRole: 'staff',
        reason: 'before opening confirmation',
      }),
    ).toThrowError(CashReconciliationError)

    w.cash.enterOpeningCash(BUSINESS, 'day-1', 5000, STAFF, 'staff')
    w.cash.confirmOpeningCash(BUSINESS, 'day-1', 5000, MANAGER, 'manager')

    const cashSale = completeSale(w, {
      saleId: 'sale-cash-1',
      occurredAt: '2026-09-09T09:00:00.000Z',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 2 }],
      payments: [cashPayment('pay-1', 2150)],
    })
    // A custom method classified as cash contributes to physical cash
    // expectation (PAY-005); a non-cash method does not (PAY-006).
    const customCashSale = completeSale(w, {
      saleId: 'sale-cash-2',
      occurredAt: '2026-09-09T09:05:00.000Z',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 1 }],
      payments: [customPayment('pay-2', 'agent-collection', 1075)],
    })
    const nonCashSale = completeSale(w, {
      saleId: 'sale-cash-3',
      occurredAt: '2026-09-09T09:10:00.000Z',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 1 }],
      payments: [customPayment('pay-3', 'ussd-transfer', 1075)],
    })
    expect(nonCashSale.cashKobo).toBe(0)

    recordSaleCash(w, cashSale, 'day-1')
    recordSaleCash(w, customCashSale, 'day-1')
    w.cash.recordCashEvent({
      businessId: BUSINESS,
      sessionId: 'day-1',
      id: 'cash-event-out-1',
      kind: 'cash_out',
      amountKobo: 300,
      actorId: MANAGER,
      actorRole: 'manager',
      reason: 'transport payment',
    })

    const snapshot = w.cash.getSnapshot(BUSINESS, 'day-1')
    expect(snapshot.cashSalesKobo).toBe(3225)
    expect(snapshot.expectedCashKobo).toBe(5000 + 2150 + 1075 - 300)

    // The physical count is short; the discrepancy stays explicit.
    w.cash.recordActualCash(BUSINESS, 'day-1', 7800, STAFF, 'staff')
    const prepared = w.cash.prepareReconciliation(
      BUSINESS,
      'day-1',
      MANAGER,
      'manager',
    )
    expect(prepared).toMatchObject({
      cashVarianceKobo: -125,
      discrepancyStatus: 'unresolved',
      unresolved: true,
    })
    w.cash.resolveDiscrepancy(
      BUSINESS,
      'day-1',
      MANAGER,
      'manager',
      'shortage under investigation',
    )
    expect(w.cash.getSnapshot(BUSINESS, 'day-1')).toMatchObject({
      discrepancyStatus: 'resolved',
      unresolved: false,
    })

    const report = project(w, {
      cashSnapshots: [w.cash.getSnapshot(BUSINESS, 'day-1')],
    })
    expect(report.cash).toMatchObject({
      expectedKobo: 7925,
      actualKobo: 7800,
      varianceKobo: -125,
      unresolved: false,
    })
    expect(report.sales.cashKobo).toBe(3225)
    expect(report.sales.nonCashKobo).toBe(1075)
  })

  it('J8: opening cash → business day lifecycle → close and reopen', () => {
    const w = world()
    w.cash.openBusinessDay({
      businessId: BUSINESS,
      sessionId: 'day-1',
      custodyMode: 'shared_drawer',
      actorId: STAFF,
      actorRole: 'staff',
    })
    w.cash.enterOpeningCash(BUSINESS, 'day-1', 10000, STAFF, 'staff')
    w.cash.confirmOpeningCash(BUSINESS, 'day-1', 10000, MANAGER, 'manager')
    w.cash.recordCashEvent({
      businessId: BUSINESS,
      sessionId: 'day-1',
      id: 'cash-event-in-1',
      kind: 'cash_in',
      amountKobo: 500,
      actorId: MANAGER,
      actorRole: 'manager',
      reason: 'float top-up',
    })
    w.cash.recordInterimCount({
      businessId: BUSINESS,
      sessionId: 'day-1',
      id: 'count-1',
      actualCashKobo: 10500,
      actorId: MANAGER,
      actorRole: 'manager',
      note: 'midday spot check',
    })
    w.cash.recordActualCash(BUSINESS, 'day-1', 10500, STAFF, 'staff')
    w.cash.prepareReconciliation(BUSINESS, 'day-1', STAFF, 'staff')

    // Only management may confirm and close the business day.
    expect(() =>
      w.cash.confirmManagementReconciliation(BUSINESS, 'day-1', STAFF, 'staff'),
    ).toThrowError(CashReconciliationError)
    expect(() =>
      w.cash.closeBusinessDay(BUSINESS, 'day-1', STAFF, 'staff'),
    ).toThrowError(CashReconciliationError)
    expect(w.cash.getSnapshot(BUSINESS, 'day-1').state).toBe(
      'reconciliation_prepared',
    )

    w.cash.confirmManagementReconciliation(
      BUSINESS,
      'day-1',
      MANAGER,
      'manager',
    )
    const closed = w.cash.closeBusinessDay(
      BUSINESS,
      'day-1',
      MANAGER,
      'manager',
    )
    expect(closed).toMatchObject({
      state: 'closed',
      expectedCashKobo: 10500,
      actualCashKobo: 10500,
      cashVarianceKobo: 0,
      discrepancyStatus: 'none',
    })

    // A closed day accepts no further cash movements.
    expect(() =>
      w.cash.recordCashEvent({
        businessId: BUSINESS,
        sessionId: 'day-1',
        id: 'cash-event-late',
        kind: 'cash_sale',
        amountKobo: 100,
        actorId: STAFF,
        actorRole: 'staff',
        reason: 'after close',
      }),
    ).toThrowError(CashReconciliationError)

    // A reopen keeps the lifecycle auditable and the variance visible.
    w.cash.reopenBusinessDay(
      BUSINESS,
      'day-1',
      OWNER,
      'owner',
      'recount requested',
    )
    w.cash.recordActualCash(BUSINESS, 'day-1', 10400, STAFF, 'staff')
    const reopened = w.cash.prepareReconciliation(
      BUSINESS,
      'day-1',
      MANAGER,
      'manager',
    )
    expect(reopened).toMatchObject({
      state: 'reconciliation_prepared',
      cashVarianceKobo: -100,
      unresolved: true,
    })
    w.cash.confirmManagementReconciliation(
      BUSINESS,
      'day-1',
      MANAGER,
      'manager',
    )
    const reclosed = w.cash.closeBusinessDay(
      BUSINESS,
      'day-1',
      MANAGER,
      'manager',
    )
    expect(reclosed).toMatchObject({ state: 'closed', unresolved: true })

    expect(w.cash.listAudits(BUSINESS).map((event) => event.type)).toEqual([
      'business_day.opened',
      'opening_cash.entered',
      'opening_cash.confirmed',
      'cash.cash_in.recorded',
      'cash.interim_count.recorded',
      'cash.actual_count.recorded',
      'reconciliation.prepared',
      'reconciliation.management_confirmed',
      'business_day.closed',
      'business_day.reopened',
      'cash.actual_count.recorded',
      'reconciliation.prepared',
      'reconciliation.management_confirmed',
      'business_day.closed',
    ])
  })

  it('J9: offline sale → sync → authoritative state, duplicate and rejection safety', async () => {
    const local = world()
    const authoritative = world()
    for (const target of [local, authoritative]) {
      addProduct(target, 'p1', 1000)
      receive(target, {
        productId: 'p1',
        units: 10,
        unitCostKobo: 500,
        clientEventId: 'receipt-open',
      })
    }

    const queue = new SyncCoordinator(new MemoryStorage())
    const salePayload = {
      businessId: BUSINESS,
      saleId: 'sale-offline-1',
      clientRequestId: 'request:sale-offline-1',
      actorId: STAFF,
      actorRole: 'staff',
      lines: [
        { id: 'line-1', productId: 'p1', quantity: 2, unitPriceKobo: 1000 },
      ],
      payments: [
        {
          id: 'pay-1',
          method: 'cash',
          amountKobo: 2150,
          confirmation: { state: 'confirmed_success', confirmedBy: STAFF },
        },
      ],
      taxRateBasisPoints: 750,
      taxMode: 'exclusive',
      occurredAt: '2026-09-09T10:00:00.000Z',
    }
    const sale = completeSale(local, {
      saleId: 'sale-offline-1',
      occurredAt: salePayload.occurredAt,
      lines: [{ id: 'line-1', productId: 'p1', quantity: 2 }],
      payments: [cashPayment('pay-1', 2150)],
    })
    expect(sale.totalDueKobo).toBe(2150)

    const operation = queue.enqueue({
      operationId: `sale-complete:${sale.clientRequestId}`,
      businessId: BUSINESS,
      deviceId: 'device-01',
      actorUserId: STAFF,
      type: 'sale.complete',
      createdAt: sale.completedAt,
      businessState: 'completed',
      paymentState: 'confirmed',
      authorizationState: 'approved',
      payload: salePayload,
    })
    expect(operation.syncState).toBe('LOCAL_ONLY')
    expect(authoritative.sales.listReports()).toHaveLength(0)

    const server = new InMemorySyncServer({
      authorize: (candidate) => candidate.actorUserId !== 'user-revoked',
      apply: (candidate) => {
        const replayed = replaySale(authoritative, candidate.payload)
        return {
          saleId: replayed.id,
          totalDueKobo: replayed.totalDueKobo,
          cogsKobo: replayed.cogsKobo,
        }
      },
    })
    await queue.sync(server, BUSINESS)
    const synced = queue.get(BUSINESS, operation.operationId)
    expect(synced?.syncState).toBe('SYNCHRONIZED')
    expect(synced?.serverResult).toMatchObject({
      saleId: 'sale-offline-1',
      totalDueKobo: 2150,
      cogsKobo: 1000,
    })

    // The authoritative state equals the local state after replay.
    expect(
      authoritative.sales.getSale(BUSINESS, 'sale-offline-1'),
    ).toMatchObject({
      totalDueKobo: 2150,
      cogsKobo: 1000,
      grossProfitKobo: 1000,
    })
    expect(authoritative.inventory.getStock('p1')).toEqual(
      local.inventory.getStock('p1'),
    )
    expect(authoritative.sales.listReports()).toEqual(local.sales.listReports())

    // Duplicate delivery replays nothing: the server answers idempotently.
    const duplicateResponse = await server.accept(structuredClone(synced!))
    expect(duplicateResponse).toMatchObject({
      kind: 'accepted',
      serverSequence: synced?.serverSequence,
    })
    expect(authoritative.sales.listReports()).toHaveLength(1)
    expect(authoritative.inventory.getStock('p1').sellable).toBe(8000n)

    // A tampered re-use of the operation identity is a preserved conflict,
    // never an overwrite of the accepted business record.
    const tampered = {
      ...synced!,
      payload: {
        ...salePayload,
        payments: [{ ...salePayload.payments[0], amountKobo: 1 }],
      },
    } as SyncOperation
    const tamperedResponse = await server.accept(tampered)
    expect(tamperedResponse).toMatchObject({
      kind: 'conflict',
      code: 'operation_identity_reused',
    })
    expect(
      authoritative.sales.getSale(BUSINESS, 'sale-offline-1')?.totalDueKobo,
    ).toBe(2150)

    // Server-side authorization recheck rejects the stale actor; the local
    // record is preserved and surfaced for review, not silently rolled back.
    const rejectedSale = completeSale(local, {
      saleId: 'sale-offline-2',
      actorId: 'user-revoked',
      actorRole: 'staff',
      occurredAt: '2026-09-09T10:05:00.000Z',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 1 }],
      payments: [cashPayment('pay-1', 1075)],
    })
    queue.enqueue({
      operationId: `sale-complete:${rejectedSale.clientRequestId}`,
      businessId: BUSINESS,
      deviceId: 'device-01',
      actorUserId: 'user-revoked',
      type: 'sale.complete',
      createdAt: rejectedSale.completedAt,
      businessState: 'completed',
      paymentState: 'confirmed',
      authorizationState: 'approved',
      payload: {
        ...salePayload,
        saleId: 'sale-offline-2',
        clientRequestId: 'request:sale-offline-2',
        actorId: 'user-revoked',
        lines: [
          { id: 'line-1', productId: 'p1', quantity: 1, unitPriceKobo: 1000 },
        ],
        payments: [
          {
            id: 'pay-1',
            method: 'cash',
            amountKobo: 1075,
            confirmation: {
              state: 'confirmed_success',
              confirmedBy: 'user-revoked',
            },
          },
        ],
      },
    })
    await queue.sync(server, BUSINESS)
    const rejected = queue
      .list(BUSINESS)
      .find(
        (candidate) =>
          candidate.operationId === 'sale-complete:request:sale-offline-2',
      )
    expect(rejected).toMatchObject({
      syncState: 'REJECTED',
      serverAcceptance: 'rejected',
    })
    expect(rejected?.error?.code).toBe('authorization_denied')
    expect(
      authoritative.sales.getSale(BUSINESS, 'sale-offline-2'),
    ).toBeUndefined()
    expect(local.sales.getSale(BUSINESS, 'sale-offline-2')?.totalDueKobo).toBe(
      1075,
    )
  })

  it('J10: authorization → operation → audit with no unauthorized effects', async () => {
    const w = world()
    addProduct(w, 'p1', 1000)
    receive(w, {
      productId: 'p1',
      units: 10,
      unitCostKobo: 400,
      clientEventId: 'receipt-open',
    })
    const auditLog = new AuditLog()

    const session = (
      userId: string,
      role: 'staff' | 'manager',
    ): AuthSession => ({
      sessionId: `session-${userId}`,
      user: { userId, displayName: userId, active: true },
      device: { deviceId: 'device-01', trusted: true },
      memberships: [{ businessId: BUSINESS, roles: [role], active: true }],
      activeBusinessId: BUSINESS,
      issuedAt: 1,
      expiresAt: 4_102_444_800_000,
    })

    // A staff adjustment is denied before any domain mutation.
    const before = effectCounts(w)
    await expect(
      executeAuthorized({
        session: session(STAFF, 'staff'),
        request: {
          permission: 'inventory:adjust',
          businessId: BUSINESS,
          operationId: 'op-adjust-denied',
          targetRecordId: 'p1',
        },
        audit: auditLog,
        perform: () =>
          w.inventory.adjust({
            businessId: BUSINESS,
            productId: 'p1',
            quantity: inventoryQuantity(1),
            actorId: STAFF,
            reason: 'unauthorized adjustment attempt',
            clientEventId: 'adjust-denied',
            adjustmentId: 'adjust-denied',
            condition: 'sellable',
          }),
      }),
    ).rejects.toMatchObject({ decision: { reason: 'permission_denied' } })
    expect(effectCounts(w)).toEqual(before)
    const denial = auditLog.query(BUSINESS, {
      eventType: 'authorization.denied',
    })
    expect(denial).toHaveLength(1)
    expect(denial[0]).toMatchObject({
      actorUserId: STAFF,
      result: 'denied',
      operationId: 'op-adjust-denied',
    })

    // Staff purchasing is denied at the boundary.
    await expect(
      executeAuthorized({
        session: session(STAFF, 'staff'),
        request: {
          permission: 'purchase:record',
          businessId: BUSINESS,
          operationId: 'op-purchase-denied',
        },
        audit: auditLog,
        perform: () =>
          w.purchasing.createSupplier({
            businessId: BUSINESS,
            id: 'sup-unauthorized',
            name: 'Should Not Exist',
          }),
      }),
    ).rejects.toMatchObject({ decision: { reason: 'permission_denied' } })
    expect(w.purchasing.listSuppliers(BUSINESS)).toHaveLength(0)

    // A manager's authorized purchase flows through and is audited.
    await executeAuthorized({
      session: session(MANAGER, 'manager'),
      request: {
        permission: 'purchase:record',
        businessId: BUSINESS,
        operationId: 'op-purchase-1',
      },
      audit: auditLog,
      perform: () => {
        w.purchasing.createSupplier({
          businessId: BUSINESS,
          id: 'sup-auth',
          name: 'Authorized Supplier',
        })
        return w.purchasing.receivePurchase({
          id: 'purchase-auth-1',
          businessId: BUSINESS,
          supplierId: 'sup-auth',
          actorId: MANAGER,
          clientEventId: 'purchase-auth-event-1',
          lines: [
            { productId: 'p1', quantity: inventoryQuantity(5), unitCost: 600n },
          ],
        })
      },
    })
    expect(w.inventory.getStock('p1').sellable).toBe(15000n)
    expect(w.purchasing.supplierOutstanding(BUSINESS, 'sup-auth')).toBe(3000n)
    const accepted = auditLog
      .query(BUSINESS, { eventType: 'authorization.decision' })
      .filter((event) => event.result === 'accepted')
    expect(accepted.map((event) => event.operationId)).toContain(
      'op-purchase-1',
    )

    // A cross-business request is denied even for management.
    await expect(
      executeAuthorized({
        session: session(MANAGER, 'manager'),
        request: {
          permission: 'purchase:record',
          businessId: OTHER_BUSINESS,
          operationId: 'op-cross-business',
        },
        audit: auditLog,
        perform: () =>
          w.purchasing.createSupplier({
            businessId: OTHER_BUSINESS,
            id: 'sup-cross',
            name: 'Cross Business Supplier',
          }),
      }),
    ).rejects.toMatchObject({ decision: { reason: 'cross_business_access' } })
    expect(w.purchasing.listSuppliers(OTHER_BUSINESS)).toHaveLength(0)
    expect(
      auditLog
        .query(OTHER_BUSINESS, { eventType: 'authorization.denied' })
        .map((event) => event.operationId),
    ).toContain('op-cross-business')
  })
})
