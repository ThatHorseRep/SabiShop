import { type ReactNode } from 'react'
import { statusIconFor } from './statusIcons'
import type { StatusTone } from './tones'

type StateMessageProps = {
  tone?: StatusTone
  icon?: ReactNode
  title: string
  description?: string
  actions?: ReactNode
  centered?: boolean
}

/**
 * The shared surface for loading, empty, error, and operational states.
 * Every state names the situation and offers the next step where one exists
 * (C03 sections 34-40); none is a blank panel.
 */
export function StateMessage({
  tone = 'neutral',
  icon,
  title,
  description,
  actions,
  centered = true,
}: StateMessageProps) {
  return (
    <section
      className={
        centered
          ? `ui-state ui-state--centered ui-state--${tone}`
          : `ui-state ui-state--${tone}`
      }
      aria-labelledby={`state-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <span className="ui-state__icon">{statusIconFor(tone, icon, 22)}</span>
      <h3
        className="ui-state__title"
        id={`state-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {title}
      </h3>
      {description && <p className="ui-state__description">{description}</p>}
      {actions && <div className="ui-state__actions">{actions}</div>}
    </section>
  )
}
