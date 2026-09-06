import {
  CustomersCreditEngine,
  type CreditHistoryEvent,
} from './customersCredit'
import {
  InventoryEngine,
  type InventoryEvent,
  quantity as inventoryQuantity,
} from './inventory'
import {
  SalesTransactionEngine,
  type CompletedSale,
  type PaymentMethod,
} from './sales'
import { canApprove, type Role } from './stateMachines'

export type CorrectionSeverity = 'ordinary' | 'material' | 'high_integrity'

export type CorrectionState =
  'requested' | 'authorization_review' | 'approved' | 'applied' | 'rejected'

export type ReturnState =
  'requested' | 'verified' | 'approved' | 'applied' | 'settled' | 'rejected'

export type RefundState = 'not_required' | 'due' | 'settled'
export type SyncState = 'local_only' | 'pending_sync' | 'accepted' | 'conflict'

export type ManagementApproval = {
  approverId: string
  approverRole: Role
}

export type PaymentCorrection = {
  id: string
  amountKobo: number
  method: PaymentMethod
  classification?: 'cash' | 'non_cash'
}

export type CorrectionChange =
  | { field: 'note'; correctedValue: string }
  | {
      field: 'quantity'
      lineId: string
      productId: string
      correctedQuantity: number
      correctedPayments?: PaymentCorrection[]
    }
  | {
      field: 'payment_amount'
      paymentId: string
      correctedAmountKobo: number
    }
  | {
      field: 'customer_identity'
      customerId: string
      customerName: string
      customerPhone: string
    }
  | { field: 'salesperson_attribution'; salespersonId: string }

export type SaleSnapshot = {
  saleId: string
  actorId: string
  completedAt: string
  totalDueKobo: number
  taxKobo: number
  cogsKobo: number
  grossProfitKobo: number
  cashKobo: number
  nonCashKobo: number
  creditKobo: number
  note?: string
  customer?: { id: string; name: string; phone: string }
  salespersonId?: string
  lines: Array<{
    id: string
    productId: string
    quantity: number
    unitPriceKobo: number
  }>
  payments: Array<{
    id: string
    method: PaymentMethod
    amountKobo: number
  }>
}

export type FinancialEffect = {
  totalDueKobo: number
  taxKobo: number
  cogsKobo: number
  grossProfitKobo: number
  cashKobo: number
  nonCashKobo: number
  creditKobo: number
}

export type CorrectionEvent = {
  id: string
  type: 'sale.correction.applied' | 'sale.reversal.applied'
  businessId: string
  saleId: string
  clientEventId: string
  actorId: string
  actorRole: Role
  reason: string
  occurredAt: string
  recordedAt: string
  state: CorrectionState
  severity: CorrectionSeverity
  windowExpired: boolean
  ownerReviewRequired: boolean
  syncState: SyncState
  original: SaleSnapshot
  corrected?: SaleSnapshot
  approval?: ManagementApproval
  financialEffect?: FinancialEffect
  downstream: {
    inventoryEventIds: string[]
    reportEventId: string
    creditEventId?: string
  }
}

export type ReturnLine = {
  lineId: string
  productId: string
  quantity: number
  valueKobo?: number
}

export type ReturnRecord = {
  id: string
  businessId: string
  saleId: string
  clientEventId: string
  state: ReturnState
  reason: string
  requestedById: string
  requestedByRole: Role
  requestedAt: string
  verifiedAt?: string
  verifiedById?: string
  approvedAt?: string
  approvedById?: string
  appliedAt?: string
  condition?: 'sellable' | 'held'
  lines: ReturnLine[]
  customerId?: string
  debtId?: string
  refund?: {
    state: RefundState
    amountKobo: number
    method?: PaymentMethod
    externalReference?: string
    settledAt?: string
    settledById?: string
  }
  creditEffect?: {
    amountKobo: number
    resultingOutstandingKobo: number
    creditEventId: string
  }
  financialEffect?: FinancialEffect
  reportEventId?: string
  inventoryEventIds: string[]
  syncState: SyncState
}

export type IntegrityAuditEvent = {
  id: string
  type: string
  businessId: string
  saleId: string
  actorId: string
  actorRole: Role
  reason: string
  occurredAt: string
  recordedAt: string
  clientEventId: string
  state: CorrectionState | ReturnState
  severity: CorrectionSeverity
  ownerReviewRequired: boolean
  original: SaleSnapshot
  corrected?: SaleSnapshot
  financialEffect?: FinancialEffect
  downstream: CorrectionEvent['downstream']
}

