import { executeAuthorized } from '../auth/server'
import { effectivePermissions } from '../auth/policy'
import type {
  AuditSink,
  AuthorizationAuditEvent,
  AuthSession,
  Permission,
} from '../auth/types'
import { CatalogPricing, type Product } from '../domain/catalogPricing'
import {
  InventoryEngine,
  type InventoryEvent,
  type InventoryValuation,
  type Money,
  type Quantity,
  type SaleReceipt,
  type StockLevel,
} from '../domain/inventory'
import {
  effectiveAcquisitionUnitCost,
  PurchasingEngine,
  type PurchaseRecord,
  type Supplier,
  type SupplierPayment,
  type SupplierReturn,
  type SupplierSettlement,
} from '../domain/purchasing'
import {
  posActors,
  posBusiness,
  posDeviceId,
  type PosActor,
} from '../pos/posSession'

export const inventoryBusinessId = posBusiness.id

export type InventoryActorId = PosActor['id']

export type InventoryActor = PosActor

export const inventoryActors: readonly InventoryActor[] = posActors

export type ProductView = {
  product: Product
  stock: StockLevel
  valuation: InventoryValuation
  lastMovement: InventoryEvent | null
  supplierIds: string[]
  replacementCost: Money | null
  sellingBelowReplacementCost: boolean
}

export type SupplierView = {
  supplier: Supplier
  outstanding: Money
  purchaseCount: number
  productIds: string[]
}

export type PurchaseView = {
  purchase: PurchaseRecord
  supplier: Supplier | null
  payments: SupplierPayment[]
  paid: Money
  outstanding: Money
}

export type SupplierReturnView = {
  supplierReturn: SupplierReturn
  purchase: PurchaseRecord | null
  supplier: Supplier | null
  replacementEvents: InventoryEvent[]
  settlements: SupplierSettlement[]
}

export type StockInvestigation = {
  id: string
  businessId: string
  productId: string
  systemQuantity: Quantity
  physicalQuantity: Quantity
  variance: Quantity
  cause:
    | 'missing_sale'
    | 'wrong_quantity'
    | 'incorrect_movement'
    | 'damage'
    | 'theft'
    | 'counting_error'
    | 'other'
  note: string
  status: 'investigating' | 'corrected'
  discoveredAt: string
  actorId: string
  adjustmentEventId: string | null
}

export type EventSourceView = {
  kind:
    | 'purchase'
    | 'sale'
    | 'supplier_return'
    | 'replacement'
    | 'investigation'
    | 'source_reference'
    | 'none'
  id: string | null
  label: string
}

export type InventorySnapshot = {
  actor: InventoryActor
  permissions: readonly Permission[]
  canViewCost: boolean
  products: ProductView[]
  suppliers: SupplierView[]
  purchases: PurchaseView[]
  payments: SupplierPayment[]
  supplierReturns: SupplierReturnView[]
  settlements: SupplierSettlement[]
  events: InventoryEvent[]
  saleReceipts: SaleReceipt[]
  investigations: StockInvestigation[]
  auditEventCount: number
}

export type ReceiveLineInput = {
  productId: string
  paidQuantity: Quantity
  bonusQuantity: Quantity
  unitCost: Money
  discount: Money
  condition: 'sellable' | 'held'
}

export type ReceiveInput = {
  supplierId: string
  lines: ReceiveLineInput[]
  paymentAmount: Money
  paymentMethod: string
  paymentReference: string | null
}

export type SupplierReturnInput = {
  purchaseId: string
  reason: string
  condition: 'sellable' | 'held'
  lines: { productId: string; quantity: Quantity }[]
}

export type ReplacementInput = {
  returnId: string
  lines: { productId: string; quantity: Quantity; unitCost: Money }[]
}

const sessionForActor = (actor: InventoryActor): AuthSession => {
  const now = Date.now()
  return {
    sessionId: `session-${actor.id}`,
    user: {
      userId: actor.id,
      displayName: actor.displayName,
      active: true,
    },
    device: { deviceId: posDeviceId, trusted: true },
    memberships: [
      {
        businessId: inventoryBusinessId,
        roles: [actor.role],
        active: true,
      },
    ],
    activeBusinessId: inventoryBusinessId,
    issuedAt: now,
    expiresAt: now + 8 * 60 * 60 * 1000,
  }
}

