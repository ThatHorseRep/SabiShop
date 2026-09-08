import { useEffect, useRef, useState } from 'react'
import { AuthorizationError } from '../auth/server'
import { IntegrityError } from '../domain/returnsCorrections'
import { PurchasingError } from '../domain/purchasing'
import { CashReconciliationError } from '../domain/cashReconciliation'
import { Button } from '../ui'
import type { WorkspaceTabId } from './exceptionsController'
import {
  ExceptionsController,
  exceptionActors,
  type ExceptionActorId,
} from './exceptionsController'
import { ReviewSection } from './ReviewSection'
import { ReturnsSection } from './ReturnsSection'
import { SupplierReturnsSection } from './SupplierReturnsSection'
import { CorrectionsSection } from './CorrectionsSection'
import { ReconciliationSection } from './ReconciliationSection'
import { HistorySection } from './HistorySection'
import { OperationFeedback } from './ExceptionsShared'
import './exceptions.css'

type Feedback = {
  tone: 'success' | 'error'
  title: string
  message: string
  savedState?: string
  nextStep?: string
}

type WorkspaceTab = {
  id: WorkspaceTabId
  label: string
}

/**
 * Domain-specific next-step guidance. Every failed operation explains what
 * happened, that nothing was saved, and the safest next action (C03 section
 * 27; C09 sections 46, 65, 77).
 */
function failureGuidance(error: unknown): {
  savedState: string
  nextStep: string
} {
  if (error instanceof AuthorizationError) {
    switch (error.decision.reason) {
      case 'permission_denied':
        return {
          savedState: 'Nothing was saved and no business state changed.',
          nextStep:
            'This action needs a different authority. Ask a Manager or the Owner to perform it.',
        }
      case 'self_approval_forbidden':
        return {
          savedState: 'Nothing was saved and no business state changed.',
          nextStep:
            'A separate Manager or Owner must approve this action; you cannot approve your own consequential work.',
        }
      case 'offline_not_allowed':
        return {
          savedState: 'Nothing was saved and no business state changed.',
          nextStep:
            'This action needs a connection and cannot be performed offline.',
        }
      default:
        return {
          savedState: 'Nothing was saved and no business state changed.',
          nextStep: error.message,
        }
    }
  }
  if (error instanceof IntegrityError) {
    switch (error.code) {
      case 'unauthorized_correction':
        return {
          savedState: 'Nothing was saved; the original record is unchanged.',
          nextStep:
            'This correction needs the required management authority. Ask a Manager or Owner.',
        }
      case 'reason_required':
        return {
          savedState: 'Nothing was saved.',
          nextStep: 'Enter a reason — every correction requires one.',
        }
      case 'dependent_event':
        return {
          savedState: 'Nothing was saved; the original record is unchanged.',
          nextStep:
            'A dependent return or reversal already exists. Resolve the resulting record instead of correcting the original.',
        }
      case 'illegal_transition':
        return {
          savedState: 'Nothing was saved.',
          nextStep:
            'The record is not in a state where this action is possible. Reopen the record to see its current state.',
        }
      case 'invalid_return':
        return {
          savedState: 'No return was recorded and the sale is unchanged.',
          nextStep:
            'Return lines must match the original sale, with positive quantities that do not exceed what was sold.',
        }
      case 'invalid_refund':
        return {
          savedState: 'No settlement was recorded.',
          nextStep: 'Only a due refund can be settled.',
        }
      default:
        return {
          savedState: 'Nothing was saved.',
          nextStep: error.message,
        }
    }
  }
  if (error instanceof PurchasingError) {
    return {
      savedState:
        'Nothing was saved; the purchase and its payable are unchanged.',
      nextStep: error.message,
    }
  }
  if (error instanceof CashReconciliationError) {
    switch (error.code) {
      case 'ACTUAL_CASH_REQUIRED':
        return {
          savedState: 'Nothing was saved.',
          nextStep:
            'A physical Actual Cash count is required before reconciliation can be prepared.',
        }
      case 'REASON_REQUIRED':
        return {
          savedState: 'Nothing was saved.',
          nextStep: 'A reason is required for this cash action.',
        }
      case 'DAY_CLOSED':
        return {
          savedState: 'Nothing was saved.',
          nextStep:
            'This business day is closed. Reopen it with a reason before recording new cash work.',
        }
      case 'INVALID_STATE':
        return {
          savedState: 'Nothing was saved.',
          nextStep:
            'The reconciliation is not in a state where this action is possible. Follow the count → prepare → confirm → close sequence.',
        }
      case 'FORBIDDEN':
        return {
          savedState: 'Nothing was saved.',
          nextStep: 'Only management may perform this cash action.',
        }
      default:
        return {
          savedState: 'Nothing was saved.',
          nextStep: error.message,
        }
    }
  }
  return {
    savedState: 'Nothing was saved. No business effect was confirmed.',
    nextStep:
      error instanceof Error
        ? error.message
        : 'Check the entered details and try again.',
  }
}