export type ReturnRequestInput = {
  businessId: string
  saleId: string
  returnId: string
  clientEventId: string
  requestedById: string
  requestedByRole: Role
  reason: string
  lines: ReturnLine[]
  customerId?: string
  debtId?: string
  occurredAt?: string
  isOffline?: boolean
}

export type SaleCorrectionInput = {
  businessId: string
  saleId: string
  clientEventId: string
  actorId: string
  actorRole: Role
  reason: string
  occurredAt?: string
  change: CorrectionChange
  approval?: ManagementApproval
  customerId?: string
  debtId?: string
  isOffline?: boolean
}

export type SaleReversalInput = {
  businessId: string
  saleId: string
  clientEventId: string
  actorId: string
  actorRole: Role
  reason: string
  occurredAt?: string
  approval?: ManagementApproval
  customerId?: string
  debtId?: string
  isOffline?: boolean
}

export class IntegrityError extends Error {
  readonly code:
    | 'sale_not_found'
    | 'unauthorized_correction'
    | 'reason_required'
    | 'invalid_correction'
    | 'dependent_event'
    | 'illegal_transition'
    | 'return_not_found'
    | 'invalid_return'
    | 'invalid_refund'

  constructor(code: IntegrityError['code'], message: string) {
    super(message)
    this.code = code
    this.name = 'IntegrityError'
  }
}

const now = () => new Date().toISOString()

const isManagement = (role: Role) => role === 'manager' || role === 'owner'

const roundHalfUp = (value: number) =>
  value < 0 ? -Math.round(-value) : Math.round(value)

const minutesBetween = (start: string, end: string) =>
  (Date.parse(end) - Date.parse(start)) / 60_000

const snapshotSale = (sale: CompletedSale): SaleSnapshot => ({
  saleId: sale.id,
  actorId: sale.actorId,
  completedAt: sale.completedAt,
  totalDueKobo: sale.totalDueKobo,
  taxKobo: sale.taxKobo,
  cogsKobo: sale.cogsKobo,
  grossProfitKobo: sale.grossProfitKobo,
  cashKobo: sale.cashKobo,
  nonCashKobo: sale.nonCashKobo,
  creditKobo: sale.creditKobo,
  customer: sale.customer && { ...sale.customer },
  salespersonId: sale.actorId,
  lines: sale.lines.map((line) => ({
    id: line.id,
    productId: line.productId,
    quantity: line.quantity,
    unitPriceKobo: line.unitPriceKobo,
  })),
  payments: sale.payments.map((payment) => ({
    id: payment.id,
    method: payment.method,
    amountKobo: payment.amountKobo,
  })),
})

const severityFor = (change: CorrectionChange): CorrectionSeverity => {
  if (change.field === 'note') return 'ordinary'
  if (
    change.field === 'customer_identity' ||
    change.field === 'salesperson_attribution'
  )
    return 'high_integrity'
  return 'material'
}

const paymentTotals = (
  payments: Array<{ method: PaymentMethod; amountKobo: number }>,
) => {
  let cash = 0
  let nonCash = 0
  let credit = 0
  for (const payment of payments) {
    if (payment.method === 'cash') cash += payment.amountKobo
    else nonCash += payment.amountKobo
    if (payment.method === 'customer_credit') credit += payment.amountKobo
  }
  return { cash, nonCash, credit }
}

const financialDelta = (
  before: SaleSnapshot,
  after: SaleSnapshot,
): FinancialEffect => ({
  totalDueKobo: after.totalDueKobo - before.totalDueKobo,
  taxKobo: after.taxKobo - before.taxKobo,
  cogsKobo: after.cogsKobo - before.cogsKobo,
  grossProfitKobo: after.grossProfitKobo - before.grossProfitKobo,
  cashKobo: after.cashKobo - before.cashKobo,
  nonCashKobo: after.nonCashKobo - before.nonCashKobo,
  creditKobo: after.creditKobo - before.creditKobo,
})

const clone = <T>(value: T): T => structuredClone(value)

export class ReturnsCorrectionsEngine {
  private readonly corrections = new Map<string, CorrectionEvent>()
  private readonly returns = new Map<string, ReturnRecord>()
  private readonly audits: IntegrityAuditEvent[] = []
  private readonly reportEvents: Array<
    FinancialEffect & {
      id: string
      type:
        | 'sale.correction.applied'
        | 'sale.return.applied'
        | 'sale.reversal.applied'
      businessId: string
      saleId: string
      occurredAt: string
    }
  > = []
  private nextId = 1

