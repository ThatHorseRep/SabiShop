import { Button } from '../ui'
import type {
  AttentionItemView,
  ManagementSnapshot,
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
  formatDate,
  formatDateTime,
  formatMoneyKobo,
  formatQuantity,
} from './managementFormat'

function attentionTone(item: AttentionItemView) {
  if (item.kind === 'cash_discrepancy' || item.kind === 'negative_stock') {
    return 'warning' as const
  }
  if (item.kind === 'owner_review') return 'correction' as const
  return 'pending' as const
}

function attentionLabel(item: AttentionItemView) {
  switch (item.kind) {
    case 'cash_discrepancy':
      return 'Cash exception'
    case 'negative_stock':
      return 'Stock exception'
    case 'sale_return':
      return 'Needs decision'
    case 'owner_review':
      return 'Owner review'
    case 'supplier_payment':
      return 'Unconfirmed'
    case 'credit_overdue':
      return 'Overdue'
  }
}

export function OverviewSection({
  snapshot,
  onOpenArea,
  onOpenTab,
}: {
  snapshot: ManagementSnapshot
  onOpenArea: (area: AttentionItemView['resolutionArea']) => void
  onOpenTab: (
    tab: 'sales' | 'money' | 'inventory' | 'credit-suppliers' | 'staff',
  ) => void
}) {
  const { report, period } = snapshot
  const cash = snapshot.cash.snapshot
  return (
    <div className="management-section">
      <Panel
        title="Business performance"
        description="Official figures for the selected period. The dashboard does not recalculate them."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenTab('sales')}
          >
            Sales records
          </Button>
        }
      >
        <dl className="management-metrics">
          <Metric
            label="Total sales after discount"
            value={formatMoneyKobo(report.sales.netRecognizedSellingValueKobo)}
            hint="Sales after approved discounts, before tax."
          />
          <Metric
            label="Tax (VAT)"
            value={formatMoneyKobo(report.sales.taxKobo)}
            hint="First-class total, kept separate from selling value."
          />
          <Metric
            label="Cost of stock sold"
            value={formatMoneyKobo(report.sales.cogsKobo)}
            hint="Weighted-average cost of stock sold in the period."
          />
          <Metric
            label="Profit before expenses"
            value={formatMoneyKobo(report.sales.grossProfitKobo)}
            hint={
              <span className="management-formula">
                Total sales after discount − Cost of stock sold ={' '}
                {formatMoneyKobo(
                  report.sales.netRecognizedSellingValueKobo -
                    report.sales.cogsKobo,
                )}
              </span>
            }
          />
          <Metric
            label="Expenses"
            value={formatMoneyKobo(report.expenses.totalKobo)}
            hint="Operating expense records in the period."
          />
          <Metric
            label="Cash received (payment mix)"
            value={formatMoneyKobo(report.sales.cashKobo)}
            hint={`Non-cash ${formatMoneyKobo(
              report.sales.nonCashKobo,
            )} · Credit ${formatMoneyKobo(report.sales.creditKobo)}`}
          />
        </dl>
        <TraceNote>
          Period {formatDate(period.from)} → {formatDate(period.to)} · based on
          when each event happened · {snapshot.traceCount} records checked
          (sales, corrections, returns, stock, cash, credit, expenses). Cash is
          not profit: the drawer figure below is a separate cash record.
        </TraceNote>
      </Panel>

      <Panel
        title={`Attention · ${snapshot.attention.length}`}
        description="Unresolved work that affects business decisions. Each item says what happened, why it matters, and where to fix it."
      >
        {snapshot.attention.length === 0 ? (
          <p className="ui-text-body-sm ui-text-secondary">
            Nothing needs management attention in the current records.
          </p>
        ) : (
          <ul className="management-attention-list">
            {snapshot.attention.map((item) => (
              <li
                key={item.id}
                className={`management-attention-item ${
                  item.kind === 'cash_discrepancy' ||
                  item.kind === 'negative_stock'
                    ? 'danger'
                    : ''
                }`}
              >
                <div className="management-attention-item__head">
                  <h3>{item.title}</h3>
                  <p>
                    {formatDateTime(item.occurredAt)} · {item.recordLabel}
                  </p>
                </div>
                <dl className="management-details">
                  <DetailRow label="What happened">
                    {item.whatHappened}
                  </DetailRow>
                  <DetailRow label="Why it matters">
                    {item.consequence}
                  </DetailRow>
                </dl>
                <div className="management-attention-item__actions">
                  <StateChip
                    tone={attentionTone(item)}
                    label={attentionLabel(item)}
                  />
                  <p className="management-where">{item.whereToResolve}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onOpenArea(item.resolutionArea)}
                  >
                    Go to {areaLabel(item.resolutionArea)}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Business position"
        description="Balances come from their own records, not from the sales totals above."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenTab('inventory')}
          >
            Stock health
          </Button>
        }
      >
        <dl className="management-metrics">
          <Metric
            label="Stock remaining"
            value={`${formatQuantity(report.inventory.remainingQuantity)} units`}
            hint={`Valued at ${formatMoneyKobo(
              report.inventory.valueKobo,
            )} (weighted average).`}
          />
          <Metric
            label="Stock health"
            value={
              report.inventory.negativeStockProductIds.length > 0 ? (
                <span className="management-negative">
                  {report.inventory.negativeStockProductIds.length} negative
                  product(s)
                </span>
              ) : (
                'No stock exceptions'
              )
            }
            tone={
              report.inventory.negativeStockProductIds.length > 0
                ? 'danger'
                : 'success'
            }
            hint="Negative stock stays visible. The cost for missing stock stays provisional until a receipt or correction explains it."
          />
          <Metric
            label="Cash in drawer"
            value={
              cash.actualCashKobo === undefined
                ? 'Not counted'
                : formatMoneyKobo(cash.actualCashKobo)
            }
            tone={cash.unresolved ? 'warning' : 'default'}
            hint={
              cash.cashVarianceKobo === undefined ? (
                'No physical count recorded for the open session.'
              ) : (
                <>
                  Expected {formatMoneyKobo(cash.expectedCashKobo)} · variance{' '}
                  <MoneyDelta amountKobo={cash.cashVarianceKobo} />
                </>
              )
            }
          />
          <Metric
            label="What customers still owe"
            value={formatMoneyKobo(report.credit.outstandingKobo)}
            hint="Credit sales minus repayments, approved returns, and write-offs."
          />
          <Metric
            label="What you still owe suppliers"
            value={formatMoneyKobo(report.suppliers.outstandingKobo)}
            hint="Purchases minus confirmed payments and approved supplier returns."
          />
        </dl>
        <TraceNote>
          Every balance links to its records: use the tabs above to move from
          these figures to the sales, cash, stock, credit, and supplier records
          that explain them.
        </TraceNote>
      </Panel>
    </div>
  )
}

function areaLabel(area: AttentionItemView['resolutionArea']): string {
  switch (area) {
    case 'money':
      return 'Money & Reconciliation'
    case 'products-inventory':
      return 'Products & Stock'
    case 'customers-credit':
      return 'Customers & Credit'
    case 'suppliers-purchasing':
      return 'Suppliers & Purchasing'
  }
}
