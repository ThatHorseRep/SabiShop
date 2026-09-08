import { effectivePermissions } from '../auth/policy'
import type { Permission } from '../auth/types'
import { CatalogPricing, type Product } from '../domain/catalogPricing'
import {
  CashReconciliationEngine,
  type CashAuditEvent,
  type CashEvent,
  type CashReconciliationSnapshot,
} from '../domain/cashReconciliation'
import {
  CustomersCreditEngine,
  type CreditHistoryEvent,
  type Customer,
  type DebtSnapshot,
} from '../domain/customersCredit'
import {
  InventoryEngine,
  type InventoryValuation,
  type StockLevel,
} from '../domain/inventory'
import {
  PurchasingEngine,
  type PurchaseRecord,
  type Supplier,
  type SupplierPayment,
  type SupplierReturn,
} from '../domain/purchasing'
import {
  ReturnsCorrectionsEngine,
  type CorrectionEvent,
  type IntegrityAuditEvent,
  type ReturnRecord,
} from '../domain/returnsCorrections'
import {
  SalesTransactionEngine,
  type CompletedSale,
  type SaleAuditEvent,
} from '../domain/sales'
import { posActors, posBusiness, type PosActor } from '../pos/posSession'
import {
  CanonicalReporting,
  type BusinessPerformanceReport,
  type ExpenseRecord,
  type IncentivePolicy,
  type StaffPerformance,
} from '../reporting'
import { formatKobo } from '../ui/format'

export const managementBusinessId = posBusiness.id

export type ManagementActorId = PosActor['id']
export const managementActors: readonly PosActor[] = posActors

/**
 * Owning application areas that can resolve an attention item. Corrections
 * and resolution never happen inside the dashboard; the values match the C04
 * navigation destinations (C01 sections 12, 25).
 */
export type ResolutionArea =
  'money' | 'products-inventory' | 'customers-credit' | 'suppliers-purchasing'

export type ManagementPeriodId = '24h' | '7d' | '30d'

export type ManagementPeriod = {
  id: ManagementPeriodId
  label: string
  description: string
  from: string
  to: string
  timeBasis: 'event_time'
}

export type AttentionKind =
  | 'cash_discrepancy'
  | 'negative_stock'
  | 'sale_return'
  | 'owner_review'
  | 'supplier_payment'
  | 'credit_overdue'

export type AttentionItemView = {
  id: string
  kind: AttentionKind
  title: string
  whatHappened: string
  whyAttention: string
  consequence: string
  whereToResolve: string
  resolutionArea: ResolutionArea
  recordId: string
  recordLabel: string
  occurredAt: string
}

export type SaleDerivedState =
  'completed' | 'partially_returned' | 'fully_returned' | 'reversed'

export type SaleReportEventView = {
  id: string
  type:
    | 'sale.completed'
    | 'sale.reversed'
    | 'sale.correction.applied'
    | 'sale.return.applied'
    | 'sale.reversal.applied'
  occurredAt: string
  totalDueKobo: number
  taxKobo: number
  cogsKobo: number
  grossProfitKobo: number
  cashKobo: number
  nonCashKobo: number
  creditKobo: number
}

export type SaleSummaryView = {
  sale: CompletedSale
  actorName: string
  derivedState: SaleDerivedState
  stateLabel: string
  reportEvents: SaleReportEventView[]
  returns: ReturnRecord[]
  corrections: IntegrityAuditEvent[]
  inventoryEventIds: string[]
  creditLink: {
    customerId: string
    customerName: string
    debtId: string
  } | null
  hasPeriodActivity: boolean
}

export type StockHealthView = {
  product: Product
  stock: StockLevel
  valuation: InventoryValuation
  movementCount: number
  lastMovementAt?: string
}

export type CustomerCreditView = {
  customer: Customer
  outstandingMinor: bigint
  debts: DebtSnapshot[]
  history: CreditHistoryEvent[]
}

export type SupplierObligationView = {
  supplier: Supplier
  outstandingMinor: bigint
  purchases: PurchaseRecord[]
  payments: SupplierPayment[]
  returns: SupplierReturn[]
}

export type CashDashboardView = {
  snapshot: CashReconciliationSnapshot
  events: CashEvent[]
  audits: CashAuditEvent[]
}

export type StaffActivityEntryView = {
  id: string
  at: string
  kind: 'sale' | 'return' | 'correction' | 'cash' | 'credit' | 'supplier'
  title: string
  detail: string
}

export type StaffDashboardView = {
  actor: PosActor
  performance?: StaffPerformance
  lastSaleAt?: string
  activity: StaffActivityEntryView[]
  incentiveStatus: 'disabled' | 'pending' | 'eligible' | 'not_measured'
}

export type ManagementSnapshot = {
  actor: PosActor
  permissions: readonly Permission[]
  canView: boolean
  period: ManagementPeriod
  report: BusinessPerformanceReport
  incentivePolicy: IncentivePolicy
  attention: AttentionItemView[]
  sales: SaleSummaryView[]
  expenses: ExpenseRecord[]
  stock: StockHealthView[]
  credit: CustomerCreditView[]
  suppliers: SupplierObligationView[]
  cash: CashDashboardView
  staff: StaffDashboardView[]
  traceCount: number
}