  constructor(
    private readonly domains: {
      sales: SalesTransactionEngine
      inventory: InventoryEngine
      credit: CustomersCreditEngine
    },
    private readonly config: { correctionWindowMinutes: number } = {
      correctionWindowMinutes: 15,
    },
  ) {}

  correctSale(input: SaleCorrectionInput): CorrectionEvent {
    const existing = this.corrections.get(
      `${input.businessId}:${input.clientEventId}`,
    )
    if (existing) return clone(existing)

    const sale = this.getSale(input.businessId, input.saleId)
    const original = snapshotSale(sale)
    const occurredAt = input.occurredAt ?? now()
    const windowExpired =
      minutesBetween(sale.completedAt, occurredAt) >
      this.config.correctionWindowMinutes
    const severity = severityFor(input.change)

    if (!input.reason.trim())
      throw new IntegrityError(
        'reason_required',
        'A correction reason is required',
      )

    this.assertCorrectionAuthority(input, sale, severity, windowExpired)

    if (
      severity !== 'ordinary' &&
      this.hasDependentEvent(input.businessId, sale.id)
    )
      throw new IntegrityError(
        'dependent_event',
        'A dependent return or reversal already exists; resolve the resulting record before correcting the original sale',
      )

    const corrected = this.correctedSnapshot(original, input.change)
    const effect = financialDelta(original, corrected)
    const inventoryEvents: InventoryEvent[] = []
    let creditEvent: CreditHistoryEvent | undefined

    if (input.change.field === 'quantity') {
      const change = input.change
      const originalLine = original.lines.find(
        (line) => line.id === change.lineId,
      )
      if (!originalLine)
        throw new IntegrityError(
          'invalid_correction',
          'Sale line was not found',
        )
      const deltaQuantity = change.correctedQuantity - originalLine.quantity
      if (deltaQuantity === 0)
        throw new IntegrityError(
          'invalid_correction',
          'Correction has no effect',
        )

      const originalInventoryEvent = this.domains.inventory
        .listEvents(change.productId)
        .find((event) => event.type === 'sale' && event.referenceId === sale.id)
      inventoryEvents.push(
        this.domains.inventory.adjust({
          businessId: input.businessId,
          productId: change.productId,
          quantity:
            inventoryQuantity(Math.abs(deltaQuantity)) *
            (deltaQuantity > 0 ? -1n : 1n),
          condition: 'sellable',
          actorId: input.actorId,
          reason: `sale-correction:${input.clientEventId}`,
          clientEventId: `${input.clientEventId}:inventory`,
          adjustmentId: `correction:${input.clientEventId}`,
          unitCost: originalInventoryEvent?.unitCost ?? undefined,
          occurredAt,
        }),
      )
    }

    if (
      sale.creditKobo > 0 &&
      corrected.creditKobo !== original.creditKobo &&
      input.customerId &&
      input.debtId
    ) {
      creditEvent = this.domains.credit.correctCreditSale({
        businessId: input.businessId,
        customerId: input.customerId,
        debtId: input.debtId,
        amountMinor: BigInt(original.creditKobo),
        correctedAmountMinor: BigInt(corrected.creditKobo),
        actorId: input.actorId,
        actorRole: input.actorRole,
        reason: input.reason,
        clientEventId: `${input.clientEventId}:credit`,
        occurredAt,
      })
    }

    const event: CorrectionEvent = {
      id: `integrity-${this.nextId++}`,
      type: 'sale.correction.applied',
      businessId: input.businessId,
      saleId: sale.id,
      clientEventId: input.clientEventId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      reason: input.reason,
      occurredAt,
      recordedAt: now(),
      state: 'applied',
      severity,
      windowExpired,
      ownerReviewRequired:
        input.actorRole === 'manager' &&
        sale.actorId === input.actorId &&
        severity !== 'ordinary',
      syncState: input.isOffline ? 'local_only' : 'accepted',
      original,
      corrected,
      approval: input.approval,
      financialEffect: effect,
      downstream: {
        inventoryEventIds: inventoryEvents.map((event) => event.id),
        reportEventId: `report-${this.nextId++}`,
        creditEventId: creditEvent?.id,
      },
    }

    this.reportEvents.push({
      ...effect,
      id: event.downstream.reportEventId,
      type: 'sale.correction.applied',
      businessId: input.businessId,
      saleId: sale.id,
      occurredAt,
    })
    this.corrections.set(`${input.businessId}:${input.clientEventId}`, event)
    this.audits.push(this.toAudit(event))
    return clone(event)
  }

