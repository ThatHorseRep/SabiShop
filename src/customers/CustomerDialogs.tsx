import { useMemo, useState } from 'react'
import type {
  RepaymentAllocation,
  RepaymentComponent,
} from '../domain/customersCredit'
import {
  Button,
  Checkbox,
  Dialog,
  Field as UiField,
  Select,
  TextInput,
} from '../ui'
import { roleLabel, type ManagementActor } from '../pos/posSession'
import type { CustomerSummaryView, DebtView } from './customersController'
import {
  creditStatusView,
  formatDebt,
  formatDate,
  minorToNairaText,
  parseNairaToMinor,
  repaymentMethodLabel,
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

const methodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'pos_card', label: 'POS / Card' },
]

type RepaymentComponentDraft = {
  method: 'cash' | 'bank_transfer' | 'pos_card'
  amountText: string
  confirmed: boolean
  reference: string
}

/**
 * Customer creation keeps the authoritative minimum identity: name and
 * phone. No additional customer fields are invented (C08 sections 4, 99).
 */
export function CreateCustomerDialog({
  open,
  onClose,
  onSubmit,
  busy,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: { name: string; phone: string }) => void
  busy: boolean
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!name.trim() || !phone.trim()) {
      setError('A customer record needs both a name and a phone number.')
      return
    }
    setError(null)
    onSubmit({ name: name.trim(), phone: phone.trim() })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add customer">
      <div className="customers-dialog-body">
        <p className="ui-text-body-sm ui-text-secondary">
          The credit record needs a name and a phone number. Creating a customer
          does not authorize credit; the first credit sale still requires
          management approval.
        </p>
        <Field label="Customer name" error={error ?? undefined}>
          <TextInput
            className="customers-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label="Phone number">
          <TextInput
            className="customers-input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            autoComplete="off"
          />
        </Field>
        <div className="customers-actions">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            Add customer
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

/**
 * Deliberate credit-sale recording over the credit ledger. The customer's
 * identity, credit status, limit comparison, and projected outstanding debt
 * are all visible before commitment (C08 sections 5, 14, 15, 73).
 */
