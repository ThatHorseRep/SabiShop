import { useState } from 'react'
import type {
  CustomerCreditSnapshotView,
  RecentCreditEventView,
} from './customersController'
import { formatDebt, formatDateTime, historyEventView } from './customersFormat'
import { Panel } from './CustomersShared'

const filterOptions = [
  { value: 'all', label: 'All events' },
  { value: 'credit.sale.recorded', label: 'Credit sales' },
  { value: 'credit.repayment.recorded', label: 'Repayments' },
  { value: 'credit.return.recorded', label: 'Approved returns' },
  { value: 'credit.write_off.recorded', label: 'Write-offs' },
  { value: 'credit.correction.recorded', label: 'Corrections' },
  { value: 'credit.sale.reversed', label: 'Reversals' },
  { value: 'credit.dispute.recorded', label: 'Disputes' },
  { value: 'credit.dispute.resolved', label: 'Dispute resolutions' },
  { value: 'customer.credit_status_changed', label: 'Credit status changes' },
  { value: 'customer.credit_limit_changed', label: 'Credit limit changes' },
  { value: 'customer.created', label: 'Customer creation' },
]

/**
 * The cross-customer credit activity ledger. Every entry names the customer,
 * event, amount, and resulting state, and connects back to the customer
 * record (C08 sections 29, 52).
 */
export function HistorySection({
  snapshot,
  onSelectCustomer,
}: {
  snapshot: CustomerCreditSnapshotView
  onSelectCustomer: (customerId: string) => void
}) {
  const [filter, setFilter] = useState('all')
  const events: RecentCreditEventView[] = snapshot.activityEvents

  return (
    <Panel
      title="Credit activity"
      description="The most recent credit events across all customers. Select a customer to see their complete history."
    >
      <div className="customers-history-filter">
        <label className="ui-text-body-sm" htmlFor="customers-history-type">
          Show
        </label>
        <select
          id="customers-history-type"
          className="customers-select"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <p className="customers-meta customers-actions--spaced">
        Showing the latest recorded events. The full per-customer ledger remains
        available from each customer profile.
      </p>
      <ul className="customers-timeline">
        {events
          .filter((view) => filter === 'all' || view.event.type === filter)
          .map(({ event, customer }) => {
            const view = historyEventView(event)
            return (
              <li key={event.id} className="customers-timeline-item">
                <div className="customers-timeline-when">
                  {formatDateTime(event.occurredAt)}
                  <br />
                  <button
                    type="button"
                    className="customers-source-link"
                    onClick={() => onSelectCustomer(customer.id)}
                  >
                    {customer.name}
                  </button>
                </div>
                <div className="customers-timeline-what">
                  <strong>{view.label}</strong>
                  <p>{view.description}</p>
                  {event.amountMinor !== undefined && (
                    <p className="customers-timeline-amount">
                      {formatDebt(event.amountMinor)}
                    </p>
                  )}
                  {event.resultingOutstandingMinor !== undefined && (
                    <p>
                      Resulting outstanding debt{' '}
                      {formatDebt(event.resultingOutstandingMinor)}
                    </p>
                  )}
                  {event.reason && <p>Reason: {event.reason}</p>}
                </div>
              </li>
            )
          })}
      </ul>
    </Panel>
  )
}
