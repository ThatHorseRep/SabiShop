import { describe, expect, it } from 'vitest'
import { PurchasingEngine } from './purchasing'
import { quantity } from './inventory'

const setup = () => {
  const engine = new PurchasingEngine()
  engine.createSupplier({
    id: 'supplier-1',
    businessId: 'business-1',
    name: 'A Supplier',
  })
  return engine
}

describe('PurchasingEngine', () => {
  it('receives purchases into inventory and keeps supplier liability separate from payments', () => {
    const engine = setup()
    const purchase = engine.receivePurchase({
      id: 'purchase-1',
      businessId: 'business-1',
      supplierId: 'supplier-1',
      actorId: 'manager-1',
      clientEventId: 'purchase-event-1',
      lines: [{ productId: 'sku-1', quantity: quantity(10), unitCost: 4000n }],
    })
    expect(purchase.total).toBe(40000n)
    expect(engine.inventory.getStock('sku-1').sellable).toBe(quantity(10))
    engine.recordPayment({
      id: 'payment-1',
      businessId: 'business-1',
      purchaseId: 'purchase-1',
      amount: 15000n,
      method: 'transfer',
      reference: 'bank-1',
      actorId: 'manager-1',
      clientEventId: 'payment-event-1',
    })
    expect(engine.supplierOutstanding('business-1', 'supplier-1')).toBe(25000n)
  })

  it('reduces unpaid payable on an approved supplier return', () => {
    const engine = setup()
    engine.receivePurchase({
      id: 'purchase-1',
      businessId: 'business-1',
      supplierId: 'supplier-1',
      actorId: 'manager-1',
      clientEventId: 'purchase-event-1',
      lines: [{ productId: 'sku-1', quantity: quantity(10), unitCost: 4000n }],
    })
    engine.recordPayment({
      id: 'payment-1',
      businessId: 'business-1',
      purchaseId: 'purchase-1',
      amount: 10000n,
      method: 'cash',
      reference: null,
      actorId: 'manager-1',
      clientEventId: 'payment-event-1',
    })
    engine.requestReturn({
      id: 'return-1',
      businessId: 'business-1',
      purchaseId: 'purchase-1',
      actorId: 'manager-1',
      clientEventId: 'return-event-1',
      reason: 'Wrong goods',
      condition: 'sellable',
      lines: [{ productId: 'sku-1', quantity: quantity(2) }],
    })
    engine.verifyReturn('business-1', 'return-1')
    engine.approveReturn('business-1', 'return-1')
    engine.applyReturn('business-1', 'return-1')
    expect(engine.inventory.getStock('sku-1').sellable).toBe(quantity(8))
    expect(engine.supplierOutstanding('business-1', 'supplier-1')).toBe(22000n)
  })

  it('creates supplier credit for paid returns and keeps replacement and settlement separate', () => {
    const engine = setup()
    engine.receivePurchase({
      id: 'purchase-1',
      businessId: 'business-1',
      supplierId: 'supplier-1',
      actorId: 'manager-1',
      clientEventId: 'purchase-event-1',
      lines: [{ productId: 'sku-1', quantity: quantity(2), unitCost: 5000n }],
    })
    engine.recordPayment({
      id: 'payment-1',
      businessId: 'business-1',
      purchaseId: 'purchase-1',
      amount: 10000n,
      method: 'transfer',
      reference: null,
      actorId: 'manager-1',
      clientEventId: 'payment-event-1',
    })
    engine.requestReturn({
      id: 'return-1',
      businessId: 'business-1',
      purchaseId: 'purchase-1',
      actorId: 'manager-1',
      clientEventId: 'return-event-1',
      reason: 'Defective',
      condition: 'held',
      lines: [{ productId: 'sku-1', quantity: quantity(1) }],
    })
    engine.verifyReturn('business-1', 'return-1')
    engine.approveReturn('business-1', 'return-1')
    engine.applyReturn('business-1', 'return-1')
    const withReplacement = engine.recordReplacement({
      businessId: 'business-1',
      returnId: 'return-1',
      actorId: 'manager-1',
      clientEventId: 'replacement-event-1',
      lines: [{ productId: 'sku-1', quantity: quantity(1), unitCost: 5500n }],
    })
    expect(withReplacement.replacementReceiptEventIds).toHaveLength(1)
    expect(engine.supplierOutstanding('business-1', 'supplier-1')).toBe(-5000n)
    engine.settleReturn({
      id: 'settlement-1',
      businessId: 'business-1',
      returnId: 'return-1',
      amount: 5000n,
      method: 'credit-note',
      reference: 'CN-1',
      actorId: 'manager-1',
      clientEventId: 'settlement-event-1',
    })
    expect(engine.listReturns('business-1')[0].state).toBe('settled')
  })

  it('is idempotent on purchase retry and preserves returned history snapshots', () => {
    const engine = setup()
    const command = {
      id: 'purchase-1',
      businessId: 'business-1',
      supplierId: 'supplier-1',
      actorId: 'manager-1',
      clientEventId: 'purchase-event-1',
      lines: [{ productId: 'sku-1', quantity: quantity(3), unitCost: 4000n }],
    }
    const first = engine.receivePurchase(command)
    const retry = engine.receivePurchase(command)
    expect(retry).toEqual(first)
    expect(engine.inventory.listEvents('sku-1')).toHaveLength(1)

    const listed = engine.listPurchases('business-1')
    listed[0].lines[0].quantity = quantity(99)
    expect(engine.listPurchases('business-1')[0].lines[0].quantity).toBe(
      quantity(3),
    )
  })

  it('rejects invalid receiving and illegal return application without business effects', () => {
    const engine = setup()
    expect(() =>
      engine.receivePurchase({
        id: 'purchase-1',
        businessId: 'business-1',
        supplierId: 'supplier-1',
        actorId: 'manager-1',
        clientEventId: 'purchase-event-1',
        lines: [{ productId: 'sku-1', quantity: 0n, unitCost: 4000n }],
      }),
    ).toThrowError('quantity must be positive')
    expect(engine.listPurchases('business-1')).toHaveLength(0)
    expect(engine.inventory.listEvents()).toHaveLength(0)

    expect(() => engine.applyReturn('business-1', 'missing-return')).toThrow(
      'return does not exist',
    )
  })
})
