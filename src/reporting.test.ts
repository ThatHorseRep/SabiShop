import { describe, expect, it } from 'vitest'
import { CanonicalReporting } from './reporting'
import { CatalogPricing } from './domain/catalogPricing'
import { InventoryEngine } from './domain/inventory'
import { SalesTransactionEngine } from './domain/sales'

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
})
