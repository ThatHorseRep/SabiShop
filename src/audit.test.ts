import { describe, expect, it } from 'vitest'
import { AuditLog } from './audit'

describe('AuditLog', () => {
  it('records consequential evidence with stable identity and queryable tenant scope', () => {
    const log = new AuditLog()
    log.record({
      eventType: 'sale.completed',
      businessId: 'business-a',
      actorUserId: 'user-1',
      sessionId: 'session-1',
      deviceId: 'device-1',
      operationId: 'sale-request-1',
      targetType: 'sale',
      targetId: 'sale-1',
      result: 'accepted',
      occurredAt: 100,
      reason: 'customer purchase',
      change: { after: { totalKobo: 1500 } },
      metadata: { password: 'must-not-appear', channel: 'offline' },
    })

    const [event] = log.query('business-a', { targetType: 'sale' })
    expect(event).toMatchObject({
      businessId: 'business-a',
      operationId: 'sale-request-1',
      actorUserId: 'user-1',
      sessionId: 'session-1',
      deviceId: 'device-1',
      result: 'accepted',
    })
    expect(event.metadata).toEqual({ channel: 'offline' })
    expect(log.query('business-b')).toEqual([])
  })

  it('deduplicates retries without manufacturing a second history entry', () => {
    const log = new AuditLog()
    const first = log.record({
      eventType: 'purchase.received',
      businessId: 'b',
      operationId: 'op-1',
      targetType: 'purchase',
      targetId: 'p-1',
      result: 'accepted',
      occurredAt: 1,
      metadata: {},
    })
    const retry = log.record({
      eventType: 'purchase.received',
      businessId: 'b',
      operationId: 'op-1',
      targetType: 'purchase',
      targetId: 'p-1',
      result: 'accepted',
      occurredAt: 2,
      metadata: { retry: true },
    })
    expect(retry).toEqual(first)
    expect(log.query('b')).toHaveLength(1)
  })

  it('links corrections and recovery while preserving the original event', () => {
    const log = new AuditLog()
    log.record({
      eventType: 'sale.completed',
      businessId: 'b',
      operationId: 'sale-1',
      targetType: 'sale',
      targetId: 'sale-1',
      result: 'accepted',
      occurredAt: 1,
      metadata: {},
    })
    log.record({
      eventType: 'sale.correction.applied',
      businessId: 'b',
      operationId: 'corr-1',
      targetType: 'sale',
      targetId: 'sale-1',
      result: 'accepted',
      occurredAt: 2,
      correctionOf: 'sale-1',
      reason: 'wrong quantity',
      metadata: {},
    })
    log.recordRecovery({
      eventType: 'sync.recovered',
      businessId: 'b',
      operationId: 'recovery-1',
      targetType: 'sale',
      targetId: 'sale-1',
      occurredAt: 3,
      recoveryAction: 'reconciled duplicate retry',
      metadata: {},
    })
    expect(log.query('b', { targetId: 'sale-1' })).toHaveLength(3)
    expect(log.query('b', { eventType: 'sale.completed' })).toHaveLength(1)
  })

  it('isolates stored evidence from caller-owned input and returned copies', () => {
    const log = new AuditLog()
    const change = { after: { totalKobo: 1 } }
    const metadata = { note: 'original' }
    log.record({
      eventType: 'sale.completed',
      businessId: 'b',
      operationId: 'sale-1',
      targetType: 'sale',
      targetId: 'sale-1',
      result: 'accepted',
      occurredAt: 1,
      change,
      metadata,
    })
    change.after.totalKobo = 999
    metadata.note = 'tampered'

    const [stored] = log.query('b')
    expect(stored.metadata.note).toBe('original')
    expect(stored.change?.after).toEqual({ totalKobo: 1 })
  })

  it('records denied and failed consequential attempts without business effects', () => {
    const log = new AuditLog()
    log.record({
      eventType: 'authorization.denied',
      businessId: 'b',
      operationId: 'deny-1',
      targetType: 'sale',
      targetId: 'sale-2',
      result: 'denied',
      occurredAt: 1,
      reason: 'permission_denied',
      metadata: {},
    })
    log.recordFailure({
      eventType: 'sale.failed',
      businessId: 'b',
      operationId: 'fail-1',
      targetType: 'sale',
      targetId: 'sale-3',
      occurredAt: 2,
      reason: 'payment_unconfirmed',
      metadata: {},
    })
    expect(log.query('b')).toHaveLength(2)
    expect(log.query('b').every((event) => event.result !== 'accepted')).toBe(
      true,
    )
  })

  it('normalizes authorization evidence with actor, session, and device context', () => {
    const log = new AuditLog()
    log.append({
      eventId: 'auth-op-1',
      eventType: 'authorization.denied',
      actorUserId: 'user-1',
      actorRole: 'staff',
      sessionId: 'session-1',
      businessId: 'b',
      targetRecordId: 'sale-1',
      permission: 'correction:approve',
      result: 'denied',
      reason: 'permission_denied',
      occurredAt: 1,
      deviceId: 'device-1',
    })

    expect(log.query('b', { eventType: 'authorization.denied' })).toEqual([
      expect.objectContaining({
        operationId: 'auth-op-1',
        actorUserId: 'user-1',
        actorRole: 'staff',
        sessionId: 'session-1',
        deviceId: 'device-1',
        result: 'denied',
      }),
    ])
  })

  it('requires explanatory context for corrections and recovery events', () => {
    const log = new AuditLog()
    const correction = {
      eventType: 'sale.correction.applied',
      businessId: 'b',
      operationId: 'correction-1',
      targetType: 'sale',
      targetId: 'sale-1',
      result: 'accepted' as const,
      occurredAt: 1,
      correctionOf: 'sale-1',
      metadata: {},
    }
    expect(() => log.record(correction)).toThrow(
      'reason or recovery context is required',
    )

    expect(() =>
      log.recordRecovery({
        eventType: 'sync.recovered',
        businessId: 'b',
        operationId: 'recovery-1',
        targetType: 'sale',
        targetId: 'sale-1',
        occurredAt: 2,
        metadata: {},
      }),
    ).toThrow('reason or recovery context is required')
  })
})
