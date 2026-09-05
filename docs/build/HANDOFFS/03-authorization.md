# Handoff 03 — Authorization Boundary

**Status:** VERIFIED  
**Verified:** 2026-09-05

## Scope

This slice establishes the authorization infrastructure before feature
modules are added. It does not implement sales, inventory, returns, cash,
or other feature-specific business rules.

The implementation is provider-neutral because the authoritative
authentication provider and database are intentionally deferred by Handoff 01. A future adapter must satisfy `AuthenticationAdapter`; it must not
replace the policy or the service boundary.

## Boundary

The authorization pipeline is:

`authenticated session -> active business -> active membership -> role/permission -> operation state -> approval/separation of duty -> audit`

`src/auth/policy.ts` is the shared policy vocabulary. `executeAuthorized` in
`src/auth/server.ts` is the authoritative service/domain boundary. It
re-evaluates the request and only invokes the mutation after an allow
decision. A hidden or disabled UI action is never considered authorization.

Every request must provide the active `businessId`. A `targetBusinessId`
must match it. This prevents a user who belongs to multiple businesses from
reading or mutating another tenant. Future repositories and API handlers
must accept business context explicitly and call `executeAuthorized` (or an
equivalent server-side policy enforcement wrapper) before a mutation.

## Identity and session

- `UserIdentity` identifies the person; `DeviceIdentity` identifies the
  device. They are separate values.
- Sessions carry user, device, memberships, active business, issue time,
  expiry, and revocation state.
- Business switching is explicit and only permits an active membership.
- Expired, revoked, inactive-user, untrusted-device, and device-mismatch
  sessions are denied.
- `AuthenticationAdapter` is the integration seam for the eventual auth
  provider. Secrets and provider tokens must remain server-managed.

## Roles and permissions

V1 has three capabilities: `owner`, `manager`, and `staff`. Roles may
coexist on one membership; there is no special Owner-Manager role. Effective
permissions are the union of role permissions and explicitly configured
membership permissions.

Staff has least privilege for normal work: sales, successful payments,
repayments, credit requests, and correction requests. Manager adds
operational management and approval permissions. Owner additionally owns
membership and permission administration. No role can delete or rewrite
historical evidence.

The policy is deny-by-default. Adding a screen or API route does not add a
permission.

## Consequential operation contract

| Operation class                              | Who can perform it?                                                        | Approval/self-approval                                                            | Offline                                                                             | Audit                                         |
| -------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| Normal sale, payment, repayment              | Active member with explicit staff/manager/owner permission                 | No separate approval; feature policy still applies                                | Allowed only for the explicit offline permission set                                | Decision and resulting domain event           |
| Credit request                               | Staff/Manager/Owner with request permission                                | Management approval is a separate operation; requester cannot approve own request | Request may be queued; approval is not inferred from offline state                  | Request, decision, and sync outcome           |
| Inventory receipt/adjustment                 | Manager/Owner with configured permission                                   | Adjustment approval follows feature policy; no self-approval where required       | Not granted by connectivity loss                                                    | Decision, target, reason, result              |
| Return approval/process                      | Manager/Owner for approval; permitted role for processing                  | Approval must be separate from requester where required                           | Approval is not granted offline by default                                          | Decision, original record, approval           |
| Material correction/customer identity change | Manager/Owner according to configured permission                           | Separate management approval; self-approval forbidden for material actions        | Not allowed by default; request/review can be queued only when explicitly permitted | Request, reason, approver, target, result     |
| Cash reconciliation/day closure              | Manager/Owner with explicit permission                                     | Feature policy determines independent review                                      | Not newly granted offline                                                           | Decision, business day, result                |
| Membership/permission administration         | Owner; delegated Staff management must be explicitly configured            | A user cannot grant themselves authority; changes are prospective                 | Not allowed                                                                         | Actor, target user, old/new authority, result |
| Integrity resolution                         | Manager/Owner according to explicit permission; Owner resolves escalations | Separate approval when required; never deletes evidence                           | Not allowed                                                                         | Security/integrity decision and target        |

The table is the authorization infrastructure baseline. Feature handoffs must
add state-specific conditions, thresholds, reason requirements, and domain
audit fields without weakening these checks.

## Denial and audit behavior

Denied operations return a stable `AuthorizationDecision` reason and safe
message. `executeAuthorized` throws `AuthorizationError`, records the
decision, and does not invoke the mutation. A denial therefore cannot create
a fake sale, payment, stock movement, correction, or other domain event.

Audit events contain actor, business, permission, target record when known,
result, reason, time, approval actor when applicable, and device. They never
contain credentials, tokens, or protected record contents. Security-sensitive
denials are retained. The eventual authoritative audit store must be
append-only and durable.

## Offline and synchronization

Offline mode is an input to policy, not an alternate trust mode. Only the
explicitly listed low-risk operational permissions remain eligible offline.
Offline status never adds a role or permission. Replayed events must be
re-authorized against the authoritative current business context and resolved
idempotently; stale or cross-business events are rejected and audited.

The local client may display `AuthorizationRequiredState` and
`PermissionDeniedState`, but those states are guidance only. A server/domain
call must still enforce the same boundary.

## Verification

`src/auth/auth.test.ts` covers:

- authorized staff operation;
- unauthorized approval;
- cross-business access despite membership in both businesses;
- role escalation attempt;
- direct service/API invocation bypassing UI, including no mutation on denial;
- self-approval rejection;
- offline permission non-escalation;
- stale session rejection.

Before production, backend integration tests must repeat the cross-business
matrix for reads, writes, reports, event replay, and synchronization using
the real persistence layer and database policies.

## Verification record

Passed for this slice:

```text
npm run test -- --run  PASS (9 tests)
npm run lint           PASS
npm run build          PASS (TypeScript + Vite production build)
npx prettier --check src/App.tsx src/auth docs/build/HANDOFFS/03-authorization.md  PASS
```

The normal application workflow remains covered by the existing shell test.
Authorization tests cover allowed use, denied use, cross-business access,
role escalation, direct service invocation, self-approval, offline
restriction, and stale sessions.

Saved domain data/history, retryable synchronization, persistence-backed
audit history, reports, and feature modules are not implemented in this
slice, so those cases are explicitly deferred rather than simulated.
`npm run format:check` currently reports formatting warnings in pre-existing
repository files outside this slice; changed authorization files pass the
targeted check above.

## Known limitations and unresolved decisions

- The authentication provider, authoritative backend/database, migration
  strategy, token/session transport, and durable audit store remain
  implementation decisions for the platform/data slice.
- `AuthenticationAdapter` is an integration seam, not a credential provider.
- The in-memory policy and audit sink must be connected to the authoritative
  server and persistence layer before production.
- Feature handoffs still own thresholds, transaction states, approval
  reasons, and domain-specific offline/retry behavior.
- Reports are intentionally unchanged and have no authorization-backed
  persistence or read model yet.
