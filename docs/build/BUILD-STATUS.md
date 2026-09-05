# Sabi Shop Build Status

**As of:** 2026-09-05  
**Overall:** **NOT READY** — the database/tenant foundation slice is implemented,
but executable PostgreSQL verification and the wider pre-build gate remain
pending.

## Current repository assessment

| Area | Status | Evidence |
|---|---|---|
| Product vision and V1 boundary | BUILD-READY | `01-product-vision.md`, `50-mvp-scope.md` |
| Locked business decisions | BUILD-READY | `00-final-decision-register.md`, Product Bible reconciliation |
| Business invariants and state rules | BUILD-READY | `03`–`10`, `27`, `28`, `55`, H01–H02 |
| UX/design direction | BUILD-READY with implementation decisions pending | `11`–`22`, `29`; exact routes/tokens remain delegated |
| Data/API technical contract | REQUIRES DECISION | `24`–`26`, `43`–`44` are working/consolidation specifications |
| Identity/recovery/device policy | REQUIRES DECISION | `36` and H11 Q25–Q27 |
| Offline authorization/conflict policy | REQUIRES DECISION | `34`, H06, H11 Q22–Q24 |
| Backup RPO/RTO/retention | REQUIRES DECISION | `33`, H11 Q28–Q31 |
| Application implementation | IN PROGRESS | Database/tenant foundation exists; feature modules are not implemented |
| Verification evidence | PARTIAL | Static validation completed; PostgreSQL/pgTAP execution is pending |

## Module status

Status means implementation readiness and evidence, not document existence.

| ID | Module | Status | Blocking reason / next evidence |
|---|---|---|---|
| M00 | Decision and specification control | IN PROGRESS | Create traceable decision propagation and handoff workflow. |
| M01 | Platform/domain primitives | CONDITIONAL | PostgreSQL foundation migration and tenant constraints implemented; exact UUID policy, precision, error envelope, and database execution evidence remain pending. |
| M02 | Identity/membership/sessions | REQUIRES DECISION | Resolve authentication, recovery, session/device policy. |
| M03 | Roles/permissions/approvals | BUILD-READY | Implement server-side matrix, then direct-call and self-approval tests. |
| M04 | Audit/integrity/corrections evidence | BUILD-READY | Implement append-only evidence and tamper checks; prove with integrity tests. |
| M05 | Catalogue/pricing/search | BUILD-READY | Implement SKU/price contracts; validate authorization and historical snapshots. |
| M06 | Customers/suppliers/payment methods | REQUIRES DECISION | Q11 customer profile minimum still pending; finalize payment config contract. |
| M07 | Sales/payments/credit/repayments/receipts | BUILD-READY | Depends on M01/M02 contract; prove P0 sale/payment/credit scenarios. |
| M08 | Inventory/costing | BUILD-READY | Prove weighted-average, stable historical COGS, concurrency, negative-stock exception. |
| M09 | Purchasing/supplier liabilities/returns | BUILD-READY | Prove unpaid vs paid supplier-return accounting and receipt acceptance. |
| M10 | Customer returns/refunds/corrections | REQUIRES DECISION | Q02 terminology and Q17 refund-due behavior remain unresolved. |
| M11 | Business day/cash/reconciliation | REQUIRES DECISION | Q16 custody change timing and Q20/Q21 session behavior need closure. |
| M12 | Incentives/management reporting | BUILD-READY | Prove both gates, recalculation, Gross Profit, stock-health visibility. |
| M13 | Offline sync/conflicts | REQUIRES DECISION | Exact event protocol and H11 Q22–Q24 authority/revocation policy pending. |
| M14 | Notifications/localization/operations | REQUIRES DECISION | RPO/RTO/retention and delivery/observability implementation choices pending. |
| M15 | V1 integration/acceptance | BLOCKED | Cannot start verification before implementation and upstream contracts exist. |

## Locked integration invariants

These are release-blocking and may not be weakened by implementation:

- No completed business record is deleted or silently overwritten.
- Every business-owned record is tenant-scoped; authorization is enforced at the
  authoritative boundary, not only in the UI.
- Retried events are idempotent; conflicts preserve evidence and surface review.
- Inventory is derived from accepted movements; negative stock is visible as an
  exception; weighted-average cost does not rewrite historical COGS.
- A transfer/payment is not successful until its required confirmation exists.
- Unpaid supplier returns reduce payable; paid supplier returns create supplier
  credit/receivable; replacement is separate.
- Tax/VAT is first-class data through sale, correction, return, and reporting.
- Business sessions can cross midnight; cash reports distinguish Expected Cash
  from physical Actual Cash and retain discrepancies.
- Gross Profit is Net Recognized Selling Value minus COGS.
- Incentive release requires both configured value and completed-sales-volume
  gates, with return/correction recalculation.

## Open decisions requiring product authority

The following are not to be guessed by an implementation agent:

- H11 Q01–Q36, especially transaction terminology, revenue timing, discount
  authority, tax mode, stock availability, SKU/units, returned-stock condition,
  credit/write-off policy, custody/session/reopening, offline authority,
  identity recovery, retention/RPO/RTO, multi-branch boundary, integrations,
  and exception ownership.
- The final decision register explicitly calls out the minimum customer profile
  question: Name + Phone is the corpus baseline; Address and Photo are optional
  downstream, but Q11 remains pending.
- Exact API envelopes, event identifiers, sync ordering/conflict algorithm,
  routes, tokens, breakpoints, and infrastructure are implementation decisions,
  but must be recorded before their modules are VERIFIED.

## Verification policy

“Compiles” or “screen exists” never advances a module to VERIFIED. The evidence
must include applicable normal behavior, authorization, persistence, state
transitions, failure behavior, offline/sync behavior, reporting consequences,
and tests from `51-qa-test-plan.md`, `52-scenario-matrix.md`, and
`49-failure-testing.md`. Every release candidate must also cover the 15
mandatory V1 regression domains listed in the QA plan.
