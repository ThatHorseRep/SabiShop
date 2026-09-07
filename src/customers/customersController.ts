import { executeAuthorized } from '../auth/server'
import { effectivePermissions } from '../auth/policy'
import type {
  AuditSink,
  AuthorizationAuditEvent,
  AuthSession,
  Permission,
} from '../auth/types'
import {
  CustomersCreditEngine,
  type CreditHistoryEvent,
  type CreditStatus,
  type Customer,
  type DebtSnapshot,
  type RepaymentAllocation,
  type RepaymentComponent,
} from '../domain/customersCredit'
import {
  InMemorySyncServer,
  LocalStorageStore,
  MemoryStorage,
  SyncCoordinator,
  type DurableStore,
  type JsonValue,
  type SyncOperation,
} from '../sync/offlineSync'
import {
  posActors,
  posBusiness,
  posDeviceId,
  type PosActor,
} from '../pos/posSession'

export const customersBusinessId = posBusiness.id

export type CustomerActorId = PosActor['id']

export type CustomerActor = PosActor

export const customerActors: readonly CustomerActor[] = posActors

export type CreditApprovalInput = {
  approverId: string
  approverRole: 'manager' | 'owner'
}

export type CustomerSummaryView = {
  customer: Customer
  outstandingMinor: bigint
  openDebtCount: number
  oldestOpenDebtAt: string | null
  hasDispute: boolean
  lastRepaymentAt: string | null
}

export type DebtView = {
  debt: DebtSnapshot
  events: CreditHistoryEvent[]
  repaidMinor: bigint
  returnedMinor: bigint
  writtenOffMinor: bigint
  correctionIncreaseMinor: bigint
  correctionReductionMinor: bigint
}

export type CustomerDetailView = {
  summary: CustomerSummaryView
  debts: DebtView[]
  history: CreditHistoryEvent[]
}

export type CustomerAttentionView = {
  kind: 'restricted' | 'disputed' | 'overdue'
  summary: CustomerSummaryView
  debt: DebtView | null
  note: string
}

export type RecentCreditEventView = {
  event: CreditHistoryEvent
  customer: Customer
}

export type CustomerCreditSnapshotView = {
  actor: CustomerActor
  permissions: readonly Permission[]
  customers: CustomerSummaryView[]
  selected: CustomerDetailView | null
  attention: CustomerAttentionView[]
  recentEvents: RecentCreditEventView[]
  activityEvents: RecentCreditEventView[]
  recentRepayments: RecentCreditEventView[]
  syncOperations: SyncOperation[]
  auditEventCount: number
}

export type CreditSaleInputView = {
  customerId: string
  amountMinor: bigint
  dueDate?: string
  approval: CreditApprovalInput
  overLimitApproval?: CreditApprovalInput
}

export type RepaymentInputView = {
  customerId: string
  components: RepaymentComponent[]
  allocations: RepaymentAllocation[]
}

export type DebtActionInputView = {
  customerId: string
  debtId: string
  amountMinor: bigint
  reason: string
}

export type DisputeInputView = {
  customerId: string
  debtId: string
  reason: string
}

export type CorrectionInputView = {
  customerId: string
  debtId: string
  correctedAmountMinor: bigint
  reason: string
}

/**
 * Reference session adapter shared with the POS and inventory workspaces.
 * The authoritative authentication provider replaces it without changing the
 * customer/credit workflow (Handoff 03).
 */
const sessionForActor = (actor: CustomerActor): AuthSession => {
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
        businessId: customersBusinessId,
        roles: [actor.role],
        active: true,
      },
    ],
    activeBusinessId: customersBusinessId,
    issuedAt: now,
    expiresAt: now + 8 * 60 * 60 * 1000,
  }
}

/**
 * Composition seam for the Customers & Credit workspace. The screens render
 * engine output only: customer identity, credit status/limit, debts,
 * repayments, allocation, and history all delegate to the verified
 * CustomersCreditEngine, and every mutation passes the authoritative
 * authorization boundary before touching the ledger.
 */
