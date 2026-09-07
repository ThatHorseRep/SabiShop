import type {
  CreditHistoryEvent,
  CreditStatus,
  DebtState,
} from '../domain/customersCredit'
import { formatKobo } from '../ui/format'

/** Parses naira text entry into integer kobo; null when invalid. */
export function parseNairaToMinor(text: string): bigint | null {
  const trimmed = text.trim().replace(/,/g, '')
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return null
  const [whole, fraction = ''] = trimmed.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0') || '0')
}

/** Nearest-kobo display for debt figures (C08 section 69). */
export function formatDebt(amountMinor: bigint): string {
  return amountMinor < 0n
    ? `−₦${formatKobo(-amountMinor)}`
    : `₦${formatKobo(amountMinor)}`
}

/** Exact naira text for prefilling amount inputs from integer kobo. */
export function minorToNairaText(amountMinor: bigint): string {
  const negative = amountMinor < 0n
  const absolute = negative ? -amountMinor : amountMinor
  const whole = absolute / 100n
  const kobo = (absolute % 100n).toString().padStart(2, '0')
  const text = kobo === '00' ? whole.toString() : `${whole}.${kobo}`
  return negative ? `-${text}` : text
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Credit statuses use the exact B03 concepts. They are never replaced with
 * vague labels such as “good customer” or “bad customer” (C08 section 9).
 */
export function creditStatusView(status: CreditStatus): {
  tone: 'success' | 'warning' | 'danger'
  label: string
  description: string
} {
  switch (status) {
    case 'allowed':
      return {
        tone: 'success',
        label: 'Credit allowed',
        description:
          'Credit is permitted for this customer, subject to the credit limit and the required authorization.',
      }
    case 'restricted':
      return {
        tone: 'warning',
        label: 'Credit restricted',
        description:
          'Credit use requires additional management handling. A salesperson must not decide this themselves.',
      }
    default:
      return {
        tone: 'danger',
        label: 'Credit blocked',
        description: 'This customer cannot complete an ordinary credit sale.',
      }
  }
}

/** Debt states distinguish paid, written-off, disputed, and corrected ends. */
export function debtStateView(state: DebtState): {
  tone:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'correction'
    | 'conflict'
  label: string
} {
  switch (state) {
    case 'outstanding':
      return { tone: 'info', label: 'Outstanding' }
    case 'partially_repaid':
      return { tone: 'warning', label: 'Partially repaid' }
    case 'paid':
      return { tone: 'success', label: 'Paid' }
    case 'cleared_by_return':
      return { tone: 'success', label: 'Cleared by return' }
    case 'cleared_by_correction':
      return { tone: 'correction', label: 'Cleared by correction' }
    case 'written_off':
      return { tone: 'neutral', label: 'Written off' }
    case 'reversed':
      return { tone: 'correction', label: 'Reversed' }
  }
}

/** Human labels for the append-only credit history vocabulary (C08 §29). */
export function historyEventView(event: CreditHistoryEvent): {
  label: string
  description: string
} {
  switch (event.type) {
    case 'customer.created':
      return {
        label: 'Customer created',
        description: 'The minimum credit record (name and phone) was added.',
      }
    case 'customer.credit_status_changed':
      return {
        label: 'Credit status changed',
        description:
          event.reason?.trim() ||
          'Management changed this customer’s credit status.',
      }
    case 'customer.credit_limit_changed':
      return {
        label: 'Credit limit changed',
        description:
          event.amountMinor !== undefined
            ? `New credit limit ₦${formatKobo(event.amountMinor)}.`
            : 'Management changed this customer’s credit limit.',
      }
    case 'credit.sale.recorded':
      return {
        label: 'Credit sale recorded',
        description:
          `Authorized credit sale ${event.saleId ?? ''} created debt ${event.debtId ?? ''}.`.trim(),
      }
    case 'credit.repayment.recorded':
      return {
        label: 'Repayment recorded',
        description:
          `Confirmed repayment ${event.referenceId ?? ''} reduced outstanding debt.`.trim(),
      }
    case 'credit.return.recorded':
      return {
        label: 'Approved return on credit sale',
        description:
          'An approved return reduced the resulting obligation. The original sale is unchanged.',
      }
    case 'credit.write_off.recorded':
      return {
        label: 'Write-off recorded',
        description:
          'Management forgave part or all of this debt. The original debt remains visible.',
      }
    case 'credit.correction.recorded':
      return {
        label: 'Credit sale corrected',
        description:
          'An authorized correction changed the obligation. The original state remains recoverable.',
      }
    case 'credit.sale.reversed':
      return {
        label: 'Credit sale reversed',
        description:
          'The remaining obligation was reversed. Repayments already received remain in history.',
      }
    case 'credit.dispute.recorded':
      return {
        label: 'Dispute recorded',
        description: 'The debt remains visible while it is investigated.',
      }
    case 'credit.dispute.resolved':
      return {
        label: 'Dispute resolved',
        description:
          event.resolution ||
          'Management resolved the dispute and recorded the outcome.',
      }
  }
}

export function repaymentMethodLabel(
  method: 'cash' | 'bank_transfer' | 'pos_card' | 'custom',
): string {
  switch (method) {
    case 'cash':
      return 'Cash'
    case 'bank_transfer':
      return 'Bank transfer'
    case 'pos_card':
      return 'POS / Card'
    default:
      return 'Custom method'
  }
}
