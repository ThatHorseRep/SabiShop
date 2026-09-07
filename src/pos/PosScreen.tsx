import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ArrowsLeftRight,
  CreditCard,
  DeviceMobile,
  HandCoins,
  Minus,
  Money as MoneyIcon,
  PencilSimple,
  Plus,
  X,
} from '@phosphor-icons/react'
import { DomainError } from '../domain/catalogPricing'
import type { SaleLinePricingPreview } from '../domain/catalogPricing'
import { CustomersCreditError } from '../domain/customersCredit'
import { SalesError } from '../domain/sales'
import type { CompletedSale, PaymentMethod } from '../domain/sales'
import { Alert } from '../ui/Feedback'
import { Button, IconButton } from '../ui/Button'
import { CurrencyInput, Select, TextInput } from '../ui/inputs'
import { Money } from '../ui/Money'
import { Status } from '../ui/Status'
import { EmptyState } from '../ui/states'
import { formatKobo } from '../ui/format'
import {
  AbandonSaleDialog,
  ApprovalDialog,
  CustomerPickerDialog,
  LinePricingDialog,
} from './PosDialogs'
import { CompletionView } from './PosReceipt'
import { parseNairaToKobo, paymentMethodLabel } from './posFormat'
import type {
  CreditAssessment,
  PosController,
  ProductSearchResult,
} from './posController'
import {
  approvalCandidates,
  type ManagementActor,
  posActors,
  roleLabel,
  type PosSession,
} from './posSession'
import {
  taxOptions,
  type DraftDiscount,
  type DraftLine,
  type PendingApproval,
  type PaymentDraft,
  type SelectedCustomer,
} from './posTypes'

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

type LinePreviewState = {
  preview?: SaleLinePricingPreview
  error?: string
}

