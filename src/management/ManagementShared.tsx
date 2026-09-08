import type { ReactNode } from 'react'
import { formatKobo } from '../ui/format'

export type ManagementChipTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'pending'
  | 'correction'

/**
 * Compact state chip with a non-color marker. State is never communicated
 * by color alone (C03 sections 11, 49).
 */
export function StateChip({
  tone,
  label,
  title,
}: {
  tone: ManagementChipTone
  label: string
  title?: string
}) {
  const marker =
    tone === 'success'
      ? '✓'
      : tone === 'danger'
        ? '!'
        : tone === 'warning'
          ? '⚠'
          : tone === 'info'
            ? 'i'
            : tone === 'pending'
              ? '…'
              : tone === 'correction'
                ? '↺'
                : '•'
  return (
    <span className={`management-chip ${tone}`} title={title}>
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
    <section className={`management-panel ${className ?? ''}`} id={id}>
      {(title || actions) && (
        <div className="management-panel-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && (
              <p className="management-panel-subtitle">{description}</p>
            )}
          </div>
          {actions && <div className="management-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/** Definition-list metric with explicit currency context (C03 section 9). */
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
    <div className={`management-metric ${tone ?? 'default'}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <p className="management-metric-hint">{hint}</p>}
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
    <div className="management-detail-row">
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
        positive ? 'management-delta positive' : 'management-delta negative'
      }
    >
      {positive ? '+' : '−'}₦{formatKobo(Math.abs(amountKobo))}
    </span>
  )
}

/** Trace note linking a figure to its source records (C01 section 25). */
export function TraceNote({ children }: { children: ReactNode }) {
  return (
    <p className="management-trace-note ui-text-caption ui-text-secondary">
      {children}
    </p>
  )
}