export class InventoryPurchasingController {
  private readonly catalog = new CatalogPricing()
  private readonly inventory = new InventoryEngine()
  private readonly purchasing = new PurchasingEngine(this.inventory)
  private readonly sessions = new Map<InventoryActorId, AuthSession>()
  private readonly auditEvents: AuthorizationAuditEvent[] = []
  private readonly saleReceipts: SaleReceipt[] = []
  private readonly investigations: StockInvestigation[] = []
  private actorId: InventoryActorId = 'user-ngozi'
  private nextReference = 5000

  constructor() {
    for (const actor of inventoryActors) {
      this.sessions.set(actor.id, sessionForActor(actor))
    }
    this.seedReferenceOperations()
  }

  setActor(actorId: InventoryActorId): void {
    if (!this.sessions.has(actorId)) throw new Error('Unknown actor')
    this.actorId = actorId
  }

  getActor(): InventoryActor {
    return inventoryActors.find((actor) => actor.id === this.actorId)!
  }

  can(permission: Permission): boolean {
    const session = this.sessions.get(this.actorId)
    if (!session) return false
    const membership = session.memberships.find(
      (candidate) =>
        candidate.businessId === session.activeBusinessId && candidate.active,
    )
    return !!membership && effectivePermissions(membership).has(permission)
  }

  snapshot(): InventorySnapshot {
    const products = this.catalog
      .searchProducts('', true)
      .map((product) => this.productView(product))
    const suppliers = this.purchasing
      .listSuppliers(inventoryBusinessId)
      .map((supplier) => this.supplierView(supplier))
    const purchases = this.purchasing
      .listPurchases(inventoryBusinessId)
      .map((purchase) => this.purchaseView(purchase))
    const supplierReturns = this.purchasing
      .listReturns(inventoryBusinessId)
      .map((supplierReturn) => this.supplierReturnView(supplierReturn))

    return {
      actor: this.getActor(),
      permissions: this.currentPermissions(),
      canViewCost:
        this.can('inventory:receive') || this.can('inventory:adjust'),
      products,
      suppliers,
      purchases,
      payments: this.purchasing.listPayments(inventoryBusinessId),
      supplierReturns,
      settlements: this.purchasing.listSettlements(inventoryBusinessId),
      events: this.inventory.listEvents(),
      saleReceipts: [...this.saleReceipts],
      investigations: [...this.investigations],
      auditEventCount: this.auditEvents.length,
    }
  }

  eventSource(event: InventoryEvent): EventSourceView {
    const purchase = this.purchasing
      .listPurchases(inventoryBusinessId)
      .find((candidate) =>
        candidate.lines.some((line) => line.receiptEventId === event.id),
      )
    if (purchase) {
      return {
        kind: 'purchase',
        id: purchase.id,
        label: `Purchase ${purchase.id}`,
      }
    }

    const replacement = this.purchasing
      .listReturns(inventoryBusinessId)
      .find((candidate) =>
        candidate.replacementReceiptEventIds.includes(event.id),
      )
    if (replacement) {
      return {
        kind: 'replacement',
        id: replacement.id,
        label: `Replacement for return ${replacement.id}`,
      }
    }

    if (event.type === 'sale') {
      const receipt = this.saleReceipts.find(
        (candidate) => candidate.saleId === event.referenceId,
      )
      return {
        kind: 'sale',
        id: receipt?.saleId ?? event.referenceId,
        label: receipt
          ? `Sale ${receipt.saleId} · receipt ${receipt.receiptId}`
          : `Sale ${event.referenceId ?? 'reference missing'}`,
      }
    }

    const supplierReturn = this.purchasing
      .listReturns(inventoryBusinessId)
      .find((candidate) =>
        candidate.lines.some((line) => line.inventoryEventId === event.id),
      )
    if (supplierReturn) {
      return {
        kind: 'supplier_return',
        id: supplierReturn.id,
        label: `Supplier return ${supplierReturn.id}`,
      }
    }

    const investigation = this.investigations.find(
      (candidate) => candidate.adjustmentEventId === event.id,
    )
    if (investigation) {
      return {
        kind: 'investigation',
        id: investigation.id,
        label: `Investigation ${investigation.id}`,
      }
    }

    return {
      kind: event.referenceId ? 'source_reference' : 'none',
      id: event.referenceId,
      label: event.referenceId
        ? `Source ${event.referenceId}`
        : 'No source reference',
    }
  }

