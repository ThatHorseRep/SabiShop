import { useCallback, useEffect, useRef, useState } from 'react'
import { CustomersCreditError } from '../domain/customersCredit'
import { AuthorizationError } from '../auth/server'
import { Button } from '../ui'
import { roleLabel, type ManagementActor } from '../pos/posSession'
import type { DurableStore } from '../sync/offlineSync'
import {
  CustomerCreditController,
  customerActors,
  type CustomerActorId,
  type DebtView,
} from './customersController'
import { formatDebt } from './customersFormat'
import { OverviewSection } from './OverviewSection'
import { CustomerListSection } from './CustomerListSection'
import {
  CustomerProfileSection,
  type DebtDialogKind,
  type ProfilePermissions,
} from './CustomerProfileSection'
import { HistorySection } from './HistorySection'
import {
  CreateCustomerDialog,
  CreditSaleDialog,
  RepaymentDialog,
} from './CustomerDialogs'
import {
  CorrectionDialog,
  CreditLimitDialog,
  CreditStatusDialog,
  DebtReductionDialog,
  DisputeDialog,
  DisputeResolutionDialog,
  ReversalDialog,
} from './ManagementDialogs'
import { OperationFeedback, StatusChip } from './CustomersShared'
import './customers.css'

type WorkspaceTab = 'overview' | 'customers' | 'history'

type Feedback = {
  tone: 'success' | 'error'
  title: string
  message: string
  savedState?: string
  nextStep?: string
}

type DebtDialogState = {
  kind: DebtDialogKind
  debt: DebtView
} | null

/**
 * Domain-specific next-step guidance. Every failed operation explains what
 * happened, that nothing was saved, and the safest next action (C08 section
 * 68; C03 section 27).
 */
function failureGuidance(error: unknown): {
  savedState: string
  nextStep: string
} {
  if (error instanceof CustomersCreditError) {
    switch (error.code) {
      case 'CREDIT_NOT_ALLOWED':
        return {
          savedState: 'No credit sale was recorded and no debt was created.',
          nextStep:
            'Use another payment method, or ask management to review this customer’s credit status.',
        }
      case 'RESTRICTED_CREDIT_CONFIGURATION_REQUIRED':
        return {
          savedState: 'No credit sale was recorded and no debt was created.',
          nextStep:
            'Restricted credit requires management handling. Ask a manager or the owner to handle this sale.',
        }
      case 'CREDIT_APPROVAL_REQUIRED':
        return {
          savedState: 'No credit sale was recorded and no debt was created.',
          nextStep:
            'A separate Manager or Owner must approve this credit sale.',
        }
      case 'OVER_LIMIT_EXCEPTION_REQUIRED':
        return {
          savedState: 'No credit sale was recorded and no debt was created.',
          nextStep:
            'Reduce the credit amount below the limit, or obtain a separate over-limit exception approval.',
        }
      case 'MANAGEMENT_AUTHORIZATION_REQUIRED':
        return {
          savedState: 'Nothing was saved and no debt state changed.',
          nextStep:
            'Ask a manager or the business owner to perform this action.',
        }
      case 'INVALID_REPAYMENT':
        return {
          savedState: 'No repayment was recorded and no debt balances changed.',
          nextStep:
            'Confirm the payment actually succeeded before recording the repayment.',
        }
      case 'ALLOCATION_MISMATCH':
        return {
          savedState: 'No repayment was recorded and no debt balances changed.',
          nextStep:
            'Adjust the payment components or the debt allocations so both equal the same amount.',
        }
      case 'ALLOCATION_EXCEEDS_OUTSTANDING':
        return {
          savedState: 'No repayment was recorded and no debt balances changed.',
          nextStep:
            'Reduce the allocation to what that debt actually still owes.',
        }
      case 'INVALID_AMOUNT':
        return {
          savedState: 'Nothing was saved.',
          nextStep: 'Enter a valid amount in naira.',
        }
      case 'INVALID_RETURN':
        return {
          savedState: 'No return was recorded and the obligation is unchanged.',
          nextStep:
            'Enter a positive amount within the remaining obligation and a return reason.',
        }
      case 'INVALID_WRITE_OFF':
        return {
          savedState:
            'No write-off was recorded and the obligation is unchanged.',
          nextStep:
            'Enter a positive amount within the remaining obligation and a write-off reason.',
        }
      case 'INVALID_CORRECTION':
        return {
          savedState:
            'No correction was recorded and the debt state is unchanged.',
          nextStep:
            'The corrected obligation cannot be reduced below repayments, returns, and write-offs already recorded.',
        }
      case 'DEBT_ALREADY_REVERSED':
        return {
          savedState: 'Nothing was saved.',
          nextStep:
            'This credit sale is already reversed; no further reversal or correction is possible.',
        }
      case 'INVALID_DISPUTE':
        return {
          savedState: 'No dispute was recorded.',
          nextStep:
            'Provide a dispute reason for a debt that is not already disputed.',
        }
      case 'CUSTOMER_NOT_FOUND':
      case 'DEBT_NOT_FOUND':
        return {
          savedState: 'Nothing was saved.',
          nextStep: 'Reload the customer record and try again.',
        }
      default:
        return {
          savedState: 'Nothing was saved.',
          nextStep: 'Check the entered details and try again.',
        }
    }
  }
  if (error instanceof AuthorizationError) {
    switch (error.decision.reason) {
      case 'permission_denied':
        return {
          savedState: 'Nothing was saved and no business record changed.',
          nextStep:
            'You do not have permission for this action. Ask a manager or the business owner.',
        }
      case 'offline_not_allowed':
        return {
          savedState: 'Nothing was saved.',
          nextStep:
            'This action needs a connection and cannot be performed offline. Reconnect and try again.',
        }
      case 'self_approval_forbidden':
        return {
          savedState: 'Nothing was saved.',
          nextStep: 'A different Manager or Owner must approve this action.',
        }
      case 'approval_required':
      case 'approval_role_insufficient':
        return {
          savedState: 'Nothing was saved.',
          nextStep: 'A separate Manager or Owner approval is required.',
        }
      case 'session_expired':
      case 'session_revoked':
        return {
          savedState: 'Nothing was saved.',
          nextStep: 'Sign in again, then retry the action.',
        }
      default:
        return {
          savedState: 'Nothing was saved and no business record changed.',
          nextStep: 'Review the authorization message and try again.',
        }
    }
  }
  return {
    savedState: 'Nothing was saved.',
    nextStep: 'Check the entered details and try again.',
  }
}

