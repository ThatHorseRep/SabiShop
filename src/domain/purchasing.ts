import {
  InventoryEngine,
  type InventoryEvent,
  type Money,
  type Quantity,
} from './inventory'

export type Supplier = {
  id: string
  businessId: string
  name: string
  phone?: string
  address?: string
  notes?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type PurchaseState = 'received' | 'corrected'
export type SettlementState =
  'initiated' | 'pending' | 'confirmed_success' | 'failed' | 'reversed'
export type SupplierReturnState =
  'requested' | 'verified' | 'approved' | 'applied' | 'settled' | 'rejected'

export type PurchaseLine = {
  productId: string
  quantity: Quantity
  unitCost: Money
  total: Money
  receiptEventId: string
}

export type PurchaseRecord = {
  id: string
  businessId: string
  supplierId: string
  lines: PurchaseLine[]
  total: Money
  state: PurchaseState
  receivedAt: string
  actorId: string
  clientEventId: string
}

export type SupplierPayment = {
  id: string
  businessId: string
  supplierId: string
  purchaseId: string
  amount: Money
  state: SettlementState
  method: string
  reference: string | null
  actorId: string
  occurredAt: string
  clientEventId: string
}

export type SupplierReturnLine = {
  productId: string
  quantity: Quantity
  value: Money
  inventoryEventId: string | null
}

export type SupplierReturn = {
  id: string
  businessId: string
  supplierId: string
  purchaseId: string
  lines: SupplierReturnLine[]
  value: Money
  state: SupplierReturnState
  condition: 'sellable' | 'held'
  reason: string
  paidBeforeReturn: boolean
  unpaidPayableReduction: Money
  supplierCredit: Money
  replacementReceiptEventIds: string[]
  actorId: string
  occurredAt: string
  clientEventId: string
}

export type SupplierSettlement = {
  id: string
  businessId: string
  supplierId: string
  returnId: string
  amount: Money
  state: SettlementState
  method: string
  reference: string | null
  actorId: string
  occurredAt: string
  clientEventId: string
}

export class PurchasingError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'invalid_amount'
      | 'invalid_quantity'
      | 'missing_supplier'
      | 'missing_purchase'
      | 'missing_return'
      | 'invalid_state'
      | 'duplicate_event',
  ) {
    super(message)
    this.name = 'PurchasingError'
  }
}

const now = () => new Date().toISOString()
const amount = (value: Money): Money => {
  if (value < 0n)
    throw new PurchasingError('amount must be non-negative', 'invalid_amount')
  return value
}
const positive = (value: Quantity): Quantity => {
  if (value <= 0n)
    throw new PurchasingError('quantity must be positive', 'invalid_quantity')
  return value
}
const lineTotal = (quantity: Quantity, unitCost: Money) =>
  (quantity * unitCost) / 1000n

const roundMoney = (numerator: bigint, denominator: bigint): Money => {
  if (denominator === 0n) return 0n
  return (numerator + denominator / 2n) / denominator
}

export type AcquisitionCostInput = {
  paidQuantity: Quantity
  bonusQuantity: Quantity
  unitCost: Money
  discount?: Money
}

/**
 * B06 allocates the net acquisition cost across paid and bonus quantity.
 * Bonus stock therefore increases quantity and lowers the effective unit cost;
 * it is never recorded as a zero-cost layer.
 */
export const effectiveAcquisitionUnitCost = ({
  paidQuantity,
  bonusQuantity,
  unitCost,
  discount = 0n,
}: AcquisitionCostInput): Money => {
  if (paidQuantity < 0n || bonusQuantity < 0n)
    throw new PurchasingError(
      'quantities must be non-negative',
      'invalid_quantity',
    )
  if (unitCost < 0n || discount < 0n)
    throw new PurchasingError('amount must be non-negative', 'invalid_amount')

  const totalQuantity = paidQuantity + bonusQuantity
  if (totalQuantity === 0n)
    throw new PurchasingError(
      'acquisition requires a quantity',
      'invalid_quantity',
    )

  const paidCost = (paidQuantity * unitCost) / 1000n
  const netCost = paidCost - discount
  if (netCost < 0n)
    throw new PurchasingError(
      'discount cannot exceed acquisition cost',
      'invalid_amount',
    )

  return roundMoney(netCost * 1000n, totalQuantity)
}

