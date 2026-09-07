import { effectivePermissions } from '../auth/policy'
import type { Permission, Role } from '../auth/types'

export type PosActor = {
  id: string
  displayName: string
  role: Role
}

export type PosSession = {
  businessId: string
  businessName: string
  deviceId: string
  actor: PosActor
  permissions: ReadonlySet<Permission>
}

/** A management actor who can approve consequential POS actions. */
export type ManagementActor = PosActor & { role: 'manager' | 'owner' }

export const posBusiness = {
  id: 'biz-nkechi-hardware',
  name: 'Nkechi Hardware',
} as const

export const posDeviceId = 'device-pos-01'

/**
 * Reference session adapter. The authoritative authentication provider is a
 * downstream integration seam (Handoff 03); these actors stand in so the POS
 * can run against the real permission model without pretending to be a
 * credential provider. Switching actors here never grants authority by itself.
 */
export const posActors: readonly PosActor[] = [
  { id: 'user-chidi', displayName: 'Chidi Okoro', role: 'staff' },
  { id: 'user-ngozi', displayName: 'Ngozi Balogun', role: 'manager' },
  { id: 'user-nkechi', displayName: 'Nkechi Eze', role: 'owner' },
]

export function findActor(actorId: string): PosActor {
  const actor = posActors.find((candidate) => candidate.id === actorId)
  if (!actor) throw new Error(`Unknown POS actor: ${actorId}`)
  return actor
}

export function sessionForActor(actor: PosActor): PosSession {
  return {
    businessId: posBusiness.id,
    businessName: posBusiness.name,
    deviceId: posDeviceId,
    actor,
    permissions: effectivePermissions({ roles: [actor.role] }),
  }
}

/**
 * Management actors who may authorize a consequential POS action for the
 * current session actor. Self-approval is excluded (B09 separation of duty);
 * the domain engines remain the authoritative check.
 */
export function approvalCandidates(session: PosSession): ManagementActor[] {
  return posActors.filter(
    (candidate): candidate is ManagementActor =>
      (candidate.role === 'manager' || candidate.role === 'owner') &&
      candidate.id !== session.actor.id,
  )
}

export function roleLabel(role: Role): string {
  switch (role) {
    case 'owner':
      return 'Owner'
    case 'manager':
      return 'Manager'
    default:
      return 'Staff'
  }
}
