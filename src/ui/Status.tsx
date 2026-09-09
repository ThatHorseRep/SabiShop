import { ArrowsClockwise, Prohibit } from '@phosphor-icons/react'
import { useLanguage } from '../language'
import { statusIconFor } from './statusIcons'
import type { ReactNode } from 'react'
import type { StatusTone } from './tones'

export type { StatusTone } from './tones'

/**
 * Status presentation: icon, label, and supporting explanation.
 * State is never communicated by color alone (C03 sections 24-26).
 */
export function Status({
  tone = 'neutral',
  icon,
  label,
  description,
}: {
  tone?: StatusTone
  icon?: ReactNode
  label: string
  description?: string
}) {
  return (
    <span className={`ui-status ui-status--${tone}`} role="status">
      {statusIconFor(tone, icon)}
      <span>
        {label}
        {description && (
          <span className="ui-status__description">{description}</span>
        )}
      </span>
    </span>
  )
}

/**
 * Compact badge for dense contexts. Use sparingly; badge overload hides
 * meaning (C03 section 26).
 */
export function Badge({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: StatusTone
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <span className={`ui-badge ui-badge--${tone}`}>
      {statusIconFor(tone, icon, 12)}
      {children}
    </span>
  )
}

/** Pending-sync presentation for locally recorded work (C03 section 38). */
export function SyncPendingStatus({ count }: { count?: number }) {
  const { t } = useLanguage()
  return (
    <Status
      tone="offline"
      icon={<ArrowsClockwise size={16} weight="bold" aria-hidden="true" />}
      label={
        count ? t('sync.pendingCount', { count }) : t('sync.pending.title')
      }
      description={t('offline.recorded')}
    />
  )
}

/** Cancelled / blocked outcome that applied no business effect. */
export function CancelledStatus({ label }: { label?: string }) {
  const { t } = useLanguage()
  return (
    <Status
      tone="danger"
      icon={<Prohibit size={16} weight="bold" aria-hidden="true" />}
      label={label ?? t('common.cancelled')}
    />
  )
}
