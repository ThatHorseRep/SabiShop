import { expect, test } from '@playwright/test'
import { authorize } from '../../src/auth/policy'
import type { AuthSession } from '../../src/auth/types'

function sessionForBoundaryTest(activeBusinessId: string): AuthSession {
  const now = Date.now()
  return {
    sessionId: 'session-e2e-boundary',
    user: {
      userId: 'user-boundary-e2e',
      displayName: 'Boundary Test User',
      active: true,
    },
    device: { deviceId: 'device-boundary-e2e', trusted: true },
    memberships: [
      {
        businessId: 'biz-active',
        roles: ['manager'],
        active: true,
      },
      {
        businessId: 'biz-target',
        roles: ['owner'],
        active: true,
      },
    ],
    activeBusinessId,
    issuedAt: now - 60_000,
    expiresAt: now + 60_000,
  }
}

test.describe('Authorization and tenant boundaries', () => {
  test('SEC-01 denies a target record from another business even when the user belongs to both', () => {
    const decision = authorize(sessionForBoundaryTest('biz-active'), {
      permission: 'audit:read',
      businessId: 'biz-active',
      targetBusinessId: 'biz-target',
      targetRecordId: 'sale-target-business',
      operationId: 'e2e-cross-tenant-read',
    })

    expect(decision.allowed).toBe(false)
    expect(decision.reason).toBe('cross_business_access')
    expect(decision.message).toBe('The target belongs to another business.')
    expect(decision.message).not.toContain('biz-target')
    expect(decision.message).not.toContain('sale-target-business')
    expect(decision.auditRequired).toBe(true)
  })

  test('SEC-02 denies an operation that tries to make another business active', () => {
    const decision = authorize(sessionForBoundaryTest('biz-active'), {
      permission: 'sale:create',
      businessId: 'biz-target',
      operationId: 'e2e-cross-tenant-write',
    })

    expect(decision.allowed).toBe(false)
    expect(decision.reason).toBe('cross_business_access')
    expect(decision.message).toBe(
      'This operation is outside the active business.',
    )
    expect(decision.auditRequired).toBe(true)
  })
})
