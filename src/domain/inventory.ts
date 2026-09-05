export type InventoryEventType =
  'receipt' | 'sale' | 'customer_return' | 'supplier_return' | 'adjustment'

export type StockCondition = 'sellable' | 'held'

export type Quantity = bigint
export type Money = bigint

export type InventoryEvent = {
  id: string
  businessId: string
  productId: string
  type: InventoryEventType
  quantity: Quantity
  condition: StockCondition
  unitCost: Money | null
  cogs: Money | null
  provisionalQuantity: Quantity
  referenceId: string | null
  reason: string
  actorId: string
  occurredAt: string
  recordedAt: string
  clientEventId: string
  sequence: number
}

export type SaleReceiptLine = {
  productId: string
  quantity: Quantity
  unitPrice: Money
  lineTotal: Money
}

export type SaleReceipt = {
  receiptId: string
  saleId: string
  businessId: string
  lines: SaleReceiptLine[]
  total: Money
  issuedAt: string
}

export type StockLevel = {
  productId: string
  sellable: Quantity
  held: Quantity
  total: Quantity
  negative: boolean
  exception: 'negative_stock' | null
}

export type InventoryValuation = {
  productId: string
  quantity: Quantity
  valuedQuantity: Quantity
  value: Money
  weightedAverageCost: Money | null
  provisionalQuantity: Quantity
  latestReliableAcquisitionCost: Money | null
  belowReplacementCost: boolean
}

export type InventoryCommand = {
  businessId: string
  productId: string
  quantity: Quantity
  actorId: string
  reason: string
  clientEventId: string
  referenceId?: string
  occurredAt?: string
  condition?: StockCondition
  unitCost?: Money
  expectedVersion?: number
}

export type SaleCommand = InventoryCommand & {
  saleId: string
  unitPrice: Money
}

export type ReturnCommand = InventoryCommand & {
  returnId: string
  originalSaleId: string
  condition: StockCondition
}

export type AdjustmentCommand = InventoryCommand & {
  adjustmentId: string
  condition: StockCondition
  unitCost?: Money
}

type AppendCommand = Omit<InventoryCommand, 'unitCost' | 'condition'> & {
  type: InventoryEventType
  condition: StockCondition
  unitCost: Money | null
  cogs?: Money | null
  provisionalQuantity?: Quantity
  referenceId?: string
}

export class InventoryError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'invalid_quantity'
      | 'invalid_money'
      | 'duplicate_event'
      | 'concurrent_change'
      | 'missing_reference'
      | 'invalid_adjustment',
  ) {
    super(message)
    this.name = 'InventoryError'
  }
}

export const quantity = (value: number | string | bigint): Quantity => {
  if (typeof value === 'bigint') {
    if (value <= 0n)
      throw new InventoryError('quantity must be positive', 'invalid_quantity')
    return value
  }

  const text = String(value)
  if (!/^\d+(?:\.\d{1,3})?$/.test(text) || Number(text) <= 0) {
    throw new InventoryError(
      'quantity must be positive and use at most 3 decimals',
      'invalid_quantity',
    )
  }
  const [whole, fraction = ''] = text.split('.')
  return BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'))
}

const assertMoney = (value: Money | undefined): Money => {
  if (value === undefined || value < 0n) {
    throw new InventoryError(
      'money must be a non-negative integer number of kobo',
      'invalid_money',
    )
  }
  return value
}

const divRound = (numerator: bigint, denominator: bigint): bigint => {
  if (denominator === 0n) return 0n
  return (numerator + denominator / 2n) / denominator
}

const now = () => new Date().toISOString()

export class InventoryEngine {
  private readonly events: InventoryEvent[] = []
  private readonly eventIds = new Map<string, InventoryEvent>()
  private version = 0
  private nextId = 1

  getVersion(): number {
    return this.version
  }

  listEvents(productId?: string): InventoryEvent[] {
    return this.events
      .filter(
        (event) => productId === undefined || event.productId === productId,
      )
      .map((event) => ({ ...event }))
  }

