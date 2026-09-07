import { type ReactNode } from 'react'

type ListItemProps = {
  icon?: ReactNode
  title: ReactNode
  meta?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  children?: ReactNode
}

/**
 * Compact record row for contextual lists and small screens.
 * Distinct from DataTable: one record per row, title-led scanning.
 */
export function ListItem({
  icon,
  title,
  meta,
  trailing,
  onClick,
  children,
}: ListItemProps) {
  const content = (
    <>
      {icon && (
        <span className="ui-list-item__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ui-list-item__body">
        <span className="ui-list-item__title">{title}</span>
        {meta && <span className="ui-list-item__meta">{meta}</span>}
        {children}
      </span>
      {trailing && <span className="ui-list-item__trailing">{trailing}</span>}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className="ui-list-item" onClick={onClick}>
        {content}
      </button>
    )
  }
  return <li className="ui-list-item">{content}</li>
}

export function DataList({ children }: { children: ReactNode }) {
  return <ul className="ui-list">{children}</ul>
}
