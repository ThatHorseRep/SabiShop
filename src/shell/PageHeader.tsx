import { type ReactNode } from 'react'

/**
 * Consistent workspace header: title, short context, one primary action,
 * and secondary contextual actions (C04 sections 30-31). It is not a second
 * navigation system.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: ReactNode
}) {
  return (
    <header className="page-header">
      {breadcrumbs && (
        <nav className="page-header__breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs}
        </nav>
      )}
      <div className="page-header__row">
        <div className="page-header__heading">
          <h1 className="ui-text-h2">{title}</h1>
          {description && (
            <p className="ui-text-body-sm ui-text-secondary">{description}</p>
          )}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </header>
  )
}