export class PurchasingEngine {
  readonly inventory: InventoryEngine
  private readonly suppliers = new Map<string, Supplier>()
  private readonly purchases = new Map<string, PurchaseRecord>()
  private readonly payments: SupplierPayment[] = []
  private readonly returns = new Map<string, SupplierReturn>()
  private readonly settlements: SupplierSettlement[] = []
  private readonly seen = new Map<string, unknown>()

  constructor(inventory = new InventoryEngine()) {
    this.inventory = inventory
  }

  createSupplier(
    input: Omit<Supplier, 'createdAt' | 'updatedAt' | 'active'> & {
      active?: boolean
    },
  ): Supplier {
    if (this.suppliers.has(`${input.businessId}:${input.id}`))
      return { ...this.suppliers.get(`${input.businessId}:${input.id}`)! }
    const timestamp = now()
    const supplier: Supplier = {
      ...input,
      active: input.active ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.suppliers.set(`${input.businessId}:${input.id}`, supplier)
    return { ...supplier }
  }

  listSuppliers(businessId: string): Supplier[] {
    return [...this.suppliers.values()]
      .filter((supplier) => supplier.businessId === businessId)
      .map((supplier) => ({ ...supplier }))
  }

  receivePurchase(input: {
    id: string
    businessId: string
    supplierId: string
    actorId: string
    clientEventId: string
    occurredAt?: string
    lines: {
      productId: string
      quantity: Quantity
      unitCost: Money
      condition?: 'sellable' | 'held'
    }[]
  }): PurchaseRecord {
    const duplicate = this.seen.get(
      `${input.businessId}:${input.clientEventId}`,
    )
    if (duplicate) return structuredClone(duplicate as PurchaseRecord)
    if (!this.suppliers.has(`${input.businessId}:${input.supplierId}`))
      throw new PurchasingError('supplier does not exist', 'missing_supplier')
    if (this.purchases.has(`${input.businessId}:${input.id}`))
      throw new PurchasingError('purchase already exists', 'duplicate_event')
    if (input.lines.length === 0)
      throw new PurchasingError('purchase requires lines', 'invalid_quantity')
    const lines: PurchaseLine[] = input.lines.map((line, index) => {
      const quantity = positive(line.quantity)
      const unitCost = amount(line.unitCost)
      const event = this.inventory.receive({
        businessId: input.businessId,
        productId: line.productId,
        quantity,
        unitCost,
        actorId: input.actorId,
        reason: `Supplier purchase ${input.id}`,
        clientEventId: `${input.clientEventId}:receipt:${index}`,
        occurredAt: input.occurredAt,
        condition: line.condition ?? 'sellable',
        referenceId: input.id,
      })
      return {
        productId: line.productId,
        quantity,
        unitCost,
        total: lineTotal(quantity, unitCost),
        receiptEventId: event.id,
      }
    })
    const purchase: PurchaseRecord = {
      id: input.id,
      businessId: input.businessId,
      supplierId: input.supplierId,
      lines,
      total: lines.reduce((sum, line) => sum + line.total, 0n),
      state: 'received',
      receivedAt: input.occurredAt ?? now(),
      actorId: input.actorId,
      clientEventId: input.clientEventId,
    }
    this.purchases.set(`${input.businessId}:${input.id}`, purchase)
    this.seen.set(`${input.businessId}:${input.clientEventId}`, purchase)
    return structuredClone(purchase)
  }

  recordPayment(
    input: Omit<SupplierPayment, 'occurredAt' | 'state' | 'supplierId'> & {
      state?: SettlementState
      occurredAt?: string
    },
  ): SupplierPayment {
    const key = `${input.businessId}:${input.clientEventId}`
    const existing = this.seen.get(key)
    if (existing) return { ...(existing as SupplierPayment) }
    const purchase = this.getPurchase(input.businessId, input.purchaseId)
    amount(input.amount)
    const payment: SupplierPayment = {
      ...input,
      supplierId: purchase.supplierId,
      state: input.state ?? 'confirmed_success',
      occurredAt: input.occurredAt ?? now(),
    }
    this.payments.push(payment)
    this.seen.set(key, payment)
    return { ...payment }
  }

  requestReturn(input: {
    id: string
    businessId: string
    purchaseId: string
    actorId: string
    clientEventId: string
    reason: string
    condition: 'sellable' | 'held'
    lines: { productId: string; quantity: Quantity }[]
  }): SupplierReturn {
    const purchase = this.getPurchase(input.businessId, input.purchaseId)
    const lines = input.lines.map((line) => {
      const source = purchase.lines.find(
        (item) => item.productId === line.productId,
      )
      if (!source || positive(line.quantity) > source.quantity)
        throw new PurchasingError(
          'return exceeds received line',
          'invalid_quantity',
        )
      return {
        productId: line.productId,
        quantity: positive(line.quantity),
        value: lineTotal(line.quantity, source.unitCost),
        inventoryEventId: null,
      }
    })
    const value = lines.reduce((sum, line) => sum + line.value, 0n)
    const paidBeforeReturn =
      this.confirmedPayments(input.businessId, input.purchaseId) >=
      purchase.total
    const result: SupplierReturn = {
      id: input.id,
      businessId: input.businessId,
      supplierId: purchase.supplierId,
      purchaseId: purchase.id,
      lines,
      value,
      state: 'requested',
      condition: input.condition,
      reason: input.reason,
      paidBeforeReturn,
      unpaidPayableReduction: paidBeforeReturn ? 0n : value,
      supplierCredit: paidBeforeReturn ? value : 0n,
      replacementReceiptEventIds: [],
      actorId: input.actorId,
      occurredAt: now(),
      clientEventId: input.clientEventId,
    }
    this.returns.set(`${input.businessId}:${input.id}`, result)
    return structuredClone(result)
  }

  verifyReturn(businessId: string, returnId: string): SupplierReturn {
    return this.transitionReturn(businessId, returnId, 'verified')
  }
  approveReturn(businessId: string, returnId: string): SupplierReturn {
    return this.transitionReturn(businessId, returnId, 'approved')
  }

  applyReturn(businessId: string, returnId: string): SupplierReturn {
    const result = this.getReturn(businessId, returnId)
    if (result.state !== 'approved')
      throw new PurchasingError(
        'return must be approved before application',
        'invalid_state',
      )
    const lines = result.lines.map((line) => ({
      ...line,
      inventoryEventId: this.inventory.supplierReturn({
        businessId,
        productId: line.productId,
        quantity: line.quantity,
        actorId: result.actorId,
        reason: result.reason,
        clientEventId: `${result.clientEventId}:return:${line.productId}`,
        returnId: result.id,
        receiptId: this.getPurchase(businessId, result.purchaseId).lines.find(
          (source) => source.productId === line.productId,
        )!.receiptEventId,
      }).id,
    }))
    const applied = { ...result, lines, state: 'applied' as const }
    this.returns.set(`${businessId}:${returnId}`, applied)
    return structuredClone(applied)
  }

  recordReplacement(input: {
    businessId: string
    returnId: string
    actorId: string
    clientEventId: string
    lines: {
      productId: string
      quantity: Quantity
      unitCost: Money
      condition?: 'sellable' | 'held'
    }[]
  }): SupplierReturn {
    const result = this.getReturn(input.businessId, input.returnId)
    if (result.state !== 'applied')
      throw new PurchasingError(
        'replacement requires an applied return',
        'invalid_state',
      )
    const receiptEventIds = input.lines.map(
      (line, index) =>
        this.inventory.receive({
          businessId: input.businessId,
          productId: line.productId,
          quantity: positive(line.quantity),
          unitCost: amount(line.unitCost),
          condition: line.condition ?? 'sellable',
          actorId: input.actorId,
          reason: `Replacement for supplier return ${result.id}`,
          clientEventId: `${input.clientEventId}:replacement:${index}`,
          referenceId: result.id,
        }).id,
    )
    const updated = {
      ...result,
      replacementReceiptEventIds: [
        ...result.replacementReceiptEventIds,
        ...receiptEventIds,
      ],
    }
    this.returns.set(`${input.businessId}:${input.returnId}`, updated)
    return structuredClone(updated)
  }

  settleReturn(
    input: Omit<SupplierSettlement, 'occurredAt' | 'state' | 'supplierId'> & {
      state?: SettlementState
      occurredAt?: string
    },
  ): SupplierSettlement {
    const result = this.getReturn(input.businessId, input.returnId)
    if (result.state !== 'applied')
      throw new PurchasingError(
        'settlement requires an applied return',
        'invalid_state',
      )
    const settlement: SupplierSettlement = {
      ...input,
      supplierId: result.supplierId,
      state: input.state ?? 'confirmed_success',
      occurredAt: input.occurredAt ?? now(),
    }
    this.settlements.push(settlement)
    if (settlement.state === 'confirmed_success')
      this.returns.set(`${input.businessId}:${input.returnId}`, {
        ...result,
        state: 'settled',
      })
    return { ...settlement }
  }

  supplierOutstanding(businessId: string, supplierId: string): Money {
    const purchases = [...this.purchases.values()].filter(
      (purchase) =>
        purchase.businessId === businessId &&
        purchase.supplierId === supplierId,
    )
    const obligations = purchases.reduce(
      (sum, purchase) => sum + purchase.total,
      0n,
    )
    const payments = this.payments
      .filter(
        (payment) =>
          payment.businessId === businessId &&
          payment.supplierId === supplierId &&
          payment.state === 'confirmed_success',
      )
      .reduce((sum, payment) => sum + payment.amount, 0n)
    const reductions = [...this.returns.values()]
      .filter(
        (result) =>
          result.businessId === businessId &&
          result.supplierId === supplierId &&
          (result.state === 'applied' || result.state === 'settled'),
      )
      .reduce((sum, result) => sum + result.unpaidPayableReduction, 0n)
    const credits = [...this.returns.values()]
      .filter(
        (result) =>
          result.businessId === businessId &&
          result.supplierId === supplierId &&
          (result.state === 'applied' || result.state === 'settled'),
      )
      .reduce((sum, result) => sum + result.supplierCredit, 0n)
    const settlements = this.settlements
      .filter(
        (settlement) =>
          settlement.businessId === businessId &&
          settlement.supplierId === supplierId &&
          settlement.state === 'confirmed_success',
      )
      .reduce((sum, settlement) => sum + settlement.amount, 0n)
    return obligations - payments - reductions - credits + settlements
  }

  listPurchases(businessId: string): PurchaseRecord[] {
    return [...this.purchases.values()]
      .filter((purchase) => purchase.businessId === businessId)
      .map((purchase) => structuredClone(purchase))
  }
  listPayments(businessId: string): SupplierPayment[] {
    return this.payments
      .filter((payment) => payment.businessId === businessId)
      .map((payment) => ({ ...payment }))
  }
  listReturns(businessId: string): SupplierReturn[] {
    return [...this.returns.values()]
      .filter((result) => result.businessId === businessId)
      .map((result) => structuredClone(result))
  }
  listSettlements(businessId: string): SupplierSettlement[] {
    return this.settlements
      .filter((settlement) => settlement.businessId === businessId)
      .map((settlement) => ({ ...settlement }))
  }

  private getPurchase(businessId: string, id: string) {
    const purchase = this.purchases.get(`${businessId}:${id}`)
    if (!purchase)
      throw new PurchasingError('purchase does not exist', 'missing_purchase')
    return purchase
  }
  private getReturn(businessId: string, id: string) {
    const result = this.returns.get(`${businessId}:${id}`)
    if (!result)
      throw new PurchasingError('return does not exist', 'missing_return')
    return result
  }
  private confirmedPayments(businessId: string, purchaseId: string) {
    return this.payments
      .filter(
        (payment) =>
          payment.businessId === businessId &&
          payment.purchaseId === purchaseId &&
          payment.state === 'confirmed_success',
      )
      .reduce((sum, payment) => sum + payment.amount, 0n)
  }
  private transitionReturn(
    businessId: string,
    returnId: string,
    state: 'verified' | 'approved',
  ) {
    const result = this.getReturn(businessId, returnId)
    const legal =
      (state === 'verified' && result.state === 'requested') ||
      (state === 'approved' && result.state === 'verified')
    if (!legal)
      throw new PurchasingError(
        'illegal supplier return transition',
        'invalid_state',
      )
    const updated = { ...result, state }
    this.returns.set(`${businessId}:${returnId}`, updated)
    return structuredClone(updated)
  }
}

export type { InventoryEvent }
