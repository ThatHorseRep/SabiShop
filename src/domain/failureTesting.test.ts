import { describe, expect, it } from 'vitest'
import { CanonicalReporting } from '../reporting'
import {
  InMemorySyncServer,
  LocalStorageStore,
  MemoryStorage,
  SyncCoordinator,
  type JsonValue,
  type SyncOperation,
  type SyncServer,
} from '../sync/offlineSync'
import { CustomersCreditError } from './customersCredit'
import { CatalogPricing } from './catalogPricing'
import { CustomersCreditEngine } from './customersCredit'
import { InventoryEngine, quantity as inventoryQuantity } from './inventory'
import { IntegrityError, ReturnsCorrectionsEngine } from './returnsCorrections'
import {
  SalesTransactionEngine,
  type CompletedSale,
  type PaymentComponent,
} from './sales'
import type { Role } from './stateMachines'

const BUSINESS = 'biz-main'
const STAFF = 'user-staff'
const MANAGER = 'user-manager'
const OWNER = 'user-owner'
const TAX_RATE = 750n
const OCCURRED_AT = '2026-09-09T09:00:00.000Z'

function world() {
  const pricing = new CatalogPricing()
  const inventory = new InventoryEngine()
  const sales = new SalesTransactionEngine(pricing, inventory)
  const credit = new CustomersCreditEngine()
  const integrity = new ReturnsCorrectionsEngine({ sales, inventory, credit })
  return { pricing, inventory, sales, credit, integrity }
}

type World = ReturnType<typeof world>

function addProduct(target: World, id = 'p1') {
  return target.pricing.createProduct({
    id,
    sku: `SKU-${id}`,
    name: `Product ${id}`,
    category: 'parts',
    unit: 'each',
    aliases: [],
    sellingPriceKobo: 1000,
    active: true,
    availableForSale: true,
  })
}

function receive(
  target: World,
  input: { units?: number; unitCostKobo?: number; clientEventId: string },
) {
  return target.inventory.receive({
    businessId: BUSINESS,
    productId: 'p1',
    quantity: inventoryQuantity(input.units ?? 2),
    unitCost: BigInt(input.unitCostKobo ?? 500),
    actorId: MANAGER,
    reason: 'stock receipt',
    clientEventId: input.clientEventId,
    occurredAt: OCCURRED_AT,
  })
}

const confirmed = (confirmedBy: string) => ({
  state: 'confirmed_success' as const,
  confirmedBy,
})

const cashPayment = (id: string, amountKobo: number): PaymentComponent => ({
  id,
  method: 'cash',
  amountKobo,
  confirmation: confirmed(STAFF),
})

const creditPayment = (id: string, amountKobo: number): PaymentComponent => ({
  id,
  method: 'customer_credit',
  amountKobo,
  confirmation: confirmed(MANAGER),
})

function saleInput(input: {
  saleId: string
  quantity?: number
  payment?: PaymentComponent
  actorId?: string
  actorRole?: Role
  customer?: { id: string; name: string; phone: string }
  creditApproval?: { approverId: string; approverRole: Role }
  occurredAt?: string
}) {
  return {
    businessId: BUSINESS,
    id: input.saleId,
    clientRequestId: `request:${input.saleId}`,
    actorId: input.actorId ?? STAFF,
    actorRole: input.actorRole ?? 'staff',
    lines: [
      {
        id: 'line-1',
        productId: 'p1',
        quantity: input.quantity ?? 1,
      },
    ],
    payments: [input.payment ?? cashPayment(`pay-${input.saleId}`, 1075)],
    customer: input.customer,
    creditApproval: input.creditApproval,
    taxRateBasisPoints: TAX_RATE,
    taxMode: 'exclusive' as const,
    occurredAt: input.occurredAt ?? OCCURRED_AT,
  }
}

function completeCashSale(
  target: World,
  input: { saleId: string; quantity?: number; actorId?: string },
) {
  return target.sales.complete(
    saleInput({
      saleId: input.saleId,
      quantity: input.quantity,
      actorId: input.actorId,
      payment: cashPayment(`pay-${input.saleId}`, 1075 * (input.quantity ?? 1)),
    }),
  )
}

