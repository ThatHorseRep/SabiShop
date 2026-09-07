import { useState } from 'react'
import type { CreditStatus } from '../domain/customersCredit'
import { Button, Dialog, Field as UiField, Select } from '../ui'
import type { CustomerSummaryView, DebtView } from './customersController'
import {
  creditStatusView,
  formatDebt,
  parseNairaToMinor,
} from './customersFormat'
import { Field, StatusChip } from './CustomersShared'

/** Naira entry with a properly associated label and explicit ₦ context. */
function NairaField({
  label,
  help,
  error,
  value,
  onChange,
}: {
  label: string
  help?: string
  error?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <UiField label={label} hint={help} error={error}>
      {({ id, describedBy, invalid }) => (
        <div className="ui-input-group">
          <span className="ui-input-group__addon" aria-hidden="true">
            ₦
          </span>
          <input
            id={id}
            className="ui-input"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            inputMode="decimal"
            autoComplete="off"
          />
        </div>
      )}
    </UiField>
  )
}

const statusOptions: ReadonlyArray<{
  value: CreditStatus
  label: string
}> = [
  { value: 'allowed', label: 'Credit allowed' },
  { value: 'restricted', label: 'Credit restricted' },
  { value: 'blocked', label: 'Credit blocked' },
]

/**
 * Management control for credit status. The confirmation explains what the
 * change means for future credit sales (C08 sections 9-12, 73).
 */
