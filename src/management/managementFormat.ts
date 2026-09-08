import { formatKobo } from '../ui/format'

export function formatMoneyKobo(amountKobo: number | bigint): string {
  if (
    (typeof amountKobo === 'number' && amountKobo < 0) ||
    (typeof amountKobo === 'bigint' && amountKobo < 0n)
  ) {
    return `−₦${formatKobo(
      typeof amountKobo === 'bigint' ? -amountKobo : Math.abs(amountKobo),
    )}`
  }
  return `₦${formatKobo(amountKobo)}`
}

export function formatSignedKobo(amountKobo: number | bigint): string {
  const value =
    typeof amountKobo === 'bigint' ? amountKobo : BigInt(Math.round(amountKobo))
  if (value === 0n) return '₦0.00'
  return value > 0n ? `+₦${formatKobo(value)}` : `−₦${formatKobo(-value)}`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

/**
 * Inventory quantities are stored in base units (milli-units). Display keeps
 * the product-facing unit scale with up to three decimals (B06/H01).
 */
export function formatQuantity(baseUnits: bigint): string {
  const negative = baseUnits < 0n
  const absolute = negative ? -baseUnits : baseUnits
  const whole = absolute / 1000n
  const fraction = (absolute % 1000n).toString().padStart(3, '0')
  const trimmed = fraction.replace(/0+$/, '')
  const value = trimmed
    ? `${whole.toLocaleString('en-NG')}.${trimmed}`
    : whole.toLocaleString('en-NG')
  return negative ? `−${value}` : value
}

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash':
      return 'Cash'
    case 'bank_transfer':
      return 'Transfer'
    case 'pos_card':
      return 'POS / Card'
    case 'customer_credit':
      return 'Credit'
    default:
      return 'Other'
  }
}
