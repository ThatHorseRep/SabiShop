import { useState } from 'react'
import { Button } from '../ui'
import type {
  ActivityEntryView,
  AttentionItemView,
  MySaleView,
  StaffSnapshot,
  StaffWorkArea,
  StockItemView,
} from './staffController'
import {
  BoundaryNote,
  Metric,
  Panel,
  StateChip,
  TraceNote,
} from './StaffShared'
import {
  formatDateTime,
  formatMoneyKobo,
  formatMoneyMinor,
  formatTime,
} from './staffFormat'

const areaLabels: Record<string, string> = {
  sell: 'Sell',
  money: 'Money & Reconciliation',
  'products-inventory': 'Products & Stock',
  'customers-credit': 'Customers & Credit',
}

function saleStateChip(view: MySaleView) {
  switch (view.derivedState) {
    case 'reversed':
      return <StateChip tone="correction" label="Reversed" />
    case 'fully_returned':
      return <StateChip tone="success" label="Fully returned" />
    case 'partially_returned':
      return <StateChip tone="info" label="Partially returned" />
    default:
      return <StateChip tone="neutral" label="Completed" />
  }
}

export function TodaySection({
  snapshot,
  onOpenArea,
}: {
  snapshot: StaffSnapshot
  onOpenArea: (area: StaffWorkArea) => void
}) {
  const day = snapshot.businessDay
  const canSell = snapshot.permissions.includes('sale:create')
  const canCollectRepayment = snapshot.permissions.includes('repayment:record')
  const canRecordCash = snapshot.permissions.includes('payment:record')
  return (
    <Panel
      title="Today at a glance"
      description={`Business day ${day.sessionId} · ${day.custodyLabel.toLowerCase()} · opened by ${day.openedByName}`}
      actions={<StateChip tone="info" label={day.stateLabel} />}
    >
      <dl className="staff-metrics">
        <Metric
          label="Cash in Hand"
          value={formatMoneyKobo(day.cashInHand.valueKobo)}
          hint={
            day.cashInHand.basis === 'counted'
              ? `Physical cash as last counted${
                  day.cashInHand.countedByName
                    ? ` by ${day.cashInHand.countedByName}`
                    : ''
                }.`
              : 'What the system expects in the drawer. It has not been counted yet.'
          }
        />
        <Metric
          label="My sales today"
          value={String(snapshot.myDay.saleCount)}
          hint={
            snapshot.myDay.lastSaleAt
              ? `Last sale ${formatTime(snapshot.myDay.lastSaleAt)} · ${formatMoneyKobo(snapshot.myDay.salesTotalKobo)} total`
              : 'No sales recorded by you in this business day yet.'
          }
        />
        <Metric
          label="Cash from my sales"
          value={formatMoneyKobo(snapshot.myDay.cashFromMySalesKobo)}
          hint="Confirmed cash components of your sales in this business day. Transfers, POS, and credit are tracked separately."
        />
        <Metric
          label="Money out of the till"
          value={formatMoneyKobo(day.moneyOutTodayKobo)}
          hint="Cash out and cash refunds recorded with a reason. Sales are not money out."
        />
      </dl>
      <div className="staff-quick-actions">
        {canSell && (
          <Button onClick={() => onOpenArea('sell')}>Start a sale</Button>
        )}
        {canCollectRepayment && (
          <Button
            variant="secondary"
            onClick={() => onOpenArea('customers-credit')}
          >
            Record a repayment
          </Button>
        )}
        {canRecordCash && (
          <Button variant="secondary" onClick={() => onOpenArea('money')}>
            Cash movements & counting
          </Button>
        )}
      </div>
      <TraceNote>
        Figures cover the open business day, which may cross midnight until
        official closure. Cash in Hand is derived from confirmed opening cash,
        cash sales, cash in, cash out, and cash refunds — it is never typed in
        here.
      </TraceNote>
    </Panel>
  )
}

