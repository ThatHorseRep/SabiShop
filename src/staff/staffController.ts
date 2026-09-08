import { effectivePermissions } from '../auth/policy'
import type { Permission } from '../auth/types'
import { CatalogPricing, type Product } from '../domain/catalogPricing'
import {
  CashReconciliationEngine,
  type CashEvent,
  type CashReconciliationSnapshot,
} from '../domain/cashReconciliation'
import {
  CustomersCreditEngine,
  type CreditHistoryEvent,
  type Customer,
  type DebtSnapshot,
} from '../domain/customersCredit'
import { InventoryEngine, type StockLevel } from '../domain/inventory'
import {
  ReturnsCorrectionsEngine,
  type ReturnRecord,
} from '../domain/returnsCorrections'
import {
  SalesTransactionEngine,
  type CompletedSale,
  type PaymentMethod,
} from '../domain/sales'
import { posActors, posBusiness, type PosActor } from '../pos/posSession'
import {
  CanonicalReporting,
  type IncentivePolicy,
  type StaffPerformance,
} from '../reporting'
import { formatKobo } from '../ui/format'

export const staffBusinessId = posBusiness.id

export type StaffActorId = PosActor['id']
export const staffActors: readonly PosActor[] = posActors

/**
 * Owning application areas for work started from the dashboard. The values
 * match the C04 navigation destinations; the dashboard itself never mutates
 * business records (C01 sections 5.1, 26).
 */
export type StaffWorkArea =
  'sell' | 'money' | 'products-inventory' | 'customers-credit'

export type MySaleDerivedState =
  'completed' | 'partially_returned' | 'fully_returned' | 'reversed'

export type MySaleView = {
  sale: CompletedSale
  derivedState: MySaleDerivedState
  stateLabel: string
  paymentSummary: string
  itemCount: number
}

export type MoneyOutView = {
  event: CashEvent
  kindLabel: string
  actorName: string
}

export type StockItemView = {
  product: Product
  stock: StockLevel
  sellableUnits: number
  stockLabel: string
  stockTone: 'danger' | 'warning' | 'neutral'
  hasExplicitFloor: boolean
}

export type CustomerCollectionView = {
  customer: Customer
  outstandingMinor: bigint
  debts: DebtSnapshot[]
  stateLabel: 'Overdue' | 'Due' | 'Current'
  tone: 'danger' | 'warning' | 'info'
}

export type OpenReturnView = {
  record: ReturnRecord
  stateLabel: string
}

export type MyRepaymentView = {
  event: CreditHistoryEvent
  customerName: string
}

export type AttentionItemView = {
  id: string
  title: string
  whatHappened: string
  whyItMatters: string
  nextStep: string
  area?: StaffWorkArea
}

export type ActivityEntryView = {
  id: string
  at: string
  title: string
  detail: string
}

export type StaffSnapshot = {
  actor: PosActor
  permissions: readonly Permission[]
  businessName: string
  businessDay: {
    sessionId: string
    stateLabel: string
    custodyLabel: string
    openedAt: string
    openedByName: string
    confirmedOpeningKobo: number
    cashInHand: {
      valueKobo: number
      basis: 'expected_not_counted' | 'counted'
      countedAt?: string
      countedByName?: string
    }
    moneyOutTodayKobo: number
  }
  myDay: {
    saleCount: number
    salesTotalKobo: number
    cashFromMySalesKobo: number
    lastSaleAt?: string
    sales: MySaleView[]
    repaymentCount: number
    repaidTotalMinor: bigint
    repayments: MyRepaymentView[]
  }
  moneyOut: MoneyOutView[]
  stock: {
    attentionCount: number
    products: StockItemView[]
  }
  customers: {
    collection: CustomerCollectionView[]
  }
  performance: {
    incentiveEnabled: boolean
    status: StaffPerformance['incentiveStatus'] | 'not_measured'
    qualifyingSales: number
    minimumQualifyingSales: number
    eligibleValueKobo: number
    netRecognizedSellingValueKobo: number
    openReturns: OpenReturnView[]
  }
  attention: AttentionItemView[]
  activity: ActivityEntryView[]
}

const actorName = (actorId: string): string =>
  posActors.find((actor) => actor.id === actorId)?.displayName ?? actorId

export const paymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'bank_transfer':
      return 'Bank transfer'
    case 'pos_card':
      return 'POS card'
    case 'customer_credit':
      return 'Customer credit'
    case 'custom':
      return 'Custom method'
    default:
      return 'Cash'
  }
}

const businessDayStateLabel = (
  snapshot: CashReconciliationSnapshot,
): string => {
  switch (snapshot.state) {
    case 'open_session':
      return 'Business day open'
    case 'count_recorded':
      return 'Physical count recorded'
    case 'reconciliation_prepared':
      return 'Reconciliation prepared'
    case 'management_confirmed':
      return 'Management confirmed'
    case 'closed':
      return 'Closed'
    default:
      return 'Reopened'
  }
}

