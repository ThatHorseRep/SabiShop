import type {
  CustomerDetailView,
  CustomerSummaryView,
  DebtView,
} from './customersController'
import {
  creditStatusView,
  debtStateView,
  formatDebt,
  formatDate,
  formatDateTime,
  historyEventView,
} from './customersFormat'
import { DetailRow, Metric, Panel, StatusChip } from './CustomersShared'
import { Button } from '../ui'

export type ProfilePermissions = {
  canRequestCredit: boolean
  canRecordRepayment: boolean
  canManageCredit: boolean
  canApproveReturns: boolean
  canCorrect: boolean
}

export type DebtDialogKind =
  | 'dispute'
  | 'resolve-dispute'
  | 'write-off'
  | 'return'
  | 'correction'
  | 'reversal'

function DebtCard({
  view,
  permissions,
  onOpenDialog,
}: {
  view: DebtView
  permissions: ProfilePermissions
  onOpenDialog: (kind: DebtDialogKind, debt: DebtView) => void
}) {
  const state = debtStateView(view.debt.state)
  const hasDependentEvents =
    view.repaidMinor > 0n ||
    view.returnedMinor > 0n ||
    view.writtenOffMinor > 0n ||
    view.correctionIncreaseMinor > 0n ||
    view.correctionReductionMinor > 0n

  return (
    <article
      className={`customers-debt-card${view.debt.disputed ? ' disputed' : ''}`}
    >
      <div className="customers-debt-header">
        <h3>{view.debt.id}</h3>
        <div className="customers-chip-row">
          <StatusChip tone={state.tone} label={state.label} />
          {view.debt.disputed && (
            <StatusChip
              tone="warning"
              label="Disputed"
              title={view.debt.disputeReason}
            />
          )}
          {view.debt.isOverdue && <StatusChip tone="danger" label="Overdue" />}
          {view.debt.isDue && !view.debt.isOverdue && (
            <StatusChip tone="info" label="Due" />
          )}
        </div>
      </div>

      <div className="customers-debt-chain">
        <span className="customers-chain-step">
          Original sale {formatDebt(view.debt.originalAmountMinor)}
        </span>
        {view.returnedMinor > 0n && (
          <>
            <span className="customers-chain-arrow" aria-hidden="true">
              →
            </span>
            <span className="customers-chain-step">
              Approved returns −{formatDebt(view.returnedMinor)}
            </span>
          </>
        )}
        {view.writtenOffMinor > 0n && (
          <>
            <span className="customers-chain-arrow" aria-hidden="true">
              →
            </span>
            <span className="customers-chain-step">
              Written off −{formatDebt(view.writtenOffMinor)}
            </span>
          </>
        )}
        {view.correctionIncreaseMinor > 0n && (
          <>
            <span className="customers-chain-arrow" aria-hidden="true">
              →
            </span>
            <span className="customers-chain-step">
              Corrections +{formatDebt(view.correctionIncreaseMinor)}
            </span>
          </>
        )}
        {view.correctionReductionMinor > 0n && (
          <>
            <span className="customers-chain-arrow" aria-hidden="true">
              →
            </span>
            <span className="customers-chain-step">
              Corrections −{formatDebt(view.correctionReductionMinor)}
            </span>
          </>
        )}
        {view.repaidMinor > 0n && (
          <>
            <span className="customers-chain-arrow" aria-hidden="true">
              →
            </span>
            <span className="customers-chain-step">
              Repayments −{formatDebt(view.repaidMinor)}
            </span>
          </>
        )}
        <span className="customers-chain-arrow" aria-hidden="true">
          →
        </span>
        <span className="customers-chain-step">
          <strong>
            {view.debt.state === 'reversed'
              ? 'Reversed'
              : `Outstanding ${formatDebt(view.debt.outstandingMinor)}`}
          </strong>
        </span>
      </div>

      <dl className="customers-debt-facts">
        <DetailRow label="Source sale">
          <span className="customers-mono">{view.debt.saleId}</span>
        </DetailRow>
        <DetailRow label="Due date">
          {view.debt.dueDate ? formatDate(view.debt.dueDate) : 'No due date'}
        </DetailRow>
      </dl>

      {view.events.length > 0 && (
        <details className="customers-debt-events">
          <summary>Debt history ({view.events.length} events)</summary>
          <ul className="customers-timeline">
            {view.events.map((event) => {
              const label = historyEventView(event)
              return (
                <li key={event.id} className="customers-timeline-item">
                  <div className="customers-timeline-when">
                    {formatDateTime(event.occurredAt)}
                  </div>
                  <div className="customers-timeline-what">
                    <strong>{label.label}</strong>
                    <p>{label.description}</p>
                    {event.amountMinor !== undefined && (
                      <p className="customers-timeline-amount">
                        {formatDebt(event.amountMinor)}
                      </p>
                    )}
                    {event.reason && <p>Reason: {event.reason}</p>}
                    {event.approval && (
                      <p>
                        Approved by {event.approval.approverId} (
                        {event.approval.approverRole})
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </details>
      )}

      <div className="customers-actions customers-actions--spaced">
        {view.debt.outstandingMinor > 0n && !view.debt.disputed && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenDialog('dispute', view)}
          >
            Raise dispute
          </Button>
        )}
        {view.debt.disputed && permissions.canManageCredit && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenDialog('resolve-dispute', view)}
          >
            Resolve dispute
          </Button>
        )}
        {view.debt.outstandingMinor > 0n && permissions.canApproveReturns && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenDialog('return', view)}
          >
            Record approved return
          </Button>
        )}
        {view.debt.outstandingMinor > 0n && permissions.canCorrect && (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onOpenDialog('write-off', view)}
            >
              Write off
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onOpenDialog('correction', view)}
            >
              Correct credit sale
            </Button>
          </>
        )}
        {view.debt.state !== 'reversed' && permissions.canCorrect && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenDialog('reversal', view)}
          >
            Reverse credit sale
          </Button>
        )}
      </div>
      {hasDependentEvents && permissions.canCorrect && (
        <p className="customers-meta customers-actions--spaced">
          This debt already has repayments, returns, or write-offs. Any
          correction must preserve them.
        </p>
      )}
    </article>
  )
}

