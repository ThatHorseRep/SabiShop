import { describe, expect, it } from 'vitest'
import { CatalogPricing } from './catalogPricing'
import { InventoryEngine, quantity as inventoryQuantity } from './inventory'
import {
  SalesError,
  SalesTransactionEngine,
  type PaymentComponent,
} from './sales'

const confirmed = (
  id: string,
  method: PaymentComponent['method'],
  amountKobo: number,
): PaymentComponent => ({
  id,
  method,
  amountKobo,
  confirmation: { state: 'confirmed_success', confirmedBy: 'cashier' },
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
    actorId: 'owner',
    reason: 'opening',
    clientEventId: 'receipt-1',
  })
  return {
    pricing,
    inventory,
    sales: new SalesTransactionEngine(pricing, inventory),
  }
}

const base = (
  payments: PaymentComponent[],
  extra: Record<string, unknown> = {},
) => ({
  businessId: 'b1',
  id: 's1',
  clientRequestId: 'req-1',
  actorId: 'staff',
  actorRole: 'staff' as const,
  lines: [
    {
      id: 'l1',
      productId: 'p1',
      quantity: 2,
      discount: { kind: 'fixed' as const, value: 100 },
    },
  ],
  payments,
  ...extra,
})

describe('sales transaction lifecycle', () => {
  it('coordinates discount, tax, cash payment, inventory, COGS and reporting', () => {
    const { sales, inventory } = setup()
    const sale = sales.complete(
      base([confirmed('pay-1', 'cash', 1980)], { taxRateBasisPoints: 1000n }),
    )
    expect(sale.totalDueKobo).toBe(1980)
    expect(sale.cashKobo).toBe(1980)
    expect(sale.cogsKobo).toBe(800)
    expect(inventory.getStock('p1').sellable).toBe(8000n)
    expect(sales.listReports()[0].type).toBe('sale.completed')
  })

  it('supports non-cash and split payments but rejects unconfirmed or mismatched amounts', () => {
    const { sales } = setup()
    expect(() =>
      sales.complete(
        base([{ id: 'p', method: 'bank_transfer', amountKobo: 1800 }]),
      ),
    ).toThrowError(SalesError)
    const sale = sales.complete(
      base([
        confirmed('cash', 'cash', 500),
        confirmed('pos', 'pos_card', 1300),
      ]),
    )
    expect(sale.cashKobo).toBe(500)
    expect(sale.nonCashKobo).toBe(1300)
  })

  it('requires customer identity and separate management approval for credit', () => {
    const { sales } = setup()
    const payments = [confirmed('credit', 'customer_credit', 1800)]
    expect(() => sales.complete(base(payments))).toThrowError(/customer/i)
    const sale = sales.complete(
      base(payments, {
        customer: { id: 'c1', name: 'Ada', phone: '0801' },
        creditApproval: { approverId: 'manager', approverRole: 'manager' },
      }),
    )
    expect(sale.creditObligationKobo).toBe(1800)
  })

  it('is idempotent for duplicate submissions and reverses through append-only inventory events', () => {
    const { sales, inventory } = setup()
    const first = sales.complete(base([confirmed('p', 'cash', 1800)]))
    const retry = sales.complete(base([confirmed('p', 'cash', 1800)]))
    expect(retry.inventoryEvents).toEqual(first.inventoryEvents)
    const reversed = sales.reverse('b1', 's1', 'manager', 'manager')
    expect(reversed.reversedAt).toBeDefined()
    expect(
      inventory
        .listEvents('p1')
        .filter((event) => event.type === 'customer_return'),
    ).toHaveLength(1)
  })

  it('allows negative stock while preserving a provisional COGS exception', () => {
    const { sales, inventory } = setup()
    inventory.adjust({
      businessId: 'b1',
      productId: 'p1',
      quantity: -inventoryQuantity(10),
      condition: 'sellable',
      actorId: 'manager',
      reason: 'stock correction',
      clientEventId: 'adjust-1',
      adjustmentId: 'a1',
    })
    const sale = sales.complete(base([confirmed('p', 'cash', 1800)]))
    expect(sale.cogsKobo).toBe(0)
    expect(inventory.getStock('p1').negative).toBe(true)
  })
})
