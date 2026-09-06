import {
  canApprove,
  type ReconciliationState,
  type Role,
} from './stateMachines'

export type CashCustodyMode = 'shared_drawer' | 'individual_salesperson'
export type CashEventKind = 'cash_in' | 'cash_out' | 'cash_sale' | 'cash_refund'
export type DiscrepancyStatus = 'none' | 'unresolved' | 'explained' | 'resolved'

export type CashAuditEvent = Readonly<{
  id: string
  businessId: string
  sessionId: string
  type: string
  actorId: string
  actorRole: Role
  occurredAt: string
  reason?: string
  details: Record<string, string | number | boolean | undefined>
}>

export type CashEvent = Readonly<{
  id: string
  sessionId: string
  businessId: string
  kind: CashEventKind
  amountKobo: number
  actorId: string
  actorRole: Role
  cashAccountId: string
  reason: string
  occurredAt: string
}>

export type InterimCashCount = Readonly<{
  id: string
  sessionId: string
  cashAccountId: string
  actualCashKobo: number
  actorId: string
  actorRole: Role
  occurredAt: string
  note?: string
}>

export type CashReconciliationSnapshot = Readonly<{
  sessionId: string
  businessId: string
  state: ReconciliationState
  custodyMode: CashCustodyMode
  confirmedOpeningCashKobo: number
  cashSalesKobo: number
  cashInKobo: number
  cashOutKobo: number
  cashRefundsKobo: number
  expectedCashKobo: number
  actualCashKobo?: number
  cashVarianceKobo?: number
  discrepancyStatus: DiscrepancyStatus
  discrepancyExplanation?: string
  unresolved: boolean
  cashAccountId?: string
}>

type Session = {
  id: string
  businessId: string
  custodyMode: CashCustodyMode
  state: ReconciliationState
  openingEnteredKobo?: number
  confirmedOpeningCashKobo?: number
  confirmedOpeningByAccount: Map<string, number>
  actualCashKobo?: number
  actualCashByAccount: Map<string, number>
  discrepancyStatus: DiscrepancyStatus
  discrepancyExplanation?: string
  events: CashEvent[]
  interimCounts: InterimCashCount[]
}

const now = () => new Date().toISOString()

const assertAmount = (amountKobo: number): void => {
  if (!Number.isInteger(amountKobo) || amountKobo <= 0)
    throw new CashReconciliationError(
      'INVALID_AMOUNT',
      'Amount must be a positive integer number of kobo',
    )
}

const assertNonNegativeAmount = (amountKobo: number): void => {
  if (!Number.isInteger(amountKobo) || amountKobo < 0)
    throw new CashReconciliationError(
      'INVALID_AMOUNT',
      'Amount must be a non-negative integer number of kobo',
    )
}

const management = (role: Role): boolean =>
  role === 'manager' || role === 'owner'

export class CashReconciliationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'CashReconciliationError'
  }
}

export class CashReconciliationEngine {
  private readonly sessions = new Map<string, Session>()
  private readonly audits: CashAuditEvent[] = []
  private nextAuditId = 1

  openBusinessDay(input: {
    businessId: string
    sessionId: string
    custodyMode: CashCustodyMode
    actorId: string
    actorRole: Role
    occurredAt?: string
  }): CashReconciliationSnapshot {
    if (this.sessions.has(`${input.businessId}:${input.sessionId}`))
      throw new CashReconciliationError(
        'DUPLICATE_SESSION',
        'Business-day session already exists',
      )
    const session: Session = {
      id: input.sessionId,
      businessId: input.businessId,
      custodyMode: input.custodyMode,
      state: 'open_session',
      discrepancyStatus: 'none',
      confirmedOpeningByAccount: new Map(),
      actualCashByAccount: new Map(),
      events: [],
      interimCounts: [],
    }
    this.sessions.set(`${input.businessId}:${input.sessionId}`, session)
    this.audit(
      session,
      'business_day.opened',
      input.actorId,
      input.actorRole,
      input.occurredAt,
    )
    return this.snapshot(session)
  }

  enterOpeningCash(
    businessId: string,
    sessionId: string,
    amountKobo: number,
    actorId: string,
    actorRole: Role,
  ): CashReconciliationSnapshot {
    const session = this.getSession(businessId, sessionId)
    assertNonNegativeAmount(amountKobo)
    if (
      session.state !== 'open_session' ||
      session.confirmedOpeningCashKobo !== undefined
    )
      throw new CashReconciliationError(
        'INVALID_STATE',
        'Opening cash can only be entered before management confirmation',
      )
    session.openingEnteredKobo = amountKobo
    this.audit(session, 'opening_cash.entered', actorId, actorRole, undefined, {
      amountKobo,
    })
    return this.snapshot(session)
  }