const periodDurations: Record<
  ManagementPeriodId,
  { label: string; description: string; milliseconds: number }
> = {
  '24h': {
    label: 'Last 24 hours',
    description: 'Business events with an event time in the last 24 hours.',
    milliseconds: 24 * 60 * 60 * 1000,
  },
  '7d': {
    label: 'Last 7 days',
    description: 'Business events with an event time in the last 7 days.',
    milliseconds: 7 * 24 * 60 * 60 * 1000,
  },
  '30d': {
    label: 'Last 30 days',
    description: 'Business events with an event time in the last 30 days.',
    milliseconds: 30 * 24 * 60 * 60 * 1000,
  },
}

export const managementPeriodIds: readonly ManagementPeriodId[] = [
  '24h',
  '7d',
  '30d',
]

export function periodOption(
  id: ManagementPeriodId,
  now = Date.now(),
): ManagementPeriod {
  const config = periodDurations[id]
  return {
    id,
    label: config.label,
    description: config.description,
    from: new Date(now - config.milliseconds).toISOString(),
    to: new Date(now).toISOString(),
    timeBasis: 'event_time',
  }
}

const actorName = (actorId: string): string =>
  posActors.find((actor) => actor.id === actorId)?.displayName ?? actorId

const daysAgo = (days: number, minutesOffset = 0): string =>
  new Date(
    Date.now() - days * 24 * 60 * 60 * 1000 + minutesOffset * 60 * 1000,
  ).toISOString()

const daysAhead = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString()

/**
 * Composition seam for the management dashboard. The dashboard is a
 * read-only projection: every figure comes from `CanonicalReporting`
 * (Handoff 16) or directly from the same verified domain engines, so no
 * alternate business calculation exists in this module. No mutation method
 * is exposed; corrections and resolution stay in the owning workspaces.
 */
export class ManagementController {
  private readonly catalog = new CatalogPricing()
  private readonly inventory = new InventoryEngine()
  private readonly sales = new SalesTransactionEngine(
    this.catalog,
    this.inventory,
  )
  private readonly credit = new CustomersCreditEngine()
  private readonly returnsCorrections = new ReturnsCorrectionsEngine({
    sales: this.sales,
    inventory: this.inventory,
    credit: this.credit,
  })
  private readonly purchasing = new PurchasingEngine(this.inventory)
  private readonly cash = new CashReconciliationEngine()
  private readonly reporting: CanonicalReporting
  private expenses!: ExpenseRecord[]
  private incentivePolicy!: IncentivePolicy
  private readonly seededReturnIds: string[] = []
  private readonly creditLinks = new Map<
    string,
    { customerId: string; customerName: string; debtId: string }
  >()
  private readonly cashSessionId = 'BD-mgmt-current'
  private actorId: ManagementActorId = 'user-ngozi'

  constructor() {
    this.seedReferenceBusiness()
    this.reporting = new CanonicalReporting({
      sales: this.sales,
      inventory: this.inventory,
      credit: this.credit,
      purchasing: this.purchasing,
      returns: this.returnsCorrections,
      cashSnapshots: [
        this.cash.getSnapshot(managementBusinessId, this.cashSessionId),
      ],
      cashEvents: this.cash.listEvents(
        managementBusinessId,
        this.cashSessionId,
      ),
      expenses: this.expenses,
      incentivePolicy: this.incentivePolicy,
    })
  }

  setActor(actorId: ManagementActorId): void {
    if (!posActors.some((actor) => actor.id === actorId)) {
      throw new Error('Unknown actor')
    }
    this.actorId = actorId
  }

  getActor(): PosActor {
    return posActors.find((actor) => actor.id === this.actorId)!
  }

  /**
   * The Management destination requires `audit:read`; staff never receive
   * management financial analysis (C01 sections 5.1, 16.1; B09). This is the
   * same permission the C04 navigation model uses for visibility.
   */
  canViewManagement(): boolean {
    return effectivePermissions({ roles: [this.getActor().role] }).has(
      'audit:read',
    )
  }

  snapshot(periodId: ManagementPeriodId = '24h'): ManagementSnapshot {
    const period = periodOption(periodId)
    const report = this.reporting.project(managementBusinessId, {
      from: period.from,
      to: period.to,
    })
    const actor = this.getActor()
    const sales = this.buildSaleViews(period)
    return {
      actor,
      permissions: [...effectivePermissions({ roles: [actor.role] })],
      canView: this.canViewManagement(),
      period,
      report,
      incentivePolicy: this.incentivePolicy,
      attention: this.buildAttention(report),
      sales,
      expenses: this.expenses.filter(
        (expense) =>
          expense.occurredAt >= period.from && expense.occurredAt < period.to,
      ),
      stock: this.buildStockViews(),
      credit: this.buildCreditViews(),
      suppliers: this.buildSupplierViews(),
      cash: {
        snapshot: this.cash.getSnapshot(
          managementBusinessId,
          this.cashSessionId,
        ),
        events: this.cash.listEvents(managementBusinessId, this.cashSessionId),
        audits: this.cash.listAudits(managementBusinessId),
      },
      staff: this.buildStaffViews(report, sales),
      traceCount: report.traces.length,
    }
  }

