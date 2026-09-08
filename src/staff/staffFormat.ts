import { formatKobo } from '../ui/format'

export function formatMoneyKobo(amountKobo: number): string {
  return `₦${formatKobo(amountKobo)}`
}

export function formatMoneyMinor(amountMinor: bigint): string {
  return `₦${formatKobo(amountMinor)}`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
