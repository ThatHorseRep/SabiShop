import { useLanguage } from '../language'

export function Skeleton({
  variant = 'text',
  width,
}: {
  variant?: 'text' | 'title' | 'row' | 'block'
  width?: string
}) {
  return (
    <span
      className={`ui-skeleton ui-skeleton--${variant}`}
      style={width ? { width } : undefined}
      aria-hidden="true"
    />
  )
}

/**
 * Skeleton block that preserves the shape of predictable content so loading
 * does not cause layout shift (C03 section 35).
 */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  const { t } = useLanguage()
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-8)',
        width: '100%',
      }}
      role="status"
      aria-label={t('loading.generic')}
    >
      <Skeleton variant="title" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} variant="row" />
      ))}
    </div>
  )
}

/** Progress bar for meaningful long operations, not decorative movement. */
export function Progress({
  value,
  label,
}: {
  /** Percentage 0-100; omit for an indeterminate bar. */
  value?: number
  label: string
}) {
  const bounded =
    typeof value === 'number' ? Math.min(100, Math.max(0, value)) : undefined
  return (
    <div
      className="ui-progress"
      role="progressbar"
      aria-label={label}
      aria-valuenow={bounded}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={
          bounded === undefined
            ? 'ui-progress__bar ui-progress__bar--indeterminate'
            : 'ui-progress__bar'
        }
        style={bounded === undefined ? undefined : { width: `${bounded}%` }}
      />
    </div>
  )
}