  stockAtEvent(event: InventoryEvent): StockLevel {
    return this.inventory.reconstruct(event.productId, event.sequence)
  }

  effectiveCostPreview(line: ReceiveLineInput): {
    totalQuantity: Quantity
    effectiveUnitCost: Money
    lineTotal: Money
  } {
    const effectiveUnitCost = effectiveAcquisitionUnitCost(line)
    const totalQuantity = line.paidQuantity + line.bonusQuantity
    return {
      totalQuantity,
      effectiveUnitCost,
      lineTotal: (totalQuantity * effectiveUnitCost) / 1000n,
    }
  }

  async createSupplier(
    input: {
      name: string
      phone?: string
      address?: string
      notes?: string
    },
    isOffline: boolean,
  ): Promise<Supplier> {
    const id = this.reference('SUP')
    return this.authorized('supplier:manage', id, isOffline, () =>
      this.purchasing.createSupplier({
        id,
        businessId: inventoryBusinessId,
        name: input.name,
        phone: input.phone,
        address: input.address,
        notes: input.notes,
      }),
    )
  }

  async receivePurchase(
    input: ReceiveInput,
    isOffline: boolean,
  ): Promise<{ purchase: PurchaseRecord; payment: SupplierPayment | null }> {
    const purchaseId = this.reference('PUR')
    const clientEventId = this.reference('client-purchase')
    const lines = input.lines.map((line) => {
      const preview = this.effectiveCostPreview(line)
      return {
        productId: line.productId,
        quantity: preview.totalQuantity,
        unitCost: preview.effectiveUnitCost,
        condition: line.condition,
      }
    })

    const purchase = await this.authorized(
      'purchase:record',
      purchaseId,
      isOffline,
      () =>
        this.purchasing.receivePurchase({
          id: purchaseId,
          businessId: inventoryBusinessId,
          supplierId: input.supplierId,
          actorId: this.actorUserId(),
          clientEventId,
          lines,
        }),
    )

    let payment: SupplierPayment | null = null
    if (input.paymentAmount > 0n) {
      payment = await this.recordPayment(
        {
          purchaseId: purchase.id,
          amount: input.paymentAmount,
          method: input.paymentMethod,
          reference: input.paymentReference,
        },
        isOffline,
      )
    }
    return { purchase, payment }
  }

  async recordPayment(
    input: {
      purchaseId: string
      amount: Money
      method: string
      reference: string | null
    },
    isOffline: boolean,
  ): Promise<SupplierPayment> {
    const id = this.reference('PAY')
    return this.authorized('supplier:payment', id, isOffline, () =>
      this.purchasing.recordPayment({
        id,
        businessId: inventoryBusinessId,
        purchaseId: input.purchaseId,
        amount: input.amount,
        method: input.method,
        reference: input.reference,
        actorId: this.actorUserId(),
        clientEventId: this.reference('client-payment'),
        state: 'confirmed_success',
      }),
    )
  }

  async requestSupplierReturn(
    input: SupplierReturnInput,
    isOffline: boolean,
  ): Promise<SupplierReturn> {
    const id = this.reference('RET')
    return this.authorized('supplier:return', id, isOffline, () =>
      this.purchasing.requestReturn({
        id,
        businessId: inventoryBusinessId,
        purchaseId: input.purchaseId,
        actorId: this.actorUserId(),
        clientEventId: this.reference('client-return'),
        reason: input.reason,
        condition: input.condition,
        lines: input.lines,
      }),
    )
  }

  async advanceSupplierReturn(
    returnId: string,
    action: 'verify' | 'approve' | 'apply',
    isOffline: boolean,
  ): Promise<SupplierReturn> {
    return this.authorized('supplier:return', returnId, isOffline, () => {
      if (action === 'verify')
        return this.purchasing.verifyReturn(inventoryBusinessId, returnId)
      if (action === 'approve')
        return this.purchasing.approveReturn(inventoryBusinessId, returnId)
      return this.purchasing.applyReturn(inventoryBusinessId, returnId)
    })
  }