export function CreditStatusDialog({
  open,
  onClose,
  customer,
  busy,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  customer: CustomerSummaryView
  busy: boolean
  onSubmit: (input: { creditStatus: CreditStatus; reason?: string }) => void
}) {
  const [status, setStatus] = useState<CreditStatus>(
    customer.customer.creditStatus,
  )
  const [reason, setReason] = useState('')
  const current = creditStatusView(customer.customer.creditStatus)
  const next = creditStatusView(status)

  return (
    <Dialog open={open} onClose={onClose} title="Change credit status">
      <div className="customers-dialog-body">
        <div className="customers-identity-strip">
          <strong>{customer.customer.name}</strong>
          <span className="ui-text-body-sm">{customer.customer.phone}</span>
          <StatusChip tone={current.tone} label={current.label} />
        </div>
        <Field
          label="New credit status"
          help="Use the exact business concepts. They are not “good” or “bad” customer labels."
        >
          <Select
            className="customers-select"
            value={status}
            onChange={(event) => setStatus(event.target.value as CreditStatus)}
            options={statusOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </Field>
        <p className="ui-text-body-sm ui-text-secondary">{next.description}</p>
        <Field
          label="Reason (optional)"
          help="Recorded with the customer’s credit history when provided."
        >
          <textarea
            className="customers-textarea"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <div className="ui-confirmation">
          <p className="ui-text-body">
            Change {customer.customer.name}’s credit status.
          </p>
          <ul className="ui-confirmation__effects">
            <li>
              Credit status will change from {current.label} to {next.label}.
            </li>
            <li>
              {status === 'allowed'
                ? 'Future credit sales still require the required authorization and limit checks.'
                : status === 'restricted'
                  ? 'Future credit use will require management handling; a salesperson cannot decide it themselves.'
                  : 'This customer will not be able to complete an ordinary credit sale.'}
            </li>
            <li>
              Existing debts, repayments, and history are not changed by this
              action.
            </li>
          </ul>
          <div className="ui-confirmation__actions">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                onSubmit({
                  creditStatus: status,
                  ...(reason.trim() ? { reason: reason.trim() } : {}),
                })
              }
              loading={busy}
              disabled={status === customer.customer.creditStatus}
            >
              Change credit status
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/**
 * Management control for the per-customer credit limit. The limit is a
 * control, not an accounting fact, and never bypasses authorization
 * (C08 sections 13, 73).
 */
export function CreditLimitDialog({
  open,
  onClose,
  customer,
  busy,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  customer: CustomerSummaryView
  busy: boolean
  onSubmit: (input: { creditLimitMinor?: bigint; reason?: string }) => void
}) {
  const [limitText, setLimitText] = useState(
    customer.customer.creditLimitMinor !== undefined
      ? (customer.customer.creditLimitMinor / 100n).toString()
      : '',
  )
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const newLimit = parseNairaToMinor(limitText)
  const currentLimit = customer.customer.creditLimitMinor
  const outstanding = customer.outstandingMinor

  const submit = () => {
    if (newLimit === null) {
      setError('Enter the new credit limit in naira, for example 100,000.')
      return
    }
    if (newLimit < 0n) {
      setError('A credit limit must not be negative.')
      return
    }
    setError(null)
    onSubmit({
      creditLimitMinor: newLimit,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Change credit limit">
      <div className="customers-dialog-body">
        <div className="customers-identity-strip">
          <strong>{customer.customer.name}</strong>
          <span className="ui-text-body-sm">
            Current outstanding debt {formatDebt(outstanding)}
          </span>
        </div>
        <NairaField
          label="New credit limit"
          error={error ?? undefined}
          help={
            currentLimit === undefined
              ? 'No limit is configured yet. Cancel to keep it that way; the limit is a management control and never authorizes a sale by itself.'
              : 'The limit is a management control. It does not by itself authorize any credit sale.'
          }
          value={limitText}
          onChange={(value) => {
            setLimitText(value)
            setError(null)
          }}
        />
        <Field
          label="Reason (optional)"
          help="Recorded with the customer’s credit history when provided."
        >
          <textarea
            className="customers-textarea"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <div className="ui-confirmation">
          <p className="ui-text-body">
            Change {customer.customer.name}’s credit limit.
          </p>
          <ul className="ui-confirmation__effects">
            <li>
              Credit limit will change from{' '}
              {currentLimit !== undefined
                ? formatDebt(currentLimit)
                : 'no limit configured'}{' '}
              to {newLimit !== null ? formatDebt(newLimit) : '—'}.
            </li>
            {newLimit !== null && (
              <li>
                {newLimit >= outstanding
                  ? `Available credit will become ${formatDebt(newLimit - outstanding)} against current outstanding debt.`
                  : `Current outstanding debt already exceeds this limit by ${formatDebt(outstanding - newLimit)}, so any new credit sale will require an over-limit exception.`}
              </li>
            )}
            <li>
              A sale that exceeds the limit still requires a separate
              management-authorized exception.
            </li>
          </ul>
          <div className="ui-confirmation__actions">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} loading={busy}>
              Change credit limit
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/**
 * Write-off and approved-return recording share a deliberate amount + reason
 * surface, but their business meaning and consequence copy stay distinct
 * (C08 sections 30-36, 82, 84).
 */
export function DebtReductionDialog({
  open,
  onClose,
  debtView,
  kind,
  busy,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  debtView: DebtView
  kind: 'return' | 'write_off'
  busy: boolean
  onSubmit: (input: { amountMinor: bigint; reason: string }) => void
}) {
  const [amountText, setAmountText] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const outstanding = debtView.debt.outstandingMinor
  const amount = parseNairaToMinor(amountText)
  const isReturn = kind === 'return'
  const valid = amount !== null && amount > 0n && amount <= outstanding

  const submit = () => {
    if (amount === null || amount <= 0n) {
      setError('Enter a positive amount in naira.')
      return
    }
    if (amount > outstanding) {
      setError(
        `The amount cannot exceed the remaining obligation ${formatDebt(outstanding)}.`,
      )
      return
    }
    if (!reason.trim()) {
      setError(
        isReturn
          ? 'A return reason is required.'
          : 'A write-off reason is required.',
      )
      return
    }
    setError(null)
    onSubmit({ amountMinor: amount, reason: reason.trim() })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        isReturn ? 'Record approved return on credit sale' : 'Record write-off'
      }
    >
      <div className="customers-dialog-body">
        <div className="customers-identity-strip">
          <span className="customers-mono">{debtView.debt.id}</span>
          <span className="ui-text-body-sm">Sale {debtView.debt.saleId}</span>
          <span className="ui-text-body-sm">
            Remaining obligation {formatDebt(outstanding)}
          </span>
        </div>
        <NairaField
          label="Amount"
          error={error ?? undefined}
          value={amountText}
          onChange={(value) => {
            setAmountText(value)
            setError(null)
          }}
        />
        <Field
          label={
            isReturn
              ? 'Return reason (required)'
              : 'Write-off reason (required)'
          }
          help="The reason is recorded with the debt history."
        >
          <textarea
            className="customers-textarea"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              setError(null)
            }}
          />
        </Field>
        <div className="ui-confirmation">
          <p className="ui-text-body">
            {isReturn
              ? 'Record an approved return against this credit sale.'
              : 'Record an authorized write-off against this debt.'}
          </p>
          <ul className="ui-confirmation__effects">
            {isReturn ? (
              <>
                <li>
                  The original sale {debtView.debt.saleId} remains{' '}
                  {formatDebt(debtView.debt.originalAmountMinor)} in history.
                </li>
                <li>
                  This approved return will reduce the resulting obligation from{' '}
                  {formatDebt(outstanding)} to{' '}
                  {valid ? formatDebt(outstanding - amount!) : '—'}.
                </li>
                <li>
                  Repayments already received are not rewritten or refunded by
                  this action.
                </li>
              </>
            ) : (
              <>
                <li>
                  This write-off will reduce the collectible outstanding amount
                  by {valid ? formatDebt(amount!) : '—'}, from{' '}
                  {formatDebt(outstanding)} to{' '}
                  {valid ? formatDebt(outstanding - amount!) : '—'}.
                </li>
                <li>
                  A written-off debt remains historically visible and stays
                  distinguishable from Paid.
                </li>
                <li>A write-off is an authorized adjustment, not a payment.</li>
              </>
            )}
          </ul>
          <div className="ui-confirmation__actions">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={isReturn ? 'primary' : 'danger'}
              onClick={submit}
              loading={busy}
              disabled={!valid || !reason.trim()}
            >
              {isReturn ? 'Record approved return' : 'Record write-off'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/**
 * Authorized credit-sale correction. The original state, the correction, and
 * the resulting obligation are all visible before commitment (C08 sections
 * 37, 39, 40).
 */
export function CorrectionDialog({
  open,
  onClose,
  debtView,
  busy,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  debtView: DebtView
  busy: boolean
  onSubmit: (input: { correctedAmountMinor: bigint; reason: string }) => void
}) {
  const [amountText, setAmountText] = useState(
    debtView.debt.originalAmountMinor +
      debtView.correctionIncreaseMinor -
      debtView.correctionReductionMinor >
      0n
      ? (
          (debtView.debt.originalAmountMinor +
            debtView.correctionIncreaseMinor -
            debtView.correctionReductionMinor) /
          100n
        ).toString()
      : '',
  )
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const currentObligation =
    debtView.debt.originalAmountMinor +
    debtView.correctionIncreaseMinor -
    debtView.correctionReductionMinor
  const corrected = parseNairaToMinor(amountText)
  const alreadyReduced =
    debtView.repaidMinor + debtView.returnedMinor + debtView.writtenOffMinor
  const hasDependentEvents =
    debtView.repaidMinor > 0n ||
    debtView.returnedMinor > 0n ||
    debtView.writtenOffMinor > 0n
  const valid =
    corrected !== null && corrected >= alreadyReduced && reason.trim() !== ''

  const submit = () => {
    if (corrected === null) {
      setError('Enter the corrected total obligation in naira.')
      return
    }
    if (corrected < alreadyReduced) {
      setError(
        `The corrected obligation cannot be reduced below the ${formatDebt(alreadyReduced)} already repaid, returned, or written off.`,
      )
      return
    }
    if (!reason.trim()) {
      setError('A correction reason is required.')
      return
    }
    setError(null)
    onSubmit({ correctedAmountMinor: corrected, reason: reason.trim() })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Correct credit sale">
      <div className="customers-dialog-body">
        <div className="customers-identity-strip">
          <span className="customers-mono">{debtView.debt.id}</span>
          <span className="ui-text-body-sm">Sale {debtView.debt.saleId}</span>
        </div>
        {hasDependentEvents && (
          <div className="customers-state-message warning">
            <h3>Partially settled debt</h3>
            <p>
              This debt already has {formatDebt(alreadyReduced)} of repayments,
              approved returns, or write-offs. Review them before correcting;
              the corrected obligation cannot be reduced below what has already
              been settled.
            </p>
          </div>
        )}
        <NairaField
          label="Corrected total obligation"
          error={error ?? undefined}
          help="What the customer should owe for this sale after the correction."
          value={amountText}
          onChange={(value) => {
            setAmountText(value)
            setError(null)
          }}
        />
        <Field
          label="Correction reason (required)"
          help="Recorded with the correction history."
        >
          <textarea
            className="customers-textarea"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              setError(null)
            }}
          />
        </Field>
        <div className="ui-confirmation">
          <p className="ui-text-body">Apply this authorized correction.</p>
          <ul className="ui-confirmation__effects">
            <li>
              {`Original obligation ${formatDebt(
                debtView.debt.originalAmountMinor,
              )} → correction ${
                corrected !== null && corrected !== currentObligation
                  ? formatDebt(corrected - currentObligation)
                  : 'no change'
              } → corrected obligation ${
                corrected !== null ? formatDebt(corrected) : '—'
              }.`}
            </li>
            <li>
              Resulting outstanding debt will become{' '}
              {corrected !== null
                ? formatDebt(corrected - alreadyReduced)
                : '—'}
              .
            </li>
            <li>
              The original sale, every repayment, and the full history remain
              recoverable. A correction never looks like deletion.
            </li>
          </ul>
          <div className="ui-confirmation__actions">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} loading={busy} disabled={!valid}>
              Apply correction
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/**
 * Dispute recording. A dispute keeps the debt visible and does not change it
 * (C08 sections 33, 83).
 */
export function DisputeDialog({
  open,
  onClose,
  debtView,
  busy,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  debtView: DebtView
  busy: boolean
  onSubmit: (input: { reason: string }) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!reason.trim()) {
      setError('Describe what the customer is disputing.')
      return
    }
    setError(null)
    onSubmit({ reason: reason.trim() })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Record debt dispute">
      <div className="customers-dialog-body">
        <div className="customers-identity-strip">
          <span className="customers-mono">{debtView.debt.id}</span>
          <span className="ui-text-body-sm">
            Remaining obligation {formatDebt(debtView.debt.outstandingMinor)}
          </span>
        </div>
        <Field label="What is being disputed?" error={error ?? undefined}>
          <textarea
            className="customers-textarea"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              setError(null)
            }}
          />
        </Field>
        <div className="ui-confirmation">
          <p className="ui-text-body">Record this dispute.</p>
          <ul className="ui-confirmation__effects">
            <li>
              The debt remains visible and outstanding while it is investigated.
            </li>
            <li>
              Recording a dispute does not change the debt, any repayment, or
              any history.
            </li>
            <li>
              A dispute does not imply fraud or dishonesty; it starts an
              investigation.
            </li>
          </ul>
          <div className="ui-confirmation__actions">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} loading={busy} disabled={!reason.trim()}>
              Record dispute
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/** Management dispute resolution with a documented outcome (C08 section 34). */
export function DisputeResolutionDialog({
  open,
  onClose,
  debtView,
  busy,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  debtView: DebtView
  busy: boolean
  onSubmit: (input: { resolution: string }) => void
}) {
  const [resolution, setResolution] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!resolution.trim()) {
      setError('Record the outcome of the investigation.')
      return
    }
    setError(null)
    onSubmit({ resolution: resolution.trim() })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Resolve debt dispute">
      <div className="customers-dialog-body">
        <div className="customers-identity-strip">
          <span className="customers-mono">{debtView.debt.id}</span>
          <span className="ui-text-body-sm">
            Dispute: {debtView.debt.disputeReason}
          </span>
        </div>
        <Field label="Investigation outcome" error={error ?? undefined}>
          <textarea
            className="customers-textarea"
            value={resolution}
            onChange={(event) => {
              setResolution(event.target.value)
              setError(null)
            }}
          />
        </Field>
        <div className="ui-confirmation">
          <p className="ui-text-body">Resolve this dispute.</p>
          <ul className="ui-confirmation__effects">
            <li>
              The investigation history and outcome remain part of the debt
              record.
            </li>
            <li>
              Resolving the dispute does not by itself change the debt. Apply
              the appropriate correction, write-off, return, or repayment
              separately if the outcome requires it.
            </li>
          </ul>
          <div className="ui-confirmation__actions">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              loading={busy}
              disabled={!resolution.trim()}
            >
              Resolve dispute
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/**
 * Credit-sale reversal: a controlled correction that removes the remaining
 * obligation while preserving the original sale and any repayments received
 * (B08 section 4; domain handoff 10).
 */
export function ReversalDialog({
  open,
  onClose,
  debtView,
  busy,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  debtView: DebtView
  busy: boolean
  onSubmit: (input: { reason: string }) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!reason.trim()) {
      setError('A reversal reason is required.')
      return
    }
    setError(null)
    onSubmit({ reason: reason.trim() })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Reverse credit sale">
      <div className="customers-dialog-body">
        <div className="customers-identity-strip">
          <span className="customers-mono">{debtView.debt.id}</span>
          <span className="ui-text-body-sm">Sale {debtView.debt.saleId}</span>
          <span className="ui-text-body-sm">
            Remaining obligation {formatDebt(debtView.debt.outstandingMinor)}
          </span>
        </div>
        <Field label="Reversal reason (required)" error={error ?? undefined}>
          <textarea
            className="customers-textarea"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              setError(null)
            }}
          />
        </Field>
        <div className="ui-confirmation">
          <p className="ui-text-body">Reverse this credit sale.</p>
          <ul className="ui-confirmation__effects">
            <li>
              This reversal records the remaining obligation{' '}
              {formatDebt(debtView.debt.outstandingMinor)} as reversed.
            </li>
            {debtView.repaidMinor > 0n && (
              <li>
                {formatDebt(debtView.repaidMinor)} already repaid remains in
                history and is not erased.
              </li>
            )}
            <li>
              The original sale remains visible; the debt ends in the
              distinguishable Reversed state.
            </li>
          </ul>
          <div className="ui-confirmation__actions">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={submit}
              loading={busy}
              disabled={!reason.trim()}
            >
              Reverse credit sale
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
