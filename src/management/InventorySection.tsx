import { Button } from '../ui'
import type {
  ManagementSnapshot,
  StockHealthView,
} from './managementController'
import { Panel, StateChip, TraceNote } from './ManagementShared'
import {
  formatDateTime,
  formatMoneyKobo,
  formatQuantity,
} from './managementFormat'

function stockState(view: StockHealthView) {
  if (view.stock.negative) {
    return <StateChip tone="danger" label="Negative stock" />
  }
  if (view.valuation.provisionalQuantity > 0n) {
    return <StateChip tone="warning" label="Provisional cost" />
  }
  return <StateChip tone="success" label="Healthy" />
}

export function InventorySection({
  snapshot,
  onOpenArea,
}: {
  snapshot: ManagementSnapshot
  onOpenArea: (area: 'products-inventory') => void
}) {
  const { report } = snapshot
  return (
    <div className="management-section">
      <Panel
        title="Inventory remaining & stock health"
        description="Stock balances and valuation derive from the append-only inventory ledger; the dashboard never maintains a second stock figure."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenArea('products-inventory')}
          >
            Open Products &amp; Inventory
          </Button>
        }
      >
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Health</th>
                <th className="management-num">Sellable</th>
                <th className="management-num">Held</th>
                <th className="management-num">Total</th>
                <th className="management-num">Provisional qty</th>
                <th className="management-num">Weighted avg cost</th>
                <th className="management-num">Value</th>
                <th>Movements</th>
                <th>Last movement</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.stock.map((view) => (
                <tr key={view.product.id}>
                  <td>
                    {view.product.name}
                    <br />
                    <span className="ui-text-caption ui-text-secondary">
                      {view.product.sku} · {view.product.unit}
                    </span>
                  </td>
                  <td>{stockState(view)}</td>
                  <td className="management-num">
                    {formatQuantity(view.stock.sellable)}
                  </td>
                  <td className="management-num">
                    {formatQuantity(view.stock.held)}
                  </td>
                  <td className="management-num">
                    <span
                      className={
                        view.stock.negative ? 'management-negative' : ''
                      }
                    >
                      {formatQuantity(view.stock.total)}
                    </span>
                  </td>
                  <td className="management-num">
                    {formatQuantity(view.valuation.provisionalQuantity)}
                  </td>
                  <td className="management-num">
                    {view.valuation.weightedAverageCost === null
                      ? '—'
                      : formatMoneyKobo(view.valuation.weightedAverageCost)}
                  </td>
                  <td className="management-num">
                    {formatMoneyKobo(view.valuation.value)}
                  </td>
                  <td>{view.movementCount}</td>
                  <td>
                    {view.lastMovementAt
                      ? formatDateTime(view.lastMovementAt)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TraceNote>
          Totals for the business:{' '}
          {formatQuantity(report.inventory.remainingQuantity)} units remaining,
          valued at {formatMoneyKobo(report.inventory.valueKobo)}. Negative
          stock is an exception, not a balance to hide: the missing quantity
          keeps its provisional cost until a receipt or correction establishes
          the cost basis.
        </TraceNote>
      </Panel>

      <Panel
        title="Stock exceptions"
        description="Products whose recorded movements do not reconcile with received stock."
      >
        {report.inventory.negativeStockProductIds.length === 0 ? (
          <p className="ui-text-body-sm ui-text-secondary">
            No negative-stock exceptions in the current records.
          </p>
        ) : (
          <ul className="management-attention-list">
            {report.inventory.negativeStockProductIds.map((productId) => {
              const view = snapshot.stock.find(
                (candidate) => candidate.product.id === productId,
              )
              if (!view) return null
              return (
                <li
                  key={productId}
                  className="management-attention-item danger"
                >
                  <div className="management-attention-item__head">
                    <h3>{view.product.name}</h3>
                    <p>
                      Balance {formatQuantity(view.stock.total)}{' '}
                      {view.product.unit}(s) ·{' '}
                      {formatQuantity(view.valuation.provisionalQuantity)}{' '}
                      provisional
                    </p>
                  </div>
                  <p className="ui-text-body-sm">
                    Sales exceeded received stock. Investigate the movement
                    history, receive the missing stock, or correct the
                    originating record — the dashboard does not adjust stock.
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