  async recordReplacement(
    input: ReplacementInput,
    isOffline: boolean,
  ): Promise<SupplierReturn> {
    return this.authorized('inventory:receive', input.returnId, isOffline, () =>
      this.purchasing.recordReplacement({
        businessId: inventoryBusinessId,
        returnId: input.returnId,
        actorId: this.actorUserId(),
        clientEventId: this.reference('client-replacement'),
        lines: input.lines,
      }),
    )
  }

  async settleSupplierReturn(
    input: {
      returnId: string
      amount: Money
      method: string
      reference: string | null
      successful: boolean
    },
    isOffline: boolean,
  ): Promise<SupplierSettlement> {
    const id = this.reference('STL')
    return this.authorized(
      'supplier:settlement',
      input.returnId,
      isOffline,
      () =>
        this.purchasing.settleReturn({
          id,
          businessId: inventoryBusinessId,
          returnId: input.returnId,
          amount: input.amount,
          method: input.method,
          reference: input.reference,
          actorId: this.actorUserId(),
          clientEventId: this.reference('client-settlement'),
          state: input.successful ? 'confirmed_success' : 'failed',
        }),
    )
  }

  async recordStockCount(
    input: {
      productId: string
      physicalQuantity: Quantity
      cause: StockInvestigation['cause']
      note: string
    },
    isOffline: boolean,
  ): Promise<StockInvestigation> {
    const id = this.reference('INV')
    const systemQuantity = this.inventory.getStock(input.productId).total
    return this.authorized('inventory:adjust', id, isOffline, () => {
      const investigation: StockInvestigation = {
        id,
        businessId: inventoryBusinessId,
        productId: input.productId,
        systemQuantity,
        physicalQuantity: input.physicalQuantity,
        variance: input.physicalQuantity - systemQuantity,
        cause: input.cause,
        note: input.note,
        status: 'investigating',
        discoveredAt: new Date().toISOString(),
        actorId: this.actorUserId(),
        adjustmentEventId: null,
      }
      this.investigations.push(investigation)
      return { ...investigation }
    })
  }

  async applyStockCorrection(
    investigationId: string,
    reason: string,
    isOffline: boolean,
  ): Promise<InventoryEvent> {
    const investigation = this.investigations.find(
      (candidate) =>
        candidate.id === investigationId &&
        candidate.businessId === inventoryBusinessId,
    )
    if (!investigation) throw new Error('Investigation not found')
    if (investigation.status === 'corrected')
      throw new Error('This investigation is already corrected')
    if (investigation.variance === 0n)
      throw new Error('A zero variance cannot create a stock movement')

    return this.authorized(
      'inventory:adjust',
      investigation.id,
      isOffline,
      () =>
        this.inventory.adjust({
          businessId: inventoryBusinessId,
          productId: investigation.productId,
          quantity: investigation.variance,
          actorId: this.actorUserId(),
          reason,
          clientEventId: this.reference('client-adjustment'),
          adjustmentId: investigation.id,
          condition: 'sellable',
        }),
    ).then((event) => {
      const index = this.investigations.findIndex(
        (candidate) => candidate.id === investigation.id,
      )
      this.investigations[index] = {
        ...investigation,
        status: 'corrected',
        adjustmentEventId: event.id,
      }
      return event
    })
  }

  private productView(product: Product): ProductView {
    const stock = this.inventory.getStock(product.id)
    const valuation = this.inventory.getValuation(product.id)
    const movements = this.inventory.listEvents(product.id)
    const purchases = this.purchasing.listPurchases(inventoryBusinessId)
    const supplierIds = [
      ...new Set(
        purchases
          .filter((purchase) =>
            purchase.lines.some((line) => line.productId === product.id),
          )
          .map((purchase) => purchase.supplierId),
      ),
    ]
    const replacementCost = valuation.latestReliableAcquisitionCost
    return {
      product,
      stock,
      valuation,
      lastMovement: movements.at(-1) ?? null,
      supplierIds,
      replacementCost,
      sellingBelowReplacementCost:
        replacementCost !== null &&
        BigInt(product.sellingPriceKobo) < replacementCost,
    }
  }

