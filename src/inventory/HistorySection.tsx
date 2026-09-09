import { useEffect, useMemo, useState } from 'react'
import { formatDateTime, formatMoney, formatQuantity } from './inventoryFormat'
import type { InventoryEventType } from '../domain/inventory'
import type {
  InventoryPurchasingController,
  InventorySnapshot,
  EventSourceView,
} from './inventoryController'
import { Field, Panel, SourceLink, StateMessage } from './InventoryShared'

type HistorySectionProps = {
  snapshot: InventorySnapshot
  controller: InventoryPurchasingController
  selectedProductId: string
  focusSource: EventSourceView | null
  onSelectSource: (source: EventSourceView) => void
}

const eventTypes: InventoryEventType[] = [
  'receipt',
  'sale',
  'customer_return',
  'supplier_return',
  'adjustment',
]

export function HistorySection({
  snapshot,
  controller,
  selectedProductId,
  focusSource,
  onSelectSource,
}: HistorySectionProps) {
  const [productId, setProductId] = useState(selectedProductId)
  const [eventType, setEventType] = useState<'all' | InventoryEventType>('all')
  const [query, setQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState<EventSourceView | null>(
    focusSource,
  )

  useEffect(() => {
    setSelectedSource(focusSource)
  }, [focusSource])

  const events = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return [...snapshot.events]
      .reverse()
      .filter((event) => productId === 'all' || event.productId === productId)
      .filter((event) => eventType === 'all' || event.type === eventType)
      .filter((event) => {
        if (!normalized) return true
        const source = controller.eventSource(event)
        return [
          event.id,
          event.referenceId ?? '',
          event.reason,
          event.actorId,
          source.label,
        ].some((field) => field.toLocaleLowerCase().includes(normalized))
      })
  }, [controller, eventType, productId, query, snapshot.events])

  const sourceDetail = () => {
    if (!selectedSource) {
      return (
        <StateMessage tone="info" title="No source selected">
          Select a source link in history to inspect the purchase, sale, return,
          replacement, or correction that produced a movement.
        </StateMessage>
      )
    }

    if (selectedSource.kind === 'purchase') {
      const purchase = snapshot.purchases.find(
        (candidate) => candidate.purchase.id === selectedSource.id,
      )
      if (!purchase)
        return (
          <StateMessage tone="warning" title="Source purchase unavailable">
            The source purchase is no longer in this reference dataset.
          </StateMessage>
        )
      return (
        <div className="inventory-summary">
          <strong>Purchase {purchase.purchase.id}</strong>
          <div className="inventory-summary-row">
            <span>Supplier</span>
            <strong>{purchase.supplier?.name ?? 'Unknown'}</strong>
          </div>
          <div className="inventory-summary-row">
            <span>Acquisition value</span>
            <strong>{formatMoney(purchase.purchase.total)}</strong>
          </div>
          <div className="inventory-summary-row">
            <span>Paid</span>
            <strong>{formatMoney(purchase.paid)}</strong>
          </div>
          <div className="inventory-summary-row">
            <span>Payable</span>
            <strong>{formatMoney(purchase.outstanding)}</strong>
          </div>
          {purchase.purchase.lines.map((line) => (
            <div key={line.receiptEventId} className="inventory-summary-row">
              <span>Movement {line.receiptEventId}</span>
              <strong>{formatQuantity(line.quantity)}</strong>
            </div>
          ))}
        </div>
      )
    }

    if (selectedSource.kind === 'sale') {
      const receipt = snapshot.saleReceipts.find(
        (candidate) => candidate.saleId === selectedSource.id,
      )
      if (!receipt)
        return (
          <StateMessage tone="warning" title="Source sale unavailable">
            The source sale receipt is not available in this reference dataset.
          </StateMessage>
        )
      return (
        <div className="inventory-summary">
          <strong>Sale {receipt.saleId}</strong>
          <div className="inventory-summary-row">
            <span>Receipt</span>
            <strong>{receipt.receiptId}</strong>
          </div>
          <div className="inventory-summary-row">
            <span>Issued</span>
            <strong>{formatDateTime(receipt.issuedAt)}</strong>
          </div>
          {receipt.lines.map((line) => (
            <div
              key={`${line.productId}-${line.quantity}`}
              className="inventory-summary-row"
            >
              <span>{line.productId}</span>
              <strong>
                {formatQuantity(line.quantity)} · {formatMoney(line.lineTotal)}
              </strong>
            </div>
          ))}
          <div className="inventory-summary-row">
            <span>Total</span>
            <strong>{formatMoney(receipt.total)}</strong>
          </div>
        </div>
      )
    }

    if (
      selectedSource.kind === 'supplier_return' ||
      selectedSource.kind === 'replacement'
    ) {
      const returnView = snapshot.supplierReturns.find(
        (candidate) => candidate.supplierReturn.id === selectedSource.id,
      )
      if (!returnView)
        return (
          <StateMessage tone="warning" title="Source return unavailable">
            The source supplier return is not available in this reference
            dataset.
          </StateMessage>
        )
      return (
        <div className="inventory-summary">
          <strong>Supplier return {returnView.supplierReturn.id}</strong>
          <div className="inventory-summary-row">
            <span>State</span>
            <strong>{returnView.supplierReturn.state.replace('_', ' ')}</strong>
          </div>
          <div className="inventory-summary-row">
            <span>Payable reduction</span>
            <strong>
              {formatMoney(returnView.supplierReturn.unpaidPayableReduction)}
            </strong>
          </div>
          <div className="inventory-summary-row">
            <span>Supplier credit</span>
            <strong>
              {formatMoney(returnView.supplierReturn.supplierCredit)}
            </strong>
          </div>
          {returnView.replacementEvents.map((event) => (
            <div key={event.id} className="inventory-summary-row">
              <span>Replacement movement</span>
              <strong>{formatQuantity(event.quantity)}</strong>
            </div>
          ))}
          {returnView.settlements.map((settlement) => (
            <div key={settlement.id} className="inventory-summary-row">
              <span>Settlement {settlement.id}</span>
              <strong>
                {formatMoney(settlement.amount)} · {settlement.state}
              </strong>
            </div>
          ))}
        </div>
      )
    }

    if (selectedSource.kind === 'investigation') {
      const investigation = snapshot.investigations.find(
        (candidate) => candidate.id === selectedSource.id,
      )
      if (!investigation)
        return (
          <StateMessage tone="warning" title="Investigation unavailable">
            The source investigation is not available in this reference dataset.
          </StateMessage>
        )
      return (
        <div className="inventory-summary">
          <strong>Investigation {investigation.id}</strong>
          <div className="inventory-summary-row">
            <span>System quantity</span>
            <strong>{formatQuantity(investigation.systemQuantity)}</strong>
          </div>
          <div className="inventory-summary-row">
            <span>Physical quantity</span>
            <strong>{formatQuantity(investigation.physicalQuantity)}</strong>
          </div>
          <div className="inventory-summary-row">
            <span>Variance</span>
            <strong>{formatQuantity(investigation.variance)}</strong>
          </div>
          <div className="inventory-summary-row">
            <span>Status</span>
            <strong>{investigation.status}</strong>
          </div>
          <p className="inventory-row-subtitle">{investigation.note}</p>
        </div>
      )
    }

    return (
      <StateMessage tone="info" title="Referenced source">
        This movement points to source reference{' '}
        {selectedSource.id ?? 'unknown'}
        and preserves its original reason in the ledger.
      </StateMessage>
    )
  }

  return (
    <div className="inventory-section">
      <Panel
        title="Stock history"
        description="Every stock change is attributable and reconstructable. This is an investigation record, not a spreadsheet."
      >
        <div className="inventory-filter-bar">
          <Field label="Product">
            <select
              className="inventory-select"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <option value="all">All products</option>
              {snapshot.products.map((product) => (
                <option key={product.product.id} value={product.product.id}>
                  {product.product.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Movement type">
            <select
              className="inventory-select"
              value={eventType}
              onChange={(event) =>
                setEventType(event.target.value as 'all' | InventoryEventType)
              }
            >
              <option value="all">All movements</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Search source, reason, actor, or ID">
            <input
              className="inventory-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="SAL-9001, damage, user-manager"
            />
          </Field>
        </div>

        <div className="inventory-split">
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Movement</th>
                  <th className="num">Quantity</th>
                  <th className="num">Resulting sellable</th>
                  <th>Source</th>
                  <th>Actor &amp; reason</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const product = snapshot.products.find(
                    (candidate) => candidate.product.id === event.productId,
                  )
                  const source = controller.eventSource(event)
                  const resulting = controller.stockAtEvent(event)
                  return (
                    <tr key={event.id}>
                      <td>{formatDateTime(event.occurredAt)}</td>
                      <td>
                        <strong>{event.type.replace('_', ' ')}</strong>
                        <br />
                        <span className="inventory-row-subtitle">
                          {product?.product.name ?? event.productId} ·{' '}
                          {event.condition}
                        </span>
                      </td>
                      <td className="num">{formatQuantity(event.quantity)}</td>
                      <td className="num">
                        {formatQuantity(resulting.sellable)}
                      </td>
                      <td>
                        <SourceLink
                          label={source.label}
                          onClick={() => onSelectSource(source)}
                        />
                        <br />
                        <span className="inventory-mono">
                          {event.id} · {event.clientEventId}
                        </span>
                      </td>
                      <td>
                        {event.actorId}
                        <br />
                        <span className="inventory-row-subtitle">
                          {event.reason}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Panel
            title="Source transaction"
            description="The business record that explains the selected movement."
          >
            {sourceDetail()}
          </Panel>
        </div>

        {events.length === 0 && (
          <StateMessage tone="info" title="No movements match these filters">
            Clear a filter or search for another source reference.
          </StateMessage>
        )}
      </Panel>
    </div>
  )
}
