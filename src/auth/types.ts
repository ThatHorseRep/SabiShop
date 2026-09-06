export const roles = ['owner', 'manager', 'staff'] as const
export type Role = (typeof roles)[number]

export const permissions = [
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
] as const
export type Permission = (typeof permissions)[number]

export type UserIdentity = {
  userId: string
  displayName: string
  active: boolean
}

export type DeviceIdentity = {
  deviceId: string
  trusted: boolean
}

export type BusinessMembership = {
  businessId: string
  roles: Role[]
  permissions?: Permission[]
  active: boolean
}

export type AuthSession = {
  sessionId: string
  user: UserIdentity
  device: DeviceIdentity
  memberships: BusinessMembership[]
  activeBusinessId: string | null
  issuedAt: number
  expiresAt: number
  revokedAt?: number
}

export type Approval = {
  approvalId: string
  businessId: string
  approverUserId: string
  approverRoles: Role[]
  approvedAt: number
  verified: boolean
}

export type AuthorizationRequest = {
  permission: Permission
  businessId: string
  operationId?: string
  targetBusinessId?: string
  targetRecordId?: string
  requesterUserId?: string
  requiresApproval?: boolean
  approval?: Approval
  isOffline?: boolean
  deviceId?: string
  state?: {
    businessDayClosed?: boolean
    integrityBlocked?: boolean
  }
}

export type AuthorizationReason =
  | 'allowed'
  | 'authentication_required'
  | 'session_expired'
  | 'session_revoked'
  | 'inactive_user'
  | 'untrusted_device'
  | 'device_mismatch'
  | 'business_context_required'
  | 'business_membership_required'
  | 'business_inactive'
  | 'cross_business_access'
  | 'permission_denied'
  | 'offline_not_allowed'
  | 'approval_required'
  | 'self_approval_forbidden'
  | 'approval_role_insufficient'
  | 'business_day_closed'
  | 'integrity_blocked'

export type AuthorizationDecision = {
  allowed: boolean
  reason: AuthorizationReason
  message: string
  auditRequired: boolean
}

export type AuthorizationAuditEvent = {
  eventId: string
  eventType: 'authorization.decision' | 'authorization.denied'
  actorUserId?: string
  actorRole?: string
  sessionId?: string
  businessId: string
  targetRecordId?: string
  permission: Permission
  result: 'allowed' | 'denied'
  reason: AuthorizationReason
  occurredAt: number
  approvalUserId?: string
  deviceId?: string
}

export type AuditSink = {
  append: (event: AuthorizationAuditEvent) => void
}