function creditWorld(input: { units?: number } = {}) {
  const target = world()
  addProduct(target)
  receive(target, { units: input.units ?? 2, clientEventId: 'receipt-open' })
  target.credit.createCustomer({
    businessId: BUSINESS,
    id: 'customer-1',
    name: 'Amaka Okafor',
    phone: '08030000000',
    creditStatus: 'allowed',
    creditLimitMinor: 10_000n,
    actorId: MANAGER,
    occurredAt: OCCURRED_AT,
  })
  const customer = {
    id: 'customer-1',
    name: 'Amaka Okafor',
    phone: '08030000000',
  }
  const sale = target.sales.complete(
    saleInput({
      saleId: 'sale-credit',
      quantity: 2,
      payment: creditPayment('pay-credit', 2150),
      customer,
      creditApproval: { approverId: MANAGER, approverRole: 'manager' },
    }),
  )
  target.credit.recordCreditSale({
    businessId: BUSINESS,
    customerId: customer.id,
    debtId: 'debt-1',
    saleId: sale.id,
    amountMinor: BigInt(sale.creditKobo),
    actorId: STAFF,
    actorRole: 'staff',
    clientEventId: `credit:${sale.clientRequestId}`,
    creditApproval: { approverId: MANAGER, approverRole: 'manager' },
    occurredAt: OCCURRED_AT,
  })
  return { target, sale, customer }
}

function repay(
  target: World,
  input: { amountKobo: number; clientEventId: string; repaymentId?: string },
) {
  return target.credit.recordRepayment({
    businessId: BUSINESS,
    customerId: 'customer-1',
    repaymentId: input.repaymentId ?? `receipt-${input.clientEventId}`,
    actorId: STAFF,
    actorRole: 'staff',
    clientEventId: input.clientEventId,
    components: [
      {
        method: 'cash',
        amountMinor: BigInt(input.amountKobo),
        confirmation: confirmed(MANAGER),
      },
    ],
    allocations: [{ debtId: 'debt-1', amountMinor: BigInt(input.amountKobo) }],
    occurredAt: '2026-09-09T09:05:00.000Z',
  })
}

function replaySale(target: World, payload: JsonValue): CompletedSale {
  const record = payload as Record<string, unknown>
  return target.sales.complete({
    businessId: String(record.businessId),
    id: String(record.saleId),
    clientRequestId: String(record.clientRequestId),
    actorId: String(record.actorId),
    actorRole: record.actorRole as Role,
    lines: (record.lines as Array<Record<string, unknown>>).map(
      (line, index) => ({
        id: String(line.id ?? `line-${index + 1}`),
        productId: String(line.productId),
        quantity: Number(line.quantity),
      }),
    ),
    payments: (record.payments as Array<Record<string, unknown>>).map(
      (payment, index) => ({
        id: String(payment.id ?? `payment-${index + 1}`),
        method: payment.method as PaymentComponent['method'],
        amountKobo: Number(payment.amountKobo),
        confirmation: payment.confirmation as PaymentComponent['confirmation'],
      }),
    ),
    taxRateBasisPoints: BigInt(Number(record.taxRateBasisPoints)),
    taxMode: 'exclusive',
    occurredAt: String(record.occurredAt),
  })
}

function operation(input: {
  operationId: string
  type: string
  payload: JsonValue
  dependencies?: string[]
  actorUserId?: string
}) {
  return {
    operationId: input.operationId,
    businessId: BUSINESS,
    deviceId: 'device-1',
    actorUserId: input.actorUserId ?? STAFF,
    type: input.type,
    payload: input.payload,
    dependencies: input.dependencies ?? [],
    createdAt: OCCURRED_AT,
    businessState: 'completed',
    paymentState: 'confirmed',
    authorizationState: 'approved',
  }
}

const storageStub = () => {
  const values = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
  return { storage, values }
}

function salePayload(input: {
  saleId: string
  quantity?: number
  actorId?: string
}): JsonValue {
  return {
    businessId: BUSINESS,
    saleId: input.saleId,
    clientRequestId: `request:${input.saleId}`,
    actorId: input.actorId ?? STAFF,
    actorRole: 'staff',
    lines: [
      {
        id: 'line-1',
        productId: 'p1',
        quantity: input.quantity ?? 1,
      },
    ],
    payments: [
      {
        id: `pay-${input.saleId}`,
        method: 'cash',
        amountKobo: 1075 * (input.quantity ?? 1),
        confirmation: confirmed(STAFF),
      },
    ],
    taxRateBasisPoints: Number(TAX_RATE),
    taxMode: 'exclusive',
    occurredAt: OCCURRED_AT,
  }
}

