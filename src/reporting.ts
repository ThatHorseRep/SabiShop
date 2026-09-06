import type { AuditEvent, AuditLog } from './audit'
import type {
  CashEvent,
  CashReconciliationSnapshot,
} from './domain/cashReconciliation'
import type { CustomersCreditEngine } from './domain/customersCredit'
import type { InventoryEngine } from './domain/inventory'
import type { PurchasingEngine } from './domain/purchasing'
import type {
  IntegrityReportEvent,
  ReturnsCorrectionsEngine,
} from './domain/returnsCorrections'
import type { SalesTransactionEngine, SaleReportEvent } from './domain/sales'

export type ReportingPeriod = Readonly<{ from: string; to: string }>
export type ExpenseRecord = Readonly<{
  id: string
  businessId: string
  amountKobo: number
  occurredAt: string
  category: string
  actorId: string
}>
export type IncentivePolicy = Readonly<{
  enabled: boolean
  percentage: number
  minimumQualifyingCompletedSales: number
}>

export type ReportTrace = Readonly<{
  sourceType: string
  sourceId: string
  occurredAt: string
}>
export type StaffPerformance = Readonly<{
  salespersonId: string
  qualifyingSales: number
  netRecognizedSellingValueKobo: number
  cogsKobo: number
  grossProfitKobo: number
  incentiveEligibleValueKobo: number
  incentiveStatus: 'disabled' | 'pending' | 'eligible'
  sourceEventIds: string[]
}>
export type BusinessPerformanceReport = Readonly<{
  businessId: string
  period: ReportingPeriod
  timeBasis: 'event_time'
  sales: {
    netRecognizedSellingValueKobo: number
    taxKobo: number
    cogsKobo: number
    grossProfitKobo: number
    cashKobo: number
    nonCashKobo: number
    creditKobo: number
    sourceEventIds: string[]
  }
  expenses: { totalKobo: number; sourceEventIds: string[] }
  inventory: {
    remainingQuantity: bigint
    valueKobo: bigint
    negativeStockProductIds: string[]
    sourceEventIds: string[]
  }
  cash: {
    expectedKobo: number
    actualKobo?: number
    varianceKobo?: number
    unresolved: boolean
    sourceEventIds: string[]
  }
  credit: { outstandingKobo: bigint; sourceEventIds: string[] }
  suppliers: { outstandingKobo: bigint; sourceEventIds: string[] }
  staff: StaffPerformance[]
  traces: ReportTrace[]
}>

export type ReportingSources = Readonly<{
  sales: SalesTransactionEngine
  inventory: InventoryEngine
  credit?: CustomersCreditEngine
  purchasing?: PurchasingEngine
  returns?: ReturnsCorrectionsEngine
  cashSnapshots?: readonly CashReconciliationSnapshot[]
  cashEvents?: readonly CashEvent[]
  expenses?: readonly ExpenseRecord[]
  audit?: AuditLog
  incentivePolicy?: IncentivePolicy
}>

const inPeriod = (occurredAt: string, period: ReportingPeriod): boolean =>
  occurredAt >= period.from && occurredAt < period.to

export class CanonicalReporting {
  constructor(private readonly sources: ReportingSources) {}