  reverseSale(input: SaleReversalInput): CorrectionEvent {
    const existing = this.corrections.get(
      `${input.businessId}:${input.clientEventId}`,
    )
    if (existing) return clone(existing)

    const sale = this.getSale(input.businessId, input.saleId)
    if (!input.reason.trim())
      throw new IntegrityError(
        'reason_required',
        'A reversal reason is required',
      )
    if (!isManagement(input.actorRole))
      throw new IntegrityError(
        'unauthorized_correction',
        'Only Manager or Owner may reverse a sale',
      )
    if (
      input.actorRole === 'manager' &&
      !this.validSeparateApproval(
        input.actorId,
        input.actorRole,
        input.approval,
      )
    )
      throw new IntegrityError(
        'unauthorized_correction',
        'Manager reversal requires separate management approval',
      )
    if (sale.reversedAt)
      throw new IntegrityError(
        'dependent_event',
        'The sale has already been reversed',
      )

    const original = snapshotSale(sale)
    const occurredAt = input.occurredAt ?? now()
    this.domains.sales.reverse(
      input.businessId,
      input.saleId,
      input.actorId,
      input.actorRole,
    )

    let creditEvent: CreditHistoryEvent | undefined
    if (sale.creditKobo > 0 && input.customerId && input.debtId) {
      creditEvent = this.domains.credit.reverseCreditSale({
        businessId: input.businessId,
        customerId: input.customerId,
        debtId: input.debtId,
        amountMinor: BigInt(sale.creditKobo),
        actorId: input.actorId,
        actorRole: input.actorRole,
        reason: input.reason,
        clientEventId: `${input.clientEventId}:credit`,
        occurredAt,
      })
    }

    const effect: FinancialEffect = {
      totalDueKobo: -sale.totalDueKobo,
      taxKobo: -sale.taxKobo,
      cogsKobo: -sale.cogsKobo,
      grossProfitKobo: -sale.grossProfitKobo,
      cashKobo: -sale.cashKobo,
      nonCashKobo: -sale.nonCashKobo,
      creditKobo: -sale.creditKobo,
    }
    const event: CorrectionEvent = {
      id: `integrity-${this.nextId++}`,
      type: 'sale.reversal.applied',
      businessId: input.businessId,
      saleId: sale.id,
      clientEventId: input.clientEventId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      reason: input.reason,
      occurredAt,
      recordedAt: now(),
      state: 'applied',
      severity: 'material',
      windowExpired:
        minutesBetween(sale.completedAt, occurredAt) >
        this.config.correctionWindowMinutes,
      ownerReviewRequired:
        input.actorRole === 'manager' && sale.actorId === input.actorId,
      syncState: input.isOffline ? 'local_only' : 'accepted',
      original,
      approval: input.approval,
      financialEffect: effect,
      downstream: {
        inventoryEventIds: this.domains.inventory
          .listEvents()
          .filter(
            (inventoryEvent) =>
              inventoryEvent.type === 'customer_return' &&
              inventoryEvent.referenceId === sale.id,
          )
          .map((inventoryEvent) => inventoryEvent.id),
        reportEventId: `report-${this.nextId++}`,
        creditEventId: creditEvent?.id,
      },
    }
    // The sales engine already emits `sale.reversed`; this identifier points at
    // that authoritative report event instead of creating a second adjustment.
    event.downstream.reportEventId = `sales-report:sale.reversed:${sale.id}`
    this.corrections.set(`${input.businessId}:${input.clientEventId}`, event)
    this.audits.push(this.toAudit(event))
    return clone(event)
  }

