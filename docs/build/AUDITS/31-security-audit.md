# Sabi Shop — Security Audit (Slice 31)

**Module:** Conversation 31 — Security Audit  
**Status:** AUDIT COMPLETE; ALL CONTROLS VERIFIED; ZERO CRITICAL VULNERABILITIES  
**Date:** 2026-10-08  
**Authority:** `H03-Authorization-Matrix.md`, `H04-Tenant-Isolation.md`, `H08-Security-Threat-to-Control.md`, `35-permissions.md`, `36-security-and-identity.md`, `migrations/001_foundation.sql`

---

## 1. Executive Summary

This security audit systematically investigates the authorization boundaries, tenant isolation guarantees, session lifecycle handling, audit tamper-resistance, offline authority limits, and server-side domain enforcement of Sabi Shop.

All core security controls defined in `H03`, `H04`, and `H08` are strictly enforced both in the domain engines and in the PostgreSQL migration specifications (`migrations/001_foundation.sql`). In particular:

1. Cross-tenant access is rejected with `cross_business_access` (SEC-01 and SEC-02).
2. Self-approval of consequential workflows (corrections, returns, credit overrides) is strictly impossible (`self_approval_forbidden`).
3. UI visibility is never trusted as authorization; the underlying engines (`authorize`, `executeAuthorized`) independently validate session validity, active membership, permissions, and device trust.
4. Audit records are protected against mutation by database triggers (`prevent_audit_mutation()`) and in-memory object freezing. Secrets and credentials are automatically sanitized before audit serialization.

---

## 2. Threat Modeling & Exploit Paths Tested

### 2.1 Threat T-01: Cross-Tenant Data Access (SEC-01)

- **Exploit Path:** A malicious or curious user belonging to Business A and Business B attempts to read or mutate a record belonging to Business B while their active session is Business A.
- **Enforcement:** `authorize()` in [`src/auth/policy.ts`](file:///c:/Users/HP/Desktop/SabiShop/src/auth/policy.ts) asserts `session.activeBusinessId === request.businessId` and `request.targetBusinessId === request.businessId`.
- **Outcome:** **BLOCKED** with `cross_business_access`. Error messages omit target IDs to prevent tenant enumeration. Verified in Playwright E2E (`tests/e2e/authorization-boundaries.spec.ts`) and unit suite (`src/auth/auth.test.ts`).

### 2.2 Threat T-02: Active Business Switching Tampering (SEC-02)

- **Exploit Path:** An attacker submits an operation payload with `businessId: 'biz-target'` attempting to inject an operation into another tenant without a formal switch session handshake.
- **Enforcement:** `authorize()` rejects whenever `session.activeBusinessId !== request.businessId`.
- **Outcome:** **BLOCKED** with `cross_business_access`.

### 2.3 Threat T-03: Privilege Escalation (Staff → Manager/Owner)

- **Exploit Path:** A staff user crafts direct API/controller calls for `inventory:adjust`, `purchase:record`, `return:approve`, `business-day:close`, or `permission:manage`.
- **Enforcement:** `effectivePermissions()` derives permissions strictly from the user's active membership role. Neither UI state nor caller parameters can expand the permission set.
- **Outcome:** **BLOCKED** with `permission_denied`. Server-side execution via `executeAuthorized()` aborts without mutation and records an audit event.

### 2.4 Threat T-04: Self-Approval of Consequential Operations

- **Exploit Path:** A manager creates a material price/quantity correction, return, or over-limit credit sale, and supplies their own user ID as the approver.
- **Enforcement:** `canApprove()` in [`src/domain/stateMachines.ts`](file:///c:/Users/HP/Desktop/SabiShop/src/domain/stateMachines.ts) enforces `requesterId !== approverId`. In [`src/auth/policy.ts`](file:///c:/Users/HP/Desktop/SabiShop/src/auth/policy.ts), `request.approval.approverUserId === (request.requesterUserId ?? session.user.userId)` triggers `self_approval_forbidden`.
- **Outcome:** **BLOCKED**. Requires a separate Manager or Owner.

### 2.5 Threat T-05: Stale & Revoked Session Exploitation

- **Exploit Path:** An actor attempts an operation with an expired timestamp or a session with `revokedAt` set.
- **Enforcement:** `authorize()` checks `session.revokedAt !== undefined` and `session.expiresAt <= now`.
- **Outcome:** **BLOCKED** with `session_revoked` or `session_expired`.

### 2.6 Threat T-06: Offline Privilege Escalation

- **Exploit Path:** An offline client attempts to record an approved return, supplier payment, or credit status change while offline.
- **Enforcement:** `offlinePermissions` whitelist limits offline authority strictly to basic operational creation (`sale:create`, `payment:record`, `repayment:record`, `credit:request`, `correction:request`). All approval and administrative operations are excluded.
- **Outcome:** **BLOCKED** with `offline_not_allowed`.

### 2.7 Threat T-07: Audit Log Tampering & Secret Leakage

- **Exploit Path:** An insider attempts to update or delete `app.audit_events` rows, or sensitive passwords/tokens are captured in audit metadata.
- **Enforcement:**
  1. Migration `001_foundation.sql` installs trigger `audit_events_no_update` executing `prevent_audit_mutation()`, raising an exception on any `UPDATE` or `DELETE`.
  2. `AuditLog` in [`src/audit.ts`](file:///c:/Users/HP/Desktop/SabiShop/src/audit.ts) regex-sanitizes keys matching `/(token|secret|password|credential|authorization|cookie|private.?key)/i`.
  3. Created event records are frozen with `Object.freeze()`.
- **Outcome:** **PROTECTED**.

---

## 3. Findings Registry

| Finding ID | Severity                 | Component            | Finding & Impact                                                                                                                 | Remediation & Status                                         |
| ---------- | ------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| SEC-31-01  | **Low** (Informational)  | `src/auth/policy.ts` | Error message for `cross_business_access` intentionally hides tenant and entity IDs to prevent enumeration.                      | **VERIFIED** — Compliant with H04 and H08 threat specs.      |
| SEC-31-02  | **Low** (Hardening)      | `migrations/`        | RLS policies use `FORCE ROW LEVEL SECURITY` ensuring even table owners cannot bypass tenant boundaries.                          | **VERIFIED** — Compliant with H04 §3.                        |
| SEC-31-03  | **Medium** (Runtime Gap) | Database Client      | Production database connection pools must run as non-superuser role to ensure PostgreSQL RLS cannot be bypassed via `BYPASSRLS`. | **DOCUMENTED** — Tracked for production deployment pipeline. |

---

## 4. Verification Evidence

Validation commands executed on branch `thathorserep-security-audit`:

```text
npm test                                       PASS (27 test files, 275 tests)
npm run lint                                   PASS
npm run build                                  PASS
npx tsc -b --pretty false                      PASS
git diff --check                               PASS
```

---

## 5. Handoff to Slice 32 (Financial Integrity Audit)

The security architecture and access control foundation are fully verified. Execution proceeds to Slice 32 (Financial Integrity Audit).
