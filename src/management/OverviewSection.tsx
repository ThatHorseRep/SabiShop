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
        description="Canonical figures for the selected event-time period. Nothing here is recalculated by the dashboard."
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
            label="Net recognized selling value"
            value={formatMoneyKobo(report.sales.netRecognizedSellingValueKobo)}
            hint="Selling value after approved discounts, before tax."
          />
          <Metric
            label="Tax (VAT)"
            value={formatMoneyKobo(report.sales.taxKobo)}
            hint="First-class total, kept separate from selling value."
          />
          <Metric
            label="Cost of goods sold"
            value={formatMoneyKobo(report.sales.cogsKobo)}
            hint="Weighted-average cost of goods sold in the period."
          />
          <Metric
            label="Gross profit"
            value={formatMoneyKobo(report.sales.grossProfitKobo)}
            hint={
              <span className="management-formula">
                Net recognized selling value − COGS ={' '}
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
          Period {formatDate(period.from)} → {formatDate(period.to)} ·
          event-time basis · {snapshot.traceCount} source records traced (sales,
          corrections, returns, inventory, cash, credit, expenses). Cash is not
          profit: the drawer figure below is a separate reconciliation fact.
        </TraceNote>
      </Panel>

      <Panel
        title={`Attention · ${snapshot.attention.length}`}
        description="Unresolved work that changes business decisions. Each item states what happened, the consequence, and where it is resolved."
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
                  <DetailRow label="Consequence">{item.consequence}</DetailRow>
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
        title="Position"
        description="Balances and obligations derived from their owning records, not from the sales totals above."
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
            label="Inventory remaining"
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
            hint="Negative stock keeps its exception visible; COGS for the unsourced quantity stays provisional."
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
            label="Customer credit outstanding"
            value={formatMoneyKobo(report.credit.outstandingKobo)}
            hint="Receivable derived from credit events; repayments reduce it."
          />
          <Metric
            label="Supplier obligations"
            value={formatMoneyKobo(report.suppliers.outstandingKobo)}
            hint="Payables from purchases minus confirmed payments and applied supplier returns."
          />
        </dl>
        <TraceNote>
          Every balance links to its records: use the tabs above to move from
          these figures to the sales, cash, inventory, credit, and supplier
          records that explain them.
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
      return 'Products & Inventory'
    case 'customers-credit':
      return 'Customers & Credit'
    case 'suppliers-purchasing':
      return 'Suppliers & Purchasing'
  }
}
