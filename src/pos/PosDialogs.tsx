import { useEffect, useMemo, useState } from 'react'
import { UserPlus } from '@phosphor-icons/react'
import type { SaleLinePricingPreview } from '../domain/catalogPricing'
import type { Customer } from '../domain/customersCredit'
import { Alert } from '../ui/Feedback'
import { Button } from '../ui/Button'
import {
  CurrencyInput,
  Field,
  Radio,
  SearchInput,
  Select,
  TextInput,
  Textarea,
} from '../ui/inputs'
import { Dialog } from '../ui/Overlays'
import { Status } from '../ui/Status'
import { Money } from '../ui/Money'
import { formatKobo } from '../ui/format'
import type { DraftDiscount, DraftLine, PendingApproval } from './posTypes'
import { roleLabel, type ManagementActor } from './posSession'
import type { CustomerCreditSnapshot } from './posController'
import { parseNairaToKobo } from './posFormat'

function creditStatusLabel(status: Customer['creditStatus']): {
  tone: 'success' | 'warning' | 'danger'
  label: string
} {
  switch (status) {
    case 'allowed':
      return { tone: 'success', label: 'Credit allowed' }
    case 'restricted':
      return { tone: 'warning', label: 'Credit restricted' }
    default:
      return { tone: 'danger', label: 'Credit blocked' }
  }
}

/**
 * Focused customer lookup for the current sale (C06 sections 22-23). It is
 * not a CRM: search, select, and the minimum identity needed to sell on
 * credit.
 */
