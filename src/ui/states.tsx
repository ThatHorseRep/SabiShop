import { type ReactNode } from 'react'
import { LockKey, ShieldSlash } from '@phosphor-icons/react'
import { useLanguage } from '../language'
import { StateMessage } from './StateMessage'

/**
 * Loading placeholder that preserves layout. Not a whole-app spinner:
 * the shell and local context remain visible (C03 section 35, C04 section 56).
 */
export function LoadingState({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="neutral"
      title={title ?? t('loading.generic')}
      description={description}
    />
  )
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
  title,
  description,
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="danger"
      title={title ?? t('error.generic.title')}
      description={description ?? t('error.generic.description')}
      actions={action}
    />
  )
}

/** No session / no business context yet. */
export function AuthorizationRequiredState({ message }: { message?: string }) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="info"
      icon={<LockKey size={22} weight="bold" aria-hidden="true" />}
      title={t('authorization.required.title')}
      description={message ?? t('authorization.signInBusiness')}
    />
  )
}

/** The current user may not perform this operation (C04 section 45). */
export function PermissionDeniedState({ message }: { message?: string }) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="warning"
      icon={<ShieldSlash size={22} weight="bold" aria-hidden="true" />}
      title={t('error.permission.title')}
      description={message ?? t('error.permission.description')}
    />
  )
}

/** Offline is a mode of operation, not a failure (C00 section 12). */
export function OfflineState({ description }: { description?: string }) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="offline"
      title={t('offline.title')}
      description={description ?? t('offline.description')}
    />
  )
}

/** Locally recorded work awaiting synchronization (C03 section 38). */
export function SyncPendingState({ description }: { description?: string }) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="offline"
      title={`Recorded · ${t('sync.pending.title')}`}
      description={description ?? t('sync.pending.description')}
    />
  )
}

/** Sync conflict: deliberate review, never casual overwrite (C03 section 39). */
export function SyncConflictState({ description }: { description?: string }) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="conflict"
      title={t('sync.conflict.title')}
      description={description ?? t('sync.conflict.description')}
    />
  )
}

/** A record needs a correction before it can proceed (C03 section 30). */
export function CorrectionRequiredState({
  description,
}: {
  description: string
}) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="correction"
      title={t('correction.required.title')}
      description={description}
    />
  )
}

/** Rejected decision; no corresponding business effect was applied (C02). */
export function RejectedState({ description }: { description?: string }) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="danger"
      title={t('authorization.rejected.title')}
      description={description ?? t('authorization.rejected.description')}
    />
  )
}

/** Completed business state with optional derived presentation label. */
export function CompletedState({
  label,
  description,
}: {
  label?: string
  description?: string
}) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="success"
      title={label ?? t('common.completed')}
      description={description}
    />
  )
}

/** Cancelled task; nothing was committed. */
export function CancelledState({ description }: { description?: string }) {
  const { t } = useLanguage()
  return (
    <StateMessage
      tone="danger"
      title={t('common.cancelled')}
      description={description ?? t('common.cancelledDescription')}
    />
  )
}
