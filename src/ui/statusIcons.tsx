import { type ReactNode } from 'react'
import {
  ArrowUUpLeft,
  CheckCircle,
  Clock,
  Info,
  ShieldWarning,
  Warning,
  WarningOctagon,
  WifiSlash,
  XCircle,
} from '@phosphor-icons/react'
import type { StatusTone } from './tones'

export const toneIcons: Record<StatusTone, typeof CheckCircle> = {
  neutral: Info,
  success: CheckCircle,
  pending: Clock,
  warning: Warning,
  danger: XCircle,
  info: Info,
  offline: WifiSlash,
  conflict: WarningOctagon,
  integrity: ShieldWarning,
  correction: ArrowUUpLeft,
}

/** Shared icon resolution for status, badge, alert, and state surfaces. */
export function statusIconFor(tone: StatusTone, icon?: ReactNode, size = 16) {
  if (icon) return <>{icon}</>
  const Icon = toneIcons[tone]
  return <Icon size={size} weight="bold" aria-hidden="true" />
}
