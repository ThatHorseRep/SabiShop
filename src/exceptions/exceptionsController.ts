import { executeAuthorized } from '../auth/server'
import { effectivePermissions } from '../auth/policy'
import type {
  AuditSink,
  AuthorizationAuditEvent,
  AuthSession,
  Permission,
} from '../auth/types'
import { CatalogPricing, type Product } from '../domain/catalogPricing'
import { CustomersCreditEngine } from '../domain/customersCredit'
import { InventoryEngine, quantity } from '../domain/inventory'
import {
  PurchasingEngine,
  type PurchaseRecord,
  type Supplier,
  type SupplierPayment,
  type SupplierReturn,
  type SupplierSettlement,
} from '../domain/purchasing'
import {
  ReturnsCorrectionsEngine,
  type CorrectionChange,
  type CorrectionSeverity,
  type IntegrityAuditEvent,
  type ReturnRecord,
} from '../domain/returnsCorrections'
import {
  SalesTransactionEngine,
  type CompletedSale,
  type PaymentMethod,
} from '../domain/sales'
import {
  CashReconciliationEngine,
  type CashAuditEvent,
  type CashEvent,
  type CashEventKind,
  type CashReconciliationSnapshot,
  type InterimCashCount,
} from '../domain/cashReconciliation'
import {
  posActors,
  posBusiness,
  posDeviceId,
  type PosActor,
} from '../pos/posSession'

export const exceptionsBusinessId = posBusiness.id

export type ExceptionActor = PosActor
export type ExceptionActorId = PosActor['id']

export const exceptionActors: readonly ExceptionActor[] = posActors

export type ExceptionApprovalInput = {
  approverId: string
  approverRole: 'manager' | 'owner'
}

export type WorkspaceTabId =
  | 'review'
  | 'returns'
  | 'supplier-returns'
  | 'corrections'
  | 'reconciliation'
  | 'history'

export type SaleDerivedState =
  'completed' | 'partially_returned' | 'fully_returned' | 'reversed'

export type SaleExceptionView = {
  sale: CompletedSale
  derivedState: SaleDerivedState
  stateLabel: string
  returnedByLineId: Record<string, number>
  returnIds: string[]
  correctionCount: number
  windowOpen: boolean
  windowRemainingMinutes: number
  creditLink: { customerId: string; debtId: string } | null
  canReverse: boolean
  reversalRequirement: string
}

export type SaleReturnNextAction =
  'verify' | 'approve' | 'reject' | 'apply' | 'settle'

export type SaleReturnView = {
  record: ReturnRecord
  sale: SaleExceptionView
  nextActions: Array<{
    action: SaleReturnNextAction
    label: string
    permitted: boolean
    note: string
  }>
}

export type SupplierReturnCaseView = {
  record: SupplierReturn
  purchase: PurchaseRecord | null
  supplier: Supplier | null
  settlementSemantics: 'payable_reduction' | 'supplier_credit'
  settlements: SupplierSettlement[]
  nextActions: Array<{
    action: 'verify' | 'approve' | 'apply' | 'replacement' | 'settle'
    label: string
    permitted: boolean
    note: string
  }>
}

export type PurchaseOptionView = {
  purchase: PurchaseRecord
  supplier: Supplier | null
  payments: SupplierPayment[]
  paidKobo: number
  outstandingKobo: number
  fullyPaid: boolean
}

export type CashNextAction =
  | 'confirm-opening'
  | 'count'
  | 'interim-count'
  | 'prepare'
  | 'confirm'
  | 'close'
  | 'reopen'
  | 'resolve'

export type CashSessionView = {
  snapshot: CashReconciliationSnapshot
  events: CashEvent[]
  interimCounts: InterimCashCount[]
  audits: CashAuditEvent[]
  cashInHand: {
    valueKobo: number
    basis: 'expected_not_counted' | 'counted'
    countedAt?: string
    countedBy?: string
  }
  paymentTotals: Array<{
    method: PaymentMethod
    label: string
    totalKobo: number
  }>
  nextActions: Array<{
    action: CashNextAction
    label: string
    permitted: boolean
    note: string
  }>
}

export type ReviewItemKind =
  | 'sale_return'
  | 'supplier_return'
  | 'refund'
  | 'owner_review'
  | 'cash_discrepancy'

export type ReviewItemView = {
  id: string
  kind: ReviewItemKind
  title: string
  whatHappened: string
  whyAttention: string
  affectedArea: string
  consequence: string
  requestedAction: string
  requiredAuthority: string
  occurredAt: string
  target: { tab: WorkspaceTabId; recordId: string }
  primaryAction: {
    kind: 'verify' | 'approve' | 'reject' | 'apply' | 'settle' | 'resolve'
    label: string
  } | null
}

export type HistoryEventKind =
  | 'sale'
  | 'sale_return'
  | 'correction'
  | 'reversal'
  | 'supplier_return'
  | 'cash'
  | 'authorization'

export type HistoryEventView = {
  id: string
  at: string
  kind: HistoryEventKind
  title: string
  actorId: string
  actorRole: string
  reason?: string
  detail?: string
  targetId?: string
}

export type ExceptionsSnapshot = {
  actor: ExceptionActor
  permissions: readonly Permission[]
  products: Product[]
  sales: SaleExceptionView[]
  returns: SaleReturnView[]
  supplierReturns: SupplierReturnCaseView[]
  purchaseOptions: PurchaseOptionView[]
  corrections: IntegrityAuditEvent[]
  cash: CashSessionView
  review: ReviewItemView[]
  history: HistoryEventView[]
  auditEventCount: number
}

export type SaleReturnRequestInput = {
  saleId: string
  reason: string
  lines: Array<{ lineId: string; quantity: number }>
}

export type SupplierReturnRequestInput = {
  purchaseId: string
  reason: string
  condition: 'sellable' | 'held'
  lines: Array<{ productId: string; quantity: number }>
}

export type SupplierReplacementInput = {
  returnId: string
  lines: Array<{ productId: string; quantity: number; unitCostKobo: number }>
}

export type SupplierSettlementInput = {
  returnId: string
  amountKobo: number
  method: string
  reference: string | null
}

export type SaleCorrectionRequestInput = {
  saleId: string
  reason: string
  change: CorrectionChange
  approval?: ExceptionApprovalInput
}

export type SaleReversalRequestInput = {
  saleId: string
  reason: string
  approval?: ExceptionApprovalInput
}

export type ReturnPreview = {
  lines: Array<{
    lineId: string
    productId: string
    productName: string
    quantity: number
    valueKobo: number
  }>
  totalValueKobo: number
  effects: string[]
}

export type CorrectionPreview = {
  severity: CorrectionSeverity
  originalTotalKobo: number
  correctedTotalKobo: number
  differenceKobo: number
  effects: string[]
}

/** Reference session adapter shared with the other workspaces. */
const sessionForActor = (actor: ExceptionActor): AuthSession => {
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
        businessId: exceptionsBusinessId,
        roles: [actor.role],
        active: true,
      },
    ],
    activeBusinessId: exceptionsBusinessId,
    issuedAt: now,
    expiresAt: now + 8 * 60 * 60 * 1000,
  }
}

const isManagement = (actor: ExceptionActor) =>
  actor.role === 'manager' || actor.role === 'owner'

const severityForChange = (change: CorrectionChange): CorrectionSeverity => {
  if (change.field === 'note') return 'ordinary'
  if (
    change.field === 'customer_identity' ||
    change.field === 'salesperson_attribution'
  )
    return 'high_integrity'
  return 'material'
}

const minutesSince = (from: string, to = Date.now()): number =>
  (to - Date.parse(from)) / 60_000

const paymentMethodLabel = (method: PaymentMethod): string =>
  method === 'cash'
    ? 'Cash'
    : method === 'bank_transfer'
      ? 'Transfer'
      : method === 'pos_card'
        ? 'POS / Card'
        : method === 'customer_credit'
          ? 'Credit'
          : 'Other'

