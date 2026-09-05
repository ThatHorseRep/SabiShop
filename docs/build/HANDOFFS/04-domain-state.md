# Handoff 04 — Domain Model & State Machines

**Module:** M03 canonical business domain and lifecycle rules  
**Status:** Domain contract established; persistence/API wiring is downstream

## Outcome

The domain boundary is now explicit. Consequential operations are commands
with named transitions, not generic CRUD. The executable kernel is in
`src/domain/stateMachines.ts` and its invariant/transition tests are in
`src/domain/stateMachines.test.ts`.

The model keeps these dimensions independent:

`business lifecycle | payment | authorization | synchronization | conflict`

An accepted local save is not server authority, a payment attempt is not a
successful payment, and a correction/return never deletes the source event.

## Canonical entities and ownership

| Entity                  | Authoritative facts                                                | Required data / invariants                                                                                                |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Business                | tenant identity and operating settings                             | `business_id`; all owned records are tenant-scoped; no cross-business access                                              |
| User / membership       | identity, role, active membership                                  | actor and membership are retained for consequential actions; UI visibility is not authority                               |
| Device / event identity | device identity and stable client operation identity               | device belongs to business and membership; one logical event has one accepted effect                                      |
| Product                 | SKU, name, unit, current catalog data                              | business-scoped identity; historical sale/purchase lines snapshot product meaning                                         |
| Inventory               | movement ledger and derived balance                                | every quantity change has a source movement; negative balance is visible exception; count is evidence, not overwrite      |
| Sale                    | draft/completion business event and current accepted version       | items, quantities, actual selling prices, salesperson, totals, payment components, timestamps, idempotency identity       |
| Sale item               | immutable historical line meaning                                  | SKU/product identity, quantity, unit price and line value are preserved; current catalog price cannot rewrite it          |
| Payment                 | attempted/confirmed settlement event                               | method, amount, reference, actor, target and confirmation evidence; pending/failed is never success                       |
| Customer                | current profile and credit eligibility controls                    | name and phone are minimum for credit; no wallet or general credit balance                                                |
| Credit/debt             | obligation derived from approved events                            | credit sale creates debt only on valid completion; repayments, returns and write-offs are separate traceable events       |
| Supplier                | management-owned supplier relationship                             | current profile edits do not rewrite historical purchase facts                                                            |
| Purchase/receipt        | physically received inventory and supplier liability               | supplier, SKU, quantity, unit, actual acquisition cost, date, payment/liability data; intent alone does not receive stock |
| Return                  | linked request, verification, approval, application and settlement | verified Sabi Shop purchase, exact returned lines/quantities, reason, condition, approval; original sale remains          |
| Correction              | subsequent accepted state or material corrective event             | mandatory reason, original/current state, actor, time, authorization and downstream effects; correction is not deletion   |
| Cash movement           | cash-in, cash-out and recorded cash settlement                     | amount, reason, actor, time; non-cash methods do not affect physical cash                                                 |
| Business day/session    | operational open/close session                                     | may cross midnight; actual cash is a physical count; closure requires management confirmation                             |
| Audit event             | append-only consequential evidence                                 | business, actor, operation, target, time, authorization, result and metadata                                              |
| Reporting event         | durable source facts consumed by projections                       | revenue, cash, inventory, receivable, payable, COGS and profit remain distinct                                            |

## State machines and legal commands

