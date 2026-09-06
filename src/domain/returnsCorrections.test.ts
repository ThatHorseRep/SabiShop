import { describe, expect, it } from 'vitest'
import { CatalogPricing } from './catalogPricing'
import { CustomersCreditEngine } from './customersCredit'
import { InventoryEngine, quantity as inventoryQuantity } from './inventory'
import {
  IntegrityError,
  ReturnsCorrectionsEngine,
  type PaymentCorrection,
} from './returnsCorrections'
import { SalesTransactionEngine, type PaymentComponent } from './sales'

const saleTime = '2026-09-06T09:00:00.000Z'

const confirmedCash = (id: string, amountKobo: number): PaymentComponent => ({
  id,
  method: 'cash',
  amountKobo,
  confirmation: { state: 'confirmed_success', confirmedBy: 'cashier' },
})

function setup(correctionWindowMinutes = 15) {
  const pricing = new CatalogPricing()
  pricing.createProduct({
    id: 'p1',
    sku: 'SKU-1',
    name: 'Pump',
    category: 'parts',
    unit: 'each',
    aliases: [],
    sellingPriceKobo: 1000,
    priceFloorKobo: 800,
    active: true,
    availableForSale: true,
  })
  const inventory = new InventoryEngine()
  inventory.receive({
    businessId: 'b1',
    productId: 'p1',
    quantity: inventoryQuantity(10),
    unitCost: 400n,
    actorId: 'owner',
    reason: 'opening',
    clientEventId: 'receipt-1',
  })
  const sales = new SalesTransactionEngine(pricing, inventory)
  const credit = new CustomersCreditEngine()
  const integrity = new ReturnsCorrectionsEngine(
    { sales, inventory, credit },
    { correctionWindowMinutes },
  )

  return { pricing, inventory, sales, credit, integrity }
}

function completeCashSale(sales: SalesTransactionEngine, actorId = 'staff-1') {
  return sales.complete({
    businessId: 'b1',
    id: 'sale-1',
    clientRequestId: 'sale-request-1',
    actorId,
    actorRole: 'staff',
    lines: [{ id: 'line-1', productId: 'p1', quantity: 2 }],
    payments: [confirmedCash('pay-1', 2000)],
    occurredAt: saleTime,
  })
}

function completeCreditSale(
  sales: SalesTransactionEngine,
  credit: CustomersCreditEngine,
) {
  credit.createCustomer({
    businessId: 'b1',
    id: 'customer-1',
    name: 'Ada Obi',
    phone: '08010000000',
    creditStatus: 'allowed',
    actorId: 'staff-1',
  })
  credit.recordCreditSale({
    businessId: 'b1',
    customerId: 'customer-1',
    debtId: 'debt-1',
    saleId: 'sale-credit-1',
    amountMinor: 2000n,
    actorId: 'staff-1',
    actorRole: 'staff',
    clientEventId: 'credit-sale-event-1',
    creditApproval: { approverId: 'manager-1', approverRole: 'manager' },
  })
  return sales.complete({
    businessId: 'b1',
    id: 'sale-credit-1',
    clientRequestId: 'sale-request-credit-1',
    actorId: 'staff-1',
    actorRole: 'staff',
    lines: [{ id: 'line-1', productId: 'p1', quantity: 2 }],
    payments: [
      {
        id: 'credit-pay-1',
        method: 'customer_credit',
        amountKobo: 2000,
        confirmation: { state: 'confirmed_success', confirmedBy: 'manager-1' },
      },
    ],
    customer: { id: 'customer-1', name: 'Ada Obi', phone: '08010000000' },
    creditApproval: { approverId: 'manager-1', approverRole: 'manager' },
    occurredAt: saleTime,
  })
}