type SupplierReturnTrace = {
  id: string
  returnId: string
  type: string
  at: string
  actorId: string
  note?: string
}

function humanizeCashEventType(type: string): string {
  switch (type) {
    case 'business_day.opened':
      return 'Business day opened'
    case 'opening_cash.entered':
      return 'Opening cash entered'
    case 'opening_cash.confirmed':
      return 'Opening cash confirmed'
    case 'cash.cash_in.recorded':
      return 'Cash in recorded'
    case 'cash.cash_out.recorded':
      return 'Cash out recorded'
    case 'cash.cash_sale.recorded':
      return 'Cash sale recorded'
    case 'cash.cash_refund.recorded':
      return 'Cash refund recorded'
    case 'cash.interim_count.recorded':
      return 'Interim count recorded'
    case 'cash.actual_count.recorded':
      return 'Physical cash count recorded'
    case 'reconciliation.prepared':
      return 'Reconciliation prepared'
    case 'reconciliation.management_confirmed':
      return 'Reconciliation confirmed'
    case 'business_day.closed':
      return 'Business day closed'
    case 'reconciliation.reopened':
      return 'Business day reopened'
    case 'reconciliation.discrepancy.resolved':
      return 'Discrepancy resolved'
    default:
      return type
  }
}

/**
 * Composition seam for the C09 Exceptions & Reconciliation workspace.
 * Screens render engine output only: every mutation passes the
 * authoritative authorization boundary first, then the verified domain
 * engines (returns/corrections, purchasing, cash reconciliation) that own
 * the business rules, audit evidence, and state transitions.
 */
export class ExceptionsController {
  private readonly catalog = new CatalogPricing()
  private readonly inventory = new InventoryEngine()
  private readonly sales = new SalesTransactionEngine(
    this.catalog,
    this.inventory,
  )
  private readonly credit = new CustomersCreditEngine()
  private readonly returnsCorrections = new ReturnsCorrectionsEngine({
    sales: this.sales,
    inventory: this.inventory,
    credit: this.credit,
  })
  private readonly purchasing = new PurchasingEngine(this.inventory)
  private readonly cash = new CashReconciliationEngine()
  private readonly sessions = new Map<ExceptionActorId, AuthSession>()
  private readonly auditEvents: AuthorizationAuditEvent[] = []
  private readonly saleReturnIds: string[] = []
  private readonly supplierReturnTraces: SupplierReturnTrace[] = []
  private readonly creditLinks = new Map<
    string,
    { customerId: string; debtId: string }
  >()
  private readonly cashSessionId = 'BD-current'
  private actorId: ExceptionActorId = 'user-ngozi'
  private nextReference = 7000

  constructor() {
    for (const actor of exceptionActors) {
      this.sessions.set(actor.id, sessionForActor(actor))
    }
    this.seedReferenceOperations()
  }

  setActor(actorId: ExceptionActorId): void {
    if (!this.sessions.has(actorId)) throw new Error('Unknown actor')
    this.actorId = actorId
  }

  getActor(): ExceptionActor {
    return exceptionActors.find((actor) => actor.id === this.actorId)!
  }

  can(permission: Permission): boolean {
    const session = this.sessions.get(this.actorId)
    if (!session) return false
    const membership = session.memberships.find(
      (candidate) =>
        candidate.businessId === exceptionsBusinessId && candidate.active,
    )
    return membership ? effectivePermissions(membership).has(permission) : false
  }

  /** Every mutation passes the authorization boundary before the engine. */
  private async run<T>(
    permission: Permission,
    targetRecordId: string,
    perform: () => T | Promise<T>,
  ): Promise<T> {
    const session = this.sessions.get(this.actorId)!
    return executeAuthorized({
      session,
      request: {
        permission,
        businessId: exceptionsBusinessId,
        targetBusinessId: exceptionsBusinessId,
        targetRecordId,
        requesterUserId: session.user.userId,
        deviceId: posDeviceId,
      },
      audit: this.auditSink(),
      perform,
    })
  }

  private auditSink(): AuditSink {
    const events = this.auditEvents
    return {
      append: (event) => {
        events.push(event)
      },
    }
  }

  private reference(prefix: string): string {
    return `${prefix}-${this.nextReference++}`
  }

  // ------------------------------------------------------------------
  // Sale returns
  // ------------------------------------------------------------------

  async requestSaleReturn(
    input: SaleReturnRequestInput,
  ): Promise<ReturnRecord> {
    const actor = this.getActor()
    const saleView = this.saleViewById(input.saleId)
    if (!saleView) throw new Error('Sale was not found')
    const returnId = this.reference('RET')
    const record = await this.run('business:work', input.saleId, () =>
      this.returnsCorrections.requestReturn({
        businessId: exceptionsBusinessId,
        saleId: input.saleId,
        returnId,
        clientEventId: this.reference('evt'),
        requestedById: actor.id,
        requestedByRole: actor.role,
        reason: input.reason,
        lines: input.lines.map((line) => {
          const saleLine = saleView.sale.lines.find(
            (candidate) => candidate.id === line.lineId,
          )!
          return {
            lineId: line.lineId,
            productId: saleLine.productId,
            quantity: line.quantity,
          }
        }),
        customerId: saleView.creditLink?.customerId,
        debtId: saleView.creditLink?.debtId,
      }),
    )
    this.saleReturnIds.push(record.id)
    return record
  }

  async verifySaleReturn(returnId: string): Promise<ReturnRecord> {
    const actor = this.getActor()
    return this.run('return:approve', returnId, () =>
      this.returnsCorrections.verifyReturn(
        exceptionsBusinessId,
        returnId,
        actor.id,
        actor.role,
      ),
    )
  }

  async approveSaleReturn(
    returnId: string,
    condition: 'sellable' | 'held',
  ): Promise<ReturnRecord> {
    const actor = this.getActor()
    return this.run('return:approve', returnId, () =>
      this.returnsCorrections.approveReturn(
        exceptionsBusinessId,
        returnId,
        actor.id,
        actor.role,
        { condition },
      ),
    )
  }

  async rejectSaleReturn(returnId: string): Promise<ReturnRecord> {
    const actor = this.getActor()
    return this.run('return:approve', returnId, () =>
      this.returnsCorrections.rejectReturn(
        exceptionsBusinessId,
        returnId,
        actor.id,
        actor.role,
      ),
    )
  }

  async applySaleReturn(returnId: string): Promise<ReturnRecord> {
    const actor = this.getActor()
    return this.run('return:process', returnId, () =>
      this.returnsCorrections.applyReturn(
        exceptionsBusinessId,
        returnId,
        actor.id,
        actor.role,
      ),
    )
  }

  async settleRefund(
    returnId: string,
    settlement: { method: PaymentMethod; externalReference?: string },
  ): Promise<ReturnRecord> {
    const actor = this.getActor()
    return this.run('return:process', returnId, () =>
      this.returnsCorrections.settleRefund(
        exceptionsBusinessId,
        returnId,
        actor.id,
        settlement,
      ),
    )
  }

  previewSaleReturn(
    saleId: string,
    lines: Array<{ lineId: string; quantity: number }>,
  ): ReturnPreview {
    const view = this.saleViewById(saleId)
    if (!view) throw new Error('Sale was not found')
    const previewLines = lines
      .filter((line) => line.quantity > 0)
      .map((line) => {
        const saleLine = view.sale.lines.find(
          (candidate) => candidate.id === line.lineId,
        )
        if (!saleLine) throw new Error('Return line does not match the sale')
        return {
          lineId: saleLine.id,
          productId: saleLine.productId,
          productName: this.productName(saleLine.productId),
          quantity: line.quantity,
          valueKobo: saleLine.unitPriceKobo * line.quantity,
        }
      })
    const totalValueKobo = previewLines.reduce(
      (sum, line) => sum + line.valueKobo,
      0,
    )
    const effects: string[] = [
      'Returned goods re-enter stock in the recorded condition; the original sale stays in history unchanged.',
      'Reported revenue, tax, COGS and gross profit are recalculated by the return value.',
    ]
    if (view.creditLink) {
      effects.push(
        "The customer's outstanding obligation is reduced by the approved return value; repayments already received stay in history.",
      )
    } else {
      effects.push(
        'A refund becomes due for the approved value. Sabi Shop records the settlement; it does not move the money.',
      )
    }
    effects.push(
      "The original salesperson's attribution is not replaced; provisional incentives recalculate.",
    )
    return { lines: previewLines, totalValueKobo, effects }
  }