  private buildSaleViews(period: ManagementPeriod): SaleSummaryView[] {
    const saleIds = [
      ...new Set(this.sales.listReports().map((event) => event.saleId)),
    ]
    const integrityEvents =
      this.returnsCorrections.listReportEvents(managementBusinessId)
    return saleIds
      .map((saleId) => {
        const sale = this.sales.getSale(managementBusinessId, saleId)
        if (!sale) return undefined
        const saleEvents = this.sales
          .listReports()
          .filter((event) => event.saleId === saleId)
          .map((event) => ({
            id: `${event.type}:${event.saleId}`,
            type: event.type,
            occurredAt: event.occurredAt,
            totalDueKobo: event.totalDueKobo,
            taxKobo: event.taxKobo,
            cogsKobo: event.cogsKobo,
            grossProfitKobo: event.grossProfitKobo,
            cashKobo: event.cashKobo,
            nonCashKobo: event.nonCashKobo,
            creditKobo: event.creditKobo,
          }))
        const correctionEvents = integrityEvents
          .filter((event) => event.saleId === saleId)
          .map((event) => ({
            id: event.id,
            type: event.type,
            occurredAt: event.occurredAt,
            totalDueKobo: event.totalDueKobo,
            taxKobo: event.taxKobo,
            cogsKobo: event.cogsKobo,
            grossProfitKobo: event.grossProfitKobo,
            cashKobo: event.cashKobo,
            nonCashKobo: event.nonCashKobo,
            creditKobo: event.creditKobo,
          }))
        const reportEvents = [...saleEvents, ...correctionEvents].sort(
          (left, right) => left.occurredAt.localeCompare(right.occurredAt),
        )
        const returns = this.seededReturnIds
          .map((returnId) =>
            this.returnsCorrections.getReturn(managementBusinessId, returnId),
          )
          .filter(
            (record): record is ReturnRecord =>
              record !== undefined && record.saleId === saleId,
          )
        const corrections = this.returnsCorrections
          .listAuditEvents()
          .filter(
            (event) =>
              event.businessId === managementBusinessId &&
              event.saleId === saleId,
          )
        const applied = returns.filter(
          (record) => record.state === 'applied' || record.state === 'settled',
        )
        const returnedByLine = new Map<string, number>()
        applied.forEach((record) =>
          record.lines.forEach((line) =>
            returnedByLine.set(
              line.lineId,
              (returnedByLine.get(line.lineId) ?? 0) + line.quantity,
            ),
          ),
        )
        const fullyReturned =
          sale.lines.length > 0 &&
          sale.lines.every(
            (line) => (returnedByLine.get(line.id) ?? 0) >= line.quantity,
          )
        const partiallyReturned = !fullyReturned && returnedByLine.size > 0
        const derivedState: SaleDerivedState = sale.reversedAt
          ? 'reversed'
          : fullyReturned
            ? 'fully_returned'
            : partiallyReturned
              ? 'partially_returned'
              : 'completed'
        const stateLabel =
          derivedState === 'reversed'
            ? 'Completed — Reversed'
            : derivedState === 'fully_returned'
              ? 'Completed — Fully returned'
              : derivedState === 'partially_returned'
                ? 'Completed — Partially returned'
                : 'Completed'
        return {
          sale,
          actorName: actorName(sale.actorId),
          derivedState,
          stateLabel,
          reportEvents,
          returns,
          corrections,
          inventoryEventIds: sale.inventoryEvents.map((event) => event.id),
          creditLink: this.creditLinks.get(saleId) ?? null,
          hasPeriodActivity: reportEvents.some(
            (event) =>
              event.occurredAt >= period.from && event.occurredAt < period.to,
          ),
        } satisfies SaleSummaryView
      })
      .filter((view): view is SaleSummaryView => view !== undefined)
      .sort((left, right) =>
        right.sale.completedAt.localeCompare(left.sale.completedAt),
      )
  }

  private buildStockViews(): StockHealthView[] {
    const productIds = [
      ...new Set(this.inventory.listEvents().map((event) => event.productId)),
    ]
    return productIds
      .map((productId): StockHealthView | undefined => {
        const product = this.productById(productId)
        if (!product) return undefined
        const movements = this.inventory.listEvents(productId)
        return {
          product,
          stock: this.inventory.getStock(productId),
          valuation: this.inventory.getValuation(productId),
          movementCount: movements.length,
          lastMovementAt: movements.at(-1)?.occurredAt,
        } satisfies StockHealthView
      })
      .filter((view): view is StockHealthView => view !== undefined)
  }

  private buildCreditViews(): CustomerCreditView[] {
    return this.credit.listCustomers(managementBusinessId).map((customer) => ({
      customer,
      outstandingMinor: this.credit.getOutstandingForCustomer(
        managementBusinessId,
        customer.id,
      ).minor,
      debts: this.credit.listDebts(managementBusinessId, customer.id),
      history: this.credit
        .listHistory(managementBusinessId, customer.id)
        .slice(-8),
    }))
  }