const returnStateLabel = (record: ReturnRecord): string => {
  switch (record.state) {
    case 'requested':
      return 'Awaiting verification'
    case 'verified':
      return 'Verified — awaiting approval'
    case 'approved':
      return 'Approved — awaiting application'
    case 'rejected':
      return 'Rejected'
    case 'settled':
      return 'Applied and settled'
    default:
      return 'Applied'
  }
}

const stockView = (product: Product, stock: StockLevel): StockItemView => {
  const sellableUnits = Number(stock.sellable / 1000n)
  const stockLabel = stock.negative
    ? `Stock exception · ${sellableUnits}`
    : sellableUnits === 0
      ? 'Out of stock'
      : `${sellableUnits} in stock`
  return {
    product,
    stock,
    sellableUnits,
    stockLabel,
    stockTone: stock.negative
      ? 'danger'
      : sellableUnits === 0
        ? 'warning'
        : 'neutral',
    hasExplicitFloor: product.priceFloorKobo !== undefined,
  }
}
/**
 * Composition root for the staff Home surface. The dashboard is read-only:
 * every figure is either a plain presentation of engine records or the
 * canonical reporting projection — never a second business calculation
 * (C01 sections 5.1, 26; B09 section 30).
 */
export class StaffController {
  private readonly catalog = new CatalogPricing({
    belowFloorMode: 'block_until_authorized',
    incentivePercentage: 10,
    minimumQualifyingCompletedSales: 3,
  })
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
  private readonly cash = new CashReconciliationEngine()
  private readonly reporting: CanonicalReporting
  private readonly incentivePolicy: IncentivePolicy = {
    enabled: true,
    percentage: 10,
    minimumQualifyingCompletedSales: 3,
  }
  private readonly trackedReturnIds: string[] = []
  private readonly cashSessionId = 'BD-staff-today'
  private actorId: StaffActorId = 'user-chidi'

  constructor() {
    this.seedReferenceBusiness()
    this.reporting = new CanonicalReporting({
      sales: this.sales,
      inventory: this.inventory,
      returns: this.returnsCorrections,
      incentivePolicy: this.incentivePolicy,
    })
  }

  setActor(actorId: StaffActorId): void {
    if (!posActors.some((actor) => actor.id === actorId)) {
      throw new Error('Unknown actor')
    }
    this.actorId = actorId
  }

  getActor(): PosActor {
    return posActors.find((actor) => actor.id === this.actorId)!
  }

  /**
   * The staff dashboard is the Staff Home surface (C01 section 5.1).
   * Management sessions use the Management destination for business
   * analysis; their Home remains the honest foundation state until the
   * management Home is designed.
   */
  canViewStaffDashboard(): boolean {
    return this.getActor().role === 'staff'
  }

  snapshot(): StaffSnapshot {
    const actor = this.getActor()
    const permissions = effectivePermissions({ roles: [actor.role] })
    const cashSnapshot = this.cash.getSnapshot(
      staffBusinessId,
      this.cashSessionId,
    )
    const cashEvents = this.cash.listEvents(staffBusinessId, this.cashSessionId)
    const audits = this.cash
      .listAudits(staffBusinessId)
      .filter((event) => event.sessionId === this.cashSessionId)
    const openedAudit = audits.find(
      (event) => event.type === 'business_day.opened',
    )
    const openedAt = openedAudit?.occurredAt ?? new Date().toISOString()

    // "Today" is the open business-day session, which may cross midnight
    // until official closure (B05 final reconciliation).
    const mySales = this.sales
      .listReports()
      .filter(
        (event) =>
          event.businessId === staffBusinessId &&
          event.type === 'sale.completed' &&
          event.occurredAt >= openedAt,
      )
      .map((event) => this.sales.getSale(staffBusinessId, event.saleId))
      .filter((sale): sale is CompletedSale => sale !== undefined)
      .filter((sale) => sale.actorId === actor.id)
      .sort((left, right) => right.completedAt.localeCompare(left.completedAt))

    const returnsBySale = new Map<string, ReturnRecord[]>()
    this.trackedReturnIds.forEach((returnId) => {
      const record = this.returnsCorrections.getReturn(
        staffBusinessId,
        returnId,
      )
      if (!record) return
      const list = returnsBySale.get(record.saleId) ?? []
      list.push(record)
      returnsBySale.set(record.saleId, list)
    })

    const mySaleViews = mySales.map((sale) => {
      const returns = returnsBySale.get(sale.id) ?? []
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
      const derivedState: MySaleDerivedState = sale.reversedAt
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
        derivedState,
        stateLabel,
        paymentSummary: sale.payments
          .map(
            (payment) =>
              `${paymentMethodLabel(payment.method)} ₦${formatKobo(
                payment.amountKobo,
              )}`,
          )
          .join(' + '),
        itemCount: sale.lines.reduce((sum, line) => sum + line.quantity, 0),
      } satisfies MySaleView
    })

