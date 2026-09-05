import { describe, expect, it } from 'vitest'
import { InventoryEngine, InventoryError, quantity } from './inventory'

const base = {
  businessId: 'business-1',
  productId: 'sku-rice',
  actorId: 'manager-1',
  reason: 'stock operation',
}

describe('inventory engine', () => {
  it('records receiving, weighted-average valuation, and a sale receipt', () => {
    const engine = new InventoryEngine()
    engine.receive({
      ...base,
      quantity: quantity(10),
      unitCost: 100000n,
      clientEventId: 'receipt-1',
    })
    engine.receive({
      ...base,
      quantity: quantity(10),
      unitCost: 129000n,
      clientEventId: 'receipt-2',
    })

    const sale = engine.sell({
      ...base,
      quantity: quantity(2),
      unitPrice: 150000n,
      saleId: 'sale-1',
      clientEventId: 'sale-1',
    })

    expect(engine.getStock(base.productId).sellable).toBe(18000n)
    expect(engine.getValuation(base.productId).weightedAverageCost).toBe(
      114500n,
    )
    expect(sale.event.cogs).toBe(229000n)
    expect(sale.receipt.total).toBe(300000n)
  })

  it('keeps customer returns linked and puts held goods outside sellable stock', () => {
    const engine = new InventoryEngine()
    engine.receive({
      ...base,
      quantity: quantity(5),
      unitCost: 10000n,
      clientEventId: 'receipt-1',
    })
    engine.sell({
      ...base,
      quantity: quantity(2),
      unitPrice: 15000n,
      saleId: 'sale-1',
      clientEventId: 'sale-1',
    })
    engine.return({
      ...base,
      quantity: quantity(1),
      returnId: 'return-1',
      originalSaleId: 'sale-1',
      condition: 'held',
      clientEventId: 'return-1',
    })

    expect(engine.getStock(base.productId)).toMatchObject({
      sellable: 3000n,
      held: 1000n,
      total: 4000n,
    })
  })

  it('records supplier returns as linked negative movements', () => {
    const engine = new InventoryEngine()
    const receipt = engine.receive({
      ...base,
      quantity: quantity(5),
      unitCost: 10000n,
      clientEventId: 'receipt-1',
    })
    engine.supplierReturn({
      ...base,
      quantity: quantity(2),
      returnId: 'supplier-return-1',
      receiptId: receipt.id,
      clientEventId: 'supplier-return-1',
      reason: 'wrong goods',
    })

    expect(engine.getStock(base.productId).sellable).toBe(3000n)
    expect(engine.listEvents(base.productId)[1].referenceId).toBe(receipt.id)
  })

  it('permits negative stock while exposing an exception and provisional cost', () => {
    const engine = new InventoryEngine()
    const sale = engine.sell({
      ...base,
      quantity: quantity(3),
      unitPrice: 15000n,
      saleId: 'sale-negative',
      clientEventId: 'sale-negative',
    })

    expect(engine.getStock(base.productId)).toMatchObject({
      sellable: -3000n,
      negative: true,
      exception: 'negative_stock',
    })
    expect(sale.event.provisionalQuantity).toBe(3000n)
    expect(sale.event.cogs).toBe(0n)
    expect(engine.explain(base.productId)).toMatch(
      /requires management investigation/,
    )
  })

  it('records the full later receipt and does not erase the negative sale', () => {
    const engine = new InventoryEngine()
    engine.sell({
      ...base,
      quantity: quantity(3),
      unitPrice: 15000n,
      saleId: 'sale-negative',
      clientEventId: 'sale-negative',
    })
    engine.receive({
      ...base,
      quantity: quantity(10),
      unitCost: 12000n,
      clientEventId: 'receipt-later',
    })

    expect(engine.getStock(base.productId).sellable).toBe(7000n)
    expect(engine.listEvents(base.productId)).toHaveLength(2)
    expect(engine.listEvents(base.productId)[0].quantity).toBe(-3000n)
  })

  it('supports adjustments and historical reconstruction', () => {
    const engine = new InventoryEngine()
    engine.receive({
      ...base,
      quantity: quantity(10),
      unitCost: 10000n,
      clientEventId: 'receipt-1',
    })
    const beforeAdjustment = engine.getVersion()
    engine.adjust({
      ...base,
      quantity: -quantity(2),
      adjustmentId: 'adjustment-1',
      condition: 'sellable',
      clientEventId: 'adjustment-1',
      reason: 'counted two missing units',
    })

    expect(engine.reconstruct(base.productId, beforeAdjustment).sellable).toBe(
      10000n,
    )
    expect(engine.getStock(base.productId).sellable).toBe(8000n)
  })

  it('is idempotent for duplicate client events', () => {
    const engine = new InventoryEngine()
    const command = {
      ...base,
      quantity: quantity(4),
      unitCost: 10000n,
      clientEventId: 'same-event',
    }
    const first = engine.receive(command)
    const retry = engine.receive(command)

    expect(retry).toEqual(first)
    expect(engine.getVersion()).toBe(1)
    expect(engine.listEvents()).toHaveLength(1)
  })

  it('rejects stale concurrent writes without mutating the ledger', () => {
    const engine = new InventoryEngine()
    engine.receive({
      ...base,
      quantity: quantity(4),
      unitCost: 10000n,
      clientEventId: 'receipt-1',
    })

    expect(() =>
      engine.receive({
        ...base,
        quantity: quantity(1),
        unitCost: 11000n,
        clientEventId: 'receipt-2',
        expectedVersion: 0,
      }),
    ).toThrowError(
      new InventoryError(
        'inventory changed; expected version 0, current 1',
        'concurrent_change',
      ),
    )
    expect(engine.listEvents()).toHaveLength(1)
  })
})