export function ExceptionsWorkspace({
  actorId,
  onActorChange,
}: {
  actorId: ExceptionActorId
  onActorChange: (actorId: ExceptionActorId) => void
}) {
  const controllerRef = useRef<ExceptionsController | null>(null)
  if (!controllerRef.current) {
    controllerRef.current = new ExceptionsController()
  }
  const controller = controllerRef.current
  const [, setVersion] = useState(0)
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('review')
  const [focusRecordId, setFocusRecordId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const snapshot = controller.snapshot()

  useEffect(() => {
    controller.setActor(actorId)
    setFeedback(null)
    setVersion((current) => current + 1)
  }, [actorId, controller])

  const refresh = () => setVersion((current) => current + 1)

  const runAction = async (
    title: string,
    action: () => Promise<string>,
  ): Promise<boolean> => {
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
    }
  }

  const openRecord = (tab: WorkspaceTabId, recordId: string) => {
    setActiveTab(tab)
    setFocusRecordId(recordId)
  }

  const tabs: WorkspaceTab[] = [
    {
      id: 'review',
      label: `Review${snapshot.review.length > 0 ? ` · ${snapshot.review.length}` : ''}`,
    },
    { id: 'returns', label: 'Sale returns' },
    { id: 'supplier-returns', label: 'Supplier returns' },
    { id: 'corrections', label: 'Corrections' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'history', label: 'History' },
  ]

  return (
    <section className="exceptions-app" aria-labelledby="exceptions-title">
      <header className="exceptions-header">
        <div>
          <h1 id="exceptions-title">Money &amp; Reconciliation</h1>
          <p>
            Exception work made deliberate: returns, corrections, reversals,
            refund settlement, and cash reconciliation — with the original
            record, the reason, the authorization, the consequence, and the
            resulting state always visible.
          </p>
        </div>
        <div className="exceptions-session">
          <label htmlFor="exceptions-actor">Reference session</label>
          <select
            id="exceptions-actor"
            value={actorId}
            onChange={(event) =>
              onActorChange(event.target.value as ExceptionActorId)
            }
          >
            {exceptionActors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.displayName} — {actor.role}
              </option>
            ))}
          </select>
          <p className="exceptions-session-help">
            Actions are authorized by role, permission, operation state, and
            approval requirements — never by screen visibility alone.
          </p>
        </div>
      </header>

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
        className="exceptions-tabs"
        role="tablist"
        aria-label="Exception workspaces"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className="exceptions-tab"
            onClick={() => {
              setActiveTab(tab.id)
              setFocusRecordId(null)
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        aria-label={
          tabs.find((tab) => tab.id === activeTab)?.label ?? 'Exception work'
        }
      >
        {activeTab === 'review' && (
          <ReviewSection
            controller={controller}
            snapshot={snapshot}
            runAction={runAction}
            onOpenRecord={openRecord}
          />
        )}
        {activeTab === 'returns' && (
          <ReturnsSection
            controller={controller}
            snapshot={snapshot}
            runAction={runAction}
            focusRecordId={focusRecordId}
          />
        )}
        {activeTab === 'supplier-returns' && (
          <SupplierReturnsSection
            controller={controller}
            snapshot={snapshot}
            runAction={runAction}
            focusRecordId={focusRecordId}
          />
        )}
        {activeTab === 'corrections' && (
          <CorrectionsSection
            controller={controller}
            snapshot={snapshot}
            runAction={runAction}
            focusRecordId={focusRecordId}
          />
        )}
        {activeTab === 'reconciliation' && (
          <ReconciliationSection
            controller={controller}
            snapshot={snapshot}
            runAction={runAction}
          />
        )}
        {activeTab === 'history' && <HistorySection snapshot={snapshot} />}
      </div>

      <footer className="exceptions-footer">
        <p className="ui-text-caption ui-text-secondary">
          Corrections and returns are recorded as events linked to the original
          record. Nothing in this workspace deletes or silently overwrites
          business history.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFeedback(null)
            setFocusRecordId(null)
            refresh()
          }}
        >
          Refresh state
        </Button>
      </footer>
    </section>
  )
}
