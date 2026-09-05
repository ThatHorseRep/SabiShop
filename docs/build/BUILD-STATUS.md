# Sabi Shop Build Status

**As of:** 2026-09-05

## Overall

The specification baseline is substantially reconciled. The engineering
foundation and authorization boundary are implemented and verified; other
domain implementation remains blocked or pending the decisions recorded
below.

## Foundation slice

**Status:** VERIFIED

Implemented:

- React + Vite TypeScript application shell
- strict TypeScript, ESLint, Prettier, and Vitest configuration
- reproducible `npm ci` installation
- accessible mobile-first shell and uncaught UI error recovery
- public-only environment guidance
- GitHub Actions baseline for formatting, lint, tests, and build
- developer documentation and foundation handoff

Verification passed on 2026-09-05:

```text
npm ci                 PASS
npm run format:check   PASS
npm run lint           PASS
npm run test           PASS (1 test)
npm run build          PASS (TypeScript + Vite production build)
```

The current test covers the normal application-shell render and status
announcement. Authentication, authorization, persistence, history, offline
storage, synchronization, reports, POS, inventory, financial behavior, and
domain failure/retry tests are not applicable until those modules exist. No
product rules were invented for this slice.

## Authorization slice

**Status:** VERIFIED

Implemented:

- provider-neutral authentication adapter and session manager
- user identity separated from device identity
- explicit active business context and membership checks
- Owner, Manager, and Staff role capabilities
- explicit permission catalogue with deny-by-default evaluation
- server/domain authorization boundary for consequential operations
- tenant checks, stale/revoked session checks, device checks, and state
  checks
- approval verification contract, self-approval prevention, and offline
  permission restrictions
- authorization-required and permission-denied UI states
- authorization decision/audit event contract

Verification passed on 2026-09-05:

```text
npm run test -- --run  PASS (9 tests)
npm run lint           PASS
npm run build          PASS (TypeScript + Vite production build)
npx prettier --check src/App.tsx src/auth docs/build/HANDOFFS/03-authorization.md  PASS
```

The slice tests cover normal authorized use, unauthorized use, cross-business
access, role escalation, direct service/API invocation bypassing UI,
self-approval, offline restrictions, and stale sessions. Saved domain
data/history, retry/synchronization, persistence-backed audit, reports, and
feature-specific failure behavior remain deferred because those modules do
not exist yet.

## Domain-state slice

**Status:** VERIFIED — domain contract and state-machine kernel

Implemented:

- Canonical typed state machines for sale, payment, credit/debt, return,
  correction, reconciliation, synchronization, and authorization.
- Invariant helpers for completion authority, confirmed payment, separation of
  duties, inventory movement evidence, and expected cash.
- Domain tests for normal, unauthorized, retry, failure, history-preserving,
  and reporting-relevant behavior.
- Slice handoff at `docs/build/HANDOFFS/04-domain-state.md`.

Verification on 2026-09-05:

```text
npm test               PASS (2 files, 9 tests)
npm run lint           PASS
npm run build          PASS (TypeScript + Vite production build)
git diff --check       PASS
npm run format:check   FAIL (pre-existing repository-wide formatting drift)
```

The format failure is not caused only by this slice: the existing script
reports formatting drift throughout the baseline repository. The new slice
files were formatted individually. Persistence, tenant/RLS, API, report
projection, external payment, and full synchronization conflict tests remain
downstream because this slice intentionally adds no such modules.

## Current repository assessment

| Area                                  | Status                                               | Evidence                                                      |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| Product vision and V1 boundary        | BUILD-READY                                          | `01-product-vision.md`, `50-mvp-scope.md`                     |
| Locked business decisions             | BUILD-READY                                          | `00-final-decision-register.md`, Product Bible reconciliation |
| Business invariants and state rules   | BUILD-READY                                          | `03`–`10`, `27`, `28`, `55`, H01–H02                          |
| UX/design direction                   | BUILD-READY with implementation decisions pending    | `11`–`22`, `29`                                               |
| Data/API technical contract           | REQUIRES DECISION                                    | `24`–`26`, `43`–`44`                                          |
| Identity/recovery/device policy       | BUILD-READY for authorization seam; provider pending | `36`, `src/auth/session.ts`, and H11 Q25–Q27                  |
| Offline authorization/conflict policy | REQUIRES DECISION                                    | `34`, H06, H11 Q22–Q24                                        |
| Backup RPO/RTO/retention              | REQUIRES DECISION                                    | `33`, H11 Q28–Q31                                             |
| Application foundation                | VERIFIED                                             | `docs/build/HANDOFFS/01-foundation.md`                        |
| Authorization boundary                | VERIFIED                                             | `docs/build/HANDOFFS/03-authorization.md` and `src/auth/`     |

