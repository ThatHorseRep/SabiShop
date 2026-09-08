import type {
  ManagementSnapshot,
  StaffDashboardView,
} from './managementController'
import {
  DetailRow,
  Metric,
  Panel,
  StateChip,
  TraceNote,
} from './ManagementShared'
import { formatDateTime, formatMoneyKobo } from './managementFormat'

function incentiveChip(view: StaffDashboardView) {
  switch (view.incentiveStatus) {
    case 'eligible':
      return <StateChip tone="success" label="Eligible (provisional)" />
    case 'pending':
      return <StateChip tone="pending" label="Pending volume gate" />
    case 'disabled':
      return <StateChip tone="neutral" label="Incentives disabled" />
    default:
      return <StateChip tone="neutral" label="No qualifying sales in period" />
  }
}

export function StaffSection({ snapshot }: { snapshot: ManagementSnapshot }) {
  const policy = snapshot.incentivePolicy
  return (
    <div className="management-section">
      <Panel
        title="Staff performance"
        description="Per-salesperson figures projected from sale attribution and pricing facts for the selected period."
      >
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th>Salesperson</th>
                <th>Role</th>
                <th>Incentive state</th>
                <th className="management-num">Qualifying sales</th>
                <th className="management-num">Net selling value</th>
                <th className="management-num">COGS</th>
                <th className="management-num">Gross profit</th>
                <th className="management-num">Incentive-eligible value</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.staff.map((view) => (
                <tr key={view.actor.id}>
                  <td>{view.actor.displayName}</td>
                  <td>{view.actor.role}</td>
                  <td>{incentiveChip(view)}</td>
                  <td className="management-num">
                    {view.performance?.qualifyingSales ?? 0}
                  </td>
                  <td className="management-num">
                    {view.performance
                      ? formatMoneyKobo(
                          view.performance.netRecognizedSellingValueKobo,
                        )
                      : '—'}
                  </td>
                  <td className="management-num">
                    {view.performance
                      ? formatMoneyKobo(view.performance.cogsKobo)
                      : '—'}
                  </td>
                  <td className="management-num">
                    {view.performance
                      ? formatMoneyKobo(view.performance.grossProfitKobo)
                      : '—'}
                  </td>
                  <td className="management-num">
                    {view.performance &&
                    view.performance.incentiveEligibleValueKobo > 0
                      ? formatMoneyKobo(
                          view.performance.incentiveEligibleValueKobo,
                        )
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TraceNote>
          Gross profit per salesperson uses the same canonical contract as the
          business totals: net recognized selling value − COGS. Reversals reduce
          these figures; returns and corrections recalculate them before any
          release.
        </TraceNote>
      </Panel>

      <Panel
        title="Incentive visibility"
        description="Policy facts and eligibility only. No payout, release, or recovery logic exists in this dashboard."
      >
        <dl className="management-metrics">
          <Metric
            label="Incentive system"
            value={
              policy.enabled ? (
                <StateChip tone="success" label="Enabled" />
              ) : (
                <StateChip tone="neutral" label="Disabled" />
              )
            }
            hint="Salesperson attribution still occurs when disabled."
          />
          <Metric
            label="Configured percentage"
            value={`${policy.percentage}%`}
            hint="Applied by the incentive module to eligible value above the price floor."
          />
          <Metric
            label="Minimum qualifying sales"
            value={policy.minimumQualifyingCompletedSales}
            hint="Volume gate: both value and volume must pass before release."
          />
          <Metric
            label="Released incentives"
            value="Not shown"
            hint="No release records exist in the reference dataset; release and payout are owned by the incentive module."
          />
        </dl>
        <TraceNote>
          Eligible value is the amount sold above the applicable price floor on
          qualifying completed sales. Selling at the floor contributes ₦0. The
          pending return on a sale in this dataset changes nothing until it is
          applied, because unapplied exceptions emit no report event.
        </TraceNote>
      </Panel>

      <Panel
        title="Staff activity"
        description="Recent recorded work per person: sales, returns, corrections, cash events, credit events, and supplier payments."
      >
        <div className="management-card-grid">
          {snapshot.staff.map((view) => (
            <article key={view.actor.id} className="management-card">
              <h3>{view.actor.displayName}</h3>
              <p className="management-card-subtitle">
                {view.actor.role} · last sale{' '}
                {view.lastSaleAt ? formatDateTime(view.lastSaleAt) : '—'}
              </p>
              <dl className="management-details">
                <DetailRow label="Contributing sales">
                  {view.performance
                    ? view.performance.sourceEventIds.join(', ')
                    : 'None in the selected period'}
                </DetailRow>
                <DetailRow label="Recent activity">
                  <ul className="management-timeline">
                    {view.activity.map((entry) => (
                      <li key={entry.id} className="management-timeline-entry">
                        <div className="management-timeline-entry__head">
                          <time>{formatDateTime(entry.at)}</time>
                          <strong>{entry.title}</strong>
                        </div>
                        <p className="management-timeline-entry__detail">
                          {entry.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </DetailRow>
              </dl>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
