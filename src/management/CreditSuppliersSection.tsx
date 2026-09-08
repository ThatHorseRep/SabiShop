import { Button } from '../ui'
import type { ManagementSnapshot } from './managementController'
import { DetailRow, Panel, StateChip, TraceNote } from './ManagementShared'
import { formatDate, formatDateTime, formatMoneyKobo } from './managementFormat'

export function CreditSuppliersSection({
  snapshot,
  onOpenArea,
}: {
  snapshot: ManagementSnapshot
  onOpenArea: (area: 'customers-credit' | 'suppliers-purchasing') => void
}) {
  return (
    <div className="management-section">
      <Panel
        title={`Customer credit outstanding · ${formatMoneyKobo(
          snapshot.report.credit.outstandingKobo,
        )}`}
        description="Receivables derived from credit sale, repayment, return, write-off, and correction events. The dashboard never keeps a separate debt figure."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenArea('customers-credit')}
          >
            Open Customers &amp; Credit
          </Button>
        }
      >
        <div className="management-card-grid">
          {snapshot.credit.map((view) => (
            <article key={view.customer.id} className="management-card">
              <h3>{view.customer.name}</h3>
              <p className="management-card-subtitle">
                {view.customer.phone} · credit status{' '}
                {view.customer.creditStatus}
              </p>
              <dl className="management-details">
                <DetailRow label="Outstanding">
                  {formatMoneyKobo(view.outstandingMinor)}
                </DetailRow>
                {view.debts.map((debt) => (
                  <DetailRow key={debt.id} label={`Debt ${debt.id}`}>
                    {formatMoneyKobo(debt.outstandingMinor)} of{' '}
                    {formatMoneyKobo(debt.originalAmountMinor)} ·{' '}
                    {debt.isOverdue ? (
                      <StateChip tone="danger" label="Overdue" />
                    ) : debt.isDue ? (
                      <StateChip tone="info" label="Due" />
                    ) : (
                      <StateChip tone="neutral" label="Current" />
                    )}
                    {debt.dueDate && ` · due ${formatDate(debt.dueDate)}`}
                  </DetailRow>
                ))}
                <DetailRow label="Recent history">
                  <ul className="management-timeline">
                    {view.history.slice(-4).map((event) => (
                      <li key={event.id} className="management-timeline-entry">
                        <div className="management-timeline-entry__head">
                          <time>{formatDateTime(event.occurredAt)}</time>
                          <strong>{event.type.replace(/\./g, ' ')}</strong>
                        </div>
                        {event.amountMinor !== undefined && (
                          <p className="management-timeline-entry__detail">
                            {formatMoneyKobo(event.amountMinor)}
                            {event.referenceId ? ` · ${event.referenceId}` : ''}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </DetailRow>
              </dl>
            </article>
          ))}
        </div>
        <TraceNote>
          A credit sale contributes to sales performance while the unpaid part
          stays a receivable; repayments are separate confirmed payment events.
        </TraceNote>
      </Panel>

      <Panel
        title={`Supplier obligations · ${formatMoneyKobo(
          snapshot.report.suppliers.outstandingKobo,
        )}`}
        description="Payables from received purchases minus confirmed payments and applied supplier returns. Unconfirmed payments do not reduce the payable."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenArea('suppliers-purchasing')}
          >
            Open Suppliers &amp; Purchasing
          </Button>
        }
      >
        <div className="management-card-grid">
          {snapshot.suppliers.map((view) => (
            <article key={view.supplier.id} className="management-card">
              <h3>{view.supplier.name}</h3>
              <p className="management-card-subtitle">
                {view.supplier.phone ?? 'No phone on record'}
              </p>
              <dl className="management-details">
                <DetailRow label="Outstanding">
                  {formatMoneyKobo(view.outstandingMinor)}
                </DetailRow>
                {view.purchases.map((purchase) => (
                  <DetailRow
                    key={purchase.id}
                    label={`Purchase ${purchase.id}`}
                  >
                    {formatMoneyKobo(purchase.total)} · received{' '}
                    {formatDateTime(purchase.receivedAt)}
                  </DetailRow>
                ))}
                {view.payments.map((payment) => (
                  <DetailRow key={payment.id} label={`Payment ${payment.id}`}>
                    {formatMoneyKobo(payment.amount)} ·{' '}
                    <StateChip
                      tone={
                        payment.state === 'confirmed_success'
                          ? 'success'
                          : payment.state === 'failed'
                            ? 'danger'
                            : 'pending'
                      }
                      label={payment.state.replace(/_/g, ' ')}
                    />
                    {payment.reference ? ` · ${payment.reference}` : ''}
                  </DetailRow>
                ))}
                {view.returns.length > 0 && (
                  <DetailRow label="Supplier returns">
                    {view.returns
                      .map(
                        (item) =>
                          `${item.id} (${item.state}, ${formatMoneyKobo(
                            item.value,
                          )})`,
                      )
                      .join(' · ')}
                  </DetailRow>
                )}
              </dl>
            </article>
          ))}
        </div>
        <TraceNote>
          Supplier liability is not an operating expense: received inventory
          created the payable, and it only reduces through confirmed settlement
          events or applied supplier returns.
        </TraceNote>
      </Panel>
    </div>
  )
}