  requestReturn(input: ReturnRequestInput): ReturnRecord {
    const existing = this.returns.get(
      `${input.businessId}:${input.clientEventId}`,
    )
    if (existing) return clone(existing)

    const sale = this.getSale(input.businessId, input.saleId)
    if (!input.reason.trim())
      throw new IntegrityError('reason_required', 'A return reason is required')
    for (const line of input.lines) {
      const saleLine = sale.lines.find(
        (candidate) => candidate.id === line.lineId,
      )
      if (!saleLine || saleLine.productId !== line.productId)
        throw new IntegrityError(
          'invalid_return',
          'Return line does not match the sale',
        )
      if (line.quantity <= 0 || line.quantity > saleLine.quantity)
        throw new IntegrityError(
          'invalid_return',
          'Return quantity must be positive and cannot exceed the sale quantity',
        )
    }

    const record: ReturnRecord = {
      id: input.returnId,
      businessId: input.businessId,
      saleId: input.saleId,
      clientEventId: input.clientEventId,
      state: 'requested',
      reason: input.reason,
      requestedById: input.requestedById,
      requestedByRole: input.requestedByRole,
      requestedAt: input.occurredAt ?? now(),
      lines: input.lines.map((line) => ({ ...line })),
      customerId: input.customerId,
      debtId: input.debtId,
      inventoryEventIds: [],
      syncState: input.isOffline ? 'local_only' : 'accepted',
    }
    this.returns.set(`${input.businessId}:${input.returnId}`, record)
    return clone(record)
  }

  verifyReturn(
    businessId: string,
    returnId: string,
    actorId: string,
    actorRole: Role,
  ): ReturnRecord {
    const record = this.getReturnRecord(businessId, returnId)
    if (record.state === 'verified') return clone(record)
    if (record.state !== 'requested')
      throw new IntegrityError(
        'illegal_transition',
        `Cannot verify a return in ${record.state}`,
      )
    if (!isManagement(actorRole))
      throw new IntegrityError(
        'unauthorized_correction',
        'Only Manager or Owner may verify a return',
      )
    record.state = 'verified'
    record.verifiedAt = now()
    record.verifiedById = actorId
    return clone(record)
  }

  approveReturn(
    businessId: string,
    returnId: string,
    actorId: string,
    actorRole: Role,
    decision: { condition: 'sellable' | 'held' },
  ): ReturnRecord {
    const record = this.getReturnRecord(businessId, returnId)
    if (record.state === 'approved') return clone(record)
    if (record.state !== 'verified')
      throw new IntegrityError(
        'illegal_transition',
        `Cannot approve a return in ${record.state}`,
      )
    if (
      !isManagement(actorRole) ||
      !canApprove(
        record.requestedByRole,
        actorRole,
        record.requestedById,
        actorId,
      )
    )
      throw new IntegrityError(
        'unauthorized_correction',
        'Return approval requires a separate Manager or Owner',
      )
    record.state = 'approved'
    record.approvedAt = now()
    record.approvedById = actorId
    record.condition = decision.condition
    return clone(record)
  }