  private supplierView(supplier: Supplier): SupplierView {
    const purchases = this.purchasing
      .listPurchases(inventoryBusinessId)
      .filter((purchase) => purchase.supplierId === supplier.id)
    return {
      supplier,
      outstanding: this.purchasing.supplierOutstanding(
        inventoryBusinessId,
        supplier.id,
      ),
      purchaseCount: purchases.length,
      productIds: [
        ...new Set(
          purchases.flatMap((purchase) =>
            purchase.lines.map((line) => line.productId),
          ),
        ),
      ],
    }
  }

  private purchaseView(purchase: PurchaseRecord): PurchaseView {
    const supplier =
      this.purchasing
        .listSuppliers(inventoryBusinessId)
        .find((candidate) => candidate.id === purchase.supplierId) ?? null
    const payments = this.purchasing
      .listPayments(inventoryBusinessId)
      .filter((payment) => payment.purchaseId === purchase.id)
    const paid = payments
      .filter((payment) => payment.state === 'confirmed_success')
      .reduce((sum, payment) => sum + payment.amount, 0n)
    return {
      purchase,
      supplier,
      payments,
      paid,
      outstanding: purchase.total - paid,
    }
  }

  private supplierReturnView(
    supplierReturn: SupplierReturn,
  ): SupplierReturnView {
    const purchase =
      this.purchasing
        .listPurchases(inventoryBusinessId)
        .find((candidate) => candidate.id === supplierReturn.purchaseId) ?? null
    const supplier =
      this.purchasing
        .listSuppliers(inventoryBusinessId)
        .find((candidate) => candidate.id === supplierReturn.supplierId) ?? null
    return {
      supplierReturn,
      purchase,
      supplier,
      replacementEvents: this.inventory
        .listEvents()
        .filter((event) =>
          supplierReturn.replacementReceiptEventIds.includes(event.id),
        ),
      settlements: this.purchasing
        .listSettlements(inventoryBusinessId)
        .filter((settlement) => settlement.returnId === supplierReturn.id),
    }
  }

  private currentPermissions(): readonly Permission[] {
    const session = this.sessions.get(this.actorId)
    const membership = session?.memberships.find(
      (candidate) =>
        candidate.businessId === session.activeBusinessId && candidate.active,
    )
    return membership ? [...effectivePermissions(membership)] : []
  }

  private actorUserId(): string {
    return this.sessions.get(this.actorId)!.user.userId
  }

  private reference(prefix: string): string {
    this.nextReference += 1
    return `${prefix}-${this.nextReference}`
  }

  private authorized<T>(
    permission: Permission,
    targetRecordId: string,
    isOffline: boolean,
    perform: () => T,
  ): Promise<T> {
    return executeAuthorized<T>({
      session: this.sessions.get(this.actorId) ?? null,
      request: {
        permission,
        businessId: inventoryBusinessId,
        targetBusinessId: inventoryBusinessId,
        targetRecordId,
        requesterUserId: this.actorUserId(),
        isOffline,
      },
      audit: this.auditSink,
      perform,
    })
  }

  private readonly auditSink: AuditSink = {
    append: (event) => {
      this.auditEvents.push(event)
    },
  }