## Finance slice

**Status:** VERIFIED — canonical financial primitives

Implemented:

- exact integer minor-unit money and rational quantities;
- deterministic half-up kobo/currency rounding;
- currency validation and tax/VAT calculations;
- gross selling value, approved discount, net recognized selling value;
- weighted-average COGS and canonical gross profit;
- customer and supplier outstanding reducers;
- additive correction, return, refund/credit, and negative-stock boundaries.

Verification passed on 2026-09-05:

```text
npm ci                                      PASS
npm run test                                PASS (9 tests)
npm run test -- --run src/domain/finance.test.ts PASS (8 tests)
npm run build                               PASS (TypeScript + Vite production build)
npm run lint                                PASS
```

This slice is pure arithmetic and has no persistence, authorization, offline
transport, or report integration surface yet. Those checks remain pending the
owning modules; see `docs/build/HANDOFFS/05-finance.md`.

## Module status

Status means implementation readiness and evidence, not document existence.

| ID  | Module                                    | Status                                                                              |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| M00 | Decision and specification control        | IN PROGRESS                                                                         |
| M01 | Platform/domain primitives                | VERIFIED (finance and authorization sub-slices; broader module remains conditional) |
| M02 | Identity/membership/sessions              | VERIFIED                                                                            |
| M03 | Roles/permissions/approvals               | VERIFIED                                                                            |
| M04 | Audit/integrity/corrections evidence      | BUILD-READY                                                                         |
| M05 | Catalogue/pricing/search                  | BUILD-READY                                                                         |
| M06 | Customers/suppliers/payment methods       | REQUIRES DECISION                                                                   |
| M07 | Sales/payments/credit/repayments/receipts | BUILD-READY                                                                         |
| M08 | Inventory/costing                         | BUILD-READY                                                                         |
| M09 | Purchasing/supplier liabilities/returns   | BUILD-READY                                                                         |
| M10 | Customer returns/refunds/corrections      | REQUIRES DECISION                                                                   |
| M11 | Business day/cash/reconciliation          | REQUIRES DECISION                                                                   |
| M12 | Incentives/management reporting           | BUILD-READY                                                                         |
| M13 | Offline sync/conflicts                    | REQUIRES DECISION                                                                   |
| M14 | Notifications/localization/operations     | REQUIRES DECISION                                                                   |
| M15 | V1 integration/acceptance                 | BLOCKED                                                                             |

## Locked integration invariants

- No completed business record is deleted or silently overwritten.
- Every business-owned record is tenant-scoped and authorization is enforced
  at the authoritative boundary.
- Retried events are idempotent; conflicts preserve evidence and surface
  review.
- Inventory is derived from accepted movements; negative stock is visible as
  an exception; weighted-average cost does not rewrite historical COGS.
- A transfer/payment is not successful until its required confirmation exists.
- Tax/VAT is first-class data through sale, correction, return, and reporting.
- Business sessions can cross midnight and retain cash discrepancies.
- Gross Profit is Net Recognized Selling Value minus COGS.

## Unresolved decisions

Open product decisions include H11 Q01–Q36, especially transaction
terminology, revenue timing, discount authority, tax mode, stock availability,
returned-stock condition, credit/write-off policy, custody/session/reopening,
offline authority, identity recovery, retention/RPO/RTO, multi-branch boundary,
integrations, and exception ownership. The minimum customer profile question
also remains open; Name + Phone is the corpus baseline.

For the finance slice specifically, tax registration/configuration, business
level inclusive/exclusive pricing, statutory reporting, event envelopes and
idempotency, provisional negative-stock COGS resolution, and authorization/
persistence boundaries remain delegated to the owning modules.

Exact API envelopes, event identifiers, sync ordering/conflict algorithms,
routes, tokens, breakpoints, infrastructure, backend/database, migration
tool, authentication provider, and PWA service-worker policy must be recorded
before their modules are verified.