  confirmOpeningCash(
    businessId: string,
    sessionId: string,
    amountKobo: number,
    actorId: string,
    actorRole: Role,
    reason?: string,
    cashAccountId?: string,
  ): CashReconciliationSnapshot {
    const session = this.getSession(businessId, sessionId)
    assertNonNegativeAmount(amountKobo)
    if (!management(actorRole))
      throw new CashReconciliationError(
        'FORBIDDEN',
        'Only management may confirm official opening cash',
      )
    if (session.state !== 'open_session')
      throw new CashReconciliationError(
        'INVALID_STATE',
        'Opening cash is no longer editable',
      )
    session.confirmedOpeningCashKobo = amountKobo
    if (cashAccountId) {
      session.confirmedOpeningByAccount.set(cashAccountId, amountKobo)
      session.confirmedOpeningCashKobo = this.total(
        session.confirmedOpeningByAccount.values(),
      )
    }
    this.audit(
      session,
      'opening_cash.confirmed',
      actorId,
      actorRole,
      undefined,
      { amountKobo, reason },
    )
    return this.snapshot(session)
  }

  recordCashEvent(input: {
    businessId: string
    sessionId: string
    id: string
    kind: CashEventKind
    amountKobo: number
    actorId: string
    actorRole: Role
    reason: string
    cashAccountId?: string
    occurredAt?: string
  }): CashEvent {
    const session = this.getSession(input.businessId, input.sessionId)
    assertAmount(input.amountKobo)
    if (session.confirmedOpeningCashKobo === undefined)
      throw new CashReconciliationError(
        'OPENING_CASH_REQUIRED',
        'Official opening cash must be confirmed first',
      )
    if (session.state === 'closed')
      throw new CashReconciliationError(
        'DAY_CLOSED',
        'Closed business days cannot accept cash events',
      )
    if (!input.reason.trim())
      throw new CashReconciliationError(
        'REASON_REQUIRED',
        'Cash movement reason is required',
      )
    if (
      session.custodyMode === 'individual_salesperson' &&
      !input.cashAccountId
    )
      throw new CashReconciliationError(
        'CASH_ACCOUNT_REQUIRED',
        'Individual cash custody requires the responsible salesperson account',
      )
    const event: CashEvent = {
      id: input.id,
      sessionId: session.id,
      businessId: session.businessId,
      kind: input.kind,
      amountKobo: input.amountKobo,
      actorId: input.actorId,
      actorRole: input.actorRole,
      cashAccountId: input.cashAccountId ?? 'shared-drawer',
      reason: input.reason,
      occurredAt: input.occurredAt ?? now(),
    }
    if (session.events.some((candidate) => candidate.id === event.id))
      return session.events.find((candidate) => candidate.id === event.id)!
    session.events.push(event)
    this.audit(
      session,
      `cash.${input.kind}.recorded`,
      input.actorId,
      input.actorRole,
      event.occurredAt,
      {
        amountKobo: input.amountKobo,
        cashAccountId: event.cashAccountId,
        reason: input.reason,
      },
    )
    return event
  }

  recordInterimCount(input: {
    businessId: string
    sessionId: string
    id: string
    actualCashKobo: number
    actorId: string
    actorRole: Role
    cashAccountId?: string
    note?: string
    occurredAt?: string
  }): InterimCashCount {
    const session = this.getSession(input.businessId, input.sessionId)
    assertNonNegativeAmount(input.actualCashKobo)
    if (!management(input.actorRole))
      throw new CashReconciliationError(
        'FORBIDDEN',
        'Only management may record interim cash checkpoints',
      )
    if (session.state === 'closed')
      throw new CashReconciliationError(
        'DAY_CLOSED',
        'Closed business days cannot accept checkpoints',
      )
    const count: InterimCashCount = {
      id: input.id,
      sessionId: session.id,
      cashAccountId: input.cashAccountId ?? 'shared-drawer',
      actualCashKobo: input.actualCashKobo,
      actorId: input.actorId,
      actorRole: input.actorRole,
      occurredAt: input.occurredAt ?? now(),
      note: input.note,
    }
    session.interimCounts.push(count)
    this.audit(
      session,
      'cash.interim_count.recorded',
      input.actorId,
      input.actorRole,
      count.occurredAt,
      {
        actualCashKobo: count.actualCashKobo,
        cashAccountId: count.cashAccountId,
      },
    )
    return count
  }

