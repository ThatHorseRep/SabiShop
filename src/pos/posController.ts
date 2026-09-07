import type { Product } from '../domain/catalogPricing'
import type { Customer } from '../domain/customersCredit'
import type { StockLevel } from '../domain/inventory'
import type {
  CompletedSale,
  PaymentClassification,
  PaymentMethod,
} from '../domain/sales'
import type { TaxMode } from '../domain/finance'
import {
  InMemorySyncServer,
  LocalStorageStore,
  MemoryStorage,
  SyncCoordinator,
  type DurableStore,
  type SyncOperation,
} from '../sync/offlineSync'
import { createPosEngines, type PosEngines } from './posData'
import { posBusiness, posDeviceId, type PosActor } from './posSession'

export type ProductSearchResult = {
  product: Product
  stock: StockLevel
}

export type CustomerCreditSnapshot = {
  customer: Customer
  outstandingKobo: number
  creditLimitKobo?: number
}

export type CreditAssessment = {
  status: 'customer_required' | 'not_allowed' | 'restricted' | 'eligible'
  overLimit: boolean
  outstandingKobo: number
  creditLimitKobo?: number
  projectedKobo: number
}

export type DraftLineInput = {
  lineId: string
  productId: string
  quantity: number
  unitPriceKobo?: number
  discount?: {
    kind: 'percentage' | 'fixed'
    value: number
    reason?: string
  }
  pricingApproval?: {
    approverId: string
    approverRole: 'manager' | 'owner'
    reason: string
  }
}

export type ResolvedPayment = {
  id: string
  method: PaymentMethod
  customMethodId?: string
  amountKobo: number
  confirmedBy: string
  externalReference?: string
}

export type CompleteSaleInput = {
  actor: PosActor
  clientRequestId: string
  lines: readonly DraftLineInput[]
  payments: readonly ResolvedPayment[]
  customer?: { id: string; name: string; phone: string }
  taxRateBasisPoints: bigint
  taxMode: TaxMode
  creditApproval?: { approverId: string; approverRole: 'manager' | 'owner' }
  overLimitApproval?: {
    approverId: string
    approverRole: 'manager' | 'owner'
  }
}

export type CustomPaymentMethod = {
  id: string
  label: string
  classification: PaymentClassification
}

const customPaymentMethods: readonly CustomPaymentMethod[] = [
  { id: 'ussd-transfer', label: 'USSD Transfer', classification: 'non_cash' },
]

/**
 * Composition root for the POS workspace. The UI never re-implements domain
 * rules: search, pricing previews, totals, credit assessment, completion,
 * and offline envelopes all delegate to the tested engines and the shared
 * sync boundary.
 */
export class PosController {
  readonly engines: PosEngines
  /** True when the browser store could not be used and work is session-only. */
  readonly storageUnavailable: boolean
  private readonly coordinator: SyncCoordinator
  private readonly server = new InMemorySyncServer({
    authorize: () => true,
    apply: () => ({ acknowledgedAt: new Date().toISOString() }),
  })

  constructor(store?: DurableStore) {
    this.engines = createPosEngines()
    let durableStore: DurableStore
    let storageUnavailable = false
    if (store) {
      durableStore = store
    } else {
      try {
        durableStore = new LocalStorageStore(window.localStorage)
      } catch {
        durableStore = new MemoryStorage()
        storageUnavailable = true
      }
    }
    try {
      this.coordinator = new SyncCoordinator(durableStore)
    } catch {
      // Corrupt local state is preserved for investigation; fall back to a
      // session-scoped queue rather than replacing it (Handoff 14).
      this.coordinator = new SyncCoordinator(new MemoryStorage())
      storageUnavailable = true
    }
    this.storageUnavailable = storageUnavailable
  }

  listCustomPaymentMethods(): readonly CustomPaymentMethod[] {
    return customPaymentMethods
  }

  searchProducts(query: string): ProductSearchResult[] {
    return this.engines.pricing.searchProducts(query).map((product) => ({
      product,
      stock: this.engines.inventory.getStock(product.id),
    }))
  }

  previewLine(line: Omit<DraftLineInput, 'lineId' | 'pricingApproval'>) {
    return this.engines.pricing.previewSaleLine(line)
  }

  previewTotals(
    lines: ReadonlyArray<{ unitPriceKobo: number; quantity: number }>,
    taxRateBasisPoints: bigint,
    taxMode: TaxMode,
  ) {
    return this.engines.sales.previewTotals({
      lines,
      taxRateBasisPoints,
      taxMode,
    })
  }

  searchCustomers(query: string): CustomerCreditSnapshot[] {
    const normalized = query.trim().toLocaleLowerCase()
    return this.engines.customers
      .listCustomers(posBusiness.id)
      .filter(
        (customer) =>
          normalized.length === 0 ||
          customer.name.toLocaleLowerCase().includes(normalized) ||
          customer.phone.includes(normalized),
      )
      .map((customer) => ({
        customer,
        outstandingKobo: Number(
          this.engines.customers.getOutstandingForCustomer(
            posBusiness.id,
            customer.id,
          ).minor,
        ),
        creditLimitKobo:
          customer.creditLimitMinor !== undefined
            ? Number(customer.creditLimitMinor)
            : undefined,
      }))
  }