  // ------------------------------------------------------------------
  // Corrections and reversals
  // ------------------------------------------------------------------

  async correctSale(
    input: SaleCorrectionRequestInput,
  ): Promise<IntegrityAuditEvent> {
    const actor = this.getActor()
    const severity = severityForChange(input.change)
    const permission: Permission =
      severity === 'ordinary' ? 'correction:request' : 'correction:approve'
    await this.run(permission, input.saleId, () =>
      this.returnsCorrections.correctSale({
        businessId: exceptionsBusinessId,
        saleId: input.saleId,
        clientEventId: this.reference('evt'),
        actorId: actor.id,
        actorRole: actor.role,
        reason: input.reason,
        change: input.change,
        approval: input.approval,
      }),
    )
    const event = this.returnsCorrections
      .listAuditEvents()
      .filter(
        (candidate) =>
          candidate.saleId === input.saleId &&
          candidate.type === 'sale.correction.applied',
      )
      .at(-1)!
    return event
  }

  async reverseSale(
    input: SaleReversalRequestInput,
  ): Promise<IntegrityAuditEvent> {
    const actor = this.getActor()
    await this.run('correction:approve', input.saleId, () =>
      this.returnsCorrections.reverseSale({
        businessId: exceptionsBusinessId,
        saleId: input.saleId,
        clientEventId: this.reference('evt'),
        actorId: actor.id,
        actorRole: actor.role,
        reason: input.reason,
        approval: input.approval,
      }),
    )
    const event = this.returnsCorrections
      .listAuditEvents()
      .filter(
        (candidate) =>
          candidate.saleId === input.saleId &&
          candidate.type === 'sale.reversal.applied',
      )
      .at(-1)!
    return event
  }

  previewCorrection(
    saleId: string,
    change: CorrectionChange,
  ): CorrectionPreview {
    const view = this.saleViewById(saleId)
    if (!view) throw new Error('Sale was not found')
    const original = view.sale.totalDueKobo
    let corrected = original
    if (change.field === 'quantity') {
      corrected = view.sale.lines.reduce((sum, line) => {
        const quantity =
          line.id === change.lineId ? change.correctedQuantity : line.quantity
        return sum + quantity * line.unitPriceKobo
      }, 0)
    }
    const severity = severityForChange(change)
    const effects: string[] = []
    if (change.field === 'note') {
      effects.push(
        'Only the note changes. No money, stock, debt, or attribution effect.',
      )
    } else {
      effects.push(
        'The original sale remains in history; a corrective event records the accepted change.',
      )
    }
    if (change.field === 'quantity') {
      effects.push(
        'Stock and weighted-average cost are adjusted by the quantity difference.',
      )
      effects.push(
        'Revenue, tax, COGS, and gross profit are recalculated for reporting.',
      )
    }
    if (change.field === 'payment_amount') {
      effects.push(
        'The original payment event stays in history; the corrected amount changes the accepted cash/debt state.',
      )
      effects.push(
        'Reconciliation effects change for the affected payment method.',
      )
    }
    if (change.field === 'customer_identity') {
      effects.push(
        'Customer identity is protected: the original association stays recoverable and the change requires elevated authority.',
      )
    }
    if (change.field === 'salesperson_attribution') {
      effects.push(
        'Salesperson attribution is protected: the original attribution stays recoverable and incentive effects are re-derived.',
      )
    }
    return {
      severity,
      originalTotalKobo: original,
      correctedTotalKobo: corrected,
      differenceKobo: corrected - original,
      effects,
    }
  }

  /**
   * Presentation-level authority guidance. The domain engine remains the
   * authoritative check; this only decides what the UI explains and offers.
   */
  correctionAuthority(
    saleId: string,
    change: CorrectionChange,
  ): {
    severity: CorrectionSeverity
    canApply: boolean
    requirement: string
    requiresApproval: boolean
    approverMustBeOwner: boolean
  } {
    const actor = this.getActor()
    const view = this.saleViewById(saleId)
    const severity = severityForChange(change)
    if (severity === 'ordinary') {
      const canApply =
        isManagement(actor) ||
        (view?.sale.actorId === actor.id && (view?.windowOpen ?? false))
      return {
        severity,
        canApply,
        requirement: view?.windowOpen
          ? 'The original salesperson may correct this inside the correction window, or management at any time.'
          : 'The correction window has expired. Management authorization is required.',
        requiresApproval: false,
        approverMustBeOwner: false,
      }
    }
    if (actor.role === 'owner') {
      return {
        severity,
        canApply: true,
        requirement:
          'Owner authority applies this correction. The full audit trail is still preserved.',
        requiresApproval: false,
        approverMustBeOwner: false,
      }
    }
    if (actor.role === 'manager') {
      const approverMustBeOwner = severity === 'high_integrity'
      return {
        severity,
        canApply: true,
        requirement: approverMustBeOwner
          ? 'High-integrity corrections require Owner authority. Select the Owner as the separate approver.'
          : 'A separate Manager or Owner must approve this correction before it is applied.',
        requiresApproval: true,
        approverMustBeOwner,
      }
    }
    return {
      severity,
      canApply: false,
      requirement:
        'Staff cannot apply this correction. Ask a Manager or Owner to perform it; nothing is saved from this screen.',
      requiresApproval: false,
      approverMustBeOwner: severity === 'high_integrity',
    }
  }

  private reversalAuthorityForSale(sale: CompletedSale | undefined): {
    canApply: boolean
    requirement: string
    requiresApproval: boolean
  } {
    const actor = this.getActor()
    if (!isManagement(actor)) {
      return {
        canApply: false,
        requirement:
          'Only management may reverse a completed sale. Ask a Manager or Owner.',
        requiresApproval: false,
      }
    }
    if (sale?.reversedAt) {
      return {
        canApply: false,
        requirement: 'This sale has already been reversed.',
        requiresApproval: false,
      }
    }
    if (actor.role === 'owner') {
      return {
        canApply: true,
        requirement:
          'Owner authority reverses this sale. The original record and this reversal remain in history.',
        requiresApproval: false,
      }
    }
    return {
      canApply: true,
      requirement:
        'A separate Manager or Owner must approve this reversal before it is applied.',
      requiresApproval: true,
    }
  }

  reversalAuthority(saleId: string): {
    canApply: boolean
    requirement: string
    requiresApproval: boolean
  } {
    return this.reversalAuthorityForSale(
      this.sales.getSale(exceptionsBusinessId, saleId),
    )
  }

  // ------------------------------------------------------------------
  // Supplier returns
  // ------------------------------------------------------------------

  async requestSupplierReturn(
    input: SupplierReturnRequestInput,
  ): Promise<SupplierReturn> {
    const actor = this.getActor()
    const returnId = this.reference('SRET')
    const record = await this.run('supplier:return', input.purchaseId, () =>
      this.purchasing.requestReturn({
        id: returnId,
        businessId: exceptionsBusinessId,
        purchaseId: input.purchaseId,
        actorId: actor.id,
        clientEventId: this.reference('evt'),
        reason: input.reason,
        condition: input.condition,
        lines: input.lines.map((line) => ({
          productId: line.productId,
          quantity: quantity(line.quantity),
        })),
      }),
    )
    this.traceSupplierReturn(
      record.id,
      'requested',
      record.occurredAt,
      actor.id,
    )
    return record
  }

  async verifySupplierReturn(returnId: string): Promise<SupplierReturn> {
    const actor = this.getActor()
    const record = await this.run('supplier:return', returnId, () =>
      this.purchasing.verifyReturn(exceptionsBusinessId, returnId),
    )
    this.traceSupplierReturn(
      returnId,
      'verified',
      new Date().toISOString(),
      actor.id,
    )
    return record
  }

