# Handoff 13 - Audit and Historical Integrity

**Status:** VERIFIED REFERENCE INFRASTRUCTURE  
**Verified:** 2026-09-06

## Scope

This slice establishes the shared audit boundary for consequential operations
and aligns the foundation migration with that contract. It does not decide
business policy, mutate domain source records, or implement incentive payout
logic.

## Contract

`AuditEvent` consistently records:

- event and operation identity;
- business/tenant, target type and target identifier;
- actor, role, session and device where available;
- occurrence and recording time;
- accepted, denied, failed, or recovered result;
- reason and approval context;
- before/after change references;
- correction, reversal, and recovery relationships;
- sanitized metadata.

`AuditLog` is append-only from the application boundary. A `(businessId,
operationId)` retry returns the original evidence and does not create another
history entry. Queries always require a business identifier, and returned
events are cloned so callers cannot mutate stored history. Secret-like metadata
keys are omitted recursively.

Authorization requests may provide a stable `operationId`; when present,
retries use the same audit identity. Requests without one retain unique
attempt evidence. Decisions continue to be recorded before
`executeAuthorized` rejects the operation. A denied request never invokes the
protected mutation.

## Persistence and security

`migrations/001_foundation.sql` now requires a tenant-scoped `operation_id`,
result state, actor role, session/device context, correction/reversal links,
recovery action, and a unique `(business_id, operation_id)` constraint. The
existing append-only trigger, restrictive foreign keys, RLS, and tenant-scoped
indexes remain in force. No credentials, tokens, or unnecessary protected
record contents are written by the reference logger.

## Business rules used

- H01: durable explainability, no silent historical destruction, correction
  lineage, denied actions have no business effect, tenant isolation,
  idempotency, and consequential attribution.
- H07: duplicate/retry evidence, failure evidence, recovery evidence, and
  recovery hierarchy.
- H08: append-only audit storage, cross-tenant isolation, least privilege,
  denial recording, and sensitive-data minimization.
- D10/audit-and-integrity and D11/hash-chain intent: append-oriented evidence,
  protected history, integrity relationships, and investigation support.
- Authorization handoff 03: server-side decision recording and no UI-only
  authority.

## Tests and validation

Focused tests in `src/audit.test.ts` cover accepted consequential evidence,
tenant-scoped queryability, correction/recovery lineage, denied/failed
attempts, secret redaction, retry deduplication, normalized authorization
context, mandatory correction/recovery explanatory context, and protection of
stored evidence from caller-owned mutable input.
Existing authorization, correction, sales, inventory, purchasing, credit, and
reconciliation tests remain green.

```text
npm ci                         PASS (264 packages, 0 vulnerabilities)
npm run format:check           PASS
npm run lint                   PASS
npm test                       PASS (87 tests)
npm run build                  PASS (TypeScript + Vite production build)
npx tsc -b --pretty false      PASS
git diff --check               PASS
```

Prettier does not provide a parser for the changed SQL files; the SQL changes
were kept scoped and the database isolation test fixture was updated to assert
duplicate operation rejection. Execution of the PostgreSQL fixture remains
dependent on the repository's database test environment.

## Known limitations

- `AuditLog` is an in-memory reference implementation until the authoritative
  persistence adapter is connected.
- Cryptographic hash-chain generation/verification remains the D11 persistence
  adapter responsibility; this slice preserves the metadata relationships it
  needs.
- Existing domain engines retain domain-specific audit projections. Their
  durable adapter should map those projections into this contract at
  integration time.

## Changed files

- `src/audit.ts`
- `src/audit.test.ts`
- `src/auth/policy.ts`
- `migrations/001_foundation.sql`
- `tests/database/001_foundation_isolation.sql`
- `docs/build/BUILD-STATUS.md`
