import { useMemo, useState } from 'react'
import { Button, Dialog, Field, Select, Textarea, TextInput } from '../ui'
import type { CorrectionChange } from '../domain/returnsCorrections'
import type { ExceptionsController } from './exceptionsController'
import type { ExceptionsSnapshot } from './exceptionsController'
import { approvalCandidates } from '../pos/posSession'
import {
  AuthorizationNote,
  ConsequenceList,
  DetailRow,
  MoneyDelta,
  OriginalVersusCurrent,
  Panel,
  SaleStateChip,
  StateChip,
  TimelineEntry,
  TimelineList,
} from './ExceptionsShared'
import {
  formatMoneyKobo,
  formatSignedKobo,
  parseNairaToKobo,
} from './exceptionsFormat'

type CorrectionKind =
  | 'note'
  | 'quantity'
  | 'payment_amount'
  | 'customer_identity'
  | 'salesperson_attribution'

type DialogKind = 'correct' | 'reverse' | null

const correctionKindOptions: Array<{
  value: CorrectionKind
  label: string
  severity: string
}> = [
  { value: 'note', label: 'Note', severity: 'Ordinary' },
  { value: 'quantity', label: 'Quantity', severity: 'Material' },
  { value: 'payment_amount', label: 'Payment amount', severity: 'Material' },
  {
    value: 'customer_identity',
    label: 'Customer identity',
    severity: 'High integrity',
  },
  {
    value: 'salesperson_attribution',
    label: 'Salesperson attribution',
    severity: 'High integrity',
  },
]

