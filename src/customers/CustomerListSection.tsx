import { useState } from 'react'
import { Button, SearchInput } from '../ui'
import type {
  CustomerCreditSnapshotView,
  CustomerSummaryView,
} from './customersController'
import { creditStatusView, formatDebt, formatDate } from './customersFormat'
import { Panel, StatusChip } from './CustomersShared'

/**
 * Fast, unambiguous customer lookup. Results always show the phone so
 * similar names are never confused (C08 section 6).
 */
export function CustomerListSection({
  snapshot,
  search,
  selectedCustomerId,
  onSelectCustomer,
  onCreateCustomer,
  canCreate,
}: {
  snapshot: CustomerCreditSnapshotView
  search: (query: string) => CustomerSummaryView[]
  selectedCustomerId: string | null
  onSelectCustomer: (customerId: string) => void
  onCreateCustomer: () => void
  canCreate: boolean
}) {
  const [query, setQuery] = useState('')
  const results = query.trim() ? search(query) : snapshot.customers
  const ambiguous =
    query.trim().length > 0 &&
    new Set(results.map((view) => view.customer.name)).size !== results.length

  return (
    <Panel
      title="Customers"
      description="Search by name or phone. Results always show the phone number so similar names stay distinguishable."
      actions={
        canCreate ? (
          <Button size="sm" onClick={onCreateCustomer}>
            Add customer
          </Button>
        ) : undefined
      }
    >
      <div className="customers-search-bar">
        <SearchInput
          placeholder="Search by name or phone…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search customers by name or phone"
        />
      </div>

      {ambiguous && (
        <p className="customers-state-message info customers-state-message--spaced">
          <strong>Similar names.</strong> Two customers share this name. Use the
          phone number to confirm the right person before selecting.
        </p>
      )}

      {results.length === 0 ? (
        <p className="customers-empty">
          <strong>No customers found.</strong>
          {query.trim()
            ? 'No customer matches this search. Check the spelling or add the customer.'
            : 'No customers yet. Add a customer when one needs to be associated with a sale.'}
        </p>
      ) : (
        <ul className="customers-list">
          {results.map((view) => {
            const status = creditStatusView(view.customer.creditStatus)
            return (
              <li key={view.customer.id}>
                <button
                  type="button"
                  className={`customers-row${selectedCustomerId === view.customer.id ? ' selected' : ''}`}
                  onClick={() => onSelectCustomer(view.customer.id)}
                  aria-pressed={selectedCustomerId === view.customer.id}
                >
                  <span className="customers-row-main">
                    <span className="customers-row-title">
                      {view.customer.name}
                    </span>
                    <span className="customers-row-subtitle">
                      {view.customer.phone}
                    </span>
                    {view.lastRepaymentAt && (
                      <span className="customers-meta">
                        Last repayment {formatDate(view.lastRepaymentAt)}
                      </span>
                    )}
                  </span>
                  <StatusChip tone={status.tone} label={status.label} />
                  <span>
                    <span className="customers-meta">Outstanding debt</span>
                    <br />
                    <strong className="customers-number">
                      {formatDebt(view.outstandingMinor)}
                    </strong>
                  </span>
                  <span>
                    <span className="customers-meta">Open debts</span>
                    <br />
                    <strong className="customers-number">
                      {view.openDebtCount}
                    </strong>
                    {view.hasDispute && (
                      <StatusChip tone="warning" label="Disputed" />
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
