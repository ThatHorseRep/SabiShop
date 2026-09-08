import type { ReactNode } from 'react'

export type StaffChipTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'pending'
  | 'correction'
  | 'offline'
  | 'conflict'

/**
 * Compact state chip with a non-color marker. State is never communicated
 * by color alone (C03 sections 11, 49).
 */
export function StateChip({
  tone,
  label,
  title,
}: {
  tone: StaffChipTone
  label: string
  title?: string
}) {
  const marker =
    tone === 'success'
      ? '✓'
      : tone === 'danger' || tone === 'conflict'
        ? '!'
        : tone === 'warning'
          ? '⚠'
          : tone === 'info'
            ? 'i'
            : tone === 'correction'
              ? '↺'
              : tone === 'pending'
                ? '…'
                : tone === 'offline'
                  ? '○'
                  : '•'
  return (
    <span className={`staff-chip ${tone}`} title={title}>
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
    <section className={`staff-panel ${className ?? ''}`} id={id}>
      {(title || actions) && (
        <div className="staff-panel-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && (
              <p className="staff-panel-subtitle">{description}</p>
            )}
          </div>
          {actions && <div className="staff-actions">{actions}</div>}
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
    <div className={`staff-metric ${tone ?? 'default'}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <p className="staff-metric-hint">{hint}</p>}
    </div>
  )
}

/** Trace note linking a figure to its source records (C01 section 25). */
export function TraceNote({ children }: { children: ReactNode }) {
  return (
    <p className="staff-trace-note ui-text-caption ui-text-secondary">
      {children}
    </p>
  )
}

/** Operational note explaining a boundary the staff member relies on. */
export function BoundaryNote({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="staff-boundary-note">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  )
}