| Machine           | Legal transitions                                                                                                                               | Authority / required conditions                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Sale              | `DRAFT -> PENDING_COMPLETION -> COMPLETED`; pending may `-> FAILED`; completed can receive correction/return events                             | permitted salesperson/manager/owner; completion requires items, valid payment confirmation and required authorization                 |
| Payment           | `INITIATED -> PENDING -> CONFIRMED_SUCCESS`; initiated/pending may `-> FAILED`; confirmed may `-> REVERSED` only as exceptional supported event | payment actor/confirmation authority; external transfer/POS claim alone is insufficient                                               |
| Credit obligation | `NONE -> OUTSTANDING -> PARTIALLY_SETTLED -> SETTLED`; outstanding/partial may reduce by approved return or authorized write-off                | credit sale needs manager/owner authorization; repayment is a separate successful payment event                                       |
| Return            | `REQUESTED -> VERIFIED -> APPROVED -> APPLIED -> SETTLED`; requested/verified may `-> REJECTED`                                                 | purchase verification precedes approval; owner/manager approval; rejected return has no stock/debt/settlement effect                  |
| Correction        | `REQUESTED -> AUTHORIZATION_REVIEW -> APPROVED -> APPLIED`; request/review may `-> REJECTED`                                                    | minor permitted corrections follow configured authority; material/high-integrity changes require elevated authority; no self-approval |
| Reconciliation    | `OPEN_SESSION -> COUNT_RECORDED -> RECONCILIATION_PREPARED -> MANAGEMENT_CONFIRMED -> CLOSED`; closed `-> REOPENED -> CLOSED`                   | staff may prepare/count; manager/owner confirms and closes; reopening requires reason and audit                                       |
| Synchronization   | `LOCAL_ONLY -> PENDING_SYNC -> ACCEPTED`; pending may reject/conflict/fail/retry; conflict `-> RESOLVED`                                        | same stable operation identity on retry; causal order is preserved; material conflicts are reviewed                                   |
| Authorization     | `NOT_REQUIRED`, or `REQUESTED -> APPROVED/REJECTED`; approved `-> EXPIRED/INVALIDATED`                                                          | decision binds business, actor, operation, target and state; requester cannot approve own action                                      |

Illegal transitions return a stable domain error and produce no business
mutation. Examples include completing a failed or already completed sale,
applying an unverified return, treating pending payment as success, closing
without count/reconciliation/management confirmation, deleting accepted
history, and retrying an accepted sync operation as a new effect.

## Cross-domain invariants and side effects

- **Sale completion:** atomically records the accepted sale, payment
  components, sale inventory movements, cash-affecting components and (for
  credit) the obligation. Retries reuse the idempotency result.
- **Payment:** confirmation is explicit. Failed, rejected, pending or
  unconfirmed external payments do not settle a sale, debt or supplier
  liability. Reversal is exceptional and preserves the original success.
- **Inventory:** receipts, sales, customer/supplier returns, loss/damage,
  found stock and adjustments are movements with source links. Weighted
  average cost applies prospectively; later costs do not rewrite historical
  COGS. Negative stock is allowed operationally but flagged for investigation.
- **Debt:** customer balance is credit sales minus confirmed repayments,
  approved returns and authorized adjustments. Supplier liability is received
  purchases minus confirmed payments and accepted returns/adjustments. Debt is
  never cash and never silently edited.
- **Returns:** return effects are applied only after approval. Sellable
  returned goods re-enter sellable stock; non-sellable goods remain held.
  Settlement is separate from the return and is recorded only as stated
  successful settlement evidence.
- **Corrections:** ordinary minor corrections use the management-configured
  window (V1 default 15 minutes from sale completion). Material, payment,
  debt, inventory, attribution, protected identity and closed-day changes
  create a controlled corrective trail. Repeated corrections preserve every
  intervening state.
- **Cash:** `Expected Cash = confirmed opening cash + cash sales + cash in -
cash out - cash refunds recorded as paid from till`. Actual cash is observed
  at count time. Variance remains an investigation record and does not rewrite
  source sales, movements or cash events.
- **Reporting:** projections consume durable events. Revenue, cash,
  inventory, receivables, payables and profit are not interchangeable. Gross
  profit is net recognized selling value minus COGS.
- **Audit:** every consequential request records actor, membership, business,
  command, target, timestamp, authorization, result, reason where required,
  client event identity and synchronization context. Audit evidence is
  append-only.

## Retry, offline and failure contract

Every offline-capable consequential command carries a stable client-generated
operation identity. A timeout after server acceptance is reconciled with the
same identity, never retried as a new sale/payment/debt/movement. Interrupted
local work is recovered from durable local operation state.

Offline does not grant permission. Operations that cannot establish authority
remain pending/restricted. Reordered or competing material events are
preserved as conflicts for safe resolution or management escalation; there is
no destructive generic merge. Rejected corrections/returns and failed
payments remain auditable without changing accepted business state.