  private buildSupplierViews(): SupplierObligationView[] {
    return this.purchasing
      .listSuppliers(managementBusinessId)
      .map((supplier) => ({
        supplier,
        outstandingMinor: this.purchasing.supplierOutstanding(
          managementBusinessId,
          supplier.id,
        ),
        purchases: this.purchasing
          .listPurchases(managementBusinessId)
          .filter((purchase) => purchase.supplierId === supplier.id),
        payments: this.purchasing
          .listPayments(managementBusinessId)
          .filter((payment) => payment.supplierId === supplier.id),
        returns: this.purchasing
          .listReturns(managementBusinessId)
          .filter((item) => item.supplierId === supplier.id),
      }))
  }

  private buildAttention(
    report: BusinessPerformanceReport,
  ): AttentionItemView[] {
    const items: AttentionItemView[] = []

    // Cash reconciliation exceptions come from the live session snapshot.
    const cashSnapshot = this.cash.getSnapshot(
      managementBusinessId,
      this.cashSessionId,
    )
    const cashVariance = cashSnapshot.cashVarianceKobo ?? 0
    if (cashSnapshot.unresolved && cashVariance !== 0) {
      const short = cashVariance < 0
      const countAudit = this.cash
        .listAudits(managementBusinessId)
        .filter((event) => event.type === 'cash.actual_count.recorded')
        .at(-1)
      items.push({
        id: `cash-${cashSnapshot.sessionId}`,
        kind: 'cash_discrepancy',
        title: 'Cash count does not match expected cash',
        whatHappened: `The physical count for session ${cashSnapshot.sessionId} is ${
          short ? 'below' : 'above'
        } the expected cash figure.`,
        whyAttention:
          'Cash is not profit, but an unexplained variance means the drawer and the records disagree.',
        consequence:
          'The business day cannot be officially closed while the discrepancy is unresolved.',
        whereToResolve:
          'Money & Reconciliation → Reconciliation: resolve the discrepancy with a reason, then confirm.',
        resolutionArea: 'money',
        recordId: cashSnapshot.sessionId,
        recordLabel: `Session ${cashSnapshot.sessionId}`,
        occurredAt: countAudit?.occurredAt ?? new Date().toISOString(),
      })
    }

    // Negative stock comes from the canonical report (Handoff 16).
    for (const productId of report.inventory.negativeStockProductIds) {
      const product = this.productById(productId)
      items.push({
        id: `negative-stock-${productId}`,
        kind: 'negative_stock',
        title: `Negative stock: ${product?.name ?? productId}`,
        whatHappened: `Recorded sales exceed received stock for ${
          product?.name ?? productId
        }; the balance is negative.`,
        whyAttention:
          'Sales were recorded without a matching receipt, so the cost basis for the missing quantity is provisional.',
        consequence:
          'COGS for the unsourced quantity is provisional until stock is received or the record is corrected.',
        whereToResolve:
          'Products & Inventory → Stock: investigate movements, receive the missing stock, or request a correction.',
        resolutionArea: 'products-inventory',
        recordId: productId,
        recordLabel: product?.sku ?? productId,
        occurredAt:
          this.inventory.listEvents(productId).at(-1)?.occurredAt ??
          new Date().toISOString(),
      })
    }

    // Sale returns that still need a management decision.
    for (const returnId of this.seededReturnIds) {
      const record = this.returnsCorrections.getReturn(
        managementBusinessId,
        returnId,
      )
      if (!record) continue
      if (record.state === 'requested' || record.state === 'verified') {
        items.push({
          id: `return-${record.id}`,
          kind: 'sale_return',
          title: `Sale return ${record.id} awaiting ${
            record.state === 'requested' ? 'verification' : 'approval'
          }`,
          whatHappened: `${actorName(record.requestedById)} requested a return on sale ${record.saleId}: ${record.reason}`,
          whyAttention:
            'Until management verifies and approves it, no inventory, refund, or debt effect is applied.',
          consequence:
            'Stock stays unchanged, the refund stays unrecorded, and the sale keeps its original effect on performance.',
          whereToResolve:
            'Money & Reconciliation → Sale returns: verify the original sale, then approve with a stock condition.',
          resolutionArea: 'money',
          recordId: record.id,
          recordLabel: `Return ${record.id}`,
          occurredAt: record.requestedAt,
        })
      }
    }

    // Consequential manager corrections flagged for Owner review (B08).
    for (const correction of this.returnsCorrections.listOwnerReviewRequired(
      managementBusinessId,
    )) {
      items.push({
        id: `owner-review-${correction.id}`,
        kind: 'owner_review',
        title: 'Manager correction on own sale flagged for Owner review',
        whatHappened: `${actorName(correction.actorId)} corrected own sale ${correction.saleId}: ${correction.reason}`,
        whyAttention:
          'A manager corrected their own consequential record, so the Owner keeps an explicit review gate.',
        consequence:
          'The correction is applied and recorded, but it remains flagged for Owner review rather than passing silently.',
        whereToResolve:
          'Money & Reconciliation → Corrections: review the original and corrected states with the audit history.',
        resolutionArea: 'money',
        recordId: correction.id,
        recordLabel: `Correction ${correction.id}`,
        occurredAt: correction.occurredAt,
      })
    }

    // Supplier payments that are not confirmed yet.
    for (const payment of this.purchasing.listPayments(managementBusinessId)) {
      if (
        payment.state === 'confirmed_success' ||
        payment.state === 'reversed'
      ) {
        continue
      }
      items.push({
        id: `supplier-payment-${payment.id}`,
        kind: 'supplier_payment',
        title: `Supplier payment ${payment.id} is ${payment.state.replace('_', ' ')}`,
        whatHappened:
          'A payment to a supplier was recorded but has not been confirmed as successful.',
        whyAttention:
          'The payable only reduces when the payment is confirmed; an unconfirmed payment is not money moved.',
        consequence:
          'The supplier obligation remains outstanding until confirmation succeeds or the payment fails.',
        whereToResolve:
          'Suppliers & Purchasing → Payments: confirm the transfer reference or record the failure.',
        resolutionArea: 'suppliers-purchasing',
        recordId: payment.id,
        recordLabel: `Payment ${payment.id}`,
        occurredAt: payment.occurredAt,
      })
    }

    // Overdue customer credit from the credit engine's debt snapshots.
    for (const customer of this.credit.listCustomers(managementBusinessId)) {
      const overdue = this.credit
        .listDebts(managementBusinessId, customer.id)
        .filter((debt) => debt.isOverdue && debt.outstandingMinor > 0n)
      if (overdue.length === 0) continue
      items.push({
        id: `credit-overdue-${customer.id}`,
        kind: 'credit_overdue',
        title: `Overdue credit: ${customer.name}`,
        whatHappened: `${customer.name} has overdue debt that has not been repaid by its due date.`,
        whyAttention:
          'The receivable is past due; the longer it ages, the more the business is financing the customer.',
        consequence:
          'The amount remains part of customer credit outstanding and no write-off or dispute has been recorded.',
        whereToResolve:
          'Customers & Credit → customer profile: collect repayment, record a dispute, or request a management write-off.',
        resolutionArea: 'customers-credit',
        recordId: overdue[0].id,
        recordLabel: `Debt ${overdue[0].id}`,
        occurredAt: overdue[0].dueDate ?? new Date().toISOString(),
      })
    }

    return items
  }

