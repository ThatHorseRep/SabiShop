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
  SupplierReturnCaseView,
} from './exceptionsController'
import {
  AuthorizationNote,
  ConsequenceList,
  DetailRow,
  Panel,
  StateChip,
} from './ExceptionsShared'
import { formatMoneyKobo, parseNairaToKobo } from './exceptionsFormat'

type SupplierDialogKind = 'request' | 'settle' | 'replacement' | null

export function SupplierReturnsSection({
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
  const [dialog, setDialog] = useState<SupplierDialogKind>(null)
  const [dialogReturnId, setDialogReturnId] = useState<string | null>(null)

  const focusView = focusRecordId
    ? snapshot.supplierReturns.find((view) => view.record.id === focusRecordId)
    : undefined

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return snapshot.purchaseOptions
    return snapshot.purchaseOptions.filter((option) =>
      [
        option.purchase.id,
        option.supplier?.name ?? '',
        option.purchase.lines.map((line) => line.productId).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [snapshot.purchaseOptions, search])

  return (
    <div className="exceptions-section">
      <Panel
        title="Supplier returns"
        description="Return stock to a supplier against a recorded purchase. Unpaid purchases reduce what you owe; paid purchases create supplier credit. Replacements are separate receipts."
      >
        <div className="exceptions-search-row">
          <Field label="Search purchases">
            {({ id, describedBy }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                placeholder="Purchase ID or supplier"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            )}
          </Field>
        </div>
        <ul className="exceptions-record-list">
          {filteredPurchases.map((option) => (
            <li key={option.purchase.id}>
              <div className="exceptions-record">
                <span className="exceptions-record__title">
                  {option.purchase.id} ·{' '}
                  {option.supplier?.name ?? 'Unknown supplier'}
                </span>
                <span className="exceptions-record__meta">
                  Total {formatMoneyKobo(Number(option.purchase.total))} · paid{' '}
                  {formatMoneyKobo(option.paidKobo)} · outstanding{' '}
                  {formatMoneyKobo(option.outstandingKobo)}
                </span>
                {option.fullyPaid ? (
                  <StateChip
                    tone="info"
                    label="Paid — return creates supplier credit"
                  />
                ) : (
                  <StateChip
                    tone="warning"
                    label="Unpaid — return reduces payable"
                  />
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    setDialog('request')
                    setDialogReturnId(option.purchase.id)
                  }}
                >
                  Request return
                </Button>
              </div>
            </li>
          ))}
          {filteredPurchases.length === 0 && (
            <li className="exceptions-empty-inline">
              No purchase matches this search.
            </li>
          )}
        </ul>
      </Panel>

      <Panel
        title="Supplier return records"
        description="Each return is verified, approved, and applied as its own event with its settlement semantics recorded."
      >
        {snapshot.supplierReturns.length === 0 ? (
          <p className="ui-text-body ui-text-secondary">
            No supplier return has been recorded yet.
          </p>
        ) : (
          <ul className="exceptions-case-list">
            {snapshot.supplierReturns.map((view) => (
              <SupplierReturnCase
                key={view.record.id}
                view={view}
                highlighted={focusView?.record.id === view.record.id}
                onAction={async (action) => {
                  if (action === 'settle') {
                    setDialogReturnId(view.record.id)
                    setDialog('settle')
                    return true
                  }
                  if (action === 'replacement') {
                    setDialogReturnId(view.record.id)
                    setDialog('replacement')
                    return true
                  }
                  if (action === 'verify') {
                    return runAction('Supplier return verified', async () => {
                      await controller.verifySupplierReturn(view.record.id)
                      return `The purchase behind supplier return ${view.record.id} is verified. Approval is still required.`
                    })
                  }
                  if (action === 'approve') {
                    return runAction('Supplier return approved', async () => {
                      await controller.approveSupplierReturn(view.record.id)
                      return `Supplier return ${view.record.id} is approved. Applying it moves the stock out with the recorded condition.`
                    })
                  }
                  return runAction('Supplier return applied', async () => {
                    await controller.applySupplierReturn(view.record.id)
                    return `Supplier return ${view.record.id} is applied. ${
                      view.settlementSemantics === 'payable_reduction'
                        ? 'The payable to this supplier is reduced.'
                        : 'Supplier credit is recorded for this supplier.'
                    }`
                  })
                }}
              />
            ))}
          </ul>
        )}
      </Panel>

      {dialog === 'request' && dialogReturnId && (
        <RequestSupplierReturnDialog
          controller={controller}
          purchaseId={dialogReturnId}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}

      {dialog === 'settle' && dialogReturnId && (
        <SettleSupplierReturnDialog
          controller={controller}
          view={snapshot.supplierReturns.find(
            (candidate) => candidate.record.id === dialogReturnId,
          )!}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}

      {dialog === 'replacement' && dialogReturnId && (
        <ReplacementDialog
          controller={controller}
          view={snapshot.supplierReturns.find(
            (candidate) => candidate.record.id === dialogReturnId,
          )!}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}
    </div>
  )
}

function SupplierReturnCase({
  view,
  highlighted,
  onAction,
}: {
  view: SupplierReturnCaseView
  highlighted: boolean
  onAction: (action: string) => Promise<boolean>
}) {
  const record = view.record
  const stateTone =
    record.state === 'settled'
      ? 'success'
      : record.state === 'applied'
        ? 'info'
        : record.state === 'approved'
          ? 'info'
          : 'pending'
  return (
    <li className={`exceptions-case ${highlighted ? 'highlighted' : ''}`}>
      <div className="exceptions-case__head">
        <div>
          <h3>{record.id}</h3>
          <p className="ui-text-caption ui-text-secondary">
            {view.supplier?.name ?? record.supplierId} · purchase{' '}
            {record.purchaseId} · requested by {record.actorId} · reason:{' '}
            {record.reason}
          </p>
        </div>
        <StateChip
          tone={stateTone}
          label={supplierReturnStateLabel(record.state)}
        />
      </div>
      <dl className="exceptions-details exceptions-details--inline">
        <DetailRow label="Items">
          {record.lines
            .map(
              (line) => `${line.productId} × ${Number(line.quantity) / 1000}`,
            )
            .join(' · ')}
        </DetailRow>
        <DetailRow label="Value">
          {formatMoneyKobo(Number(record.value))}
        </DetailRow>
        <DetailRow label="Condition">
          {record.condition === 'sellable'
            ? 'Sellable'
            : 'Held / requires inspection'}
        </DetailRow>
        <DetailRow label="Settlement meaning">
          {record.paidBeforeReturn
            ? `Supplier credit of ${formatMoneyKobo(Number(record.supplierCredit))} (purchase was already paid)`
            : `Payable reduced by ${formatMoneyKobo(Number(record.unpaidPayableReduction))} (purchase not fully paid)`}
        </DetailRow>
        {record.replacementReceiptEventIds.length > 0 && (
          <DetailRow label="Replacements">
            {record.replacementReceiptEventIds.length} replacement receipt(s)
            recorded as separate new stock.
          </DetailRow>
        )}
        {view.settlements.length > 0 && (
          <DetailRow label="Settlements">
            {view.settlements
              .map(
                (settlement) =>
                  `${formatMoneyKobo(Number(settlement.amount))} via ${settlement.method}${settlement.reference ? ` (${settlement.reference})` : ''}`,
              )
              .join(' · ')}
          </DetailRow>
        )}
      </dl>
      {view.nextActions.length > 0 && (
        <div className="exceptions-case__actions">
          {view.nextActions.map((action) => (
            <Button
              key={action.action}
              size="sm"
              variant={action.action === 'settle' ? 'secondary' : 'secondary'}
              disabled={!action.permitted}
              title={action.note}
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

function supplierReturnStateLabel(state: string): string {
  switch (state) {
    case 'requested':
      return 'Requested'
    case 'verified':
      return 'Verified'
    case 'approved':
      return 'Approved'
    case 'applied':
      return 'Applied'
    default:
      return 'Settled'
  }
}

function RequestSupplierReturnDialog({
  controller,
  purchaseId,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  purchaseId: string
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const option = controller
    .snapshot()
    .purchaseOptions.find((candidate) => candidate.purchase.id === purchaseId)!
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [condition, setCondition] = useState<'sellable' | 'held'>('sellable')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedLines = option.purchase.lines
    .map((line) => ({
      productId: line.productId,
      quantity: quantities[line.productId] ?? 0,
    }))
    .filter((line) => line.quantity > 0)
  const preview =
    selectedLines.length > 0
      ? controller.previewSupplierReturn(purchaseId, selectedLines)
      : null
  const reasonMissing = !reason.trim()

  return (
    <Dialog
      open
      onClose={onClose}
      title="Request supplier return"
      dismissable={false}
    >
      <div className="exceptions-dialog-body">
        <p className="ui-text-body ui-text-secondary">
          Select the stock being returned to the supplier. The purchase record
          stays in history; the return is a separate linked event.
        </p>
        <table className="exceptions-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col" className="numeric">
                Received
              </th>
              <th scope="col" className="numeric">
                Unit cost
              </th>
              <th scope="col" className="numeric">
                Return quantity
              </th>
            </tr>
          </thead>
          <tbody>
            {option.purchase.lines.map((line) => (
              <tr key={line.productId}>
                <td>{line.productId}</td>
                <td className="numeric">{Number(line.quantity) / 1000}</td>
                <td className="numeric">
                  {formatMoneyKobo(Number(line.unitCost))}
                </td>
                <td className="numeric">
                  <input
                    className="exceptions-qty-input"
                    type="number"
                    min={0}
                    max={Number(line.quantity) / 1000}
                    value={quantities[line.productId] ?? 0}
                    aria-label={`Return quantity for ${line.productId}`}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      const max = Number(line.quantity) / 1000
                      setQuantities((current) => ({
                        ...current,
                        [line.productId]: Number.isFinite(value)
                          ? Math.max(0, Math.min(max, Math.trunc(value)))
                          : 0,
                      }))
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <fieldset className="exceptions-choice-group">
          <legend>Condition of returned stock</legend>
          <Radio
            name="supplier-return-condition"
            label="Sellable"
            checked={condition === 'sellable'}
            onChange={() => setCondition('sellable')}
          />
          <Radio
            name="supplier-return-condition"
            label="Held / damaged"
            checked={condition === 'held'}
            onChange={() => setCondition('held')}
          />
        </fieldset>
        <Field
          label="Reason"
          hint="Recorded with the return and visible in history."
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
            <p className="ui-text-caption ui-text-secondary">
              {preview.semantics === 'payable_reduction'
                ? 'This purchase is not fully paid: the return value will reduce the payable.'
                : 'This purchase was fully paid: the return value becomes supplier credit.'}
            </p>
            <h4>What this return will do</h4>
            <ConsequenceList effects={preview.effects} />
          </div>
        )}
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
              const done = await runAction(
                'Supplier return requested',
                async () => {
                  await controller.requestSupplierReturn({
                    purchaseId,
                    reason,
                    condition,
                    lines: selectedLines,
                  })
                  return `Supplier return requested against ${purchaseId}. Verify and approve it before applying any effect.`
                },
              )
              if (done) onClose()
              else
                setError(
                  'The supplier return was not recorded. Nothing changed.',
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

function SettleSupplierReturnDialog({
  controller,
  view,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  view: SupplierReturnCaseView
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [amountText, setAmountText] = useState(
    String(Number(view.record.value) / 100),
  )
  const [method, setMethod] = useState('transfer')
  const [reference, setReference] = useState('')
  const amountKobo = parseNairaToKobo(amountText)
  const invalid =
    amountKobo === null ||
    amountKobo <= 0 ||
    amountKobo > Number(view.record.value)
  return (
    <Dialog
      open
      onClose={onClose}
      title="Record supplier settlement"
      dismissable={false}
    >
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          Record what the business states happened. Sabi Shop does not execute
          or verify the money movement.
        </p>
        <Field
          label="Settlement amount (₦)"
          hint={`Return value: ${formatMoneyKobo(Number(view.record.value))}`}
          error={
            invalid ? 'Enter an amount up to the return value.' : undefined
          }
        >
          {({ id, describedBy, invalid: fieldInvalid }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              invalid={fieldInvalid}
              inputMode="decimal"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
            />
          )}
        </Field>
        <Field label="Method">
          {({ id, describedBy }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              options={[
                { value: 'transfer', label: 'Bank transfer' },
                { value: 'cash', label: 'Cash' },
                { value: 'offset', label: 'Offset against payable' },
              ]}
            />
          )}
        </Field>
        <Field label="Reference (optional)">
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
            disabled={invalid}
            onClick={async () => {
              const done = await runAction('Settlement recorded', async () => {
                await controller.settleSupplierReturn({
                  returnId: view.record.id,
                  amountKobo: amountKobo!,
                  method,
                  reference: reference.trim() || null,
                })
                return `Settlement of ${formatMoneyKobo(amountKobo!)} recorded on supplier return ${view.record.id}.`
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

function ReplacementDialog({
  controller,
  view,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  view: SupplierReturnCaseView
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const purchaseLines = view.purchase?.lines ?? []
  const selectedLines = purchaseLines
    .map((line) => ({
      productId: line.productId,
      quantity: quantities[line.productId] ?? 0,
      unitCostKobo: Number(line.unitCost),
    }))
    .filter((line) => line.quantity > 0)
  return (
    <Dialog
      open
      onClose={onClose}
      title="Record replacement receipt"
      dismissable={false}
    >
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          A replacement is recorded as a separate new receipt of stock. It does
          not edit the return or the original purchase.
        </p>
        <table className="exceptions-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col" className="numeric">
                Replacement quantity
              </th>
            </tr>
          </thead>
          <tbody>
            {purchaseLines.map((line) => (
              <tr key={line.productId}>
                <td>{line.productId}</td>
                <td className="numeric">
                  <input
                    className="exceptions-qty-input"
                    type="number"
                    min={0}
                    value={quantities[line.productId] ?? 0}
                    aria-label={`Replacement quantity for ${line.productId}`}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      setQuantities((current) => ({
                        ...current,
                        [line.productId]: Number.isFinite(value)
                          ? Math.max(0, Math.trunc(value))
                          : 0,
                      }))
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ConsequenceList
          effects={[
            'Replacement stock is received at the recorded unit cost.',
            'The return record and original purchase stay unchanged in history.',
          ]}
        />
        <div className="exceptions-dialog-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={selectedLines.length === 0}
            onClick={async () => {
              const done = await runAction('Replacement recorded', async () => {
                await controller.recordSupplierReplacement({
                  returnId: view.record.id,
                  lines: selectedLines,
                })
                return `Replacement receipt recorded against supplier return ${view.record.id}. It is a separate receipt, not an edit.`
              })
              if (done) onClose()
            }}
          >
            Record replacement
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
