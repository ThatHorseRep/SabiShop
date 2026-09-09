import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { X } from '@phosphor-icons/react'
import { useLanguage } from '../language'
import { IconButton } from './Button'

type OverlayBaseProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /**
   * Whether Escape and backdrop clicks may dismiss the overlay. Consequential
   * confirmations set this false so they cannot be dismissed accidentally.
   */
  dismissable?: boolean
}

function useNativeDialog(
  open: boolean,
  onClose: () => void,
  dismissable: boolean,
): RefObject<HTMLDialogElement | null> {
  const ref = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    if (!open) return
    const dialog = ref.current
    if (!dialog) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    if (typeof dialog.showModal === 'function') {
      dialog.showModal()
    } else {
      dialog.setAttribute('open', '')
    }
    return () => {
      if (typeof dialog.close === 'function') dialog.close()
      if (
        previouslyFocused &&
        previouslyFocused.isConnected &&
        typeof previouslyFocused.focus === 'function'
      ) {
        previouslyFocused.focus()
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const dialog = ref.current
    if (!dialog) return
    const onCancel = (event: Event) => {
      event.preventDefault()
      if (dismissable) onClose()
    }
    const onBackdropClick = (event: MouseEvent) => {
      if (dismissable && event.target === dialog) onClose()
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('click', onBackdropClick)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('click', onBackdropClick)
    }
  }, [open, dismissable, onClose])

  return ref
}

/**
 * Focused modal dialog for confirmations, authorization, and short contextual
 * actions. Large workflows use dedicated pages instead (C04 sections 55, 58.8).
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  dismissable = true,
}: OverlayBaseProps) {
  const ref = useNativeDialog(open, onClose, dismissable)
  const { t } = useLanguage()
  if (!open) return null
  return (
    <dialog ref={ref} className="ui-dialog" aria-label={title}>
      <div className="ui-dialog__panel">
        <header className="ui-dialog__header">
          <h2 className="ui-dialog__title">{title}</h2>
          {dismissable && (
            <IconButton label={t('common.closeDialog')} onClick={onClose}>
              <X size={16} weight="bold" aria-hidden="true" />
            </IconButton>
          )}
        </header>
        <div className="ui-dialog__body">{children}</div>
      </div>
    </dialog>
  )
}

/**
 * Contextual side panel for record-level work such as review queues and
 * mobile navigation. Bottom sheet presentation on small screens.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  dismissable = true,
}: OverlayBaseProps) {
  const ref = useNativeDialog(open, onClose, dismissable)
  const { t } = useLanguage()
  if (!open) return null
  return (
    <dialog ref={ref} className="ui-drawer" aria-label={title}>
      <div className="ui-drawer__panel">
        <header className="ui-drawer__header">
          <h2 className="ui-drawer__title">{title}</h2>
          {dismissable && (
            <IconButton label={t('common.closePanel')} onClick={onClose}>
              <X size={16} weight="bold" aria-hidden="true" />
            </IconButton>
          )}
        </header>
        <div className="ui-drawer__body">{children}</div>
      </div>
    </dialog>
  )
}
