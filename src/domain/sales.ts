import {
  CatalogPricing,
  type PricingAuthorization,
  type SaleLine,
} from './catalogPricing'
import {
  InventoryEngine,
  type InventoryEvent,
  type SaleReceipt,
  quantity as inventoryQuantity,
} from './inventory'
import {
  moneyFromMinor,
  taxFromNet,
  taxFromTotal,
  type Currency,
  type TaxMode,
} from './finance'
import { canApprove, type Role, type SaleState } from './stateMachines'

export type PaymentMethod =
  'cash' | 'bank_transfer' | 'pos_card' | 'customer_credit' | 'custom'

export type PaymentClassification = 'cash' | 'non_cash'

export type PaymentConfirmation = {
  state: 'confirmed_success'
  confirmedBy: string
  confirmedAt?: string
  externalReference?: string
}

export type PaymentComponent = {
  id: string
  method: PaymentMethod
  amountKobo: number
  classification?: PaymentClassification
  customMethodId?: string
  confirmation?: PaymentConfirmation
}

export type SaleAuditEvent = {
  id: string
  type: string
  businessId: string
  saleId: string
  actorId: string
  occurredAt: string
  details: Record<string, string | number | boolean>
}

export type SaleReportEvent = {
  type: 'sale.completed' | 'sale.reversed'
  businessId: string
  saleId: string
  occurredAt: string
  totalDueKobo: number
  cashKobo: number
  nonCashKobo: number
  creditKobo: number
  taxKobo: number
  cogsKobo: number
  grossProfitKobo: number
}

export type CompletedSale = {
  id: string
  businessId: string
  clientRequestId: string
  actorId: string
  state: SaleState
  lines: SaleLine[]
  receipt: SaleReceipt
  totalDueKobo: number
  taxKobo: number
  cogsKobo: number
  grossProfitKobo: number
  payments: PaymentComponent[]
  cashKobo: number
  nonCashKobo: number
  creditKobo: number
  creditObligationKobo: number
  customer?: { id: string; name: string; phone: string }
  inventoryEvents: InventoryEvent[]
  completedAt: string
  reversedAt?: string
}

export type SaleInput = {
  businessId: string
  id: string
  clientRequestId: string
  actorId: string
  actorRole: Role
  lines: Array<{
    id: string
    productId: string
    quantity: number
    unitPriceKobo?: number
    discount?: { kind: 'percentage' | 'fixed'; value: number; reason?: string }
    pricingAuthorization?: PricingAuthorization
  }>
  currency?: Currency
  taxRateBasisPoints?: bigint
  taxMode?: TaxMode
  payments: PaymentComponent[]
  customer?: { id: string; name: string; phone: string }
  creditApproval?: { approverId: string; approverRole: Role }
  occurredAt?: string
}

export class SalesError extends Error {
  constructor(
    readonly code:
      | 'DUPLICATE_REQUEST'
      | 'INVALID_PAYMENT'
      | 'PAYMENT_NOT_CONFIRMED'
      | 'CREDIT_APPROVAL_REQUIRED'
      | 'CUSTOM_METHOD_REQUIRED'
      | 'CUSTOM_METHOD_CLASSIFICATION_REQUIRED'
      | 'CUSTOMER_REQUIRED'
      | 'BUSINESS_MISMATCH'
      | 'SALE_NOT_FOUND'
      | 'REVERSAL_FORBIDDEN',
    message: string,
  ) {
    super(message)
    this.name = 'SalesError'
  }
}

const now = () => new Date().toISOString()

export class SalesTransactionEngine {
  private readonly sales = new Map<string, CompletedSale>()
  private readonly audits: SaleAuditEvent[] = []
  private readonly reports: SaleReportEvent[] = []
  private readonly customMethods = new Map<string, PaymentClassification>()
  private nextAuditId = 1

  constructor(
    private readonly pricing: CatalogPricing,
    private readonly inventory: InventoryEngine,
    customMethods: Record<string, PaymentClassification> = {},
  ) {
    for (const [id, classification] of Object.entries(customMethods))
      this.customMethods.set(id, classification)
  }

  registerCustomPaymentMethod(
    id: string,
    classification: PaymentClassification,
    actorRole: Role,
  ): void {
    if (actorRole !== 'manager' && actorRole !== 'owner')
      throw new SalesError(
        'CUSTOM_METHOD_CLASSIFICATION_REQUIRED',
        'Only management may configure payment methods',
      )
    this.customMethods.set(id, classification)
  }