export class CustomerCreditController {
  private readonly credit = new CustomersCreditEngine()
  private readonly sessions = new Map<CustomerActorId, AuthSession>()
  private readonly auditEvents: AuthorizationAuditEvent[] = []
  private readonly coordinator: SyncCoordinator
  private readonly server = new InMemorySyncServer({
    authorize: () => true,
    apply: () => ({ acknowledgedAt: new Date().toISOString() }),
  })
  /** True when the browser store could not be used and work is session-only. */
  readonly storageUnavailable: boolean
  private selectedCustomerId: string | null = null
  private actorId: CustomerActorId = 'user-ngozi'
  private nextReference = 6000

  constructor(store?: DurableStore) {
    for (const actor of customerActors) {
      this.sessions.set(actor.id, sessionForActor(actor))
    }
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
      // Corrupt local state is preserved for review; fall back to a
      // session-scoped queue rather than replacing it (Handoff 14).
      this.coordinator = new SyncCoordinator(new MemoryStorage())
      storageUnavailable = true
    }
    this.storageUnavailable = storageUnavailable
    this.seedReferenceLedger()
  }

  setActor(actorId: CustomerActorId): void {
    if (!this.sessions.has(actorId)) throw new Error('Unknown actor')
    this.actorId = actorId
  }

  getActor(): CustomerActor {
    return customerActors.find((actor) => actor.id === this.actorId)!
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

  selectCustomer(customerId: string | null): void {
    this.selectedCustomerId = customerId
  }

  getSelectedCustomerId(): string | null {
    return this.selectedCustomerId
  }

  searchCustomers(query: string): CustomerSummaryView[] {
    const normalized = query.trim().toLocaleLowerCase()
    return this.customerSummaries().filter(
      (view) =>
        normalized.length === 0 ||
        view.customer.name.toLocaleLowerCase().includes(normalized) ||
        view.customer.phone
          .replace(/\s+/g, '')
          .includes(normalized.replace(/\s+/g, '')),
    )
  }

  snapshot(): CustomerCreditSnapshotView {
    const selected = this.selectedCustomerId
      ? this.customerDetail(this.selectedCustomerId)
      : null
    const summaries = this.customerSummaries()
    const allHistory = this.credit
      .listHistory(customersBusinessId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    const toEventView = (event: CreditHistoryEvent): RecentCreditEventView => ({
      event,
      customer:
        summaries.find((summary) => summary.customer.id === event.customerId)
          ?.customer ??
        ({
          id: event.customerId,
          businessId: customersBusinessId,
          name: 'Customer',
          phone: '',
          creditStatus: 'allowed',
          currency: 'NGN',
        } as Customer),
    })
    const recentEvents = allHistory.slice(0, 8).map(toEventView)
    const recentRepayments = allHistory
      .filter((event) => event.type === 'credit.repayment.recorded')
      .slice(0, 5)
      .map(toEventView)
    return {
      actor: this.getActor(),
      permissions: this.currentPermissions(),
      customers: summaries,
      selected,
      attention: this.attentionViews(summaries),
      recentEvents,
      activityEvents: allHistory.slice(0, 50).map(toEventView),
      recentRepayments,
      syncOperations: this.listOperations(),
      auditEventCount: this.auditEvents.length,
    }
  }

  async createCustomer(
    input: { name: string; phone: string },
    isOffline: boolean,
  ): Promise<Customer> {
    const id = this.reference('CUS')
    const customer = await this.authorized('business:work', id, isOffline, () =>
      this.credit.createCustomer({
        businessId: customersBusinessId,
        id,
        name: input.name,
        phone: input.phone,
        // Creating a customer never authorizes credit (C08 section 7).
        // Credit eligibility starts allowed with a zero limit, so the
        // first credit sale still requires a management exception.
        creditStatus: 'allowed',
        creditLimitMinor: 0n,
        actorId: this.actorUserId(),
      }),
    )
    this.enqueueLocalOperation(
      'customer.create',
      isOffline,
      { customerId: customer.id, name: customer.name, phone: customer.phone },
      'created',
      'identity_recorded',
      'not_required',
    )
    return customer
  }

  async setCreditStatus(
    input: {
      customerId: string
      creditStatus: CreditStatus
      reason?: string
    },
    isOffline: boolean,
  ): Promise<Customer> {
    return this.authorized('credit:approve', input.customerId, isOffline, () =>
      this.credit.setCreditStatus(
        customersBusinessId,
        input.customerId,
        input.creditStatus,
        this.actorUserId(),
        this.actorRole(),
        input.reason,
      ),
    )
  }

  async setCreditLimit(
    input: {
      customerId: string
      creditLimitMinor: bigint
      reason?: string
    },
    isOffline: boolean,
  ): Promise<Customer> {
    return this.authorized('credit:approve', input.customerId, isOffline, () =>
      this.credit.setCreditLimit(
        customersBusinessId,
        input.customerId,
        input.creditLimitMinor,
        this.actorUserId(),
        this.actorRole(),
        input.reason,
      ),
    )
  }

  /**
   * Records an authorized credit sale against a customer. Credit status,
   * limit enforcement, separate approval, and the over-limit exception are
   * all domain-engine rules; the authorization boundary additionally
   * re-checks requester/approver separation before the ledger is touched.
   */
  async recordCreditSale(
    input: CreditSaleInputView,
    isOffline: boolean,
  ): Promise<CreditHistoryEvent> {
    const debtId = this.reference('DEBT')
    const saleId = this.reference('SAL')
    const clientEventId = this.reference('client-credit-sale')
    const event = await this.authorized(
      'credit:request',
      `${input.customerId}:${debtId}`,
      isOffline,
      () =>
        this.credit.recordCreditSale({
          businessId: customersBusinessId,
          customerId: input.customerId,
          debtId,
          saleId,
          amountMinor: input.amountMinor,
          dueDate: input.dueDate,
          actorId: this.actorUserId(),
          actorRole: this.actorRole(),
          clientEventId,
          creditApproval: input.approval,
          overLimitApproval: input.overLimitApproval,
        }),
      {
        requiresApproval: true,
        approval: this.approvalEvidence(input.approval),
      },
    )
    this.enqueueLocalOperation(
      'credit.sale.record',
      isOffline,
      {
        customerId: input.customerId,
        debtId,
        saleId,
        amountMinor: input.amountMinor.toString(),
      },
      'recorded',
      'not_applicable',
      'approved',
    )
    return event
  }

  async recordRepayment(
    input: RepaymentInputView,
    isOffline: boolean,
  ): Promise<CreditHistoryEvent> {
    const repaymentId = this.reference('RCP')
    const clientEventId = this.reference('client-repayment')
    const event = await this.authorized(
      'repayment:record',
      `${input.customerId}:${repaymentId}`,
      isOffline,
      () =>
        this.credit.recordRepayment({
          businessId: customersBusinessId,
          customerId: input.customerId,
          repaymentId,
          actorId: this.actorUserId(),
          actorRole: this.actorRole(),
          clientEventId,
          components: input.components,
          allocations: input.allocations,
        }),
    )
    this.enqueueLocalOperation(
      'repayment.record',
      isOffline,
      {
        customerId: input.customerId,
        repaymentId,
        amountMinor: event.amountMinor?.toString() ?? '0',
        allocations: input.allocations.map((allocation) => ({
          debtId: allocation.debtId,
          amountMinor: allocation.amountMinor.toString(),
        })),
      },
      'recorded',
      'confirmed',
      'not_required',
    )
    return event
  }

  async recordApprovedReturn(
    input: DebtActionInputView,
    isOffline: boolean,
  ): Promise<CreditHistoryEvent> {
    return this.authorized('return:approve', input.debtId, isOffline, () =>
      this.credit.recordApprovedReturn({
        businessId: customersBusinessId,
        customerId: input.customerId,
        debtId: input.debtId,
        amountMinor: input.amountMinor,
        actorId: this.actorUserId(),
        actorRole: this.actorRole(),
        reason: input.reason,
        clientEventId: this.reference('client-return'),
      }),
    )
  }

  async recordWriteOff(
    input: DebtActionInputView,
    isOffline: boolean,
  ): Promise<CreditHistoryEvent> {
    return this.authorized('correction:approve', input.debtId, isOffline, () =>
      this.credit.recordWriteOff({
        businessId: customersBusinessId,
        customerId: input.customerId,
        debtId: input.debtId,
        amountMinor: input.amountMinor,
        actorId: this.actorUserId(),
        actorRole: this.actorRole(),
        reason: input.reason,
        clientEventId: this.reference('client-write-off'),
      }),
    )
  }

  async correctCreditSale(
    input: CorrectionInputView,
    isOffline: boolean,
  ): Promise<CreditHistoryEvent> {
    return this.authorized('correction:approve', input.debtId, isOffline, () =>
      this.credit.correctCreditSale({
        businessId: customersBusinessId,
        customerId: input.customerId,
        debtId: input.debtId,
        amountMinor: 0n,
        correctedAmountMinor: input.correctedAmountMinor,
        actorId: this.actorUserId(),
        actorRole: this.actorRole(),
        reason: input.reason,
        clientEventId: this.reference('client-credit-correction'),
      }),
    )
  }

  async reverseCreditSale(
    input: { customerId: string; debtId: string; reason: string },
    isOffline: boolean,
  ): Promise<CreditHistoryEvent> {
    return this.authorized('correction:approve', input.debtId, isOffline, () =>
      this.credit.reverseCreditSale({
        businessId: customersBusinessId,
        customerId: input.customerId,
        debtId: input.debtId,
        amountMinor: 0n,
        actorId: this.actorUserId(),
        actorRole: this.actorRole(),
        reason: input.reason,
        clientEventId: this.reference('client-credit-reversal'),
      }),
    )
  }

  async recordDispute(
    input: DisputeInputView,
    isOffline: boolean,
  ): Promise<CreditHistoryEvent> {
    return this.authorized('business:work', input.debtId, isOffline, () =>
      this.credit.recordDispute({
        businessId: customersBusinessId,
        customerId: input.customerId,
        debtId: input.debtId,
        reason: input.reason,
        actorId: this.actorUserId(),
        actorRole: this.actorRole(),
        clientEventId: this.reference('client-dispute'),
      }),
    )
  }

  async resolveDispute(
    input: { customerId: string; debtId: string; resolution: string },
    isOffline: boolean,
  ): Promise<CreditHistoryEvent> {
    return this.authorized('credit:approve', input.debtId, isOffline, () =>
      this.credit.resolveDispute({
        businessId: customersBusinessId,
        customerId: input.customerId,
        debtId: input.debtId,
        reason: input.resolution,
        resolution: input.resolution,
        actorId: this.actorUserId(),
        actorRole: this.actorRole(),
        clientEventId: this.reference('client-dispute-resolution'),
      }),
    )
  }

  async synchronize(): Promise<SyncOperation[]> {
    return this.coordinator.sync(this.server, customersBusinessId)
  }

  listOperations(): SyncOperation[] {
    return this.coordinator.list(customersBusinessId)
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

  private customerSummaries(): CustomerSummaryView[] {
    return this.credit
      .listCustomers(customersBusinessId)
      .map((customer) => this.customerSummary(customer))
  }

  private customerSummary(customer: Customer): CustomerSummaryView {
    const debts = this.credit.listDebts(customersBusinessId, customer.id)
    const openDebts = debts.filter(
      (debt) =>
        debt.outstandingMinor > 0n &&
        debt.state !== 'reversed' &&
        debt.state !== 'written_off',
    )
    const history = this.credit.listHistory(customersBusinessId, customer.id)
    const lastRepayment = [...history]
      .filter((event) => event.type === 'credit.repayment.recorded')
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
      .at(-1)
    return {
      customer,
      outstandingMinor: this.credit.getOutstandingForCustomer(
        customersBusinessId,
        customer.id,
      ).minor,
      openDebtCount: openDebts.length,
      oldestOpenDebtAt:
        openDebts
          .map((debt) => this.debtView(debt).events[0]?.occurredAt ?? '')
          .filter(Boolean)
          .sort()
          .at(0) ?? null,
      hasDispute: openDebts.some((debt) => debt.disputed),
      lastRepaymentAt: lastRepayment?.occurredAt ?? null,
    }
  }

  private customerDetail(customerId: string): CustomerDetailView | null {
    const customer = this.credit.getCustomer(customersBusinessId, customerId)
    if (!customer) return null
    const debts = this.credit
      .listDebts(customersBusinessId, customerId)
      .map((debt) => this.debtView(debt))
    return {
      summary: this.customerSummary(customer),
      debts,
      history: this.credit.listHistory(customersBusinessId, customerId),
    }
  }

  private attentionViews(
    summaries: CustomerSummaryView[],
  ): CustomerAttentionView[] {
    const attention: CustomerAttentionView[] = []
    for (const summary of summaries) {
      if (summary.customer.creditStatus === 'restricted') {
        attention.push({
          kind: 'restricted',
          summary,
          debt: null,
          note: 'Restricted credit requires management handling before credit can be used.',
        })
      }
      for (const debt of this.credit.listDebts(
        customersBusinessId,
        summary.customer.id,
      )) {
        const view = this.debtView(debt)
        if (debt.disputed && debt.outstandingMinor > 0n) {
          attention.push({
            kind: 'disputed',
            summary,
            debt: view,
            note: 'Disputed debt under investigation. The debt remains visible.',
          })
        }
        if (debt.isOverdue && debt.outstandingMinor > 0n) {
          attention.push({
            kind: 'overdue',
            summary,
            debt: view,
            note: 'This debt is past its due date.',
          })
        }
      }
    }
    return attention
  }

  private debtView(debt: DebtSnapshot): DebtView {
    const events = this.debtEvents(debt)
    let repaidMinor = 0n
    let returnedMinor = 0n
    let writtenOffMinor = 0n
    let correctionIncreaseMinor = 0n
    let correctionReductionMinor = 0n
    for (const event of events) {
      if (event.type === 'credit.repayment.recorded') {
        repaidMinor +=
          event.allocations
            ?.filter((allocation) => allocation.debtId === debt.id)
            .reduce((sum, allocation) => sum + allocation.amountMinor, 0n) ?? 0n
      } else if (event.type === 'credit.return.recorded') {
        returnedMinor += event.amountMinor ?? 0n
      } else if (event.type === 'credit.write_off.recorded') {
        writtenOffMinor += event.amountMinor ?? 0n
      } else if (event.type === 'credit.correction.recorded') {
        correctionIncreaseMinor += event.correctionIncreaseMinor ?? 0n
        correctionReductionMinor += event.correctionReductionMinor ?? 0n
      }
    }
    return {
      debt,
      events,
      repaidMinor,
      returnedMinor,
      writtenOffMinor,
      correctionIncreaseMinor,
      correctionReductionMinor,
    }
  }

  private debtEvents(debt: DebtSnapshot): CreditHistoryEvent[] {
    return this.credit
      .listHistory(customersBusinessId, debt.customerId)
      .filter(
        (event) =>
          event.debtId === debt.id ||
          event.allocations?.some(
            (allocation) => allocation.debtId === debt.id,
          ) === true,
      )
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
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

  private actorRole(): 'owner' | 'manager' | 'staff' {
    return this.getActor().role
  }

  private approvalEvidence(approval: CreditApprovalInput) {
    return {
      approvalId: this.reference('APR'),
      businessId: customersBusinessId,
      approverUserId: approval.approverId,
      approverRoles: [approval.approverRole],
      approvedAt: Date.now(),
      verified: true,
    }
  }

  private reference(prefix: string): string {
    this.nextReference += 1
    return `${prefix}-${this.nextReference}`
  }

  private enqueueLocalOperation(
    type: string,
    isOffline: boolean,
    payload: JsonValue,
    businessState: string,
    paymentState: string,
    authorizationState: string,
  ): void {
    if (!isOffline) return
    this.coordinator.enqueue({
      operationId: `${type}:${this.reference('op')}`,
      businessId: customersBusinessId,
      deviceId: posDeviceId,
      actorUserId: this.actorUserId(),
      type,
      createdAt: new Date().toISOString(),
      businessState,
      paymentState,
      authorizationState,
      payload,
    })
  }

  private authorized<T>(
    permission: Permission,
    targetRecordId: string,
    isOffline: boolean,
    perform: () => T,
    extra?: {
      requiresApproval: true
      approval: ReturnType<CustomerCreditController['approvalEvidence']>
    },
  ): Promise<T> {
    return executeAuthorized<T>({
      session: this.sessions.get(this.actorId) ?? null,
      request: {
        permission,
        businessId: customersBusinessId,
        targetBusinessId: customersBusinessId,
        targetRecordId,
        requesterUserId: this.actorUserId(),
        isOffline,
        ...(extra?.requiresApproval
          ? { requiresApproval: true, approval: extra.approval }
          : {}),
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

  /**
   * Reference ledger data demonstrating every debt state the C08 experience
   * must express: outstanding, partially repaid, overdue, paid, disputed,
   * written off, and return/correction effects. All amounts are integer
   * kobo; all events are ordinary engine operations with approvals and
   * recorded actors.
   */
  private seedReferenceLedger(): void {
    const naira = (amount: number) => BigInt(amount * 100)
    const managerApproval = {
      approverId: 'user-ngozi',
      approverRole: 'manager' as const,
    }
    const ownerApproval = {
      approverId: 'user-nkechi',
      approverRole: 'owner' as const,
    }

    const customers = [
      {
        id: 'c-ada',
        name: 'Ada Obi',
        phone: '0803 111 2233',
        creditStatus: 'allowed' as const,
        creditLimitMinor: naira(150_000),
      },
      {
        id: 'c-ada-obiora',
        name: 'Ada Obiora',
        phone: '0803 111 9988',
        creditStatus: 'allowed' as const,
        creditLimitMinor: 0n,
      },
      {
        id: 'c-emeka',
        name: 'Emeka Duru',
        phone: '0805 444 8899',
        creditStatus: 'allowed' as const,
        creditLimitMinor: naira(100_000),
      },
      {
        id: 'c-funke',
        name: 'Funke Adeyemi',
        phone: '0807 222 1144',
        creditStatus: 'restricted' as const,
      },
      {
        id: 'c-tunde',
        name: 'Tunde Bala',
        phone: '0810 999 3355',
        creditStatus: 'blocked' as const,
      },
      {
        id: 'c-yemi',
        name: 'Yemi Adeyinka',
        phone: '0802 333 6677',
        creditStatus: 'allowed' as const,
        creditLimitMinor: naira(50_000),
      },
      {
        id: 'c-bola',
        name: 'Bola Ogun',
        phone: '0806 777 2233',
        creditStatus: 'allowed' as const,
        creditLimitMinor: naira(30_000),
      },
    ]
    for (const customer of customers) {
      this.credit.createCustomer({
        businessId: customersBusinessId,
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        creditStatus: customer.creditStatus,
        creditLimitMinor: customer.creditLimitMinor,
        actorId: 'user-nkechi',
        occurredAt: '2026-09-01T09:00:00.000Z',
      })
    }

    // Ada Obi: one partially repaid, overdue debt reduced by an approved
    // return, and one fully paid debt that remains visible.
    this.credit.recordCreditSale({
      businessId: customersBusinessId,
      customerId: 'c-ada',
      debtId: 'debt-ada-1',
      saleId: 'SAL-8011',
      amountMinor: naira(35_000),
      dueDate: '2026-09-01T00:00:00.000Z',
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-credit-ada-1',
      creditApproval: managerApproval,
      occurredAt: '2026-08-25T10:05:00.000Z',
    })
    this.credit.recordApprovedReturn({
      businessId: customersBusinessId,
      customerId: 'c-ada',
      debtId: 'debt-ada-1',
      amountMinor: naira(5_000),
      actorId: 'user-ngozi',
      actorRole: 'manager',
      reason: 'Two spark plugs returned unused; approved for resale.',
      clientEventId: 'seed-return-ada-1',
      occurredAt: '2026-09-02T12:30:00.000Z',
    })
    this.credit.recordRepayment({
      businessId: customersBusinessId,
      customerId: 'c-ada',
      repaymentId: 'RCP-7001',
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-repayment-ada-1',
      components: [
        {
          method: 'bank_transfer',
          amountMinor: naira(10_000),
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
            externalReference: 'TRF-88231',
          },
        },
      ],
      allocations: [{ debtId: 'debt-ada-1', amountMinor: naira(10_000) }],
      occurredAt: '2026-09-03T16:45:00.000Z',
    })
    this.credit.recordCreditSale({
      businessId: customersBusinessId,
      customerId: 'c-ada',
      debtId: 'debt-ada-2',
      saleId: 'SAL-8044',
      amountMinor: naira(15_000),
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-credit-ada-2',
      creditApproval: managerApproval,
      occurredAt: '2026-08-28T11:20:00.000Z',
    })
    this.credit.recordRepayment({
      businessId: customersBusinessId,
      customerId: 'c-ada',
      repaymentId: 'RCP-7002',
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-repayment-ada-2',
      components: [
        {
          method: 'cash',
          amountMinor: naira(15_000),
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
          },
        },
      ],
      allocations: [{ debtId: 'debt-ada-2', amountMinor: naira(15_000) }],
      occurredAt: '2026-09-04T09:10:00.000Z',
    })

    // Emeka Duru: one partially repaid debt.
    this.credit.recordCreditSale({
      businessId: customersBusinessId,
      customerId: 'c-emeka',
      debtId: 'debt-emeka-1',
      saleId: 'SAL-8002',
      amountMinor: naira(60_000),
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-credit-emeka-1',
      creditApproval: managerApproval,
      occurredAt: '2026-08-20T15:00:00.000Z',
    })
    this.credit.recordRepayment({
      businessId: customersBusinessId,
      customerId: 'c-emeka',
      repaymentId: 'RCP-7003',
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-repayment-emeka-1',
      components: [
        {
          method: 'pos_card',
          amountMinor: naira(20_000),
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
            externalReference: 'POS-55210',
          },
        },
      ],
      allocations: [{ debtId: 'debt-emeka-1', amountMinor: naira(20_000) }],
      occurredAt: '2026-09-05T13:25:00.000Z',
    })

    // Yemi Adeyinka: disputed debt partially reduced by an approved return.
    this.credit.recordCreditSale({
      businessId: customersBusinessId,
      customerId: 'c-yemi',
      debtId: 'debt-yemi-1',
      saleId: 'SAL-8050',
      amountMinor: naira(12_000),
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-credit-yemi-1',
      creditApproval: ownerApproval,
      occurredAt: '2026-09-02T10:40:00.000Z',
    })
    this.credit.recordApprovedReturn({
      businessId: customersBusinessId,
      customerId: 'c-yemi',
      debtId: 'debt-yemi-1',
      amountMinor: naira(2_000),
      actorId: 'user-nkechi',
      actorRole: 'owner',
      reason: 'One headlamp bulb was faulty and was returned.',
      clientEventId: 'seed-return-yemi-1',
      occurredAt: '2026-09-04T14:05:00.000Z',
    })
    this.credit.recordDispute({
      businessId: customersBusinessId,
      customerId: 'c-yemi',
      debtId: 'debt-yemi-1',
      reason:
        'Customer says ₦3,000 was paid in cash on 3 September; the receipt has not been located yet.',
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-dispute-yemi-1',
      occurredAt: '2026-09-05T08:55:00.000Z',
    })

    // Bola Ogun: fully written-off debt that remains historically visible.
    this.credit.recordCreditSale({
      businessId: customersBusinessId,
      customerId: 'c-bola',
      debtId: 'debt-bola-1',
      saleId: 'SAL-8033',
      amountMinor: naira(8_000),
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-credit-bola-1',
      creditApproval: managerApproval,
      occurredAt: '2026-08-15T12:00:00.000Z',
    })
    this.credit.recordWriteOff({
      businessId: customersBusinessId,
      customerId: 'c-bola',
      debtId: 'debt-bola-1',
      amountMinor: naira(8_000),
      actorId: 'user-ngozi',
      actorRole: 'manager',
      reason:
        'Customer relocated abroad; management approved forgiving the remaining debt.',
      clientEventId: 'seed-write-off-bola-1',
      occurredAt: '2026-09-01T17:30:00.000Z',
    })
  }
}

export function createCustomerCreditController(
  store?: DurableStore,
): CustomerCreditController {
  return new CustomerCreditController(store)
}
