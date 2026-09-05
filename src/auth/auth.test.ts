import { describe, expect, it } from 'vitest'
import {
  authorize,
  executeAuthorized,
  type AuditSink,
  type AuthSession,
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
})