type CompletionBlocker = {
  kind: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

type MethodButton = {
  method: PaymentMethod
  customMethodId?: string
  label: string
  icon: ReactNode
}

function friendlyError(error: unknown): string {
  if (error instanceof DomainError) {
    switch (error.code) {
      case 'AUTHORIZATION_REQUIRED':
        return 'This sale needs Manager or Owner authorization before it can complete.'
      case 'PRICE_BELOW_FLOOR':
        return 'A price is below the configured floor. Approve the price exception first.'
      case 'INVALID_DISCOUNT':
        return 'A discount on this sale is not valid.'
      case 'INVALID_QUANTITY':
        return 'A quantity on this sale is not valid.'
      case 'PRODUCT_INACTIVE':
      case 'PRODUCT_UNAVAILABLE':
        return 'A product on this sale is no longer available for sale.'
      default:
        return 'The pricing on this sale was rejected. Nothing was recorded.'
    }
  }
  if (error instanceof SalesError) {
    switch (error.code) {
      case 'PAYMENT_NOT_CONFIRMED':
        return 'A payment is not confirmed. Only confirmed successful payments can complete a sale.'
      case 'INVALID_PAYMENT':
        return 'The payments must settle the total exactly. Adjust the amounts and try again.'
      case 'CREDIT_APPROVAL_REQUIRED':
        return 'Credit sales require separate Manager or Owner approval.'
      case 'CUSTOMER_REQUIRED':
        return 'Credit sales require a customer with a name and phone number.'
      default:
        return 'The sale could not be completed. Nothing was recorded.'
    }
  }
  if (error instanceof CustomersCreditError) {
    switch (error.code) {
      case 'CREDIT_NOT_ALLOWED':
        return 'This customer cannot complete an ordinary credit sale.'
      case 'OVER_LIMIT_EXCEPTION_REQUIRED':
        return 'This credit sale exceeds the configured limit and needs a management exception.'
      default:
        return 'The credit for this sale was rejected. Nothing was recorded.'
    }
  }
  return 'The sale could not be completed. Nothing was recorded.'
}

function stockLabel(sellableUnits: number): {
  tone: 'neutral' | 'warning' | 'danger'
  label: string
} {
  if (sellableUnits < 0)
    return { tone: 'danger', label: `Stock exception · ${sellableUnits}` }
  if (sellableUnits === 0) return { tone: 'warning', label: 'Out of stock' }
  return { tone: 'neutral', label: `${sellableUnits} in stock` }
}

/** Product discovery results (C06 sections 7-10). */
function ProductResultButton({
  result,
  onAdd,
}: {
  result: ProductSearchResult
  onAdd: (result: ProductSearchResult) => void
}) {
  const { product, stock } = result
  const sellableUnits = Number(stock.sellable / 1000n)
  const stockInfo = stockLabel(sellableUnits)
  return (
    <button
      type="button"
      className="pos-result"
      onClick={() => onAdd(result)}
      aria-label={`Add ${product.name}, ${formatKobo(product.sellingPriceKobo)}, ${stockInfo.label}`}
    >
      <span className="pos-result__identity">
        <span className="pos-result__name">{product.name}</span>
        <span className="ui-text-caption ui-text-mono">
          {product.sku}
          {product.modelOrPartNumber ? ` · ${product.modelOrPartNumber}` : ''}
        </span>
      </span>
      <span className="pos-result__trade">
        <Money amountKobo={product.sellingPriceKobo} />
        <span
          className={`pos-stock pos-stock--${stockInfo.tone}`}
          title={`Sellable stock: ${sellableUnits}`}
        >
          {stockInfo.label}
        </span>
      </span>
    </button>
  )
}

/** Payment component card with explicit confirmation states (C06 29-31). */
function PaymentCard({
  payment,
  confirmLabel,
  onAmountChange,
  onReferenceChange,
  onConfirm,
  onFail,
  onRetry,
  onRemove,
  amountError,
}: {
  payment: PaymentDraft
  confirmLabel: string
  onAmountChange: (text: string) => void
  onReferenceChange: (text: string) => void
  onConfirm: () => void
  onFail: () => void
  onRetry: () => void
  onRemove: () => void
  amountError?: boolean
}) {
  const label = paymentMethodLabel(payment.method, payment.customLabel)
  const needsReference =
    payment.method === 'bank_transfer' ||
    payment.method === 'pos_card' ||
    payment.method === 'custom'

  if (payment.state === 'confirmed') {
    return (
      <li className="pos-payment pos-payment--confirmed">
        <div className="pos-payment__head">
          <span className="pos-payment__label">{label}</span>
          <Status
            tone="success"
            label="Confirmed"
            description={`Confirmed by ${payment.confirmedBy ?? '—'}`}
          />
        </div>
        <span className="pos-payment__amount">
          <Money amountKobo={payment.amountKobo} />
        </span>
        {payment.externalReference && (
          <span className="ui-text-caption">
            Reference {payment.externalReference}
          </span>
        )}
        <div className="pos-payment__actions">
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </li>
    )
  }

  if (payment.state === 'failed') {
    return (
      <li className="pos-payment pos-payment--failed">
        <div className="pos-payment__head">
          <span className="pos-payment__label">{label}</span>
          <Status tone="danger" label="Payment failed" />
        </div>
        <span className="pos-payment__amount">
          <Money amountKobo={payment.amountKobo} />
        </span>
        <p className="ui-text-caption">
          This payment was not confirmed, so it is not recorded as a successful
          payment. The sale remains incomplete.
        </p>
        <div className="pos-payment__actions">
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Retry
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="pos-payment">
      <div className="pos-payment__head">
        <span className="pos-payment__label">{label}</span>
        <Status tone="pending" label="Not confirmed" />
      </div>
      <div className="pos-payment__entry">
        <span className="pos-payment__amount-label">Amount</span>
        <CurrencyInput
          aria-label={`Amount for ${label}`}
          value={payment.amountText}
          invalid={amountError}
          onChange={(event) => onAmountChange(event.target.value)}
        />
      </div>
      {needsReference && (
        <TextInput
          aria-label={`Reference for ${label}`}
          placeholder="Reference (optional)"
          value={payment.externalReference ?? ''}
          onChange={(event) => onReferenceChange(event.target.value)}
        />
      )}
      <div className="pos-payment__actions">
        <Button size="sm" onClick={onConfirm} disabled={amountError}>
          {confirmLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={onFail}>
          Mark as failed
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </li>
  )
}

/**
 * The POS workspace (C06 sections 4-78). Two persistent areas on desktop —
 * product discovery and the current sale — becoming one focused flow on
 * small screens with the sale state always reachable. All business rules
 * live in the domain engines; this screen presents, sequences, and explains.
 */
export function PosScreen({
  controller,
  session,
  online,
  onActorChange,
  onOperationsChanged,
  onSaleStateChange,
}: {
  controller: PosController
  session: PosSession
  online: boolean
  onActorChange: (actorId: string) => void
  onOperationsChanged: () => void
  onSaleStateChange: (state: {
    dirty: boolean
    itemCount: number
    totalKobo: number
  }) => void
}) {
  const [stage, setStage] = useState<'building' | 'processing' | 'completed'>(
    'building',
  )
  const [lines, setLines] = useState<DraftLine[]>([])
  const [customer, setCustomer] = useState<SelectedCustomer | undefined>()
  const [taxOptionId, setTaxOptionId] = useState('none')
  const [payments, setPayments] = useState<PaymentDraft[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [approval, setApproval] = useState<PendingApproval | undefined>()
  const [approvalDeclined, setApprovalDeclined] = useState<string | undefined>()
  const [completionError, setCompletionError] = useState<string | undefined>()
  const [completed, setCompleted] = useState<
    { sale: CompletedSale; operationId?: string } | undefined
  >()
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [pricingLineId, setPricingLineId] = useState<string | undefined>()
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [creditApproval, setCreditApproval] = useState<
    | {
        approver: ManagementActor
        reason: string
        amountKobo: number
        customerId: string
      }
    | undefined
  >()
  const [overLimitApproval, setOverLimitApproval] = useState<
    ManagementActor | undefined
  >()
  const clientRequestIdRef = useRef<string | undefined>(undefined)
  const paymentSectionRef = useRef<HTMLElement | null>(null)

  const taxOption =
    taxOptions.find((option) => option.id === taxOptionId) ?? taxOptions[0]

  const searchResults = useMemo(
    () => controller.searchProducts(searchQuery),
    [controller, searchQuery],
  )

  const linePreviews = useMemo(() => {
    const map = new Map<string, LinePreviewState>()
    for (const line of lines) {
      try {
        map.set(line.lineId, {
          preview: controller.previewLine({
            productId: line.productId,
            quantity: line.quantity,
            unitPriceKobo: line.unitPriceKobo,
            discount: line.discount,
          }),
        })
      } catch (error) {
        map.set(line.lineId, {
          error:
            error instanceof Error
              ? error.message
              : 'This line can no longer be priced.',
        })
      }
    }
    return map
  }, [controller, lines])

  const requestedByProduct = useMemo(() => {
    const totals = new Map<string, number>()
    for (const line of lines)
      totals.set(
        line.productId,
        (totals.get(line.productId) ?? 0) + line.quantity,
      )
    return totals
  }, [lines])

  const sellableFor = useCallback(
    (productId: string) =>
      Number(controller.engines.inventory.getStock(productId).sellable / 1000n),
    [controller],
  )

  const totals = useMemo(
    () =>
      controller.previewTotals(
        lines.map((line) => ({
          unitPriceKobo:
            linePreviews.get(line.lineId)?.preview?.actualUnitPriceKobo ?? 0,
          quantity: line.quantity,
        })),
        taxOption.rateBasisPoints,
        taxOption.mode,
      ),
    [controller, lines, linePreviews, taxOption],
  )

  const confirmedPayments = payments.filter(
    (payment) => payment.state === 'confirmed',
  )
  const settledKobo = confirmedPayments.reduce(
    (sum, payment) => sum + payment.amountKobo,
    0,
  )
  const remainingKobo = totals.totalDueKobo - settledKobo
  const creditPayment = payments.find(
    (payment) => payment.method === 'customer_credit',
  )
  const unconfirmedCount = payments.filter(
    (payment) => payment.state === 'unconfirmed',
  ).length
  const invalidAmounts = payments.filter(
    (payment) =>
      payment.state === 'unconfirmed' &&
      (parseNairaToKobo(payment.amountText) ?? 0) <= 0,
  )

  const creditAssessment: CreditAssessment | undefined = useMemo(() => {
    if (!creditPayment) return undefined
    return controller.assessCredit({
      customerId: customer?.id,
      amountKobo: creditPayment.amountKobo,
    })
  }, [controller, creditPayment, customer])

  const pricingLine =
    pricingLineId !== undefined
      ? (lines.find((line) => line.lineId === pricingLineId) ?? null)
      : null

  const discountTotalKobo = lines.reduce(
    (sum, line) =>
      sum +
      (linePreviews.get(line.lineId)?.preview?.discountKobo ?? 0) *
        line.quantity,
    0,
  )
  const itemsTotalKobo = totals.subtotalKobo + discountTotalKobo

  const openPricingApproval = useCallback(
    (line: DraftLine, preview: SaleLinePricingPreview) => {
      const free = preview.freeSale
      setApproval({
        kind: free ? 'free_sale' : 'below_floor',
        title: free ? 'Free sale approval' : 'Below-floor price approval',
        action: free
          ? `${line.productName} will be sold for ₦0.`
          : `${line.productName} will be sold at ${formatKobo(preview.actualUnitPriceKobo)}, below the floor of ${formatKobo(preview.effectiveFloorKobo)}.`,
        effects: [
          `Line total becomes ${formatKobo(preview.actualUnitPriceKobo * line.quantity)}.`,
          'The line is flagged for management review.',
          'The approver and reason are recorded with the sale.',
        ],
        amountKobo: preview.actualUnitPriceKobo * line.quantity,
        lineId: line.lineId,
      })
    },
    [],
  )

  const openStockExceptionApproval = useCallback(
    (line: DraftLine) => {
      const sellable = sellableFor(line.productId)
      const requested = requestedByProduct.get(line.productId) ?? line.quantity
      setApproval({
        kind: 'stock_exception',
        title: 'Stock exception approval',
        action: `Only ${sellable} ${line.productName} are sellable in stock, but ${requested} are being sold.`,
        effects: [
          'Sellable stock will become negative and stay visible as an inventory exception.',
          'Management review is required to reconcile the stock.',
          'The sale can complete only with this approval.',
        ],
        lineId: line.lineId,
      })
    },
    [requestedByProduct, sellableFor],
  )

  const openCreditApproval = useCallback(() => {
    if (!creditPayment || !customer || !creditAssessment) return
    if (creditAssessment.status !== 'eligible') return
    const amount = creditPayment.amountKobo
    const effects = [`Outstanding debt will increase by ${formatKobo(amount)}.`]
    if (creditAssessment.creditLimitKobo !== undefined) {
      effects.push(
        `Outstanding debt becomes ${formatKobo(creditAssessment.projectedKobo)} of ${formatKobo(creditAssessment.creditLimitKobo)} limit.`,
      )
    } else {
      effects.push(
        `Outstanding debt becomes ${formatKobo(creditAssessment.projectedKobo)}.`,
      )
    }
    if (creditAssessment.overLimit) {
      effects.push(
        'This sale exceeds the credit limit, so a separate over-limit exception is required.',
      )
    }
    setApproval({
      kind: creditAssessment.overLimit ? 'over_limit' : 'credit',
      title: creditAssessment.overLimit
        ? 'Credit sale approval — over limit'
        : 'Credit sale approval',
      action: `${customer.name} (${customer.phone}) will owe ${formatKobo(amount)} for this sale.`,
      effects,
      amountKobo: amount,
      creditCustomerId: customer.id,
      requiresSecondApprover: creditAssessment.overLimit,
    })
  }, [creditAssessment, creditPayment, customer])

  const blockers = useMemo<CompletionBlocker[]>(() => {
    const result: CompletionBlocker[] = []
    if (lines.length === 0) {
      result.push({
        kind: 'no_items',
        message: 'Add a product to start the sale.',
      })
      return result
    }
    for (const line of lines) {
      const state = linePreviews.get(line.lineId)
      if (state?.error) {
        result.push({
          kind: 'line_error',
          message: `${line.productName}: ${state.error}`,
        })
      }
      if (state?.preview?.requiresAuthorization && !line.pricingApproval) {
        result.push({
          kind: 'pricing_approval',
          message: state.preview.freeSale
            ? `${line.productName} is ₦0. A free sale needs Manager or Owner approval.`
            : `${line.productName} is below the price floor and needs Manager or Owner authorization.`,
          actionLabel: 'Approve price',
          onAction: () => openPricingApproval(line, state.preview!),
        })
      }
      const sellable = sellableFor(line.productId)
      const requested = requestedByProduct.get(line.productId) ?? 0
      if (requested > sellable && !line.stockExceptionApproval) {
        result.push({
          kind: 'stock_exception',
          message: `Only ${sellable} ${line.productName} sellable in stock; ${requested} requested. This needs a stock review.`,
          actionLabel: 'Review stock',
          onAction: () => openStockExceptionApproval(line),
        })
      }
    }
    if (creditPayment) {
      if (!customer) {
        result.push({
          kind: 'customer_required',
          message:
            'Credit sales require a customer. Select who will owe this amount.',
          actionLabel: 'Select customer',
          onAction: () => setCustomerDialogOpen(true),
        })
      } else if (creditAssessment) {
        if (creditAssessment.status === 'not_allowed') {
          result.push({
            kind: 'credit_not_allowed',
            message: `${customer.name} cannot use credit. Remove the credit payment or choose another customer.`,
          })
        } else if (creditAssessment.status === 'restricted') {
          result.push({
            kind: 'credit_restricted',
            message: `Credit is restricted for ${customer.name} and needs a configured management rule.`,
          })
        } else if (
          !creditApproval ||
          creditApproval.amountKobo !== creditPayment.amountKobo ||
          creditApproval.customerId !== customer.id
        ) {
          result.push({
            kind: 'credit_approval',
            message: `Credit of ${formatKobo(creditPayment.amountKobo)} needs Manager or Owner approval.`,
            actionLabel: 'Approve credit',
            onAction: openCreditApproval,
          })
        } else if (creditAssessment.overLimit && !overLimitApproval) {
          result.push({
            kind: 'over_limit',
            message:
              'This credit sale exceeds the limit and needs a separate management exception.',
            actionLabel: 'Approve exception',
            onAction: openCreditApproval,
          })
        }
      }
    }
    if (unconfirmedCount > 0) {
      result.push({
        kind: 'unconfirmed_payments',
        message: `Confirm ${unconfirmedCount} payment${unconfirmedCount === 1 ? '' : 's'} before completing the sale.`,
      })
    }
    if (invalidAmounts.length > 0) {
      result.push({
        kind: 'invalid_amount',
        message: 'Enter a valid payment amount.',
      })
    }
    if (remainingKobo !== 0 && confirmedPayments.length > 0) {
      result.push({
        kind: 'unsettled',
        message:
          remainingKobo > 0
            ? `${formatKobo(remainingKobo)} is still unsettled. Payments must settle the total exactly.`
            : `Payments exceed the total by ${formatKobo(-remainingKobo)}. Adjust the amounts.`,
      })
    }
    if (
      confirmedPayments.length === 0 &&
      lines.length > 0 &&
      totals.totalDueKobo > 0
    ) {
      result.push({
        kind: 'no_payments',
        message: 'Choose a payment method to settle the sale.',
      })
    }
    return result
  }, [
    confirmedPayments.length,
    creditApproval,
    creditAssessment,
    creditPayment,
    customer,
    invalidAmounts.length,
    lines,
    linePreviews,
    openCreditApproval,
    openPricingApproval,
    openStockExceptionApproval,
    overLimitApproval,
    remainingKobo,
    requestedByProduct,
    sellableFor,
    unconfirmedCount,
    totals.totalDueKobo,
  ])

  const addProduct = useCallback((result: ProductSearchResult) => {
    const { product } = result
    setStage((current) => (current === 'completed' ? 'building' : current))
    setLines((current) => {
      const mergeTarget = current.find(
        (line) =>
          line.productId === product.id &&
          line.unitPriceKobo === undefined &&
          !line.discount,
      )
      if (mergeTarget) {
        return current.map((line) =>
          line.lineId === mergeTarget.lineId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        )
      }
      return [
        ...current,
        {
          lineId: newId('line'),
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          quantity: 1,
        },
      ]
    })
  }, [])

  const setLineQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity < 1) return
    setLines((current) =>
      current.map((line) =>
        line.lineId === lineId ? { ...line, quantity } : line,
      ),
    )
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setLines((current) => current.filter((line) => line.lineId !== lineId))
  }, [])

  const savePricing = useCallback(
    (
      lineId: string,
      changes: { unitPriceKobo?: number; discount?: DraftDiscount },
    ) => {
      setLines((current) =>
        current.map((line) =>
          line.lineId === lineId
            ? {
                ...line,
                unitPriceKobo: changes.unitPriceKobo,
                discount: changes.discount,
                pricingApproval: undefined,
              }
            : line,
        ),
      )
      setPricingLineId(undefined)
    },
    [],
  )

  const selectCustomer = useCallback(
    (snapshot: {
      customer: {
        id: string
        name: string
        phone: string
        creditStatus: SelectedCustomer['creditStatus']
      }
      outstandingKobo: number
      creditLimitKobo?: number
    }) => {
      setCustomer({
        id: snapshot.customer.id,
        name: snapshot.customer.name,
        phone: snapshot.customer.phone,
        creditStatus: snapshot.customer.creditStatus,
        outstandingKobo: snapshot.outstandingKobo,
        creditLimitKobo: snapshot.creditLimitKobo,
      })
      setCustomerDialogOpen(false)
    },
    [],
  )

  const createCustomer = useCallback(
    (input: { name: string; phone: string }) => {
      if (!input.name.trim() || !input.phone.trim()) {
        return {
          error: 'A customer record needs a name and a phone number.',
        }
      }
      try {
        const customer = controller.createCustomer({
          actor: session.actor,
          name: input.name,
          phone: input.phone,
          customerId: newId('customer'),
        })
        selectCustomer({
          customer,
          outstandingKobo: 0,
          creditLimitKobo: 0,
        })
        return { customer }
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : 'The customer could not be created.',
        }
      }
    },
    [controller, selectCustomer, session.actor],
  )

  const addPaymentMethod = useCallback(
    (method: MethodButton) => {
      if (remainingKobo <= 0) return
      if (method.method === 'customer_credit' && !customer) {
        setCustomerDialogOpen(true)
      }
      setPayments((current) => [
        ...current,
        {
          id: newId('payment'),
          method: method.method,
          customMethodId: method.customMethodId,
          customLabel: method.label,
          amountKobo: remainingKobo,
          amountText: (remainingKobo / 100).toString(),
          state: 'unconfirmed',
        },
      ])
    },
    [customer, remainingKobo],
  )

  const updatePayment = useCallback(
    (paymentId: string, changes: Partial<PaymentDraft>) => {
      if (changes.amountText !== undefined) {
        // A changed credit amount invalidates prior approvals; they are
        // collected again for the exact consequence being approved.
        setCreditApproval(undefined)
        setOverLimitApproval(undefined)
      }
      setPayments((current) =>
        current.map((payment) => {
          if (payment.id !== paymentId) return payment
          const next = { ...payment, ...changes }
          if (changes.amountText !== undefined) {
            const parsed = parseNairaToKobo(changes.amountText)
            next.amountKobo = parsed ?? 0
          }
          return next
        }),
      )
    },
    [],
  )

  const confirmPayment = useCallback(
    (paymentId: string) => {
      setPayments((current) =>
        current.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                state: 'confirmed',
                confirmedBy: session.actor.displayName,
                confirmedAt: new Date().toISOString(),
              }
            : payment,
        ),
      )
    },
    [session.actor],
  )

  const failPayment = useCallback((paymentId: string) => {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId ? { ...payment, state: 'failed' } : payment,
      ),
    )
  }, [])

  const retryPayment = useCallback((paymentId: string) => {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId
          ? { ...payment, state: 'unconfirmed' }
          : payment,
      ),
    )
  }, [])

  const removePayment = useCallback((paymentId: string) => {
    setPayments((current) =>
      current.filter((payment) => payment.id !== paymentId),
    )
  }, [])

  const handleApprovalResolution = useCallback(
    (resolution: {
      approver: ManagementActor
      secondApprover?: ManagementActor
      reason: string
    }) => {
      if (!approval) return
      setApprovalDeclined(undefined)
      if (approval.kind === 'below_floor' || approval.kind === 'free_sale') {
        setLines((current) =>
          current.map((line) =>
            line.lineId === approval.lineId
              ? {
                  ...line,
                  pricingApproval: {
                    approverId: resolution.approver.id,
                    approverName: resolution.approver.displayName,
                    approverRole: resolution.approver.role,
                    reason: resolution.reason,
                  },
                }
              : line,
          ),
        )
      } else if (approval.kind === 'stock_exception') {
        setLines((current) =>
          current.map((line) =>
            line.productId ===
            current.find((entry) => entry.lineId === approval.lineId)?.productId
              ? {
                  ...line,
                  stockExceptionApproval: {
                    approverId: resolution.approver.id,
                    approverName: resolution.approver.displayName,
                    approverRole: resolution.approver.role,
                    reason: resolution.reason,
                  },
                }
              : line,
          ),
        )
      } else {
        setCreditApproval({
          approver: resolution.approver,
          reason: resolution.reason,
          amountKobo: approval.amountKobo ?? 0,
          customerId: approval.creditCustomerId ?? '',
        })
        if (approval.kind === 'over_limit' && resolution.secondApprover) {
          setOverLimitApproval(resolution.secondApprover)
        }
        if (creditPayment) confirmPayment(creditPayment.id)
      }
      setApproval(undefined)
    },
    [approval, confirmPayment, creditPayment],
  )

  const handleApprovalDecline = useCallback(() => {
    setApproval(undefined)
    setApprovalDeclined(
      'The approval was declined. The sale remains unchanged and cannot complete with this action.',
    )
  }, [])

  const complete = useCallback(async () => {
    if (blockers.length > 0 || stage !== 'building') return
    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current = newId('sale')
    }
    setStage('processing')
    setCompletionError(undefined)
    try {
      await new Promise((resolve) => setTimeout(resolve, 350))
      const sale = controller.completeSale({
        actor: session.actor,
        clientRequestId: clientRequestIdRef.current,
        lines: lines.map((line) => ({
          lineId: line.lineId,
          productId: line.productId,
          quantity: line.quantity,
          unitPriceKobo: line.unitPriceKobo,
          discount: line.discount,
          pricingApproval: line.pricingApproval
            ? {
                approverId: line.pricingApproval.approverId,
                approverRole: line.pricingApproval.approverRole,
                reason: line.pricingApproval.reason,
              }
            : undefined,
        })),
        payments: confirmedPayments.map((payment) => ({
          id: payment.id,
          method: payment.method,
          customMethodId: payment.customMethodId,
          amountKobo: payment.amountKobo,
          confirmedBy: session.actor.id,
          externalReference: payment.externalReference,
        })),
        customer: customer
          ? { id: customer.id, name: customer.name, phone: customer.phone }
          : undefined,
        taxRateBasisPoints: taxOption.rateBasisPoints,
        taxMode: taxOption.mode,
        creditApproval: creditApproval
          ? {
              approverId: creditApproval.approver.id,
              approverRole: creditApproval.approver.role,
            }
          : undefined,
        overLimitApproval: overLimitApproval
          ? {
              approverId: overLimitApproval.id,
              approverRole: overLimitApproval.role,
            }
          : undefined,
      })
      let operationId: string | undefined
      if (!online) {
        const operation = controller.enqueueOfflineSale(
          sale,
          session.actor,
          creditApproval ? 'approved' : 'not_required',
        )
        operationId = operation.operationId
      }
      setCompleted({ sale, operationId })
      setStage('completed')
      onOperationsChanged()
    } catch (error) {
      setCompletionError(friendlyError(error))
      setStage('building')
    }
  }, [
    blockers.length,
    confirmedPayments,
    controller,
    creditApproval,
    customer,
    lines,
    online,
    onOperationsChanged,
    overLimitApproval,
    session.actor,
    stage,
    taxOption,
  ])

  const newSale = useCallback(() => {
    setLines([])
    setPayments([])
    setCustomer(undefined)
    setCreditApproval(undefined)
    setOverLimitApproval(undefined)
    setApproval(undefined)
    setApprovalDeclined(undefined)
    setCompletionError(undefined)
    setCompleted(undefined)
    setTaxOptionId('none')
    setSearchQuery('')
    clientRequestIdRef.current = undefined
    setStage('building')
  }, [])

  const synchronizeNow = useCallback(async () => {
    setSyncing(true)
    try {
      await controller.synchronize()
      onOperationsChanged()
    } finally {
      setSyncing(false)
    }
  }, [controller, onOperationsChanged])

  const completedOperation =
    completed?.operationId !== undefined
      ? controller.getOperation(completed.operationId)
      : undefined

  const methodButtons: MethodButton[] = [
    {
      method: 'cash',
      label: 'Cash',
      icon: <MoneyIcon size={18} aria-hidden="true" />,
    },
    {
      method: 'bank_transfer',
      label: 'Transfer',
      icon: <ArrowsLeftRight size={18} aria-hidden="true" />,
    },
    {
      method: 'pos_card',
      label: 'POS / Card',
      icon: <CreditCard size={18} aria-hidden="true" />,
    },
    {
      method: 'customer_credit',
      label: 'Credit',
      icon: <HandCoins size={18} aria-hidden="true" />,
    },
    ...controller.listCustomPaymentMethods().map((custom): MethodButton => ({
      method: 'custom',
      customMethodId: custom.id,
      label: custom.label,
      icon: <DeviceMobile size={18} aria-hidden="true" />,
    })),
  ]

  const confirmLabelFor = (payment: PaymentDraft): string => {
    switch (payment.method) {
      case 'cash':
        return 'Confirm cash received'
      case 'bank_transfer':
        return 'Confirm transfer received'
      case 'pos_card':
        return 'Confirm card approved'
      case 'customer_credit':
        return 'Confirm credit approved'
      default:
        return 'Confirm payment received'
    }
  }

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const firstBlocker = blockers[0]

  useEffect(() => {
    onSaleStateChange({
      dirty: stage === 'building' && (lines.length > 0 || payments.length > 0),
      itemCount,
      totalKobo: totals.totalDueKobo,
    })
  }, [
    itemCount,
    lines.length,
    onSaleStateChange,
    payments.length,
    stage,
    totals.totalDueKobo,
  ])

  const scrollToPayment = () => {
    paymentSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const contextBar = (
    <header className="pos-context">
      <div className="pos-context__sale">
        <h1 className="ui-text-h3">Sell</h1>
        <span className="ui-text-caption">
          {stage === 'completed'
            ? 'Sale completed'
            : lines.length > 0
              ? `Active sale · ${itemCount} item${itemCount === 1 ? '' : 's'}`
              : 'No active sale'}
        </span>
      </div>
      <div className="pos-context__meta">
        {!online && (
          <Status
            tone="offline"
            label="Offline"
            description="Sales continue on this device."
          />
        )}
        <label className="pos-session">
          <span className="ui-text-caption">Operating as</span>
          <Select
            aria-label="Operating as (reference session)"
            value={session.actor.id}
            onChange={(event) => onActorChange(event.target.value)}
            options={posActors.map((actor) => ({
              value: actor.id,
              label: `${actor.displayName} · ${roleLabel(actor.role)}`,
            }))}
          />
        </label>
      </div>
    </header>
  )

  if (stage === 'completed' && completed) {
    return (
      <div className="pos-screen">
        {contextBar}
        <CompletionView
          sale={completed.sale}
          actor={session.actor}
          online={online}
          operation={completedOperation}
          stockExceptionLines={lines
            .filter((line) => line.stockExceptionApproval)
            .map((line) => line.productName)}
          onNewSale={newSale}
          onSynchronize={synchronizeNow}
          syncing={syncing}
        />
      </div>
    )
  }

  return (
    <div className="pos-screen">
      {contextBar}
      <div className="pos-layout">
        <section className="pos-discovery" aria-label="Product search">
          <form
            className="pos-search"
            onSubmit={(event) => {
              event.preventDefault()
              if (searchResults.length > 0) addProduct(searchResults[0])
            }}
          >
            <input
              className="pos-search__input"
              type="search"
              aria-label="Search products by name, SKU, or model"
              placeholder="Search product, SKU, or model — Enter adds the first result"
              value={searchQuery}
              autoFocus
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </form>
          <div className="pos-results" role="list" aria-label="Search results">
            {searchResults.length === 0 ? (
              <EmptyState
                title="No products found"
                description={`No products match “${searchQuery}”. Check the spelling or search by SKU.`}
              />
            ) : (
              searchResults.map((result) => (
                <ProductResultButton
                  key={result.product.id}
                  result={result}
                  onAdd={addProduct}
                />
              ))
            )}
          </div>
        </section>

        <section className="pos-sale" aria-label="Current sale">
          <header className="pos-sale__header">
            <h2 className="ui-text-h4">Current sale</h2>
            {lines.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAbandonDialogOpen(true)}
              >
                Clear
              </Button>
            )}
          </header>

          {lines.length === 0 ? (
            <EmptyState
              title="Start a sale"
              description="Search for a product to add it to the basket."
            />
          ) : (
            <ul className="pos-lines">
              {lines.map((line) => {
                const state = linePreviews.get(line.lineId)
                const preview = state?.preview
                const sellable = sellableFor(line.productId)
                const requested =
                  requestedByProduct.get(line.productId) ?? line.quantity
                const stockConflict =
                  requested > sellable && !line.stockExceptionApproval
                return (
                  <li className="pos-line" key={line.lineId}>
                    <div className="pos-line__main">
                      <div className="pos-line__identity">
                        <span className="pos-line__name">
                          {line.productName}
                        </span>
                        <span className="ui-text-caption ui-text-mono">
                          {line.productSku}
                        </span>
                      </div>
                      <div className="pos-line__qty">
                        <IconButton
                          label={`Decrease ${line.productName} quantity`}
                          onClick={() =>
                            setLineQuantity(line.lineId, line.quantity - 1)
                          }
                          disabled={line.quantity <= 1}
                        >
                          <Minus size={16} weight="bold" aria-hidden="true" />
                        </IconButton>
                        <span
                          className="pos-line__quantity"
                          aria-label={`${line.productName} quantity`}
                        >
                          {line.quantity}
                        </span>
                        <IconButton
                          label={`Increase ${line.productName} quantity`}
                          onClick={() =>
                            setLineQuantity(line.lineId, line.quantity + 1)
                          }
                        >
                          <Plus size={16} weight="bold" aria-hidden="true" />
                        </IconButton>
                      </div>
                      <div className="pos-line__pricing">
                        <button
                          type="button"
                          className="pos-line__price"
                          onClick={() => setPricingLineId(line.lineId)}
                          aria-label={`Edit price for ${line.productName}`}
                        >
                          {preview ? (
                            <Money amountKobo={preview.actualUnitPriceKobo} />
                          ) : (
                            '—'
                          )}
                          <PencilSimple size={14} aria-hidden="true" />
                        </button>
                        <span className="pos-line__total">
                          {preview ? (
                            <Money
                              amountKobo={
                                preview.actualUnitPriceKobo * line.quantity
                              }
                            />
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                      <IconButton
                        label={`Remove ${line.productName}`}
                        onClick={() => removeLine(line.lineId)}
                      >
                        <X size={16} weight="bold" aria-hidden="true" />
                      </IconButton>
                    </div>
                    {preview && line.discount && (
                      <p className="pos-line__discount">
                        Discount{' '}
                        {line.discount.kind === 'percentage'
                          ? `${line.discount.value}%`
                          : formatKobo(line.discount.value * 100)}
                        {line.discount.reason
                          ? ` — ${line.discount.reason}`
                          : ''}
                      </p>
                    )}
                    {preview?.belowFloor && line.pricingApproval && (
                      <p className="pos-line__approval">
                        Price exception approved by{' '}
                        {line.pricingApproval.approverName}
                        {line.pricingApproval.reason
                          ? ` — ${line.pricingApproval.reason}`
                          : ''}
                      </p>
                    )}
                    {line.stockExceptionApproval && (
                      <p className="pos-line__approval">
                        Stock exception approved by{' '}
                        {line.stockExceptionApproval.approverName} — negative
                        stock stays visible for review.
                      </p>
                    )}
                    {state?.error && (
                      <Alert tone="danger" title="Line cannot be priced">
                        {state.error} Remove the line or choose another product.
                      </Alert>
                    )}
                    {stockConflict && (
                      <Alert
                        tone="warning"
                        title="Not enough sellable stock"
                        action={
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openStockExceptionApproval(line)}
                          >
                            Request approval
                          </Button>
                        }
                      >
                        Only {sellable} {line.productName} sellable in stock,
                        but {requested} are in the basket. The sale cannot
                        complete until the quantity is reduced or a manager
                        approves a stock exception.
                      </Alert>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          <div className="pos-customer">
            {customer ? (
              <div className="pos-customer__selected">
                <div>
                  <span className="pos-customer__name">{customer.name}</span>
                  <span className="ui-text-caption">{customer.phone}</span>
                </div>
                <div className="pos-customer__credit">
                  <Status
                    tone={
                      customer.creditStatus === 'allowed'
                        ? 'success'
                        : customer.creditStatus === 'restricted'
                          ? 'warning'
                          : 'danger'
                    }
                    label={
                      customer.creditStatus === 'allowed'
                        ? 'Credit allowed'
                        : customer.creditStatus === 'restricted'
                          ? 'Credit restricted'
                          : 'Credit blocked'
                    }
                  />
                  {customer.outstandingKobo > 0 && (
                    <span className="ui-text-caption">
                      Outstanding{' '}
                      <Money amountKobo={customer.outstandingKobo} />
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCustomerDialogOpen(true)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCustomerDialogOpen(true)}
              >
                Add customer
              </Button>
            )}
          </div>

          <div className="pos-totals">
            <div className="pos-tax">
              <label className="ui-text-caption" htmlFor="pos-tax-option">
                Tax
              </label>
              <Select
                id="pos-tax-option"
                value={taxOptionId}
                onChange={(event) => setTaxOptionId(event.target.value)}
                options={taxOptions.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
              />
            </div>
            <dl className="pos-totals__rows">
              <div>
                <dt>Subtotal</dt>
                <dd>
                  <Money amountKobo={itemsTotalKobo} />
                </dd>
              </div>
              {discountTotalKobo > 0 && (
                <div>
                  <dt>Discount</dt>
                  <dd>
                    −<Money amountKobo={discountTotalKobo} />
                  </dd>
                </div>
              )}
              {totals.taxKobo > 0 && (
                <div>
                  <dt>
                    {taxOption.mode === 'inclusive' ? 'VAT (included)' : 'VAT'}
                  </dt>
                  <dd>
                    <Money amountKobo={totals.taxKobo} />
                  </dd>
                </div>
              )}
              <div className="pos-totals__grand">
                <dt>Total</dt>
                <dd>
                  <Money amountKobo={totals.totalDueKobo} />
                </dd>
              </div>
            </dl>
          </div>

          <section
            className="pos-payments"
            aria-labelledby="pos-payment-title"
            ref={paymentSectionRef}
          >
            <h3 className="ui-text-h4" id="pos-payment-title">
              Payment
            </h3>
            {lines.length > 0 && totals.totalDueKobo === 0 && (
              <Status
                tone="success"
                label="Nothing to pay"
                description="This approved free sale settles with no payment."
              />
            )}
            {payments.length > 0 && (
              <ul className="pos-payment-list">
                {payments.map((payment) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    confirmLabel={confirmLabelFor(payment)}
                    amountError={invalidAmounts.some(
                      (invalid) => invalid.id === payment.id,
                    )}
                    onAmountChange={(text) =>
                      updatePayment(payment.id, { amountText: text })
                    }
                    onReferenceChange={(text) =>
                      updatePayment(payment.id, { externalReference: text })
                    }
                    onConfirm={() => {
                      if (payment.method === 'customer_credit') {
                        if (!customer) {
                          setCustomerDialogOpen(true)
                        } else {
                          openCreditApproval()
                        }
                      } else {
                        confirmPayment(payment.id)
                      }
                    }}
                    onFail={() => failPayment(payment.id)}
                    onRetry={() => retryPayment(payment.id)}
                    onRemove={() => removePayment(payment.id)}
                  />
                ))}
              </ul>
            )}
            {remainingKobo > 0 && (
              <div className="pos-methods">
                {methodButtons.map((button) => (
                  <button
                    type="button"
                    key={button.customMethodId ?? button.method}
                    className="pos-method"
                    onClick={() => addPaymentMethod(button)}
                  >
                    {button.icon}
                    {button.label}
                  </button>
                ))}
              </div>
            )}
            {payments.length > 0 && (
              <div className="pos-settlement" role="status">
                <span>
                  Settled <Money amountKobo={settledKobo} />
                </span>
                <span>
                  Remaining <Money amountKobo={remainingKobo} />
                </span>
              </div>
            )}
          </section>

          <footer className="pos-complete">
            {approvalDeclined && (
              <Alert tone="danger" title="Request rejected">
                {approvalDeclined}
              </Alert>
            )}
            {completionError && (
              <Alert tone="danger" title="Sale not completed">
                {completionError} Nothing was recorded.
              </Alert>
            )}
            {firstBlocker ? (
              <div className="pos-blocker" role="status">
                <span className="ui-text-body-sm">{firstBlocker.message}</span>
                {firstBlocker.actionLabel && firstBlocker.onAction && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={firstBlocker.onAction}
                  >
                    {firstBlocker.actionLabel}
                  </Button>
                )}
              </div>
            ) : (
              <Status
                tone="success"
                label="Ready to complete"
                description="Payment settled and all requirements met."
              />
            )}
            <Button
              className="pos-complete__button"
              disabled={blockers.length > 0}
              loading={stage === 'processing'}
              onClick={complete}
            >
              {stage === 'processing'
                ? 'Processing…'
                : `Complete Sale · ₦${formatKobo(totals.totalDueKobo)}`}
            </Button>
          </footer>
        </section>
      </div>

      <div className="pos-mobile-bar">
        <div className="pos-mobile-bar__state">
          <span className="ui-text-caption">
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
          <Money amountKobo={totals.totalDueKobo} />
        </div>
        <Button onClick={scrollToPayment}>Review &amp; pay</Button>
      </div>

      <CustomerPickerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        search={(query) => controller.searchCustomers(query)}
        onSelect={selectCustomer}
        onCreate={createCustomer}
      />
      {pricingLine && (
        <LinePricingDialog
          open={pricingLineId !== undefined}
          onClose={() => setPricingLineId(undefined)}
          line={pricingLine}
          quantity={pricingLine.quantity}
          currentPriceKobo={
            controller
              .searchProducts('')
              .find((result) => result.product.id === pricingLine.productId)
              ?.product.sellingPriceKobo ?? 0
          }
          preview={(unitPriceKobo, discount) =>
            controller.previewLine({
              productId: pricingLine.productId,
              quantity: pricingLine.quantity,
              unitPriceKobo,
              discount,
            })
          }
          onSave={(changes) => savePricing(pricingLine.lineId, changes)}
        />
      )}
      {approval && (
        <ApprovalDialog
          approval={approval}
          candidates={approvalCandidates(session)}
          online={online}
          reasonRequired={
            approval.kind !== 'credit' && approval.kind !== 'over_limit'
          }
          onApprove={handleApprovalResolution}
          onDecline={handleApprovalDecline}
          onCancel={() => setApproval(undefined)}
        />
      )}
      <AbandonSaleDialog
        open={abandonDialogOpen}
        itemCount={itemCount}
        totalKobo={totals.totalDueKobo}
        onContinue={() => setAbandonDialogOpen(false)}
        onDiscard={() => {
          setAbandonDialogOpen(false)
          newSale()
        }}
      />
    </div>
  )
}