export function CreditSaleDialog({
  open,
  onClose,
  customer,
  approvalCandidates,
  busy,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  customer: CustomerSummaryView
  approvalCandidates: readonly ManagementActor[]
  busy: boolean
  onSubmit: (input: {
    amountMinor: bigint
    dueDate?: string
    approval: { approverId: string; approverRole: 'manager' | 'owner' }
    overLimitApproval?: {
      approverId: string
      approverRole: 'manager' | 'owner'
    }
  }) => void
}) {
  const [amountText, setAmountText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [approverId, setApproverId] = useState('')
  const [overLimitApproverId, setOverLimitApproverId] = useState('')
  const [amountError, setAmountError] = useState<string | null>(null)

  const status = creditStatusView(customer.customer.creditStatus)
  const amountMinor = parseNairaToMinor(amountText)
  const limitMinor = customer.customer.creditLimitMinor
  const currentOutstanding = customer.outstandingMinor
  const projected =
    amountMinor !== null ? currentOutstanding + amountMinor : null
  const overLimit =
    limitMinor !== undefined && projected !== null && projected > limitMinor
  const limitDifference =
    overLimit && projected !== null ? projected - limitMinor : null
  const availableCredit =
    limitMinor !== undefined ? limitMinor - currentOutstanding : null
  const approver = approvalCandidates.find(
    (candidate) => candidate.id === approverId,
  )
  const overLimitApprover = approvalCandidates.find(
    (candidate) => candidate.id === overLimitApproverId,
  )
  const blocked = customer.customer.creditStatus === 'blocked'
  const restricted = customer.customer.creditStatus === 'restricted'
  const amountValid = amountMinor !== null && amountMinor > 0n
  const canSubmit =
    !blocked &&
    !restricted &&
    amountValid &&
    approver !== undefined &&
    (!overLimit || overLimitApprover !== undefined)

  const submit = () => {
    if (!amountValid) {
      setAmountError('Enter the credit amount in naira, for example 12,500.')
      return
    }
    if (!approver) return
    setAmountError(null)
    const confirmedAmount = amountMinor
    if (confirmedAmount === null) return
    onSubmit({
      amountMinor: confirmedAmount,
      dueDate: dueDate
        ? new Date(`${dueDate}T00:00:00`).toISOString()
        : undefined,
      approval: { approverId: approver.id, approverRole: approver.role },
      overLimitApproval:
        overLimit && overLimitApprover
          ? {
              approverId: overLimitApprover.id,
              approverRole: overLimitApprover.role,
            }
          : undefined,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Record credit sale">
      <div className="customers-dialog-body">
        <div className="customers-identity-strip">
          <strong>{customer.customer.name}</strong>
          <span className="ui-text-body-sm">{customer.customer.phone}</span>
          <StatusChip tone={status.tone} label={status.label} />
        </div>

        {blocked && (
          <>
            <div className="customers-state-message danger" role="alert">
              <h3>Credit is blocked</h3>
              <p>
                {customer.customer.name} cannot complete an ordinary credit
                sale. Nothing can be recorded here. Management controls this
                status; use another payment method or ask management to review
                the customer.
              </p>
            </div>
            <div className="customers-actions customers-actions--end">
              <Button variant="ghost" onClick={onClose} disabled={busy}>
                Close
              </Button>
            </div>
          </>
        )}

        {restricted && (
          <>
            <div className="customers-state-message warning" role="alert">
              <h3>Credit is restricted</h3>
              <p>
                Credit use for {customer.customer.name} requires additional
                management handling. A salesperson must not decide this
                themselves. Ask a manager or the owner to handle this sale
                according to the configured rules.
              </p>
            </div>
            <div className="customers-actions customers-actions--end">
              <Button variant="ghost" onClick={onClose} disabled={busy}>
                Close
              </Button>
            </div>
          </>
        )}

        {!blocked && !restricted && (
          <>
            <div className="customers-form-grid">
              <NairaField
                label="Credit amount"
                help="The amount the customer will owe for this sale."
                error={amountError ?? undefined}
                value={amountText}
                onChange={(value) => {
                  setAmountText(value)
                  setAmountError(null)
                }}
              />
              <Field
                label="Due date (optional)"
                help="Without a due date the debt stays open without an artificial deadline."
              >
                <TextInput
                  className="customers-input"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </Field>
            </div>

            <dl className="customers-metric-grid">
              <div className="customers-metric">
                <dt>Credit limit</dt>
                <dd>
                  {limitMinor !== undefined
                    ? formatDebt(limitMinor)
                    : 'No limit configured'}
                </dd>
              </div>
              <div className="customers-metric">
                <dt>Current outstanding debt</dt>
                <dd>{formatDebt(currentOutstanding)}</dd>
              </div>
              <div className="customers-metric">
                <dt>Projected outstanding debt</dt>
                <dd>{projected !== null ? formatDebt(projected) : '—'}</dd>
              </div>
              {limitMinor !== undefined && (
                <div className="customers-metric">
                  <dt>{overLimit ? 'Over limit by' : 'Available credit'}</dt>
                  <dd>
                    {overLimit
                      ? formatDebt(limitDifference!)
                      : formatDebt(availableCredit!)}
                  </dd>
                  <p className="customers-metric-hint">
                    Available credit is not permission to bypass required
                    authorization.
                  </p>
                </div>
              )}
            </dl>

            {overLimit && (
              <div className="customers-state-message warning">
                <h3>Over-limit exception required</h3>
                <p>
                  The projected outstanding debt {formatDebt(projected!)}{' '}
                  exceeds the credit limit {formatDebt(limitMinor!)} by{' '}
                  {formatDebt(limitDifference!)}. A separate management
                  exception approval is required before this credit sale can be
                  recorded.
                </p>
              </div>
            )}

            <div className="customers-form-grid">
              <Field
                label="Credit sale approved by"
                help="A separate Manager or Owner. The requester cannot approve their own credit sale."
              >
                <Select
                  className="customers-select"
                  value={approverId}
                  onChange={(event) => setApproverId(event.target.value)}
                  placeholder="Choose approver"
                  options={approvalCandidates.map((candidate) => ({
                    value: candidate.id,
                    label: `${candidate.displayName} · ${roleLabel(candidate.role)}`,
                  }))}
                />
              </Field>
              {overLimit && (
                <Field
                  label="Over-limit exception approved by"
                  help="A second separate management approval for exceeding the limit."
                >
                  <Select
                    className="customers-select"
                    value={overLimitApproverId}
                    onChange={(event) =>
                      setOverLimitApproverId(event.target.value)
                    }
                    placeholder="Choose approver"
                    options={approvalCandidates.map((candidate) => ({
                      value: candidate.id,
                      label: `${candidate.displayName} · ${roleLabel(candidate.role)}`,
                    }))}
                  />
                </Field>
              )}
            </div>

            <div className="ui-confirmation">
              <p className="ui-text-body">
                Record this credit sale for {customer.customer.name}.
              </p>
              <ul className="ui-confirmation__effects">
                <li>
                  This credit sale will increase outstanding debt from{' '}
                  {formatDebt(currentOutstanding)} to{' '}
                  {projected !== null ? formatDebt(projected) : '—'}.
                </li>
                <li>
                  The new debt will be an independently traceable obligation
                  linked to its source sale.
                </li>
                {overLimit && (
                  <li>
                    It exceeds the credit limit by{' '}
                    {formatDebt(limitDifference!)} and is recorded with the
                    over-limit exception approval.
                  </li>
                )}
                {dueDate && (
                  <li>
                    Due date{' '}
                    {formatDate(new Date(`${dueDate}T00:00:00`).toISOString())}.
                  </li>
                )}
              </ul>
              <p className="ui-text-caption">
                Recorded as approved by{' '}
                {approver
                  ? `${approver.displayName} (${roleLabel(approver.role)})`
                  : '—'}
                {overLimitApprover
                  ? `; over-limit exception by ${overLimitApprover.displayName} (${roleLabel(overLimitApprover.role)})`
                  : ''}
                . Approver and requester must be different people.
              </p>
              <div className="ui-confirmation__actions">
                <Button variant="ghost" onClick={onClose} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={submit} loading={busy} disabled={!canSubmit}>
                  Record credit sale
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}

/**
 * Repayment recording with explicit payment components and explicit debt
 * allocation. Only confirmed successful payments are recorded, and the
 * review shows exactly which obligations are being reduced (C08 sections
 * 22-28, 72, 80-81).
 */
export function RepaymentDialog({
  open,
  onClose,
  customer,
  openDebts,
  confirmedBy,
  busy,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  customer: CustomerSummaryView
  openDebts: readonly DebtView[]
  confirmedBy: string
  busy: boolean
  onSubmit: (input: {
    components: RepaymentComponent[]
    allocations: RepaymentAllocation[]
  }) => void
}) {
  const [components, setComponents] = useState<RepaymentComponentDraft[]>([
    { method: 'cash', amountText: '', confirmed: false, reference: '' },
  ])
  const [allocationTexts, setAllocationTexts] = useState<
    Record<string, string>
  >({})
  const [allocationError, setAllocationError] = useState<string | null>(null)

  const componentTotal = components.reduce(
    (sum, component) => sum + (parseNairaToMinor(component.amountText) ?? 0n),
    0n,
  )

  const allocations = useMemo(() => {
    const result: RepaymentAllocation[] = []
    let remaining = componentTotal
    for (const debt of openDebts) {
      const manual = allocationTexts[debt.debt.id]
      if (manual !== undefined) {
        const amount = parseNairaToMinor(manual) ?? 0n
        result.push({ debtId: debt.debt.id, amountMinor: amount })
        continue
      }
      const amount =
        remaining > 0n
          ? remaining > debt.debt.outstandingMinor
            ? debt.debt.outstandingMinor
            : remaining
          : 0n
      remaining -= amount
      result.push({ debtId: debt.debt.id, amountMinor: amount })
    }
    return result
  }, [componentTotal, allocationTexts, openDebts])

  const allocationTotal = allocations.reduce(
    (sum, allocation) => sum + allocation.amountMinor,
    0n,
  )
  const unallocated = componentTotal - allocationTotal
  const allConfirmed =
    components.length > 0 &&
    components.every((component) => component.confirmed)
  const allAmountsValid = components.every(
    (component) =>
      (parseNairaToMinor(component.amountText) ?? 0n) > 0n &&
      parseNairaToMinor(component.amountText) !== null,
  )
  const noOverAllocation = allocations.every((allocation) => {
    const debt = openDebts.find((view) => view.debt.id === allocation.debtId)
    return !debt || allocation.amountMinor <= debt.debt.outstandingMinor
  })
  const canSubmit =
    components.length > 0 &&
    allAmountsValid &&
    allConfirmed &&
    componentTotal > 0n &&
    allocationTotal === componentTotal &&
    noOverAllocation &&
    openDebts.length > 0

  const updateComponent = (
    index: number,
    patch: Partial<RepaymentComponentDraft>,
  ) => {
    setComponents((current) =>
      current.map((component, position) =>
        position === index ? { ...component, ...patch } : component,
      ),
    )
  }

  const submit = () => {
    if (!allConfirmed) {
      setAllocationError(
        'Confirm every payment component as successfully received before recording the repayment.',
      )
      return
    }
    if (!noOverAllocation) {
      setAllocationError(
        'An allocation exceeds what that debt actually owes. Reduce it to the remaining amount.',
      )
      return
    }
    if (allocationTotal !== componentTotal) {
      setAllocationError(
        'The allocations must equal the confirmed payment amount exactly. Adjust the allocation.',
      )
      return
    }
    setAllocationError(null)
    onSubmit({
      components: components.map((component) => ({
        method: component.method,
        amountMinor: parseNairaToMinor(component.amountText)!,
        confirmation: {
          state: 'confirmed_success',
          confirmedBy,
          ...(component.reference.trim()
            ? { externalReference: component.reference.trim() }
            : {}),
        },
      })),
      allocations,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Record repayment">
      <div className="customers-dialog-body">
        <div className="customers-identity-strip">
          <strong>{customer.customer.name}</strong>
          <span className="ui-text-body-sm">{customer.customer.phone}</span>
          <span className="ui-text-body-sm">
            Outstanding debt {formatDebt(customer.outstandingMinor)}
          </span>
        </div>

        {openDebts.length === 0 ? (
          <>
            <div className="customers-state-message info">
              <h3>No outstanding debt</h3>
              <p>
                This customer has no outstanding credit, so there is nothing to
                repay. A repayment is a separate successful payment event
                against existing debt.
              </p>
            </div>
            <div className="customers-actions customers-actions--end">
              <Button variant="ghost" onClick={onClose} disabled={busy}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h3 className="ui-text-h4">Payment received</h3>
              <p className="ui-text-caption ui-text-secondary">
                A repayment is recorded only when the payment has successfully
                occurred and been confirmed. Unconfirmed or failed payments are
                never recorded as successful repayment events.
              </p>
              <div className="customers-grid">
                {components.map((component, index) => (
                  <div
                    key={index}
                    className="customers-component-row customers-debt-card"
                  >
                    <Field label="Payment method">
                      <Select
                        className="customers-select"
                        value={component.method}
                        onChange={(event) =>
                          updateComponent(index, {
                            method: event.target
                              .value as RepaymentComponentDraft['method'],
                          })
                        }
                        options={methodOptions}
                      />
                    </Field>
                    <NairaField
                      label="Amount"
                      value={component.amountText}
                      onChange={(value) =>
                        updateComponent(index, { amountText: value })
                      }
                    />
                    <Field
                      label="Reference (optional)"
                      help="For transfers and card payments, the confirmation reference."
                    >
                      <TextInput
                        className="customers-input"
                        value={component.reference}
                        onChange={(event) =>
                          updateComponent(index, {
                            reference: event.target.value,
                          })
                        }
                        autoComplete="off"
                      />
                    </Field>
                    <Checkbox
                      label="Payment confirmed"
                      checked={component.confirmed}
                      onChange={(event) =>
                        updateComponent(index, {
                          confirmed: event.target.checked,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="customers-actions customers-actions--spaced">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setComponents((current) => [
                      ...current,
                      {
                        method: 'cash',
                        amountText: '',
                        confirmed: false,
                        reference: '',
                      },
                    ])
                  }
                >
                  Add split payment method
                </Button>
                {components.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setComponents((current) => current.slice(0, -1))
                    }
                  >
                    Remove last method
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h3 className="ui-text-h4">Debt allocation</h3>
              <p className="ui-text-caption ui-text-secondary">
                One repayment may be allocated across multiple debts. The
                default fills the oldest debt first; adjust it to match what the
                payment should reduce.
              </p>
              <div className="customers-table-wrap">
                <table className="customers-allocation-table">
                  <thead>
                    <tr>
                      <th>Debt</th>
                      <th className="num">Outstanding</th>
                      <th className="num">Allocate</th>
                      <th className="num">Remaining after</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openDebts.map((view) => {
                      const allocation = allocations.find(
                        (candidate) => candidate.debtId === view.debt.id,
                      )
                      const remaining =
                        view.debt.outstandingMinor -
                        (allocation?.amountMinor ?? 0n)
                      return (
                        <tr key={view.debt.id}>
                          <td>
                            <span className="customers-mono">
                              {view.debt.id}
                            </span>
                            <span className="customers-meta">
                              Sale {view.debt.saleId}
                            </span>
                          </td>
                          <td className="num">
                            {formatDebt(view.debt.outstandingMinor)}
                          </td>
                          <td className="num">
                            <input
                              className="customers-allocation-input"
                              value={
                                allocationTexts[view.debt.id] ??
                                (allocation
                                  ? minorToNairaText(allocation.amountMinor)
                                  : '0')
                              }
                              onChange={(event) =>
                                setAllocationTexts((current) => ({
                                  ...current,
                                  [view.debt.id]: event.target.value,
                                }))
                              }
                              inputMode="decimal"
                              autoComplete="off"
                              aria-label={`Allocation for debt ${view.debt.id}`}
                            />
                          </td>
                          <td className="num">{formatDebt(remaining)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="ui-text-body-sm">
                Confirmed payment total{' '}
                <strong>{formatDebt(componentTotal)}</strong> · Allocated{' '}
                <strong>{formatDebt(allocationTotal)}</strong> · Unallocated{' '}
                <strong>{formatDebt(unallocated)}</strong>
              </p>
              {allocationError && (
                <p className="customers-field-error" role="alert">
                  {allocationError}
                </p>
              )}
            </div>

            <div className="ui-confirmation">
              <p className="ui-text-body">
                Record this repayment for {customer.customer.name}.
              </p>
              <ul className="ui-confirmation__effects">
                {allocations
                  .filter((allocation) => allocation.amountMinor > 0n)
                  .map((allocation) => {
                    const view = openDebts.find(
                      (candidate) => candidate.debt.id === allocation.debtId,
                    )!
                    return (
                      <li key={allocation.debtId}>
                        This repayment will reduce {allocation.debtId} from{' '}
                        {formatDebt(view.debt.outstandingMinor)} to{' '}
                        {formatDebt(
                          view.debt.outstandingMinor - allocation.amountMinor,
                        )}
                        .
                      </li>
                    )
                  })}
                <li>
                  Total outstanding debt will change from{' '}
                  {formatDebt(customer.outstandingMinor)} to{' '}
                  {formatDebt(customer.outstandingMinor - componentTotal)}.
                </li>
                <li>
                  Payment methods:{' '}
                  {components
                    .map(
                      (component) =>
                        `${repaymentMethodLabel(component.method)}${component.confirmed ? '' : ' (not confirmed yet)'}`,
                    )
                    .join(', ')}
                  .
                </li>
              </ul>
              <p className="ui-text-caption">
                The repayment does not rewrite the original credit sale. Each
                payment remains its own traceable event.
              </p>
              <div className="ui-confirmation__actions">
                <Button variant="ghost" onClick={onClose} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={submit} loading={busy} disabled={!canSubmit}>
                  Record repayment
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
