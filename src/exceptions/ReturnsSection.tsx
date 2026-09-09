import { useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  Field,
  Radio,
  Select,
  Textarea,
  TextInput,
} from '../ui'
import type { ExceptionsController } from './exceptionsController'
import type {
  ExceptionsSnapshot,
  SaleExceptionView,
  SaleReturnView,
} from './exceptionsController'
import {
  AuthorizationNote,
  ConsequenceList,
  DetailRow,
  MoneyDelta,
  Panel,
  SaleStateChip,
  StateChip,
  TimelineEntry,
  TimelineList,
} from './ExceptionsShared'
import { formatMoneyKobo } from './exceptionsFormat'

type ReturnDialogKind = 'request' | 'approve' | 'settle' | null

export function ReturnsSection({
  controller,
  snapshot,
  runAction,
  focusRecordId,
}: {
  controller: ExceptionsController
  snapshot: ExceptionsSnapshot
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
  focusRecordId: string | null
}) {
  const [search, setSearch] = useState('')
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(
    snapshot.sales[0]?.sale.id ?? null,
  )
  const [dialog, setDialog] = useState<ReturnDialogKind>(null)
  const [dialogReturnId, setDialogReturnId] = useState<string | null>(null)

  const focusReturn = focusRecordId
    ? snapshot.returns.find((view) => view.record.id === focusRecordId)
    : undefined
  const selectedSale = useMemo(
    () =>
      snapshot.sales.find(
        (view) =>
          view.sale.id === (focusReturn?.record.saleId ?? selectedSaleId),
      ) ?? snapshot.sales[0],
    [snapshot.sales, selectedSaleId, focusReturn],
  )

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return snapshot.sales
    return snapshot.sales.filter((view) =>
      [
        view.sale.id,
        view.sale.customer?.name ?? '',
        view.sale.customer?.phone ?? '',
        view.sale.lines.map((line) => line.productId).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [snapshot.sales, search])

  const returnsForSelectedSale = snapshot.returns.filter(
    (view) => view.sale.sale.id === selectedSale?.sale.id,
  )

  return (
    <div className="exceptions-section">
      <Panel
        title="Find the original sale"
        description="A return is a separate event linked to the original sale. The original record is never edited or deleted."
      >
        <div className="exceptions-search-row">
          <Field label="Search sales">
            {({ id, describedBy }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                placeholder="Sale ID, customer, or product"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            )}
          </Field>
        </div>
        <ul className="exceptions-record-list">
          {filteredSales.map((view) => (
            <li key={view.sale.id}>
              <button
                type="button"
                className={`exceptions-record ${selectedSale?.sale.id === view.sale.id ? 'selected' : ''}`}
                onClick={() => setSelectedSaleId(view.sale.id)}
              >
                <span className="exceptions-record__title">
                  {view.sale.id}
                  {view.sale.customer ? ` · ${view.sale.customer.name}` : ''}
                </span>
                <span className="exceptions-record__meta">
                  {formatMoneyKobo(view.sale.totalDueKobo)}
                  {view.correctionCount > 0
                    ? ` · ${view.correctionCount} correction(s)`
                    : ''}
                  {view.returnIds.length > 0
                    ? ` · ${view.returnIds.length} return(s)`
                    : ''}
                </span>
                <SaleStateChip view={view} />
              </button>
            </li>
          ))}
          {filteredSales.length === 0 && (
            <li className="exceptions-empty-inline">
              No sale matches this search.
            </li>
          )}
        </ul>
      </Panel>

      {selectedSale && (
        <Panel
          title={`Original record — ${selectedSale.sale.id}`}
          description="What was recorded when this sale completed. This evidence stays available no matter what happens next."
          actions={
            <Button
              onClick={() => {
                setDialog('request')
              }}
            >
              Request return
            </Button>
          }
        >
          <SaleDetail view={selectedSale} />
        </Panel>
      )}

      <Panel
        title="Returns linked to this sale"
        description="Each return is verified, approved, applied, and settled as its own recorded event."
      >
        {returnsForSelectedSale.length === 0 ? (
          <p className="ui-text-body ui-text-secondary">
            No return has been requested on this sale yet.
          </p>
        ) : (
          <ul className="exceptions-case-list">
            {returnsForSelectedSale.map((view) => (
              <ReturnCase
                key={view.record.id}
                view={view}
                onAction={async (action) => {
                  if (action === 'approve') {
                    setDialogReturnId(view.record.id)
                    setDialog('approve')
                    return true
                  }
                  if (action === 'settle') {
                    setDialogReturnId(view.record.id)
                    setDialog('settle')
                    return true
                  }
                  if (action === 'verify') {
                    return runAction('Return verified', async () => {
                      await controller.verifySaleReturn(view.record.id)
                      return `The original purchase for return ${view.record.id} is verified. Approval is still required before any effect is applied.`
                    })
                  }
                  if (action === 'reject') {
                    return runAction('Return rejected', async () => {
                      await controller.rejectSaleReturn(view.record.id)
                      return `Return ${view.record.id} is rejected and stays in history. No stock, debt, or settlement effect was applied.`
                    })
                  }
                  return runAction('Return applied', async () => {
                    await controller.applySaleReturn(view.record.id)
                    return `Return ${view.record.id} is applied. Stock, debt, settlement, and reporting effects are recorded; the original sale is unchanged.`
                  })
                }}
              />
            ))}
          </ul>
        )}
      </Panel>

      {selectedSale && dialog === 'request' && (
        <RequestReturnDialog
          controller={controller}
          sale={selectedSale}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}

      {dialog === 'approve' && dialogReturnId && (
        <ApproveReturnDialog
          controller={controller}
          view={snapshot.returns.find(
            (candidate) => candidate.record.id === dialogReturnId,
          )!}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}

      {dialog === 'settle' && dialogReturnId && (
        <SettleRefundDialog
          controller={controller}
          view={snapshot.returns.find(
            (candidate) => candidate.record.id === dialogReturnId,
          )!}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}
    </div>
  )
}

function SaleDetail({ view }: { view: SaleExceptionView }) {
  const sale = view.sale
  return (
    <div className="exceptions-detail-grid">
      <dl className="exceptions-details">
        <DetailRow label="Completed">
          {new Intl.DateTimeFormat('en-NG', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(sale.completedAt))}
        </DetailRow>
        <DetailRow label="Customer">
          {sale.customer
            ? `${sale.customer.name} · ${sale.customer.phone}`
            : 'Walk-in customer'}
        </DetailRow>
        <DetailRow label="Salesperson">{sale.actorId}</DetailRow>
        <DetailRow label="Total due">
          {formatMoneyKobo(sale.totalDueKobo)}
        </DetailRow>
        <DetailRow label="Tax">{formatMoneyKobo(sale.taxKobo)}</DetailRow>
        <DetailRow label="Payments">
          {sale.payments
            .map(
              (payment) =>
                `${payment.method.replace('_', ' ')} ${formatMoneyKobo(payment.amountKobo)}`,
            )
            .join(' · ')}
        </DetailRow>
        <DetailRow label="Correction window">
          {view.windowOpen
            ? `Open for about ${Math.max(1, Math.round(view.windowRemainingMinutes))} more minute(s)`
            : 'Expired — management authorization required'}
        </DetailRow>
      </dl>
      <div className="exceptions-lines">
        <h4>Items</h4>
        <table className="exceptions-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col" className="numeric">
                Qty
              </th>
              <th scope="col" className="numeric">
                Unit price
              </th>
              <th scope="col" className="numeric">
                Returned
              </th>
            </tr>
          </thead>
          <tbody>
            {sale.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.productId}</td>
                <td className="numeric">{line.quantity}</td>
                <td className="numeric">
                  {formatMoneyKobo(line.unitPriceKobo)}
                </td>
                <td className="numeric">
                  {view.returnedByLineId[line.id] ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReturnCase({
  view,
  onAction,
}: {
  view: SaleReturnView
  onAction: (action: string) => Promise<boolean>
}) {
  const record = view.record
  const stateTone =
    record.state === 'rejected'
      ? 'danger'
      : record.state === 'settled'
        ? 'success'
        : record.state === 'applied'
          ? 'info'
          : record.state === 'approved'
            ? 'info'
            : 'pending'
  return (
    <li className="exceptions-case">
      <div className="exceptions-case__head">
        <div>
          <h3>{record.id}</h3>
          <p className="ui-text-caption ui-text-secondary">
            Requested by {record.requestedById} · reason: {record.reason}
          </p>
        </div>
        <StateChip tone={stateTone} label={returnStateLabel(record.state)} />
      </div>
      <dl className="exceptions-details exceptions-details--inline">
        <DetailRow label="Items">
          {record.lines
            .map((line) => `${line.productId} × ${line.quantity}`)
            .join(' · ')}
        </DetailRow>
        {record.condition && (
          <DetailRow label="Condition">
            {record.condition === 'sellable'
              ? 'Sellable'
              : 'Held / requires inspection'}
          </DetailRow>
        )}
        {record.verifiedById && (
          <DetailRow label="Verified by">{record.verifiedById}</DetailRow>
        )}
        {record.approvedById && (
          <DetailRow label="Approved by">{record.approvedById}</DetailRow>
        )}
        <DetailRow label="Refund">
          {record.refund ? (
            <>
              {refundStateLabel(record.refund.state)} of{' '}
              {formatMoneyKobo(record.refund.amountKobo)}
              {record.refund.method
                ? ` via ${record.refund.method.replace('_', ' ')}`
                : ''}
              {record.refund.settledById
                ? ` by ${record.refund.settledById}`
                : ''}
            </>
          ) : (
            'Not yet determined'
          )}
        </DetailRow>
        {record.creditEffect && (
          <DetailRow label="Debt effect">
            Customer obligation reduced by{' '}
            {formatMoneyKobo(record.creditEffect.amountKobo)}. Resulting
            outstanding:{' '}
            {formatMoneyKobo(record.creditEffect.resultingOutstandingKobo)}.
          </DetailRow>
        )}
      </dl>
      {record.state === 'rejected' && (
        <p className="exceptions-note">
          This return was rejected. It remains visible as a historical decision
          and applied no stock, debt, or settlement effect.
        </p>
      )}
      {record.state === 'applied' && record.refund?.state === 'due' && (
        <p className="exceptions-note">
          The return is applied and a refund is due. Record the settlement only
          once the payment has actually been confirmed.
        </p>
      )}
      {view.nextActions.length > 0 && (
        <div className="exceptions-case__actions">
          {view.nextActions.map((action) => (
            <Button
              key={action.action}
              size="sm"
              variant={action.action === 'reject' ? 'ghost' : 'secondary'}
              disabled={!action.permitted}
              title={action.permitted ? action.note : action.note}
              onClick={() => void onAction(action.action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
      {view.nextActions.some((action) => !action.permitted) && (
        <AuthorizationNote>
          {view.nextActions
            .filter((action) => !action.permitted)
            .map((action) => `${action.label}: ${action.note}`)
            .join(' ')}
        </AuthorizationNote>
      )}
    </li>
  )
}

function returnStateLabel(state: string): string {
  switch (state) {
    case 'requested':
      return 'Requested'
    case 'verified':
      return 'Verified'
    case 'approved':
      return 'Approved'
    case 'applied':
      return 'Applied'
    case 'settled':
      return 'Settled'
    default:
      return 'Rejected'
  }
}

function refundStateLabel(state: string): string {
  switch (state) {
    case 'due':
      return 'Due'
    case 'settled':
      return 'Settled'
    default:
      return 'Not required'
  }
}

function RequestReturnDialog({
  controller,
  sale,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  sale: SaleExceptionView
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedLines = sale.sale.lines
    .map((line) => ({
      lineId: line.id,
      quantity: quantities[line.id] ?? 0,
    }))
    .filter((line) => line.quantity > 0)
  const preview =
    selectedLines.length > 0
      ? controller.previewSaleReturn(sale.sale.id, selectedLines)
      : null
  const reasonMissing = !reason.trim()

  return (
    <Dialog open onClose={onClose} title="Request a return" dismissable={false}>
      <div className="exceptions-dialog-body">
        <p className="ui-text-body ui-text-secondary">
          Select the items the customer is returning. The original sale stays in
          history; a separate return event will be linked to it.
        </p>
        <table className="exceptions-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col" className="numeric">
                Sold
              </th>
              <th scope="col" className="numeric">
                Already returned
              </th>
              <th scope="col" className="numeric">
                Return quantity
              </th>
            </tr>
          </thead>
          <tbody>
            {sale.sale.lines.map((line) => {
              const max = line.quantity - (sale.returnedByLineId[line.id] ?? 0)
              return (
                <tr key={line.id}>
                  <td>{line.productId}</td>
                  <td className="numeric">{line.quantity}</td>
                  <td className="numeric">
                    {sale.returnedByLineId[line.id] ?? 0}
                  </td>
                  <td className="numeric">
                    <input
                      className="exceptions-qty-input"
                      type="number"
                      min={0}
                      max={max}
                      value={quantities[line.id] ?? 0}
                      aria-label={`Return quantity for ${line.productId}`}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        setQuantities((current) => ({
                          ...current,
                          [line.id]: Number.isFinite(value)
                            ? Math.max(0, Math.min(max, Math.trunc(value)))
                            : 0,
                        }))
                      }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Field
          label="Reason"
          hint="Recorded with the return and visible in the audit history."
          error={reasonMissing ? 'A reason is required.' : undefined}
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          )}
        </Field>
        {preview && (
          <div className="exceptions-preview">
            <h4>Return value</h4>
            <p className="exceptions-preview__value">
              {formatMoneyKobo(preview.totalValueKobo)}
            </p>
            <h4>What this return will do</h4>
            <ConsequenceList effects={preview.effects} />
          </div>
        )}
        <AuthorizationNote>
          Every verified return requires Manager or Owner approval, separate
          from the requester. Nothing is applied until then.
        </AuthorizationNote>
        {error && (
          <p className="exceptions-dialog-error" role="alert">
            {error}
          </p>
        )}
        <div className="exceptions-dialog-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={selectedLines.length === 0 || reasonMissing}
            onClick={async () => {
              setError(null)
              const done = await runAction('Return requested', async () => {
                await controller.requestSaleReturn({
                  saleId: sale.sale.id,
                  reason,
                  lines: selectedLines,
                })
                return `The return request is recorded and linked to ${sale.sale.id}. A Manager or Owner must verify and approve it before anything is applied.`
              })
              if (done) onClose()
              else
                setError(
                  'The return was not recorded. Nothing about the sale changed.',
                )
            }}
          >
            Request return
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function ApproveReturnDialog({
  controller,
  view,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  view: SaleReturnView
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [condition, setCondition] = useState<'sellable' | 'held'>('sellable')
  const record = view.record
  const value = record.lines.reduce((sum, line) => {
    const saleLine = view.sale.sale.lines.find(
      (candidate) => candidate.id === line.lineId,
    )
    return sum + (saleLine ? saleLine.unitPriceKobo * line.quantity : 0)
  }, 0)
  return (
    <Dialog open onClose={onClose} title="Approve return" dismissable={false}>
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          Approving this return records its condition and authorizes its stock,
          debt, settlement, and reporting effects.
        </p>
        <dl className="exceptions-details">
          <DetailRow label="Return">{record.id}</DetailRow>
          <DetailRow label="Original sale">{record.saleId}</DetailRow>
          <DetailRow label="Items">
            {record.lines
              .map((line) => `${line.productId} × ${line.quantity}`)
              .join(' · ')}
          </DetailRow>
          <DetailRow label="Return value">
            {formatMoneyKobo(value)} <MoneyDelta amountKobo={-value} />
          </DetailRow>
          <DetailRow label="Requested by">
            {record.requestedById} · {record.reason}
          </DetailRow>
        </dl>
        <fieldset className="exceptions-choice-group">
          <legend>Condition of returned stock</legend>
          <Radio
            name="return-condition"
            label="Sellable — returns to sellable stock"
            checked={condition === 'sellable'}
            onChange={() => setCondition('sellable')}
          />
          <Radio
            name="return-condition"
            label="Held / requires inspection — stays outside sellable stock"
            checked={condition === 'held'}
            onChange={() => setCondition('held')}
          />
        </fieldset>
        <ConsequenceList
          effects={[
            'Stock re-enters in the recorded condition when the return is applied.',
            view.sale.creditLink
              ? "The customer's outstanding obligation is reduced; repayments stay in history."
              : 'A refund becomes due for the approved value.',
            'Reported revenue, tax, COGS, and gross profit recalculate.',
          ]}
        />
        <div className="exceptions-dialog-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const done = await runAction('Return approved', async () => {
                await controller.approveSaleReturn(record.id, condition)
                return `Return ${record.id} is approved with condition ${condition === 'sellable' ? 'sellable' : 'held'}. Applying it records the business effects.`
              })
              if (done) onClose()
            }}
          >
            Approve return
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function SettleRefundDialog({
  controller,
  view,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  view: SaleReturnView
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [method, setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const record = view.record
  const amount = record.refund?.amountKobo ?? 0
  return (
    <Dialog
      open
      onClose={onClose}
      title="Record refund settlement"
      dismissable={false}
    >
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          Sabi Shop records settlements; it does not execute or verify the money
          movement. Record this only once the payment has actually been
          confirmed.
        </p>
        <dl className="exceptions-details">
          <DetailRow label="Return">{record.id}</DetailRow>
          <DetailRow label="Refund due">{formatMoneyKobo(amount)}</DetailRow>
        </dl>
        <Field label="Settlement method">
          {({ id, describedBy }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'bank_transfer', label: 'Bank transfer' },
                { value: 'pos_card', label: 'POS / Card' },
              ]}
            />
          )}
        </Field>
        <Field
          label="External reference (optional)"
          hint="For example a transfer reference. This is recorded evidence, not verification."
        >
          {({ id, describedBy }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
          )}
        </Field>
        <div className="exceptions-dialog-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const done = await runAction('Settlement recorded', async () => {
                await controller.settleRefund(record.id, {
                  method: method as 'cash' | 'bank_transfer' | 'pos_card',
                  externalReference: reference.trim() || undefined,
                })
                return `The refund on return ${record.id} is recorded as settled via ${method.replace('_', ' ')}. The money movement itself is not executed by Sabi Shop.`
              })
              if (done) onClose()
            }}
          >
            Record settlement
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

/** Small timeline used inside the returns tab for the selected sale. */
export function SaleReturnTimeline({
  saleId,
  snapshot,
}: {
  saleId: string
  snapshot: ExceptionsSnapshot
}) {
  const entries = snapshot.history.filter((event) => event.targetId === saleId)
  if (entries.length === 0) return null
  return (
    <TimelineList
      entries={entries.map((event) => (
        <TimelineEntry
          key={event.id}
          at={event.at}
          title={event.title}
          actor={`${event.actorId} (${event.actorRole})`}
          reason={event.reason}
          detail={event.detail}
        />
      ))}
    />
  )
}
