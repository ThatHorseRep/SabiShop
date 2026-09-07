import { type ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { IconButton } from './Button'
import { statusIconFor } from './statusIcons'
import type { StatusTone } from './tones'
import type { Toast } from './useToasts'

/** Inline alert: what happened, why it matters, what can be done (C03 section 27). */
export function Alert({
  tone = 'info',
  icon,
  title,
  children,
  action,
}: {
  tone?: StatusTone
  icon?: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      className={`ui-alert ui-alert--${tone}`}
      role={tone === 'danger' || tone === 'integrity' ? 'alert' : 'status'}
    >
      <span className="ui-alert__icon">{statusIconFor(tone, icon)}</span>
      <div className="ui-alert__content">
        <span className="ui-alert__title">{title}</span>
        {children && <div className="ui-alert__body">{children}</div>}
        {action && <div className="ui-alert__action">{action}</div>}
      </div>
    </div>
  )
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: readonly Toast[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="ui-toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`ui-toast ui-toast--${toast.tone}`}>
          <div className="ui-toast__content">
            <span className="ui-toast__title">{toast.title}</span>
            {toast.description && (
              <span className="ui-toast__description">{toast.description}</span>
            )}
          </div>
          <IconButton
            label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </IconButton>
        </div>
      ))}
    </div>
  )
}
