import { describe, expect, it } from 'vitest'
import { CatalogPricing } from './catalogPricing'
import { CashReconciliationEngine } from './cashReconciliation'
import {
  CustomersCreditEngine,
  CustomersCreditError,
  type RepaymentComponent,
} from './customersCredit'
import {
  calculateSaleFinancials,
  money,
  quantity,
  taxFromNet,
  taxFromTotal,
  weightedAverageUnitCost,
} from './finance'
import { InventoryEngine, quantity as inventoryQuantity } from './inventory'
import { IntegrityError, ReturnsCorrectionsEngine } from './returnsCorrections'
import {
  SalesError,
  SalesTransactionEngine,
  type PaymentComponent,
} from './sales'
import {
  canApprove,
  canCompleteSale,
  IllegalTransitionError,
  transition,
} from './stateMachines'

const confirmedCash = (id: string, amountKobo: number): PaymentComponent => ({
  id,
  method: 'cash',
  amountKobo,
  confirmation: { state: 'confirmed_success', confirmedBy: 'cashier' },
})

const confirmedTransfer = (
  id: string,
  amountKobo: number,
): PaymentComponent => ({
  id,
  method: 'bank_transfer',
  amountKobo,
  confirmation: { state: 'confirmed_success', confirmedBy: 'manager-1' },
})

function setup() {
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
    actorId: 'owner-1',
    reason: 'opening stock',
    clientEventId: 'receipt-1',
  })

  const sales = new SalesTransactionEngine(pricing, inventory)
  const credit = new CustomersCreditEngine()
  const integrity = new ReturnsCorrectionsEngine({ sales, inventory, credit })
  const cash = new CashReconciliationEngine()

  return { pricing, inventory, sales, credit, integrity, cash }
}

function completeCashSale(
  sales: SalesTransactionEngine,
  overrides: Record<string, unknown> = {},
) {
  return sales.complete({
    businessId: 'b1',
    id: 'sale-1',
    clientRequestId: 'sale-request-1',
    actorId: 'staff-1',
    actorRole: 'staff',
    lines: [{ id: 'line-1', productId: 'p1', quantity: 2 }],
    payments: [confirmedCash('pay-1', 2000)],
    occurredAt: '2026-09-09T09:00:00.000Z',
    ...overrides,
  } as Parameters<SalesTransactionEngine['complete']>[0])
}

