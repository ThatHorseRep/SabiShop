import { formatKobo } from './format'

type MoneyProps = {
  /** Amount in integer kobo (the canonical money representation). */
  amountKobo: bigint | number
  /** Signed amounts may be tinted; color never carries meaning alone. */
  signed?: boolean
  label?: string
}

/** Explicit currency display with tabular figures (C03 sections 9, 56). */
export function Money({ amountKobo, signed = false, label }: MoneyProps) {
  const value = formatKobo(amountKobo)
  const tone =
    signed && amountKobo < 0
      ? 'ui-money--negative'
      : signed && amountKobo > 0
        ? 'ui-money--positive'
        : undefined
  return (
    <span className={tone ? `ui-money ${tone}` : 'ui-money'}>
      {label ? `${label} ` : ''}₦{signed && amountKobo > 0 ? '+' : ''}
      {value}
    </span>
  )
}
