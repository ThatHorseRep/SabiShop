import type { ReactNode } from 'react'

export type ChipTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'correction'
  | 'conflict'

/**
 * Compact status chip with a non-color marker. State is never communicated
 * by color alone (C03 sections 11, 49).
 */
export function StatusChip({
  tone,
  label,
  title,
}: {
  tone: ChipTone
  label: string
  title?: string
}) {
  return (
    <span className={`customers-status ${tone}`} title={title}>
      <span aria-hidden="true">
        {tone === 'success'
          ? '✓'
          : tone === 'danger'
            ? '!'
            : tone === 'warning'
              ? '⚠'
              : tone === 'info'
                ? 'i'
                : tone === 'correction'
                  ? '↺'
                  : tone === 'conflict'
                    ? '⇄'
                    : '•'}
      </span>
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
}: {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`customers-panel ${className ?? ''}`}>
      {(title || actions) && (
        <div className="customers-panel-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && (
              <p className="customers-row-subtitle">{description}</p>
            )}
          </div>
          {actions && <div className="customers-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Field({
  label,
  help,
  error,
  children,
}: {
  label: string
  help?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="customers-field">
      <label>
        {label}
        {children}
      </label>
      {help && <span className="customers-field-help">{help}</span>}
      {error && (
        <span className="customers-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

/** Definition-list metric with an explicit currency label (C03 section 9). */
export function Metric({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <div className="customers-metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <p className="customers-metric-hint">{hint}</p>}
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
    <div className="customers-detail-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/**
 * Feedback for consequential operations. Every error explains what happened,
 * whether anything was saved, and what to do next (C03 section 27; C08
 * section 68).
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
      className={`customers-feedback ${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <strong>{title}</strong>
      <p>{message}</p>
      {savedState && <p className="customers-feedback-saved">{savedState}</p>}
      {nextStep && <p className="customers-feedback-next">{nextStep}</p>}
    </div>
  )
}