  async approveSupplierReturn(returnId: string): Promise<SupplierReturn> {
    const actor = this.getActor()
    const record = await this.run('supplier:return', returnId, () =>
      this.purchasing.approveReturn(exceptionsBusinessId, returnId),
    )
    this.traceSupplierReturn(
      returnId,
      'approved',
      new Date().toISOString(),
      actor.id,
    )
    return record
  }

  async applySupplierReturn(returnId: string): Promise<SupplierReturn> {
    const actor = this.getActor()
    const record = await this.run('supplier:return', returnId, () =>
      this.purchasing.applyReturn(exceptionsBusinessId, returnId),
    )
    this.traceSupplierReturn(
      returnId,
      'applied',
      new Date().toISOString(),
      actor.id,
    )
    return record
  }

  async recordSupplierReplacement(
    input: SupplierReplacementInput,
  ): Promise<SupplierReturn> {
    const actor = this.getActor()
    const record = await this.run('supplier:return', input.returnId, () =>
      this.purchasing.recordReplacement({
        businessId: exceptionsBusinessId,
        returnId: input.returnId,
        actorId: actor.id,
        clientEventId: this.reference('evt'),
        lines: input.lines.map((line) => ({
          productId: line.productId,
          quantity: quantity(line.quantity),
          unitCost: BigInt(line.unitCostKobo),
        })),
      }),
    )
    this.traceSupplierReturn(
      input.returnId,
      'replacement_recorded',
      new Date().toISOString(),
      actor.id,
    )
    return record
  }

  async settleSupplierReturn(
    input: SupplierSettlementInput,
  ): Promise<SupplierSettlement> {
    const actor = this.getActor()
    const settlement = await this.run(
      'supplier:settlement',
      input.returnId,
      () =>
        this.purchasing.settleReturn({
          id: this.reference('SSET'),
          businessId: exceptionsBusinessId,
          returnId: input.returnId,
          amount: BigInt(input.amountKobo),
          method: input.method,
          reference: input.reference,
          actorId: actor.id,
          clientEventId: this.reference('evt'),
        }),
    )
    this.traceSupplierReturn(
      input.returnId,
      'settled',
      settlement.occurredAt,
      actor.id,
    )
    return settlement
  }

  previewSupplierReturn(
    purchaseId: string,
    lines: Array<{ productId: string; quantity: number }>,
  ): {
    lines: Array<{
      productId: string
      productName: string
      quantity: number
      valueKobo: number
    }>
    totalValueKobo: number
    semantics: 'payable_reduction' | 'supplier_credit'
    effects: string[]
  } {
    const purchase = this.purchasing
      .listPurchases(exceptionsBusinessId)
      .find((candidate) => candidate.id === purchaseId)
    if (!purchase) throw new Error('Purchase was not found')
    const confirmedPayments = this.purchasing
      .listPayments(exceptionsBusinessId)
      .filter(
        (payment) =>
          payment.purchaseId === purchaseId &&
          payment.state === 'confirmed_success',
      )
      .reduce((sum, payment) => sum + payment.amount, 0n)
    const fullyPaid = confirmedPayments >= purchase.total
    const previewLines = lines
      .filter((line) => line.quantity > 0)
      .map((line) => {
        const source = purchase.lines.find(
          (candidate) => candidate.productId === line.productId,
        )
        if (!source) throw new Error('Return line does not match the purchase')
        return {
          productId: line.productId,
          productName: this.productName(line.productId),
          quantity: line.quantity,
          valueKobo: Number(
            (quantity(line.quantity) * source.unitCost) / 1000n,
          ),
        }
      })
    const totalValueKobo = previewLines.reduce(
      (sum, line) => sum + line.valueKobo,
      0,
    )
    const semantics = fullyPaid ? 'supplier_credit' : 'payable_reduction'
    const effects = fullyPaid
      ? [
          'The purchase was already paid, so the return value becomes supplier credit (money the supplier owes the business).',
          'Goods leave stock when the return is applied, using the recorded condition.',
          'A replacement, if any, is received as a separate new receipt.',
        ]
      : [
          'The purchase is not fully paid, so the return value reduces what the business owes this supplier.',
          'Goods leave stock when the return is applied, using the recorded condition.',
          'A replacement, if any, is received as a separate new receipt.',
        ]
    return { lines: previewLines, totalValueKobo, semantics, effects }
  }

  // ------------------------------------------------------------------
  // Cash reconciliation
  // ------------------------------------------------------------------

  async enterOpeningCash(
    amountKobo: number,
  ): Promise<CashReconciliationSnapshot> {
    const actor = this.getActor()
    return this.run('payment:record', this.cashSessionId, () =>
      this.cash.enterOpeningCash(
        exceptionsBusinessId,
        this.cashSessionId,
        amountKobo,
        actor.id,
        actor.role,
      ),
    )
  }

  async confirmOpeningCash(
    amountKobo: number,
    reason?: string,
  ): Promise<CashReconciliationSnapshot> {
    const actor = this.getActor()
    return this.run('cash:reconcile', this.cashSessionId, () =>
      this.cash.confirmOpeningCash(
        exceptionsBusinessId,
        this.cashSessionId,
        amountKobo,
        actor.id,
        actor.role,
        reason,
      ),
    )
  }

  async recordCashEvent(input: {
    kind: CashEventKind
    amountKobo: number
    reason: string
  }): Promise<CashEvent> {
    const actor = this.getActor()
    return this.run('payment:record', this.cashSessionId, () =>
      this.cash.recordCashEvent({
        businessId: exceptionsBusinessId,
        sessionId: this.cashSessionId,
        id: this.reference('CEV'),
        kind: input.kind,
        amountKobo: input.amountKobo,
        actorId: actor.id,
        actorRole: actor.role,
        reason: input.reason,
      }),
    )
  }

  async recordInterimCount(input: {
    actualCashKobo: number
    note?: string
  }): Promise<InterimCashCount> {
    const actor = this.getActor()
    return this.run('cash:reconcile', this.cashSessionId, () =>
      this.cash.recordInterimCount({
        businessId: exceptionsBusinessId,
        sessionId: this.cashSessionId,
        id: this.reference('ICK'),
        actualCashKobo: input.actualCashKobo,
        actorId: actor.id,
        actorRole: actor.role,
        note: input.note,
      }),
    )
  }

  async recordActualCashCount(
    actualCashKobo: number,
  ): Promise<CashReconciliationSnapshot> {
    const actor = this.getActor()
    return this.run('payment:record', this.cashSessionId, () =>
      this.cash.recordActualCash(
        exceptionsBusinessId,
        this.cashSessionId,
        actualCashKobo,
        actor.id,
        actor.role,
      ),
    )
  }

  async prepareReconciliation(): Promise<CashReconciliationSnapshot> {
    const actor = this.getActor()
    return this.run('business:work', this.cashSessionId, () =>
      this.cash.prepareReconciliation(
        exceptionsBusinessId,
        this.cashSessionId,
        actor.id,
        actor.role,
      ),
    )
  }

  async confirmManagementReconciliation(): Promise<CashReconciliationSnapshot> {
    const actor = this.getActor()
    return this.run('cash:reconcile', this.cashSessionId, () =>
      this.cash.confirmManagementReconciliation(
        exceptionsBusinessId,
        this.cashSessionId,
        actor.id,
        actor.role,
      ),
    )
  }

  async closeBusinessDay(reason?: string): Promise<CashReconciliationSnapshot> {
    const actor = this.getActor()
    return this.run('business-day:close', this.cashSessionId, () =>
      this.cash.closeBusinessDay(
        exceptionsBusinessId,
        this.cashSessionId,
        actor.id,
        actor.role,
        reason,
      ),
    )
  }

