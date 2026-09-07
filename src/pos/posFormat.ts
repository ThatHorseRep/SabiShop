import type { PaymentMethod } from '../domain/sales'

/** Parses naira text entry into integer kobo; null when invalid (C06 §31). */
export function parseNairaToKobo(text: string): number | null {
  const trimmed = text.trim().replace(/,/g, '')
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return null
  const [whole, fraction = ''] = trimmed.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0') || '0')
}

export function paymentMethodLabel(
  method: PaymentMethod,
  customLabel?: string,
): string {
  switch (method) {
    case 'cash':
      return 'Cash'
    case 'bank_transfer':
      return 'Bank transfer'
    case 'pos_card':
      return 'POS / Card'
    case 'customer_credit':
      return 'Customer credit'
    default:
      return customLabel ?? 'Custom payment'
  }
}
