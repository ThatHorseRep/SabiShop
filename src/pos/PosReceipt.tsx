import { useState } from 'react'
import { Receipt } from '@phosphor-icons/react'
import type { CompletedSale } from '../domain/sales'
import type { SyncOperation } from '../sync/offlineSync'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Overlays'
import { Money } from '../ui/Money'
import { Status } from '../ui/Status'
import { formatKobo } from '../ui/format'
import { roleLabel, type PosActor } from './posSession'
import { paymentMethodLabel } from './posFormat'

function paymentSummary(sale: CompletedSale): string {
  return sale.payments
    .map((payment) => {
      const label = paymentMethodLabel(
        payment.method,
        payment.customMethodId === 'ussd-transfer'
          ? 'USSD Transfer'
          : undefined,
      )
      return `${label} ₦${formatKobo(payment.amountKobo)}`
    })
    .join(' · ')
}

function saleReference(sale: CompletedSale): string {
  return `SR-${sale.completedAt.slice(0, 10).replace(/-/g, '')}-${sale.id.slice(-6)}`
}

/**
 * Completion feedback (C06 sections 35, 41): unmistakable completed state,
 * receipt reference, total, payment summary, and the true local/sync state.
 */
export function CompletionView({
  sale,
  actor,
  online,
  operation,
  stockExceptionLines,
  onNewSale,
  onSynchronize,
  syncing,
}: {
  sale: CompletedSale
  actor: PosActor
  online: boolean
  operation?: SyncOperation
  stockExceptionLines: readonly string[]
  onNewSale: () => void
  onSynchronize: () => void
  syncing: boolean
}) {
  const [receiptOpen, setReceiptOpen] = useState(false)
  const pending =
    operation !== undefined &&
    ['LOCAL_ONLY', 'PENDING_SYNC', 'FAILED'].includes(operation.syncState)
  const conflicted = operation?.syncState === 'CONFLICT'
  const reviewedLines = sale.lines.filter((line) => line.belowFloor)

  return (
    <section className="pos-completion" aria-labelledby="pos-completed-title">
      <span className="pos-completion__icon" aria-hidden="true">
        <Receipt size={22} weight="bold" />
      </span>
      <h2 className="ui-text-h3" id="pos-completed-title">
        Sale completed
      </h2>
      <p className="ui-text-body-sm ui-text-secondary">
        Receipt {saleReference(sale)} ·{' '}
        {new Date(sale.completedAt).toLocaleString()}
      </p>
      <div className="pos-completion__total" role="status">
        <span className="ui-text-caption">Total</span>
        <Money amountKobo={sale.totalDueKobo} />
      </div>
      <p className="ui-text-body-sm">Payment: {paymentSummary(sale)}</p>
      {sale.customer && (
        <p className="ui-text-body-sm">
          Customer: {sale.customer.name} · {sale.customer.phone}
        </p>
      )}
      <p className="ui-text-body-sm">
        Salesperson: {actor.displayName} · {roleLabel(actor.role)}
      </p>
      {pending && (
        <div className="pos-completion__sync">
          <Status
            tone="offline"
            label="Recorded on this device · Sync pending"
            description="The sale was recorded locally and will upload when synchronization runs."
          />
          {online && (
            <Button
              size="sm"
              variant="secondary"
              loading={syncing}
              onClick={onSynchronize}
            >
              Synchronize now
            </Button>
          )}
        </div>
      )}
      {conflicted && (
        <Status
          tone="conflict"
          label="Sync conflict"
          description="This sale changed in more than one place. An authorized person must review both versions before the accepted state is decided."
        />
      )}
      {stockExceptionLines.length > 0 && (
        <Status
          tone="warning"
          label="Stock exception recorded"
          description={`${stockExceptionLines.join(', ')} left sellable stock negative. The stock exception stays visible for management review.`}
        />
      )}
      {reviewedLines.length > 0 && (
        <Status
          tone="pending"
          label="Price exception flagged for review"
          description={`${reviewedLines.map((line) => line.productName).join(', ')} sold below the configured floor and the lines are flagged for management review.`}
        />
      )}
      <div className="pos-completion__actions">
        <Button variant="secondary" onClick={() => setReceiptOpen(true)}>
          View receipt
        </Button>
        <Button onClick={onNewSale}>New sale</Button>
      </div>
      <ReceiptDialog
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        sale={sale}
        actor={actor}
        reference={saleReference(sale)}
      />
    </section>
  )
}

/** The receipt preserves the completed transaction as accepted (C06 36-37). */
export function ReceiptDialog({
  open,
  onClose,
  sale,
  actor,
  reference,
}: {
  open: boolean
  onClose: () => void
  sale: CompletedSale
  actor: PosActor
  reference: string
}) {
  return (
    <Dialog open={open} onClose={onClose} title={`Receipt ${reference}`}>
      <div className="pos-receipt">
        <header className="pos-receipt__header">
          <span className="pos-receipt__business">Nkechi Hardware</span>
          <span className="ui-text-caption">
            {new Date(sale.completedAt).toLocaleString()}
          </span>
        </header>
        <table className="pos-receipt__lines">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col" className="pos-num">
                Qty
              </th>
              <th scope="col" className="pos-num">
                Price
              </th>
              <th scope="col" className="pos-num">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {sale.lines.map((line) => (
              <tr key={line.id}>
                <td>
                  <span className="pos-receipt__name">{line.productName}</span>
                  <span className="ui-text-caption ui-text-mono">
                    {line.productSku}
                  </span>
                </td>
                <td className="pos-num">{line.quantity}</td>
                <td className="pos-num">
                  <Money amountKobo={line.unitPriceKobo} />
                </td>
                <td className="pos-num">
                  <Money amountKobo={line.unitPriceKobo * line.quantity} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="pos-receipt__totals">
          <div>
            <dt>Subtotal</dt>
            <dd>
              <Money
                amountKobo={sale.lines.reduce(
                  (sum, line) =>
                    sum +
                    (line.unitPriceKobo + line.discountKobo) * line.quantity,
                  0,
                )}
              />
            </dd>
          </div>
          {sale.lines.some((line) => line.discountKobo > 0) && (
            <div>
              <dt>Discount</dt>
              <dd>
                <Money
                  amountKobo={sale.lines.reduce(
                    (sum, line) => sum + line.discountKobo * line.quantity,
                    0,
                  )}
                />
              </dd>
            </div>
          )}
          {sale.taxKobo > 0 && (
            <div>
              <dt>Tax</dt>
              <dd>
                <Money amountKobo={sale.taxKobo} />
              </dd>
            </div>
          )}
          <div className="pos-receipt__grand">
            <dt>Total</dt>
            <dd>
              <Money amountKobo={sale.totalDueKobo} />
            </dd>
          </div>
        </dl>
        <dl className="pos-receipt__meta">
          <div>
            <dt>Payment</dt>
            <dd>{paymentSummary(sale)}</dd>
          </div>
          {sale.customer && (
            <div>
              <dt>Customer</dt>
              <dd>
                {sale.customer.name} · {sale.customer.phone}
              </dd>
            </div>
          )}
          <div>
            <dt>Salesperson</dt>
            <dd>
              {actor.displayName} · {roleLabel(actor.role)}
            </dd>
          </div>
        </dl>
      </div>
    </Dialog>
  )
}