  async reopenBusinessDay(
    reason: string,
    approval?: ExceptionApprovalInput,
  ): Promise<CashReconciliationSnapshot> {
    const actor = this.getActor()
    return this.run('business-day:close', this.cashSessionId, () =>
      this.cash.reopenBusinessDay(
        exceptionsBusinessId,
        this.cashSessionId,
        actor.id,
        actor.role,
        reason,
        approval,
      ),
    )
  }

  async resolveDiscrepancy(
    explanation: string,
  ): Promise<CashReconciliationSnapshot> {
    const actor = this.getActor()
    return this.run('cash:reconcile', this.cashSessionId, () =>
      this.cash.resolveDiscrepancy(
        exceptionsBusinessId,
        this.cashSessionId,
        actor.id,
        actor.role,
        explanation,
      ),
    )
  }

  // ------------------------------------------------------------------
  // Snapshot
  // ------------------------------------------------------------------

  snapshot(): ExceptionsSnapshot {
    const actor = this.getActor()
    const session = this.sessions.get(this.actorId)!
    const membership = session.memberships.find(
      (candidate) =>
        candidate.businessId === exceptionsBusinessId && candidate.active,
    )!
    const permissions = effectivePermissions(membership)

    const sales = this.buildSaleViews()
    const returns = this.saleReturnIds
      .map((returnId) =>
        this.returnsCorrections.getReturn(exceptionsBusinessId, returnId),
      )
      .filter((record): record is ReturnRecord => Boolean(record))
      .map((record) => {
        const sale = sales.find((view) => view.sale.id === record.saleId)!
        return {
          record,
          sale,
          nextActions: this.saleReturnActions(record, actor, permissions),
        }
      })
    const supplierReturns = this.purchasing
      .listReturns(exceptionsBusinessId)
      .map((record) => this.buildSupplierReturnView(record, actor, permissions))
    const purchaseOptions = this.purchasing
      .listPurchases(exceptionsBusinessId)
      .map((purchase) => this.buildPurchaseOptionView(purchase))
    const corrections = this.returnsCorrections
      .listAuditEvents()
      .filter(
        (event) =>
          event.businessId === exceptionsBusinessId &&
          (event.type === 'sale.correction.applied' ||
            event.type === 'sale.reversal.applied'),
      )
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    const cash = this.buildCashView(actor, permissions)
    const review = this.buildReviewItems(returns, supplierReturns, cash)
    const history = this.buildHistoryEvents()

    return {
      actor,
      permissions: [...permissions],
      products: this.catalog.searchProducts('', true),
      sales,
      returns,
      supplierReturns,
      purchaseOptions,
      corrections,
      cash,
      review,
      history,
      auditEventCount:
        this.auditEvents.length +
        this.returnsCorrections.listAuditEvents().length +
        this.cash.listAudits(exceptionsBusinessId).length +
        this.supplierReturnTraces.length,
    }
  }

  // ------------------------------------------------------------------
  // View builders
  // ------------------------------------------------------------------

  private saleViewById(saleId: string): SaleExceptionView | undefined {
    return this.buildSaleViews().find((view) => view.sale.id === saleId)
  }

  private buildSaleViews(): SaleExceptionView[] {
    const integrityAudits = this.returnsCorrections.listAuditEvents()
    const saleReports = this.sales.listReports()
    const saleIds = [...new Set(saleReports.map((report) => report.saleId))]
    return saleIds
      .map((saleId) => this.sales.getSale(exceptionsBusinessId, saleId))
      .filter((sale): sale is CompletedSale => Boolean(sale))
      .map((sale) => {
        const returnsForSale = this.saleReturnIds
          .map((returnId) =>
            this.returnsCorrections.getReturn(exceptionsBusinessId, returnId),
          )
          .filter(
            (record): record is ReturnRecord =>
              Boolean(record) && record!.saleId === sale.id,
          )
        const applied = returnsForSale.filter(
          (record) => record.state === 'applied' || record.state === 'settled',
        )
        const returnedByLineId: Record<string, number> = {}
        let returnedLines = 0
        for (const record of applied) {
          for (const line of record.lines) {
            returnedByLineId[line.lineId] =
              (returnedByLineId[line.lineId] ?? 0) + line.quantity
          }
        }
        for (const line of sale.lines) {
          if ((returnedByLineId[line.id] ?? 0) >= line.quantity) returnedLines++
        }
        const correctionCount = integrityAudits.filter(
          (event) =>
            event.saleId === sale.id &&
            event.type === 'sale.correction.applied',
        ).length
        const reversed = Boolean(sale.reversedAt)
        const derivedState: SaleDerivedState = reversed
          ? 'reversed'
          : applied.length === 0
            ? 'completed'
            : returnedLines >= sale.lines.length
              ? 'fully_returned'
              : 'partially_returned'
        const stateLabel = reversed
          ? 'Completed — Reversed'
          : derivedState === 'fully_returned'
            ? 'Completed — Fully returned'
            : derivedState === 'partially_returned'
              ? 'Completed — Partially returned'
              : 'Completed'
        const elapsed = minutesSince(sale.completedAt)
        const windowRemaining = Math.max(0, 15 - elapsed)
        const reversalAuthority = this.reversalAuthority(sale.id)
        return {
          sale,
          derivedState,
          stateLabel,
          returnedByLineId,
          returnIds: returnsForSale.map((record) => record.id),
          correctionCount,
          windowOpen: !reversed && elapsed <= 15,
          windowRemainingMinutes: windowRemaining,
          creditLink: this.creditLinks.get(sale.id) ?? null,
          canReverse: reversalAuthority.canApply,
          reversalRequirement: reversalAuthority.requirement,
        }
      })
      .sort((a, b) => b.sale.completedAt.localeCompare(a.sale.completedAt))
  }

  private saleReturnActions(
    record: ReturnRecord,
    actor: ExceptionActor,
    permissions: ReadonlySet<Permission>,
  ): SaleReturnView['nextActions'] {
    const actions: SaleReturnView['nextActions'] = []
    const canApprovePermission = permissions.has('return:approve')
    const canProcess = permissions.has('return:process')
    const separateAuthority =
      actor.role === 'owner' ||
      (actor.role === 'manager' && actor.id !== record.requestedById)
    if (record.state === 'requested') {
      actions.push({
        action: 'verify',
        label: 'Verify purchase',
        permitted: canApprovePermission && isManagement(actor),
        note: 'Verification confirms the original sale before approval is considered.',
      })
      actions.push({
        action: 'reject',
        label: 'Reject return',
        permitted:
          canApprovePermission && isManagement(actor) && separateAuthority,
        note: 'A rejected return stays in history and applies no business effect.',
      })
    }
    if (record.state === 'verified') {
      actions.push({
        action: 'approve',
        label: 'Approve return',
        permitted:
          canApprovePermission && isManagement(actor) && separateAuthority,
        note: 'Approval requires a Manager or Owner separate from the requester.',
      })
      actions.push({
        action: 'reject',
        label: 'Reject return',
        permitted:
          canApprovePermission && isManagement(actor) && separateAuthority,
        note: 'A rejected return stays in history and applies no business effect.',
      })
    }
    if (record.state === 'approved') {
      actions.push({
        action: 'apply',
        label: 'Apply return',
        permitted: canProcess && isManagement(actor),
        note: 'Applying records the stock, debt, and reporting effects.',
      })
    }
    if (record.state === 'applied' && record.refund?.state === 'due') {
      actions.push({
        action: 'settle',
        label: 'Record refund settlement',
        permitted: canProcess && isManagement(actor),
        note: 'Sabi Shop records the settlement; it does not execute the payment.',
      })
    }
    return actions
  }