export function CorrectionsSection({
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
    focusRecordId ?? snapshot.sales[0]?.sale.id ?? null,
  )
  const [dialog, setDialog] = useState<DialogKind>(null)

  const selectedSale = useMemo(
    () =>
      snapshot.sales.find((view) => view.sale.id === selectedSaleId) ??
      snapshot.sales[0],
    [snapshot.sales, selectedSaleId],
  )

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return snapshot.sales
    return snapshot.sales.filter((view) =>
      [view.sale.id, view.sale.customer?.name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [snapshot.sales, search])

  const correctionsForSale = snapshot.corrections.filter(
    (event) => event.saleId === selectedSale?.sale.id,
  )

  return (
    <div className="exceptions-section">
      <Panel
        title="Corrections"
        description="A correction changes an incorrect record without pretending the original never existed. The original, the correction, and the resulting accepted state all stay visible."
      >
        <div className="exceptions-search-row">
          <Field label="Find a sale">
            {({ id, describedBy }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                placeholder="Sale ID or customer"
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
                  {formatMoneyKobo(view.sale.totalDueKobo)} ·{' '}
                  {view.correctionCount} correction(s)
                </span>
                <SaleStateChip view={view} />
                {view.sale.reversedAt ? null : view.windowOpen ? (
                  <StateChip
                    tone="success"
                    label="Correction window open"
                    title={`About ${Math.max(1, Math.round(view.windowRemainingMinutes))} minute(s) remaining`}
                  />
                ) : (
                  <StateChip tone="neutral" label="Window expired" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      {selectedSale && (
        <Panel
          title={`Correct record — ${selectedSale.sale.id}`}
          description="Corrections are entered from the affected record. The action explains why additional authority may be required."
          actions={
            <>
              <Button
                onClick={() => {
                  setDialog('correct')
                }}
              >
                Correct record
              </Button>
              <Button
                variant="danger"
                disabled={!selectedSale.canReverse}
                title={selectedSale.reversalRequirement}
                onClick={() => {
                  setDialog('reverse')
                }}
              >
                Reverse sale
              </Button>
            </>
          }
        >
          <dl className="exceptions-details">
            <DetailRow label="Original total">
              {formatMoneyKobo(selectedSale.sale.totalDueKobo)}
            </DetailRow>
            <DetailRow label="Correction window">
              {selectedSale.windowOpen
                ? `Open — about ${Math.max(1, Math.round(selectedSale.windowRemainingMinutes))} minute(s) remaining`
                : 'Expired — management authorization required'}
            </DetailRow>
            <DetailRow label="Reversal">
              {selectedSale.sale.reversedAt
                ? 'Already reversed; the record and its reversal remain in history.'
                : selectedSale.reversalRequirement}
            </DetailRow>
          </dl>
          <AuthorizationNote>
            {selectedSale.sale.reversedAt
              ? 'This sale is reversed. A reversal is a controlled correction, not a deletion.'
              : 'A reversal invalidates the sale as a controlled correction: the original record, reason, authorization, and compensating effects are all preserved. It is never presented as deletion.'}
          </AuthorizationNote>
        </Panel>
      )}

      {selectedSale && (
        <Panel
          title="Correction and reversal history"
          description="Original → correction → accepted current state. Corrections can themselves be corrected; nothing is overwritten."
        >
          {correctionsForSale.length === 0 ? (
            <p className="ui-text-body ui-text-secondary">
              No correction or reversal has been applied to this sale.
            </p>
          ) : (
            <TimelineList
              entries={correctionsForSale.map((event) => (
                <TimelineEntry
                  key={event.id}
                  at={event.occurredAt}
                  title={
                    event.type === 'sale.reversal.applied'
                      ? 'Sale reversed'
                      : 'Correction applied'
                  }
                  actor={`${event.actorId} (${event.actorRole})`}
                  reason={event.reason}
                  detail={`Severity: ${event.severity.replace('_', ' ')}. ${event.ownerReviewRequired ? 'Flagged for Owner review.' : ''}`}
                />
              ))}
            />
          )}
        </Panel>
      )}

      {selectedSale && dialog === 'correct' && (
        <CorrectionDialog
          controller={controller}
          snapshot={snapshot}
          saleId={selectedSale.sale.id}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}

      {selectedSale && dialog === 'reverse' && (
        <ReversalDialog
          controller={controller}
          saleId={selectedSale.sale.id}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}
    </div>
  )
}

function CorrectionDialog({
  controller,
  snapshot,
  saleId,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  snapshot: ExceptionsSnapshot
  saleId: string
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [kind, setKind] = useState<CorrectionKind>('note')
  const [reason, setReason] = useState('')
  const [noteValue, setNoteValue] = useState('')
  const [lineId, setLineId] = useState('')
  const [quantityText, setQuantityText] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [amountText, setAmountText] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [salespersonId, setSalespersonId] = useState('')
  const [approverId, setApproverId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const sale = snapshot.sales.find((view) => view.sale.id === saleId)!
  const activeLine =
    kind === 'quantity'
      ? sale.sale.lines.find(
          (line) => line.id === (lineId || sale.sale.lines[0].id),
        )
      : undefined
  const activePayment =
    kind === 'payment_amount'
      ? sale.sale.payments.find(
          (payment) => payment.id === (paymentId || sale.sale.payments[0].id),
        )
      : undefined

  const change: CorrectionChange | null = useMemo(() => {
    switch (kind) {
      case 'note':
        return noteValue.trim()
          ? { field: 'note', correctedValue: noteValue }
          : null
      case 'quantity': {
        const quantity = Number(quantityText)
        if (!activeLine || !Number.isInteger(quantity) || quantity <= 0)
          return null
        return {
          field: 'quantity',
          lineId: activeLine.id,
          productId: activeLine.productId,
          correctedQuantity: quantity,
        }
      }
      case 'payment_amount': {
        const amountKobo = parseNairaToKobo(amountText)
        if (!activePayment || amountKobo === null || amountKobo <= 0)
          return null
        return {
          field: 'payment_amount',
          paymentId: activePayment.id,
          correctedAmountKobo: amountKobo,
        }
      }
      case 'customer_identity':
        return customerId.trim() && customerName.trim() && customerPhone.trim()
          ? {
              field: 'customer_identity',
              customerId,
              customerName,
              customerPhone,
            }
          : null
      case 'salesperson_attribution':
        return salespersonId.trim()
          ? { field: 'salesperson_attribution', salespersonId }
          : null
    }
  }, [
    kind,
    noteValue,
    activeLine,
    quantityText,
    activePayment,
    amountText,
    customerId,
    customerName,
    customerPhone,
    salespersonId,
  ])

  // Authority guidance must be visible before the form is complete (C03
  // section 29). Fall back to a representative change of the selected kind.
  const authorityChange: CorrectionChange = useMemo(() => {
    if (change) return change
    const firstLine = sale.sale.lines[0]
    const firstPayment = sale.sale.payments[0]
    switch (kind) {
      case 'note':
        return { field: 'note', correctedValue: ' ' }
      case 'quantity':
        return {
          field: 'quantity',
          lineId: firstLine.id,
          productId: firstLine.productId,
          correctedQuantity: firstLine.quantity,
        }
      case 'payment_amount':
        return {
          field: 'payment_amount',
          paymentId: firstPayment.id,
          correctedAmountKobo: firstPayment.amountKobo,
        }
      case 'customer_identity':
        return {
          field: 'customer_identity',
          customerId: ' ',
          customerName: ' ',
          customerPhone: ' ',
        }
      case 'salesperson_attribution':
        return {
          field: 'salesperson_attribution',
          salespersonId: ' ',
        }
    }
  }, [change, kind, sale.sale.lines, sale.sale.payments])

  const authority = controller.correctionAuthority(saleId, authorityChange)
  const preview = change ? controller.previewCorrection(saleId, change) : null
  const reasonMissing = !reason.trim()
  const approverCandidates = approvalCandidates({
    businessId: '',
    businessName: '',
    deviceId: '',
    actor: snapshot.actor,
    permissions: new Set(snapshot.permissions),
  }).filter((candidate) =>
    authority?.approverMustBeOwner ? candidate.role === 'owner' : true,
  )
  const approverOptions = approverCandidates.map((candidate) => ({
    value: candidate.id,
    label: `${candidate.displayName} (${candidate.role})`,
  }))
  const approvalMissing = Boolean(authority?.requiresApproval) && !approverId
  const canConfirm =
    Boolean(change) &&
    !reasonMissing &&
    !approvalMissing &&
    (authority?.canApply ?? false)

  return (
    <Dialog open onClose={onClose} title="Correct record" dismissable={false}>
      <div className="exceptions-dialog-body">
        <p className="ui-text-body ui-text-secondary">
          Choose what was recorded incorrectly. The correction preview shows the
          original state, the corrected state, and the expected effects before
          anything is applied.
        </p>
        <Field label="What is incorrect?">
          {({ id, describedBy }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as CorrectionKind)
              }
              options={correctionKindOptions.map((option) => ({
                value: option.value,
                label: `${option.label} — ${option.severity}`,
              }))}
            />
          )}
        </Field>

        {kind === 'note' && (
          <Field
            label="Corrected note"
            hint="Ordinary correction: no money, stock, debt, or attribution effect."
          >
            {({ id, describedBy }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                value={noteValue}
                onChange={(event) => setNoteValue(event.target.value)}
              />
            )}
          </Field>
        )}

        {kind === 'quantity' && activeLine && (
          <>
            <Field label="Sale line">
              {({ id, describedBy }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  value={activeLine.id}
                  onChange={(event) => setLineId(event.target.value)}
                  options={sale.sale.lines.map((line) => ({
                    value: line.id,
                    label: `${line.productId} — quantity ${line.quantity}`,
                  }))}
                />
              )}
            </Field>
            <Field
              label="Corrected quantity"
              hint={`Currently ${activeLine.quantity}.`}
            >
              {({ id, describedBy }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  type="number"
                  min={1}
                  value={quantityText}
                  onChange={(event) => setQuantityText(event.target.value)}
                />
              )}
            </Field>
          </>
        )}

        {kind === 'payment_amount' && activePayment && (
          <>
            <Field label="Payment">
              {({ id, describedBy }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  value={activePayment.id}
                  onChange={(event) => setPaymentId(event.target.value)}
                  options={sale.sale.payments.map((payment) => ({
                    value: payment.id,
                    label: `${payment.method.replace('_', ' ')} — ${formatMoneyKobo(payment.amountKobo)}`,
                  }))}
                />
              )}
            </Field>
            <Field
              label="Corrected amount (₦)"
              hint={`Currently ${formatMoneyKobo(activePayment.amountKobo)}.`}
            >
              {({ id, describedBy }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  inputMode="decimal"
                  value={amountText}
                  onChange={(event) => setAmountText(event.target.value)}
                />
              )}
            </Field>
          </>
        )}

        {kind === 'customer_identity' && (
          <>
            <Field
              label="Correct customer ID"
              hint="High-integrity correction: the original association stays recoverable."
            >
              {({ id, describedBy }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                />
              )}
            </Field>
            <Field label="Customer name">
              {({ id, describedBy }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                />
              )}
            </Field>
            <Field label="Customer phone">
              {({ id, describedBy }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                />
              )}
            </Field>
          </>
        )}

        {kind === 'salesperson_attribution' && (
          <Field
            label="Correct salesperson ID"
            hint="High-integrity correction: attribution is protected and requires elevated authority."
          >
            {({ id, describedBy }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                value={salespersonId}
                onChange={(event) => setSalespersonId(event.target.value)}
              />
            )}
          </Field>
        )}

        <Field
          label="Reason"
          hint="Free text, recorded with the correction history."
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
            <h4>Correction preview</h4>
            <OriginalVersusCurrent
              original={
                <dl className="exceptions-details">
                  <DetailRow label="Total">
                    {formatMoneyKobo(preview.originalTotalKobo)}
                  </DetailRow>
                </dl>
              }
              current={
                <dl className="exceptions-details">
                  <DetailRow label="Total">
                    {formatMoneyKobo(preview.correctedTotalKobo)}{' '}
                    <MoneyDelta amountKobo={preview.differenceKobo} />
                  </DetailRow>
                </dl>
              }
              originalLabel="Original accepted state"
              currentLabel="Corrected state (proposed)"
            />
            <h4>Expected effects</h4>
            <ConsequenceList effects={preview.effects} />
          </div>
        )}

        {authority && (
          <AuthorizationNote>
            {authority.requirement}
            {authority.severity === 'material' ||
            authority.severity === 'high_integrity'
              ? ' The original payment, stock, debt, and attribution evidence stays recoverable.'
              : ''}
          </AuthorizationNote>
        )}

        {authority?.requiresApproval && (
          <Field
            label="Separate approval"
            hint="The approver must be a different authorized person."
            error={approvalMissing ? 'Select an approver.' : undefined}
          >
            {({ id, describedBy }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                value={approverId}
                onChange={(event) => setApproverId(event.target.value)}
                options={approverOptions}
                placeholder="Choose the approver…"
              />
            )}
          </Field>
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
            disabled={!canConfirm}
            title={
              authority && !authority.canApply
                ? authority.requirement
                : undefined
            }
            onClick={async () => {
              setError(null)
              const done = await runAction('Correction applied', async () => {
                const approver = approverCandidates.find(
                  (candidate) => candidate.id === approverId,
                )
                await controller.correctSale({
                  saleId,
                  reason,
                  change: change!,
                  approval:
                    authority?.requiresApproval && approver
                      ? {
                          approverId: approver.id,
                          approverRole: approver.role,
                        }
                      : undefined,
                })
                return `The correction on ${saleId} is applied and recorded in history. The original state remains recoverable.`
              })
              if (done) onClose()
              else
                setError(
                  'The correction was not applied. The sale is unchanged.',
                )
            }}
          >
            Apply correction
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function ReversalDialog({
  controller,
  saleId,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  saleId: string
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [reason, setReason] = useState('')
  const [approverId, setApproverId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const authority = controller.reversalAuthority(saleId)
  const snapshot = controller.snapshot()
  const sale = snapshot.sales.find((view) => view.sale.id === saleId)!
  const reasonMissing = !reason.trim()
  const approvalMissing = authority.requiresApproval && !approverId
  const canConfirm = authority.canApply && !reasonMissing && !approvalMissing
  const approverCandidates = approvalCandidates({
    businessId: '',
    businessName: '',
    deviceId: '',
    actor: snapshot.actor,
    permissions: new Set(snapshot.permissions),
  })
  const approverOptions = approverCandidates.map((candidate) => ({
    value: candidate.id,
    label: `${candidate.displayName} (${candidate.role})`,
  }))

  return (
    <Dialog open onClose={onClose} title="Reverse sale" dismissable={false}>
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          A reversal records that this sale should no longer count economically.
          The original sale, this reversal, its reason, authorization, and the
          compensating inventory and credit effects all remain in history.
        </p>
        <dl className="exceptions-details">
          <DetailRow label="Sale">{saleId}</DetailRow>
          <DetailRow label="Total">
            {formatMoneyKobo(sale.sale.totalDueKobo)}
          </DetailRow>
          <DetailRow label="Cash component">
            {formatMoneyKobo(sale.sale.cashKobo)}
          </DetailRow>
          <DetailRow label="Non-cash component">
            {formatMoneyKobo(sale.sale.nonCashKobo)}
          </DetailRow>
          <DetailRow label="Credit component">
            {formatMoneyKobo(sale.sale.creditKobo)}
          </DetailRow>
        </dl>
        <ConsequenceList
          effects={[
            'Revenue, tax, COGS, and gross profit are removed from reporting by a compensating event.',
            'Stock returns in sellable condition.',
            sale.creditLink
              ? 'The remaining customer obligation is reversed; repayments already received stay in history.'
              : 'The payment events stay in history as evidence.',
            'The sale remains visible, marked as reversed — it is never deleted.',
          ]}
        />
        <Field
          label="Reason"
          hint="Recorded with the reversal history."
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
        {authority.requiresApproval && (
          <Field
            label="Separate approval"
            hint="A Manager reversal requires a separate Manager or Owner."
            error={approvalMissing ? 'Select an approver.' : undefined}
          >
            {({ id, describedBy }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                value={approverId}
                onChange={(event) => setApproverId(event.target.value)}
                options={approverOptions}
                placeholder="Choose the approver…"
              />
            )}
          </Field>
        )}
        <AuthorizationNote>{authority.requirement}</AuthorizationNote>
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
            variant="danger"
            disabled={!canConfirm}
            onClick={async () => {
              setError(null)
              const done = await runAction('Sale reversed', async () => {
                await controller.reverseSale({
                  saleId,
                  reason,
                  approval: authority.requiresApproval
                    ? {
                        approverId: approverId,
                        approverRole:
                          approverCandidates.find(
                            (candidate) => candidate.id === approverId,
                          )?.role ?? 'owner',
                      }
                    : undefined,
                })
                return `${saleId} is reversed. The original sale remains in history with this reversal and its compensating effects. Resulting reporting change: ${formatSignedKobo(-sale.sale.totalDueKobo)} revenue.`
              })
              if (done) onClose()
              else
                setError('The reversal was not applied. The sale is unchanged.')
            }}
          >
            Reverse sale
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
