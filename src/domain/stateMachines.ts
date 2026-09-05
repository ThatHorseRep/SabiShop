export type Role = 'staff' | 'manager' | 'owner'

export type SaleState = 'draft' | 'pending_completion' | 'completed' | 'failed'

export type PaymentState =
  'initiated' | 'pending' | 'confirmed_success' | 'failed' | 'reversed'

export type CreditState =
  | 'none'
  | 'outstanding'
  | 'partially_settled'
  | 'settled'
  | 'reduced_by_approved_return'
  | 'written_off'

export type ReturnState =
  'requested' | 'verified' | 'approved' | 'applied' | 'settled' | 'rejected'

export type CorrectionState =
  'requested' | 'authorization_review' | 'approved' | 'applied' | 'rejected'

export type ReconciliationState =
  | 'open_session'
  | 'count_recorded'
  | 'reconciliation_prepared'
  | 'management_confirmed'
  | 'closed'
  | 'reopened'

export type SyncState =
  | 'local_only'
  | 'pending_sync'
  | 'accepted'
  | 'rejected'
  | 'conflict'
  | 'resolved'
  | 'failed'

export type AuthorizationState =
  | 'not_required'
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'invalidated'

export type MachineName =
  | 'sale'
  | 'payment'
  | 'credit'
  | 'return'
  | 'correction'
  | 'reconciliation'
  | 'sync'
  | 'authorization'

export type DomainState =
  | SaleState
  | PaymentState
  | CreditState
  | ReturnState
  | CorrectionState
  | ReconciliationState
  | SyncState
  | AuthorizationState

export type DomainCommand =
  | 'begin_completion'
  | 'complete'
  | 'fail'
  | 'start'
  | 'confirm_success'
  | 'reverse'
  | 'partially_settle'
  | 'settle'
  | 'reduce_by_return'
  | 'write_off'
  | 'verify'
  | 'approve'
  | 'apply'
  | 'reject'
  | 'record_count'
  | 'prepare_reconciliation'
  | 'confirm_management'
  | 'close'
  | 'reopen'
  | 'queue_sync'
  | 'accept'
  | 'resolve'
  | 'retry'
  | 'request_authorization'
  | 'expire'
  | 'invalidate'

const transitions: Record<
  MachineName,
  Record<string, Partial<Record<DomainCommand, DomainState>>>
> = {
  sale: {
    draft: { begin_completion: 'pending_completion', complete: 'completed' },
    pending_completion: { complete: 'completed', fail: 'failed' },
  },
  payment: {
    initiated: { start: 'pending', fail: 'failed' },
    pending: { confirm_success: 'confirmed_success', fail: 'failed' },
    confirmed_success: { reverse: 'reversed' },
  },
  credit: {
    none: { complete: 'outstanding' },
    outstanding: {
      partially_settle: 'partially_settled',
      settle: 'settled',
      reduce_by_return: 'reduced_by_approved_return',
      write_off: 'written_off',
    },
    partially_settled: {
      partially_settle: 'partially_settled',
      settle: 'settled',
      reduce_by_return: 'reduced_by_approved_return',
      write_off: 'written_off',
    },
  },
  return: {
    requested: {
      verify: 'verified',
      reject: 'rejected',
    },
    verified: { approve: 'approved', reject: 'rejected' },
    approved: { apply: 'applied' },
    applied: { settle: 'settled' },
  },
  correction: {
    requested: { request_authorization: 'authorization_review' },
    authorization_review: { approve: 'approved', reject: 'rejected' },
    approved: { apply: 'applied' },
  },
  reconciliation: {
    open_session: { record_count: 'count_recorded' },
    count_recorded: { prepare_reconciliation: 'reconciliation_prepared' },
    reconciliation_prepared: { confirm_management: 'management_confirmed' },
    management_confirmed: { close: 'closed' },
    closed: { reopen: 'reopened' },
    reopened: { close: 'closed' },
  },
  sync: {
    local_only: { queue_sync: 'pending_sync' },
    pending_sync: {
      accept: 'accepted',
      reject: 'rejected',
      resolve: 'resolved',
      retry: 'pending_sync',
      fail: 'failed',
    },
    conflict: { resolve: 'resolved' },
    failed: { retry: 'pending_sync' },
  },
  authorization: {
    not_required: { request_authorization: 'requested' },
    requested: { approve: 'approved', reject: 'rejected' },
    approved: { expire: 'expired', invalidate: 'invalidated' },
  },
}

export class IllegalTransitionError extends Error {
  readonly code = 'ILLEGAL_DOMAIN_TRANSITION'

  constructor(
    readonly machine: MachineName,
    readonly state: DomainState,
    readonly command: DomainCommand,
  ) {
    super(`Cannot ${command} from ${machine}.${state}`)
    this.name = 'IllegalTransitionError'
  }
}

export function transition<T extends DomainState>(
  machine: MachineName,
  state: T,
  command: DomainCommand,
): DomainState {
  const nextState = transitions[machine][state]?.[command]

  if (!nextState) {
    throw new IllegalTransitionError(machine, state, command)
  }

  return nextState
}

export function canTransition(
  machine: MachineName,
  state: DomainState,
  command: DomainCommand,
): boolean {
  return Boolean(transitions[machine][state]?.[command])
}

export function canCompleteSale(input: {
  hasItems: boolean
  hasConfirmedPayment: boolean
  authorization: AuthorizationState
}): boolean {
  return (
    input.hasItems &&
    input.hasConfirmedPayment &&
    (input.authorization === 'not_required' ||
      input.authorization === 'approved')
  )
}

export function canApprove(
  requesterRole: Role,
  approverRole: Role,
  requesterId: string,
  approverId: string,
): boolean {
  const approverCanApprove =
    approverRole === 'owner' || approverRole === 'manager'

  return approverCanApprove && requesterId !== approverId
}

export function inventoryMovementQuantity(quantity: number): number {
  if (!Number.isInteger(quantity) || quantity === 0) {
    throw new Error('Inventory movement quantity must be a non-zero integer')
  }

  return quantity
}

export function expectedCash(input: {
  confirmedOpeningCash: number
  cashSales: number
  cashIn: number
  cashOut: number
  cashRefunds: number
}): number {
  return (
    input.confirmedOpeningCash +
    input.cashSales +
    input.cashIn -
    input.cashOut -
    input.cashRefunds
  )
}