  receive(command: InventoryCommand): InventoryEvent {
    const unitCost = assertMoney(command.unitCost)
    return this.append({
      ...command,
      type: 'receipt',
      quantity: command.quantity,
      unitCost,
      condition: command.condition ?? 'sellable',
    })
  }

  sell(command: SaleCommand): { event: InventoryEvent; receipt: SaleReceipt } {
    const unitPrice = assertMoney(command.unitPrice)
    const stock = this.getStock(command.productId)
    const valuation = this.getValuation(command.productId)
    const valuedQuantity = stock.sellable > 0n ? stock.sellable : 0n
    const costedQuantity =
      command.quantity < valuedQuantity ? command.quantity : valuedQuantity
    const cogs =
      costedQuantity === 0n || valuation.weightedAverageCost === null
        ? 0n
        : (costedQuantity * valuation.weightedAverageCost) / 1000n
    const event = this.append({
      ...command,
      type: 'sale',
      quantity: -command.quantity,
      condition: 'sellable',
      unitCost: valuation.weightedAverageCost,
      cogs,
      provisionalQuantity: command.quantity - costedQuantity,
      referenceId: command.saleId,
    })
    return {
      event,
      receipt: {
        receiptId: `receipt-${event.id}`,
        saleId: command.saleId,
        businessId: command.businessId,
        lines: [
          {
            productId: command.productId,
            quantity: command.quantity,
            unitPrice,
            lineTotal: (command.quantity * unitPrice) / 1000n,
          },
        ],
        total: (command.quantity * unitPrice) / 1000n,
        issuedAt: event.occurredAt,
      },
    }
  }

  return(command: ReturnCommand): InventoryEvent {
    const originalSale = this.events.find(
      (event) =>
        event.type === 'sale' && event.referenceId === command.originalSaleId,
    )
    if (!originalSale) {
      throw new InventoryError(
        'return must reference an existing sale',
        'missing_reference',
      )
    }
    return this.append({
      ...command,
      type: 'customer_return',
      quantity: command.quantity,
      unitCost: originalSale.unitCost,
      cogs: null,
      provisionalQuantity: 0n,
      referenceId: command.originalSaleId,
    })
  }

  supplierReturn(
    command: InventoryCommand & { returnId: string; receiptId: string },
  ): InventoryEvent {
    const originalReceipt = this.events.find(
      (event) => event.type === 'receipt' && event.id === command.receiptId,
    )
    if (!originalReceipt) {
      throw new InventoryError(
        'supplier return must reference an existing receipt',
        'missing_reference',
      )
    }
    return this.append({
      ...command,
      type: 'supplier_return',
      quantity: -command.quantity,
      condition: originalReceipt.condition,
      unitCost: originalReceipt.unitCost,
      cogs: null,
      provisionalQuantity: 0n,
      referenceId: command.receiptId,
    })
  }

  adjust(command: AdjustmentCommand): InventoryEvent {
    if (command.quantity === 0n) {
      throw new InventoryError(
        'adjustment quantity cannot be zero',
        'invalid_adjustment',
      )
    }
    return this.append({
      ...command,
      type: 'adjustment',
      condition: command.condition,
      unitCost:
        command.unitCost === undefined ? null : assertMoney(command.unitCost),
      cogs: null,
      provisionalQuantity: 0n,
      referenceId: command.adjustmentId,
    })
  }

  getStock(productId: string): StockLevel {
    const sellable = this.events
      .filter(
        (event) =>
          event.productId === productId && event.condition === 'sellable',
      )
      .reduce((total, event) => total + event.quantity, 0n)
    const held = this.events
      .filter(
        (event) => event.productId === productId && event.condition === 'held',
      )
      .reduce((total, event) => total + event.quantity, 0n)
    const total = sellable + held
    return {
      productId,
      sellable,
      held,
      total,
      negative: sellable < 0n,
      exception: sellable < 0n ? 'negative_stock' : null,
    }
  }