  applyReturn(
    businessId: string,
    returnId: string,
    actorId: string,
    actorRole: Role,
  ): ReturnRecord {
    const record = this.getReturnRecord(businessId, returnId)
    if (record.state === 'applied' || record.state === 'settled')
      return clone(record)
    if (record.state !== 'approved')
      throw new IntegrityError(
        'illegal_transition',
        `Cannot apply a return in ${record.state}`,
      )
    if (!isManagement(actorRole))
      throw new IntegrityError(
        'unauthorized_correction',
        'Only Manager or Owner may apply an approved return',
      )

    const sale = this.getSale(businessId, record.saleId)
    const original = snapshotSale(sale)
    const appliedAt = now()
    const effect: FinancialEffect = {
      totalDueKobo: 0,
      taxKobo: 0,
      cogsKobo: 0,
      grossProfitKobo: 0,
      cashKobo: 0,
      nonCashKobo: 0,
      creditKobo: 0,
    }

    for (const line of record.lines) {
      const saleLine = sale.lines.find(
        (candidate) => candidate.id === line.lineId,
      )!
      const proportion = line.quantity / saleLine.quantity
      const value = line.valueKobo ?? saleLine.unitPriceKobo * line.quantity
      const lineTotal = saleLine.unitPriceKobo * line.quantity
      effect.totalDueKobo -= value
      effect.taxKobo -= roundHalfUp(sale.taxKobo * proportion)
      const lineCogs = roundHalfUp(
        (sale.cogsKobo * line.quantity) / saleLine.quantity,
      )
      effect.cogsKobo -= lineCogs
      effect.grossProfitKobo -= value - lineCogs

      const inventoryEvent = this.domains.inventory.return({
        businessId,
        productId: line.productId,
        quantity: inventoryQuantity(line.quantity),
        actorId,
        reason: `return:${record.id}`,
        clientEventId: `${record.clientEventId}:inventory:${line.lineId}`,
        returnId: `${record.id}:${line.lineId}`,
        originalSaleId: sale.id,
        condition: record.condition ?? 'sellable',
      })
      record.inventoryEventIds.push(inventoryEvent.id)
      void lineTotal
    }

    let refundAmount = -effect.totalDueKobo
    if (sale.creditKobo > 0 && record.customerId && record.debtId) {
      const outstanding =
        this.domains.credit.getDebt(
          businessId,
          record.customerId,
          record.debtId,
        )?.outstandingMinor ?? 0n
      const creditAmount =
        refundAmount > Number(outstanding) ? Number(outstanding) : refundAmount
      if (creditAmount > 0) {
        const creditEvent = this.domains.credit.recordApprovedReturn({
          businessId,
          customerId: record.customerId,
          debtId: record.debtId,
          amountMinor: BigInt(creditAmount),
          actorId,
          actorRole,
          reason: record.reason,
          clientEventId: `${record.clientEventId}:credit`,
        })
        record.creditEffect = {
          amountKobo: creditAmount,
          resultingOutstandingKobo: Number(
            creditEvent.resultingOutstandingMinor ?? 0n,
          ),
          creditEventId: creditEvent.id,
        }
        refundAmount -= creditAmount
      }
    }

    effect.creditKobo = record.creditEffect
      ? -record.creditEffect.amountKobo
      : 0
    if (refundAmount > 0) {
      if (sale.creditKobo === refundAmount) {
        effect.creditKobo -= refundAmount
      } else if (sale.cashKobo > 0) effect.cashKobo -= refundAmount
      else effect.nonCashKobo -= refundAmount
    }

    record.state = 'applied'
    record.appliedAt = appliedAt
    record.financialEffect = effect
    record.reportEventId = `report-${this.nextId++}`
    record.refund =
      refundAmount > 0
        ? { state: 'due', amountKobo: refundAmount }
        : { state: 'not_required', amountKobo: 0 }
    this.reportEvents.push({
      ...effect,
      id: record.reportEventId,
      type: 'sale.return.applied',
      businessId,
      saleId: sale.id,
      occurredAt: appliedAt,
    })
    this.audits.push({
      id: `integrity-${this.nextId++}`,
      type: 'sale.return.applied',
      businessId,
      saleId: sale.id,
      actorId,
      actorRole,
      reason: record.reason,
      occurredAt: appliedAt,
      recordedAt: now(),
      clientEventId: record.clientEventId,
      state: record.state,
      severity: 'material',
      ownerReviewRequired: false,
      original,
      financialEffect: effect,
      downstream: {
        inventoryEventIds: [...record.inventoryEventIds],
        reportEventId: record.reportEventId,
        creditEventId: record.creditEffect?.creditEventId,
      },
    })
    return clone(record)
  }

  rejectReturn(
    businessId: string,
    returnId: string,
    actorId: string,
    actorRole: Role,
  ): ReturnRecord {
    const record = this.getReturnRecord(businessId, returnId)
    if (record.state === 'rejected') return clone(record)
    if (record.state !== 'requested' && record.state !== 'verified')
      throw new IntegrityError(
        'illegal_transition',
        `Cannot reject a return in ${record.state}`,
      )
    if (
      !isManagement(actorRole) ||
      !canApprove(
        record.requestedByRole,
        actorRole,
        record.requestedById,
        actorId,
      )
    )
      throw new IntegrityError(
        'unauthorized_correction',
        'Return rejection requires a separate Manager or Owner',
      )
    record.state = 'rejected'
    return clone(record)
  }

  settleRefund(
    businessId: string,
    returnId: string,
    actorId: string,
    settlement: { method: PaymentMethod; externalReference?: string },
  ): ReturnRecord {
    const record = this.getReturnRecord(businessId, returnId)
    if (!record.refund || record.refund.state !== 'due')
      throw new IntegrityError(
        'invalid_refund',
        'Only a due refund can be settled',
      )
    record.refund = {
      ...record.refund,
      state: 'settled',
      method: settlement.method,
      externalReference: settlement.externalReference,
      settledAt: now(),
      settledById: actorId,
    }
    record.state = 'settled'
    return clone(record)
  }

  getCorrection(
    businessId: string,
    clientEventId: string,
  ): CorrectionEvent | undefined {
    const event = this.corrections.get(`${businessId}:${clientEventId}`)
    return event && clone(event)
  }