  private buildStaffViews(
    report: BusinessPerformanceReport,
    sales: SaleSummaryView[],
  ): StaffDashboardView[] {
    return posActors.map((actor) => {
      const performance = report.staff.find(
        (entry) => entry.salespersonId === actor.id,
      )
      const actorSales = sales.filter((view) => view.sale.actorId === actor.id)
      const activity: StaffActivityEntryView[] = []
      actorSales.forEach((view) => {
        activity.push({
          id: `sale-${view.sale.id}`,
          at: view.sale.completedAt,
          kind: 'sale',
          title: `Sale ${view.sale.id} completed`,
          detail: `Total ₦${formatKobo(view.sale.totalDueKobo)} · ${view.stateLabel}`,
        })
      })
      this.seededReturnIds.forEach((returnId) => {
        const record = this.returnsCorrections.getReturn(
          managementBusinessId,
          returnId,
        )
        if (record && record.requestedById === actor.id) {
          activity.push({
            id: `return-${record.id}`,
            at: record.requestedAt,
            kind: 'return',
            title: `Return ${record.id} requested on ${record.saleId}`,
            detail: record.reason,
          })
        }
      })
      this.returnsCorrections
        .listAuditEvents()
        .filter(
          (event) =>
            event.businessId === managementBusinessId &&
            event.actorId === actor.id,
        )
        .forEach((event) => {
          activity.push({
            id: `correction-${event.id}`,
            at: event.occurredAt,
            kind: 'correction',
            title: `${event.type === 'sale.reversal.applied' ? 'Reversal' : 'Correction'} on ${event.saleId}`,
            detail: event.reason,
          })
        })
      this.cash
        .listEvents(managementBusinessId, this.cashSessionId)
        .filter((event) => event.actorId === actor.id)
        .forEach((event) => {
          activity.push({
            id: `cash-${event.id}`,
            at: event.occurredAt,
            kind: 'cash',
            title: `${event.kind.replace('_', ' ')} recorded`,
            detail: event.reason,
          })
        })
      this.credit
        .listHistory(managementBusinessId)
        .filter((event) => event.actorId === actor.id)
        .forEach((event) => {
          activity.push({
            id: `credit-${event.id}`,
            at: event.occurredAt,
            kind: 'credit',
            title: `${event.type.replace(/\./g, ' ')} · ${event.customerId}`,
            detail: event.reason ?? `Customer credit event ${event.id}`,
          })
        })
      this.purchasing
        .listPayments(managementBusinessId)
        .filter((payment) => payment.actorId === actor.id)
        .forEach((payment) => {
          activity.push({
            id: `supplier-${payment.id}`,
            at: payment.occurredAt,
            kind: 'supplier',
            title: `Supplier payment ${payment.id} recorded (${payment.state.replace('_', ' ')})`,
            detail: `Method ${payment.method}${payment.reference ? ` · ${payment.reference}` : ''}`,
          })
        })
      activity.sort((left, right) => right.at.localeCompare(left.at))
      return {
        actor,
        performance,
        lastSaleAt: actorSales[0]?.sale.completedAt,
        activity: activity.slice(0, 6),
        incentiveStatus: performance
          ? performance.incentiveStatus
          : 'not_measured',
      } satisfies StaffDashboardView
    })
  }

