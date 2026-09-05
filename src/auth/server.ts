import { authorize, recordDecision } from './policy'
import {
  type AuditSink,
  type AuthSession,
  type AuthorizationRequest,
  type AuthorizationDecision,
} from './types'

export class AuthorizationError extends Error {
  readonly decision: AuthorizationDecision

  constructor(decision: AuthorizationDecision) {
    super(decision.message)
    this.name = 'AuthorizationError'
    this.decision = decision
  }
}

export type AuthorizedOperation<T> = {
  session: AuthSession | null
  request: AuthorizationRequest
  audit: AuditSink
  perform: () => T | Promise<T>
}

/**
 * Authoritative service/domain boundary. Callers must pass through this
 * function; UI visibility is deliberately not part of the contract.
 */
export const executeAuthorized = async <T>({
  session,
  request,
  audit,
  perform,
}: AuthorizedOperation<T>): Promise<T> => {
  const decision = authorize(session, request)
  recordDecision(audit, session, request, decision)
  if (!decision.allowed) throw new AuthorizationError(decision)
  return perform()
}
