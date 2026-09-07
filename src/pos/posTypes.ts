import type { PaymentMethod } from '../domain/sales'
import type { TaxMode } from '../domain/finance'

export type DraftDiscount = {
  kind: 'percentage' | 'fixed'
  value: number
  reason?: string
}

export type LineApproval = {
  approverId: string
  approverName: string
  approverRole: 'manager' | 'owner'
  reason: string
}

export type DraftLine = {
  lineId: string
  productId: string
  productSku: string
  productName: string
  quantity: number
  /** Entered price override; undefined keeps the current selling price. */
  unitPriceKobo?: number
  discount?: DraftDiscount
  pricingApproval?: LineApproval
  stockExceptionApproval?: LineApproval
}

export type PaymentDraftState = 'unconfirmed' | 'confirmed' | 'failed'

export type PaymentDraft = {
  id: string
  method: PaymentMethod
  customMethodId?: string
  customLabel?: string
  amountKobo: number
  /** Raw amount entry; parsed into amountKobo on change (C06 section 31). */
  amountText: string
  state: PaymentDraftState
  confirmedBy?: string
  confirmedAt?: string
  externalReference?: string
}

export type SelectedCustomer = {
  id: string
  name: string
  phone: string
  creditStatus: 'allowed' | 'restricted' | 'blocked'
  outstandingKobo: number
  creditLimitKobo?: number
}

export type TaxOption = {
  id: string
  label: string
  rateBasisPoints: bigint
  mode: TaxMode
}

export const taxOptions: readonly TaxOption[] = [
  { id: 'none', label: 'No VAT', rateBasisPoints: 0n, mode: 'exclusive' },
  {
    id: 'vat-exclusive',
    label: 'VAT 7.5% (added)',
    rateBasisPoints: 750n,
    mode: 'exclusive',
  },
  {
    id: 'vat-inclusive',
    label: 'VAT 7.5% (included)',
    rateBasisPoints: 750n,
    mode: 'inclusive',
  },
]

export type ApprovalKind =
  'below_floor' | 'free_sale' | 'stock_exception' | 'credit' | 'over_limit'

export type PendingApproval = {
  kind: ApprovalKind
  title: string
  /** What the approval will allow, in business terms (C06 section 65). */
  action: string
  effects: readonly string[]
  amountKobo?: number
  lineId?: string
  creditCustomerId?: string
  requiresSecondApprover?: boolean
}