  private buildSupplierReturnView(
    record: SupplierReturn,
    actor: ExceptionActor,
    permissions: ReadonlySet<Permission>,
  ): SupplierReturnCaseView {
    const purchase =
      this.purchasing
        .listPurchases(exceptionsBusinessId)
        .find((candidate) => candidate.id === record.purchaseId) ?? null
    const supplier =
      this.purchasing
        .listSuppliers(exceptionsBusinessId)
        .find((candidate) => candidate.id === record.supplierId) ?? null
    const settlements = this.purchasing
      .listSettlements(exceptionsBusinessId)
      .filter((settlement) => settlement.returnId === record.id)
    const canReturn = permissions.has('supplier:return')
    const canSettle = permissions.has('supplier:settlement')
    const nextActions: SupplierReturnCaseView['nextActions'] = []
    if (record.state === 'requested') {
      nextActions.push({
        action: 'verify',
        label: 'Verify purchase',
        permitted: canReturn,
        note: 'Verification confirms the original purchase before approval.',
      })
    }
    if (record.state === 'verified') {
      nextActions.push({
        action: 'approve',
        label: 'Approve return',
        permitted: canReturn,
        note: 'Approval records the condition and settlement consequence.',
      })
    }
    if (record.state === 'approved') {
      nextActions.push({
        action: 'apply',
        label: 'Apply return',
        permitted: canReturn,
        note: 'Applying moves the goods out of stock with the recorded condition.',
      })
    }
    if (record.state === 'applied' || record.state === 'settled') {
      nextActions.push({
        action: 'replacement',
        label: 'Record replacement receipt',
        permitted: canReturn,
        note: 'A replacement is a separate new receipt, not an edit of the return.',
      })
      if (record.state === 'applied') {
        nextActions.push({
          action: 'settle',
          label: 'Record settlement',
          permitted: canSettle,
          note: 'Records what the business states happened; money movement is not executed.',
        })
      }
    }
    return {
      record,
      purchase,
      supplier,
      settlementSemantics: record.paidBeforeReturn
        ? 'supplier_credit'
        : 'payable_reduction',
      settlements,
      nextActions,
    }
  }

  private buildPurchaseOptionView(
    purchase: PurchaseRecord,
  ): PurchaseOptionView {
    const payments = this.purchasing
      .listPayments(exceptionsBusinessId)
      .filter(
        (payment) =>
          payment.purchaseId === purchase.id &&
          payment.state === 'confirmed_success',
      )
    const paidKobo = Number(
      payments.reduce((sum, payment) => sum + payment.amount, 0n),
    )
    const totalKobo = Number(purchase.total)
    return {
      purchase,
      supplier:
        this.purchasing
          .listSuppliers(exceptionsBusinessId)
          .find((candidate) => candidate.id === purchase.supplierId) ?? null,
      payments,
      paidKobo,
      outstandingKobo: totalKobo - paidKobo,
      fullyPaid: paidKobo >= totalKobo,
    }
  }

  private buildCashView(
    actor: ExceptionActor,
    permissions: ReadonlySet<Permission>,
  ): CashSessionView {
    const snapshot = this.cash.getSnapshot(
      exceptionsBusinessId,
      this.cashSessionId,
    )
    const events = this.cash.listEvents(
      exceptionsBusinessId,
      this.cashSessionId,
    )
    const audits = this.cash
      .listAudits(exceptionsBusinessId)
      .filter((event) => event.sessionId === this.cashSessionId)
    const paymentTotals = new Map<PaymentMethod, number>()
    for (const report of this.sales.listReports()) {
      if (report.businessId !== exceptionsBusinessId) continue
      if (report.type !== 'sale.completed') continue
      const sale = this.sales.getSale(exceptionsBusinessId, report.saleId)
      if (!sale || sale.reversedAt) continue
      for (const payment of sale.payments) {
        paymentTotals.set(
          payment.method,
          (paymentTotals.get(payment.method) ?? 0) + payment.amountKobo,
        )
      }
    }
    const lastCount = [...audits]
      .reverse()
      .find((event) => event.type === 'cash.actual_count.recorded')
    const cashInHand = snapshot.actualCashKobo
      ? {
          valueKobo: snapshot.actualCashKobo,
          basis: 'counted' as const,
          countedAt: lastCount?.occurredAt,
          countedBy: lastCount?.actorId,
        }
      : {
          valueKobo: snapshot.expectedCashKobo,
          basis: 'expected_not_counted' as const,
        }
    const canReconcile = permissions.has('cash:reconcile')
    const canClose = permissions.has('business-day:close')
    const canRecordCash = permissions.has('payment:record')
    const nextActions: CashSessionView['nextActions'] = []
    if (snapshot.state === 'open_session') {
      nextActions.push({
        action: 'count',
        label: 'Count cash',
        permitted: canRecordCash,
        note: 'Physically count the cash in the drawer, then record the count. Actual Cash is never a routine dashboard value.',
      })
      nextActions.push({
        action: 'interim-count',
        label: 'Record interim count',
        permitted: canReconcile && isManagement(actor),
        note: 'A management checkpoint during the day. It never closes the session.',
      })
    }
    if (snapshot.state === 'count_recorded' || snapshot.state === 'reopened') {
      nextActions.push({
        action: 'prepare',
        label: 'Prepare reconciliation',
        permitted: permissions.has('business:work'),
        note: 'Compares Expected Cash with the physical count and raises any variance as a discrepancy.',
      })
    }
    if (snapshot.state === 'reconciliation_prepared') {
      nextActions.push({
        action: 'confirm',
        label: 'Confirm reconciliation',
        permitted: canReconcile && isManagement(actor),
        note: 'Management confirms the official reconciliation.',
      })
    }
    if (snapshot.state === 'management_confirmed') {
      nextActions.push({
        action: 'close',
        label: 'Close business day',
        permitted: canClose && isManagement(actor),
        note: 'The day may be closed with an unresolved discrepancy; it stays visible and open for investigation.',
      })
    }
    if (snapshot.state === 'closed') {
      nextActions.push({
        action: 'reopen',
        label: 'Reopen business day',
        permitted: canClose && isManagement(actor),
        note: 'Reopening requires a reason and is fully audited.',
      })
    }
    if (snapshot.discrepancyStatus === 'unresolved') {
      nextActions.push({
        action: 'resolve',
        label: 'Resolve discrepancy',
        permitted: canReconcile && isManagement(actor),
        note: 'Record the investigation outcome. The original reconciliation stays in history.',
      })
    }
    return {
      snapshot,
      events,
      interimCounts: [],
      audits,
      cashInHand,
      paymentTotals: [...paymentTotals.entries()].map(
        ([method, totalKobo]) => ({
          method,
          label: paymentMethodLabel(method),
          totalKobo,
        }),
      ),
      nextActions,
    }
  }