/**
 * The Customers & Credit workspace (C08). Ordinary customer work is fast;
 * credit and debt decisions are deliberate, explicit, and traceable. The
 * screens contain no business rules of their own — every state comes from
 * the verified credit engine and the authorization boundary.
 */
export function CustomerCreditWorkspace({
  actorId,
  onActorChange,
  online,
  store,
}: {
  actorId: CustomerActorId
  onActorChange: (actorId: CustomerActorId) => void
  online: boolean
  store?: DurableStore
}) {
  const controllerRef = useRef<CustomerCreditController | null>(null)
  if (!controllerRef.current) {
    controllerRef.current = new CustomerCreditController(store)
  }
  const controller = controllerRef.current
  const [, setVersion] = useState(0)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [busy, setBusy] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [creditSaleOpen, setCreditSaleOpen] = useState(false)
  const [repaymentOpen, setRepaymentOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)
  const [debtDialog, setDebtDialog] = useState<DebtDialogState>(null)

  const refresh = useCallback(() => setVersion((current) => current + 1), [])

  useEffect(() => {
    controller.setActor(actorId)
    setFeedback(null)
    refresh()
  }, [actorId, controller, refresh])

  const snapshot = controller.snapshot()
  const selected = snapshot.selected

  const permissions: ProfilePermissions = {
    canRequestCredit: controller.can('credit:request'),
    canRecordRepayment: controller.can('repayment:record'),
    canManageCredit: controller.can('credit:approve'),
    canApproveReturns: controller.can('return:approve'),
    canCorrect: controller.can('correction:approve'),
  }

  const approvalCandidates: readonly ManagementActor[] = customerActors.filter(
    (candidate): candidate is ManagementActor =>
      (candidate.role === 'manager' || candidate.role === 'owner') &&
      candidate.id !== snapshot.actor.id,
  )

  const runAction = useCallback(
    async (title: string, action: () => Promise<string>): Promise<boolean> => {
      setBusy(true)
      try {
        const message = await action()
        setFeedback({ tone: 'success', title, message })
        refresh()
        return true
      } catch (error) {
        const guidance = failureGuidance(error)
        setFeedback({
          tone: 'error',
          title: `${title} did not complete`,
          message:
            error instanceof Error
              ? error.message
              : 'The operation failed before any business effect was confirmed.',
          savedState: guidance.savedState,
          nextStep: guidance.nextStep,
        })
        refresh()
        return false
      } finally {
        setBusy(false)
      }
    },
    [refresh],
  )

  const selectCustomer = (customerId: string) => {
    controller.selectCustomer(customerId)
    setActiveTab('customers')
    refresh()
  }

  const openDebtDialog = (kind: DebtDialogKind, debt: DebtView) => {
    setDebtDialog({ kind, debt })
  }

  const tabs: [WorkspaceTab, string][] = [
    ['overview', 'Overview'],
    ['customers', 'Customers'],
    ['history', 'Credit activity'],
  ]

  const pendingCount = controller.pendingOperationCount()
  const conflictCount = controller.conflictOperationCount()

  return (
    <section className="customers-app" aria-labelledby="customers-title">
      <header className="customers-header">
        <div>
          <h1 id="customers-title">Customers &amp; Credit</h1>
          <p>
            A clear record of the relationship between each customer, their
            purchases, and their actual obligations. Debt changes only through
            identifiable events.
          </p>
        </div>
        <div className="customers-session">
          <label htmlFor="customers-actor">Reference session</label>
          <select
            id="customers-actor"
            className="customers-select"
            value={actorId}
            onChange={(event) => {
              const nextActor = event.target.value as CustomerActorId
              controller.setActor(nextActor)
              onActorChange(nextActor)
              setFeedback(null)
              refresh()
            }}
          >
            {customerActors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.displayName} · {roleLabel(actor.role)}
              </option>
            ))}
          </select>
          <p className="customers-session-help">
            Reference adapter for this slice. The authoritative provider will
            replace it without changing the workflow. Navigation visibility is
            never authorization.
          </p>
        </div>
      </header>

      <div className="customers-chip-row">
        <StatusChip
          tone={online ? 'success' : 'warning'}
          label={online ? 'Online' : 'Offline'}
        />
        {pendingCount > 0 && (
          <StatusChip tone="info" label={`Sync pending · ${pendingCount}`} />
        )}
        {conflictCount > 0 && (
          <StatusChip
            tone="conflict"
            label={`Sync conflict · ${conflictCount}`}
          />
        )}
        {pendingCount > 0 && online && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              runAction('Synchronization', async () => {
                await controller.synchronize()
                return 'Locally recorded operations were delivered for authoritative revalidation.'
              })
            }
          >
            Synchronize now
          </Button>
        )}
      </div>

      {feedback && (
        <OperationFeedback
          tone={feedback.tone}
          title={feedback.title}
          message={feedback.message}
          savedState={feedback.savedState}
          nextStep={feedback.nextStep}
        />
      )}

      <div
        className="customers-tabs"
        role="tablist"
        aria-label="Customers and credit areas"
      >
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`customers-tab-${id}`}
            aria-selected={activeTab === id}
            aria-controls={`customers-panel-${id}`}
            className="customers-tab"
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        id="customers-panel-overview"
        role="tabpanel"
        aria-labelledby="customers-tab-overview"
        hidden={activeTab !== 'overview'}
      >
        {activeTab === 'overview' && (
          <OverviewSection
            snapshot={snapshot}
            onSelectCustomer={selectCustomer}
          />
        )}
      </div>

      <div
        id="customers-panel-customers"
        role="tabpanel"
        aria-labelledby="customers-tab-customers"
        hidden={activeTab !== 'customers'}
      >
        {activeTab === 'customers' && (
          <div className="customers-split">
            <CustomerListSection
              snapshot={snapshot}
              search={(query) => controller.searchCustomers(query)}
              selectedCustomerId={controller.getSelectedCustomerId()}
              onSelectCustomer={selectCustomer}
              onCreateCustomer={() => setCreateOpen(true)}
              canCreate={controller.can('business:work')}
            />
            {selected ? (
              <CustomerProfileSection
                detail={selected}
                permissions={permissions}
                online={online}
                onRecordCreditSale={() => setCreditSaleOpen(true)}
                onRecordRepayment={() => setRepaymentOpen(true)}
                onChangeStatus={() => setStatusOpen(true)}
                onChangeLimit={() => setLimitOpen(true)}
                onOpenDebtDialog={openDebtDialog}
              />
            ) : (
              <p className="customers-empty">
                <strong>No customer selected.</strong> Select a customer to see
                their identity, credit status, outstanding debts, repayments,
                and full credit history.
              </p>
            )}
          </div>
        )}
      </div>

      <div
        id="customers-panel-history"
        role="tabpanel"
        aria-labelledby="customers-tab-history"
        hidden={activeTab !== 'history'}
      >
        {activeTab === 'history' && (
          <HistorySection
            snapshot={snapshot}
            onSelectCustomer={selectCustomer}
          />
        )}
      </div>

      <CreateCustomerDialog
        key={String(createOpen)}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        busy={busy}
        onSubmit={async (input) => {
          const done = await runAction('Customer created', async () => {
            const customer = await controller.createCustomer(input, !online)
            controller.selectCustomer(customer.id)
            return `${customer.name} was created with a name and phone number. Creating a customer does not authorize credit.`
          })
          if (done) setCreateOpen(false)
        }}
      />

      {selected && (
        <>
          <CreditSaleDialog
            key={`${selected.summary.customer.id}-${creditSaleOpen}`}
            open={creditSaleOpen}
            onClose={() => setCreditSaleOpen(false)}
            customer={selected.summary}
            approvalCandidates={approvalCandidates}
            busy={busy}
            onSubmit={async (input) => {
              const done = await runAction('Credit sale recorded', async () => {
                const event = await controller.recordCreditSale(
                  {
                    customerId: selected.summary.customer.id,
                    amountMinor: input.amountMinor,
                    dueDate: input.dueDate,
                    approval: input.approval,
                    overLimitApproval: input.overLimitApproval,
                  },
                  !online,
                )
                return `Debt ${event.debtId} was recorded against sale ${event.saleId}. Outstanding debt is now ${formatDebt(event.resultingOutstandingMinor ?? 0n)}.`
              })
              if (done) setCreditSaleOpen(false)
            }}
          />

          <RepaymentDialog
            key={`${selected.summary.customer.id}-${repaymentOpen}`}
            open={repaymentOpen}
            onClose={() => setRepaymentOpen(false)}
            customer={selected.summary}
            openDebts={selected.debts.filter(
              (view) =>
                view.debt.outstandingMinor > 0n &&
                view.debt.state !== 'reversed',
            )}
            confirmedBy={snapshot.actor.id}
            busy={busy}
            onSubmit={async (input) => {
              const done = await runAction('Repayment recorded', async () => {
                const event = await controller.recordRepayment(
                  {
                    customerId: selected.summary.customer.id,
                    components: input.components,
                    allocations: input.allocations,
                  },
                  !online,
                )
                const affected = input.allocations
                  .filter((allocation) => allocation.amountMinor > 0n)
                  .map((allocation) => allocation.debtId)
                  .join(', ')
                return `Repayment ${event.referenceId} of ${formatDebt(event.amountMinor ?? 0n)} was recorded against ${affected}. Resulting outstanding debt is ${formatDebt(event.resultingOutstandingMinor ?? 0n)}.`
              })
              if (done) setRepaymentOpen(false)
            }}
          />

          <CreditStatusDialog
            key={`${selected.summary.customer.id}-${statusOpen}`}
            open={statusOpen}
            onClose={() => setStatusOpen(false)}
            customer={selected.summary}
            busy={busy}
            onSubmit={async (input) => {
              const done = await runAction(
                'Credit status changed',
                async () => {
                  const customer = await controller.setCreditStatus(
                    {
                      customerId: selected.summary.customer.id,
                      creditStatus: input.creditStatus,
                      reason: input.reason,
                    },
                    !online,
                  )
                  return `${customer.name}’s credit status is now recorded as ${input.creditStatus === 'allowed' ? 'Credit allowed' : input.creditStatus === 'restricted' ? 'Credit restricted' : 'Credit blocked'}. Existing debts and history are unchanged.`
                },
              )
              if (done) setStatusOpen(false)
            }}
          />

          <CreditLimitDialog
            key={`${selected.summary.customer.id}-${limitOpen}`}
            open={limitOpen}
            onClose={() => setLimitOpen(false)}
            customer={selected.summary}
            busy={busy}
            onSubmit={async (input) => {
              const done = await runAction('Credit limit changed', async () => {
                const customer = await controller.setCreditLimit(
                  {
                    customerId: selected.summary.customer.id,
                    creditLimitMinor: input.creditLimitMinor ?? 0n,
                    reason: input.reason,
                  },
                  !online,
                )
                return `${customer.name}’s credit limit is now ${customer.creditLimitMinor !== undefined ? formatDebt(customer.creditLimitMinor) : 'not configured'}. A sale above the limit still requires a separate management exception.`
              })
              if (done) setLimitOpen(false)
            }}
          />

          {debtDialog?.kind === 'dispute' && (
            <DisputeDialog
              key={`dispute-${debtDialog.debt.debt.id}`}
              open
              onClose={() => setDebtDialog(null)}
              debtView={debtDialog.debt}
              busy={busy}
              onSubmit={async (input) => {
                const done = await runAction('Dispute recorded', async () => {
                  await controller.recordDispute(
                    {
                      customerId: selected.summary.customer.id,
                      debtId: debtDialog.debt.debt.id,
                      reason: input.reason,
                    },
                    !online,
                  )
                  return `Dispute recorded on ${debtDialog.debt.debt.id}. The debt remains visible and outstanding while it is investigated.`
                })
                if (done) setDebtDialog(null)
              }}
            />
          )}

          {debtDialog?.kind === 'resolve-dispute' && (
            <DisputeResolutionDialog
              key={`resolve-${debtDialog.debt.debt.id}`}
              open
              onClose={() => setDebtDialog(null)}
              debtView={debtDialog.debt}
              busy={busy}
              onSubmit={async (input) => {
                const done = await runAction('Dispute resolved', async () => {
                  await controller.resolveDispute(
                    {
                      customerId: selected.summary.customer.id,
                      debtId: debtDialog.debt.debt.id,
                      resolution: input.resolution,
                    },
                    !online,
                  )
                  return `The dispute on ${debtDialog.debt.debt.id} is resolved. The investigation history remains part of the record.`
                })
                if (done) setDebtDialog(null)
              }}
            />
          )}

          {debtDialog?.kind === 'write-off' && (
            <DebtReductionDialog
              key={`write-off-${debtDialog.debt.debt.id}`}
              open
              kind="write_off"
              onClose={() => setDebtDialog(null)}
              debtView={debtDialog.debt}
              busy={busy}
              onSubmit={async (input) => {
                const done = await runAction('Write-off recorded', async () => {
                  const event = await controller.recordWriteOff(
                    {
                      customerId: selected.summary.customer.id,
                      debtId: debtDialog.debt.debt.id,
                      amountMinor: input.amountMinor,
                      reason: input.reason,
                    },
                    !online,
                  )
                  return `Write-off of ${formatDebt(event.amountMinor ?? 0n)} recorded on ${debtDialog.debt.debt.id}. The debt remains historically visible and distinguishable from Paid.`
                })
                if (done) setDebtDialog(null)
              }}
            />
          )}

          {debtDialog?.kind === 'return' && (
            <DebtReductionDialog
              key={`return-${debtDialog.debt.debt.id}`}
              open
              kind="return"
              onClose={() => setDebtDialog(null)}
              debtView={debtDialog.debt}
              busy={busy}
              onSubmit={async (input) => {
                const done = await runAction(
                  'Approved return recorded',
                  async () => {
                    const event = await controller.recordApprovedReturn(
                      {
                        customerId: selected.summary.customer.id,
                        debtId: debtDialog.debt.debt.id,
                        amountMinor: input.amountMinor,
                        reason: input.reason,
                      },
                      !online,
                    )
                    return `Approved return of ${formatDebt(event.amountMinor ?? 0n)} recorded on ${debtDialog.debt.debt.id}. The original sale remains ${formatDebt(debtDialog.debt.debt.originalAmountMinor)} in history.`
                  },
                )
                if (done) setDebtDialog(null)
              }}
            />
          )}

          {debtDialog?.kind === 'correction' && (
            <CorrectionDialog
              key={`correction-${debtDialog.debt.debt.id}`}
              open
              onClose={() => setDebtDialog(null)}
              debtView={debtDialog.debt}
              busy={busy}
              onSubmit={async (input) => {
                const done = await runAction('Correction applied', async () => {
                  const event = await controller.correctCreditSale(
                    {
                      customerId: selected.summary.customer.id,
                      debtId: debtDialog.debt.debt.id,
                      correctedAmountMinor: input.correctedAmountMinor,
                      reason: input.reason,
                    },
                    !online,
                  )
                  return `Correction recorded on ${debtDialog.debt.debt.id}. Corrected obligation ${formatDebt(event.correctedAmountMinor ?? 0n)}; resulting outstanding debt ${formatDebt(event.resultingOutstandingMinor ?? 0n)}. The original state remains recoverable.`
                })
                if (done) setDebtDialog(null)
              }}
            />
          )}

          {debtDialog?.kind === 'reversal' && (
            <ReversalDialog
              key={`reversal-${debtDialog.debt.debt.id}`}
              open
              onClose={() => setDebtDialog(null)}
              debtView={debtDialog.debt}
              busy={busy}
              onSubmit={async (input) => {
                const done = await runAction(
                  'Credit sale reversed',
                  async () => {
                    await controller.reverseCreditSale(
                      {
                        customerId: selected.summary.customer.id,
                        debtId: debtDialog.debt.debt.id,
                        reason: input.reason,
                      },
                      !online,
                    )
                    return `${debtDialog.debt.debt.id} is now reversed. The remaining obligation was recorded as reversed; repayments already received remain in history.`
                  },
                )
                if (done) setDebtDialog(null)
              }}
            />
          )}
        </>
      )}
    </section>
  )
}