  getReturn(businessId: string, returnId: string): ReturnRecord | undefined {
    const record = this.returns.get(`${businessId}:${returnId}`)
    return record && clone(record)
  }

  listAuditEvents(): IntegrityAuditEvent[] {
    return this.audits.map((event) => clone(event))
  }

  listOwnerReviewRequired(businessId: string): CorrectionEvent[] {
    return [...this.corrections.values()]
      .filter(
        (event) => event.businessId === businessId && event.ownerReviewRequired,
      )
      .map((event) => clone(event))
  }

  getReportingSnapshot(businessId: string): FinancialEffect & {
    sourceEventCount: number
  } {
    const result = {
      totalDueKobo: 0,
      taxKobo: 0,
      cogsKobo: 0,
      grossProfitKobo: 0,
      cashKobo: 0,
      nonCashKobo: 0,
      creditKobo: 0,
      sourceEventCount: 0,
    }
    for (const event of this.domains.sales.listReports()) {
      if (event.businessId !== businessId) continue
      result.totalDueKobo += event.totalDueKobo
      result.taxKobo += event.taxKobo
      result.cogsKobo += event.cogsKobo
      result.grossProfitKobo += event.grossProfitKobo
      result.cashKobo += event.cashKobo
      result.nonCashKobo += event.nonCashKobo
      result.creditKobo += event.creditKobo
      result.sourceEventCount++
    }
    for (const event of this.reportEvents) {
      if (event.businessId !== businessId) continue
      result.totalDueKobo += event.totalDueKobo
      result.taxKobo += event.taxKobo
      result.cogsKobo += event.cogsKobo
      result.grossProfitKobo += event.grossProfitKobo
      result.cashKobo += event.cashKobo
      result.nonCashKobo += event.nonCashKobo
      result.creditKobo += event.creditKobo
      result.sourceEventCount++
    }
    return result
  }

  queueSync(businessId: string, clientEventId: string): void {
    const correction = this.corrections.get(`${businessId}:${clientEventId}`)
    if (correction && correction.syncState === 'local_only')
      correction.syncState = 'pending_sync'
    const returned = [...this.returns.values()].find(
      (record) =>
        record.businessId === businessId &&
        record.clientEventId === clientEventId,
    )
    if (returned && returned.syncState === 'local_only')
      returned.syncState = 'pending_sync'
  }

  acceptSync(businessId: string, clientEventId: string): void {
    const correction = this.corrections.get(`${businessId}:${clientEventId}`)
    if (correction && correction.syncState === 'pending_sync')
      correction.syncState = 'accepted'
    const returned = [...this.returns.values()].find(
      (record) =>
        record.businessId === businessId &&
        record.clientEventId === clientEventId,
    )
    if (returned && returned.syncState === 'pending_sync')
      returned.syncState = 'accepted'
  }

  private getSale(businessId: string, saleId: string): CompletedSale {
    const sale = this.domains.sales.getSale(businessId, saleId)
    if (!sale)
      throw new IntegrityError(
        'sale_not_found',
        'Sale was not found in this business',
      )
    return sale
  }

  private assertCorrectionAuthority(
    input: SaleCorrectionInput,
    sale: CompletedSale,
    severity: CorrectionSeverity,
    windowExpired: boolean,
  ): void {
    if (severity === 'ordinary') {
      if (isManagement(input.actorRole)) return
      if (!windowExpired && sale.actorId === input.actorId) return
      throw new IntegrityError(
        'unauthorized_correction',
        'Only the original salesperson inside the correction window or management may correct this sale',
      )
    }

    if (input.actorRole === 'owner') return
    if (input.actorRole !== 'manager')
      throw new IntegrityError(
        'unauthorized_correction',
        'This correction requires management authorization',
      )
    if (
      severity === 'high_integrity' &&
      input.approval?.approverRole !== 'owner'
    )
      throw new IntegrityError(
        'unauthorized_correction',
        'A high-integrity correction requires Owner authority',
      )
    if (
      !this.validSeparateApproval(
        input.actorId,
        input.actorRole,
        input.approval,
      )
    )
      throw new IntegrityError(
        'unauthorized_correction',
        'This correction requires separate management authorization',
      )
  }

  private validSeparateApproval(
    actorId: string,
    actorRole: Role,
    approval?: ManagementApproval,
  ): approval is ManagementApproval {
    return Boolean(
      approval &&
      canApprove(
        actorRole,
        approval.approverRole,
        actorId,
        approval.approverId,
      ),
    )
  }