  project(
    businessId: string,
    period: ReportingPeriod,
  ): BusinessPerformanceReport {
    if (period.from >= period.to)
      throw new Error('report period must be increasing')
    const traces: ReportTrace[] = []
    const saleEvents = this.sources.sales
      .listReports()
      .filter(
        (event) =>
          event.businessId === businessId && inPeriod(event.occurredAt, period),
      )
    const integrityEvents =
      this.sources.returns
        ?.listReportEvents(businessId)
        .filter((event) => inPeriod(event.occurredAt, period)) ?? []
    const events: Array<SaleReportEvent | IntegrityReportEvent> = [
      ...saleEvents,
      ...integrityEvents,
    ]
    const addTrace = (
      sourceType: string,
      sourceId: string,
      occurredAt: string,
    ) => traces.push({ sourceType, sourceId, occurredAt })
    const totals = events.reduce(
      (sum, event) => {
        addTrace(
          'sale_report_event',
          `${event.type}:${event.saleId}`,
          event.occurredAt,
        )
        return {
          net: sum.net + event.totalDueKobo - event.taxKobo,
          tax: sum.tax + event.taxKobo,
          cogs: sum.cogs + event.cogsKobo,
          profit:
            sum.profit + (event.totalDueKobo - event.taxKobo - event.cogsKobo),
          cash: sum.cash + event.cashKobo,
          nonCash: sum.nonCash + event.nonCashKobo,
          credit: sum.credit + event.creditKobo,
        }
      },
      { net: 0, tax: 0, cogs: 0, profit: 0, cash: 0, nonCash: 0, credit: 0 },
    )

    const expenses = (this.sources.expenses ?? []).filter(
      (expense) =>
        expense.businessId === businessId &&
        inPeriod(expense.occurredAt, period),
    )
    expenses.forEach((expense) =>
      addTrace('expense', expense.id, expense.occurredAt),
    )

    const inventoryEvents = this.sources.inventory
      .listEvents()
      .filter((event) => event.businessId === businessId)
    inventoryEvents.forEach((event) => {
      if (inPeriod(event.occurredAt, period))
        addTrace('inventory_event', event.id, event.occurredAt)
    })
    const productIds = [
      ...new Set(inventoryEvents.map((event) => event.productId)),
    ]
    const stock = productIds.map((productId) =>
      this.sources.inventory.getStock(productId),
    )
    const valuations = productIds.map((productId) =>
      this.sources.inventory.getValuation(productId),
    )
    const negativeStockProductIds = stock
      .filter((item) => item.negative)
      .map((item) => item.productId)
    const remainingQuantity = stock.reduce((sum, item) => sum + item.total, 0n)
    const valueKobo = valuations.reduce((sum, item) => sum + item.value, 0n)

    const cashSnapshots = (this.sources.cashSnapshots ?? []).filter(
      (snapshot) => snapshot.businessId === businessId,
    )
    const cash = cashSnapshots.reduce(
      (sum, snapshot) => ({
        expected: sum.expected + snapshot.expectedCashKobo,
        actual:
          sum.actual === undefined || snapshot.actualCashKobo === undefined
            ? undefined
            : sum.actual + snapshot.actualCashKobo,
        variance:
          sum.variance === undefined || snapshot.cashVarianceKobo === undefined
            ? undefined
            : sum.variance + snapshot.cashVarianceKobo,
        unresolved: sum.unresolved || snapshot.unresolved,
      }),
      {
        expected: 0,
        actual: undefined as number | undefined,
        variance: undefined as number | undefined,
        unresolved: false,
      },
    )
    ;(this.sources.cashEvents ?? [])
      .filter(
        (event) =>
          event.businessId === businessId && inPeriod(event.occurredAt, period),
      )
      .forEach((event) => addTrace('cash_event', event.id, event.occurredAt))

    const allCreditEvents =
      this.sources.credit
        ?.listHistory(businessId)
        .filter((event) => event.occurredAt < period.to) ?? []
    const creditEvents = allCreditEvents.filter((event) =>
      inPeriod(event.occurredAt, period),
    )
    creditEvents.forEach((event) =>
      addTrace('credit_event', event.id, event.occurredAt),
    )
    const outstandingKobo = allCreditEvents.reduce((sum, event) => {
      if (event.type === 'credit.sale.recorded')
        return sum + (event.amountMinor ?? 0n)
      if (
        event.type === 'credit.repayment.recorded' ||
        event.type === 'credit.return.recorded' ||
        event.type === 'credit.write_off.recorded'
      )
        return sum - (event.amountMinor ?? 0n)
      return (
        sum +
        (event.correctionIncreaseMinor ?? 0n) -
        (event.correctionReductionMinor ?? 0n)
      )
    }, 0n)

    const supplierRecords =
      this.sources.purchasing?.listPurchases(businessId) ?? []
    const supplierPayments =
      this.sources.purchasing?.listPayments(businessId) ?? []
    const supplierReturns =
      this.sources.purchasing?.listReturns(businessId) ?? []
    const supplierOutstanding =
      supplierRecords.reduce((sum, purchase) => sum + purchase.total, 0n) -
      supplierPayments
        .filter((payment) => payment.state === 'confirmed_success')
        .reduce((sum, payment) => sum + payment.amount, 0n) -
      supplierReturns
        .filter((item) => item.state === 'applied' || item.state === 'settled')
        .reduce(
          (sum, item) =>
            sum + item.unpaidPayableReduction + item.supplierCredit,
          0n,
        )

    const policy = this.sources.incentivePolicy ?? {
      enabled: false,
      percentage: 0,
      minimumQualifyingCompletedSales: 0,
    }
    const staffMap = new Map<string, StaffPerformance>()
    events.forEach((event) => {
      if (event.type !== 'sale.completed' && event.type !== 'sale.reversed')
        return
      const sale = this.sources.sales.getSale(businessId, event.saleId)
      if (!sale) return
      const current = {
        ...(staffMap.get(sale.actorId) ?? {
          salespersonId: sale.actorId,
          qualifyingSales: 0,
          netRecognizedSellingValueKobo: 0,
          cogsKobo: 0,
          grossProfitKobo: 0,
          incentiveEligibleValueKobo: 0,
          incentiveStatus: 'disabled' as const,
          sourceEventIds: [],
        }),
        sourceEventIds: [...(staffMap.get(sale.actorId)?.sourceEventIds ?? [])],
      }
      current.qualifyingSales += event.type === 'sale.completed' ? 1 : 0
      current.netRecognizedSellingValueKobo +=
        event.totalDueKobo - event.taxKobo
      current.cogsKobo += event.cogsKobo
      current.grossProfitKobo += event.grossProfitKobo
      current.sourceEventIds.push(`${event.type}:${event.saleId}`)
      if (policy.enabled && event.type === 'sale.completed')
        current.incentiveEligibleValueKobo += sale.lines.reduce(
          (sum, line) =>
            sum +
            Math.max(0, line.unitPriceKobo - line.effectiveFloorKobo) *
              line.quantity,
          0,
        )
      const status = !policy.enabled
        ? 'disabled'
        : current.qualifyingSales >= policy.minimumQualifyingCompletedSales
          ? 'eligible'
          : 'pending'
      staffMap.set(sale.actorId, { ...current, incentiveStatus: status })
    })

    return {
      businessId,
      period,
      timeBasis: 'event_time',
      sales: {
        netRecognizedSellingValueKobo: totals.net,
        taxKobo: totals.tax,
        cogsKobo: totals.cogs,
        grossProfitKobo: totals.profit,
        cashKobo: totals.cash,
        nonCashKobo: totals.nonCash,
        creditKobo: totals.credit,
        sourceEventIds: events.map((event) => `${event.type}:${event.saleId}`),
      },
      expenses: {
        totalKobo: expenses.reduce(
          (sum, expense) => sum + expense.amountKobo,
          0,
        ),
        sourceEventIds: expenses.map((expense) => expense.id),
      },
      inventory: {
        remainingQuantity,
        valueKobo,
        negativeStockProductIds,
        sourceEventIds: inventoryEvents.map((event) => event.id),
      },
      cash: {
        expectedKobo: cash.expected,
        actualKobo: cash.actual,
        varianceKobo: cash.variance,
        unresolved: cash.unresolved,
        sourceEventIds: (this.sources.cashEvents ?? [])
          .filter((event) => event.businessId === businessId)
          .map((event) => event.id),
      },
      credit: {
        outstandingKobo,
        sourceEventIds: creditEvents.map((event) => event.id),
      },
      suppliers: {
        outstandingKobo: supplierOutstanding,
        sourceEventIds: supplierRecords.map((purchase) => purchase.id),
      },
      staff: [...staffMap.values()],
      traces,
    }
  }
}

export type { AuditEvent, SaleReportEvent }