  private buildReviewItems(
    returns: SaleReturnView[],
    supplierReturns: SupplierReturnCaseView[],
    cash: CashSessionView,
  ): ReviewItemView[] {
    const items: ReviewItemView[] = []
    for (const view of returns) {
      const record = view.record
      if (record.state === 'requested') {
        items.push({
          id: `review-return-${record.id}`,
          kind: 'sale_return',
          title: 'Sale return awaiting verification',
          whatHappened: `${record.requestedById} requested a return of ${record.lines.length} line(s) on sale ${record.saleId}.`,
          whyAttention:
            'The original purchase must be verified before approval is considered.',
          affectedArea: 'Customer return',
          consequence:
            'Approval applies stock, debt, settlement, and reporting effects. Rejection applies none and stays in history.',
          requestedAction: 'Verify the original sale, then approve or reject.',
          requiredAuthority: 'Manager or Owner, separate from the requester',
          occurredAt: record.requestedAt,
          target: { tab: 'returns', recordId: record.id },
          primaryAction: { kind: 'verify', label: 'Verify purchase' },
        })
      }
      if (record.state === 'verified') {
        items.push({
          id: `review-return-${record.id}`,
          kind: 'sale_return',
          title: 'Sale return awaiting approval',
          whatHappened: `A return on sale ${record.saleId} was verified and is waiting for the approval decision.`,
          whyAttention:
            'Every verified return requires management approval before any business effect is applied.',
          affectedArea: 'Customer return',
          consequence:
            'Approval applies stock, debt, settlement, and reporting effects. Rejection applies none and stays in history.',
          requestedAction:
            'Approve with a condition, or reject with the reason visible.',
          requiredAuthority: 'Manager or Owner, separate from the requester',
          occurredAt: record.verifiedAt ?? record.requestedAt,
          target: { tab: 'returns', recordId: record.id },
          primaryAction: { kind: 'approve', label: 'Approve return' },
        })
      }
      if (record.state === 'applied' && record.refund?.state === 'due') {
        items.push({
          id: `review-refund-${record.id}`,
          kind: 'refund',
          title: 'Refund settlement to record',
          whatHappened: `Return ${record.id} on sale ${record.saleId} is applied and a refund is due.`,
          whyAttention:
            'Sabi Shop records settlement only when the business confirms the payment actually happened.',
          affectedArea: 'Refund settlement',
          consequence:
            'Recording the settlement moves the refund state to settled. The money movement itself is not executed by Sabi Shop.',
          requestedAction:
            'Record the settlement method and reference once confirmed.',
          requiredAuthority: 'Manager or Owner',
          occurredAt: record.appliedAt ?? record.requestedAt,
          target: { tab: 'returns', recordId: record.id },
          primaryAction: { kind: 'settle', label: 'Record settlement' },
        })
      }
    }
    for (const view of supplierReturns) {
      const record = view.record
      if (record.state === 'requested' || record.state === 'verified') {
        const waiting =
          record.state === 'requested' ? 'verification' : 'approval'
        items.push({
          id: `review-supplier-return-${record.id}`,
          kind: 'supplier_return',
          title: `Supplier return awaiting ${waiting}`,
          whatHappened: `${record.actorId} requested a supplier return of ${record.lines.length} line(s) against purchase ${record.purchaseId}.`,
          whyAttention:
            'The purchase and settlement state decide whether the return reduces the payable or creates supplier credit.',
          affectedArea: 'Supplier return',
          consequence:
            view.settlementSemantics === 'payable_reduction'
              ? 'The return value reduces what the business owes this supplier.'
              : 'The return value becomes supplier credit owed to the business.',
          requestedAction:
            record.state === 'requested'
              ? 'Verify the original purchase, then approve.'
              : 'Approve, then apply the stock effect.',
          requiredAuthority: 'Manager or Owner',
          occurredAt: record.occurredAt,
          target: { tab: 'supplier-returns', recordId: record.id },
          primaryAction:
            record.state === 'requested'
              ? { kind: 'verify', label: 'Verify purchase' }
              : { kind: 'approve', label: 'Approve return' },
        })
      }
      if (record.state === 'approved') {
        items.push({
          id: `review-supplier-return-${record.id}`,
          kind: 'supplier_return',
          title: 'Supplier return ready to apply',
          whatHappened: `Supplier return ${record.id} is approved and waiting for its stock effect.`,
          whyAttention:
            'Applying moves the goods out of stock with the recorded condition.',
          affectedArea: 'Supplier return',
          consequence:
            view.settlementSemantics === 'payable_reduction'
              ? 'The payable reduction takes effect.'
              : 'The supplier credit takes effect.',
          requestedAction:
            'Apply the return, then record any settlement or replacement.',
          requiredAuthority: 'Manager or Owner',
          occurredAt: record.occurredAt,
          target: { tab: 'supplier-returns', recordId: record.id },
          primaryAction: { kind: 'apply', label: 'Apply return' },
        })
      }
    }
    for (const event of this.returnsCorrections.listAuditEvents()) {
      if (event.businessId !== exceptionsBusinessId) continue
      if (!event.ownerReviewRequired) continue
      items.push({
        id: `review-owner-${event.id}`,
        kind: 'owner_review',
        title: 'Owner review: consequential manager correction',
        whatHappened: `A Manager applied a ${event.severity.replace('_', ' ')} correction on sale ${event.saleId}.`,
        whyAttention:
          'Consequential manager self-corrections are flagged for Owner review.',
        affectedArea: 'Correction',
        consequence:
          'The correction is already applied with full audit evidence; the Owner reviews the decision, not a pending change.',
        requestedAction:
          'Review the correction chain and, if needed, record a further controlled correction.',
        requiredAuthority: 'Owner review',
        occurredAt: event.occurredAt,
        target: { tab: 'corrections', recordId: event.saleId },
        primaryAction: null,
      })
    }
    if (cash.snapshot.unresolved) {
      items.push({
        id: 'review-cash-discrepancy',
        kind: 'cash_discrepancy',
        title: 'Cash discrepancy requiring investigation',
        whatHappened:
          'Expected Cash and the physical count differ. The variance is an investigation signal, not an accusation.',
        whyAttention:
          'The discrepancy stays visible until management records the investigation outcome.',
        affectedArea: 'Cash reconciliation',
        consequence:
          'Cash history is never rewritten. Resolution records who, when, and why.',
        requestedAction:
          'Investigate contributing events, then resolve with an explanation.',
        requiredAuthority: 'Manager or Owner',
        occurredAt:
          cash.audits.find((event) => event.type === 'reconciliation.prepared')
            ?.occurredAt ?? new Date().toISOString(),
        target: { tab: 'reconciliation', recordId: cash.snapshot.sessionId },
        primaryAction: { kind: 'resolve', label: 'Resolve discrepancy' },
      })
    }
    return items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  }

