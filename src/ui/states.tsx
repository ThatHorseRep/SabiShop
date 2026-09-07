import { type ReactNode } from 'react'
import { LockKey, ShieldSlash } from '@phosphor-icons/react'
import { StateMessage } from './StateMessage'

/**
 * Loading placeholder that preserves layout. Not a whole-app spinner:
 * the shell and local context remain visible (C03 section 35, C04 section 56).
 */
export function LoadingState({
  title = 'Loading',
  description,
}: {
  title?: string
  description?: string
}) {
  return <StateMessage tone="neutral" title={title} description={description} />
}

/** Empty state explaining the situation and the next action (C03 section 34). */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <StateMessage
      tone="neutral"
      title={title}
      description={description}
      actions={action}
    />
  )
}

/** Actionable error preserving safe entered data (C03 section 36). */
export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
}: {
  title?: string
  description: string
  action?: ReactNode
}) {
  return (
    <StateMessage
      tone="danger"
      title={title}
      description={description}
      actions={action}
    />
  )
}

/** No session / no business context yet. */
export function AuthorizationRequiredState({
  message = 'Sign in and choose a business before continuing.',
}: {
  message?: string
}) {
  return (
    <StateMessage
      tone="info"
      icon={<LockKey size={22} weight="bold" aria-hidden="true" />}
      title="Authorization required"
      description={message}
    />
  )
}

/** The current user may not perform this operation (C04 section 45). */
export function PermissionDeniedState({
  message = 'You do not have permission to perform this operation. Ask a manager or the business owner when this work is needed.',
}: {
  message?: string
}) {
  return (
    <StateMessage
      tone="warning"
      icon={<ShieldSlash size={22} weight="bold" aria-hidden="true" />}
      title="Permission denied"
      description={message}
    />
  )
}

/** Offline is a mode of operation, not a failure (C00 section 12). */
export function OfflineState({
  description = 'This device is offline. Supported work continues locally and will synchronize when the connection returns.',
}: {
  description?: string
}) {
  return (
    <StateMessage tone="offline" title="Offline" description={description} />
  )
}

/** Locally recorded work awaiting synchronization (C03 section 38). */
export function SyncPendingState({
  description = 'Recorded on this device. Synchronization is pending.',
}: {
  description?: string
}) {
  return (
    <StateMessage
      tone="offline"
      title="Recorded · Sync pending"
      description={description}
    />
  )
}

/** Sync conflict: deliberate review, never casual overwrite (C03 section 39). */
export function SyncConflictState({
  description = 'This record changed in more than one place. An authorized person must review both versions before the accepted state is decided.',
}: {
  description?: string
}) {
  return (
    <StateMessage
      tone="conflict"
      title="Sync conflict"
      description={description}
    />
  )
}

/** A record needs a correction before it can proceed (C03 section 30). */
export function CorrectionRequiredState({
  description,
}: {
  description: string
}) {
  return (
    <StateMessage
      tone="correction"
      title="Correction required"
      description={description}
    />
  )
}

/** Rejected decision; no corresponding business effect was applied (C02). */
export function RejectedState({
  description = 'This action was rejected. No corresponding business effect was applied.',
}: {
  description?: string
}) {
  return (
    <StateMessage tone="danger" title="Rejected" description={description} />
  )
}

/** Completed business state with optional derived presentation label. */
export function CompletedState({
  label = 'Completed',
  description,
}: {
  label?: string
  description?: string
}) {
  return <StateMessage tone="success" title={label} description={description} />
}

/** Cancelled task; nothing was committed. */
export function CancelledState({
  description = 'This action was cancelled. Nothing was committed.',
}: {
  description?: string
}) {
  return (
    <StateMessage tone="danger" title="Cancelled" description={description} />
  )
}
