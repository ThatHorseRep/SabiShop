import { type ReactNode } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import { useLanguage } from '../language'
import { Button, type ButtonVariant } from './Button'
import { Field, Textarea } from './inputs'

type ConfirmationPanelProps = {
  /** What will happen, in business terms. */
  action: string
  /** The record or object being changed. */
  record: ReactNode
  /** Expected downstream effects before commitment (C02-DEC-04). */
  effects: readonly string[]
  /** Why authorization is required, when it is. */
  authorizationNote?: string
  /** Mandatory correction reason, when the business rule requires one (B08). */
  reasonLabel?: string
  reasonValue?: string
  onReasonChange?: (value: string) => void
  confirmLabel: string
  confirmVariant?: ButtonVariant
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

/**
 * Deliberate confirmation surface for consequential work: action, affected
 * record, expected effects, reason, and authorization are visible before
 * commitment (C03 sections 28-30). Correction never resembles deletion.
 */
export function ConfirmationPanel({
  action,
  record,
  effects,
  authorizationNote,
  reasonLabel,
  reasonValue,
  onReasonChange,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmationPanelProps) {
  const { t } = useLanguage()
  const reasonRequired = Boolean(reasonLabel)
  const reasonMissing = reasonRequired && !reasonValue?.trim()
  const reasonText = reasonLabel ?? t('correction.reasonLabel')

  return (
    <div className="ui-confirmation">
      <p className="ui-text-body">{action}</p>
      <div className="ui-confirmation__record">{record}</div>
      {effects.length > 0 && (
        <ul className="ui-confirmation__effects">
          {effects.map((effect) => (
            <li key={effect}>
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
              {effect}
            </li>
          ))}
        </ul>
      )}
      {authorizationNote && (
        <p className="ui-text-caption">{authorizationNote}</p>
      )}
      {reasonRequired && (
        <Field
          label={reasonText}
          hint={t('correction.reasonHint')}
          error={reasonMissing ? t('correction.reasonRequired') : undefined}
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={reasonValue ?? ''}
              onChange={(event) => onReasonChange?.(event.target.value)}
            />
          )}
        </Field>
      )}
      <div className="ui-confirmation__actions">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          {t('common.cancel')}
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          loading={busy}
          disabled={reasonMissing}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