  private buildHistoryEvents(): HistoryEventView[] {
    const events: HistoryEventView[] = []
    for (const audit of this.sales.listAudits()) {
      if (audit.businessId !== exceptionsBusinessId) continue
      events.push({
        id: `sale-${audit.id}`,
        at: audit.occurredAt,
        kind: 'sale',
        title:
          audit.type === 'sale.reversed' ? 'Sale reversed' : 'Sale completed',
        actorId: audit.actorId,
        actorRole: this.roleForActor(audit.actorId),
        targetId: audit.saleId,
        detail: Object.entries(audit.details)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' · '),
      })
    }
    for (const audit of this.returnsCorrections.listAuditEvents()) {
      if (audit.businessId !== exceptionsBusinessId) continue
      const kind: HistoryEventKind =
        audit.type === 'sale.return.applied'
          ? 'sale_return'
          : audit.type === 'sale.reversal.applied'
            ? 'reversal'
            : 'correction'
      events.push({
        id: `integrity-${audit.id}`,
        at: audit.occurredAt,
        kind,
        title:
          audit.type === 'sale.return.applied'
            ? 'Return applied'
            : audit.type === 'sale.reversal.applied'
              ? 'Sale reversed'
              : 'Correction applied',
        actorId: audit.actorId,
        actorRole: audit.actorRole,
        reason: audit.reason,
        targetId: audit.saleId,
        detail: `Severity: ${audit.severity.replace('_', ' ')}. State: ${audit.state}.`,
      })
    }
    for (const trace of this.supplierReturnTraces) {
      events.push({
        id: `supplier-return-${trace.id}`,
        at: trace.at,
        kind: 'supplier_return',
        title: `Supplier return ${trace.type.replace('_', ' ')}`,
        actorId: trace.actorId,
        actorRole: this.roleForActor(trace.actorId),
        targetId: trace.returnId,
        detail: trace.note,
      })
    }
    for (const audit of this.cash.listAudits(exceptionsBusinessId)) {
      events.push({
        id: `cash-${audit.id}`,
        at: audit.occurredAt,
        kind: 'cash',
        title: humanizeCashEventType(audit.type),
        actorId: audit.actorId,
        actorRole: audit.actorRole,
        reason: audit.reason,
        targetId: audit.sessionId,
        detail: Object.entries(audit.details)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' · '),
      })
    }
    for (const audit of this.auditEvents) {
      events.push({
        id: `authorization-${audit.eventId}`,
        at: new Date(audit.occurredAt).toISOString(),
        kind: 'authorization',
        title:
          audit.result === 'allowed'
            ? 'Operation authorized'
            : 'Operation denied',
        actorId: audit.actorUserId ?? 'unknown',
        actorRole: audit.actorRole ?? 'unknown',
        targetId: audit.targetRecordId,
        detail: `${audit.permission} — ${audit.reason}`,
      })
    }
    return events.sort((a, b) => b.at.localeCompare(a.at))
  }

  private roleForActor(actorId: string): string {
    return (
      exceptionActors.find((actor) => actor.id === actorId)?.role ?? 'unknown'
    )
  }

  private productName(productId: string): string {
    return (
      this.catalog
        .searchProducts('', true)
        .find((product) => product.id === productId)?.name ?? productId
    )
  }

  private traceSupplierReturn(
    returnId: string,
    type: string,
    at: string,
    actorId: string,
    note?: string,
  ): void {
    this.supplierReturnTraces.push({
      id: `${returnId}:${type}:${at}`,
      returnId,
      type,
      at,
      actorId,
      note,
    })
  }

  // ------------------------------------------------------------------
  // Reference seed
  // ------------------------------------------------------------------

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
      businessId: exceptionsBusinessId,
      name: 'Lagos Wholesale Foods',
      phone: '08030000001',
      address: '12 Market Road, Lagos',
      notes: 'Weekly foodstuff delivery.',
    })
    this.purchasing.createSupplier({
      id: 'supplier-prime',
      businessId: exceptionsBusinessId,
      name: 'Prime Cleaning Supplies',
      phone: '08030000002',
      address: '4 Industrial Avenue, Lagos',
      notes: 'Cleaning products and replacements.',
    })

    // Unpaid purchase: a supplier return reduces the payable.
    this.purchasing.receivePurchase({
      id: 'PUR-2101',
      businessId: exceptionsBusinessId,
      supplierId: 'supplier-lagos',
      actorId: 'user-ngozi',
      clientEventId: 'seed-purchase-2101',
      occurredAt: '2026-09-07T09:00:00.000Z',
      lines: [
        { productId: 'prod-rice', quantity: 12_000n, unitCost: 5_200_000n },
        { productId: 'prod-oil', quantity: 8_000n, unitCost: 780_000n },
      ],
    })

    // Fully paid purchase: a supplier return creates supplier credit.
    const paidPurchase = this.purchasing.receivePurchase({
      id: 'PUR-2102',
      businessId: exceptionsBusinessId,
      supplierId: 'supplier-prime',
      actorId: 'user-ngozi',
      clientEventId: 'seed-purchase-2102',
      occurredAt: '2026-09-07T09:30:00.000Z',
      lines: [
        { productId: 'prod-detergent', quantity: 15_000n, unitCost: 270_000n },
      ],
    })
    this.purchasing.recordPayment({
      id: 'PAY-2102',
      businessId: exceptionsBusinessId,
      purchaseId: paidPurchase.id,
      amount: paidPurchase.total,
      method: 'transfer',
      reference: 'TRF-771',
      actorId: 'user-nkechi',
      clientEventId: 'seed-payment-2102',
      state: 'confirmed_success',
      occurredAt: '2026-09-07T10:15:00.000Z',
    })

    // A recent cash sale inside the correction window.
    const recentAt = new Date(Date.now() - 5 * 60_000).toISOString()
    const recentSale = this.sales.complete({
      businessId: exceptionsBusinessId,
      id: 'SAL-3001',
      clientRequestId: 'seed-sale-3001',
      actorId: 'user-chidi',
      actorRole: 'staff',
      lines: [
        { id: 'line-1', productId: 'prod-rice', quantity: 2 },
        { id: 'line-2', productId: 'prod-oil', quantity: 1 },
      ],
      payments: [
        {
          id: 'pay-1',
          method: 'cash',
          amountKobo: 13_950_000,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
          },
        },
      ],
      occurredAt: recentAt,
    })

    // An older transfer sale, outside the correction window.
    const olderAt = new Date(Date.now() - 3 * 60 * 60_000).toISOString()
    this.sales.complete({
      businessId: exceptionsBusinessId,
      id: 'SAL-3002',
      clientRequestId: 'seed-sale-3002',
      actorId: 'user-chidi',
      actorRole: 'staff',
      lines: [{ id: 'line-1', productId: 'prod-rice', quantity: 1 }],
      payments: [
        {
          id: 'pay-1',
          method: 'bank_transfer',
          amountKobo: 6_500_000,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
            externalReference: 'TRF-8832',
          },
        },
      ],
      occurredAt: olderAt,
    })

    // A credit sale with a customer debt the return can reduce.
    this.credit.createCustomer({
      businessId: exceptionsBusinessId,
      id: 'customer-ada',
      name: 'Ada Obi',
      phone: '08090000003',
      creditStatus: 'allowed',
      creditLimitMinor: 20_000_000n,
      actorId: 'user-ngozi',
    })
    const creditSaleAt = new Date(Date.now() - 2 * 60 * 60_000).toISOString()
    this.credit.recordCreditSale({
      businessId: exceptionsBusinessId,
      customerId: 'customer-ada',
      debtId: 'DEBT-3003',
      saleId: 'SAL-3003',
      amountMinor: 1_900_000n,
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-credit-sale-3003',
      creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
      occurredAt: creditSaleAt,
    })
    this.sales.complete({
      businessId: exceptionsBusinessId,
      id: 'SAL-3003',
      clientRequestId: 'seed-sale-3003',
      actorId: 'user-chidi',
      actorRole: 'staff',
      lines: [{ id: 'line-1', productId: 'prod-oil', quantity: 2 }],
      payments: [
        {
          id: 'pay-1',
          method: 'customer_credit',
          amountKobo: 1_900_000,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-ngozi',
          },
        },
      ],
      customer: { id: 'customer-ada', name: 'Ada Obi', phone: '08090000003' },
      creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
      occurredAt: creditSaleAt,
    })
    this.creditLinks.set('SAL-3003', {
      customerId: 'customer-ada',
      debtId: 'DEBT-3003',
    })

    // Cash session: staff enter opening cash, management confirms.
    this.cash.openBusinessDay({
      businessId: exceptionsBusinessId,
      sessionId: this.cashSessionId,
      custodyMode: 'shared_drawer',
      actorId: 'user-ngozi',
      actorRole: 'manager',
    })
    this.cash.enterOpeningCash(
      exceptionsBusinessId,
      this.cashSessionId,
      500_000,
      'user-chidi',
      'staff',
    )
    this.cash.confirmOpeningCash(
      exceptionsBusinessId,
      this.cashSessionId,
      500_000,
      'user-ngozi',
      'manager',
      'Counted float confirmed with staff entry.',
    )
    this.cash.recordCashEvent({
      businessId: exceptionsBusinessId,
      sessionId: this.cashSessionId,
      id: 'CEV-9001',
      kind: 'cash_sale',
      amountKobo: recentSale.cashKobo,
      actorId: 'user-chidi',
      actorRole: 'staff',
      reason: `Cash from sale ${recentSale.id}`,
    })
    this.cash.recordCashEvent({
      businessId: exceptionsBusinessId,
      sessionId: this.cashSessionId,
      id: 'CEV-9002',
      kind: 'cash_in',
      amountKobo: 200_000,
      actorId: 'user-chidi',
      actorRole: 'staff',
      reason: 'Change money added to the drawer',
    })
    this.cash.recordCashEvent({
      businessId: exceptionsBusinessId,
      sessionId: this.cashSessionId,
      id: 'CEV-9003',
      kind: 'cash_out',
      amountKobo: 150_000,
      actorId: 'user-ngozi',
      actorRole: 'manager',
      reason: 'Transport fare for the evening delivery',
    })

    // A staff-requested return so the review queue demonstrates the flow.
    const seededReturn = this.returnsCorrections.requestReturn({
      businessId: exceptionsBusinessId,
      saleId: 'SAL-3002',
      returnId: 'RET-6501',
      clientEventId: 'seed-return-6501',
      requestedById: 'user-chidi',
      requestedByRole: 'staff',
      reason: 'Customer returned an unopened bag; wrong brand requested.',
      lines: [{ lineId: 'line-1', productId: 'prod-rice', quantity: 1 }],
    })
    this.saleReturnIds.push(seededReturn.id)
  }
}
