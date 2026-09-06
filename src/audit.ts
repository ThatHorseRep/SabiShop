import type { AuthorizationAuditEvent, AuditSink } from './auth/types'

export type AuditResult = 'accepted' | 'denied' | 'failed' | 'recovered'

export type AuditEvent = Readonly<{
  eventId: string
  eventType: string
  businessId: string
  actorUserId?: string
  actorRole?: string
  sessionId?: string
  deviceId?: string
  operationId: string
  targetType: string
  targetId?: string
  result: AuditResult
  occurredAt: number
  recordedAt: number
  reason?: string
  authorization?: { approverUserId?: string; permission?: string }
  change?: { before?: unknown; after?: unknown }
  correctionOf?: string
  reversalOf?: string
  recoveryAction?: string
  metadata: Readonly<Record<string, unknown>>
}>

export type AuditAppendInput = Omit<
  AuditEvent,
  'eventId' | 'recordedAt' | 'metadata'
> & {
  eventId?: string
  recordedAt?: number
  metadata?: Record<string, unknown>
}

const SECRET_KEY =
  /(token|secret|password|credential|authorization|cookie|private.?key)/i

const sanitize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !SECRET_KEY.test(key))
        .map(([key, nested]) => [key, sanitize(nested)]),
    )
  }
  return value
}

const clone = <T>(value: T): T => structuredClone(value)

/** In-memory reference implementation for the durable append-only audit boundary. */
export class AuditLog implements AuditSink {
  private readonly events: AuditEvent[] = []
  private readonly byOperation = new Map<string, AuditEvent>()

  append(event: AuthorizationAuditEvent): void {
    this.record({
      eventId: event.eventId,
      eventType: event.eventType,
      businessId: event.businessId,
      actorUserId: event.actorUserId,
      actorRole: event.actorRole,
      sessionId: event.sessionId,
      deviceId: event.deviceId,
      operationId: event.eventId,
      targetType: 'authorization',
      targetId: event.targetRecordId,
      result: event.result === 'allowed' ? 'accepted' : 'denied',
      occurredAt: event.occurredAt,
      reason: event.reason,
      authorization: {
        approverUserId: event.approvalUserId,
        permission: event.permission,
      },
      metadata: {},
    })
  }

  record(input: AuditAppendInput): AuditEvent {
    const operationId = input.operationId.trim()
    if (!input.businessId.trim()) throw new Error('businessId is required')
    if (!input.eventType.trim()) throw new Error('eventType is required')
    if (!input.targetType.trim()) throw new Error('targetType is required')
    if (!operationId) throw new Error('operationId is required')
    if (!Number.isFinite(input.occurredAt))
      throw new Error('occurredAt must be a finite timestamp')
    const existing = this.byOperation.get(`${input.businessId}:${operationId}`)
    if (existing) return clone(existing)

    const source = clone(input)
    if (
      ((source.correctionOf ?? source.reversalOf) && !source.reason?.trim()) ||
      (source.result === 'recovered' && !source.recoveryAction?.trim())
    )
      throw new Error('reason or recovery context is required')
    const event: AuditEvent = Object.freeze({
      ...source,
      operationId,
      eventId: source.eventId ?? `audit-${this.events.length + 1}`,
      recordedAt: source.recordedAt ?? Date.now(),
      metadata: Object.freeze(
        sanitize(source.metadata ?? {}) as Record<string, unknown>,
      ),
      change:
        source.change && (sanitize(source.change) as AuditEvent['change']),
    })
    this.events.push(event)
    this.byOperation.set(`${event.businessId}:${event.operationId}`, event)
    return clone(event)
  }

  recordFailure(input: Omit<AuditAppendInput, 'result'>): AuditEvent {
    return this.record({ ...input, result: 'failed' })
  }

  recordRecovery(input: Omit<AuditAppendInput, 'result'>): AuditEvent {
    return this.record({ ...input, result: 'recovered' })
  }

  query(
    businessId: string,
    filter: { targetType?: string; targetId?: string; eventType?: string } = {},
  ): AuditEvent[] {
    return this.events
      .filter(
        (event) =>
          event.businessId === businessId &&
          (!filter.targetType || event.targetType === filter.targetType) &&
          (!filter.targetId || event.targetId === filter.targetId) &&
          (!filter.eventType || event.eventType === filter.eventType),
      )
      .map(clone)
  }
}