describe('Sabi Shop domain verification', () => {
  it('INV-SALE/PAY/SYNC: separates completion, payment and synchronization states', () => {
    expect(
      canCompleteSale({
        hasItems: true,
        hasConfirmedPayment: false,
        authorization: 'not_required',
      }),
    ).toBe(false)
    expect(
      canCompleteSale({
        hasItems: true,
        hasConfirmedPayment: true,
        authorization: 'requested',
      }),
    ).toBe(false)
    expect(
      canCompleteSale({
        hasItems: true,
        hasConfirmedPayment: true,
        authorization: 'approved',
      }),
    ).toBe(true)

    expect(transition('payment', 'pending', 'confirm_success')).toBe(
      'confirmed_success',
    )
    expect(() => transition('sale', 'completed', 'complete')).toThrowError(
      IllegalTransitionError,
    )
    expect(() => transition('sale', 'failed', 'complete')).toThrowError(
      IllegalTransitionError,
    )
    expect(transition('sync', 'local_only', 'queue_sync')).toBe('pending_sync')
    expect(transition('sync', 'pending_sync', 'accept')).toBe('accepted')
  })

  it('INV-FIN/MONEY/INV-004: calculates exact tax, weighted average and gross profit', () => {
    expect(money('NGN', '10.005').minor).toBe(1001n)
    expect(taxFromNet(money('NGN', '123.45'), 750n).tax.minor).toBe(926n)
    expect(taxFromTotal(money('NGN', '132.71'), 750n).tax.minor).toBe(926n)
    expect(
      weightedAverageUnitCost({
        quantity: quantity('2.5'),
        cost: money('NGN', '400.00'),
      }).minor,
    ).toBe(16000n)

    const inventory = {
      quantity: quantity('2'),
      cost: money('NGN', '8.00'),
    }
    const exclusive = calculateSaleFinancials({
      currency: 'NGN',
      unitSellingPrice: money('NGN', '10.00'),
      quantity: quantity('2'),
      approvedDiscount: money('NGN', '1.00'),
      taxRateBasisPoints: 750n,
      taxMode: 'exclusive',
      inventory,
    })
    expect(exclusive.netRecognizedSellingValue.minor).toBe(1900n)
    expect(exclusive.tax.minor).toBe(143n)
    expect(exclusive.totalDue.minor).toBe(2043n)
    expect(exclusive.cogs.minor).toBe(800n)
    expect(exclusive.grossProfit.minor).toBe(1100n)

    const inclusive = calculateSaleFinancials({
      currency: 'NGN',
      unitSellingPrice: money('NGN', '10.00'),
      quantity: quantity('2'),
      approvedDiscount: money('NGN', '1.00'),
      taxRateBasisPoints: 750n,
      taxMode: 'inclusive',
      inventory,
    })
    expect(inclusive.netRecognizedSellingValue.minor).toBe(1900n)
    expect(inclusive.tax.minor).toBe(133n)
    expect(inclusive.totalDue.minor).toBe(1900n)
    expect(inclusive.grossProfit.minor).toBe(1100n)
  })

  it('INV-INV-001..004: derives stock from movements and preserves historical COGS', () => {
    const inventory = new InventoryEngine()
    const receiptOne = inventory.receive({
      businessId: 'b1',
      productId: 'p1',
      quantity: inventoryQuantity(2),
      unitCost: 100n,
      actorId: 'manager-1',
      reason: 'receipt one',
      clientEventId: 'receipt-one',
    })
    inventory.receive({
      businessId: 'b1',
      productId: 'p1',
      quantity: inventoryQuantity(3),
      unitCost: 200n,
      actorId: 'manager-1',
      reason: 'receipt two',
      clientEventId: 'receipt-two',
    })
    expect(inventory.getValuation('p1').weightedAverageCost).toBe(160n)

    const negativeSale = inventory.sell({
      businessId: 'b1',
      productId: 'p1',
      quantity: inventoryQuantity(7),
      actorId: 'staff-1',
      reason: 'delayed receiving',
      clientEventId: 'sale-negative',
      saleId: 'sale-negative',
      unitPrice: 500n,
    }).event
    expect(negativeSale.cogs).toBe(800n)
    expect(negativeSale.provisionalQuantity).toBe(2000n)
    expect(inventory.getStock('p1')).toMatchObject({
      sellable: -2000n,
      negative: true,
      exception: 'negative_stock',
    })
    expect(inventory.getValuation('p1').provisionalQuantity).toBe(2000n)

    const laterReceipt = inventory.receive({
      businessId: 'b1',
      productId: 'p1',
      quantity: inventoryQuantity(5),
      unitCost: 300n,
      actorId: 'manager-1',
      reason: 'late receipt',
      clientEventId: 'receipt-three',
    })
    expect(laterReceipt.quantity).toBe(5000n)
    expect(inventory.getStock('p1').sellable).toBe(3000n)
    expect(inventory.getValuation('p1').weightedAverageCost).toBe(230n)

    const laterSale = inventory.sell({
      businessId: 'b1',
      productId: 'p1',
      quantity: inventoryQuantity(1),
      actorId: 'staff-1',
      reason: 'sale after receipt',
      clientEventId: 'sale-later',
      saleId: 'sale-later',
      unitPrice: 500n,
    }).event
    expect(laterSale.cogs).toBe(230n)
    expect(
      inventory.listEvents('p1').find((event) => event.id === negativeSale.id)
        ?.cogs,
    ).toBe(800n)
    expect(inventory.reconstruct('p1', negativeSale.sequence).sellable).toBe(
      -2000n,
    )
    expect(inventory.listEvents('p1').at(0)?.id).toBe(receiptOne.id)
  })

  it('INV-GLOBAL-004/SALE-001/PAY-001..002: failed payment completion leaves no domain effect', () => {
    const { pricing, inventory, sales } = setup()
    const before = inventory.getStock('p1').sellable

    expect(() =>
      sales.complete({
        businessId: 'b1',
        id: 'sale-1',
        clientRequestId: 'sale-request-1',
        actorId: 'staff-1',
        actorRole: 'staff',
        lines: [
          { id: 'line-1', productId: 'p1', quantity: 2 },
          { id: 'line-2', productId: 'p1', quantity: 1 },
        ],
        payments: [{ id: 'pay-1', method: 'bank_transfer', amountKobo: 3000 }],
      }),
    ).toThrowError(SalesError)

    expect(sales.getSale('b1', 'sale-1')).toBeUndefined()
    expect(sales.listAudits()).toHaveLength(0)
    expect(sales.listReports()).toHaveLength(0)
    expect(inventory.getStock('p1').sellable).toBe(before)
    expect(() => pricing.getIncentivePricingFacts('line-1')).toThrowError(
      /not found/i,
    )

    const sale = completeCashSale(sales)
    expect(sale.state).toBe('completed')
    expect(sales.listAudits()).toHaveLength(1)
    expect(sales.listReports()).toHaveLength(1)
  })

  it('INV-SALE-002/SYNC-003: duplicate sale and correction submissions create one effect', () => {
    const { inventory, integrity, sales } = setup()
    const sale = completeCashSale(sales)
    const retry = completeCashSale(sales)
    expect(retry.id).toBe(sale.id)
    expect(inventory.listEvents('p1')).toHaveLength(2)
    expect(sales.listAudits()).toHaveLength(1)
    expect(sales.listReports()).toHaveLength(1)

    const correction = integrity.correctSale({
      businessId: 'b1',
      saleId: sale.id,
      clientEventId: 'correction-1',
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'customer returned one unit immediately',
      approval: { approverId: 'owner-1', approverRole: 'owner' },
      change: {
        field: 'quantity',
        lineId: 'line-1',
        productId: 'p1',
        correctedQuantity: 1,
      },
    })
    const correctionRetry = integrity.correctSale({
      businessId: 'b1',
      saleId: sale.id,
      clientEventId: 'correction-1',
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'duplicate delivery',
      approval: { approverId: 'owner-1', approverRole: 'owner' },
      change: {
        field: 'quantity',
        lineId: 'line-1',
        productId: 'p1',
        correctedQuantity: 1,
      },
    })
    expect(correctionRetry.id).toBe(correction.id)
    expect(
      inventory.listEvents('p1').filter((event) => event.type === 'adjustment'),
    ).toHaveLength(1)
    expect(integrity.listAuditEvents()).toHaveLength(1)
  })

  it('INV-CREDIT-001..003: creates debt only from approved events and tracks reductions separately', () => {
    const credit = new CustomersCreditEngine()
    credit.createCustomer({
      businessId: 'b1',
      id: 'customer-1',
      name: 'Ada Obi',
      phone: '08010000000',
      creditStatus: 'allowed',
      actorId: 'staff-1',
    })

    expect(() =>
      credit.recordCreditSale({
        businessId: 'b1',
        customerId: 'customer-1',
        debtId: 'debt-1',
        saleId: 'sale-1',
        amountMinor: 2000n,
        actorId: 'staff-1',
        actorRole: 'staff',
        clientEventId: 'credit-sale-invalid',
        creditApproval: { approverId: 'staff-1', approverRole: 'staff' },
      }),
    ).toThrowError(CustomersCreditError)
    expect(credit.getOutstandingForCustomer('b1', 'customer-1').minor).toBe(0n)

    const obligation = credit.recordCreditSale({
      businessId: 'b1',
      customerId: 'customer-1',
      debtId: 'debt-1',
      saleId: 'sale-1',
      amountMinor: 2000n,
      actorId: 'staff-1',
      actorRole: 'staff',
      clientEventId: 'credit-sale-1',
      creditApproval: { approverId: 'manager-1', approverRole: 'manager' },
    })
    expect(obligation.type).toBe('credit.sale.recorded')
    expect(credit.getOutstandingForCustomer('b1', 'customer-1').minor).toBe(
      2000n,
    )

    const repaymentComponent: RepaymentComponent = {
      method: 'cash',
      amountMinor: 800n,
      confirmation: { state: 'confirmed_success', confirmedBy: 'staff-1' },
    }
    credit.recordRepayment({
      businessId: 'b1',
      customerId: 'customer-1',
      repaymentId: 'repayment-1',
      actorId: 'staff-1',
      actorRole: 'staff',
      clientEventId: 'repayment-event-1',
      components: [repaymentComponent],
      allocations: [{ debtId: 'debt-1', amountMinor: 800n }],
    })
    expect(credit.getOutstandingForCustomer('b1', 'customer-1').minor).toBe(
      1200n,
    )

    credit.recordApprovedReturn({
      businessId: 'b1',
      customerId: 'customer-1',
      debtId: 'debt-1',
      amountMinor: 500n,
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'approved damaged goods return',
      clientEventId: 'credit-return-1',
    })
    expect(credit.getOutstandingForCustomer('b1', 'customer-1').minor).toBe(
      700n,
    )

    credit.recordWriteOff({
      businessId: 'b1',
      customerId: 'customer-1',
      debtId: 'debt-1',
      amountMinor: 700n,
      actorId: 'owner-1',
      actorRole: 'owner',
      reason: 'management-approved forgiveness',
      clientEventId: 'write-off-1',
    })
    const debt = credit.getDebt('b1', 'customer-1', 'debt-1')
    expect(debt?.outstandingMinor).toBe(0n)
    expect(debt?.state).toBe('written_off')
    expect(
      credit.listHistory('b1', 'customer-1').map((event) => event.type),
    ).toEqual([
      'customer.created',
      'credit.sale.recorded',
      'credit.repayment.recorded',
      'credit.return.recorded',
      'credit.write_off.recorded',
    ])
  })

  it('INV-RETURN-001..003: links approved returns to original sales and keeps refunds separate', () => {
    const { inventory, integrity, sales } = setup()
    const sale = completeCashSale(sales)

    integrity.requestReturn({
      businessId: 'b1',
      saleId: sale.id,
      returnId: 'return-1',
      clientEventId: 'return-request-1',
      requestedById: 'staff-1',
      requestedByRole: 'staff',
      reason: 'wrong fitting',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
    })
    integrity.verifyReturn('b1', 'return-1', 'manager-1', 'manager')
    integrity.approveReturn('b1', 'return-1', 'owner-1', 'owner', {
      condition: 'held',
    })
    const applied = integrity.applyReturn(
      'b1',
      'return-1',
      'manager-1',
      'manager',
    )

    expect(applied.state).toBe('applied')
    expect(applied.saleId).toBe(sale.id)
    expect(applied.refund).toMatchObject({ state: 'due', amountKobo: 1000 })
    expect(inventory.getStock('p1')).toMatchObject({
      sellable: 8000n,
      held: 1000n,
      total: 9000n,
    })
    expect(sales.getSale('b1', sale.id)?.totalDueKobo).toBe(2000)
    expect(integrity.listReportEvents('b1')[0].totalDueKobo).toBe(-1000)

    const settled = integrity.settleRefund('b1', 'return-1', 'manager-1', {
      method: 'cash',
    })
    expect(settled.state).toBe('settled')
    expect(settled.refund).toMatchObject({ state: 'settled' })

    const audit = integrity
      .listAuditEvents()
      .find((event) => event.type === 'sale.return.applied')
    expect(audit?.original.saleId).toBe(sale.id)
    expect(audit?.downstream.inventoryEventIds).toEqual(
      applied.inventoryEventIds,
    )
    expect(audit?.downstream.reportEventId).toBe(applied.reportEventId)
    expect(
      inventory
        .listEvents('p1')
        .find((event) => event.id === applied.inventoryEventIds[0])
        ?.referenceId,
    ).toBe(sale.id)

    integrity.requestReturn({
      businessId: 'b1',
      saleId: sale.id,
      returnId: 'return-2',
      clientEventId: 'return-request-2',
      requestedById: 'staff-1',
      requestedByRole: 'staff',
      reason: 'customer changed mind',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
    })
    const decision = integrity.rejectReturn(
      'b1',
      'return-2',
      'owner-1',
      'owner',
    )
    expect(decision.state).toBe('rejected')
    expect(integrity.getReturn('b1', 'return-2')?.state).toBe('rejected')
    expect(inventory.getStock('p1').total).toBe(9000n)
    expect(integrity.listReportEvents('b1')).toHaveLength(1)
  })

  it('INV-CORR-001..003/GLOBAL-003: preserves correction lineage and downstream relationships', () => {
    const { inventory, integrity, sales } = setup()
    const sale = completeCashSale(sales)

    expect(() =>
      integrity.correctSale({
        businessId: 'b1',
        saleId: sale.id,
        clientEventId: 'correction-unauthorized',
        actorId: 'staff-2',
        actorRole: 'staff',
        reason: 'staff attempted material correction',
        change: {
          field: 'quantity',
          lineId: 'line-1',
          productId: 'p1',
          correctedQuantity: 1,
        },
      }),
    ).toThrowError(IntegrityError)
    expect(inventory.getStock('p1').sellable).toBe(8000n)

    const correction = integrity.correctSale({
      businessId: 'b1',
      saleId: sale.id,
      clientEventId: 'correction-1',
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'quantity entered twice',
      approval: { approverId: 'owner-1', approverRole: 'owner' },
      change: {
        field: 'quantity',
        lineId: 'line-1',
        productId: 'p1',
        correctedQuantity: 1,
      },
    })

    expect(correction.state).toBe('applied')
    expect(correction.original.lines[0]?.quantity).toBe(2)
    expect(correction.corrected?.lines[0]?.quantity).toBe(1)
    expect(correction.financialEffect).toMatchObject({
      totalDueKobo: -1000,
      cogsKobo: -400,
      grossProfitKobo: -600,
    })
    expect(inventory.getStock('p1').sellable).toBe(9000n)
    expect(
      inventory
        .listEvents('p1')
        .find(
          (event) => event.id === correction.downstream.inventoryEventIds[0],
        )?.type,
    ).toBe('adjustment')

    const audit = integrity
      .listAuditEvents()
      .find((event) => event.clientEventId === correction.clientEventId)
    expect(audit?.original.saleId).toBe(sale.id)
    expect(audit?.corrected?.lines[0]?.quantity).toBe(1)
    expect(audit?.downstream.reportEventId).toBe(
      correction.downstream.reportEventId,
    )
    expect(sales.getSale('b1', sale.id)?.lines[0]?.quantity).toBe(2)
  })

  it('INV-CASH-001..004/DAY-001..002: derives and investigates cash without rewriting sources', () => {
    const { cash, sales } = setup()
    cash.openBusinessDay({
      businessId: 'b1',
      sessionId: 'day-1',
      custodyMode: 'shared_drawer',
      actorId: 'staff-1',
      actorRole: 'staff',
    })
    cash.enterOpeningCash('b1', 'day-1', 10000, 'staff-1', 'staff')
    cash.confirmOpeningCash('b1', 'day-1', 10000, 'manager-1', 'manager')

    const splitSale = sales.complete({
      businessId: 'b1',
      id: 'sale-split',
      clientRequestId: 'request-split',
      actorId: 'staff-1',
      actorRole: 'staff',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 2 }],
      payments: [
        confirmedCash('cash-pay', 500),
        confirmedTransfer('transfer-pay', 1500),
      ],
    })
    expect(splitSale.cashKobo).toBe(500)
    expect(splitSale.nonCashKobo).toBe(1500)

    cash.recordCashEvent({
      businessId: 'b1',
      sessionId: 'day-1',
      id: 'cash-sale-1',
      kind: 'cash_sale',
      amountKobo: 500,
      actorId: 'staff-1',
      actorRole: 'staff',
      reason: 'cash component of completed sale',
      occurredAt: '2026-09-10T01:00:00.000Z',
    })
    expect(cash.getSnapshot('b1', 'day-1').state).toBe('open_session')
    cash.recordCashEvent({
      businessId: 'b1',
      sessionId: 'day-1',
      id: 'cash-in-1',
      kind: 'cash_in',
      amountKobo: 1000,
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'change float',
    })
    cash.recordCashEvent({
      businessId: 'b1',
      sessionId: 'day-1',
      id: 'cash-out-1',
      kind: 'cash_out',
      amountKobo: 250,
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'transport',
    })
    cash.recordCashEvent({
      businessId: 'b1',
      sessionId: 'day-1',
      id: 'cash-refund-1',
      kind: 'cash_refund',
      amountKobo: 125,
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'refund paid from till',
    })

    expect(cash.getSnapshot('b1', 'day-1').expectedCashKobo).toBe(11125)
    cash.recordActualCash('b1', 'day-1', 11000, 'staff-1', 'staff')
    const counted = cash.getSnapshot('b1', 'day-1')
    expect(counted.cashVarianceKobo).toBe(-125)
    expect(counted.unresolved).toBe(false)

    const prepared = cash.prepareReconciliation(
      'b1',
      'day-1',
      'manager-1',
      'manager',
    )
    expect(prepared.unresolved).toBe(true)
    expect(prepared.discrepancyStatus).toBe('unresolved')
    cash.confirmManagementReconciliation('b1', 'day-1', 'manager-1', 'manager')
    const closed = cash.closeBusinessDay('b1', 'day-1', 'manager-1', 'manager')
    expect(closed.state).toBe('closed')
    expect(closed.expectedCashKobo).toBe(11125)
    expect(closed.actualCashKobo).toBe(11000)

    const reopened = cash.reopenBusinessDay(
      'b1',
      'day-1',
      'owner-1',
      'owner',
      'recount requested',
    )
    expect(reopened.state).toBe('reopened')
    expect(cash.listEvents('b1', 'day-1')).toHaveLength(4)
    expect(cash.listAudits('b1').map((event) => event.type)).toContain(
      'business_day.reopened',
    )
    expect(cash.getSnapshot('b1', 'day-1').unresolved).toBe(true)
  })

  it('INV-TENANT-001/AUDIT-001: keeps business scope and attribution on authoritative records', () => {
    const { cash, credit, integrity, sales } = setup()
    const b1Sale = completeCashSale(sales)
    const b2Sale = sales.complete({
      businessId: 'b2',
      id: 'sale-1',
      clientRequestId: 'sale-request-1',
      actorId: 'staff-b2',
      actorRole: 'staff',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 1 }],
      payments: [confirmedCash('pay-1', 1000)],
    })

    expect(sales.getSale('b1', b1Sale.id)?.businessId).toBe('b1')
    expect(sales.getSale('b2', b2Sale.id)?.businessId).toBe('b2')
    expect(sales.getSale('b2', 'sale-not-in-b2')).toBeUndefined()
    expect(sales.listReports().every((event) => event.businessId !== '')).toBe(
      true,
    )

    credit.createCustomer({
      businessId: 'b1',
      id: 'customer-1',
      name: 'Ada Obi',
      phone: '08010000000',
      creditStatus: 'allowed',
      actorId: 'staff-1',
    })
    credit.createCustomer({
      businessId: 'b2',
      id: 'customer-1',
      name: 'Bola Ade',
      phone: '08020000000',
      creditStatus: 'allowed',
      actorId: 'staff-b2',
    })
    expect(credit.getCustomer('b1', 'customer-1')?.name).toBe('Ada Obi')
    expect(credit.getCustomer('b2', 'customer-1')?.name).toBe('Bola Ade')
    expect(credit.getCustomer('b3', 'customer-1')).toBeUndefined()

    cash.openBusinessDay({
      businessId: 'b1',
      sessionId: 'day-1',
      custodyMode: 'shared_drawer',
      actorId: 'staff-1',
      actorRole: 'staff',
    })
    expect(() => cash.getSnapshot('b2', 'day-1')).toThrowError(/not found/i)
    expect(integrity.getReturn('b2', 'missing-return')).toBeUndefined()

    const saleAudit = sales
      .listAudits()
      .find((event) => event.saleId === 'sale-1')
    expect(saleAudit?.businessId).toBe('b1')
    expect(saleAudit?.actorId).toBe('staff-1')
  })

  it('INV-GLOBAL-004/CORR-003/TENANT-001: denies unauthorized consequential operations without effects', () => {
    const { cash, integrity, inventory, sales } = setup()
    const sale = completeCashSale(sales)

    expect(() => sales.reverse('b1', sale.id, 'staff-1', 'staff')).toThrowError(
      SalesError,
    )
    expect(sales.getSale('b1', sale.id)?.reversedAt).toBeUndefined()
    expect(inventory.listEvents('p1')).toHaveLength(2)

    const requested = integrity.requestReturn({
      businessId: 'b1',
      saleId: sale.id,
      returnId: 'return-1',
      clientEventId: 'return-request-1',
      requestedById: 'staff-1',
      requestedByRole: 'staff',
      reason: 'staff request',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
    })
    expect(() =>
      integrity.approveReturn('b1', 'return-1', 'staff-2', 'staff', {
        condition: 'sellable',
      }),
    ).toThrowError(IntegrityError)
    expect(integrity.getReturn('b1', 'return-1')?.state).toBe('requested')
    expect(requested.inventoryEventIds).toHaveLength(0)

    cash.openBusinessDay({
      businessId: 'b1',
      sessionId: 'day-1',
      custodyMode: 'shared_drawer',
      actorId: 'staff-1',
      actorRole: 'staff',
    })
    cash.enterOpeningCash('b1', 'day-1', 1000, 'staff-1', 'staff')
    cash.confirmOpeningCash('b1', 'day-1', 1000, 'manager-1', 'manager')
    cash.recordActualCash('b1', 'day-1', 1000, 'staff-1', 'staff')
    expect(() =>
      cash.closeBusinessDay('b1', 'day-1', 'staff-1', 'staff'),
    ).toThrowError(/management/i)
    expect(cash.getSnapshot('b1', 'day-1').state).toBe('count_recorded')

    expect(canApprove('manager', 'manager', 'manager-1', 'manager-1')).toBe(
      false,
    )
    expect(canApprove('staff', 'owner', 'staff-1', 'owner-1')).toBe(true)
  })
})