function report(target: World) {
  return new CanonicalReporting({
    sales: target.sales,
    inventory: target.inventory,
    credit: target.credit,
    returns: target.integrity,
    cashSnapshots: [],
    cashEvents: [],
  }).project(BUSINESS, {
    from: '2000-01-01T00:00:00.000Z',
    to: '2100-01-01T00:00:00.000Z',
  })
}

function correctionEffectSnapshot(target: World, saleId = 'sale-credit') {
  return {
    inventoryEvents: target.inventory.listEvents().length,
    saleReports: target.sales.listReports().length,
    integrityReports: target.integrity.listReportEvents(BUSINESS).length,
    integrityAudits: target.integrity.listAuditEvents().length,
    creditEvents: target.credit.listHistory(BUSINESS).length,
    stock: target.inventory.getStock('p1').sellable,
    outstanding: target.credit
      .getDebt(BUSINESS, 'customer-1', 'debt-1')
      ?.outstandingMinor.toString(),
    saleReversedAt: target.sales.getSale(BUSINESS, saleId)?.reversedAt,
  }
}

describe('Sabi Shop failure injection', () => {
  it('F1: network loss and partial synchronization retry once per logical event', async () => {
    const local = world()
    const authoritative = world()
    for (const target of [local, authoritative]) {
      addProduct(target)
      receive(target, { units: 4, clientEventId: 'receipt-open' })
    }
    completeCashSale(local, { saleId: 'sale-1' })
    completeCashSale(local, { saleId: 'sale-2' })

    const coordinator = new SyncCoordinator(new MemoryStorage())
    coordinator.enqueue(
      operation({
        operationId: 'event-sale-1',
        type: 'sale.complete',
        payload: salePayload({ saleId: 'sale-1' }),
      }),
    )
    coordinator.enqueue(
      operation({
        operationId: 'event-sale-2',
        type: 'sale.complete',
        payload: salePayload({ saleId: 'sale-2' }),
      }),
    )

    const backing = new InMemorySyncServer({
      apply: (candidate) =>
        replaySale(authoritative, candidate.payload).id as unknown as JsonValue,
    })
    const server: SyncServer = {
      accept: async (candidate) => {
        if (candidate.operationId === 'event-sale-1') {
          const first = !coordinator
            .list(BUSINESS)
            .some(
              (item) =>
                item.operationId === 'event-sale-1' &&
                item.error?.attempts === 1,
            )
          if (first) throw new Error('network unavailable before acceptance')
        }
        return backing.accept(candidate)
      },
    }

    await coordinator.sync(server, BUSINESS)
    expect(coordinator.get(BUSINESS, 'event-sale-1')?.syncState).toBe('FAILED')
    expect(coordinator.get(BUSINESS, 'event-sale-2')?.syncState).toBe(
      'SYNCHRONIZED',
    )
    expect(authoritative.sales.listReports()).toHaveLength(1)
    expect(authoritative.inventory.getStock('p1').sellable).toBe(3000n)

    await coordinator.sync(server, BUSINESS)
    expect(coordinator.get(BUSINESS, 'event-sale-1')?.syncState).toBe(
      'SYNCHRONIZED',
    )
    expect(authoritative.sales.listReports()).toHaveLength(2)
    expect(authoritative.inventory.getStock('p1').sellable).toBe(2000n)
    expect(authoritative.inventory.listEvents()).toHaveLength(3)
  })

  it('F2: timeout after server acceptance cannot duplicate the business effect', async () => {
    const local = world()
    const authoritative = world()
    for (const target of [local, authoritative]) {
      addProduct(target)
      receive(target, { units: 2, clientEventId: 'receipt-open' })
    }
    completeCashSale(local, { saleId: 'sale-timeout' })
    const coordinator = new SyncCoordinator(new MemoryStorage())
    const operationId = 'event-sale-timeout'
    coordinator.enqueue(
      operation({
        operationId,
        type: 'sale.complete',
        payload: salePayload({ saleId: 'sale-timeout' }),
      }),
    )

    const backing = new InMemorySyncServer({
      apply: (candidate) =>
        replaySale(authoritative, candidate.payload).id as unknown as JsonValue,
    })
    let calls = 0
    const server: SyncServer = {
      accept: async (candidate) => {
        calls += 1
        const response = await backing.accept(candidate)
        if (calls === 1) throw new Error('response lost after acceptance')
        return response
      },
    }

    await coordinator.sync(server, BUSINESS)
    expect(calls).toBe(1)
    expect(authoritative.sales.listReports()).toHaveLength(1)
    expect(authoritative.inventory.getStock('p1').sellable).toBe(1000n)
    expect(coordinator.get(BUSINESS, operationId)?.syncState).toBe('FAILED')

    await coordinator.sync(server, BUSINESS)
    expect(calls).toBe(2)
    expect(authoritative.sales.listReports()).toHaveLength(1)
    expect(authoritative.inventory.getStock('p1').sellable).toBe(1000n)
    expect(coordinator.get(BUSINESS, operationId)).toMatchObject({
      syncState: 'SYNCHRONIZED',
      serverSequence: 1,
    })
  })

  it('F3: app restart and duplicate delivery preserve one durable event identity', async () => {
    const local = world()
    const authoritative = world()
    for (const target of [local, authoritative]) {
      addProduct(target)
      receive(target, { units: 2, clientEventId: 'receipt-open' })
    }
    completeCashSale(local, { saleId: 'sale-restart' })
    const storage = new MemoryStorage()
    const first = new SyncCoordinator(storage)
    const input = operation({
      operationId: 'event-sale-restart',
      type: 'sale.complete',
      payload: salePayload({ saleId: 'sale-restart' }),
    })
    first.enqueue(input)

    const restarted = new SyncCoordinator(storage)
    const replay = restarted.enqueue(input)
    expect(replay.operationId).toBe('event-sale-restart')
    expect(restarted.list(BUSINESS)).toHaveLength(1)

    const server = new InMemorySyncServer({
      apply: (candidate) =>
        replaySale(authoritative, candidate.payload).id as unknown as JsonValue,
    })
    await restarted.sync(server, BUSINESS)
    const saved = restarted.get(BUSINESS, 'event-sale-restart')
    const duplicate = await server.accept(
      structuredClone(saved) as SyncOperation,
    )
    expect(duplicate).toMatchObject({
      kind: 'accepted',
      serverSequence: saved?.serverSequence,
    })
    expect(authoritative.sales.listReports()).toHaveLength(1)
    expect(authoritative.inventory.listEvents()).toHaveLength(2)
  })

  it('F4: stale authorization is denied and escalated without an authoritative effect', async () => {
    const local = world()
    const authoritative = world()
    for (const target of [local, authoritative]) {
      addProduct(target)
      receive(target, { units: 2, clientEventId: 'receipt-open' })
    }
    completeCashSale(local, {
      saleId: 'sale-revoked',
      actorId: 'user-revoked',
    })
    const coordinator = new SyncCoordinator(new MemoryStorage())
    const operationId = 'event-sale-revoked'
    coordinator.enqueue(
      operation({
        operationId,
        type: 'sale.complete',
        payload: salePayload({
          saleId: 'sale-revoked',
          actorId: 'user-revoked',
        }),
        actorUserId: 'user-revoked',
      }),
    )
    const server = new InMemorySyncServer({
      authorize: (candidate) => candidate.actorUserId !== 'user-revoked',
      apply: (candidate) =>
        replaySale(authoritative, candidate.payload).id as unknown as JsonValue,
    })

    await coordinator.sync(server, BUSINESS)
    expect(coordinator.get(BUSINESS, operationId)).toMatchObject({
      syncState: 'CONFLICT',
      serverAcceptance: 'rejected',
    })
    expect(coordinator.get(BUSINESS, operationId)?.error?.code).toBe(
      'authorization_denied',
    )
    expect(coordinator.get(BUSINESS, operationId)?.conflict).toMatchObject({
      code: 'authorization_denied_offline',
      requiresHumanReview: true,
      escalatedTo: 'management_review',
    })
    expect(coordinator.listConflicts(BUSINESS)).toHaveLength(1)
    expect(authoritative.sales.listReports()).toHaveLength(0)
    expect(authoritative.inventory.listEvents()).toHaveLength(1)
    expect(authoritative.sales.listAudits()).toHaveLength(0)
  })

  it('F5: reordered causal delivery is preserved, then recovered without replay damage', async () => {
    const local = world()
    const authoritative = world()
    for (const target of [local, authoritative]) {
      addProduct(target)
      receive(target, { units: 2, clientEventId: 'receipt-open' })
    }
    completeCashSale(local, { saleId: 'sale-parent' })
    local.inventory.adjust({
      businessId: BUSINESS,
      productId: 'p1',
      quantity: inventoryQuantity(1),
      condition: 'sellable',
      actorId: MANAGER,
      reason: 'found stock',
      clientEventId: 'adjustment-child',
      adjustmentId: 'adjustment-child',
      occurredAt: '2026-09-09T09:05:00.000Z',
    })

    const coordinator = new SyncCoordinator(new MemoryStorage())
    const parent = coordinator.enqueue(
      operation({
        operationId: 'event-sale-parent',
        type: 'sale.complete',
        payload: salePayload({ saleId: 'sale-parent' }),
      }),
    )
    const child = coordinator.enqueue(
      operation({
        operationId: 'event-adjustment-child',
        type: 'inventory.adjust',
        payload: {
          productId: 'p1',
          quantity: 1,
          reason: 'found stock',
          adjustmentId: 'adjustment-child',
        },
        dependencies: [parent.operationId],
      }),
    )

    const server = new InMemorySyncServer({
      apply: (candidate) => {
        if (candidate.type === 'sale.complete')
          return replaySale(authoritative, candidate.payload)
            .id as unknown as JsonValue
        const payload = candidate.payload as Record<string, unknown>
        return authoritative.inventory
          .adjust({
            businessId: BUSINESS,
            productId: String(payload.productId),
            quantity: inventoryQuantity(Number(payload.quantity)),
            condition: 'sellable',
            actorId: MANAGER,
            reason: String(payload.reason),
            clientEventId: candidate.operationId,
            adjustmentId: String(payload.adjustmentId),
            occurredAt: '2026-09-09T09:05:00.000Z',
          })
          .id.toString() as unknown as JsonValue
      },
    })

    const reordered = await server.accept(structuredClone(child))
    expect(reordered).toMatchObject({
      kind: 'conflict',
      code: 'causal_dependency_missing',
    })
    coordinator.markConflict(
      BUSINESS,
      child.operationId,
      'causal_dependency_missing',
      'A causal dependency has not been accepted.',
      [parent.operationId],
    )

    await coordinator.sync(server, BUSINESS)
    expect(coordinator.get(BUSINESS, parent.operationId)?.syncState).toBe(
      'SYNCHRONIZED',
    )
    expect(coordinator.get(BUSINESS, child.operationId)?.syncState).toBe(
      'CONFLICT',
    )

    coordinator.retry(BUSINESS, child.operationId)
    await coordinator.sync(server, BUSINESS)
    expect(coordinator.get(BUSINESS, child.operationId)).toMatchObject({
      syncState: 'SYNCHRONIZED',
      serverSequence: 2,
    })
    expect(authoritative.inventory.listEvents()).toHaveLength(3)
    expect(authoritative.inventory.getStock('p1').sellable).toBe(2000n)
  })

  it('F6: simultaneous inventory edits remain event-derived or fail closed', () => {
    const w = world()
    addProduct(w)
    receive(w, { units: 1, clientEventId: 'receipt-open' })
    const version = w.inventory.getVersion()

    completeCashSale(w, { saleId: 'sale-device-1' })
    completeCashSale(w, { saleId: 'sale-device-2' })
    const stock = w.inventory.getStock('p1')
    expect(stock).toMatchObject({
      sellable: -1000n,
      negative: true,
      exception: 'negative_stock',
    })
    expect(w.sales.listReports()).toHaveLength(2)
    expect(report(w).inventory.negativeStockProductIds).toEqual(['p1'])

    const duplicateReceipt = w.inventory.receive({
      businessId: BUSINESS,
      productId: 'p1',
      quantity: inventoryQuantity(1),
      unitCost: 500n,
      actorId: MANAGER,
      reason: 'duplicate retry',
      clientEventId: 'receipt-open',
    })
    expect(duplicateReceipt.id).toBe(w.inventory.listEvents()[0].id)
    expect(w.inventory.listEvents()).toHaveLength(3)

    expect(() =>
      w.inventory.adjust({
        businessId: BUSINESS,
        productId: 'p1',
        quantity: inventoryQuantity(1),
        condition: 'sellable',
        actorId: MANAGER,
        reason: 'stale expected version',
        clientEventId: 'adjustment-stale',
        adjustmentId: 'adjustment-stale',
        expectedVersion: version,
      }),
    ).toThrowError(/inventory changed/i)
    expect(w.inventory.listEvents()).toHaveLength(3)
  })

  it('F7: conflicting debt changes cannot over-repay or duplicate repayment', () => {
    const { target } = creditWorld()
    const first = repay(target, { amountKobo: 1000, clientEventId: 'repay-1' })
    expect(first.amountMinor).toBe(1000n)
    expect(
      target.credit.getDebt(BUSINESS, 'customer-1', 'debt-1')?.outstandingMinor,
    ).toBe(1150n)

    const duplicate = repay(target, {
      amountKobo: 1000,
      clientEventId: 'repay-1',
    })
    expect(duplicate.id).toBe(first.id)

    expect(() =>
      repay(target, { amountKobo: 1500, clientEventId: 'repay-2' }),
    ).toThrow(CustomersCreditError)
    expect(
      target.credit.getDebt(BUSINESS, 'customer-1', 'debt-1')?.outstandingMinor,
    ).toBe(1150n)
    expect(target.credit.listHistory(BUSINESS)).toHaveLength(3)
  })

  it('F8: a rejected credit-sale correction leaves no partial inventory effect', () => {
    const { target } = creditWorld()
    repay(target, { amountKobo: 2150, clientEventId: 'repay-full' })
    const before = correctionEffectSnapshot(target)

    expect(() =>
      target.integrity.correctSale({
        businessId: BUSINESS,
        saleId: 'sale-credit',
        clientEventId: 'correction-rejected',
        actorId: OWNER,
        actorRole: 'owner',
        reason: 'Attempted to reduce a debt below the amount already repaid',
        customerId: 'customer-1',
        debtId: 'debt-1',
        occurredAt: '2026-09-09T09:10:00.000Z',
        change: {
          field: 'quantity',
          lineId: 'line-1',
          productId: 'p1',
          correctedQuantity: 1,
        },
      }),
    ).toThrow(CustomersCreditError)

    expect(correctionEffectSnapshot(target)).toEqual(before)
    expect(
      target.integrity.getCorrection(BUSINESS, 'correction-rejected'),
    ).toBeUndefined()
  })

  it('F9: credit corrections and reversals require debt lineage before any effect', () => {
    const correctionCase = creditWorld()
    const correctionBefore = correctionEffectSnapshot(correctionCase.target)
    expect(() =>
      correctionCase.target.integrity.correctSale({
        businessId: BUSINESS,
        saleId: 'sale-credit',
        clientEventId: 'correction-missing-lineage',
        actorId: OWNER,
        actorRole: 'owner',
        reason: 'Missing customer and debt lineage',
        occurredAt: '2026-09-09T09:10:00.000Z',
        change: {
          field: 'quantity',
          lineId: 'line-1',
          productId: 'p1',
          correctedQuantity: 1,
        },
      }),
    ).toThrow(IntegrityError)
    expect(correctionEffectSnapshot(correctionCase.target)).toEqual(
      correctionBefore,
    )

    const reversalCase = creditWorld()
    const reversalBefore = correctionEffectSnapshot(reversalCase.target)
    expect(() =>
      reversalCase.target.integrity.reverseSale({
        businessId: BUSINESS,
        saleId: 'sale-credit',
        clientEventId: 'reversal-missing-lineage',
        actorId: OWNER,
        actorRole: 'owner',
        reason: 'Missing customer and debt lineage',
        occurredAt: '2026-09-09T09:10:00.000Z',
      }),
    ).toThrow(IntegrityError)
    expect(correctionEffectSnapshot(reversalCase.target)).toEqual(
      reversalBefore,
    )
  })

  it('F10: impossible corrected quantities and payments fail before any effect', () => {
    const w = world()
    addProduct(w)
    receive(w, { units: 2, clientEventId: 'receipt-open' })
    completeCashSale(w, { saleId: 'sale-invalid' })
    const before = correctionEffectSnapshot(w, 'sale-invalid')

    expect(() =>
      w.integrity.correctSale({
        businessId: BUSINESS,
        saleId: 'sale-invalid',
        clientEventId: 'correction-zero-quantity',
        actorId: OWNER,
        actorRole: 'owner',
        reason: 'Attempted zero quantity',
        occurredAt: '2026-09-09T09:10:00.000Z',
        change: {
          field: 'quantity',
          lineId: 'line-1',
          productId: 'p1',
          correctedQuantity: 0,
        },
      }),
    ).toThrow(IntegrityError)
    expect(correctionEffectSnapshot(w, 'sale-invalid')).toEqual(before)

    expect(() =>
      w.integrity.correctSale({
        businessId: BUSINESS,
        saleId: 'sale-invalid',
        clientEventId: 'correction-negative-payment',
        actorId: OWNER,
        actorRole: 'owner',
        reason: 'Attempted negative payment',
        occurredAt: '2026-09-09T09:10:00.000Z',
        change: {
          field: 'payment_amount',
          paymentId: 'pay-sale-invalid',
          correctedAmountKobo: -100,
        },
      }),
    ).toThrow(IntegrityError)
    expect(correctionEffectSnapshot(w, 'sale-invalid')).toEqual(before)
  })

  it('F11: a valid write-ahead record recovers when the main local state is corrupt', () => {
    const { storage } = storageStub()
    const store = new LocalStorageStore(storage, 'operations')
    const coordinator = new SyncCoordinator(store)
    const saved = coordinator.enqueue(
      operation({
        operationId: 'event-corrupt-main',
        type: 'sale.complete',
        payload: salePayload({ saleId: 'sale-corrupt-main' }),
      }),
    )

    storage.setItem('operations', '{not-json')
    storage.setItem('operations.wal', JSON.stringify([structuredClone(saved)]))

    const recovered = new LocalStorageStore(storage, 'operations').load()
    expect(recovered).toEqual([saved])
    expect(storage.getItem('operations')).toBe(
      JSON.stringify([structuredClone(saved)]),
    )
    expect(storage.getItem('operations.wal')).toBeNull()
    expect(JSON.parse(storage.getItem('operations.corrupt') ?? '{}')).toEqual(
      expect.objectContaining({
        source: 'main',
        raw: '{not-json',
      }),
    )
  })

  it('F12: concurrent duplicate delivery applies one business effect', async () => {
    const local = world()
    const authoritative = world()
    for (const target of [local, authoritative]) {
      addProduct(target)
      receive(target, { units: 2, clientEventId: 'receipt-open' })
    }
    completeCashSale(local, { saleId: 'sale-concurrent' })
    const coordinator = new SyncCoordinator(new MemoryStorage())
    const operationId = 'event-sale-concurrent'
    const saved = coordinator.enqueue(
      operation({
        operationId,
        type: 'sale.complete',
        payload: salePayload({ saleId: 'sale-concurrent' }),
      }),
    )

    let applications = 0
    const server = new InMemorySyncServer({
      authorize: async () => {
        await Promise.resolve()
        return true
      },
      apply: (candidate) => {
        applications += 1
        return replaySale(authoritative, candidate.payload)
          .id as unknown as JsonValue
      },
    })

    const [first, second] = await Promise.all([
      server.accept(structuredClone(saved)),
      server.accept(structuredClone(saved)),
    ])
    expect(second).toEqual(first)
    expect(first).toMatchObject({
      kind: 'accepted',
      serverSequence: 1,
    })
    expect(applications).toBe(1)
    expect(authoritative.sales.listReports()).toHaveLength(1)
    expect(authoritative.inventory.getStock('p1').sellable).toBe(1000n)
  })
})
