import { useMemo, useState } from 'react'
import { formatDateTime, formatMoney, formatQuantity } from './inventoryFormat'
import type {
  EventSourceView,
  InventoryPurchasingController,
  InventorySnapshot,
} from './inventoryController'
import { Field, Panel, SourceLink, StatusChip } from './InventoryShared'

type ProductSectionProps = {
  snapshot: InventorySnapshot
  controller: InventoryPurchasingController
  selectedProductId: string
  onSelectProduct: (productId: string) => void
  onOpenSource: (source: EventSourceView) => void
  onInvestigate: (productId: string) => void
  onOpenPurchase: (purchaseId: string) => void
}

const stockStatus = (product: InventorySnapshot['products'][number]) => {
  if (product.stock.negative)
    return { tone: 'danger' as const, label: 'Stock exception' }
  if (product.stock.total === 0n)
    return { tone: 'warning' as const, label: 'Out of stock' }
  if (product.stock.sellable === 0n && product.stock.held > 0n)
    return { tone: 'warning' as const, label: 'Held stock only' }
  return { tone: 'success' as const, label: 'In stock' }
}

export function ProductSection({
  snapshot,
  controller,
  selectedProductId,
  onSelectProduct,
  onOpenSource,
  onInvestigate,
  onOpenPurchase,
}: ProductSectionProps) {
  const [query, setQuery] = useState('')
  const products = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return snapshot.products
    return snapshot.products.filter((product) =>
      [
        product.product.name,
        product.product.sku,
        product.product.category,
        product.product.unit,
        ...product.product.aliases,
      ].some((field) => field.toLocaleLowerCase().includes(normalized)),
    )
  }, [query, snapshot.products])

  const selected =
    snapshot.products.find(
      (product) => product.product.id === selectedProductId,
    ) ?? snapshot.products[0]
  const movements = selected
    ? controller
        .snapshot()
        .events.filter((event) => event.productId === selected.product.id)
    : []
  const purchases = selected
    ? snapshot.purchases.filter((purchase) =>
        purchase.purchase.lines.some(
          (line) => line.productId === selected.product.id,
        ),
      )
    : []
  const status = selected ? stockStatus(selected) : null

  return (
    <div className="inventory-section">
      <Panel
        title="Products"
        description="Search by name, SKU, alias, category, or unit. Product discovery leads directly to stock evidence."
      >
        <Field
          label="Search products"
          help="Example: rice, SG-RICE-50, foodstuff"
        >
          <input
            className="inventory-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search product identity"
          />
        </Field>
        <ul className="inventory-list">
          {products.map((product) => {
            const productStatus = stockStatus(product)
            return (
              <li key={product.product.id}>
                <button
                  type="button"
                  className={`inventory-row ${
                    selected?.product.id === product.product.id
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => onSelectProduct(product.product.id)}
                >
                  <span className="inventory-row-main">
                    <span className="inventory-row-title">
                      {product.product.name}
                    </span>
                    <span className="inventory-row-subtitle">
                      {product.product.sku} · {product.product.unit} ·{' '}
                      {product.product.category}
                    </span>
                  </span>
                  <span>
                    <span className="inventory-row-subtitle">Price</span>
                    <br />
                    <strong className="inventory-number">
                      {formatMoney(BigInt(product.product.sellingPriceKobo))}
                    </strong>
                  </span>
                  <span>
                    <span className="inventory-row-subtitle">Sellable</span>
                    <br />
                    <strong className="inventory-number">
                      {formatQuantity(product.stock.sellable)}
                    </strong>
                  </span>
                  <span>
                    <span className="inventory-row-subtitle">Held</span>
                    <br />
                    <strong className="inventory-number">
                      {formatQuantity(product.stock.held)}
                    </strong>
                  </span>
                  <StatusChip
                    tone={productStatus.tone}
                    label={productStatus.label}
                  />
                </button>
              </li>
            )
          })}
          {products.length === 0 && (
            <li className="inventory-state-message info">
              <h3>No products match this search</h3>
              <p>Try another name, SKU, category, or clear the search.</p>
            </li>
          )}
        </ul>
      </Panel>

      {selected && status && (
        <div className="inventory-split">
          <Panel
            title={selected.product.name}
            description={`${selected.product.sku} · ${selected.product.unit}`}
            actions={
              <>
                <StatusChip tone={status.tone} label={status.label} />
                <button
                  type="button"
                  className="inventory-button secondary small"
                  onClick={() => onInvestigate(selected.product.id)}
                >
                  Investigate stock
                </button>
              </>
            }
          >
            <dl className="inventory-metric-grid">
              <div className="inventory-metric">
                <dt>Current selling price</dt>
                <dd>
                  {formatMoney(BigInt(selected.product.sellingPriceKobo))}
                </dd>
              </div>
              <div className="inventory-metric">
                <dt>Sellable stock</dt>
                <dd>{formatQuantity(selected.stock.sellable)}</dd>
              </div>
              <div className="inventory-metric">
                <dt>Held stock</dt>
                <dd>{formatQuantity(selected.stock.held)}</dd>
              </div>
              <div className="inventory-metric">
                <dt>Last movement</dt>
                <dd>
                  {selected.lastMovement
                    ? formatDateTime(selected.lastMovement.occurredAt)
                    : 'No movements yet'}
                </dd>
              </div>
            </dl>

            <h3>Pricing and cost context</h3>
            {snapshot.canViewCost ? (
              <dl className="inventory-metric-grid">
                <div className="inventory-metric">
                  <dt>Price floor</dt>
                  <dd>
                    {selected.product.priceFloorKobo === undefined
                      ? 'Not configured'
                      : formatMoney(BigInt(selected.product.priceFloorKobo))}
                  </dd>
                </div>
                <div className="inventory-metric">
                  <dt>Weighted-average cost</dt>
                  <dd>
                    {selected.valuation.weightedAverageCost === null
                      ? 'Undetermined'
                      : formatMoney(selected.valuation.weightedAverageCost)}
                  </dd>
                </div>
                <div className="inventory-metric">
                  <dt>Inventory value</dt>
                  <dd>{formatMoney(selected.valuation.value)}</dd>
                </div>
                <div className="inventory-metric">
                  <dt>Latest acquisition cost</dt>
                  <dd>
                    {selected.replacementCost === null
                      ? 'Undetermined'
                      : formatMoney(selected.replacementCost)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="inventory-row-subtitle">
                Acquisition cost, floor price, weighted-average cost, and
                inventory value are hidden for this role.
              </p>
            )}
            {selected.sellingBelowReplacementCost && (
              <p className="inventory-field-error">
                Current selling price is below the latest reliable acquisition
                cost. This is management information, not an automatic price
                change.
              </p>
            )}
          </Panel>

          <div className="inventory-grid">
            <Panel
              title="Recent movements"
              description="Current stock is the result of these events."
            >
              <ul className="inventory-timeline">
                {[...movements]
                  .reverse()
                  .slice(0, 8)
                  .map((event) => {
                    const source = controller.eventSource(event)
                    return (
                      <li key={event.id} className="inventory-timeline-item">
                        <strong>
                          {event.type.replace('_', ' ')} ·{' '}
                          {formatQuantity(event.quantity)}
                        </strong>
                        <p className="inventory-row-subtitle">
                          {formatDateTime(event.occurredAt)} · {event.reason}
                        </p>
                        <SourceLink
                          label={source.label}
                          onClick={() => onOpenSource(source)}
                        />
                      </li>
                    )
                  })}
                {movements.length === 0 && (
                  <li className="inventory-state-message info">
                    <h3>No stock movements recorded</h3>
                    <p>Inventory begins when a physical receipt is recorded.</p>
                  </li>
                )}
              </ul>
            </Panel>

            <Panel
              title="Supplier and purchasing context"
              description="Where this product came from, without rewriting history."
            >
              <ul className="inventory-list">
                {purchases.map((purchase) => (
                  <li
                    key={purchase.purchase.id}
                    className="inventory-timeline-item"
                  >
                    <strong>
                      {purchase.supplier?.name ?? 'Unknown supplier'}
                    </strong>
                    <p className="inventory-row-subtitle">
                      Purchase {purchase.purchase.id} · received{' '}
                      {formatDateTime(purchase.purchase.receivedAt)} · value{' '}
                      {formatMoney(purchase.purchase.total)}
                    </p>
                    <SourceLink
                      label={`Open purchase ${purchase.purchase.id}`}
                      onClick={() => onOpenPurchase(purchase.purchase.id)}
                    />
                  </li>
                ))}
                {purchases.length === 0 && (
                  <li className="inventory-state-message info">
                    <h3>No purchasing history yet</h3>
                    <p>This product has no recorded supplier receipts.</p>
                  </li>
                )}
              </ul>
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}
