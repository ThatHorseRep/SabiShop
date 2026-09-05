import {
  type AuditSink,
  type AuthSession,
  type AuthorizationDecision,
  type AuthorizationRequest,
  type Permission,
  type Role,
} from './types'

const rolePermissions: Record<Role, readonly Permission[]> = {
  staff: [
    'business:work',
    'business:switch',
    'sale:create',
    'payment:record',
    'repayment:record',
    'credit:request',
    'correction:request',
  ],
  manager: [
    'business:work',
    'business:switch',
    'sale:create',
    'payment:record',
    'repayment:record',
    'inventory:receive',
    'inventory:adjust',
    'supplier:manage',
    'purchase:record',
    'supplier:payment',
    'supplier:return',
    'supplier:settlement',
    'return:approve',
    'return:process',
    'credit:request',
    'credit:approve',
    'correction:request',
    'correction:approve',
    'customer:identity-update',
    'cash:reconcile',
    'business-day:close',
    'audit:read',
    'integrity:resolve',
  ],
  owner: [
    'business:work',
    'business:switch',
    'sale:create',
    'payment:record',
    'repayment:record',
    'inventory:receive',
    'inventory:adjust',
    'supplier:manage',
    'purchase:record',
    'supplier:payment',
    'supplier:return',
    'supplier:settlement',
    'return:approve',
    'return:process',
    'credit:request',
    'credit:approve',
    'correction:request',
    'correction:approve',
    'customer:identity-update',
    'cash:reconcile',
    'business-day:close',
    'audit:read',
    'integrity:resolve',
    'membership:manage',
    'permission:manage',
  ],
}

const offlinePermissions = new Set<Permission>([
  'business:work',
  'business:switch',
  'sale:create',
  'payment:record',
  'repayment:record',
  'credit:request',
  'correction:request',
])

const managementApprovalRoles = new Set<Role>(['manager', 'owner'])

const deny = (
  reason: AuthorizationDecision['reason'],
  message: string,
  auditRequired = true,
): AuthorizationDecision => ({
  allowed: false,
  reason,
  message,
  auditRequired,
})

const allow = (): AuthorizationDecision => ({
  allowed: true,
  reason: 'allowed',
  message: 'Operation authorized.',
  auditRequired: true,
})

export const effectivePermissions = (
  membership: Pick<
    NonNullable<AuthSession['memberships'][number]>,
    'roles' | 'permissions'
  >,
): ReadonlySet<Permission> => {
  const result = new Set<Permission>(membership.permissions ?? [])
  for (const role of membership.roles) {
    for (const permission of rolePermissions[role]) result.add(permission)
  }
  return result
}

export const authorize = (
  session: AuthSession | null,
  request: AuthorizationRequest,
  now = Date.now(),
): AuthorizationDecision => {
  if (!session) return deny('authentication_required', 'Sign in is required.')
  if (session.revokedAt !== undefined) {
    return deny('session_revoked', 'This session has been revoked.')
  }
  if (session.expiresAt <= now) {
    return deny('session_expired', 'Your session has expired. Sign in again.')
  }
  if (!session.user.active)
    return deny('inactive_user', 'This user is no longer active.')
  if (!session.device.trusted)
    return deny('untrusted_device', 'This device is not trusted.')
  if (request.deviceId && request.deviceId !== session.device.deviceId) {
    return deny(
      'device_mismatch',
      'This session is not valid for the requesting device.',
    )
  }
  if (!request.businessId) {
    return deny('business_context_required', 'Choose an active business first.')
  }
  if (session.activeBusinessId === null) {
    return deny('business_context_required', 'Choose an active business first.')
  }
  if (session.activeBusinessId !== request.businessId) {
    return deny(
      'cross_business_access',
      'This operation is outside the active business.',
    )
  }
  if (
    request.targetBusinessId &&
    request.targetBusinessId !== request.businessId
  ) {
    return deny(
      'cross_business_access',
      'The target belongs to another business.',
    )
  }

  const membership = session.memberships.find(
    (candidate) =>
      candidate.businessId === request.businessId && candidate.active,
  )
  if (!membership) {
    return deny(
      'business_membership_required',
      'You are not an active member of this business.',
    )
  }

  if (request.isOffline && !offlinePermissions.has(request.permission)) {
    return deny(
      'offline_not_allowed',
      'This action needs a connection and cannot be approved offline.',
    )
  }

  if (!effectivePermissions(membership).has(request.permission)) {
    return deny(
      'permission_denied',
      'You do not have permission to perform this operation.',
    )
  }
  if (request.state?.businessDayClosed && request.permission !== 'audit:read') {
    return deny(
      'business_day_closed',
      'The business day is closed for this operation.',
    )
  }
  if (
    request.state?.integrityBlocked &&
    request.permission !== 'integrity:resolve'
  ) {
    return deny(
      'integrity_blocked',
      'This record is blocked pending integrity review.',
    )
  }
  if (!request.requiresApproval) return allow()
  if (!request.approval) {
    return deny(
      'approval_required',
      'A separate management approval is required.',
    )
  }
  if (
    request.approval.businessId !== request.businessId ||
    !request.approval.verified
  ) {
    return deny(
      'approval_role_insufficient',
      'Approval must be verified for this business by the authoritative service.',
    )
  }
  if (
    request.approval.approverUserId ===
    (request.requesterUserId ?? session.user.userId)
  ) {
    return deny(
      'self_approval_forbidden',
      'You cannot approve your own consequential action.',
    )
  }
  if (
    !request.approval.approverRoles.some((role) =>
      managementApprovalRoles.has(role),
    )
  ) {
    return deny(
      'approval_role_insufficient',
      'Approval must come from an authorized Manager or Owner.',
    )
  }
  return allow()
}

export const recordDecision = (
  sink: AuditSink,
  session: AuthSession | null,
  request: AuthorizationRequest,
  decision: AuthorizationDecision,
  now = Date.now(),
): void => {
  if (!decision.auditRequired) return
  sink.append({
    eventId: `auth-${now}-${Math.random().toString(36).slice(2, 10)}`,
    eventType: decision.allowed
      ? 'authorization.decision'
      : 'authorization.denied',
    actorUserId: session?.user.userId,
    businessId: request.businessId,
    targetRecordId: request.targetRecordId,
    permission: request.permission,
    result: decision.allowed ? 'allowed' : 'denied',
    reason: decision.reason,
    occurredAt: now,
    approvalUserId: request.approval?.approverUserId,
    deviceId: session?.device.deviceId,
  })
}