  private productById(productId: string): Product | undefined {
    return this.catalog
      .searchProducts('', true)
      .find((product) => product.id === productId)
  }

  // ------------------------------------------------------------------
  // Reference dataset (in-memory engines, same pattern as Handoffs 18-21)
  // ------------------------------------------------------------------

  private seedReferenceBusiness(): void {
    const products = [
      {
        id: 'prod-rice',
        sku: 'SG-RICE-50',
        name: 'Rice — 50kg bag',
        category: 'Foodstuff',
        unit: 'bag',
        aliases: ['rice bag'],
        sellingPriceKobo: 6_500_000,
        priceFloorKobo: 5_800_000,
        active: true,
        availableForSale: true,
      },
      {
        id: 'prod-oil',
        sku: 'SG-OIL-5L',
        name: 'Cooking oil — 5 litres',
        category: 'Foodstuff',
        unit: 'bottle',
        aliases: ['vegetable oil'],
        sellingPriceKobo: 950_000,
        priceFloorKobo: 850_000,
        active: true,
        availableForSale: true,
      },
      {
        id: 'prod-detergent',
        sku: 'SG-DET-1L',
        name: 'Detergent — 1 litre',
        category: 'Household',
        unit: 'bottle',
        aliases: ['soap'],
        sellingPriceKobo: 350_000,
        priceFloorKobo: 300_000,
        active: true,
        availableForSale: true,
      },
    ]
    for (const product of products) this.catalog.createProduct(product)

    this.purchasing.createSupplier({
      id: 'supplier-lagos',
      businessId: managementBusinessId,
      name: 'Lagos Wholesale Foods',
      phone: '08030000001',
      address: '12 Market Road, Lagos',
      notes: 'Weekly foodstuff delivery.',
    })
    this.purchasing.createSupplier({
      id: 'supplier-prime',
      businessId: managementBusinessId,
      name: 'Prime Cleaning Supplies',
      phone: '08030000002',
      address: '4 Industrial Avenue, Lagos',
      notes: 'Cleaning products.',
    })

    // Opening stock arrives through purchases so payables and inventory
    // share one underlying receipt history.
    this.purchasing.receivePurchase({
      id: 'PUR-5001',
      businessId: managementBusinessId,
      supplierId: 'supplier-lagos',
      actorId: 'user-ngozi',
      clientEventId: 'seed-purchase-5001',
      occurredAt: daysAgo(14),
      lines: [
        { productId: 'prod-rice', quantity: 20_000n, unitCost: 5_200_000n },
        { productId: 'prod-oil', quantity: 30_000n, unitCost: 780_000n },
      ],
    })
    const detergentPurchase = this.purchasing.receivePurchase({
      id: 'PUR-5002',
      businessId: managementBusinessId,
      supplierId: 'supplier-prime',
      actorId: 'user-nkechi',
      clientEventId: 'seed-purchase-5002',
      occurredAt: daysAgo(13),
      lines: [
        { productId: 'prod-detergent', quantity: 2_000n, unitCost: 270_000n },
      ],
    })
    this.purchasing.recordPayment({
      id: 'PAY-5002',
      businessId: managementBusinessId,
      purchaseId: detergentPurchase.id,
      amount: 300_000n,
      method: 'transfer',
      reference: 'TRF-5002',
      actorId: 'user-nkechi',
      clientEventId: 'seed-payment-5002',
      state: 'confirmed_success',
      occurredAt: daysAgo(13, 60),
    })
    this.purchasing.recordPayment({
      id: 'PAY-5003',
      businessId: managementBusinessId,
      purchaseId: detergentPurchase.id,
      amount: 240_000n,
      method: 'transfer',
      reference: 'TRF-5003',
      actorId: 'user-nkechi',
      clientEventId: 'seed-payment-5003',
      state: 'pending',
      occurredAt: minutesAgo(120),
    })

    // A sale beyond recorded stock: negative stock stays visible as an
    // exception with provisional COGS (B06/H01).
    this.sales.complete({
      businessId: managementBusinessId,
      id: 'SAL-4004',
      clientRequestId: 'seed-sale-4004',
      actorId: 'user-nkechi',
      actorRole: 'owner',
      lines: [{ id: 'line-1', productId: 'prod-detergent', quantity: 3 }],
      payments: [
        {
          id: 'pay-1',
          method: 'cash',
          amountKobo: 1_050_000,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-nkechi',
          },
        },
      ],
      occurredAt: daysAgo(12),
    })