    const moneyOut = cashEvents
      .filter(
        (event) => event.kind === 'cash_out' || event.kind === 'cash_refund',
      )
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .map((event) => ({
        event,
        kindLabel:
          event.kind === 'cash_out' ? 'Cash out' : 'Cash refund from till',
        actorName: actorName(event.actorId),
      }))

    const lastCount = [...audits]
      .reverse()
      .find((event) => event.type === 'cash.actual_count.recorded')
    const cashInHand = cashSnapshot.actualCashKobo
      ? {
          valueKobo: cashSnapshot.actualCashKobo,
          basis: 'counted' as const,
          countedAt: lastCount?.occurredAt,
          countedByName: lastCount ? actorName(lastCount.actorId) : undefined,
        }
      : {
          valueKobo: cashSnapshot.expectedCashKobo,
          basis: 'expected_not_counted' as const,
        }

    const myRepayments = this.credit
      .listHistory(staffBusinessId)
      .filter(
        (event) =>
          event.type === 'credit.repayment.recorded' &&
          event.actorId === actor.id &&
          event.occurredAt >= openedAt,
      )
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .map((event) => ({
        event,
        customerName:
          this.credit.getCustomer(staffBusinessId, event.customerId)?.name ??
          event.customerId,
      }))
    const collection = this.credit
      .listCustomers(staffBusinessId)
      .map((customer) => ({
        customer,
        outstanding: this.credit.getOutstandingForCustomer(
          staffBusinessId,
          customer.id,
        ),
        debts: this.credit.listDebts(staffBusinessId, customer.id),
      }))
      .filter((entry) => entry.outstanding.minor > 0n)
      .map((entry) => {
        const stateLabel: CustomerCollectionView['stateLabel'] =
          entry.debts.some((debt) => debt.isOverdue)
            ? 'Overdue'
            : entry.debts.some((debt) => debt.isDue)
              ? 'Due'
              : 'Current'
        return {
          customer: entry.customer,
          outstandingMinor: entry.outstanding.minor,
          debts: entry.debts,
          stateLabel,
          tone:
            stateLabel === 'Overdue'
              ? ('danger' as const)
              : stateLabel === 'Due'
                ? ('warning' as const)
                : ('info' as const),
        }
      })
      .sort((left, right) => {
        const rank = (view: CustomerCollectionView) =>
          view.stateLabel === 'Overdue' ? 0 : view.stateLabel === 'Due' ? 1 : 2
        return (
          rank(left) - rank(right) ||
          left.customer.name.localeCompare(right.customer.name)
        )
      })

    const products = this.catalog
      .searchProducts('', true)
      .map((product) => stockView(product, this.inventory.getStock(product.id)))
    const stockAttention = products.filter((item) => item.stock.negative)

    // Personal performance comes from the canonical projection only, so the
    // dashboard can never disagree with management's figures (C01 section
    // 26; B13 sections 11-13).
    const performance = this.reporting.project(staffBusinessId, {
      from: openedAt,
      to: new Date().toISOString(),
    })
    const myPerformance = performance.staff.find(
      (entry) => entry.salespersonId === actor.id,
    )
    const mySaleIds = new Set(mySales.map((sale) => sale.id))
    const openReturns = this.trackedReturnIds
      .map((returnId) =>
        this.returnsCorrections.getReturn(staffBusinessId, returnId),
      )
      .filter((record): record is ReturnRecord => record !== undefined)
      .filter(
        (record) =>
          mySaleIds.has(record.saleId) &&
          record.state !== 'applied' &&
          record.state !== 'settled' &&
          record.state !== 'rejected',
      )
      .map((record) => ({ record, stateLabel: returnStateLabel(record) }))

    const attention = this.buildAttention(
      openReturns,
      stockAttention,
      collection,
    )