  recordActualCash(
    businessId: string,
    sessionId: string,
    actualCashKobo: number,
    actorId: string,
    actorRole: Role,
    cashAccountId?: string,
  ): CashReconciliationSnapshot {
    const session = this.getSession(businessId, sessionId)
    assertNonNegativeAmount(actualCashKobo)
    if (session.state === 'closed')
      throw new CashReconciliationError(
        'DAY_CLOSED',
        'Closed business days require reopen before recounting',
      )
    session.actualCashKobo = actualCashKobo
    if (cashAccountId) {
      session.actualCashByAccount.set(cashAccountId, actualCashKobo)
      session.actualCashKobo = this.total(session.actualCashByAccount.values())
    }
    session.state = 'count_recorded'
    this.audit(
      session,
      'cash.actual_count.recorded',
      actorId,
      actorRole,
      undefined,
      { actualCashKobo },
    )
    return this.snapshot(session)
  }

  prepareReconciliation(
    businessId: string,
    sessionId: string,
    actorId: string,
    actorRole: Role,
  ): CashReconciliationSnapshot {
    const session = this.getSession(businessId, sessionId)
    if (session.custodyMode === 'individual_salesperson') {
      const accounts = new Set([
        ...session.confirmedOpeningByAccount.keys(),
        ...session.events.map((event) => event.cashAccountId),
      ])
      if (
        [...accounts].some(
          (accountId) => !session.actualCashByAccount.has(accountId),
        )
      )
        throw new CashReconciliationError(
          'ACTUAL_CASH_REQUIRED',
          'Physical Actual Cash counts are required for every responsible salesperson account',
        )
    }
    if (session.actualCashKobo === undefined)
      throw new CashReconciliationError(
        'ACTUAL_CASH_REQUIRED',
        'Physical Actual Cash count is required',
      )
    if (session.state !== 'count_recorded' && session.state !== 'reopened')
      throw new CashReconciliationError(
        'INVALID_STATE',
        'Reconciliation is not ready to prepare',
      )
    session.state = 'reconciliation_prepared'
    const variance = this.expected(session) - session.actualCashKobo
    session.discrepancyStatus = variance === 0 ? 'none' : 'unresolved'
    this.audit(
      session,
      'reconciliation.prepared',
      actorId,
      actorRole,
      undefined,
      {
        expectedCashKobo: this.expected(session),
        actualCashKobo: session.actualCashKobo,
        cashVarianceKobo: -variance,
      },
    )
    return this.snapshot(session)
  }

  confirmManagementReconciliation(
    businessId: string,
    sessionId: string,
    actorId: string,
    actorRole: Role,
  ): CashReconciliationSnapshot {
    const session = this.getSession(businessId, sessionId)
    if (!management(actorRole))
      throw new CashReconciliationError(
        'FORBIDDEN',
        'Only management may confirm a reconciliation',
      )
    if (session.state !== 'reconciliation_prepared')
      throw new CashReconciliationError(
        'INVALID_STATE',
        'Reconciliation must be prepared before management confirmation',
      )
    session.state = 'management_confirmed'
    this.audit(
      session,
      'reconciliation.management_confirmed',
      actorId,
      actorRole,
    )
    return this.snapshot(session)
  }

  closeBusinessDay(
    businessId: string,
    sessionId: string,
    actorId: string,
    actorRole: Role,
    reason?: string,
  ): CashReconciliationSnapshot {
    const session = this.getSession(businessId, sessionId)
    if (!management(actorRole))
      throw new CashReconciliationError(
        'FORBIDDEN',
        'Only management may close a business day',
      )
    if (session.state !== 'management_confirmed')
      throw new CashReconciliationError(
        'INVALID_STATE',
        'Management confirmation is required before closure',
      )
    session.state = 'closed'
    this.audit(session, 'business_day.closed', actorId, actorRole, undefined, {
      unresolved: session.discrepancyStatus === 'unresolved',
      reason,
    })
    return this.snapshot(session)
  }

  reopenBusinessDay(
    businessId: string,
    sessionId: string,
    actorId: string,
    actorRole: Role,
    reason: string,
    approval?: { approverId: string; approverRole: Role },
  ): CashReconciliationSnapshot {
    const session = this.getSession(businessId, sessionId)
    if (!management(actorRole))
      throw new CashReconciliationError(
        'FORBIDDEN',
        'Only management may reopen a closed business day',
      )
    if (session.state !== 'closed')
      throw new CashReconciliationError(
        'INVALID_STATE',
        'Only a closed business day may be reopened',
      )
    if (!reason.trim())
      throw new CashReconciliationError(
        'REASON_REQUIRED',
        'Reopen reason is required',
      )
    if (
      actorRole === 'manager' &&
      approval &&
      !canApprove(
        actorRole,
        approval.approverRole,
        actorId,
        approval.approverId,
      )
    )
      throw new CashReconciliationError(
        'INVALID_APPROVAL',
        'Reopen approval must be separate from the requesting manager',
      )
    session.state = 'reopened'
    this.audit(
      session,
      'business_day.reopened',
      actorId,
      actorRole,
      undefined,
      { reason, approverId: approval?.approverId },
    )
    return this.snapshot(session)
  }