    // Manager's own transfer sale — later corrected by the manager with
    // Owner approval, so the correction is flagged for Owner review (B08).
    this.sales.complete({
      businessId: managementBusinessId,
      id: 'SAL-4002',
      clientRequestId: 'seed-sale-4002',
      actorId: 'user-ngozi',
      actorRole: 'manager',
      lines: [{ id: 'line-1', productId: 'prod-rice', quantity: 1 }],
      payments: [
        {
          id: 'pay-1',
          method: 'bank_transfer',
          amountKobo: 6_500_000,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-ngozi',
            externalReference: 'TRF-4002',
          },
        },
      ],
      occurredAt: daysAgo(3),
    })
    this.returnsCorrections.correctSale({
      businessId: managementBusinessId,
      saleId: 'SAL-4002',
      clientEventId: 'seed-correction-6101',
      actorId: 'user-ngozi',
      actorRole: 'manager',
      reason: 'Bank confirmed ₦64,000.00 was received, not ₦65,000.00.',
      occurredAt: minutesAgo(60),
      change: {
        field: 'payment_amount',
        paymentId: 'pay-1',
        correctedAmountKobo: 6_400_000,
      },
      approval: { approverId: 'user-nkechi', approverRole: 'owner' },
    })

    // Credit customers and debts (one overdue, one current).
    this.credit.createCustomer({
      businessId: managementBusinessId,
      id: 'customer-ada',
      name: 'Ada Obi',
      phone: '08090000003',
      creditStatus: 'allowed',
      creditLimitMinor: 20_000_000n,
      actorId: 'user-ngozi',
    })
    this.credit.createCustomer({
      businessId: managementBusinessId,
      id: 'customer-bola',
      name: 'Bola Adeyemi',
      phone: '08090000004',
      creditStatus: 'allowed',
      creditLimitMinor: 10_000_000n,
      actorId: 'user-ngozi',
    })
    this.sales.complete({
      businessId: managementBusinessId,
      id: 'SAL-4006',
      clientRequestId: 'seed-sale-4006',
      actorId: 'user-ngozi',
      actorRole: 'manager',
      lines: [{ id: 'line-1', productId: 'prod-rice', quantity: 1 }],
      payments: [
        {
          id: 'pay-1',
          method: 'customer_credit',
          amountKobo: 6_500_000,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-ngozi',
          },
        },
      ],
      customer: {
        id: 'customer-bola',
        name: 'Bola Adeyemi',
        phone: '08090000004',
      },
      creditApproval: { approverId: 'user-nkechi', approverRole: 'owner' },
      occurredAt: daysAgo(5),
    })
    this.credit.recordCreditSale({
      businessId: managementBusinessId,
      customerId: 'customer-bola',
      debtId: 'DEBT-4006',
      saleId: 'SAL-4006',
      amountMinor: 6_500_000n,
      dueDate: daysAhead(5),
      actorId: 'user-ngozi',
      actorRole: 'manager',
      clientEventId: 'seed-credit-sale-4006',
      creditApproval: { approverId: 'user-nkechi', approverRole: 'owner' },
      occurredAt: daysAgo(5),
    })
    this.creditLinks.set('SAL-4006', {
      customerId: 'customer-bola',
      customerName: 'Bola Adeyemi',
      debtId: 'DEBT-4006',
    })

    // Today's cash sale.
    this.sales.complete({
      businessId: managementBusinessId,
      id: 'SAL-4001',
      clientRequestId: 'seed-sale-4001',
      actorId: 'user-chidi',
      actorRole: 'staff',
      lines: [
        { id: 'line-1', productId: 'prod-rice', quantity: 2 },
        { id: 'line-2', productId: 'prod-oil', quantity: 1 },
      ],
      payments: [
        {
          id: 'pay-1',
          method: 'cash',
          amountKobo: 13_950_000,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
          },
        },
      ],
      occurredAt: minutesAgo(40),
    })

    // Today's credit sale to Ada, partially repaid, overdue.
    this.sales.complete({
      businessId: managementBusinessId,
      id: 'SAL-4003',
      clientRequestId: 'seed-sale-4003',
      actorId: 'user-chidi',
      actorRole: 'staff',
      lines: [{ id: 'line-1', productId: 'prod-oil', quantity: 2 }],
      payments: [
        {
          id: 'pay-1',
          method: 'customer_credit',
          amountKobo: 1_900_000,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-ngozi',
          },
        },
      ],
      customer: {
        id: 'customer-ada',
        name: 'Ada Obi',
        phone: '08090000003',
      },
      creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
      occurredAt: minutesAgo(90),
    })
    this.credit.recordCreditSale({
      businessId: managementBusinessId,
      customerId: 'customer-ada',
      debtId: 'DEBT-4003',
      saleId: 'SAL-4003',
      amountMinor: 1_900_000n,
      dueDate: daysAgo(3),
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-credit-sale-4003',
      creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
      occurredAt: minutesAgo(90),
    })
    this.creditLinks.set('SAL-4003', {
      customerId: 'customer-ada',
      customerName: 'Ada Obi',
      debtId: 'DEBT-4003',
    })
    this.credit.recordRepayment({
      businessId: managementBusinessId,
      customerId: 'customer-ada',
      repaymentId: 'REPAY-4003',
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-repayment-4003',
      components: [
        {
          method: 'cash',
          amountMinor: 600_000n,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
          },
        },
      ],
      allocations: [{ debtId: 'DEBT-4003', amountMinor: 600_000n }],
      occurredAt: minutesAgo(30),
    })

    // Today's split-payment sale with VAT.
    this.sales.complete({
      businessId: managementBusinessId,
      id: 'SAL-4005',
      clientRequestId: 'seed-sale-4005',
      actorId: 'user-chidi',
      actorRole: 'staff',
      lines: [
        { id: 'line-1', productId: 'prod-detergent', quantity: 1 },
        { id: 'line-2', productId: 'prod-oil', quantity: 1 },
      ],
      taxRateBasisPoints: 750n,
      payments: [
        {
          id: 'pay-1',
          method: 'cash',
          amountKobo: 1_000_000,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
          },
        },
        {
          id: 'pay-2',
          method: 'pos_card',
          amountKobo: 397_500,
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
            externalReference: 'POS-8832',
          },
        },
      ],
      occurredAt: minutesAgo(20),
    })

    // Staff-requested return on the manager's sale, verified and waiting
    // for the approval decision.
    const seededReturn = this.returnsCorrections.requestReturn({
      businessId: managementBusinessId,
      saleId: 'SAL-4002',
      returnId: 'RET-6601',
      clientEventId: 'seed-return-6601',
      requestedById: 'user-chidi',
      requestedByRole: 'staff',
      reason: 'Customer returned an unopened bag; wrong brand requested.',
      lines: [{ lineId: 'line-1', productId: 'prod-rice', quantity: 1 }],
      occurredAt: minutesAgo(25),
    })
    this.seededReturnIds.push(seededReturn.id)
    this.returnsCorrections.verifyReturn(
      managementBusinessId,
      seededReturn.id,
      'user-ngozi',
      'manager',
    )

    // Cash session: shared drawer with an unresolved ₦750 shortage.
    this.cash.openBusinessDay({
      businessId: managementBusinessId,
      sessionId: this.cashSessionId,
      custodyMode: 'shared_drawer',
      actorId: 'user-ngozi',
      actorRole: 'manager',
    })
    this.cash.enterOpeningCash(
      managementBusinessId,
      this.cashSessionId,
      500_000,
      'user-chidi',
      'staff',
    )
    this.cash.confirmOpeningCash(
      managementBusinessId,
      this.cashSessionId,
      500_000,
      'user-ngozi',
      'manager',
      'Counted float confirmed with staff entry.',
    )
    this.cash.recordCashEvent({
      businessId: managementBusinessId,
      sessionId: this.cashSessionId,
      id: 'CEV-7001',
      kind: 'cash_sale',
      amountKobo: 13_950_000,
      actorId: 'user-chidi',
      actorRole: 'staff',
      reason: 'Cash from sale SAL-4001',
      occurredAt: minutesAgo(40),
    })
    this.cash.recordCashEvent({
      businessId: managementBusinessId,
      sessionId: this.cashSessionId,
      id: 'CEV-7002',
      kind: 'cash_sale',
      amountKobo: 1_000_000,
      actorId: 'user-chidi',
      actorRole: 'staff',
      reason: 'Cash part of split sale SAL-4005',
      occurredAt: minutesAgo(20),
    })
    this.cash.recordCashEvent({
      businessId: managementBusinessId,
      sessionId: this.cashSessionId,
      id: 'CEV-7003',
      kind: 'cash_in',
      amountKobo: 200_000,
      actorId: 'user-chidi',
      actorRole: 'staff',
      reason: 'Change float added to the drawer',
      occurredAt: minutesAgo(15),
    })
    this.cash.recordCashEvent({
      businessId: managementBusinessId,
      sessionId: this.cashSessionId,
      id: 'CEV-7004',
      kind: 'cash_out',
      amountKobo: 150_000,
      actorId: 'user-ngozi',
      actorRole: 'manager',
      reason: 'Transport for the evening delivery',
      occurredAt: minutesAgo(10),
    })
    this.cash.recordActualCash(
      managementBusinessId,
      this.cashSessionId,
      15_425_000,
      'user-ngozi',
      'manager',
    )
    this.cash.prepareReconciliation(
      managementBusinessId,
      this.cashSessionId,
      'user-ngozi',
      'manager',
    )

    // Expenses are explicit reporting adapter inputs until the durable
    // expense read model exists (Handoff 16 known limitation).
    this.expenses = [
      {
        id: 'EXP-8001',
        businessId: managementBusinessId,
        amountKobo: 120_000,
        occurredAt: minutesAgo(120),
        category: 'Transport & delivery',
        actorId: 'user-ngozi',
      },
      {
        id: 'EXP-8002',
        businessId: managementBusinessId,
        amountKobo: 80_000,
        occurredAt: daysAgo(3),
        category: 'Packaging',
        actorId: 'user-nkechi',
      },
    ]

    this.incentivePolicy = {
      enabled: true,
      percentage: 10,
      minimumQualifyingCompletedSales: 3,
    }
  }
}

export type {
  BusinessPerformanceReport,
  CorrectionEvent,
  ExpenseRecord,
  IncentivePolicy,
  SaleAuditEvent,
  StaffPerformance,
}
