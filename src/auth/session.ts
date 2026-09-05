import {
  type AuthSession,
  type BusinessMembership,
  type DeviceIdentity,
  type UserIdentity,
} from './types'

export type AuthenticatedAccount = {
  user: UserIdentity
  memberships: BusinessMembership[]
  device: DeviceIdentity
}

export type AuthenticationAdapter = {
  authenticate: (
    credential: string,
    device: DeviceIdentity,
  ) => Promise<AuthenticatedAccount>
}

export type SessionManager = {
  getSession: () => AuthSession | null
  signIn: (credential: string) => Promise<AuthSession>
  signOut: () => void
  switchBusiness: (businessId: string) => AuthSession
}

export const createSessionManager = (
  adapter: AuthenticationAdapter,
  device: DeviceIdentity,
  clock: () => number = Date.now,
): SessionManager => {
  let session: AuthSession | null = null

  return {
    getSession: () => session,
    async signIn(credential) {
      const account = await adapter.authenticate(credential, device)
      const activeBusinessId =
        account.memberships.find((membership) => membership.active)
          ?.businessId ?? null
      session = {
        sessionId: `session-${clock()}-${Math.random().toString(36).slice(2, 10)}`,
        user: account.user,
        device: account.device,
        memberships: account.memberships,
        activeBusinessId,
        issuedAt: clock(),
        expiresAt: clock() + 1000 * 60 * 60 * 12,
      }
      return session
    },
    signOut() {
      if (session) session = { ...session, revokedAt: clock() }
    },
    switchBusiness(businessId) {
      if (!session) throw new Error('Authentication is required.')
      if (
        !session.memberships.some(
          (membership) =>
            membership.businessId === businessId && membership.active,
        )
      ) {
        throw new Error('You are not an active member of this business.')
      }
      session = { ...session, activeBusinessId: businessId }
      return session
    },
  }
}