## Authorization boundary

The server/domain layer owns authorization. Baseline roles permit normal sales
to staff/manager/owner; returns and material correction approval require
management; official closure requires manager/owner; purchasing and supplier
relationship control is management-owned. Exact operation-level permission
IDs, thresholds, and Manager self-correction rules remain owned by the final
roles/permissions catalogue. Separation of duties is mandatory wherever
independent approval is required.

## Traceability and executable coverage

| Requirement                                    | Invariant / transition                      | Test                                       |
| ---------------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Unconfirmed payment cannot complete sale       | INV-PAY-001/002; sale completion gate       | confirmed-payment test                     |
| Duplicate retry has one effect                 | INV-SALE-002, INV-SYNC-003; sync acceptance | stable-id replay test (persistence layer)  |
| Return preserves sale                          | INV-RETURN-001; return verify/approve/apply | return transition test                     |
| Negative stock is visible, not fabricated away | INV-INV-001/002                             | movement validation test                   |
| Cash variance does not rewrite sources         | INV-CASH-001/003/004                        | expected-cash derivation test              |
| Manager cannot self-approve                    | INV-CORR-003                                | separation-of-duties test                  |
| Offline does not grant authority               | INV-SYNC-001/002                            | authorization integration test             |
| Historical COGS is stable                      | INV-INV-004; reporting event contract       | costing regression test (accounting layer) |

The current unit suite executes the transition legality, completion gate,
approval separation, movement evidence, cash derivation and synchronization
rules. Persistence, tenant/RLS, concurrency, weighted-average costing and
full audit-chain tests are downstream acceptance tests and must be added
before those modules are implementation-ready under H09.

## Slice validation

| Check                   | Result                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal workflow         | PASS: sale completion requires items, confirmed payment and required authority; return and reconciliation happy paths are covered                                         |
| Unauthorized use        | PASS: illegal transitions and manager self-approval are rejected without a business effect                                                                                |
| Saved data/history      | PASS by contract: append-only history, correction lineage, source-linked inventory movements and stable event identity are specified; persistence tests remain downstream |
| Offline/retry/failure   | PASS: sync queue/retry/acceptance, failed payment, and pending/unconfirmed completion behavior are covered                                                                |
| Reports/related modules | PASS by contract: cash derivation and separation of revenue, cash, debt, inventory and COGS are covered; reporting projection tests remain downstream                     |
| `npm test`              | PASS: 2 files, 9 tests                                                                                                                                                    |
| `npm run lint`          | PASS                                                                                                                                                                      |
| `npm run build`         | PASS: TypeScript and Vite production build                                                                                                                                |
| `npm run format:check`  | FAIL on pre-existing repository-wide formatting drift across unrelated baseline files; slice files were formatted individually                                            |
| `git diff --check`      | PASS                                                                                                                                                                      |

## Known limitations and unresolved decisions

This slice is a domain contract and pure state-machine kernel. It does not
introduce persistence, API routes, database migrations, UI workflows,
external payment integrations, report projections, or a sync conflict
algorithm. Exact schemas, permission IDs/thresholds, provider verification,
event-id format, conflict resolution, return/refund accounting, incentive
settlement, audit retention/hash-chain details and other deferred policy
questions remain owned by downstream modules and H11. No missing product rule
was invented here.

## Classified gaps (no policy invented)

The specifications intentionally defer: exact table/API schemas; exact
operation permission IDs and thresholds; payment-provider integration and
external verification; transaction/event ID format; synchronization ordering
algorithm and conflict resolver; return/refund settlement mechanics; supplier
refund/credit accounting; incentive release treatment; retention/hash-chain
implementation; customer optional fields; and financial treatment of
supplier credits. These are implementation or downstream policy ownership
items, not silently resolved by this handoff.

## Dependencies

This handoff consumes H01, H02, H03, H06, H07, H09, B02/B03/B04/B05/B06/B07/B08,
the foundation and tenancy handoffs, and the Product Bible. Downstream schema,
API, UI, reporting and QA work must preserve this contract and trace every
consequential command through authorization, failure, retry, audit, offline
and test behavior.
