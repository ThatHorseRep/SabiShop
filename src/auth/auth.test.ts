import { describe, expect, it } from 'vitest'
import {
  authorize,
  effectivePermissions,
  executeAuthorized,
  type AuditSink,
  type AuthSession,
  type Permission,
} from './index'

const session = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  sessionId: 'session-1',
  user: { userId: 'staff-1', displayName: 'Ada', active: true },
  device: { deviceId: 'device-1', trusted: true },
  memberships: [
    { businessId: 'business-a', roles: ['staff'], active: true },
    { businessId: 'business-b', roles: ['staff'], active: true },
  ],
  activeBusinessId: 'business-a',
  issuedAt: 1,
  expiresAt: 1_000_000_000_000_000,
  ...overrides,
})

const audit = (): AuditSink & { events: unknown[] } => {
  const events: unknown[] = []
  return { events, append: (event) => events.push(event) }
}

describe('authorization boundary', () => {
  it('allows a staff member to create a sale in the active business', () => {
    expect(
      authorize(
        session(),
        {
          permission: 'sale:create',
          businessId: 'business-a',
        },
        100,
      ),
    ).toMatchObject({ allowed: true, reason: 'allowed' })
  })

  it('denies a staff member from approving a return', () => {
    expect(
      authorize(session(), {
        permission: 'return:approve',
        businessId: 'business-a',
      }),
    ).toMatchObject({ allowed: false, reason: 'permission_denied' })
  })

  it('denies staff purchasing authority while allowing management purchasing authority', () => {
    expect(
      authorize(session(), {
        permission: 'purchase:record',
        businessId: 'business-a',
      }),
    ).toMatchObject({ allowed: false, reason: 'permission_denied' })

    expect(
      authorize(
        session({
          user: { userId: 'manager-1', displayName: 'Mina', active: true },
          memberships: [
            { businessId: 'business-a', roles: ['manager'], active: true },
          ],
        }),
        { permission: 'purchase:record', businessId: 'business-a' },
      ),
    ).toMatchObject({ allowed: true, reason: 'allowed' })
  })

  it('denies access to another business even when membership exists', () => {
    expect(
      authorize(session(), {
        permission: 'sale:create',
        businessId: 'business-b',
      }),
    ).toMatchObject({ allowed: false, reason: 'cross_business_access' })
  })

  it('denies a role escalation attempt through the operation boundary', () => {
    expect(
      authorize(session(), {
        permission: 'permission:manage',
        businessId: 'business-a',
      }),
    ).toMatchObject({ allowed: false, reason: 'permission_denied' })
  })

  it('rechecks authorization when the API is invoked without the UI', async () => {
    const auditLog = audit()
    let mutated = false

    await expect(
      executeAuthorized({
        session: session(),
        request: {
          permission: 'inventory:adjust',
          businessId: 'business-a',
        },
        audit: auditLog,
        perform: () => {
          mutated = true
        },
      }),
    ).rejects.toMatchObject({ decision: { reason: 'permission_denied' } })

    expect(mutated).toBe(false)
    expect(auditLog.events).toHaveLength(1)
  })

  it('denies self-approval for a consequential operation', () => {
    expect(
      authorize(
        session({
          user: { userId: 'manager-1', displayName: 'Mina', active: true },
          memberships: [
            { businessId: 'business-a', roles: ['manager'], active: true },
          ],
        }),
        {
          permission: 'correction:approve',
          businessId: 'business-a',
          requesterUserId: 'manager-1',
          requiresApproval: true,
          approval: {
            approvalId: 'approval-1',
            businessId: 'business-a',
            approverUserId: 'manager-1',
            approverRoles: ['manager'],
            approvedAt: 2,
            verified: true,
          },
        },
      ),
    ).toMatchObject({ allowed: false, reason: 'self_approval_forbidden' })
  })

  it('does not grant a new permission while offline', () => {
    expect(
      authorize(session(), {
        permission: 'return:approve',
        businessId: 'business-a',
        isOffline: true,
      }),
    ).toMatchObject({ allowed: false, reason: 'offline_not_allowed' })
  })

  it('rejects stale sessions', () => {
    expect(
      authorize(
        session({ expiresAt: 99 }),
        {
          permission: 'sale:create',
          businessId: 'business-a',
        },
        100,
      ),
    ).toMatchObject({ allowed: false, reason: 'session_expired' })
  })

  it('P0-2: allows a salesperson to create a sale in the active business', () => {
    const spSession = session({
      user: { userId: 'sales-1', displayName: 'Emeka', active: true },
      memberships: [
        { businessId: 'business-a', roles: ['salesperson'], active: true },
      ],
    })

    expect(
      authorize(spSession, {
        permission: 'sale:create',
        businessId: 'business-a',
      }),
    ).toMatchObject({ allowed: true, reason: 'allowed' })
  })

  it('P0-2: denies a salesperson from approving a return, purchasing, or managing memberships', () => {
    const spSession = session({
      user: { userId: 'sales-1', displayName: 'Emeka', active: true },
      memberships: [
        { businessId: 'business-a', roles: ['salesperson'], active: true },
      ],
    })

    const restrictedPermissions: Permission[] = [
      'return:approve',
      'purchase:record',
      'membership:manage',
      'business-day:close',
      'cash:reconcile',
      'inventory:adjust',
    ]

    for (const permission of restrictedPermissions) {
      expect(
        authorize(spSession, {
          permission,
          businessId: 'business-a',
        }),
      ).toMatchObject({ allowed: false, reason: 'permission_denied' })
    }
  })

  it('P0-2: computes effectivePermissions for salesperson without throwing and yields exactly 7 routine permissions', () => {
    expect(() => {
      effectivePermissions({ roles: ['salesperson'] })
    }).not.toThrow()

    const perms = effectivePermissions({ roles: ['salesperson'] })
    expect(perms.size).toBe(7)
    expect(perms.has('sale:create')).toBe(true)
    expect(perms.has('payment:record')).toBe(true)
    expect(perms.has('repayment:record')).toBe(true)
    expect(perms.has('credit:request')).toBe(true)
    expect(perms.has('correction:request')).toBe(true)
    expect(perms.has('business:work')).toBe(true)
    expect(perms.has('business:switch')).toBe(true)
    expect(perms.has('return:approve')).toBe(false)
  })

  it('P0-2: executeAuthorized() runs for salesperson and records actorRole salesperson in audit log', async () => {
    const spSession = session({
      user: { userId: 'sales-1', displayName: 'Emeka', active: true },
      memberships: [
        { businessId: 'business-a', roles: ['salesperson'], active: true },
      ],
    })
    const auditLog = audit()
    let executed = false

    await executeAuthorized({
      session: spSession,
      request: {
        permission: 'payment:record',
        businessId: 'business-a',
        targetRecordId: 'sale-99',
      },
      audit: auditLog,
      perform: () => {
        executed = true
      },
    })

    expect(executed).toBe(true)
    expect(auditLog.events).toHaveLength(1)
    expect(auditLog.events[0]).toMatchObject({
      eventType: 'authorization.decision',
      result: 'allowed',
      actorRole: 'salesperson',
      businessId: 'business-a',
    })
  })

  it('P0-5: denies approval when approver role is insufficient (salesperson cannot approve)', () => {
    const spSession = session({
      user: { userId: 'sales-1', displayName: 'Emeka', active: true },
      memberships: [
        { businessId: 'business-a', roles: ['salesperson'], active: true },
      ],
    })

    const decision = authorize(spSession, {
      permission: 'credit:request',
      businessId: 'business-a',
      requesterUserId: 'sales-1',
      requiresApproval: true,
      approval: {
        approvalId: 'app-2',
        businessId: 'business-a',
        approverUserId: 'sales-2',
        approverRoles: ['salesperson'],
        approvedAt: 100,
        verified: true,
      },
    })

    expect(decision).toMatchObject({
      allowed: false,
      reason: 'approval_role_insufficient',
    })
  })

  it('P0-5: allows valid dual-approval where salesperson requests and separate manager approves', () => {
    const spSession = session({
      user: { userId: 'sales-1', displayName: 'Emeka', active: true },
      memberships: [
        { businessId: 'business-a', roles: ['salesperson'], active: true },
      ],
    })

    const decision = authorize(spSession, {
      permission: 'credit:request',
      businessId: 'business-a',
      requesterUserId: 'sales-1',
      requiresApproval: true,
      approval: {
        approvalId: 'app-valid',
        businessId: 'business-a',
        approverUserId: 'mgr-1',
        approverRoles: ['manager'],
        approvedAt: 100,
        verified: true,
      },
    })

    expect(decision).toMatchObject({
      allowed: true,
      reason: 'allowed',
    })
  })

  it('SEC-01: multi-tenant error messages omit foreign tenant ID to prevent enumeration', () => {
    const userSession = session({
      activeBusinessId: 'business-a',
    })

    const decision = authorize(userSession, {
      permission: 'sale:create',
      businessId: 'business-b',
    })

    expect(decision).toMatchObject({
      allowed: false,
      reason: 'cross_business_access',
    })
    expect(decision.message).not.toContain('business-b')
  })
})