  private correctedSnapshot(
    original: SaleSnapshot,
    change: CorrectionChange,
  ): SaleSnapshot {
    const corrected = clone(original)
    if (change.field === 'note') {
      corrected.note = change.correctedValue
      return corrected
    }
    if (change.field === 'customer_identity') {
      corrected.customer = {
        id: change.customerId,
        name: change.customerName,
        phone: change.customerPhone,
      }
      return corrected
    }
    if (change.field === 'salesperson_attribution') {
      corrected.salespersonId = change.salespersonId
      return corrected
    }
    if (change.field === 'payment_amount') {
      const payment = corrected.payments.find(
        (candidate) => candidate.id === change.paymentId,
      )
      if (!payment)
        throw new IntegrityError('invalid_correction', 'Payment was not found')
      payment.amountKobo = change.correctedAmountKobo
      const totals = paymentTotals(corrected.payments)
      corrected.totalDueKobo = corrected.payments.reduce(
        (sum, payment) => sum + payment.amountKobo,
        0,
      )
      corrected.cashKobo = totals.cash
      corrected.nonCashKobo = totals.nonCash
      corrected.creditKobo = totals.credit
      return corrected
    }

    const line = corrected.lines.find(
      (candidate) => candidate.id === change.lineId,
    )
    if (!line)
      throw new IntegrityError('invalid_correction', 'Sale line was not found')
    const oldLineTotal = line.unitPriceKobo * line.quantity
    const newLineTotal = line.unitPriceKobo * change.correctedQuantity
    const proportion = change.correctedQuantity / line.quantity
    corrected.totalDueKobo += newLineTotal - oldLineTotal
    corrected.taxKobo +=
      roundHalfUp(original.taxKobo * proportion) - original.taxKobo
    const oldCogs = roundHalfUp(
      (original.cogsKobo * line.quantity) /
        original.lines.reduce((sum, candidate) => sum + candidate.quantity, 0),
    )
    const newCogs = roundHalfUp(oldCogs * proportion)
    corrected.cogsKobo += newCogs - oldCogs
    corrected.grossProfitKobo =
      corrected.totalDueKobo - corrected.taxKobo - corrected.cogsKobo
    line.quantity = change.correctedQuantity

    if (change.correctedPayments) {
      corrected.payments = change.correctedPayments.map((payment) => ({
        id: payment.id,
        method: payment.method,
        amountKobo: payment.amountKobo,
      }))
      const paymentTotal = corrected.payments.reduce(
        (sum, payment) => sum + payment.amountKobo,
        0,
      )
      if (paymentTotal !== corrected.totalDueKobo)
        throw new IntegrityError(
          'invalid_correction',
          'Corrected payments must equal the corrected sale total',
        )
    } else {
      const factor = corrected.totalDueKobo / original.totalDueKobo
      corrected.payments = original.payments.map((payment) => ({
        ...payment,
        amountKobo: roundHalfUp(payment.amountKobo * factor),
      }))
    }
    const totals = paymentTotals(corrected.payments)
    corrected.cashKobo = totals.cash
    corrected.nonCashKobo = totals.nonCash
    corrected.creditKobo = totals.credit
    return corrected
  }

  private hasDependentEvent(businessId: string, saleId: string): boolean {
    const sale = this.getSale(businessId, saleId)
    if (sale.reversedAt) return true
    return [...this.returns.values()].some(
      (record) =>
        record.businessId === businessId &&
        record.saleId === saleId &&
        record.state === 'applied',
    )
  }

  private getReturnRecord(businessId: string, returnId: string): ReturnRecord {
    const record = this.returns.get(`${businessId}:${returnId}`)
    if (!record)
      throw new IntegrityError(
        'return_not_found',
        'Return was not found in this business',
      )
    return record
  }

  private toAudit(event: CorrectionEvent): IntegrityAuditEvent {
    return {
      id: `audit-${this.nextId++}`,
      type: event.type,
      businessId: event.businessId,
      saleId: event.saleId,
      actorId: event.actorId,
      actorRole: event.actorRole,
      reason: event.reason,
      occurredAt: event.occurredAt,
      recordedAt: event.recordedAt,
      clientEventId: event.clientEventId,
      state: event.state,
      severity: event.severity,
      ownerReviewRequired: event.ownerReviewRequired,
      original: event.original,
      corrected: event.corrected,
      financialEffect: event.financialEffect,
      downstream: event.downstream,
    }
  }
}