describe('returns, corrections and reversals', () => {
  it('applies an ordinary correction inside the configurable window without changing the original sale', () => {
    const { integrity, sales } = setup()
    const sale = completeCashSale(sales)
    const correction = integrity.correctSale({
      businessId: 'b1',
      saleId: sale.id,
      clientEventId: 'correction-1',
      actorId: 'staff-1',
      actorRole: 'staff',
      reason: 'Fix receipt note typo',
      occurredAt: '2026-09-06T09:10:00.000Z',
      change: { field: 'note', correctedValue: 'Customer requested receipt' },
    })

    expect(correction.state).toBe('applied')
    expect(correction.severity).toBe('ordinary')
    expect(correction.original.actorId).toBe('staff-1')
    expect(correction.corrected?.note).toBe('Customer requested receipt')
    expect(sales.getSale('b1', sale.id)?.totalDueKobo).toBe(2000)
    expect(integrity.listAuditEvents()).toHaveLength(1)
  })

  it('blocks ordinary staff correction outside the 15-minute default but permits controlled management correction', () => {
    const { integrity, sales } = setup()
    const sale = completeCashSale(sales)
    const outside = '2026-09-06T09:16:00.000Z'

    expect(() =>
      integrity.correctSale({
        businessId: 'b1',
        saleId: sale.id,
        clientEventId: 'correction-late-staff',
        actorId: 'staff-1',
        actorRole: 'staff',
        reason: 'Late typo',
        occurredAt: outside,
        change: { field: 'note', correctedValue: 'Late correction' },
      }),
    ).toThrowError(IntegrityError)

    const correction = integrity.correctSale({
      businessId: 'b1',
      saleId: sale.id,
      clientEventId: 'correction-late-manager',
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'Late typo',
      occurredAt: outside,
      change: { field: 'note', correctedValue: 'Late correction' },
    })
    expect(correction.state).toBe('applied')
    expect(correction.windowExpired).toBe(true)
  })

  it('rejects unauthorized material correction without financial or inventory effects', () => {
    const { integrity, inventory, sales } = setup()
    const sale = completeCashSale(sales)

    expect(() =>
      integrity.correctSale({
        businessId: 'b1',
        saleId: sale.id,
        clientEventId: 'correction-unauthorized',
        actorId: 'staff-1',
        actorRole: 'staff',
        reason: 'Wrong quantity',
        occurredAt: '2026-09-06T09:05:00.000Z',
        change: {
          field: 'quantity',
          lineId: 'line-1',
          productId: 'p1',
          correctedQuantity: 1,
          correctedPayments: [
            { id: 'pay-1', amountKobo: 1000, method: 'cash' },
          ] satisfies PaymentCorrection[],
        },
      }),
    ).toThrowError(/management authorization/i)
    expect(inventory.getStock('p1').sellable).toBe(8000n)
    expect(integrity.listAuditEvents()).toHaveLength(0)
  })

  it('applies a material correction as an additive event and recalculates inventory, finance and reporting', () => {
    const { integrity, inventory, sales } = setup()
    const sale = completeCashSale(sales)

    const correction = integrity.correctSale({
      businessId: 'b1',
      saleId: sale.id,
      clientEventId: 'correction-material',
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'Customer bought one, not two',
      approval: { approverId: 'owner-1', approverRole: 'owner' },
      occurredAt: '2026-09-06T09:05:00.000Z',
      change: {
        field: 'quantity',
        lineId: 'line-1',
        productId: 'p1',
        correctedQuantity: 1,
        correctedPayments: [
          { id: 'pay-1', amountKobo: 1000, method: 'cash' },
        ] satisfies PaymentCorrection[],
      },
    })

    expect(correction.severity).toBe('material')
    expect(correction.state).toBe('applied')
    expect(inventory.getStock('p1').sellable).toBe(9000n)
    expect(correction.financialEffect?.totalDueKobo).toBe(-1000)
    expect(integrity.getReportingSnapshot('b1').totalDueKobo).toBe(1000)
    expect(sales.getSale('b1', sale.id)?.totalDueKobo).toBe(2000)
  })

  it('flags consequential Manager self-correction for Owner review', () => {
    const { integrity, sales } = setup()
    const sale = completeCashSale(sales, 'manager-1')

    const correction = integrity.correctSale({
      businessId: 'b1',
      saleId: sale.id,
      clientEventId: 'correction-manager-self',
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'Wrong quantity on my sale',
      approval: { approverId: 'owner-1', approverRole: 'owner' },
      occurredAt: '2026-09-06T09:05:00.000Z',
      change: {
        field: 'quantity',
        lineId: 'line-1',
        productId: 'p1',
        correctedQuantity: 1,
        correctedPayments: [
          { id: 'pay-1', amountKobo: 1000, method: 'cash' },
        ] satisfies PaymentCorrection[],
      },
    })

    expect(correction.ownerReviewRequired).toBe(true)
    expect(integrity.listOwnerReviewRequired('b1')).toHaveLength(1)
  })

  it('requires Owner authority for high-integrity customer identity correction', () => {
    const { integrity, sales } = setup()
    const sale = completeCashSale(sales)
    const input = {
      businessId: 'b1',
      saleId: sale.id,
      clientEventId: 'correction-identity',
      actorId: 'manager-1',
      actorRole: 'manager' as const,
      reason: 'Customer linked to the wrong profile',
      occurredAt: '2026-09-06T09:05:00.000Z',
      change: {
        field: 'customer_identity' as const,
        customerId: 'customer-2',
        customerName: 'Bola Ade',
        customerPhone: '08020000000',
      },
    }

    expect(() =>
      integrity.correctSale({
        ...input,
        approval: { approverId: 'manager-2', approverRole: 'manager' },
      }),
    ).toThrowError(/Owner/i)

    const correction = integrity.correctSale({
      ...input,
      actorId: 'owner-1',
      actorRole: 'owner',
    })
    expect(correction.severity).toBe('high_integrity')
    expect(correction.corrected?.customer?.name).toBe('Bola Ade')
  })

  it('records an approved return and keeps refund settlement separate', () => {
    const { integrity, inventory, sales } = setup()
    const sale = completeCashSale(sales)
    integrity.requestReturn({
      businessId: 'b1',
      saleId: sale.id,
      returnId: 'return-1',
      clientEventId: 'return-event-1',
      requestedById: 'staff-1',
      requestedByRole: 'staff',
      reason: 'Wrong part',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
      occurredAt: '2026-09-06T10:00:00.000Z',
    })

    integrity.verifyReturn('b1', 'return-1', 'manager-1', 'manager')
    integrity.approveReturn('b1', 'return-1', 'manager-1', 'manager', {
      condition: 'sellable',
    })
    const applied = integrity.applyReturn(
      'b1',
      'return-1',
      'manager-1',
      'manager',
    )

    expect(applied.state).toBe('applied')
    expect(applied.refund?.state).toBe('due')
    expect(applied.refund?.amountKobo).toBe(1000)
    expect(inventory.getStock('p1').sellable).toBe(9000n)
    expect(integrity.getReportingSnapshot('b1').totalDueKobo).toBe(1000)

    const settled = integrity.settleRefund('b1', 'return-1', 'manager-1', {
      method: 'cash',
      externalReference: 'till-refund-1',
    })
    expect(settled.refund?.state).toBe('settled')
    expect(settled.refund?.settledAt).toBeDefined()
  })

  it('rejects unauthorized return approval without changing the return state', () => {
    const { integrity, sales } = setup()
    const sale = completeCashSale(sales)
    integrity.requestReturn({
      businessId: 'b1',
      saleId: sale.id,
      returnId: 'return-1',
      clientEventId: 'return-event-1',
      requestedById: 'staff-1',
      requestedByRole: 'staff',
      reason: 'Wrong part',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
    })
    integrity.verifyReturn('b1', 'return-1', 'manager-1', 'manager')

    expect(() =>
      integrity.approveReturn('b1', 'return-1', 'staff-1', 'staff', {
        condition: 'sellable',
      }),
    ).toThrowError(/Manager or Owner/i)
    expect(integrity.getReturn('b1', 'return-1')?.state).toBe('verified')
  })

  it('reduces credit from an approved return and preserves the credit history', () => {
    const { credit, integrity, sales } = setup()
    const sale = completeCreditSale(sales, credit)
    integrity.requestReturn({
      businessId: 'b1',
      saleId: sale.id,
      returnId: 'return-credit-1',
      clientEventId: 'return-event-credit-1',
      requestedById: 'staff-1',
      requestedByRole: 'staff',
      reason: 'Customer returned one unit',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
      debtId: 'debt-1',
      customerId: 'customer-1',
    })
    integrity.verifyReturn('b1', 'return-credit-1', 'manager-1', 'manager')
    integrity.approveReturn('b1', 'return-credit-1', 'manager-1', 'manager', {
      condition: 'sellable',
    })
    const applied = integrity.applyReturn(
      'b1',
      'return-credit-1',
      'manager-1',
      'manager',
    )

    expect(applied.creditEffect?.resultingOutstandingKobo).toBe(1000)
    expect(credit.getOutstandingForCustomer('b1', 'customer-1').minor).toBe(
      1000n,
    )
    expect(
      credit
        .listHistory('b1', 'customer-1')
        .some((event) => event.type === 'credit.return.recorded'),
    ).toBe(true)
  })

  it('blocks material correction after a dependent return event', () => {
    const { integrity, sales } = setup()
    const sale = completeCashSale(sales)
    integrity.requestReturn({
      businessId: 'b1',
      saleId: sale.id,
      returnId: 'return-1',
      clientEventId: 'return-event-1',
      requestedById: 'staff-1',
      requestedByRole: 'staff',
      reason: 'Wrong part',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
    })
    integrity.verifyReturn('b1', 'return-1', 'manager-1', 'manager')
    integrity.approveReturn('b1', 'return-1', 'manager-1', 'manager', {
      condition: 'sellable',
    })
    integrity.applyReturn('b1', 'return-1', 'manager-1', 'manager')

    expect(() =>
      integrity.correctSale({
        businessId: 'b1',
        saleId: sale.id,
        clientEventId: 'correction-after-return',
        actorId: 'owner-1',
        actorRole: 'owner',
        reason: 'Change quantity after return',
        occurredAt: '2026-09-06T11:00:00.000Z',
        change: {
          field: 'quantity',
          lineId: 'line-1',
          productId: 'p1',
          correctedQuantity: 1,
          correctedPayments: [
            { id: 'pay-1', amountKobo: 1000, method: 'cash' },
          ] satisfies PaymentCorrection[],
        },
      }),
    ).toThrowError(/dependent/i)
  })

  it('is idempotent for duplicate correction requests and offline retry delivery', () => {
    const { integrity, inventory, sales } = setup()
    const sale = completeCashSale(sales)
    const input = {
      businessId: 'b1',
      saleId: sale.id,
      clientEventId: 'correction-offline-1',
      actorId: 'owner-1',
      actorRole: 'owner' as const,
      reason: 'Wrong quantity',
      occurredAt: '2026-09-06T09:05:00.000Z',
      isOffline: true,
      change: {
        field: 'quantity' as const,
        lineId: 'line-1',
        productId: 'p1',
        correctedQuantity: 1,
        correctedPayments: [
          { id: 'pay-1', amountKobo: 1000, method: 'cash' as const },
        ],
      },
    }

    const first = integrity.correctSale(input)
    const retry = integrity.correctSale(input)
    expect(retry.id).toBe(first.id)
    expect(
      inventory.listEvents('p1').filter((event) => event.type === 'adjustment'),
    ).toHaveLength(1)
    expect(first.syncState).toBe('local_only')

    integrity.queueSync('b1', 'correction-offline-1')
    integrity.acceptSync('b1', 'correction-offline-1')
    const accepted = integrity.getCorrection('b1', 'correction-offline-1')
    expect(accepted?.syncState).toBe('accepted')
    expect(integrity.correctSale(input).syncState).toBe('accepted')
  })

  it('records a controlled reversal without deleting sale history', () => {
    const { integrity, inventory, sales } = setup()
    const sale = completeCashSale(sales)
    const reversal = integrity.reverseSale({
      businessId: 'b1',
      saleId: sale.id,
      clientEventId: 'reversal-1',
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'Duplicate sale',
      occurredAt: '2026-09-06T09:05:00.000Z',
      approval: { approverId: 'owner-1', approverRole: 'owner' },
    })

    expect(reversal.state).toBe('applied')
    expect(reversal.severity).toBe('material')
    expect(sales.getSale('b1', sale.id)?.reversedAt).toBeDefined()
    expect(
      inventory
        .listEvents('p1')
        .filter((event) => event.type === 'customer_return'),
    ).toHaveLength(1)
    expect(integrity.getReportingSnapshot('b1').totalDueKobo).toBe(0)
  })
})