  private seedReferenceOperations(): void {
    const products = [
      {
        id: 'prod-rice',
        sku: 'SG-RICE-50',
        name: 'Rice — 50kg bag',
        category: 'Foodstuff',
        unit: 'bag',
        aliases: ['rice bag'],
        sellingPriceKobo: 6_500_000,
        priceFloorKobo: 5_800_000,
        active: true,
        availableForSale: true,
      },
      {
        id: 'prod-oil',
        sku: 'SG-OIL-5L',
        name: 'Cooking oil — 5 litres',
        category: 'Foodstuff',
        unit: 'bottle',
        aliases: ['vegetable oil'],
        sellingPriceKobo: 950_000,
        priceFloorKobo: 850_000,
        active: true,
        availableForSale: true,
      },
      {
        id: 'prod-detergent',
        sku: 'SG-DET-1L',
        name: 'Detergent — 1 litre',
        category: 'Household',
        unit: 'bottle',
        aliases: ['soap'],
        sellingPriceKobo: 350_000,
        priceFloorKobo: 300_000,
        active: true,
        availableForSale: true,
      },
    ]
    for (const product of products) this.catalog.createProduct(product)

    this.purchasing.createSupplier({
      id: 'supplier-lagos',
      businessId: inventoryBusinessId,
      name: 'Lagos Wholesale Foods',
      phone: '08030000001',
      address: '12 Market Road, Lagos',
      notes: 'Weekly foodstuff delivery.',
    })
    this.purchasing.createSupplier({
      id: 'supplier-prime',
      businessId: inventoryBusinessId,
      name: 'Prime Cleaning Supplies',
      phone: '08030000002',
      address: '4 Industrial Avenue, Lagos',
      notes: 'Cleaning products and replacements.',
    })

    const purchaseOne = this.purchasing.receivePurchase({
      id: 'PUR-1001',
      businessId: inventoryBusinessId,
      supplierId: 'supplier-lagos',
      actorId: 'user-ngozi',
      clientEventId: 'seed-purchase-1001',
      occurredAt: '2026-09-06T09:00:00.000Z',
      lines: [
        {
          productId: 'prod-rice',
          quantity: 10_000n,
          unitCost: 5_200_000n,
        },
        {
          productId: 'prod-oil',
          quantity: 6_000n,
          unitCost: 980_000n,
        },
      ],
    })
    this.purchasing.recordPayment({
      id: 'PAY-1001',
      businessId: inventoryBusinessId,
      purchaseId: purchaseOne.id,
      amount: 30_000_000n,
      method: 'transfer',
      reference: 'TRF-991',
      actorId: 'user-ngozi',
      clientEventId: 'seed-payment-1001',
      state: 'confirmed_success',
      occurredAt: '2026-09-06T10:00:00.000Z',
    })

    const purchaseTwo = this.purchasing.receivePurchase({
      id: 'PUR-1002',
      businessId: inventoryBusinessId,
      supplierId: 'supplier-prime',
      actorId: 'user-ngozi',
      clientEventId: 'seed-purchase-1002',
      occurredAt: '2026-09-06T09:30:00.000Z',
      lines: [
        {
          productId: 'prod-detergent',
          quantity: 12_000n,
          unitCost: 270_000n,
        },
      ],
    })
    this.purchasing.recordPayment({
      id: 'PAY-1002',
      businessId: inventoryBusinessId,
      purchaseId: purchaseTwo.id,
      amount: purchaseTwo.total,
      method: 'cash',
      reference: 'CASH-990',
      actorId: 'user-ngozi',
      clientEventId: 'seed-payment-1002',
      state: 'confirmed_success',
      occurredAt: '2026-09-06T10:15:00.000Z',
    })

    const sale = this.inventory.sell({
      businessId: inventoryBusinessId,
      productId: 'prod-rice',
      quantity: 11_000n,
      actorId: 'user-chidi',
      reason: 'Shop sale',
      clientEventId: 'seed-sale-9001',
      saleId: 'SAL-9001',
      unitPrice: 6_500_000n,
      occurredAt: '2026-09-07T11:20:00.000Z',
    })
    this.saleReceipts.push(sale.receipt)

    const supplierReturn = this.purchasing.requestReturn({
      id: 'RET-4001',
      businessId: inventoryBusinessId,
      purchaseId: purchaseTwo.id,
      actorId: 'user-ngozi',
      clientEventId: 'seed-return-4001',
      reason: 'Two bottles leaked inside the carton.',
      condition: 'held',
      lines: [{ productId: 'prod-detergent', quantity: 2_000n }],
    })
    this.purchasing.verifyReturn(inventoryBusinessId, supplierReturn.id)
    this.purchasing.approveReturn(inventoryBusinessId, supplierReturn.id)
    this.purchasing.applyReturn(inventoryBusinessId, supplierReturn.id)
    this.purchasing.recordReplacement({
      businessId: inventoryBusinessId,
      returnId: supplierReturn.id,
      actorId: 'user-ngozi',
      clientEventId: 'seed-replacement-4001',
      lines: [
        { productId: 'prod-detergent', quantity: 2_000n, unitCost: 270_000n },
      ],
    })
  }
}