export function CustomerPickerDialog({
  open,
  onClose,
  search,
  onSelect,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  search: (query: string) => CustomerCreditSnapshot[]
  onSelect: (customer: CustomerCreditSnapshot) => void
  onCreate: (input: { name: string; phone: string }) => {
    customer?: Customer
    error?: string
  }
}) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [createError, setCreateError] = useState<string | undefined>()

  useEffect(() => {
    if (!open) {
      setQuery('')
      setCreating(false)
      setName('')
      setPhone('')
      setCreateError(undefined)
    }
  }, [open])

  const results = useMemo(
    () => (open ? search(query) : []),
    [open, query, search],
  )

  const submitCreate = () => {
    const result = onCreate({ name, phone })
    if (result.error) {
      setCreateError(result.error)
      return
    }
    setCreating(false)
  }

  return (
    <Dialog open={open} onClose={onClose} title="Select customer">
      {!creating ? (
        <>
          <SearchInput
            aria-label="Search customers by name or phone"
            placeholder="Search name or phone"
            value={query}
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
          />
          {results.length === 0 ? (
            <p className="ui-text-body-sm ui-text-secondary">
              No customers match this search. Create a customer record if this
              sale needs one.
            </p>
          ) : (
            <ul className="pos-customer-results">
              {results.map(({ customer, outstandingKobo, creditLimitKobo }) => {
                const status = creditStatusLabel(customer.creditStatus)
                return (
                  <li key={customer.id}>
                    <button
                      type="button"
                      className="pos-customer-result"
                      onClick={() =>
                        onSelect({ customer, outstandingKobo, creditLimitKobo })
                      }
                    >
                      <span className="pos-customer-result__identity">
                        <span className="pos-customer-result__name">
                          {customer.name}
                        </span>
                        <span className="ui-text-caption">
                          {customer.phone}
                        </span>
                      </span>
                      <span className="pos-customer-result__credit">
                        <Status tone={status.tone} label={status.label} />
                        {outstandingKobo > 0 && (
                          <span className="ui-text-caption">
                            Outstanding <Money amountKobo={outstandingKobo} />
                            {creditLimitKobo !== undefined && (
                              <> of {formatKobo(creditLimitKobo)} limit</>
                            )}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <Button
            variant="secondary"
            iconStart={<UserPlus size={16} aria-hidden="true" />}
            onClick={() => setCreating(true)}
          >
            Create customer
          </Button>
        </>
      ) : (
        <>
          <p className="ui-text-body-sm ui-text-secondary">
            A new customer needs a name and phone number. New records start with
            a zero credit limit, so a first credit sale always requires a
            management exception.
          </p>
          <Field
            label="Customer name"
            error={
              createError && !name.trim() ? 'A name is required.' : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            )}
          </Field>
          <Field label="Phone number">
            {({ id }) => (
              <TextInput
                id={id}
                value={phone}
                inputMode="tel"
                onChange={(event) => setPhone(event.target.value)}
              />
            )}
          </Field>
          {createError && (
            <Alert tone="danger" title="Customer not created">
              {createError}
            </Alert>
          )}
          <div className="pos-dialog-actions">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Back to search
            </Button>
            <Button onClick={submitCreate}>Create customer</Button>
          </div>
        </>
      )}
    </Dialog>
  )
}

/**
 * Line price and discount editor (C06 sections 15-21). Shows the current
 * price, the floor, and the resulting pricing before any change is saved;
 * below-floor and free configurations surface their exception state here.
 */
export function LinePricingDialog({
  open,
  onClose,
  line,
  quantity,
  currentPriceKobo,
  preview,
  onSave,
}: {
  open: boolean
  onClose: () => void
  line: DraftLine | null
  quantity: number
  currentPriceKobo: number
  preview: (
    unitPriceKobo: number | undefined,
    discount: DraftDiscount | undefined,
  ) => SaleLinePricingPreview
  onSave: (changes: {
    unitPriceKobo?: number
    discount?: DraftDiscount
  }) => void
}) {
  const [priceText, setPriceText] = useState('')
  const [discountKind, setDiscountKind] = useState<
    'none' | 'percentage' | 'fixed'
  >('none')
  const [discountValue, setDiscountValue] = useState('')
  const [discountReason, setDiscountReason] = useState('')

  useEffect(() => {
    if (open && line) {
      setPriceText(
        line.unitPriceKobo !== undefined
          ? (line.unitPriceKobo / 100).toString()
          : (currentPriceKobo / 100).toString(),
      )
      setDiscountKind(line.discount?.kind ?? 'none')
      setDiscountValue(line.discount ? line.discount.value.toString() : '')
      setDiscountReason(line.discount?.reason ?? '')
    }
  }, [open, line, currentPriceKobo])

  if (!line) return null

  const enteredKobo = parseNairaToKobo(priceText)
  const discountNumber = Number(discountValue)
  const discount: DraftDiscount | undefined =
    discountKind !== 'none' &&
    discountValue.trim() !== '' &&
    Number.isFinite(discountNumber) &&
    discountNumber > 0
      ? {
          kind: discountKind,
          value: discountNumber,
          reason: discountReason.trim() || undefined,
        }
      : undefined

  let linePreview: SaleLinePricingPreview | undefined
  let previewError: string | undefined
  try {
    linePreview = preview(enteredKobo ?? undefined, discount)
  } catch (error) {
    previewError =
      error instanceof Error ? error.message : 'This pricing is not valid.'
  }

  const priceInvalid = priceText.trim() !== '' && enteredKobo === null
  const saveDisabled =
    priceInvalid ||
    !linePreview ||
    previewError !== undefined ||
    (discountKind !== 'none' && discount?.value === undefined)

  return (
    <Dialog open={open} onClose={onClose} title={`Price — ${line.productName}`}>
      <div className="pos-pricing-facts">
        <span className="ui-text-caption">
          Current price <Money amountKobo={currentPriceKobo} />
        </span>
        <span className="ui-text-caption">
          Price floor{' '}
          <Money amountKobo={linePreview?.effectiveFloorKobo ?? 0} />
        </span>
      </div>
      <Field
        label="Unit price"
        hint="The price actually charged for this line."
        error={priceInvalid ? 'Enter a valid naira amount.' : undefined}
      >
        {({ id, describedBy, invalid }) => (
          <CurrencyInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            value={priceText}
            autoFocus
            onChange={(event) => setPriceText(event.target.value)}
          />
        )}
      </Field>
      <fieldset className="pos-discount-fieldset">
        <legend className="ui-field__label">Discount</legend>
        <div className="pos-discount-kind">
          <Radio
            name={`discount-kind-${line.lineId}`}
            label="No discount"
            checked={discountKind === 'none'}
            onChange={() => setDiscountKind('none')}
          />
          <Radio
            name={`discount-kind-${line.lineId}`}
            label="Percentage %"
            checked={discountKind === 'percentage'}
            onChange={() => setDiscountKind('percentage')}
          />
          <Radio
            name={`discount-kind-${line.lineId}`}
            label="Fixed ₦"
            checked={discountKind === 'fixed'}
            onChange={() => setDiscountKind('fixed')}
          />
        </div>
        {discountKind !== 'none' && (
          <div className="pos-discount-inputs">
            <Field
              label={discountKind === 'percentage' ? 'Percent' : 'Amount (₦)'}
            >
              {({ id }) => (
                <TextInput
                  id={id}
                  value={discountValue}
                  inputMode="decimal"
                  onChange={(event) => setDiscountValue(event.target.value)}
                />
              )}
            </Field>
            <Field label="Reason">
              {({ id }) => (
                <TextInput
                  id={id}
                  value={discountReason}
                  placeholder="Why this discount was given"
                  onChange={(event) => setDiscountReason(event.target.value)}
                />
              )}
            </Field>
          </div>
        )}
      </fieldset>
      {linePreview && !previewError && (
        <div className="pos-pricing-preview">
          <span>
            Unit price after discount{' '}
            <Money amountKobo={linePreview.actualUnitPriceKobo} />
          </span>
          <span>
            Line total (qty {quantity}){' '}
            <Money amountKobo={linePreview.actualUnitPriceKobo * quantity} />
          </span>
        </div>
      )}
      {previewError && (
        <Alert tone="danger" title="Pricing not valid">
          {previewError}
        </Alert>
      )}
      {linePreview?.freeSale && !previewError && (
        <Alert tone="warning" title="Free sale">
          This makes the line ₦0. A free sale requires Manager or Owner approval
          before the sale can complete.
        </Alert>
      )}
      {linePreview?.belowFloor && !linePreview.freeSale && !previewError && (
        <Alert tone="warning" title="Below the price floor">
          This price is below the configured floor (
          {formatKobo(linePreview.effectiveFloorKobo)}). Completing the sale
          requires Manager or Owner authorization and the line will be flagged
          for review.
        </Alert>
      )}
      <div className="pos-dialog-actions">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={saveDisabled}
          onClick={() =>
            onSave({
              unitPriceKobo: enteredKobo ?? undefined,
              discount,
            })
          }
        >
          Save price
        </Button>
      </div>
    </Dialog>
  )
}

/**
 * Contextual management approval for consequential POS actions (C06
 * sections 17, 19, 25-26, 65-66; C03 section 29). Shows the action, its
 * effects, the amount, and requires a separate approver plus a reason where
 * the business rules demand one.
 */
export function ApprovalDialog({
  approval,
  candidates,
  online,
  reasonRequired,
  onApprove,
  onDecline,
  onCancel,
}: {
  approval: PendingApproval
  candidates: readonly ManagementActor[]
  online: boolean
  reasonRequired: boolean
  onApprove: (resolution: {
    approver: ManagementActor
    secondApprover?: ManagementActor
    reason: string
  }) => void
  onDecline: () => void
  onCancel: () => void
}) {
  const [approverId, setApproverId] = useState('')
  const [secondApproverId, setSecondApproverId] = useState('')
  const [reason, setReason] = useState('')
  const [reasonMissing, setReasonMissing] = useState(false)

  useEffect(() => {
    setApproverId(candidates[0]?.id ?? '')
    setSecondApproverId(candidates[0]?.id ?? '')
  }, [approval, candidates])

  const approver = candidates.find((actor) => actor.id === approverId)
  const secondApprover = candidates.find(
    (actor) => actor.id === secondApproverId,
  )
  const missingApprover = candidates.length === 0
  const reasonProblem = reasonRequired && !reason.trim()

  const approve = () => {
    if (!approver) return
    if (reasonProblem) {
      setReasonMissing(true)
      return
    }
    onApprove({
      approver,
      secondApprover:
        approval.requiresSecondApprover && secondApprover
          ? secondApprover
          : undefined,
      reason: reason.trim(),
    })
  }

  return (
    <Dialog open onClose={onCancel} title={approval.title} dismissable={false}>
      <p className="ui-text-body">{approval.action}</p>
      {approval.amountKobo !== undefined && (
        <p className="pos-approval-amount">
          <Money amountKobo={approval.amountKobo} />
        </p>
      )}
      <ul className="ui-confirmation__effects">
        {approval.effects.map((effect) => (
          <li key={effect}>{effect}</li>
        ))}
      </ul>
      {missingApprover ? (
        <Alert tone="warning" title="No separate approver available">
          Approval requires a Manager or Owner who is not the current user. This
          action stays blocked until one is available.
        </Alert>
      ) : (
        <>
          <Field
            label="Authorized by"
            hint="The Manager or Owner approving this action."
          >
            {({ id }) => (
              <Select
                id={id}
                value={approverId}
                onChange={(event) => setApproverId(event.target.value)}
                options={candidates.map((actor) => ({
                  value: actor.id,
                  label: `${actor.displayName} · ${roleLabel(actor.role)}`,
                }))}
              />
            )}
          </Field>
          {approval.requiresSecondApprover && (
            <Field
              label="Over-limit exception by"
              hint="A separate management exception for exceeding the credit limit."
            >
              {({ id }) => (
                <Select
                  id={id}
                  value={secondApproverId}
                  onChange={(event) => setSecondApproverId(event.target.value)}
                  options={candidates.map((actor) => ({
                    value: actor.id,
                    label: `${actor.displayName} · ${roleLabel(actor.role)}`,
                  }))}
                />
              )}
            </Field>
          )}
          <Field
            label="Reason"
            hint={
              reasonRequired
                ? 'Recorded with the approval history.'
                : 'Optional context for the approval record.'
            }
            error={
              reasonMissing && reasonProblem
                ? 'A reason is required.'
                : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                  setReasonMissing(false)
                }}
              />
            )}
          </Field>
          {!online && (
            <Alert tone="offline" title="Approval recorded offline">
              This approval is recorded on this device and will be revalidated
              when the sale synchronizes.
            </Alert>
          )}
        </>
      )}
      <div className="pos-dialog-actions">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={onDecline}
          disabled={missingApprover}
        >
          Decline
        </Button>
        <Button onClick={approve} disabled={missingApprover}>
          Approve
        </Button>
      </div>
    </Dialog>
  )
}

/**
 * Leaving an unfinished sale is deliberate (C06 section 47). An unfinished
 * basket is not a business record, so discarding it applies no business
 * effect — but the work is protected from accidental loss.
 */
export function AbandonSaleDialog({
  open,
  itemCount,
  totalKobo,
  onContinue,
  onDiscard,
}: {
  open: boolean
  itemCount: number
  totalKobo: number
  onContinue: () => void
  onDiscard: () => void
}) {
  return (
    <Dialog open={open} onClose={onContinue} title="Leave the unfinished sale?">
      <p className="ui-text-body">
        This sale has {itemCount} item{itemCount === 1 ? '' : 's'} totalling{' '}
        <Money amountKobo={totalKobo} /> and has not been completed.
      </p>
      <Alert tone="info" title="An unfinished sale is not recorded">
        Discarding the basket applies no business effect. Nothing will be
        recorded as sold, paid, or owed.
      </Alert>
      <div className="pos-dialog-actions">
        <Button onClick={onContinue}>Continue sale</Button>
        <Button variant="danger" onClick={onDiscard}>
          Discard basket
        </Button>
      </div>
    </Dialog>
  )
}
