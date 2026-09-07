import { useState } from 'react'
import {
  formatDateTime,
  formatMoney,
  formatQuantity,
  formatSignedQuantity,
  parseQuantityInput,
} from './inventoryFormat'
import type {
  EventSourceView,
  InventoryPurchasingController,
  InventorySnapshot,
  StockInvestigation,
} from './inventoryController'
import {
  Field,
  Panel,
  SourceLink,
  StateMessage,
  StatusChip,
} from './InventoryShared'

type StockSectionProps = {
  snapshot: InventorySnapshot
  controller: InventoryPurchasingController
  selectedProductId: string
  online: boolean
  onSelectProduct: (productId: string) => void
  onOpenSource: (source: EventSourceView) => void
  onRecordCount: (input: {
    productId: string
    physicalQuantity: bigint
    cause: StockInvestigation['cause']
    note: string
  }) => Promise<boolean>
  onApplyCorrection: (
    investigationId: string,
    reason: string,
  ) => Promise<boolean>
}

export function StockSection({
  snapshot,
  controller,
  selectedProductId,
  online,
  onSelectProduct,
  onOpenSource,
  onRecordCount,
  onApplyCorrection,
}: StockSectionProps) {
  const [physicalQuantity, setPhysicalQuantity] = useState('')
  const [cause, setCause] =
    useState<StockInvestigation['cause']>('counting_error')
  const [note, setNote] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const selected =
    snapshot.products.find(
      (product) => product.product.id === selectedProductId,
    ) ?? snapshot.products[0]
  const parsedPhysical = parseQuantityInput(physicalQuantity)
  const variance =
    selected && parsedPhysical !== null
      ? parsedPhysical - selected.stock.total
      : null

  const submitCount = async () => {
    if (!selected || parsedPhysical === null) {
      setFormError('Enter the physical quantity using up to 3 decimal places.')
      return
    }
    if (!note.trim()) {
      setFormError('Record what was counted and who verified it.')
      return
    }
    setFormError(null)
    const succeeded = await onRecordCount({
      productId: selected.product.id,
      physicalQuantity: parsedPhysical,
      cause,
      note: note.trim(),
    })
    if (succeeded) {
      setPhysicalQuantity('')
      setNote('')
    }
  }

  return (
    <div className="inventory-section">
      <Panel
        title="Stock levels"
        description="Stock is a business state derived from movements, not an editable number."
      >
        <ul className="inventory-list">
          {snapshot.products.map((product) => {
            const source = product.lastMovement
              ? controller.eventSource(product.lastMovement)
              : null
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
                      {product.product.sku} · last movement{' '}
                      {product.lastMovement
                        ? formatDateTime(product.lastMovement.occurredAt)
                        : 'none'}
                    </span>
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
                  <span>
                    <span className="inventory-row-subtitle">Total</span>
                    <br />
                    <strong className="inventory-number">
                      {formatQuantity(product.stock.total)}
                    </strong>
                  </span>
                  {product.stock.negative ? (
                    <StatusChip tone="danger" label="Negative stock" />
                  ) : product.stock.total === 0n ? (
                    <StatusChip tone="warning" label="Out of stock" />
                  ) : (
                    <StatusChip tone="success" label="In stock" />
                  )}
                  <span className="inventory-row-subtitle">
                    {source ? source.label : 'No movement yet'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Panel>

      <div className="inventory-split">
        <Panel
          title="Record a physical count"
          description="A count is evidence. It does not overwrite stock."
        >
          {!online && (
            <StateMessage tone="warning" title="Offline stock count">
              The current authorization policy does not grant inventory
              adjustment work offline. The count can be prepared, but it must be
              recorded when the device is online.
            </StateMessage>
          )}
          <form
            className="inventory-form"
            onSubmit={(event) => {
              event.preventDefault()
              void submitCount()
            }}
          >
            <div className="inventory-form-row">
              <Field label="Product">
                <output className="inventory-input">
                  {selected
                    ? `${selected.product.name} (${selected.product.sku})`
                    : 'No product selected'}
                </output>
              </Field>
              <Field
                label="System quantity"
                help="Derived from the accepted movement ledger."
              >
                <output className="inventory-input inventory-number">
                  {selected ? formatQuantity(selected.stock.total) : '—'}
                </output>
              </Field>
              <Field
                label="Physical quantity"
                help="What is physically present now."
                error={
                  physicalQuantity && parsedPhysical === null
                    ? 'Use up to 3 decimal places.'
                    : undefined
                }
              >
                <input
                  className="inventory-input"
                  inputMode="decimal"
                  value={physicalQuantity}
                  onChange={(event) => setPhysicalQuantity(event.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>
            <div className="inventory-form-row">
              <Field label="Working cause">
                <select
                  className="inventory-select"
                  value={cause}
                  onChange={(event) =>
                    setCause(event.target.value as StockInvestigation['cause'])
                  }
                >
                  <option value="missing_sale">Possible missing sale</option>
                  <option value="wrong_quantity">
                    Wrong quantity recorded
                  </option>
                  <option value="incorrect_movement">
                    Incorrect movement recorded
                  </option>
                  <option value="damage">Damage or expiry</option>
                  <option value="theft">Suspected theft or loss</option>
                  <option value="counting_error">Counting error</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Count evidence">
                <textarea
                  className="inventory-textarea"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Who counted, where, and what was observed"
                />
              </Field>
            </div>
            {variance !== null && (
              <div className="inventory-summary">
                <div className="inventory-summary-row">
                  <span>System</span>
                  <strong>{formatQuantity(selected!.stock.total)}</strong>
                </div>
                <div className="inventory-summary-row">
                  <span>Physical</span>
                  <strong>{formatQuantity(parsedPhysical!)}</strong>
                </div>
                <div className="inventory-summary-row">
                  <span>Variance</span>
                  <strong>{formatSignedQuantity(variance)}</strong>
                </div>
                <p className="inventory-row-subtitle">
                  A non-zero variance becomes an investigation, never an
                  automatic stock overwrite.
                </p>
              </div>
            )}
            {formError && <p className="inventory-field-error">{formError}</p>}
            <div className="inventory-actions">
              <button type="submit" className="inventory-button">
                Record count for investigation
              </button>
            </div>
          </form>
        </Panel>

        <Panel
          title="Investigations"
          description="Understand the movement before changing inventory."
        >
          <ul className="inventory-list">
            {snapshot.investigations.map((investigation) => {
              const product = snapshot.products.find(
                (candidate) => candidate.product.id === investigation.productId,
              )
              const event = investigation.adjustmentEventId
                ? snapshot.events.find(
                    (candidate) =>
                      candidate.id === investigation.adjustmentEventId,
                  )
                : null
              return (
                <li key={investigation.id} className="inventory-timeline-item">
                  <strong>
                    {investigation.id} · {product?.product.name}
                  </strong>
                  <p className="inventory-row-subtitle">
                    System {formatQuantity(investigation.systemQuantity)} ·
                    physical {formatQuantity(investigation.physicalQuantity)} ·
                    variance {formatSignedQuantity(investigation.variance)} ·
                    cause {investigation.cause.replace('_', ' ')}
                  </p>
                  <p className="inventory-row-subtitle">{investigation.note}</p>
                  {investigation.status === 'investigating' ? (
                    <form
                      className="inventory-form"
                      onSubmit={async (submitEvent) => {
                        submitEvent.preventDefault()
                        if (!correctionReason.trim()) {
                          setFormError('A correction reason is mandatory.')
                          return
                        }
                        const succeeded = await onApplyCorrection(
                          investigation.id,
                          correctionReason.trim(),
                        )
                        if (succeeded) setCorrectionReason('')
                      }}
                    >
                      <Field
                        label="Correction reason"
                        help="This reason is preserved with the movement."
                      >
                        <input
                          className="inventory-input"
                          value={correctionReason}
                          onChange={(event) =>
                            setCorrectionReason(event.target.value)
                          }
                          placeholder="Explain the accepted cause and decision"
                        />
                      </Field>
                      <button type="submit" className="inventory-button">
                        Apply stock correction
                      </button>
                    </form>
                  ) : (
                    <div className="inventory-chip-row">
                      <StatusChip tone="success" label="Corrected" />
                      {event && (
                        <SourceLink
                          label={`Movement ${event.id}`}
                          onClick={() =>
                            onSelectProduct(investigation.productId)
                          }
                        />
                      )}
                    </div>
                  )}
                </li>
              )
            })}
            {snapshot.investigations.length === 0 && (
              <li className="inventory-state-message info">
                <h3>No investigations recorded</h3>
                <p>
                  Record a physical count when stock does not match the movement
                  ledger.
                </p>
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Negative-stock exceptions"
        description="Operational selling can finish, but the resulting state is never treated as healthy."
      >
        {snapshot.products.every((product) => !product.stock.negative) ? (
          <StateMessage tone="info" title="No negative stock">
            Every sellable position is zero or positive.
          </StateMessage>
        ) : (
          <ul className="inventory-list">
            {snapshot.products
              .filter((product) => product.stock.negative)
              .map((product) => {
                const sale = [...snapshot.events]
                  .reverse()
                  .find(
                    (event) =>
                      event.productId === product.product.id &&
                      event.type === 'sale',
                  )
                const receipt = sale
                  ? snapshot.saleReceipts.find(
                      (candidate) => candidate.saleId === sale.referenceId,
                    )
                  : null
                const source = sale ? controller.eventSource(sale) : null
                return (
                  <li
                    key={product.product.id}
                    className="inventory-panel inventory-exception"
                  >
                    <strong>
                      {product.product.name} is{' '}
                      {formatQuantity(product.stock.sellable)}{' '}
                      {product.product.unit}
                    </strong>
                    <p className="inventory-row-subtitle">
                      The sale was operationally completed so the customer was
                      not blocked. Management must reconcile the physical and
                      recorded position.
                    </p>
                    {receipt && (
                      <SourceLink
                        label={`Source sale ${receipt.saleId} · receipt ${receipt.receiptId}`}
                        onClick={() => source && onOpenSource(source)}
                      />
                    )}
                    {snapshot.canViewCost && (
                      <p className="inventory-row-subtitle">
                        Provisional quantity:{' '}
                        {formatQuantity(product.valuation.provisionalQuantity)}{' '}
                        · weighted-average cost{' '}
                        {product.valuation.weightedAverageCost === null
                          ? 'undetermined'
                          : formatMoney(product.valuation.weightedAverageCost)}
                      </p>
                    )}
                  </li>
                )
              })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
