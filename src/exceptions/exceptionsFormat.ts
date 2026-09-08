import { formatKobo } from '../ui/format'

export function formatMoneyKobo(amountKobo: number): string {
  return `₦${formatKobo(amountKobo)}`
}

export function formatSignedKobo(amountKobo: number): string {
  if (amountKobo === 0) return '₦0.00'
  return amountKobo > 0
    ? `+₦${formatKobo(amountKobo)}`
    : `−₦${formatKobo(Math.abs(amountKobo))}`
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

/** Parses naira text entry into integer kobo; null when invalid. */
export function parseNairaToKobo(text: string): number | null {
  const trimmed = text.trim().replace(/,/g, '')
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return null
  const [whole, fraction = ''] = trimmed.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0') || '0')
}