export function MySalesSection({ snapshot }: { snapshot: StaffSnapshot }) {
  return (
    <Panel
      title="My sales today"
      description="Sales attributed to you in this business day, with their payment methods and return state."
    >
      {snapshot.myDay.sales.length === 0 ? (
        <p className="ui-text-body-sm ui-text-secondary">
          No sales yet in this business day. Selling starts from the Sell
          workspace; speaking with a customer never creates a sale by itself.
        </p>
      ) : (
        <ul className="staff-sale-list">
          {snapshot.myDay.sales.map((view) => (
            <li key={view.sale.id} className="staff-sale-item">
              <div className="staff-sale-item__head">
                <time dateTime={view.sale.completedAt}>
                  {formatTime(view.sale.completedAt)}
                </time>
                <strong>{view.sale.id}</strong>
                {saleStateChip(view)}
              </div>
              <p className="staff-sale-item__detail">
                {view.itemCount} item{view.itemCount === 1 ? '' : 's'} ·{' '}
                {view.paymentSummary}
              </p>
              <p className="staff-sale-item__total">
                {formatMoneyKobo(view.sale.totalDueKobo)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <TraceNote>
        Only your own sales appear here. Business-wide sales, other staff
        members' sales, costs, and margins are management visibility (B09
        section 30).
      </TraceNote>
    </Panel>
  )
}

export function MoneySection({
  snapshot,
  onOpenArea,
}: {
  snapshot: StaffSnapshot
  onOpenArea: (area: 'money') => void
}) {
  const day = snapshot.businessDay
  return (
    <Panel
      title="Cash in Hand and money out"
      description="The operational cash view for your shift, and every recorded movement of money out of the till."
      actions={
        <Button variant="secondary" onClick={() => onOpenArea('money')}>
          Open Money & Reconciliation
        </Button>
      }
    >
      <dl className="staff-metrics">
        <Metric
          label="Cash in Hand"
          value={formatMoneyKobo(day.cashInHand.valueKobo)}
          tone={
            day.cashInHand.basis === 'expected_not_counted'
              ? 'default'
              : 'success'
          }
          hint={
            day.cashInHand.basis === 'counted'
              ? `Last physical count${day.cashInHand.countedAt ? ` ${formatDateTime(day.cashInHand.countedAt)}` : ''}. Expected Cash remains the system view until the next count.`
              : 'Expected, not yet counted. This is the operational Cash in Hand view — not an Actual Cash entry.'
          }
        />
        <Metric
          label="Confirmed opening cash"
          value={formatMoneyKobo(day.confirmedOpeningKobo)}
          hint="Entered by staff, confirmed as the official figure by management (B05 section 3)."
        />
      </dl>
      <BoundaryNote title="Actual Cash is never entered here">
        Actual Cash exists only as a deliberate physical count during
        reconciliation, recorded in Money &amp; Reconciliation. This dashboard
        has no routine Actual Cash input and never edits cash history.
      </BoundaryNote>
      <h3 className="staff-subheading">Money out of the till today</h3>
      {snapshot.moneyOut.length === 0 ? (
        <p className="ui-text-body-sm ui-text-secondary">
          No cash out or cash refund has been recorded in this business day.
        </p>
      ) : (
        <ul className="staff-moneyout-list">
          {snapshot.moneyOut.map((view) => (
            <li key={view.event.id} className="staff-moneyout-item">
              <div className="staff-moneyout-item__head">
                <time dateTime={view.event.occurredAt}>
                  {formatTime(view.event.occurredAt)}
                </time>
                <strong>{view.kindLabel}</strong>
                <span className="staff-moneyout-item__amount">
                  −{formatMoneyKobo(view.event.amountKobo)}
                </span>
              </div>
              <p className="staff-moneyout-item__detail">
                {view.event.reason} · recorded by {view.actorName}
              </p>
            </li>
          ))}
        </ul>
      )}
      <TraceNote>
        Every cash out needs a reason and records who took or received the
        money. Which cash-outs you may record independently is a management
        policy; approval is never assumed (B05 section 8).
      </TraceNote>
    </Panel>
  )
}
export function StockSection({
  products,
  attentionCount,
  search,
  onOpenArea,
}: {
  products: readonly StockItemView[]
  attentionCount: number
  search: (query: string) => readonly StockItemView[]
  onOpenArea: (area: 'products-inventory') => void
}) {
  const [query, setQuery] = useState('')
  const results = query.trim() ? search(query) : products
  return (
    <Panel
      title="Stock and products"
      description="Check prices and availability while you work. Cost and margin information is never shown here."
      actions={
        <Button
          variant="secondary"
          onClick={() => onOpenArea('products-inventory')}
        >
          Open Products & Stock
        </Button>
      }
    >
      <label className="staff-search" htmlFor="staff-product-search">
        Search products
      </label>
      <input
        id="staff-product-search"
        className="staff-search-input"
        type="search"
        value={query}
        placeholder="Name, SKU, or alias…"
        onChange={(event) => setQuery(event.target.value)}
      />
      {attentionCount > 0 && (
        <div className="staff-stock-alert" role="status">
          <strong>{attentionCount} product needs attention</strong>
          <p>
            Recorded stock went negative. You can keep selling — the exception
            stays visible and management investigates it with evidence.
          </p>
        </div>
      )}
      <ul className="staff-product-list">
        {results.map((item) => (
          <li key={item.product.id} className="staff-product-item">
            <div className="staff-product-item__name">
              <strong>{item.product.name}</strong>
              <span className="ui-text-caption ui-text-secondary">
                {item.product.sku} · {item.product.unit}
              </span>
            </div>
            <span className="staff-product-item__price">
              {formatMoneyKobo(item.product.sellingPriceKobo)}
            </span>
            <span className={`staff-stock staff-stock--${item.stockTone}`}>
              {item.stockLabel}
            </span>
          </li>
        ))}
        {results.length === 0 && (
          <li className="ui-text-body-sm ui-text-secondary">
            No products match that search.
          </li>
        )}
      </ul>
      <TraceNote>
        Stock is derived from the accepted movement ledger — never edited here.
        Products without a configured price floor use the current price as the
        effective floor when you negotiate.
      </TraceNote>
    </Panel>
  )
}

export function CustomersSection({
  snapshot,
  onOpenArea,
}: {
  snapshot: StaffSnapshot
  onOpenArea: (area: 'customers-credit') => void
}) {
  const canCollect = snapshot.permissions.includes('repayment:record')
  return (
    <Panel
      title="Customer work"
      description="Credit customers whose repayment you may collect, and the repayments you recorded today."
      actions={
        canCollect ? (
          <Button
            variant="secondary"
            onClick={() => onOpenArea('customers-credit')}
          >
            Open Customers & Credit
          </Button>
        ) : undefined
      }
    >
      <h3 className="staff-subheading">Outstanding credit</h3>
      {snapshot.customers.collection.length === 0 ? (
        <p className="ui-text-body-sm ui-text-secondary">
          No customer currently owes the business money.
        </p>
      ) : (
        <ul className="staff-credit-list">
          {snapshot.customers.collection.map((view) => (
            <li key={view.customer.id} className="staff-credit-item">
              <div className="staff-credit-item__name">
                <strong>{view.customer.name}</strong>
                <span className="ui-text-caption ui-text-secondary">
                  {view.customer.phone}
                </span>
              </div>
              <StateChip tone={view.tone} label={view.stateLabel} />
              <span className="staff-credit-item__amount">
                {formatMoneyMinor(view.outstandingMinor)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <h3 className="staff-subheading">Repayments I recorded today</h3>
      {snapshot.myDay.repayments.length === 0 ? (
        <p className="ui-text-body-sm ui-text-secondary">
          You have not recorded a repayment in this business day.
        </p>
      ) : (
        <ul className="staff-repayment-list">
          {snapshot.myDay.repayments.map((view) => (
            <li key={view.event.id} className="staff-repayment-item">
              <div className="staff-repayment-item__head">
                <time dateTime={view.event.occurredAt}>
                  {formatTime(view.event.occurredAt)}
                </time>
                <strong>{view.customerName}</strong>
                <span>{formatMoneyMinor(view.event.amountMinor ?? 0n)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <TraceNote>
        Record a repayment only after the payment is confirmed. Credit sales and
        over-limit exceptions still require management approval — approving your
        own request is never allowed (B09 section 18).
      </TraceNote>
    </Panel>
  )
}

export function PerformanceSection({ snapshot }: { snapshot: StaffSnapshot }) {
  const performance = snapshot.performance
  const incentiveChip = () => {
    if (!performance.incentiveEnabled) {
      return <StateChip tone="neutral" label="Incentives off" />
    }
    switch (performance.status) {
      case 'eligible':
        return (
          <StateChip tone="success" label="Provisional — gates passed so far" />
        )
      case 'pending':
        return <StateChip tone="pending" label="Pending volume gate" />
      case 'disabled':
        return <StateChip tone="neutral" label="Incentives off" />
      default:
        return <StateChip tone="neutral" label="No qualifying sales yet" />
    }
  }
  return (
    <Panel
      title="My performance"
      description="Your own attributed work in this business day. The business's totals, other people's figures, costs, and margins are not shown here."
      actions={incentiveChip()}
    >
      <dl className="staff-metrics">
        <Metric
          label="Qualifying sales today"
          value={`${performance.qualifyingSales} of ${performance.minimumQualifyingSales} minimum`}
          hint="The minimum qualifying-sales gate applies to the management-configured release period, not only today. This is today's progress."
        />
        <Metric
          label="My sales after discount today"
          value={formatMoneyKobo(performance.netRecognizedSellingValueKobo)}
          hint="Your sales after applied returns, corrections, and reversals — the same figures management sees."
        />
        {performance.incentiveEnabled && (
          <Metric
            label="Incentive value so far"
            value={formatMoneyKobo(performance.eligibleValueKobo)}
            hint="Amount sold above the applicable price floor. Provisional only — not a payout and not payable yet."
          />
        )}
      </dl>
      {performance.incentiveEnabled ? (
        <BoundaryNote title="Not payable until management releases it">
          Returns, corrections, reversals, and serious corrections recalculate
          this automatically before any release. Applied ones are already in
          these figures. Management decides when to release it; nothing here is
          a promise of payment.
        </BoundaryNote>
      ) : (
        <BoundaryNote title="Incentives are off for this business">
          Your sales are still credited to you. Credit follows who actually made
          the sale, not the incentive switch.
        </BoundaryNote>
      )}
      {performance.incentiveEnabled && performance.openReturns.length > 0 && (
        <div className="staff-open-returns" role="status">
          <h4>Open returns that can still change these figures</h4>
          <ul>
            {performance.openReturns.map((view) => (
              <li key={view.record.id}>
                <strong>
                  {view.record.id} on {view.record.saleId}
                </strong>{' '}
                — {view.stateLabel}. Nothing changes until management applies
                it; once applied, the figures above recalculate automatically.
              </li>
            ))}
          </ul>
        </div>
      )}
      <TraceNote>
        Selling at the price floor contributes ₦0 eligible value. Products
        without a configured floor use the current price as the effective floor.
        Below-floor sales are held for management review and are not
        automatically rewarded.
      </TraceNote>
    </Panel>
  )
}

export function AttentionSection({
  items,
  onOpenArea,
}: {
  items: readonly AttentionItemView[]
  onOpenArea: (area: StaffWorkArea) => void
}) {
  return (
    <Panel
      title="Needs my attention"
      description="Real situations from today's records that affect your work. Each one states what to do next."
    >
      {items.length === 0 ? (
        <p className="ui-text-body-sm ui-text-secondary">
          Nothing needs your attention right now. Keep selling.
        </p>
      ) : (
        <ul className="staff-attention-list">
          {items.map((item) => (
            <li key={item.id} className="staff-attention-item">
              <h4>{item.title}</h4>
              <p>{item.whatHappened}</p>
              <p className="staff-attention-why">{item.whyItMatters}</p>
              <p className="staff-attention-next">
                <strong>What to do:</strong> {item.nextStep}
                {item.area && (
                  <Button
                    variant="ghost"
                    onClick={() => onOpenArea(item.area!)}
                  >
                    {areaLabels[item.area]}
                  </Button>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function ActivitySection({
  activity,
}: {
  activity: readonly ActivityEntryView[]
}) {
  return (
    <Panel
      title="My activity today"
      description="Your recorded work in this business day: sales, return requests, cash events, and repayments."
    >
      {activity.length === 0 ? (
        <p className="ui-text-body-sm ui-text-secondary">
          Nothing recorded by you in this business day yet.
        </p>
      ) : (
        <ol className="staff-activity-list">
          {activity.map((entry) => (
            <li key={entry.id} className="staff-activity-entry">
              <div className="staff-activity-entry__head">
                <time dateTime={entry.at}>{formatTime(entry.at)}</time>
                <strong>{entry.title}</strong>
              </div>
              <p className="staff-activity-entry__detail">{entry.detail}</p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
