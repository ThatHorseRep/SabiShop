import { useState } from 'react'
import { Button, Dialog, Field, Select, Textarea, TextInput } from '../ui'
import type { ExceptionsController } from './exceptionsController'
import type { ExceptionsSnapshot } from './exceptionsController'
import { approvalCandidates } from '../pos/posSession'
import {
  AuthorizationNote,
  ConsequenceList,
  DetailRow,
  Metric,
  Panel,
  StateChip,
  TimelineEntry,
  TimelineList,
} from './ExceptionsShared'
import {
  formatMoneyKobo,
  formatSignedKobo,
  parseNairaToKobo,
} from './exceptionsFormat'

type CashDialogKind =
  'count' | 'interim' | 'cash-event' | 'resolve' | 'close' | 'reopen' | null

const stateLabels: Record<string, string> = {
  open_session: 'Business day open',
  count_recorded: 'Physical count recorded',
  reconciliation_prepared: 'Reconciliation prepared',
  management_confirmed: 'Management confirmed',
  closed: 'Closed',
  reopened: 'Reopened',
}

export function ReconciliationSection({
  controller,
  snapshot,
  runAction,
}: {
  controller: ExceptionsController
  snapshot: ExceptionsSnapshot
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [dialog, setDialog] = useState<CashDialogKind>(null)
  const cash = snapshot.cash
  const variance = cash.snapshot.cashVarianceKobo

  return (
    <div className="exceptions-section">
      <Panel
        title="Cash reconciliation"
        description="Count the physical cash, compare it with what the system expects, and investigate any difference. Cash history is never rewritten."
        actions={
          <StateChip
            tone={
              cash.snapshot.state === 'closed'
                ? 'neutral'
                : cash.snapshot.state === 'management_confirmed'
                  ? 'success'
                  : cash.snapshot.unresolved
                    ? 'warning'
                    : 'info'
            }
            label={stateLabels[cash.snapshot.state] ?? cash.snapshot.state}
          />
        }
      >
        <dl className="exceptions-metrics">
          <Metric
            label="Expected Cash"
            value={formatMoneyKobo(cash.snapshot.expectedCashKobo)}
            hint="System-derived: confirmed opening cash + cash sales + cash in − cash out − cash refunds."
          />
          <Metric
            label="Actual Cash"
            value={
              cash.snapshot.actualCashKobo === undefined
                ? 'Not counted yet'
                : formatMoneyKobo(cash.snapshot.actualCashKobo)
            }
            hint={
              cash.snapshot.actualCashKobo === undefined
                ? 'Entered only from a deliberate physical count during reconciliation — never as a routine dashboard value.'
                : `Physical count${cash.cashInHand.countedAt ? ` recorded ${new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(cash.cashInHand.countedAt))}` : ''}.`
            }
          />
          <Metric
            label="Cash Variance"
            value={
              variance === undefined ? (
                'Not counted yet'
              ) : variance === 0 ? (
                '₦0.00'
              ) : (
                <span
                  className={
                    variance < 0
                      ? 'exceptions-delta negative'
                      : 'exceptions-delta positive'
                  }
                >
                  {formatSignedKobo(variance)}{' '}
                  {variance < 0 ? 'shortage' : 'excess'}
                </span>
              )
            }
            hint="Actual Cash − Expected Cash. A non-zero variance is a discrepancy requiring investigation, not an automatic accusation."
            tone={
              variance === undefined || variance === 0
                ? 'default'
                : variance < 0
                  ? 'danger'
                  : 'warning'
            }
          />
          <Metric
            label="Cash in Hand"
            value={formatMoneyKobo(cash.cashInHand.valueKobo)}
            hint={
              cash.cashInHand.basis === 'counted'
                ? 'Physical cash as last counted. Expected Cash remains the system view until the next count.'
                : 'Operational view: the system expects this much cash. It has not been physically counted yet.'
            }
          />
        </dl>

        {cash.snapshot.unresolved && (
          <div className="exceptions-discrepancy" role="alert">
            <h4>Discrepancy requiring investigation</h4>
            <p>
              Expected Cash and the physical count differ by{' '}
              <strong>{formatSignedKobo(variance ?? 0)}</strong>. This is an
              investigation signal, not an accusation. The discrepancy stays
              visible until management records the outcome.
            </p>
            <ConsequenceList
              effects={[
                'Review cash sales, refunds, cash in, and cash out below to find contributing events.',
                'Resolution records who, when, and why — the original reconciliation stays in history.',
              ]}
            />
          </div>
        )}

        {cash.snapshot.discrepancyStatus === 'resolved' && (
          <p className="exceptions-note">
            Discrepancy resolved. The investigation outcome is preserved in the
            reconciliation history; the original figures were not rewritten.
          </p>
        )}

        <div className="exceptions-case__actions">
          {cash.nextActions.map((action) => (
            <Button
              key={action.action}
              size="sm"
              disabled={!action.permitted}
              title={action.note}
              onClick={() => {
                if (action.action === 'resolve') setDialog('resolve')
                else if (action.action === 'close') setDialog('close')
                else if (action.action === 'reopen') setDialog('reopen')
                else if (action.action === 'count') setDialog('count')
                else if (action.action === 'interim-count') setDialog('interim')
                else if (action.action === 'prepare')
                  void runAction('Reconciliation prepared', async () => {
                    await controller.prepareReconciliation()
                    return 'Expected Cash was compared with the physical count. Any variance is now a visible discrepancy requiring investigation.'
                  })
                else if (action.action === 'confirm')
                  void runAction('Reconciliation confirmed', async () => {
                    await controller.confirmManagementReconciliation()
                    return 'Management confirmed this reconciliation. The business day can now be closed.'
                  })
              }}
            >
              {action.label}
            </Button>
          ))}
          {cash.snapshot.state === 'open_session' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDialog('cash-event')}
            >
              Record cash in / out
            </Button>
          )}
        </div>
        {cash.nextActions.some((action) => !action.permitted) && (
          <AuthorizationNote>
            {cash.nextActions
              .filter((action) => !action.permitted)
              .map((action) => `${action.label}: ${action.note}`)
              .join(' ')}
          </AuthorizationNote>
        )}
      </Panel>

      <Panel
        title="Payment methods"
        description="Each method stays distinguishable. A discrepancy in one method is never hidden inside another."
      >
        <dl className="exceptions-metrics">
          {cash.paymentTotals.map((total) => (
            <Metric
              key={total.method}
              label={total.label}
              value={formatMoneyKobo(total.totalKobo)}
              hint={
                total.method === 'cash'
                  ? 'Only the cash portion affects Expected Cash.'
                  : 'Recorded as confirmed payments. Not independently verified by Sabi Shop.'
              }
            />
          ))}
        </dl>
      </Panel>

      <Panel
        title="Cash activity"
        description="Every movement that affects the physical till, with its reason and actor."
      >
        {cash.events.length === 0 ? (
          <p className="ui-text-body ui-text-secondary">
            No cash events recorded in this session yet.
          </p>
        ) : (
          <table className="exceptions-table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Event</th>
                <th scope="col" className="numeric">
                  Amount
                </th>
                <th scope="col">Reason</th>
                <th scope="col">Actor</th>
              </tr>
            </thead>
            <tbody>
              {cash.events.map((event) => (
                <tr key={event.id}>
                  <td>
                    {new Intl.DateTimeFormat('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(event.occurredAt))}
                  </td>
                  <td>{cashEventLabel(event.kind)}</td>
                  <td className="numeric">
                    {formatMoneyKobo(event.amountKobo)}
                  </td>
                  <td>{event.reason}</td>
                  <td>{event.actorId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel
        title="Reconciliation history"
        description="Every count, preparation, confirmation, closure, reopen, and resolution stays auditable."
      >
        <TimelineList
          entries={cash.audits
            .slice()
            .reverse()
            .map((event) => (
              <TimelineEntry
                key={event.id}
                at={event.occurredAt}
                title={cashAuditTitle(event.type)}
                actor={`${event.actorId} (${event.actorRole})`}
                detail={Object.entries(event.details)
                  .filter(([, value]) => value !== undefined)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(' · ')}
              />
            ))}
        />
      </Panel>

      {dialog === 'count' && (
        <CountCashDialog
          controller={controller}
          expectedKobo={cash.snapshot.expectedCashKobo}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}

      {dialog === 'interim' && (
        <InterimCountDialog
          controller={controller}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}

      {dialog === 'cash-event' && (
        <CashEventDialog
          controller={controller}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}

      {dialog === 'resolve' && (
        <ResolveDiscrepancyDialog
          controller={controller}
          variance={variance ?? 0}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}

      {dialog === 'close' && (
        <CloseDayDialog
          controller={controller}
          unresolved={cash.snapshot.unresolved}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}

      {dialog === 'reopen' && (
        <ReopenDayDialog
          controller={controller}
          snapshot={snapshot}
          onClose={() => setDialog(null)}
          runAction={runAction}
        />
      )}
    </div>
  )
}

function cashEventLabel(kind: string): string {
  switch (kind) {
    case 'cash_in':
      return 'Cash in'
    case 'cash_out':
      return 'Cash out'
    case 'cash_sale':
      return 'Cash sale'
    default:
      return 'Cash refund'
  }
}

function cashAuditTitle(type: string): string {
  const labels: Record<string, string> = {
    'business_day.opened': 'Business day opened',
    'opening_cash.entered': 'Opening cash entered',
    'opening_cash.confirmed': 'Opening cash confirmed',
    'cash.cash_in.recorded': 'Cash in recorded',
    'cash.cash_out.recorded': 'Cash out recorded',
    'cash.cash_sale.recorded': 'Cash sale recorded',
    'cash.cash_refund.recorded': 'Cash refund recorded',
    'cash.interim_count.recorded': 'Interim count recorded',
    'cash.actual_count.recorded': 'Physical count recorded',
    'reconciliation.prepared': 'Reconciliation prepared',
    'reconciliation.management_confirmed': 'Reconciliation confirmed',
    'business_day.closed': 'Business day closed',
    'reconciliation.reopened': 'Business day reopened',
    'reconciliation.discrepancy.resolved': 'Discrepancy resolved',
  }
  return labels[type] ?? type
}

function CountCashDialog({
  controller,
  expectedKobo,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  expectedKobo: number
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [amountText, setAmountText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const amountKobo = parseNairaToKobo(amountText)
  const invalid = amountKobo === null || amountKobo < 0
  return (
    <Dialog open onClose={onClose} title="Count cash" dismissable={false}>
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          Physically count the cash in the drawer now, then enter what you
          counted. Actual Cash exists only as this deliberate count — it is
          never a routine dashboard value that someone keeps up to date.
        </p>
        <dl className="exceptions-details">
          <DetailRow label="Expected Cash right now">
            {formatMoneyKobo(expectedKobo)}
          </DetailRow>
        </dl>
        <Field
          label="Counted cash (₦)"
          hint="Count the physical money. Do not copy the expected figure."
          error={invalid ? 'Enter the counted amount.' : undefined}
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
        {amountKobo !== null && !invalid && (
          <p className="ui-text-body-sm ui-text-secondary">
            Variance against Expected Cash:{' '}
            <strong>{formatSignedKobo(amountKobo - expectedKobo)}</strong>. A
            non-zero variance becomes a discrepancy requiring investigation.
          </p>
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
            disabled={invalid}
            onClick={async () => {
              setError(null)
              const done = await runAction(
                'Physical count recorded',
                async () => {
                  await controller.recordActualCashCount(amountKobo!)
                  return `Actual Cash recorded as ${formatMoneyKobo(amountKobo!)}. Prepare the reconciliation to compare it with Expected Cash.`
                },
              )
              if (done) onClose()
              else setError('The count was not recorded. Nothing changed.')
            }}
          >
            Record physical count
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function InterimCountDialog({
  controller,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [amountText, setAmountText] = useState('')
  const [note, setNote] = useState('')
  const amountKobo = parseNairaToKobo(amountText)
  const invalid = amountKobo === null || amountKobo < 0
  return (
    <Dialog
      open
      onClose={onClose}
      title="Record interim count"
      dismissable={false}
    >
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          An interim count is a management checkpoint during the day. It never
          closes the business day and does not replace the final count.
        </p>
        <Field
          label="Counted cash (₦)"
          error={invalid ? 'Enter the counted amount.' : undefined}
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
        <Field label="Note (optional)">
          {({ id, describedBy }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              value={note}
              onChange={(event) => setNote(event.target.value)}
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
              const done = await runAction(
                'Interim count recorded',
                async () => {
                  await controller.recordInterimCount({
                    actualCashKobo: amountKobo!,
                    note: note.trim() || undefined,
                  })
                  return 'The interim checkpoint is recorded. The session remains open.'
                },
              )
              if (done) onClose()
            }}
          >
            Record interim count
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function CashEventDialog({
  controller,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [kind, setKind] = useState<'cash_in' | 'cash_out'>('cash_out')
  const [amountText, setAmountText] = useState('')
  const [reason, setReason] = useState('')
  const amountKobo = parseNairaToKobo(amountText)
  const invalid = amountKobo === null || amountKobo <= 0 || !reason.trim()
  return (
    <Dialog
      open
      onClose={onClose}
      title="Record cash movement"
      dismissable={false}
    >
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          Record money that entered or left the till outside a sale — for
          example change money added, a shop expense, or a bank deposit.
        </p>
        <Field label="Movement">
          {({ id, describedBy }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as 'cash_in' | 'cash_out')
              }
              options={[
                {
                  value: 'cash_in',
                  label: 'Cash in — money added to the till',
                },
                {
                  value: 'cash_out',
                  label: 'Cash out — money taken from the till',
                },
              ]}
            />
          )}
        </Field>
        <Field
          label="Amount (₦)"
          error={
            amountText && (amountKobo === null || amountKobo <= 0)
              ? 'Enter a positive amount.'
              : undefined
          }
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
        <Field
          label="Reason"
          error={!reason.trim() ? 'A reason is required.' : undefined}
        >
          {({ id, describedBy }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
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
              const done = await runAction(
                'Cash movement recorded',
                async () => {
                  await controller.recordCashEvent({
                    kind,
                    amountKobo: amountKobo!,
                    reason,
                  })
                  return `The ${kind === 'cash_in' ? 'cash in' : 'cash out'} is recorded and included in Expected Cash.`
                },
              )
              if (done) onClose()
            }}
          >
            Record movement
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function ResolveDiscrepancyDialog({
  controller,
  variance,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  variance: number
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [explanation, setExplanation] = useState('')
  const explanationMissing = !explanation.trim()
  return (
    <Dialog
      open
      onClose={onClose}
      title="Resolve discrepancy"
      dismissable={false}
    >
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          Record the investigation outcome. The original reconciliation, the
          count, and the variance stay in history exactly as they happened.
        </p>
        <dl className="exceptions-details">
          <DetailRow label="Variance">{formatSignedKobo(variance)}</DetailRow>
        </dl>
        <Field
          label="Investigation outcome"
          hint="What was found and what it means. This is preserved with the resolution."
          error={explanationMissing ? 'An explanation is required.' : undefined}
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
            />
          )}
        </Field>
        <div className="exceptions-dialog-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={explanationMissing}
            onClick={async () => {
              const done = await runAction('Discrepancy resolved', async () => {
                await controller.resolveDiscrepancy(explanation)
                return 'The discrepancy is resolved with your explanation recorded. The original reconciliation remains in history.'
              })
              if (done) onClose()
            }}
          >
            Resolve discrepancy
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function CloseDayDialog({
  controller,
  unresolved,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  unresolved: boolean
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [reason, setReason] = useState('')
  return (
    <Dialog
      open
      onClose={onClose}
      title="Close business day"
      dismissable={false}
    >
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          Closing makes this reconciliation the official end of the business
          day. The day may be reopened later with a reason if something is
          discovered.
        </p>
        {unresolved && (
          <div className="exceptions-discrepancy" role="alert">
            <h4>Unresolved discrepancy</h4>
            <p>
              You may close with an unresolved discrepancy. It stays visible and
              open for investigation — closing does not hide it.
            </p>
          </div>
        )}
        <Field
          label="Reason (optional)"
          hint="Recorded with the closure audit event."
        >
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          )}
        </Field>
        <div className="exceptions-dialog-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              const done = await runAction('Business day closed', async () => {
                await controller.closeBusinessDay(reason.trim() || undefined)
                return unresolved
                  ? 'The business day is closed. The unresolved discrepancy remains visible and open for investigation.'
                  : 'The business day is closed. The reconciliation and its history stay auditable.'
              })
              if (done) onClose()
            }}
          >
            Close business day
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function ReopenDayDialog({
  controller,
  snapshot,
  onClose,
  runAction,
}: {
  controller: ExceptionsController
  snapshot: ExceptionsSnapshot
  onClose: () => void
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
}) {
  const [reason, setReason] = useState('')
  const [approverId, setApproverId] = useState('')
  const actor = snapshot.actor
  const approverCandidates =
    actor.role === 'manager'
      ? approvalCandidates({
          businessId: '',
          businessName: '',
          deviceId: '',
          actor,
          permissions: new Set(snapshot.permissions),
        })
      : []
  const approverOptions = approverCandidates.map((candidate) => ({
    value: candidate.id,
    label: `${candidate.displayName} (${candidate.role})`,
  }))
  const reasonMissing = !reason.trim()
  const approvalMissing = actor.role === 'manager' && !approverId
  return (
    <Dialog
      open
      onClose={onClose}
      title="Reopen business day"
      dismissable={false}
    >
      <div className="exceptions-dialog-body">
        <p className="ui-text-body">
          Reopening a closed day is a consequential action. Who reopened it,
          when, and why are all recorded; the closed-day record is not erased.
        </p>
        <Field
          label="Reason"
          hint="For example: a missing sale was found after closure."
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
        {actor.role === 'manager' && (
          <Field
            label="Separate approval"
            hint="A Manager reopen is reviewed by the Owner."
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
        <div className="exceptions-dialog-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={reasonMissing || approvalMissing}
            onClick={async () => {
              const done = await runAction(
                'Business day reopened',
                async () => {
                  await controller.reopenBusinessDay(
                    reason,
                    actor.role === 'manager'
                      ? {
                          approverId,
                          approverRole:
                            approverCandidates.find(
                              (candidate) => candidate.id === approverId,
                            )?.role ?? 'owner',
                        }
                      : undefined,
                  )
                  return 'The business day is reopened. Recount the cash and prepare a new reconciliation; the earlier closure stays in history.'
                },
              )
              if (done) onClose()
            }}
          >
            Reopen business day
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