  complete(input: SaleInput): CompletedSale {
    const existing = this.sales.get(
      `${input.businessId}:${input.clientRequestId}`,
    )
    if (existing) return this.cloneSale(existing)
    const currency = input.currency ?? 'NGN'
    const lines = input.lines.map((line) =>
      this.pricing.priceSaleLine({
        ...line,
        salespersonId: input.actorId,
        authorization: line.pricingAuthorization ?? {
          actorId: input.actorId,
          role: input.actorRole,
        },
      }),
    )
    if (lines.length === 0)
      throw new SalesError(
        'INVALID_PAYMENT',
        'A sale must contain at least one line',
      )
    const totals = lines.reduce(
      (sum, line) => sum + line.unitPriceKobo * line.quantity,
      0,
    )
    const taxRate = input.taxRateBasisPoints ?? 0n
    const net = moneyFromMinor(currency, BigInt(totals))
    const taxed =
      (input.taxMode ?? 'exclusive') === 'exclusive'
        ? taxFromNet(net, taxRate)
        : taxFromTotal(net, taxRate)
    const totalDueKobo = Number(taxed.total.minor)
    const paymentSummary = this.validatePayments(input, totalDueKobo)
    const inventoryEvents: InventoryEvent[] = []
    let receipt: SaleReceipt | undefined
    let cogsKobo = 0
    for (const line of lines) {
      const movement = this.inventory.sell({
        businessId: input.businessId,
        productId: line.productId,
        quantity: inventoryQuantity(line.quantity),
        actorId: input.actorId,
        reason: `sale:${input.id}`,
        clientEventId: `${input.clientRequestId}:${line.id}`,
        saleId: input.id,
        unitPrice: BigInt(line.unitPriceKobo),
        occurredAt: input.occurredAt,
      })
      inventoryEvents.push(movement.event)
      cogsKobo += Number(movement.event.cogs ?? 0n)
      receipt = receipt ?? movement.receipt
    }
    const completedAt = input.occurredAt ?? now()
    const sale: CompletedSale = {
      id: input.id,
      businessId: input.businessId,
      clientRequestId: input.clientRequestId,
      actorId: input.actorId,
      state: 'completed',
      lines,
      receipt: { ...receipt!, total: BigInt(totalDueKobo) },
      totalDueKobo,
      taxKobo: Number(taxed.tax.minor),
      cogsKobo,
      // Canonical contract (H05 section 8): Gross Profit = Net Recognized
      // Selling Value − COGS. `totalDueKobo − taxKobo` is the net recognized
      // selling value under both exclusive and inclusive tax modes, so tax
      // must never be subtracted from the pre-tax total twice.
      grossProfitKobo: totalDueKobo - Number(taxed.tax.minor) - cogsKobo,
      payments: input.payments.map((payment) => ({
        ...payment,
        confirmation: payment.confirmation && { ...payment.confirmation },
      })),
      ...paymentSummary,
      customer: input.customer,
      inventoryEvents,
      completedAt,
    }
    this.sales.set(`${input.businessId}:${input.clientRequestId}`, sale)
    this.audit('sale.completed', input, {
      totalDueKobo,
      paymentCount: input.payments.length,
    })
    this.reports.push({
      type: 'sale.completed',
      businessId: input.businessId,
      saleId: input.id,
      occurredAt: completedAt,
      totalDueKobo,
      cashKobo: sale.cashKobo,
      nonCashKobo: sale.nonCashKobo,
      creditKobo: sale.creditKobo,
      taxKobo: sale.taxKobo,
      cogsKobo,
      grossProfitKobo: sale.grossProfitKobo,
    })
    return this.cloneSale(sale)
  }

  reverse(
    businessId: string,
    saleId: string,
    actorId: string,
    actorRole: Role,
  ): CompletedSale {
    if (actorRole !== 'manager' && actorRole !== 'owner')
      throw new SalesError(
        'REVERSAL_FORBIDDEN',
        'Only management may reverse a sale',
      )
    const sale = [...this.sales.values()].find(
      (candidate) =>
        candidate.businessId === businessId && candidate.id === saleId,
    )
    if (!sale) throw new SalesError('SALE_NOT_FOUND', 'Sale was not found')
    if (sale.reversedAt) return this.cloneSale(sale)
    for (const line of sale.lines)
      this.inventory.return({
        businessId,
        productId: line.productId,
        quantity: inventoryQuantity(line.quantity),
        actorId,
        reason: `reversal:${saleId}`,
        clientEventId: `reversal:${saleId}:${line.id}`,
        returnId: `reversal:${saleId}:${line.id}`,
        originalSaleId: saleId,
        condition: 'sellable',
      })
    sale.reversedAt = now()
    this.audit('sale.reversed', { businessId, id: saleId, actorId }, {})
    this.reports.push({
      type: 'sale.reversed',
      businessId,
      saleId,
      occurredAt: sale.reversedAt,
      totalDueKobo: -sale.totalDueKobo,
      cashKobo: -sale.cashKobo,
      nonCashKobo: -sale.nonCashKobo,
      creditKobo: -sale.creditKobo,
      taxKobo: -sale.taxKobo,
      cogsKobo: -sale.cogsKobo,
      grossProfitKobo: -sale.grossProfitKobo,
    })
    return this.cloneSale(sale)
  }

