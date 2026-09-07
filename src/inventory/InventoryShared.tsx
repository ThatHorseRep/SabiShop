import type { ReactNode } from 'react'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export function StatusChip({
  tone,
  label,
}: {
  tone: StatusTone
  label: string
}) {
  return (
    <span className={`inventory-status ${tone}`}>
      <span aria-hidden="true">
        {tone === 'success'
          ? '✓'
          : tone === 'danger'
            ? '!'
            : tone === 'warning'
              ? '⚠'
              : tone === 'info'
                ? 'i'
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
    <section className={`inventory-panel ${className ?? ''}`}>
      {(title || actions) && (
        <div className="inventory-panel-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && (
              <p className="inventory-row-subtitle">{description}</p>
            )}
          </div>
          {actions && <div className="inventory-actions">{actions}</div>}
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
    <div className="inventory-field">
      <label>
        {label}
        {children}
      </label>
      {help && <span className="inventory-field-help">{help}</span>}
      {error && <span className="inventory-field-error">{error}</span>}
    </div>
  )
}

export function StateMessage({
  tone,
  title,
  children,
}: {
  tone: 'info' | 'warning' | 'danger'
  title: string
  children: ReactNode
}) {
  return (
    <div className={`inventory-state-message ${tone}`}>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}

export function SourceLink({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" className="inventory-source-link" onClick={onClick}>
      {label}
    </button>
  )
}
