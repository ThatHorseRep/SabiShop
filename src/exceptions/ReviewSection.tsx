import { Button, EmptyState } from '../ui'
import type { ExceptionsController } from './exceptionsController'
import type { ExceptionsSnapshot, ReviewItemView } from './exceptionsController'
import { DetailRow, Panel, StateChip } from './ExceptionsShared'
import { formatDateTime } from './exceptionsFormat'

export function ReviewSection({
  controller,
  snapshot,
  runAction,
  onOpenRecord,
}: {
  controller: ExceptionsController
  snapshot: ExceptionsSnapshot
  runAction: (title: string, action: () => Promise<string>) => Promise<boolean>
  onOpenRecord: (tab: ReviewItemView['target']['tab'], recordId: string) => void
}) {
  if (snapshot.review.length === 0) {
    return (
      <Panel
        title="Review queue"
        description="Consequential unresolved work from returns, corrections, refunds, supplier returns, and reconciliation."
      >
        <EmptyState
          title="Nothing waiting for review"
          description="Returns awaiting approval, refund settlements, supplier returns, owner-review flags, and cash discrepancies will appear here with their consequence and required authority."
        />
      </Panel>
    )
  }

  return (
    <div className="exceptions-section">
      <Panel
        title={`Review queue · ${snapshot.review.length}`}
        description="Each item shows what happened, why it needs attention, its consequence, and the authority required. Nothing here is a bare count."
      >
        <ul className="exceptions-review-list">
          {snapshot.review.map((item) => (
            <li key={item.id} className="exceptions-review-item">
              <div className="exceptions-review-item__head">
                <div>
                  <h3>{item.title}</h3>
                  <p className="ui-text-caption ui-text-secondary">
                    {formatDateTime(item.occurredAt)} · {item.affectedArea}
                  </p>
                </div>
                <StateChip tone={reviewTone(item)} label={reviewLabel(item)} />
              </div>
              <dl className="exceptions-details">
                <DetailRow label="What happened">{item.whatHappened}</DetailRow>
                <DetailRow label="Why it needs attention">
                  {item.whyAttention}
                </DetailRow>
                <DetailRow label="Consequence">{item.consequence}</DetailRow>
                <DetailRow label="Requested action">
                  {item.requestedAction}
                </DetailRow>
                <DetailRow label="Required authority">
                  {item.requiredAuthority}
                </DetailRow>
              </dl>
              <div className="exceptions-case__actions">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onOpenRecord(item.target.tab, item.target.recordId)
                  }
                >
                  Review
                </Button>
                {item.primaryAction && item.primaryAction.kind === 'verify' && (
                  <Button
                    size="sm"
                    disabled={!controller.can('return:approve')}
                    onClick={() =>
                      void runAction('Return verified', async () => {
                        await controller.verifySaleReturn(item.target.recordId)
                        return 'The original purchase is verified. Approval is still required before any effect is applied.'
                      })
                    }
                  >
                    Verify purchase
                  </Button>
                )}
                {item.primaryAction &&
                  item.primaryAction.kind === 'approve' && (
                    <Button
                      size="sm"
                      disabled={!controller.can('return:approve')}
                      title="Opens the approval screen with the condition choice."
                      onClick={() =>
                        onOpenRecord(item.target.tab, item.target.recordId)
                      }
                    >
                      Approve return
                    </Button>
                  )}
                {item.primaryAction && item.primaryAction.kind === 'apply' && (
                  <Button
                    size="sm"
                    disabled={!controller.can('supplier:return')}
                    onClick={() =>
                      void runAction('Supplier return applied', async () => {
                        await controller.applySupplierReturn(
                          item.target.recordId,
                        )
                        return 'The supplier return is applied and its stock effect is recorded.'
                      })
                    }
                  >
                    Apply return
                  </Button>
                )}
                {item.primaryAction && item.primaryAction.kind === 'settle' && (
                  <Button
                    size="sm"
                    disabled={!controller.can('return:process')}
                    title="Opens the settlement recording screen."
                    onClick={() =>
                      onOpenRecord(item.target.tab, item.target.recordId)
                    }
                  >
                    Record settlement
                  </Button>
                )}
                {item.primaryAction &&
                  item.primaryAction.kind === 'resolve' && (
                    <Button
                      size="sm"
                      disabled={!controller.can('cash:reconcile')}
                      title="Opens the discrepancy resolution screen."
                      onClick={() =>
                        onOpenRecord(item.target.tab, item.target.recordId)
                      }
                    >
                      Resolve discrepancy
                    </Button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

function reviewTone(item: ReviewItemView) {
  switch (item.kind) {
    case 'cash_discrepancy':
      return 'warning' as const
    case 'owner_review':
      return 'correction' as const
    case 'refund':
      return 'info' as const
    default:
      return 'pending' as const
  }
}

function reviewLabel(item: ReviewItemView) {
  switch (item.kind) {
    case 'sale_return':
      return 'Needs review'
    case 'supplier_return':
      return 'Needs review'
    case 'refund':
      return 'Settlement due'
    case 'owner_review':
      return 'Owner review'
    default:
      return 'Investigate'
  }
}