  /**
   * Read-only totals for a draft basket, using the same tax computation
   * `complete` applies. Completion remains the authoritative check.
   */
  previewTotals(input: {
    lines: ReadonlyArray<{ unitPriceKobo: number; quantity: number }>
    currency?: Currency
    taxRateBasisPoints?: bigint
    taxMode?: TaxMode
  }): {
    subtotalKobo: number
    taxKobo: number
    totalDueKobo: number
  } {
    const currency = input.currency ?? 'NGN'
    const subtotalKobo = input.lines.reduce(
      (sum, line) => sum + line.unitPriceKobo * line.quantity,
      0,
    )
    const taxRate = input.taxRateBasisPoints ?? 0n
    const net = moneyFromMinor(currency, BigInt(subtotalKobo))
    const taxed =
      (input.taxMode ?? 'exclusive') === 'exclusive'
        ? taxFromNet(net, taxRate)
        : taxFromTotal(net, taxRate)
    return {
      subtotalKobo,
      taxKobo: Number(taxed.tax.minor),
      totalDueKobo: Number(taxed.total.minor),
    }
  }

  getSale(businessId: string, saleId: string): CompletedSale | undefined {
    const sale = [...this.sales.values()].find(
      (candidate) =>
        candidate.businessId === businessId && candidate.id === saleId,
    )
    return sale && this.cloneSale(sale)
  }
  listAudits(): SaleAuditEvent[] {
    return this.audits.map((event) => ({
      ...event,
      details: { ...event.details },
    }))
  }
  listReports(): SaleReportEvent[] {
    return this.reports.map((event) => ({ ...event }))
  }

  private validatePayments(
    input: SaleInput,
    totalDueKobo: number,
  ): Pick<
    CompletedSale,
    'cashKobo' | 'nonCashKobo' | 'creditKobo' | 'creditObligationKobo'
  > {
    // An approved fully-free sale (₦0 total) settles with no payment
    // components; every other sale requires at least one confirmed payment.
    if (input.payments.length === 0 && totalDueKobo > 0)
      throw new SalesError(
        'INVALID_PAYMENT',
        'At least one payment is required',
      )
    let total = 0,
      cashKobo = 0,
      nonCashKobo = 0,
      creditKobo = 0
    for (const payment of input.payments) {
      if (!Number.isInteger(payment.amountKobo) || payment.amountKobo <= 0)
        throw new SalesError(
          'INVALID_PAYMENT',
          'Payment amounts must be positive integer kobo',
        )
      if (
        !payment.confirmation ||
        payment.confirmation.state !== 'confirmed_success'
      )
        throw new SalesError(
          'PAYMENT_NOT_CONFIRMED',
          'Only confirmed successful payments can complete a sale',
        )
      let classification = payment.classification
      if (payment.method === 'cash') classification = 'cash'
      else if (payment.method === 'customer_credit') classification = 'non_cash'
      else if (payment.method !== 'custom') classification = 'non_cash'
      else if (!payment.customMethodId)
        throw new SalesError(
          'CUSTOM_METHOD_REQUIRED',
          'Custom payments require a configured method',
        )
      else classification = this.customMethods.get(payment.customMethodId)
      if (!classification)
        throw new SalesError(
          'CUSTOM_METHOD_CLASSIFICATION_REQUIRED',
          'Custom payment methods must be classified as cash or non-cash',
        )
      total += payment.amountKobo
      if (classification === 'cash') cashKobo += payment.amountKobo
      else nonCashKobo += payment.amountKobo
      if (payment.method === 'customer_credit') creditKobo += payment.amountKobo
    }
    if (total !== totalDueKobo)
      throw new SalesError(
        'INVALID_PAYMENT',
        `Payments must equal total due (${totalDueKobo} kobo)`,
      )
    if (creditKobo > 0) {
      if (
        !input.customer ||
        !input.customer.name.trim() ||
        !input.customer.phone.trim()
      )
        throw new SalesError(
          'CUSTOMER_REQUIRED',
          'Credit sales require a customer name and phone',
        )
      const approval = input.creditApproval
      if (
        !approval ||
        !canApprove(
          input.actorRole,
          approval.approverRole,
          input.actorId,
          approval.approverId,
        )
      )
        throw new SalesError(
          'CREDIT_APPROVAL_REQUIRED',
          'Credit sales require separate Manager or Owner approval',
        )
    }
    return {
      cashKobo,
      nonCashKobo,
      creditKobo,
      creditObligationKobo: creditKobo,
    }
  }

  private audit(
    type: string,
    input: Pick<SaleInput, 'businessId' | 'id' | 'actorId'>,
    details: Record<string, string | number | boolean>,
  ): void {
    this.audits.push({
      id: `sale-audit-${this.nextAuditId++}`,
      type,
      businessId: input.businessId,
      saleId: input.id,
      actorId: input.actorId,
      occurredAt: now(),
      details,
    })
  }

  private cloneSale(sale: CompletedSale): CompletedSale {
    return {
      ...sale,
      lines: sale.lines.map((line) => ({ ...line })),
      payments: sale.payments.map((payment) => ({
        ...payment,
        confirmation: payment.confirmation && { ...payment.confirmation },
      })),
      inventoryEvents: sale.inventoryEvents.map((event) => ({ ...event })),
      receipt: {
        ...sale.receipt,
        lines: sale.receipt.lines.map((line) => ({ ...line })),
      },
      customer: sale.customer && { ...sale.customer },
    }
  }
}