  resolveDiscrepancy(
    businessId: string,
    sessionId: string,
    actorId: string,
    actorRole: Role,
    explanation: string,
  ): CashReconciliationSnapshot {
    const session = this.getSession(businessId, sessionId)
    if (!management(actorRole))
      throw new CashReconciliationError(
        'FORBIDDEN',
        'Only management may resolve discrepancies',
      )
    if (session.discrepancyStatus === 'none')
      throw new CashReconciliationError(
        'NO_DISCREPANCY',
        'This reconciliation has no discrepancy',
      )
    if (!explanation.trim())
      throw new CashReconciliationError(
        'REASON_REQUIRED',
        'Discrepancy explanation is required',
      )
    session.discrepancyStatus = 'resolved'
    session.discrepancyExplanation = explanation
    this.audit(
      session,
      'reconciliation.discrepancy.resolved',
      actorId,
      actorRole,
      undefined,
      { explanation },
    )
    return this.snapshot(session)
  }

  getSnapshot(
    businessId: string,
    sessionId: string,
    cashAccountId?: string,
  ): CashReconciliationSnapshot {
    return this.snapshot(this.getSession(businessId, sessionId), cashAccountId)
  }
  listEvents(businessId: string, sessionId: string): CashEvent[] {
    return [...this.getSession(businessId, sessionId).events]
  }
  listAudits(businessId?: string): CashAuditEvent[] {
    return this.audits
      .filter((event) => !businessId || event.businessId === businessId)
      .map((event) => ({ ...event, details: { ...event.details } }))
  }

  private expected(session: Session, cashAccountId?: string): number {
    const total = (kind: CashEventKind) =>
      session.events
        .filter(
          (event) =>
            event.kind === kind &&
            (!cashAccountId || event.cashAccountId === cashAccountId),
        )
        .reduce((sum, event) => sum + event.amountKobo, 0)
    return (
      (cashAccountId
        ? (session.confirmedOpeningByAccount.get(cashAccountId) ?? 0)
        : (session.confirmedOpeningCashKobo ?? 0)) +
      total('cash_sale') +
      total('cash_in') -
      total('cash_out') -
      total('cash_refund')
    )
  }
  private snapshot(
    session: Session,
    cashAccountId?: string,
  ): CashReconciliationSnapshot {
    const expectedCashKobo = this.expected(session, cashAccountId)
    const events = cashAccountId
      ? session.events.filter((event) => event.cashAccountId === cashAccountId)
      : session.events
    const actualCashKobo = cashAccountId
      ? session.actualCashByAccount.get(cashAccountId)
      : session.actualCashKobo
    const cashVarianceKobo =
      actualCashKobo === undefined
        ? undefined
        : actualCashKobo - expectedCashKobo
    const openingCash = cashAccountId
      ? (session.confirmedOpeningByAccount.get(cashAccountId) ?? 0)
      : (session.confirmedOpeningCashKobo ?? 0)
    return {
      sessionId: session.id,
      businessId: session.businessId,
      state: session.state,
      custodyMode: session.custodyMode,
      confirmedOpeningCashKobo: openingCash,
      cashSalesKobo: events
        .filter((e) => e.kind === 'cash_sale')
        .reduce((s, e) => s + e.amountKobo, 0),
      cashInKobo: events
        .filter((e) => e.kind === 'cash_in')
        .reduce((s, e) => s + e.amountKobo, 0),
      cashOutKobo: events
        .filter((e) => e.kind === 'cash_out')
        .reduce((s, e) => s + e.amountKobo, 0),
      cashRefundsKobo: events
        .filter((e) => e.kind === 'cash_refund')
        .reduce((s, e) => s + e.amountKobo, 0),
      expectedCashKobo,
      actualCashKobo,
      cashVarianceKobo,
      discrepancyStatus: session.discrepancyStatus,
      discrepancyExplanation: session.discrepancyExplanation,
      unresolved: session.discrepancyStatus === 'unresolved',
      cashAccountId,
    }
  }
  private getSession(businessId: string, sessionId: string): Session {
    const session = this.sessions.get(`${businessId}:${sessionId}`)
    if (!session)
      throw new CashReconciliationError(
        'SESSION_NOT_FOUND',
        'Business-day session was not found',
      )
    return session
  }
  private total(values: Iterable<number>): number {
    return [...values].reduce((sum, value) => sum + value, 0)
  }
  private audit(
    session: Session,
    type: string,
    actorId: string,
    actorRole: Role,
    occurredAt?: string,
    details: Record<string, string | number | boolean | undefined> = {},
  ): void {
    this.audits.push({
      id: `cash-audit-${this.nextAuditId++}`,
      businessId: session.businessId,
      sessionId: session.id,
      type,
      actorId,
      actorRole,
      occurredAt: occurredAt ?? now(),
      details,
    })
  }
}
