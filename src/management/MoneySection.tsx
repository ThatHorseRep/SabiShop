import { Button } from '../ui'
import type { ManagementSnapshot } from './managementController'
import {
  Metric,
  MoneyDelta,
  Panel,
  StateChip,
  TraceNote,
} from './ManagementShared'
import { formatDateTime, formatMoneyKobo } from './managementFormat'

function cashEventLabel(kind: string): string {
  switch (kind) {
    case 'cash_sale':
      return 'Cash sale'
    case 'cash_in':
      return 'Cash in'
    case 'cash_out':
      return 'Cash out'
    case 'cash_refund':
      return 'Cash refund'
    default:
      return kind
  }
}

export function MoneySection({
  snapshot,
  onOpenArea,
}: {
  snapshot: ManagementSnapshot
  onOpenArea: (area: 'money') => void
}) {
  const cash = snapshot.cash.snapshot
  return (
    <div className="management-section">
      <Panel
        title="Cash & reconciliation"
        description="Expected cash follows the reconciliation contract: confirmed opening cash + cash sales + cash in − cash out − cash refunds. Cash is never treated as profit."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenArea('money')}
          >
            Open Money &amp; Reconciliation
          </Button>
        }
      >
        <dl className="management-metrics">
          <Metric
            label="Session"
            value={cash.sessionId}
            hint={`${cash.custodyMode.replace('_', ' ')} · state ${cash.state.replace(/_/g, ' ')}`}
          />
          <Metric
            label="Confirmed opening cash"
            value={formatMoneyKobo(cash.confirmedOpeningCashKobo)}
          />
          <Metric
            label="Expected cash"
            value={formatMoneyKobo(cash.expectedCashKobo)}
            hint={`Cash sales ${formatMoneyKobo(
              cash.cashSalesKobo,
            )} · in ${formatMoneyKobo(cash.cashInKobo)} · out ${formatMoneyKobo(
              cash.cashOutKobo,
            )} · refunds ${formatMoneyKobo(cash.cashRefundsKobo)}`}
          />
          <Metric
            label="Actual cash (counted)"
            value={
              cash.actualCashKobo === undefined
                ? 'Not counted'
                : formatMoneyKobo(cash.actualCashKobo)
            }
            tone={cash.unresolved ? 'warning' : 'default'}
            hint={
              cash.cashVarianceKobo === undefined ? (
                'No physical count has been recorded for this session.'
              ) : (
                <>
                  Variance <MoneyDelta amountKobo={cash.cashVarianceKobo} />
                </>
              )
            }
          />
          <Metric
            label="Discrepancy"
            value={
              <StateChip
                tone={
                  cash.discrepancyStatus === 'unresolved'
                    ? 'warning'
                    : cash.discrepancyStatus === 'none'
                      ? 'success'
                      : 'info'
                }
                label={cash.discrepancyStatus}
              />
            }
            hint={
              cash.discrepancyStatus === 'unresolved'
                ? 'The business day cannot be officially closed until the variance is explained.'
                : 'No unexplained variance in the current session.'
            }
          />
        </dl>
      </Panel>

      <Panel
        title="Cash activity"
        description="Every drawer movement in the session, with its reason and the actor who recorded it."
      >
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Kind</th>
                <th className="management-num">Amount</th>
                <th>Reason</th>
                <th>Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.cash.events.map((event) => (
                <tr key={event.id}>
                  <td>
                    {event.id}
                    <br />
                    <span className="ui-text-caption ui-text-secondary">
                      {formatDateTime(event.occurredAt)}
                    </span>
                  </td>
                  <td>{cashEventLabel(event.kind)}</td>
                  <td className="management-num">
                    {formatMoneyKobo(event.amountKobo)}
                  </td>
                  <td>{event.reason}</td>
                  <td>{event.actorId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TraceNote>
          Cash events are the records behind expected cash. Reconciliation
          confirmation, discrepancy resolution, and day closure are performed in
          Money &amp; Reconciliation.
        </TraceNote>
      </Panel>

      <Panel
        title="Expenses"
        description="Operating expenses in the selected period. Expense records are reporting adapter inputs until the durable expense read model exists."
      >
        {snapshot.expenses.length === 0 ? (
          <p className="ui-text-body-sm ui-text-secondary">
            No expense records in the selected period.
          </p>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Category</th>
                  <th className="management-num">Amount</th>
                  <th>Occurred</th>
                  <th>Recorded by</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.id}</td>
                    <td>{expense.category}</td>
                    <td className="management-num">
                      {formatMoneyKobo(expense.amountKobo)}
                    </td>
                    <td>{formatDateTime(expense.occurredAt)}</td>
                    <td>{expense.actorId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TraceNote>
          Total expenses for the period:{' '}
          {formatMoneyKobo(snapshot.report.expenses.totalKobo)}. Owner
          withdrawals are not expenses and are not silently folded into this
          figure.
        </TraceNote>
      </Panel>

      <Panel
        title="Reconciliation history"
        description="The audit trail of the session: opening, counting, preparation, and any resolution steps."
      >
        <ul className="management-timeline">
          {snapshot.cash.audits.map((event) => (
            <li key={event.id} className="management-timeline-entry">
              <div className="management-timeline-entry__head">
                <time>{formatDateTime(event.occurredAt)}</time>
                <strong>{event.type}</strong>
              </div>
              <p className="management-timeline-entry__detail">
                {event.actorId} ({event.actorRole})
                {event.reason ? ` · ${event.reason}` : ''}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