    return {
      actor,
      permissions: [...permissions],
      businessName: posBusiness.name,
      businessDay: {
        sessionId: this.cashSessionId,
        stateLabel: businessDayStateLabel(cashSnapshot),
        custodyLabel:
          cashSnapshot.custodyMode === 'shared_drawer'
            ? 'Shared drawer'
            : 'Individual salesperson custody',
        openedAt,
        openedByName: actorName(openedAudit?.actorId ?? actor.id),
        confirmedOpeningKobo: cashSnapshot.confirmedOpeningCashKobo,
        cashInHand,
        moneyOutTodayKobo: moneyOut.reduce(
          (sum, view) => sum + view.event.amountKobo,
          0,
        ),
      },
      myDay: {
        saleCount: mySaleViews.length,
        salesTotalKobo: mySaleViews.reduce(
          (sum, view) => sum + view.sale.totalDueKobo,
          0,
        ),
        cashFromMySalesKobo: mySaleViews.reduce(
          (sum, view) => sum + view.sale.cashKobo,
          0,
        ),
        lastSaleAt: mySaleViews[0]?.sale.completedAt,
        sales: mySaleViews,
        repaymentCount: myRepayments.length,
        repaidTotalMinor: myRepayments.reduce(
          (sum, view) => sum + (view.event.amountMinor ?? 0n),
          0n,
        ),
        repayments: myRepayments,
      },
      moneyOut,
      stock: {
        attentionCount: stockAttention.length,
        products,
      },
      customers: { collection },
      performance: {
        incentiveEnabled: this.incentivePolicy.enabled,
        status: myPerformance
          ? myPerformance.incentiveStatus
          : ('not_measured' as const),
        qualifyingSales: myPerformance?.qualifyingSales ?? 0,
        minimumQualifyingSales:
          this.incentivePolicy.minimumQualifyingCompletedSales,
        eligibleValueKobo: myPerformance?.incentiveEligibleValueKobo ?? 0,
        netRecognizedSellingValueKobo:
          myPerformance?.netRecognizedSellingValueKobo ?? 0,
        openReturns,
      },
      attention,
      activity: this.buildActivity(actor.id, mySaleViews, myRepayments),
    }
  }

  searchProducts(query: string): StockItemView[] {
    return this.catalog
      .searchProducts(query, false)
      .map((product) => stockView(product, this.inventory.getStock(product.id)))
  }

  private buildAttention(
    openReturns: Array<{ record: ReturnRecord; stateLabel: string }>,
    stockAttention: StockItemView[],
    collection: CustomerCollectionView[],
  ): AttentionItemView[] {
    const items: AttentionItemView[] = []
    openReturns.forEach(({ record, stateLabel }) => {
      items.push({
        id: `return-${record.id}`,
        title: `Return ${record.id} on sale ${record.saleId}: ${stateLabel}`,
        whatHappened: `${record.reason} Requested by ${actorName(record.requestedById)}.`,
        whyItMatters:
          'An unapplied return changes nothing yet. Once management verifies, approves, and applies it, the sale, stock, and any incentive figures recalculate automatically.',
        nextStep:
          'Nothing is required from you right now. Management decides; you may be asked how the sale happened.',
        area: 'money',
      })
    })
    stockAttention.forEach((item) => {
      items.push({
        id: `stock-${item.product.id}`,
        title: `Negative stock: ${item.product.name}`,
        whatHappened: `More units were sold than recorded stock. Sellable stock is now ${item.sellableUnits}.`,
        whyItMatters:
          'Selling is not blocked, but every further sale deepens the negative record and its provisional cost consequence. Management investigates the cause.',
        nextStep:
          'Continue selling if the goods are physically there. Tell management so the stock record can be corrected with evidence.',
        area: 'products-inventory',
      })
    })
    collection
      .filter((view) => view.stateLabel !== 'Current')
      .forEach((view) => {
        items.push({
          id: `credit-${view.customer.id}`,
          title: `${view.stateLabel} credit: ${view.customer.name}`,
          whatHappened: `Outstanding debt is ₦${formatKobo(
            Number(view.outstandingMinor),
          )}.`,
          whyItMatters:
            'The money is owed to the business. Collecting it is normal shop work that you may perform where permitted.',
          nextStep:
            'Collect repayment when the customer comes in, and record only payment that has actually been confirmed.',
          area: 'customers-credit',
        })
      })
    return items
  }

  private buildActivity(
    actorId: string,
    sales: MySaleView[],
    repayments: MyRepaymentView[],
  ): ActivityEntryView[] {
    const entries: ActivityEntryView[] = []
    sales.forEach((view) => {
      entries.push({
        id: `sale-${view.sale.id}`,
        at: view.sale.completedAt,
        title: `Sale ${view.sale.id} completed`,
        detail: `₦${formatKobo(view.sale.totalDueKobo)} · ${view.paymentSummary} · ${view.stateLabel}`,
      })
    })
    this.trackedReturnIds.forEach((returnId) => {
      const record = this.returnsCorrections.getReturn(
        staffBusinessId,
        returnId,
      )
      if (record && record.requestedById === actorId) {
        entries.push({
          id: `return-${record.id}`,
          at: record.requestedAt,
          title: `Return ${record.id} requested on ${record.saleId}`,
          detail: record.reason,
        })
      }
    })
    this.cash
      .listEvents(staffBusinessId, this.cashSessionId)
      .filter((event) => event.actorId === actorId)
      .forEach((event) => {
        entries.push({
          id: `cash-${event.id}`,
          at: event.occurredAt,
          title: `${event.kind.replace('_', ' ')} recorded`,
          detail: `₦${formatKobo(event.amountKobo)} · ${event.reason}`,
        })
      })
    repayments.forEach((view) => {
      entries.push({
        id: `repayment-${view.event.id}`,
        at: view.event.occurredAt,
        title: `Repayment recorded for ${view.customerName}`,
        detail: `₦${formatKobo(Number(view.event.amountMinor ?? 0n))} confirmed`,
      })
    })
    return entries
      .sort((left, right) => right.at.localeCompare(left.at))
      .slice(0, 8)
  }
  // ------------------------------------------------------------------
  // Reference dataset (in-memory engines, same pattern as Handoffs 18-22)
  // ------------------------------------------------------------------

  private seedReferenceBusiness(): void {
    const minutesAgo = (minutes: number) =>
      new Date(Date.now() - minutes * 60_000).toISOString()
    const daysAgo = (days: number) =>
      new Date(Date.now() - days * 24 * 60 * 60_000).toISOString()
    const daysAhead = (days: number) =>
      new Date(Date.now() + days * 24 * 60 * 60_000).toISOString()
    const naira = (amount: number) => amount * 100

    const products: Array<{
      id: string
      sku: string
      name: string
      category: string
      unit: string
      aliases: readonly string[]
      sellingPriceKobo: number
      priceFloorKobo?: number
      stock: number
      unitCostKobo: number
    }> = [
      {
        id: 'p-spark-plug',
        sku: 'PLUG-NGK-01',
        name: 'Spark Plug NGK',
        category: 'Engine parts',
        unit: 'each',
        aliases: ['plug'],
        sellingPriceKobo: naira(850),
        priceFloorKobo: naira(700),
        stock: 40,
        unitCostKobo: naira(520),
      },
      {
        id: 'p-engine-oil',
        sku: 'OIL-4L-SAE40',
        name: 'Engine Oil 4L SAE 40',
        category: 'Fluids',
        unit: 'bottle',
        aliases: ['oil', 'lubricant'],
        sellingPriceKobo: naira(12_500),
        priceFloorKobo: naira(11_000),
        stock: 15,
        unitCostKobo: naira(8_200),
      },
      {
        id: 'p-air-filter',
        sku: 'FLT-AIR-COR',
        name: 'Air Filter Toyota Corolla',
        category: 'Filters',
        unit: 'each',
        aliases: ['filter'],
        sellingPriceKobo: naira(6_800),
        priceFloorKobo: naira(5_500),
        stock: 12,
        unitCostKobo: naira(4_100),
      },
      {
        id: 'p-brake-pads',
        sku: 'BRK-PAD-FRT',
        name: 'Brake Pads Front',
        category: 'Brakes',
        unit: 'set',
        aliases: ['brakes', 'pads'],
        sellingPriceKobo: naira(18_000),
        priceFloorKobo: naira(15_000),
        stock: 8,
        unitCostKobo: naira(11_500),
      },
      {
        id: 'p-battery',
        sku: 'BAT-12V-65',
        name: 'Car Battery 12V 65Ah',
        category: 'Electrical',
        unit: 'each',
        aliases: ['battery'],
        sellingPriceKobo: naira(95_000),
        priceFloorKobo: naira(85_000),
        stock: 5,
        unitCostKobo: naira(68_000),
      },
      {
        id: 'p-grease',
        sku: 'GRS-500G',
        name: 'Grease 500g',
        category: 'Fluids',
        unit: 'tin',
        aliases: ['grease'],
        sellingPriceKobo: naira(3_200),
        stock: 25,
        unitCostKobo: naira(2_100),
      },
      {
        id: 'p-headlamp-bulb',
        sku: 'BLB-HL-H4',
        name: 'Headlamp Bulb H4',
        category: 'Electrical',
        unit: 'each',
        aliases: ['bulb', 'headlamp'],
        sellingPriceKobo: naira(4_500),
        priceFloorKobo: naira(3_800),
        stock: 30,
        unitCostKobo: naira(2_900),
      },
      {
        id: 'p-wiper-blade',
        sku: 'WIP-BLD-22',
        name: 'Wiper Blade 22 inch',
        category: 'Body and glass',
        unit: 'each',
        aliases: ['wiper'],
        sellingPriceKobo: naira(5_200),
        priceFloorKobo: naira(4_200),
        stock: 18,
        unitCostKobo: naira(3_300),
      },
      {
        id: 'p-fuel-filter',
        sku: 'FLT-FUEL-IN',
        name: 'Fuel Filter Inline',
        category: 'Filters',
        unit: 'each',
        aliases: ['fuel'],
        sellingPriceKobo: naira(3_600),
        priceFloorKobo: naira(3_000),
        stock: 2,
        unitCostKobo: naira(2_200),
      },
    ]

    for (const product of products) {
      this.catalog.createProduct({
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        unit: product.unit,
        aliases: [...product.aliases],
        sellingPriceKobo: product.sellingPriceKobo,
        priceFloorKobo: product.priceFloorKobo,
        active: true,
        availableForSale: true,
      })
      this.inventory.receive({
        businessId: staffBusinessId,
        productId: product.id,
        quantity: BigInt(product.stock * 1000),
        unitCost: BigInt(product.unitCostKobo),
        actorId: 'user-nkechi',
        reason: 'Opening stock',
        clientEventId: `seed-receipt-${product.id}`,
        occurredAt: daysAgo(1),
      })
    }

    const customers = [
      {
        id: 'c-ada',
        name: 'Ada Obi',
        phone: '0803 111 2233',
        creditStatus: 'allowed' as const,
        creditLimitMinor: BigInt(naira(150_000)),
      },
      {
        id: 'c-emeka',
        name: 'Emeka Duru',
        phone: '0805 444 8899',
        creditStatus: 'allowed' as const,
        creditLimitMinor: BigInt(naira(100_000)),
      },
      {
        id: 'c-funke',
        name: 'Funke Adeyemi',
        phone: '0807 222 1144',
        creditStatus: 'restricted' as const,
      },
      {
        id: 'c-tunde',
        name: 'Tunde Bala',
        phone: '0810 999 3355',
        creditStatus: 'blocked' as const,
      },
    ]
    for (const customer of customers) {
      this.credit.createCustomer({
        businessId: staffBusinessId,
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        creditStatus: customer.creditStatus,
        creditLimitMinor: customer.creditLimitMinor,
        actorId: 'user-nkechi',
        occurredAt: daysAgo(30),
      })
    }
    // --- Sales and debts from before this business day (excluded from
    // today's work by the session boundary) ---
    this.sales.complete({
      businessId: staffBusinessId,
      id: 'SAL-4998',
      clientRequestId: 'seed-sale-4998',
      actorId: 'user-chidi',
      actorRole: 'staff',
      lines: [{ id: 'line-1', productId: 'p-brake-pads', quantity: 1 }],
      payments: [
        {
          id: 'pay-1',
          method: 'cash',
          amountKobo: naira(18_000),
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
          },
        },
      ],
      occurredAt: daysAgo(1),
    })

    this.credit.recordCreditSale({
      businessId: staffBusinessId,
      customerId: 'c-emeka',
      debtId: 'debt-emeka-old',
      saleId: 'SAL-4997',
      amountMinor: BigInt(naira(31_800)),
      dueDate: daysAhead(8),
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-credit-emeka-old',
      creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
      occurredAt: daysAgo(6),
    })
    this.sales.complete({
      businessId: staffBusinessId,
      id: 'SAL-4997',
      clientRequestId: 'seed-sale-4997',
      actorId: 'user-chidi',
      actorRole: 'staff',
      lines: [
        { id: 'line-1', productId: 'p-engine-oil', quantity: 2 },
        { id: 'line-2', productId: 'p-air-filter', quantity: 1 },
      ],
      payments: [
        {
          id: 'pay-1',
          method: 'customer_credit',
          amountKobo: naira(31_800),
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-ngozi',
          },
        },
      ],
      customer: { id: 'c-emeka', name: 'Emeka Duru', phone: '0805 444 8899' },
      creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
      occurredAt: daysAgo(6),
    })

    this.credit.recordCreditSale({
      businessId: staffBusinessId,
      customerId: 'c-ada',
      debtId: 'debt-ada-old',
      saleId: 'SAL-4999',
      amountMinor: BigInt(naira(36_000)),
      dueDate: daysAgo(2),
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-credit-ada-old',
      creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
      occurredAt: daysAgo(5),
    })
    this.sales.complete({
      businessId: staffBusinessId,
      id: 'SAL-4999',
      clientRequestId: 'seed-sale-4999',
      actorId: 'user-chidi',
      actorRole: 'staff',
      lines: [{ id: 'line-1', productId: 'p-brake-pads', quantity: 2 }],
      payments: [
        {
          id: 'pay-1',
          method: 'customer_credit',
          amountKobo: naira(36_000),
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-ngozi',
          },
        },
      ],
      customer: { id: 'c-ada', name: 'Ada Obi', phone: '0803 111 2233' },
      creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
      occurredAt: daysAgo(5),
    })

    // --- Today's business day: staff enter opening cash, management
    // confirms the official figure (B05 section 3) ---
    this.cash.openBusinessDay({
      businessId: staffBusinessId,
      sessionId: this.cashSessionId,
      custodyMode: 'shared_drawer',
      actorId: 'user-ngozi',
      actorRole: 'manager',
      occurredAt: minutesAgo(480),
    })
    this.cash.enterOpeningCash(
      staffBusinessId,
      this.cashSessionId,
      naira(5_000),
      'user-chidi',
      'staff',
    )
    this.cash.confirmOpeningCash(
      staffBusinessId,
      this.cashSessionId,
      naira(5_000),
      'user-ngozi',
      'manager',
      'Float counted with the staff entry.',
    )

    const completeSale = (input: {
      id: string
      lines: Array<{ id: string; productId: string; quantity: number }>
      payments: Array<{
        id: string
        method: PaymentMethod
        amountKobo: number
        externalReference?: string
      }>
      customer?: { id: string; name: string; phone: string }
      creditApproval?: { approverId: string; approverRole: 'manager' | 'owner' }
      occurredAt: string
    }) =>
      this.sales.complete({
        businessId: staffBusinessId,
        id: input.id,
        clientRequestId: `seed-${input.id.toLowerCase()}`,
        actorId: 'user-chidi',
        actorRole: 'staff',
        lines: input.lines,
        payments: input.payments.map((payment) => ({
          id: payment.id,
          method: payment.method,
          amountKobo: payment.amountKobo,
          confirmation: {
            state: 'confirmed_success' as const,
            confirmedBy: 'user-chidi',
            externalReference: payment.externalReference,
          },
        })),
        customer: input.customer,
        creditApproval: input.creditApproval,
        occurredAt: input.occurredAt,
      })

    const recordCashSale = (input: {
      id: string
      amountKobo: number
      reason: string
      occurredAt: string
    }) =>
      this.cash.recordCashEvent({
        businessId: staffBusinessId,
        sessionId: this.cashSessionId,
        id: `CEV-${input.id}`,
        kind: 'cash_sale',
        amountKobo: input.amountKobo,
        actorId: 'user-chidi',
        actorRole: 'staff',
        reason: input.reason,
        occurredAt: input.occurredAt,
      })

    completeSale({
      id: 'SAL-5001',
      lines: [{ id: 'line-1', productId: 'p-spark-plug', quantity: 2 }],
      payments: [{ id: 'pay-1', method: 'cash', amountKobo: naira(1_700) }],
      occurredAt: minutesAgo(150),
    })
    recordCashSale({
      id: '5001',
      amountKobo: naira(1_700),
      reason: 'Cash from sale SAL-5001',
      occurredAt: minutesAgo(150),
    })

    // Transfer sale confirmed by the staff member after external
    // verification, plus a floorless product sold at its normal price.
    completeSale({
      id: 'SAL-5002',
      lines: [
        { id: 'line-1', productId: 'p-engine-oil', quantity: 1 },
        { id: 'line-2', productId: 'p-grease', quantity: 1 },
      ],
      payments: [
        {
          id: 'pay-1',
          method: 'bank_transfer',
          amountKobo: naira(15_700),
          externalReference: 'TRF-7741',
        },
      ],
      occurredAt: minutesAgo(120),
    })

    completeSale({
      id: 'SAL-5003',
      lines: [{ id: 'line-1', productId: 'p-headlamp-bulb', quantity: 2 }],
      payments: [
        { id: 'pay-1', method: 'cash', amountKobo: naira(4_500) },
        {
          id: 'pay-2',
          method: 'pos_card',
          amountKobo: naira(4_500),
          externalReference: 'POS-2210',
        },
      ],
      occurredAt: minutesAgo(90),
    })
    recordCashSale({
      id: '5003',
      amountKobo: naira(4_500),
      reason: 'Cash part of split sale SAL-5003',
      occurredAt: minutesAgo(90),
    })

    this.cash.recordCashEvent({
      businessId: staffBusinessId,
      sessionId: this.cashSessionId,
      id: 'CEV-5010',
      kind: 'cash_in',
      amountKobo: naira(2_000),
      actorId: 'user-chidi',
      actorRole: 'staff',
      reason: 'Change money added to the drawer',
      occurredAt: minutesAgo(100),
    })
    // Today's credit sale to Ada, due in two weeks (a current debt).
    this.credit.recordCreditSale({
      businessId: staffBusinessId,
      customerId: 'c-ada',
      debtId: 'debt-ada-today',
      saleId: 'SAL-5004',
      amountMinor: BigInt(naira(5_200)),
      dueDate: daysAhead(14),
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-credit-ada-today',
      creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
      occurredAt: minutesAgo(60),
    })
    completeSale({
      id: 'SAL-5004',
      lines: [{ id: 'line-1', productId: 'p-wiper-blade', quantity: 1 }],
      payments: [
        { id: 'pay-1', method: 'customer_credit', amountKobo: naira(5_200) },
      ],
      customer: { id: 'c-ada', name: 'Ada Obi', phone: '0803 111 2233' },
      creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
      occurredAt: minutesAgo(60),
    })

    completeSale({
      id: 'SAL-5005',
      lines: [{ id: 'line-1', productId: 'p-battery', quantity: 1 }],
      payments: [{ id: 'pay-1', method: 'cash', amountKobo: naira(95_000) }],
      occurredAt: minutesAgo(30),
    })
    recordCashSale({
      id: '5005',
      amountKobo: naira(95_000),
      reason: 'Cash from sale SAL-5005',
      occurredAt: minutesAgo(30),
    })

    // Selling past recorded stock: only two fuel filters are recorded, three
    // were sold. Negative stock stays visible as an exception (B06).
    completeSale({
      id: 'SAL-5006',
      lines: [{ id: 'line-1', productId: 'p-fuel-filter', quantity: 3 }],
      payments: [{ id: 'pay-1', method: 'cash', amountKobo: naira(10_800) }],
      occurredAt: minutesAgo(20),
    })
    recordCashSale({
      id: '5006',
      amountKobo: naira(10_800),
      reason: 'Cash from sale SAL-5006',
      occurredAt: minutesAgo(20),
    })

    this.cash.recordCashEvent({
      businessId: staffBusinessId,
      sessionId: this.cashSessionId,
      id: 'CEV-5011',
      kind: 'cash_out',
      amountKobo: naira(1_500),
      actorId: 'user-ngozi',
      actorRole: 'manager',
      reason: 'Transport for the evening delivery',
      occurredAt: minutesAgo(25),
    })

    // Applied partial return on SAL-5003 with a cash refund from the till.
    const partialReturn = this.returnsCorrections.requestReturn({
      businessId: staffBusinessId,
      saleId: 'SAL-5003',
      returnId: 'RET-7501',
      clientEventId: 'seed-return-7501',
      requestedById: 'user-chidi',
      requestedByRole: 'staff',
      reason: 'Wrong bulb type; box unopened.',
      lines: [{ lineId: 'line-1', productId: 'p-headlamp-bulb', quantity: 1 }],
      occurredAt: minutesAgo(80),
    })
    this.trackedReturnIds.push(partialReturn.id)
    this.returnsCorrections.verifyReturn(
      staffBusinessId,
      'RET-7501',
      'user-ngozi',
      'manager',
    )
    this.returnsCorrections.approveReturn(
      staffBusinessId,
      'RET-7501',
      'user-ngozi',
      'manager',
      { condition: 'sellable' },
    )
    this.returnsCorrections.applyReturn(
      staffBusinessId,
      'RET-7501',
      'user-ngozi',
      'manager',
    )
    this.returnsCorrections.settleRefund(
      staffBusinessId,
      'RET-7501',
      'user-ngozi',
      { method: 'cash', externalReference: 'till-refund-7501' },
    )
    this.cash.recordCashEvent({
      businessId: staffBusinessId,
      sessionId: this.cashSessionId,
      id: 'CEV-5012',
      kind: 'cash_refund',
      amountKobo: naira(4_500),
      actorId: 'user-chidi',
      actorRole: 'staff',
      reason: 'Cash refund for applied return RET-7501',
      occurredAt: minutesAgo(70),
    })

    // Open return on the battery sale, still awaiting management
    // verification: it changes nothing until it is applied.
    const openReturn = this.returnsCorrections.requestReturn({
      businessId: staffBusinessId,
      saleId: 'SAL-5005',
      returnId: 'RET-7502',
      clientEventId: 'seed-return-7502',
      requestedById: 'user-chidi',
      requestedByRole: 'staff',
      reason:
        'Customer says the battery does not fit their car; asking management to verify.',
      lines: [{ lineId: 'line-1', productId: 'p-battery', quantity: 1 }],
      occurredAt: minutesAgo(10),
    })
    this.trackedReturnIds.push(openReturn.id)

    // A repayment collected today by the staff member against the overdue
    // debt (only confirmed payment is recorded).
    this.credit.recordRepayment({
      businessId: staffBusinessId,
      customerId: 'c-ada',
      repaymentId: 'REP-4001',
      actorId: 'user-chidi',
      actorRole: 'staff',
      clientEventId: 'seed-repayment-4001',
      components: [
        {
          method: 'cash',
          amountMinor: BigInt(naira(11_000)),
          confirmation: {
            state: 'confirmed_success',
            confirmedBy: 'user-chidi',
          },
        },
      ],
      allocations: [
        { debtId: 'debt-ada-old', amountMinor: BigInt(naira(11_000)) },
      ],
      occurredAt: minutesAgo(45),
    })
  }
}
