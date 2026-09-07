import { useEffect, useRef, useState } from 'react'
import {
  ArrowsClockwise,
  Bell,
  CaretDown,
  SignOut,
  WarningOctagon,
  WifiHigh,
  WifiSlash,
} from '@phosphor-icons/react'
import { statusIconFor } from '../ui/statusIcons'
import type { StatusTone } from '../ui/tones'

export type ShellSystemState = {
  online: boolean
  pendingCount: number
  conflictCount: number
  storageUnavailable?: boolean
}

/**
 * Persistent, low-distraction system-state indicator (C04 sections 26-29).
 * Offline is presented as a mode of operation, never as a failure, and
 * locally recorded work is never labelled as failed.
 */
export function SystemStateIndicator({
  state,
  onActivate,
}: {
  state: ShellSystemState
  onActivate?: () => void
}) {
  let tone: StatusTone = 'success'
  let label = 'Online'
  let icon = <WifiHigh size={16} weight="bold" aria-hidden="true" />

  if (state.storageUnavailable) {
    tone = 'warning'
    label = 'Sync storage unavailable'
    icon = <WarningOctagon size={16} weight="bold" aria-hidden="true" />
  } else if (state.conflictCount > 0) {
    tone = 'conflict'
    label = `Conflict · ${state.conflictCount}`
  } else if (!state.online) {
    tone = 'offline'
    label = 'Offline'
    icon = <WifiSlash size={16} weight="bold" aria-hidden="true" />
  } else if (state.pendingCount > 0) {
    tone = 'offline'
    label = `Sync pending · ${state.pendingCount}`
    icon = <ArrowsClockwise size={16} weight="bold" aria-hidden="true" />
  }

  const content = (
    <>
      {statusIconFor(tone, icon)}
      <span>{label}</span>
    </>
  )

  if (onActivate) {
    return (
      <button
        type="button"
        className={`app-system-state app-system-state--${tone}`}
        onClick={onActivate}
      >
        {content}
      </button>
    )
  }
  return (
    <span
      className={`app-system-state app-system-state--${tone}`}
      role="status"
    >
      {content}
    </span>
  )
}

/**
 * Shell-level attention entry point for management work (C04 sections 24-25).
 * The count is derived from authoritative queues, never invented here.
 */
export function AttentionIndicator({
  count,
  onActivate,
}: {
  count: number
  onActivate?: () => void
}) {
  if (count <= 0) return null
  return (
    <button
      type="button"
      className="app-attention"
      onClick={onActivate}
      aria-label={`Attention: ${count} item${count === 1 ? '' : 's'} requiring review`}
    >
      <Bell size={16} weight="bold" aria-hidden="true" />
      <span className="app-attention__count">{count}</span>
    </button>
  )
}

export type ShellUser = {
  displayName: string
  roleLabel?: string
}

/** Account-level menu; business operations do not live here (C04 section 12). */
export function UserMenu({
  user,
  onSignOut,
}: {
  user: ShellUser | null
  onSignOut?: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) {
    return <span className="app-user-chip">Not signed in</span>
  }

  return (
    <div className="app-user" ref={rootRef}>
      <button
        type="button"
        className="app-user__button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="app-user__name">{user.displayName}</span>
        {user.roleLabel && (
          <span className="app-user__role">{user.roleLabel}</span>
        )}
        <CaretDown size={12} weight="bold" aria-hidden="true" />
      </button>
      {open && (
        <div className="app-user__menu" role="menu" aria-label="Account">
          <div className="app-user__menu-header">
            <span className="app-user__name">{user.displayName}</span>
            {user.roleLabel && (
              <span className="app-user__role">{user.roleLabel}</span>
            )}
          </div>
          {onSignOut && (
            <button
              type="button"
              role="menuitem"
              className="app-user__menu-item"
              onClick={onSignOut}
            >
              <SignOut size={16} aria-hidden="true" />
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  )
}
