import type {
  CustomerAttentionView,
  CustomerCreditSnapshotView,
  RecentCreditEventView,
} from './customersController'
import { formatDebt, formatDate, historyEventView } from './customersFormat'
import { Metric, Panel, StatusChip } from './CustomersShared'

const attentionLabels: Record<
  CustomerAttentionView['kind'],
  { tone: 'warning' | 'danger' | 'info'; label: string }
> = {
  restricted: { tone: 'warning', label: 'Restricted credit' },
  disputed: { tone: 'warning', label: 'Disputed debt' },
  overdue: { tone: 'danger', label: 'Overdue' },
}

function EventTimeline({
  events,
  emptyTitle,
  emptyDescription,
}: {
  events: readonly RecentCreditEventView[]
  emptyTitle: string
  emptyDescription: string
}) {
  if (events.length === 0) {
    return (
      <p className="customers-empty">
        <strong>{emptyTitle}</strong>
        {emptyDescription}
      </p>
    )
  }
  return (
    <ul className="customers-timeline">
      {events.map(({ event, customer }) => {
        const view = historyEventView(event)
        return (
          <li key={event.id} className="customers-timeline-item">
            <div className="customers-timeline-when">
              {formatDate(event.occurredAt)}
              <br />
              {customer.name}
            </div>
            <div className="customers-timeline-what">
              <strong>{view.label}</strong>
              <p>{view.description}</p>
              {event.amountMinor !== undefined && (
                <p className="customers-timeline-amount">
                  {formatDebt(event.amountMinor)}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Actionable customer overview: outstanding credit, the attention queue,
 * recent repayments, and recent credit activity. Every entry leads back to
 * the customer and its source records (C08 section 63).
 */
export function OverviewSection({
  snapshot,
  onSelectCustomer,
}: {
  snapshot: CustomerCreditSnapshotView
  onSelectCustomer: (customerId: string) => void
}) {
  const totalOutstanding = snapshot.customers.reduce(
    (sum, view) => sum + view.outstandingMinor,
    0n,
  )
  const customersWithDebt = snapshot.customers.filter(
    (view) => view.outstandingMinor > 0n,
  )
  const disputedCount = snapshot.attention.filter(
    (item) => item.kind === 'disputed',
  ).length

  return (
    <div className="customers-section">
      <Panel
        title="Outstanding credit"
        description="Customer debt is money customers owe the business. It is not cash in hand and not revenue."
      >
        <dl className="customers-metric-grid">
          <Metric
            label="Total outstanding debt"
            value={formatDebt(totalOutstanding)}
            hint="Always traceable to the underlying credit sales."
          />
          <Metric
            label="Customers with outstanding debt"
            value={customersWithDebt.length}
          />
          <Metric
            label="Disputed debts"
            value={disputedCount}
            hint="Disputed debts remain visible and do not erase debt."
          />
        </dl>
      </Panel>

      <Panel
        title="Needs attention"
        description="Restricted credit, disputes, and overdue debts require deliberate handling."
      >
        {snapshot.attention.length === 0 ? (
          <p className="customers-empty">
            <strong>Nothing needs attention right now.</strong> No restricted
            credit, disputed debt, or overdue obligation is waiting.
          </p>
        ) : (
          <ul className="customers-list">
            {snapshot.attention.map((item, index) => {
              const label = attentionLabels[item.kind]
              return (
                <li key={`${item.kind}-${item.summary.customer.id}-${index}`}>
                  <button
                    type="button"
                    className="customers-row"
                    onClick={() => onSelectCustomer(item.summary.customer.id)}
                  >
                    <span className="customers-row-main">
                      <span className="customers-row-title">
                        {item.summary.customer.name}
                      </span>
                      <span className="customers-meta">
                        {item.summary.customer.phone}
                        {item.debt && ` · ${item.debt.debt.saleId}`}
                      </span>
                    </span>
                    <StatusChip tone={label.tone} label={label.label} />
                    <span className="customers-meta">{item.note}</span>
                    {item.debt && (
                      <span className="customers-number">
                        {formatDebt(item.debt.debt.outstandingMinor)}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <div className="customers-grid two">
        <Panel
          title="Recent repayments"
          description="Each repayment is its own successful payment event."
        >
          <EventTimeline
            events={snapshot.recentRepayments}
            emptyTitle="No repayments recorded yet."
            emptyDescription="Confirmed repayments will appear here as they are recorded."
          />
        </Panel>
        <Panel
          title="Recent credit activity"
          description="The latest credit events across all customers."
        >
          <EventTimeline
            events={snapshot.recentEvents}
            emptyTitle="No credit activity yet."
            emptyDescription="Credit sales, repayments, returns, and corrections will appear here."
          />
        </Panel>
      </div>
    </div>
  )
}
