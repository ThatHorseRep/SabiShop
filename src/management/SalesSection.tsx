import { useState } from 'react'
import { Button, Dialog } from '../ui'
import type {
  ManagementSnapshot,
  SaleSummaryView,
} from './managementController'
import {
  DetailRow,
  Metric,
  MoneyDelta,
  Panel,
  StateChip,
  TraceNote,
} from './ManagementShared'
import {
  formatDateTime,
  formatMoneyKobo,
  paymentMethodLabel,
} from './managementFormat'

function saleStateChip(view: SaleSummaryView) {
  switch (view.derivedState) {
    case 'reversed':
      return <StateChip tone="correction" label="Completed — Reversed" />
    case 'fully_returned':
      return <StateChip tone="success" label="Completed — Fully returned" />
    case 'partially_returned':
      return <StateChip tone="info" label="Completed — Partially returned" />
    default:
      return <StateChip tone="neutral" label="Completed" />
  }
}

export function SalesSection({ snapshot }: { snapshot: ManagementSnapshot }) {
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [showAllSales, setShowAllSales] = useState(false)
  const { report } = snapshot
  const selected =
    snapshot.sales.find((view) => view.sale.id === selectedSaleId) ?? null
  const visibleSales = showAllSales
    ? snapshot.sales
    : snapshot.sales.filter((view) => view.hasPeriodActivity)

  return (
    <div className="management-section">
      <Panel
        title="Sales performance"
        description="The canonical sales figures for the period, then every underlying sale. Open a sale to inspect its payments, effects, and history."
      >
        <dl className="management-metrics">
          <Metric
            label="Net recognized selling value"
            value={formatMoneyKobo(report.sales.netRecognizedSellingValueKobo)}
          />
          <Metric
            label="Tax (VAT)"
            value={formatMoneyKobo(report.sales.taxKobo)}
          />
          <Metric
            label="Gross profit"
            value={formatMoneyKobo(report.sales.grossProfitKobo)}
            hint="Net recognized selling value − COGS."
          />
          <Metric
            label="Cash / non-cash / credit"
            value={formatMoneyKobo(report.sales.cashKobo)}
            hint={`${formatMoneyKobo(report.sales.nonCashKobo)} non-cash · ${formatMoneyKobo(
              report.sales.creditKobo,
            )} credit`}
          />
        </dl>
        <TraceNote>
          Returns, corrections, and reversals are additive signed effects on
          these totals; rejected or unapplied exceptions contribute nothing
          until they are applied.
        </TraceNote>
      </Panel>

      <Panel
        title="Sales records"
        description="Select a sale to investigate it. Older sales can be included for context and are marked."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAllSales((value) => !value)}
          >
            {showAllSales
              ? 'Show period activity only'
              : 'Include sales outside period'}
          </Button>
        }
      >
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th>Sale</th>
                <th>Recorded</th>
                <th>Salesperson</th>
                <th>State</th>
                <th className="management-num">Net value</th>
                <th className="management-num">Tax</th>
                <th className="management-num">Gross profit</th>
                <th className="management-num">Total due</th>
              </tr>
            </thead>
            <tbody>
              {visibleSales.map((view) => (
                <tr key={view.sale.id}>
                  <td>
                    <button
                      type="button"
                      className="management-row-button"
                      onClick={() => setSelectedSaleId(view.sale.id)}
                    >
                      {view.sale.id}
                    </button>
                    {!view.hasPeriodActivity && (
                      <span className="ui-text-caption ui-text-secondary">
                        {' '}
                        (outside period)
                      </span>
                    )}
                  </td>
                  <td>{formatDateTime(view.sale.completedAt)}</td>
                  <td>{view.actorName}</td>
                  <td>{saleStateChip(view)}</td>
                  <td className="management-num">
                    {formatMoneyKobo(
                      view.sale.totalDueKobo - view.sale.taxKobo,
                    )}
                  </td>
                  <td className="management-num">
                    {formatMoneyKobo(view.sale.taxKobo)}
                  </td>
                  <td className="management-num">
                    {formatMoneyKobo(view.sale.grossProfitKobo)}
                  </td>
                  <td className="management-num">
                    {formatMoneyKobo(view.sale.totalDueKobo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {selected && (
        <SaleDetailDialog
          view={selected}
          onClose={() => setSelectedSaleId(null)}
        />
      )}
    </div>
  )
}

function SaleDetailDialog({
  view,
  onClose,
}: {
  view: SaleSummaryView
  onClose: () => void
}) {
  const sale = view.sale
  return (
    <Dialog open onClose={onClose} title={`Sale ${sale.id}`}>
      <div className="management-details">
        <DetailRow label="Current state">{saleStateChip(view)}</DetailRow>
        <DetailRow label="Salesperson">{view.actorName}</DetailRow>
        <DetailRow label="Completed">
          {formatDateTime(sale.completedAt)}
        </DetailRow>
        {sale.customer && (
          <DetailRow label="Customer">
            {sale.customer.name} · {sale.customer.phone}
          </DetailRow>
        )}
        {view.creditLink && (
          <DetailRow label="Credit debt">
            {view.creditLink.debtId} ({view.creditLink.customerName})
          </DetailRow>
        )}
        <DetailRow label="Totals">
          Total due {formatMoneyKobo(sale.totalDueKobo)} · tax{' '}
          {formatMoneyKobo(sale.taxKobo)} · net{' '}
          {formatMoneyKobo(sale.totalDueKobo - sale.taxKobo)} · COGS{' '}
          {formatMoneyKobo(sale.cogsKobo)} · gross profit{' '}
          {formatMoneyKobo(sale.grossProfitKobo)}
        </DetailRow>
        <DetailRow label="Payment mix">
          Cash {formatMoneyKobo(sale.cashKobo)} · non-cash{' '}
          {formatMoneyKobo(sale.nonCashKobo)} · credit{' '}
          {formatMoneyKobo(sale.creditKobo)}
        </DetailRow>
        <DetailRow label="Payments">
          <ul className="management-timeline">
            {sale.payments.map((payment) => (
              <li key={payment.id} className="management-timeline-entry">
                <div className="management-timeline-entry__head">
                  <strong>{paymentMethodLabel(payment.method)}</strong>
                  <span>{formatMoneyKobo(payment.amountKobo)}</span>
                </div>
                <p className="management-timeline-entry__detail">
                  {payment.confirmation
                    ? `Confirmed by ${payment.confirmation.confirmedBy}`
                    : 'Unconfirmed'}
                  {payment.confirmation?.externalReference
                    ? ` · ${payment.confirmation.externalReference}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        </DetailRow>
        <DetailRow label="Lines">
          {sale.lines
            .map(
              (line) =>
                `${line.quantity} × ${line.productName} @ ${formatMoneyKobo(
                  line.unitPriceKobo,
                )}`,
            )
            .join(' · ')}
        </DetailRow>
        <DetailRow label="Inventory effects">
          {view.inventoryEventIds.length > 0
            ? view.inventoryEventIds.join(', ')
            : 'None recorded'}
        </DetailRow>
        <DetailRow label="Business events (report)">
          <ul className="management-timeline">
            {view.reportEvents.map((event) => (
              <li key={event.id} className="management-timeline-entry">
                <div className="management-timeline-entry__head">
                  <time>{formatDateTime(event.occurredAt)}</time>
                  <strong>{event.type}</strong>
                </div>
                <p className="management-timeline-entry__detail">
                  Total effect {formatMoneyKobo(event.totalDueKobo)} · tax{' '}
                  {formatMoneyKobo(event.taxKobo)} · COGS{' '}
                  {formatMoneyKobo(event.cogsKobo)} · profit{' '}
                  {formatMoneyKobo(event.grossProfitKobo)}
                </p>
                <p className="management-timeline-entry__ids">{event.id}</p>
              </li>
            ))}
          </ul>
        </DetailRow>
        <DetailRow label="Returns &amp; corrections">
          {view.returns.length === 0 && view.corrections.length === 0 ? (
            'None recorded'
          ) : (
            <ul className="management-timeline">
              {view.returns.map((record) => (
                <li key={record.id} className="management-timeline-entry">
                  <div className="management-timeline-entry__head">
                    <time>{formatDateTime(record.requestedAt)}</time>
                    <strong>Return {record.id}</strong>
                    <StateChip
                      tone={record.state === 'rejected' ? 'danger' : 'pending'}
                      label={record.state}
                    />
                  </div>
                  <p className="management-timeline-entry__detail">
                    {record.reason}
                  </p>
                </li>
              ))}
              {view.corrections.map((event) => (
                <li key={event.id} className="management-timeline-entry">
                  <div className="management-timeline-entry__head">
                    <time>{formatDateTime(event.occurredAt)}</time>
                    <strong>
                      {event.type === 'sale.reversal.applied'
                        ? 'Reversal'
                        : 'Correction'}
                    </strong>
                    {event.ownerReviewRequired && (
                      <StateChip tone="correction" label="Owner review" />
                    )}
                  </div>
                  <p className="management-timeline-entry__detail">
                    {event.reason}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DetailRow>
        <DetailRow label="Where to act">
          Returns, corrections, and reversals are performed in Money &amp;
          Reconciliation; the customer debt is managed in Customers &amp;
          Credit. This dashboard records no changes.
        </DetailRow>
        <DetailRow label="Payment corrections">
          <MoneyDelta amountKobo={paymentCorrectionTotal(view)} />
        </DetailRow>
        <div className="management-dialog-actions">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function paymentCorrectionTotal(view: SaleSummaryView): number {
  return view.reportEvents
    .filter((event) => event.type === 'sale.correction.applied')
    .reduce((sum, event) => sum + event.totalDueKobo, 0)
}
