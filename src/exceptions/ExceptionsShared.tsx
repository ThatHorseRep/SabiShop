import type { ReactNode } from 'react'
import { ArrowRight, Minus, Plus } from '@phosphor-icons/react'
import { formatKobo } from '../ui/format'
import type { SaleExceptionView } from './exceptionsController'
import { formatDateTime } from './exceptionsFormat'

export type ExceptionChipTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'correction'
  | 'conflict'
  | 'pending'
  | 'offline'
  | 'integrity'

/**
 * Compact state chip with a non-color marker. State is never communicated
 * by color alone (C03 sections 11, 49).
 */
export function StateChip({
  tone,
  label,
  title,
}: {
  tone: ExceptionChipTone
  label: string
  title?: string
}) {
  const marker =
    tone === 'success'
      ? '✓'
      : tone === 'danger' || tone === 'integrity'
        ? '!'
        : tone === 'warning'
          ? '⚠'
          : tone === 'info'
            ? 'i'
            : tone === 'correction'
              ? '↺'
              : tone === 'conflict'
                ? '⇄'
                : tone === 'pending'
                  ? '…'
                  : tone === 'offline'
                    ? '○'
                    : '•'
  return (
    <span className={`exceptions-chip ${tone}`} title={title}>
      <span aria-hidden="true">{marker}</span>
      {label}
    </span>
  )
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  id,
}: {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section className={`exceptions-panel ${className ?? ''}`} id={id}>
      {(title || actions) && (
        <div className="exceptions-panel-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && (
              <p className="exceptions-panel-subtitle">{description}</p>
            )}
          </div>
          {actions && <div className="exceptions-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/** Derived UX state for a sale (C09 sections 8-9). */
export function SaleStateChip({ view }: { view: SaleExceptionView }) {
  switch (view.derivedState) {
    case 'reversed':
      return <StateChip tone="correction" label="Completed — Reversed" />
    case 'fully_returned':
      return <StateChip tone="success" label="Completed — Fully returned" />
    case 'partially_returned':
      return <StateChip tone="info" label="Completed — Partially returned" />
    default:
      return <StateChip tone="neutral" label="Completed" />
  }
}

/** Definition-list metric with an explicit currency label (C03 section 9). */
export function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'warning' | 'danger' | 'success'
}) {
  return (
    <div className={`exceptions-metric ${tone ?? 'default'}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <p className="exceptions-metric-hint">{hint}</p>}
    </div>
  )
}

export function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="exceptions-detail-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Signed kobo amount with an explicit direction marker. */
export function MoneyDelta({ amountKobo }: { amountKobo: number }) {
  if (amountKobo === 0) return <span>₦{formatKobo(0)}</span>
  const positive = amountKobo > 0
  return (
    <span
      className={
        positive ? 'exceptions-delta positive' : 'exceptions-delta negative'
      }
    >
      {positive ? (
        <Plus size={13} weight="bold" aria-hidden="true" />
      ) : (
        <Minus size={13} weight="bold" aria-hidden="true" />
      )}
      ₦{formatKobo(Math.abs(amountKobo))}
    </span>
  )
}

/**
 * Consequence preview list (C09 section 74). Effects are stated in business
 * language before commitment; exact calculations belong to the domain logic.
 */
export function ConsequenceList({
  effects,
  emptyLabel,
}: {
  effects: readonly string[]
  emptyLabel?: string
}) {
  if (effects.length === 0) {
    return emptyLabel ? (
      <p className="ui-text-body-sm ui-text-secondary">{emptyLabel}</p>
    ) : null
  }
  return (
    <ul className="exceptions-effects">
      {effects.map((effect) => (
        <li key={effect}>
          <ArrowRight size={14} weight="bold" aria-hidden="true" />
          {effect}
        </li>
      ))}
    </ul>
  )
}

/**
 * Original versus accepted-state comparison. Corrections never look like
 * deletion or overwrite: both states stay visible and recoverable
 * (C03 sections 30, 60; B08 section 2).
 */
export function OriginalVersusCurrent({
  original,
  current,
  originalLabel = 'Original record',
  currentLabel = 'Current accepted state',
}: {
  original: ReactNode
  current: ReactNode
  originalLabel?: string
  currentLabel?: string
}) {
  return (
    <div className="exceptions-compare">
      <div className="exceptions-compare__side">
        <h4>{originalLabel}</h4>
        <div className="exceptions-compare__body">{original}</div>
        <p className="exceptions-compare__hint">
          Preserved as historical evidence. It is never deleted.
        </p>
      </div>
      <div className="exceptions-compare__arrow" aria-hidden="true">
        <ArrowRight size={18} weight="bold" />
      </div>
      <div className="exceptions-compare__side">
        <h4>{currentLabel}</h4>
        <div className="exceptions-compare__body">{current}</div>
      </div>
    </div>
  )
}

/**
 * Human-readable audit timeline (C03 sections 31-32; C09 section 72). The
 * raw technical log is never the primary experience.
 */
export function TimelineList({ entries }: { entries: ReactNode[] }) {
  return (
    <ol className="exceptions-timeline">
      {entries.map((entry, index) => (
        <li key={index}>{entry}</li>
      ))}
    </ol>
  )
}

export function TimelineEntry({
  at,
  title,
  actor,
  reason,
  detail,
}: {
  at: string
  title: string
  actor?: string
  reason?: string
  detail?: string
}) {
  return (
    <div className="exceptions-timeline-entry">
      <div className="exceptions-timeline-entry__head">
        <time dateTime={at}>{formatDateTime(at)}</time>
        <strong>{title}</strong>
      </div>
      {actor && <p className="exceptions-timeline-entry__meta">by {actor}</p>}
      {reason && (
        <p className="exceptions-timeline-entry__reason">Reason: {reason}</p>
      )}
      {detail && <p className="exceptions-timeline-entry__detail">{detail}</p>}
    </div>
  )
}

/** Authority note explaining why a control exists (C03 section 29). */
export function AuthorizationNote({ children }: { children: ReactNode }) {
  return (
    <div className="exceptions-auth-note">
      <strong>Authorization</strong>
      <p>{children}</p>
    </div>
  )
}

/**
 * Feedback for consequential operations. Every error explains what happened,
 * whether anything was saved, and what to do next (C03 section 27; C09
 * sections 46, 65, 77).
 */
export function OperationFeedback({
  tone,
  title,
  message,
  savedState,
  nextStep,
}: {
  tone: 'success' | 'error'
  title: string
  message: string
  savedState?: string
  nextStep?: string
}) {
  return (
    <div
      className={`exceptions-feedback ${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <strong>{title}</strong>
      <p>{message}</p>
      {savedState && <p>{savedState}</p>}
      {nextStep && <p>{nextStep}</p>}
    </div>
  )
}
