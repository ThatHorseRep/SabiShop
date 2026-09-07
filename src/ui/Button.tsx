import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { CircleNotch } from '@phosphor-icons/react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export type ButtonSize = 'md' | 'sm'

type ButtonOwnProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner and blocks interaction while an action is processing. */
  loading?: boolean
  iconStart?: ReactNode
  iconEnd?: ReactNode
  children?: ReactNode
}

export type ButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

/**
 * Standard action control. Variants express action hierarchy; danger is
 * reserved for genuinely destructive consequences (C03 sections 17-18).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      iconStart,
      iconEnd,
      children,
      disabled,
      type = 'button',
      className,
      ...rest
    },
    ref,
  ) {
    const classes = [
      'ui-button',
      `ui-button--${variant}`,
      size === 'sm' ? 'ui-button--sm' : '',
      loading ? 'ui-button--loading' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? (
          <CircleNotch
            className="ui-button__spinner"
            size={16}
            weight="bold"
            aria-hidden="true"
          />
        ) : (
          iconStart
        )}
        {children}
        {!loading && iconEnd}
      </button>
    )
  },
)

type IconButtonProps = {
  label: string
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'>

/** Icon-only action; the label is always exposed accessibly. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, children, type = 'button', ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className="ui-icon-button"
        aria-label={label}
        title={label}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
