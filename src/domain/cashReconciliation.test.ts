import { describe, expect, it } from 'vitest'
import { CashReconciliationEngine } from './cashReconciliation'

describe('cash reconciliation', () => {
  const opened = (
    engine: CashReconciliationEngine,
    custodyMode = 'shared_drawer' as const,
  ) => {
    engine.openBusinessDay({
      businessId: 'b1',
      sessionId: 'd1',
      custodyMode,
      actorId: 'staff-1',
      actorRole: 'staff',
    })
    engine.enterOpeningCash('b1', 'd1', 10_000, 'staff-1', 'staff')
    engine.confirmOpeningCash('b1', 'd1', 12_000, 'manager-1', 'manager')
  }

  it('derives Expected Cash from confirmed cash-affecting events only', () => {
    const engine = new CashReconciliationEngine()
    opened(engine)
    engine.recordCashEvent({
      businessId: 'b1',
      sessionId: 'd1',
      id: 'sale-1',
      kind: 'cash_sale',
      amountKobo: 50_000,
      actorId: 'staff-1',
      actorRole: 'staff',
      reason: 'completed sale',
    })
    engine.recordCashEvent({
      businessId: 'b1',
      sessionId: 'd1',
      id: 'in-1',
      kind: 'cash_in',
      amountKobo: 5_000,
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'change money',
    })
    engine.recordCashEvent({
      businessId: 'b1',
      sessionId: 'd1',
      id: 'out-1',
      kind: 'cash_out',
      amountKobo: 7_000,
      actorId: 'staff-1',
      actorRole: 'staff',
      reason: 'transport',
    })
    engine.recordCashEvent({
      businessId: 'b1',
      sessionId: 'd1',
      id: 'refund-1',
      kind: 'cash_refund',
      amountKobo: 3_000,
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'refund paid from till',
    })
    expect(engine.getSnapshot('b1', 'd1').expectedCashKobo).toBe(57_000)
  })

  it('allows zero opening and actual cash, and records an interim checkpoint without closing', () => {
    const engine = new CashReconciliationEngine()
    engine.openBusinessDay({
      businessId: 'b1',
      sessionId: 'd1',
      custodyMode: 'individual_salesperson',
      actorId: 'staff-1',
      actorRole: 'staff',
    })
    engine.enterOpeningCash('b1', 'd1', 0, 'staff-1', 'staff')
    engine.confirmOpeningCash('b1', 'd1', 0, 'owner-1', 'owner')
    engine.recordInterimCount({
      businessId: 'b1',
      sessionId: 'd1',
      id: 'count-1',
      actualCashKobo: 0,
      actorId: 'manager-1',
      actorRole: 'manager',
      cashAccountId: 'staff-1',
    })
    expect(
      engine.recordActualCash('b1', 'd1', 0, 'staff-1', 'staff').state,
    ).toBe('count_recorded')
  })

  it('keeps an unresolved discrepancy visible after management closes the day', () => {
    const engine = new CashReconciliationEngine()
    opened(engine)
    engine.recordCashEvent({
      businessId: 'b1',
      sessionId: 'd1',
      id: 'sale-1',
      kind: 'cash_sale',
      amountKobo: 50_000,
      actorId: 'staff-1',
      actorRole: 'staff',
      reason: 'completed sale',
    })
    engine.recordActualCash('b1', 'd1', 60_000, 'staff-1', 'staff')
    expect(
      engine.prepareReconciliation('b1', 'd1', 'manager-1', 'manager')
        .unresolved,
    ).toBe(true)
    engine.confirmManagementReconciliation('b1', 'd1', 'manager-1', 'manager')
    const closed = engine.closeBusinessDay('b1', 'd1', 'manager-1', 'manager')
    expect(closed.state).toBe('closed')
    expect(closed.discrepancyStatus).toBe('unresolved')
    expect(closed.cashVarianceKobo).toBe(-2_000)
  })

  it('reopens only with a reason and preserves the audit trail', () => {
    const engine = new CashReconciliationEngine()
    opened(engine)
    engine.recordActualCash('b1', 'd1', 12_000, 'staff-1', 'staff')
    engine.prepareReconciliation('b1', 'd1', 'manager-1', 'manager')
    engine.confirmManagementReconciliation('b1', 'd1', 'manager-1', 'manager')
    engine.closeBusinessDay('b1', 'd1', 'manager-1', 'manager')
    expect(
      engine.reopenBusinessDay(
        'b1',
        'd1',
        'manager-1',
        'manager',
        'Recount after till handover',
      ),
    ).toMatchObject({ state: 'reopened' })
    expect(
      engine
        .listAudits('b1')
        .some((event) => event.type === 'business_day.reopened'),
    ).toBe(true)
  })

  it('reconciles individual salesperson custody separately', () => {
    const engine = new CashReconciliationEngine()
    engine.openBusinessDay({
      businessId: 'b1',
      sessionId: 'd1',
      custodyMode: 'individual_salesperson',
      actorId: 'manager-1',
      actorRole: 'manager',
    })
    engine.confirmOpeningCash(
      'b1',
      'd1',
      1_000,
      'manager-1',
      'manager',
      undefined,
      'staff-1',
    )
    engine.confirmOpeningCash(
      'b1',
      'd1',
      2_000,
      'manager-1',
      'manager',
      undefined,
      'staff-2',
    )
    engine.recordCashEvent({
      businessId: 'b1',
      sessionId: 'd1',
      id: 'sale-1',
      kind: 'cash_sale',
      amountKobo: 10_000,
      actorId: 'staff-1',
      actorRole: 'staff',
      cashAccountId: 'staff-1',
      reason: 'completed cash sale',
    })
    engine.recordCashEvent({
      businessId: 'b1',
      sessionId: 'd1',
      id: 'sale-2',
      kind: 'cash_sale',
      amountKobo: 20_000,
      actorId: 'staff-2',
      actorRole: 'staff',
      cashAccountId: 'staff-2',
      reason: 'completed cash sale',
    })
    engine.recordActualCash('b1', 'd1', 11_000, 'staff-1', 'staff', 'staff-1')
    engine.recordActualCash('b1', 'd1', 22_000, 'staff-2', 'staff', 'staff-2')
    expect(engine.getSnapshot('b1', 'd1', 'staff-1')).toMatchObject({
      expectedCashKobo: 11_000,
      actualCashKobo: 11_000,
    })
    expect(
      engine.prepareReconciliation('b1', 'd1', 'manager-1', 'manager')
        .cashVarianceKobo,
    ).toBe(0)
  })

  it('requires management confirmation before close and preserves tenant isolation', () => {
    const engine = new CashReconciliationEngine()
    opened(engine)
    engine.recordActualCash('b1', 'd1', 12_000, 'staff-1', 'staff')
    engine.prepareReconciliation('b1', 'd1', 'staff-1', 'staff')
    expect(() =>
      engine.closeBusinessDay('b1', 'd1', 'manager-1', 'manager'),
    ).toThrow(/management confirmation/i)
    expect(() =>
      engine.confirmManagementReconciliation('b1', 'd1', 'staff-1', 'staff'),
    ).toThrow(/only management/i)
    expect(() => engine.getSnapshot('another-business', 'd1')).toThrow(
      /not found/i,
    )
  })
})