  getValuation(productId: string, replacementCost?: Money): InventoryValuation {
    const productEvents = this.events.filter(
      (event) => event.productId === productId,
    )
    const stock = this.getStock(productId)
    const costBearingEvents = productEvents.filter(
      (event) => event.unitCost !== null && event.quantity > 0n,
    )
    const positiveQuantity = costBearingEvents.reduce(
      (total, event) => total + event.quantity,
      0n,
    )
    const positiveValue = costBearingEvents.reduce(
      (total, event) => total + event.quantity * (event.unitCost ?? 0n),
      0n,
    )
    const weightedAverageCost =
      positiveQuantity === 0n ? null : divRound(positiveValue, positiveQuantity)
    const valuedQuantity = stock.total > 0n ? stock.total : 0n
    const value =
      weightedAverageCost === null
        ? 0n
        : (valuedQuantity * weightedAverageCost) / 1000n
    const provisionalQuantity = productEvents.reduce(
      (total, event) => total + event.provisionalQuantity,
      0n,
    )
    const latestReceipt = productEvents
      .filter(
        (event) =>
          event.type === 'receipt' &&
          event.unitCost !== null &&
          event.quantity > 0n,
      )
      .at(-1)
    return {
      productId,
      quantity: stock.total,
      valuedQuantity,
      value,
      weightedAverageCost,
      provisionalQuantity,
      latestReliableAcquisitionCost: latestReceipt?.unitCost ?? null,
      belowReplacementCost:
        replacementCost !== undefined &&
        weightedAverageCost !== null &&
        replacementCost > weightedAverageCost,
    }
  }

  explain(productId: string): string {
    const stock = this.getStock(productId)
    const valuation = this.getValuation(productId)
    const movementSummary = this.listEvents(productId)
      .map((event) => `${event.type} ${event.quantity} (${event.id})`)
      .join(', ')
    const exception = stock.negative
      ? ' Exception: negative stock requires management investigation and reconciliation.'
      : ''
    return `Stock ${stock.total}; sellable ${stock.sellable}; held ${stock.held}; weighted-average cost ${valuation.weightedAverageCost ?? 'undetermined'}; movements: ${movementSummary}.${exception}`
  }

  reconstruct(
    productId: string,
    throughSequence = Number.MAX_SAFE_INTEGER,
  ): StockLevel {
    const relevant = this.events.filter(
      (event) =>
        event.productId === productId && event.sequence <= throughSequence,
    )
    const sellable = relevant
      .filter((event) => event.condition === 'sellable')
      .reduce((total, event) => total + event.quantity, 0n)
    const held = relevant
      .filter((event) => event.condition === 'held')
      .reduce((total, event) => total + event.quantity, 0n)
    const total = sellable + held
    return {
      productId,
      sellable,
      held,
      total,
      negative: sellable < 0n,
      exception: sellable < 0n ? 'negative_stock' : null,
    }
  }

  private append(command: AppendCommand): InventoryEvent {
    const existing = this.eventIds.get(
      `${command.businessId}:${command.clientEventId}`,
    )
    if (existing) return { ...existing }
    if (
      command.expectedVersion !== undefined &&
      command.expectedVersion !== this.version
    ) {
      throw new InventoryError(
        `inventory changed; expected version ${command.expectedVersion}, current ${this.version}`,
        'concurrent_change',
      )
    }
    const event: InventoryEvent = {
      id: `inventory-${this.nextId++}`,
      businessId: command.businessId,
      productId: command.productId,
      type: command.type,
      quantity: command.quantity,
      condition: command.condition ?? 'sellable',
      unitCost: command.unitCost,
      cogs: command.cogs ?? null,
      provisionalQuantity: command.provisionalQuantity ?? 0n,
      referenceId: command.referenceId ?? null,
      reason: command.reason,
      actorId: command.actorId,
      occurredAt: command.occurredAt ?? now(),
      recordedAt: now(),
      clientEventId: command.clientEventId,
      sequence: ++this.version,
    }
    this.events.push(event)
    this.eventIds.set(`${command.businessId}:${command.clientEventId}`, event)
    return { ...event }
  }
}
