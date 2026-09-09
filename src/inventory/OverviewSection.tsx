import { formatDateTime, formatMoney, formatQuantity } from './inventoryFormat'
import type {
  EventSourceView,
  InventoryPurchasingController,
  InventorySnapshot,
} from './inventoryController'
import { Panel, StatusChip, StateMessage } from './InventoryShared'

type OverviewSectionProps = {
  snapshot: InventorySnapshot
  controller: InventoryPurchasingController
  online: boolean
  pendingCount: number
  storageUnavailable: boolean
  onOpenProduct: (productId: string) => void
  onOpenSource: (source: EventSourceView) => void
  onOpenInvestigation: (productId: string) => void
  onOpenPurchase: (purchaseId: string) => void
  onOpenSupplierReturn: (returnId: string) => void
}

export function OverviewSection({
  snapshot,
  controller,
  online,
  pendingCount,
  storageUnavailable,
  onOpenProduct,
  onOpenSource,
  onOpenInvestigation,
  onOpenPurchase,
  onOpenSupplierReturn,
}: OverviewSectionProps) {
  const negativeProducts = snapshot.products.filter(
    (product) => product.stock.negative,
  )
  const replacementWarnings = snapshot.products.filter(
    (product) => product.sellingBelowReplacementCost,
  )
  const openReturns = snapshot.supplierReturns.filter(
    (returnView) =>
      returnView.supplierReturn.state !== 'settled' &&
      returnView.supplierReturn.state !== 'rejected',
  )
  const openInvestigations = snapshot.investigations.filter(
    (investigation) => investigation.status === 'investigating',
  )
  const recentEvents = [...snapshot.events].slice(-6).reverse()
  const payable = snapshot.suppliers.reduce(
    (total, supplier) => total + supplier.outstanding,
    0n,
  )

  return (
    <div className="inventory-section">
      <section className="inventory-panel">
        <div className="inventory-panel-header">
          <div>
            <h2>Stock overview</h2>
            <p className="inventory-row-subtitle">
              Operational state first. Every number links back to the movement
              that produced it.
            </p>
          </div>
          <div className="inventory-chip-row">
            <StatusChip
              tone={online ? 'success' : 'warning'}
              label={online ? 'Online' : 'Offline'}
            />
            <StatusChip
              tone={pendingCount > 0 ? 'warning' : 'neutral'}
              label={
                pendingCount > 0
                  ? `Sync pending · ${pendingCount}`
                  : 'Nothing waiting to sync'
              }
            />
            {storageUnavailable && (
              <StatusChip
                tone="danger"
                label="Local sync storage unavailable"
              />
            )}
          </div>
        </div>
        <dl className="inventory-metric-grid">
          <div className="inventory-metric">
            <dt>Active products</dt>
            <dd>{snapshot.products.length}</dd>
          </div>
          <div className="inventory-metric">
            <dt>Stock exceptions</dt>
            <dd>{negativeProducts.length}</dd>
          </div>
          <div className="inventory-metric">
            <dt>Supplier payable</dt>
            <dd>{formatMoney(payable)}</dd>
          </div>
          <div className="inventory-metric">
            <dt>Open investigations</dt>
            <dd>{openInvestigations.length}</dd>
          </div>
        </dl>
      </section>

      <div className="inventory-grid two">
        <Panel
          title="Needs attention"
          description="Exceptions are separated from normal stock so selling is never silently blocked or normalized."
        >
          {negativeProducts.length === 0 &&
          replacementWarnings.length === 0 &&
          openReturns.length === 0 &&
          openInvestigations.length === 0 ? (
            <StateMessage tone="info" title="No stock exceptions">
              No negative stock, replacement-cost warnings, open investigations,
              or supplier-return work requires attention.
            </StateMessage>
          ) : (
            <ul className="inventory-list">
              {negativeProducts.map((product) => (
                <li
                  key={product.product.id}
                  className="inventory-panel inventory-exception"
                >
                  <strong>Negative stock: {product.product.name}</strong>
                  <p className="inventory-row-subtitle">
                    Sellable position is{' '}
                    {formatQuantity(product.stock.sellable)}{' '}
                    {product.product.unit}. A sale completed without enough
                    recorded stock; management investigation is required.
                  </p>
                  <div className="inventory-actions">
                    <button
                      type="button"
                      className="inventory-button secondary small"
                      onClick={() => onOpenProduct(product.product.id)}
                    >
                      Open product
                    </button>
                    <button
                      type="button"
                      className="inventory-button small"
                      onClick={() => onOpenInvestigation(product.product.id)}
                    >
                      Investigate stock
                    </button>
                  </div>
                </li>
              ))}
              {replacementWarnings.map((product) => (
                <li
                  key={product.product.id}
                  className="inventory-panel inventory-exception warning"
                >
                  <strong>Price below replacement cost</strong>
                  <p className="inventory-row-subtitle">
                    {product.product.name} sells for{' '}
                    {formatMoney(BigInt(product.product.sellingPriceKobo))} but
                    the latest reliable acquisition cost is{' '}
                    {formatMoney(product.replacementCost ?? 0n)}.
                  </p>
                  <button
                    type="button"
                    className="inventory-button secondary small"
                    onClick={() => onOpenProduct(product.product.id)}
                  >
                    Review product
                  </button>
                </li>
              ))}
              {openInvestigations.map((investigation) => {
                const product = snapshot.products.find(
                  (candidate) =>
                    candidate.product.id === investigation.productId,
                )
                return (
                  <li key={investigation.id} className="inventory-panel">
                    <strong>
                      Investigation {investigation.id}: {product?.product.name}
                    </strong>
                    <p className="inventory-row-subtitle">
                      Physical {formatQuantity(investigation.physicalQuantity)};
                      system {formatQuantity(investigation.systemQuantity)};
                      variance {formatQuantity(investigation.variance)}.
                    </p>
                    <button
                      type="button"
                      className="inventory-button secondary small"
                      onClick={() =>
                        onOpenInvestigation(investigation.productId)
                      }
                    >
                      Continue investigation
                    </button>
                  </li>
                )
              })}
              {openReturns.map((returnView) => (
                <li
                  key={returnView.supplierReturn.id}
                  className="inventory-panel"
                >
                  <strong>
                    Supplier return {returnView.supplierReturn.id}
                  </strong>
                  <p className="inventory-row-subtitle">
                    State: {returnView.supplierReturn.state.replace('_', ' ')} ·
                    value {formatMoney(returnView.supplierReturn.value)}.
                  </p>
                  <button
                    type="button"
                    className="inventory-button secondary small"
                    onClick={() =>
                      onOpenSupplierReturn(returnView.supplierReturn.id)
                    }
                  >
                    Open return workflow
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent movements"
          description="The newest evidence affecting stock."
        >
          <ul className="inventory-timeline">
            {recentEvents.map((event) => {
              const product = snapshot.products.find(
                (candidate) => candidate.product.id === event.productId,
              )
              const source = controller.eventSource(event)
              return (
                <li key={event.id} className="inventory-timeline-item">
                  <strong>
                    {event.type.replace('_', ' ')} ·{' '}
                    {formatQuantity(event.quantity)} {product?.product.unit}
                  </strong>
                  <p className="inventory-row-subtitle">
                    {product?.product.name} · {formatDateTime(event.occurredAt)}
                  </p>
                  <button
                    type="button"
                    className="inventory-source-link"
                    onClick={() => onOpenSource(source)}
                  >
                    {source.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Recent purchasing"
        description="Received stock, payables, and payments remain separate records."
      >
        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Purchase</th>
                <th>Supplier</th>
                <th className="num">Acquisition value</th>
                <th className="num">Paid</th>
                <th className="num">Payable</th>
              </tr>
            </thead>
            <tbody>
              {[...snapshot.purchases]
                .reverse()
                .slice(0, 5)
                .map((purchase) => (
                  <tr key={purchase.purchase.id}>
                    <td>
                      <button
                        type="button"
                        className="inventory-source-link"
                        onClick={() => onOpenPurchase(purchase.purchase.id)}
                      >
                        {purchase.purchase.id}
                      </button>
                    </td>
                    <td>{purchase.supplier?.name ?? 'Unknown supplier'}</td>
                    <td className="num">
                      {formatMoney(purchase.purchase.total)}
                    </td>
                    <td className="num">{formatMoney(purchase.paid)}</td>
                    <td className="num">{formatMoney(purchase.outstanding)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
