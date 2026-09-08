import { describe, expect, it } from 'vitest'
import { CanonicalReporting } from './reporting'
import { CatalogPricing } from './domain/catalogPricing'
import { CustomersCreditEngine } from './domain/customersCredit'
import { InventoryEngine } from './domain/inventory'
import {
  ReturnsCorrectionsEngine,
  type IntegrityReportEvent,
} from './domain/returnsCorrections'
import { SalesTransactionEngine } from './domain/sales'
import type { CashReconciliationSnapshot } from './domain/cashReconciliation'

const payment = (amountKobo: number) => ({
  id: 'payment-1',
  method: 'cash' as const,
  amountKobo,
  confirmation: { state: 'confirmed_success' as const, confirmedBy: 'owner' },
})

describe('canonical reporting projections', () => {
  it('projects net selling value, tax, COGS, gross profit, payment mix and traceability', () => {
    const pricing = new CatalogPricing()
    pricing.createProduct({
      id: 'p1',
      sku: 'SKU-1',
      name: 'Pump',
      category: 'parts',
      unit: 'each',
      aliases: [],
      sellingPriceKobo: 1_000,
      priceFloorKobo: 800,
      active: true,
      availableForSale: true,
    })
    const inventory = new InventoryEngine()
    inventory.receive({
      businessId: 'b1',
      productId: 'p1',
      quantity: 10_000n,
      unitCost: 400n,
      actorId: 'owner',
      reason: 'opening',
      clientEventId: 'r1',
      occurredAt: '2026-01-01T08:00:00.000Z',
    })
    const sales = new SalesTransactionEngine(pricing, inventory)
    sales.complete({
      businessId: 'b1',
      id: 's1',
      clientRequestId: 'request-1',
      actorId: 'staff-1',
      actorRole: 'staff',
      lines: [
        {
          id: 'line-1',
          productId: 'p1',
          quantity: 2,
          discount: { kind: 'fixed', value: 100 },
        },
      ],
      payments: [payment(1_980)],
      taxRateBasisPoints: 1_000n,
      occurredAt: '2026-01-02T09:00:00.000Z',
    })
    const report = new CanonicalReporting({
      sales,
      inventory,
      incentivePolicy: {
        enabled: true,
        percentage: 10,
        minimumQualifyingCompletedSales: 1,
      },
    }).project('b1', {
      from: '2026-01-02T00:00:00.000Z',
      to: '2026-01-03T00:00:00.000Z',
    })

    expect(report.sales.netRecognizedSellingValueKobo).toBe(1_800)
    expect(report.sales.taxKobo).toBe(180)
    expect(report.sales.cogsKobo).toBe(800)
    expect(report.sales.grossProfitKobo).toBe(1_000)
    expect(report.sales.cashKobo).toBe(1_980)
    expect(report.inventory.remainingQuantity).toBe(8_000n)
    expect(report.inventory.valueKobo).toBe(3_200n)
    expect(report.staff[0].incentiveStatus).toBe('eligible')
    expect(
      report.traces.some((trace) => trace.sourceId === 'sale.completed:s1'),
    ).toBe(true)
  })

  it('keeps reversal effects additive and excludes events outside the explicit event-time period', () => {
    const pricing = new CatalogPricing()
    pricing.createProduct({
      id: 'p1',
      sku: 'SKU-1',
      name: 'Pump',
      category: 'parts',
      unit: 'each',
      aliases: [],
      sellingPriceKobo: 1_000,
      active: true,
      availableForSale: true,
    })
    const inventory = new InventoryEngine()
    const sales = new SalesTransactionEngine(pricing, inventory)
    sales.complete({
      businessId: 'b1',
      id: 's1',
      clientRequestId: 'request-1',
      actorId: 'staff-1',
      actorRole: 'staff',
      lines: [{ id: 'line-1', productId: 'p1', quantity: 1 }],
      payments: [payment(1_000)],
      occurredAt: '2026-01-02T09:00:00.000Z',
    })
    sales.reverse('b1', 's1', 'owner', 'owner')
    const saleDay = new CanonicalReporting({ sales, inventory }).project('b1', {
      from: '2026-01-02T00:00:00.000Z',
      to: '2026-01-03T00:00:00.000Z',
    })
    expect(saleDay.sales.netRecognizedSellingValueKobo).toBe(1_000)
    expect(saleDay.sales.sourceEventIds).toHaveLength(1)
    const lifetime = new CanonicalReporting({ sales, inventory }).project(
      'b1',
      { from: '2026-01-01T00:00:00.000Z', to: '2027-01-01T00:00:00.000Z' },
    )
    expect(lifetime.sales.netRecognizedSellingValueKobo).toBe(0)
    expect(lifetime.sales.sourceEventIds).toHaveLength(2)
    expect(lifetime.inventory.negativeStockProductIds).toEqual([])
  })

  it('recalculates salesperson incentive eligibility from applied returns, corrections, and reversals', () => {
    const pricing = new CatalogPricing()
    pricing.createProduct({
      id: 'p1',
      sku: 'SKU-1',
      name: 'Pump',
      category: 'parts',
      unit: 'each',
      aliases: [],
      sellingPriceKobo: 1_000,
      priceFloorKobo: 800,
      active: true,
      availableForSale: true,
    })
    // No explicit floor: the current selling price is the effective floor,
    // so selling at the normal price contributes zero eligible value (B13
    // section 16).
    pricing.createProduct({
      id: 'p2',
      sku: 'SKU-2',
      name: 'Hose',
      category: 'parts',
      unit: 'each',
      aliases: [],
      sellingPriceKobo: 1_000,
      active: true,
      availableForSale: true,
    })
    const inventory = new InventoryEngine()
    for (const productId of ['p1', 'p2']) {
      inventory.receive({
        businessId: 'b1',
        productId,
        quantity: 20_000n,
        unitCost: 400n,
        actorId: 'owner',
        reason: 'opening',
        clientEventId: `receipt-${productId}`,
        occurredAt: '2026-01-01T08:00:00.000Z',
      })
    }
    const sales = new SalesTransactionEngine(pricing, inventory)
    const credit = new CustomersCreditEngine()
    const returns = new ReturnsCorrectionsEngine({ sales, inventory, credit })

    const complete = (
      id: string,
      actorId: string,
      productId: string,
      quantity: number,
      occurredAt: string,
    ) =>
      sales.complete({
        businessId: 'b1',
        id,
        clientRequestId: `request-${id}`,
        actorId,
        actorRole: 'staff',
        lines: [{ id: 'line-1', productId, quantity }],
        payments: [payment(1_000 * quantity)],
        occurredAt,
      })

    complete('s1', 'staff-1', 'p1', 2, '2026-01-02T09:00:00.000Z')
    complete('s2', 'staff-1', 'p1', 1, '2026-01-02T10:00:00.000Z')
    complete('s3', 'staff-2', 'p1', 1, '2026-01-02T11:00:00.000Z')
    complete('s4', 'staff-1', 'p2', 1, '2026-01-02T12:00:00.000Z')

    // staff-2's only sale is fully returned: it must stop counting toward
    // the qualifying-sales volume gate and its eligible value must go to
    // zero (B13 sections 3 and 13).
    returns.requestReturn({
      businessId: 'b1',
      saleId: 's3',
      returnId: 'ret-full',
      clientEventId: 'return-full',
      requestedById: 'staff-2',
      requestedByRole: 'staff',
      reason: 'Customer returned the whole purchase',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
      occurredAt: '2026-01-02T13:00:00.000Z',
    })
    returns.verifyReturn('b1', 'ret-full', 'manager-1', 'manager')
    returns.approveReturn('b1', 'ret-full', 'manager-1', 'manager', {
      condition: 'sellable',
    })
    returns.applyReturn('b1', 'ret-full', 'manager-1', 'manager')

    // staff-1's first sale is partially returned: one of two units.
    returns.requestReturn({
      businessId: 'b1',
      saleId: 's1',
      returnId: 'ret-part',
      clientEventId: 'return-part',
      requestedById: 'staff-1',
      requestedByRole: 'staff',
      reason: 'Wrong fitting on one unit',
      lines: [{ lineId: 'line-1', productId: 'p1', quantity: 1 }],
      occurredAt: '2026-01-02T14:00:00.000Z',
    })
    returns.verifyReturn('b1', 'ret-part', 'manager-1', 'manager')
    returns.approveReturn('b1', 'ret-part', 'manager-1', 'manager', {
      condition: 'sellable',
    })
    returns.applyReturn('b1', 'ret-part', 'manager-1', 'manager')

    // staff-1's second sale is reversed outright.
    sales.reverse('b1', 's2', 'owner-1', 'owner')

    const report = new CanonicalReporting({
      sales,
      inventory,
      returns,
      incentivePolicy: {
        enabled: true,
        percentage: 10,
        minimumQualifyingCompletedSales: 1,
      },
      // The returns engine timestamps verify/approve/apply with the real
      // current time, so the period must span both the seeded January sales
      // and today's applied exceptions.
    }).project('b1', {
      from: '2026-01-01T00:00:00.000Z',
      to: '2027-01-01T00:00:00.000Z',
    })

    const staff1 = report.staff.find(
      (entry) => entry.salespersonId === 'staff-1',
    )
    const staff2 = report.staff.find(
      (entry) => entry.salespersonId === 'staff-2',
    )

    // staff-1: three completions minus the reversal; eligible value keeps
    // only one above-floor unit from s1 (the partial return removed the
    // other), loses the reversed s2 entirely, and gains nothing from the
    // floorless normal-price sale s4.
    expect(staff1?.qualifyingSales).toBe(2)
    expect(staff1?.incentiveEligibleValueKobo).toBe(200)
    expect(staff1?.netRecognizedSellingValueKobo).toBe(2_000)
    expect(staff1?.incentiveStatus).toBe('eligible')

    // staff-2: the only sale was fully returned, so neither gate can pass.
    expect(staff2?.qualifyingSales).toBe(0)
    expect(staff2?.incentiveEligibleValueKobo).toBe(0)
    expect(staff2?.netRecognizedSellingValueKobo).toBe(0)
    expect(staff2?.incentiveStatus).toBe('pending')

    // The floor-aware deltas are carried on the integrity report events so
    // the projection never guesses them from aggregate figures.
    const returnEvents = returns
      .listReportEvents('b1')
      .filter(
        (event): event is IntegrityReportEvent =>
          event.type === 'sale.return.applied',
      )
    expect(
      returnEvents.map((event) => event.incentiveEligibleValueKobo),
    ).toEqual([-200, -200])
  })

  it('reports counted cash variance and keeps it undefined when a count is missing', () => {
    const snapshot = (overrides: {
      actualCashKobo?: number
      cashVarianceKobo?: number
      unresolved: boolean
    }): CashReconciliationSnapshot => ({
      sessionId: 'BD-1',
      businessId: 'b1',
      state: 'reconciliation_prepared',
      custodyMode: 'shared_drawer',
      confirmedOpeningCashKobo: 500,
      cashSalesKobo: 1_000,
      cashInKobo: 0,
      cashOutKobo: 0,
      cashRefundsKobo: 0,
      expectedCashKobo: 1_500,
      actualCashKobo: overrides.actualCashKobo,
      cashVarianceKobo: overrides.cashVarianceKobo,
      discrepancyStatus: overrides.unresolved ? 'unresolved' : 'none',
      unresolved: overrides.unresolved,
    })
    const reporting = new CanonicalReporting({
      sales: new SalesTransactionEngine(
        new CatalogPricing(),
        new InventoryEngine(),
      ),
      inventory: new InventoryEngine(),
      cashSnapshots: [
        snapshot({
          actualCashKobo: 1_400,
          cashVarianceKobo: -100,
          unresolved: true,
        }),
        snapshot({
          actualCashKobo: 1_600,
          cashVarianceKobo: 100,
          unresolved: false,
        }),
      ],
    })
    const report = reporting.project('b1', {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-02T00:00:00.000Z',
    })
    expect(report.cash.expectedKobo).toBe(3_000)
    expect(report.cash.actualKobo).toBe(3_000)
    expect(report.cash.varianceKobo).toBe(0)
    expect(report.cash.unresolved).toBe(true)

    const uncounted = new CanonicalReporting({
      sales: new SalesTransactionEngine(
        new CatalogPricing(),
        new InventoryEngine(),
      ),
      inventory: new InventoryEngine(),
      cashSnapshots: [
        snapshot({ unresolved: false }),
        snapshot({
          actualCashKobo: 1_600,
          cashVarianceKobo: 100,
          unresolved: false,
        }),
      ],
    })
    const uncountedReport = uncounted.project('b1', {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-02T00:00:00.000Z',
    })
    expect(uncountedReport.cash.actualKobo).toBeUndefined()
    expect(uncountedReport.cash.varianceKobo).toBeUndefined()
  })
})