/**
 * Customer profile: identity, credit status, credit limit, outstanding debt,
 * independently traceable debts, and the full credit history (C08 sections
 * 8-9, 19-21, 29).
 */
export function CustomerProfileSection({
  detail,
  permissions,
  online,
  onRecordCreditSale,
  onRecordRepayment,
  onChangeStatus,
  onChangeLimit,
  onOpenDebtDialog,
}: {
  detail: CustomerDetailView
  permissions: ProfilePermissions
  online: boolean
  onRecordCreditSale: () => void
  onRecordRepayment: () => void
  onChangeStatus: () => void
  onChangeLimit: () => void
  onOpenDebtDialog: (kind: DebtDialogKind, debt: DebtView) => void
}) {
  const summary: CustomerSummaryView = detail.summary
  const customer = summary.customer
  const status = creditStatusView(customer.creditStatus)
  const limit = customer.creditLimitMinor
  const openDebts = detail.debts.filter(
    (view) => view.debt.outstandingMinor > 0n && view.debt.state !== 'reversed',
  )
  const oldestOpenDebt = openDebts
    .map((view) => view.events[0]?.occurredAt ?? '')
    .filter(Boolean)
    .sort()
    .at(0)

  return (
    <div className="customers-section">
      <Panel
        title={customer.name}
        description="Who this customer is and their current credit relationship with the business."
        actions={
          <>
            {permissions.canRequestCredit && (
              <Button size="sm" onClick={onRecordCreditSale}>
                Record credit sale
              </Button>
            )}
            {permissions.canRecordRepayment && openDebts.length > 0 && (
              <Button size="sm" variant="secondary" onClick={onRecordRepayment}>
                Record repayment
              </Button>
            )}
          </>
        }
      >
        <dl>
          <DetailRow label="Phone">{customer.phone}</DetailRow>
          <DetailRow label="Customer ID">
            <span className="customers-mono">{customer.id}</span>
          </DetailRow>
          <DetailRow label="Credit status">
            <span className="customers-chip-row">
              <StatusChip tone={status.tone} label={status.label} />
            </span>
            <p className="customers-meta">{status.description}</p>
            {permissions.canManageCredit ? (
              <Button size="sm" variant="ghost" onClick={onChangeStatus}>
                Change credit status
              </Button>
            ) : (
              <p className="customers-meta">
                Credit status is a management control.
              </p>
            )}
          </DetailRow>
          <DetailRow label="Credit limit">
            {limit !== undefined ? (
              <span>
                {formatDebt(limit)}
                <p className="customers-meta">
                  Available credit{' '}
                  {formatDebt(limit - summary.outstandingMinor)} — available
                  credit is not permission to bypass required authorization.
                </p>
              </span>
            ) : (
              <span>
                No limit configured
                <p className="customers-meta">
                  Without a limit, credit sales are checked only by the required
                  authorization.
                </p>
              </span>
            )}
            {permissions.canManageCredit ? (
              <Button size="sm" variant="ghost" onClick={onChangeLimit}>
                Change credit limit
              </Button>
            ) : (
              <p className="customers-meta">
                Credit limits are configured by management.
              </p>
            )}
          </DetailRow>
        </dl>
        {!online && (
          <p className="customers-state-message info customers-state-message--spaced">
            <strong>Offline.</strong> Repayments, credit sale requests, and
            disputes can be recorded locally and will synchronize later. Credit
            status, limit, return, write-off, and correction actions need a
            connection.
          </p>
        )}
        {!permissions.canManageCredit && (
          <p className="customers-management-note customers-actions--spaced">
            Management controls for this customer — credit status, credit limit,
            dispute resolution, returns, write-offs, and corrections — require a
            Manager or the Owner. You can still record permitted repayments and
            raise disputes.
          </p>
        )}
      </Panel>

      <Panel
        title="Outstanding debt"
        description="A summary of what this customer currently owes. The current amount is a result of source events, never a free-edit field."
      >
        {summary.outstandingMinor === 0n ? (
          <p className="customers-empty">
            <strong>This customer has no outstanding credit.</strong> Paid and
            written-off debts remain visible below as history.
          </p>
        ) : (
          <dl className="customers-metric-grid">
            <Metric
              label="Total outstanding debt"
              value={formatDebt(summary.outstandingMinor)}
            />
            <Metric label="Open debts" value={openDebts.length} />
            <Metric
              label="Oldest outstanding debt"
              value={oldestOpenDebt ? formatDate(oldestOpenDebt) : '—'}
            />
            <Metric
              label="Recent repayment"
              value={
                summary.lastRepaymentAt
                  ? formatDate(summary.lastRepaymentAt)
                  : 'None yet'
              }
            />
          </dl>
        )}
      </Panel>

      <Panel
        title="Debts"
        description="Each credit sale remains an independently traceable debt. Paid, written-off, and reversed debts are never deleted."
      >
        {detail.debts.length === 0 ? (
          <p className="customers-empty">
            <strong>No credit sales yet.</strong> A debt is created only by a
            successfully completed, authorized credit sale.
          </p>
        ) : (
          <div className="customers-grid">
            {detail.debts.map((view) => (
              <DebtCard
                key={view.debt.id}
                view={view}
                permissions={permissions}
                onOpenDialog={onOpenDebtDialog}
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Credit history"
        description="Every credit-affecting event for this customer, with actor, time, and reason where required."
      >
        <ul className="customers-timeline">
          {detail.history
            .slice()
            .reverse()
            .map((event) => {
              const view = historyEventView(event)
              return (
                <li key={event.id} className="customers-timeline-item">
                  <div className="customers-timeline-when">
                    {formatDateTime(event.occurredAt)}
                  </div>
                  <div className="customers-timeline-what">
                    <strong>{view.label}</strong>
                    <p>{view.description}</p>
                    {event.amountMinor !== undefined && (
                      <p className="customers-timeline-amount">
                        {formatDebt(event.amountMinor)}
                      </p>
                    )}
                    {event.reason && <p>Reason: {event.reason}</p>}
                    {event.resultingOutstandingMinor !== undefined && (
                      <p>
                        Resulting outstanding debt{' '}
                        {formatDebt(event.resultingOutstandingMinor)}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
        </ul>
      </Panel>
    </div>
  )
}