  createCustomer(input: {
    actor: PosActor
    name: string
    phone: string
    customerId: string
  }): Customer {
    return this.engines.customers.createCustomer({
      businessId: posBusiness.id,
      id: input.customerId,
      name: input.name,
      phone: input.phone,
      // New POS customers are credit-eligible with a zero limit: the first
      // credit sale always requires a management over-limit exception.
      creditStatus: 'allowed',
      creditLimitMinor: 0n,
      actorId: input.actor.id,
    })
  }

  assessCredit(input: {
    customerId?: string
    amountKobo: number
  }): CreditAssessment {
    if (!input.customerId || input.amountKobo <= 0) {
      return {
        status: 'customer_required',
        overLimit: false,
        outstandingKobo: 0,
        projectedKobo: input.amountKobo,
      }
    }
    const customer = this.engines.customers.getCustomer(
      posBusiness.id,
      input.customerId,
    )
    if (!customer) {
      return {
        status: 'customer_required',
        overLimit: false,
        outstandingKobo: 0,
        projectedKobo: input.amountKobo,
      }
    }
    const outstandingKobo = Number(
      this.engines.customers.getOutstandingForCustomer(
        posBusiness.id,
        customer.id,
      ).minor,
    )
    const creditLimitKobo =
      customer.creditLimitMinor !== undefined
        ? Number(customer.creditLimitMinor)
        : undefined
    const projectedKobo = outstandingKobo + input.amountKobo
    const overLimit =
      creditLimitKobo !== undefined && projectedKobo > creditLimitKobo
    let status: CreditAssessment['status'] = 'eligible'
    if (customer.creditStatus === 'blocked') status = 'not_allowed'
    else if (customer.creditStatus === 'restricted') status = 'restricted'
    return {
      status,
      overLimit,
      outstandingKobo,
      creditLimitKobo,
      projectedKobo,
    }
  }

  completeSale(input: CompleteSaleInput): CompletedSale {
    const sale = this.engines.sales.complete({
      businessId: posBusiness.id,
      id: input.clientRequestId,
      clientRequestId: input.clientRequestId,
      actorId: input.actor.id,
      actorRole: input.actor.role,
      lines: input.lines.map((line) => ({
        id: line.lineId,
        productId: line.productId,
        quantity: line.quantity,
        unitPriceKobo: line.unitPriceKobo,
        discount: line.discount,
        pricingAuthorization: line.pricingApproval
          ? {
              actorId: input.actor.id,
              role: line.pricingApproval.approverRole,
              approvedBy: line.pricingApproval.approverId,
              reason: line.pricingApproval.reason,
            }
          : undefined,
      })),
      payments: input.payments.map((payment) => ({
        id: payment.id,
        method: payment.method,
        amountKobo: payment.amountKobo,
        customMethodId: payment.customMethodId,
        confirmation: {
          state: 'confirmed_success' as const,
          confirmedBy: payment.confirmedBy,
          externalReference: payment.externalReference,
        },
      })),
      customer: input.customer,
      creditApproval: input.creditApproval,
      taxRateBasisPoints: input.taxRateBasisPoints,
      taxMode: input.taxMode,
    })
    if (sale.creditKobo > 0 && input.customer && input.creditApproval) {
      this.engines.customers.recordCreditSale({
        businessId: posBusiness.id,
        customerId: input.customer.id,
        debtId: `debt:${input.clientRequestId}`,
        saleId: sale.id,
        amountMinor: BigInt(sale.creditKobo),
        actorId: input.actor.id,
        actorRole: input.actor.role,
        clientEventId: `credit:${input.clientRequestId}`,
        creditApproval: input.creditApproval,
        overLimitApproval: input.overLimitApproval,
      })
    }
    return sale
  }

  /**
   * Records a durable sync envelope for a sale completed while offline. The
   * business effects were already validated and applied locally; this queue
   * preserves the operation for authoritative revalidation on delivery.
   */
  enqueueOfflineSale(
    sale: CompletedSale,
    actor: PosActor,
    authorizationState: 'not_required' | 'approved',
  ): SyncOperation {
    return this.coordinator.enqueue({
      operationId: `sale-complete:${sale.clientRequestId}`,
      businessId: posBusiness.id,
      deviceId: posDeviceId,
      actorUserId: actor.id,
      type: 'sale.complete',
      createdAt: sale.completedAt,
      businessState: 'completed',
      paymentState: 'confirmed',
      authorizationState,
      payload: {
        saleId: sale.id,
        clientRequestId: sale.clientRequestId,
        totalDueKobo: sale.totalDueKobo,
        taxKobo: sale.taxKobo,
        cashKobo: sale.cashKobo,
        nonCashKobo: sale.nonCashKobo,
        creditKobo: sale.creditKobo,
        customer: sale.customer ?? null,
        lineCount: sale.lines.length,
        completedAt: sale.completedAt,
      },
    })
  }

  async synchronize(): Promise<SyncOperation[]> {
    return this.coordinator.sync(this.server, posBusiness.id)
  }

  listOperations(): SyncOperation[] {
    return this.coordinator.list(posBusiness.id)
  }

  getOperation(operationId: string): SyncOperation | undefined {
    return this.coordinator.get(posBusiness.id, operationId)
  }

  pendingOperationCount(): number {
    return this.listOperations().filter((operation) =>
      ['LOCAL_ONLY', 'PENDING_SYNC', 'FAILED'].includes(operation.syncState),
    ).length
  }

  conflictOperationCount(): number {
    return this.listOperations().filter(
      (operation) => operation.syncState === 'CONFLICT',
    ).length
  }
}

export function createPosController(store?: DurableStore): PosController {
  return new PosController(store)
}
