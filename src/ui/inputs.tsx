import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'

type FieldOwnProps = {
  label: string
  hint?: string
  error?: string
  children: (ids: {
    id: string
    describedBy: string | undefined
    invalid: boolean
  }) => ReactNode
}

/**
 * Field wrapper wiring label, hint, and validation to a control.
 * Forms are structured around the user's task, not the data model
 * (C03 sections 19-20).
 */
export function Field({ label, hint, error, children }: FieldOwnProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={id}>
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && (
        <p className="ui-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="ui-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}

type TextInputOwnProps = {
  invalid?: boolean
}

export type TextInputProps = TextInputOwnProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-invalid'>

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ invalid, className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={className ?? 'ui-input'}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    )
  },
)

/** Currency entry with explicit naira context (C03 sections 9, 56). */
export const CurrencyInput = forwardRef<HTMLInputElement, TextInputProps>(
  function CurrencyInput({ invalid, className, ...rest }, ref) {
    return (
      <div
        className={
          className?.includes('ui-input-group') ? className : 'ui-input-group'
        }
      >
        <span className="ui-input-group__addon" aria-hidden="true">
          ₦
        </span>
        <input
          ref={ref}
          className="ui-input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={invalid || undefined}
          {...rest}
        />
      </div>
    )
  },
)

export const SearchInput = forwardRef<HTMLInputElement, TextInputProps>(
  function SearchInput({ invalid, className, ...rest }, ref) {
    return (
      <div
        className={
          className?.includes('ui-input-group') ? className : 'ui-input-group'
        }
      >
        <span className="ui-input-group__addon">
          <MagnifyingGlass size={16} aria-hidden="true" />
        </span>
        <input
          ref={ref}
          className="ui-input"
          type="search"
          aria-invalid={invalid || undefined}
          {...rest}
        />
      </div>
    )
  },
)

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'aria-invalid'
> & {
  invalid?: boolean
  options: ReadonlyArray<{ value: string; label: string }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ invalid, options, placeholder, className, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={className ?? 'ui-select'}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  },
)

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'aria-invalid'
> & {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={className ?? 'ui-textarea'}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    )
  },
)

type ChoiceOwnProps = {
  label: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'>

export const Checkbox = forwardRef<HTMLInputElement, ChoiceOwnProps>(
  function Checkbox({ label, className, ...rest }, ref) {
    return (
      <label className={className ?? 'ui-choice'}>
        <input ref={ref} type="checkbox" {...rest} />
        <span className="ui-choice__label">{label}</span>
      </label>
    )
  },
)

export const Radio = forwardRef<HTMLInputElement, ChoiceOwnProps>(
  function Radio({ label, className, ...rest }, ref) {
    return (
      <label className={className ?? 'ui-choice'}>
        <input ref={ref} type="radio" {...rest} />
        <span className="ui-choice__label">{label}</span>
      </label>
    )
  },
)
