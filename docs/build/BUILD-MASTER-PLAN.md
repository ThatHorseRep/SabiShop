# Sabi Shop Build Master Plan

**Authority:** This document controls implementation sequencing and handoffs. It
does not replace the Product Bible or domain specifications.

**Baseline date:** 2026-09-05  
**Overall status:** **NOT READY FOR PRODUCTION FEATURE IMPLEMENTATION**  
**Repository state:** Specification corpus present; no application implementation
or build/test harness is present in this checkout.

## 1. Authority and scope

Apply decisions in this order:

1. Locked decisions in `00-final-decision-register.md` and the reconciled
   Product Bible.
2. Business rules (`01`–`10`, `27`, `28`, `55`).
3. UX/design contracts (`11`–`22`, `29`).
4. Technical contracts (`24`–`26`, `31`–`49`, `H01`–`H10`).
5. Engineering/tooling defaults.

V1 includes business/user/role management, catalogue/search, POS and payments,
customer credit and repayments, supplier purchasing, inventory, pricing and
discounts, returns, corrections, cash/reconciliation, staff activity,
performance, receipts, offline/sync, audit/integrity, permissions,
notifications, and English/Pidgin content foundations. Barcode scanning,
branches/multiple locations, advanced CRM/accounting/analytics, broad
integrations, dedicated SMS/printing infrastructure, and enterprise features
remain V2 candidates.

No implementation may silently add policy where the corpus is silent. Open
product decisions must be surfaced as decisions, not inferred as defaults.

## 2. Release gates

### Gate A — Decision and contract readiness

- H11 decisions are either answered and propagated or explicitly isolated from
  the current build slice.
- Exact identifiers, money/quantity precision, API envelopes, sync protocol,
  retention, RPO/RTO, and sensitive-action re-authentication are documented.
- D-series contracts agree with B-series invariants.

### Gate B — Domain foundation

- Tenant/business context, identity, roles, authorization, audit, money, time,
  event identity, and migration conventions exist.
- Illegal state transitions and self-approval rules are executable.

### Gate C — Consequential workflows

- Sales/payments/credit, purchasing/inventory, returns/corrections, and cash
  reconciliation preserve history and have atomicity/idempotency boundaries.
- Derived reports reconcile to authoritative records.

### Gate D — Offline, security, and operations

- Local durability, retry, duplicate delivery, ordering, conflicts, revocation,
  backup/restore, observability, and recovery are tested.

### Gate E — V1 acceptance

- P0 scenario, failure, authorization, financial, accessibility, and UAT
  requirements pass; no unresolved P0 defects remain.

The current corpus passes none of these as implementation gates. It provides a
strong business-rule baseline but leaves technical decisions and user decisions
that must be closed before the affected slices become BUILD-READY.

## 3. Sequenced delivery roadmap

| Wave | Modules | Exit condition |
|---|---|---|
| 0. Resolve and baseline | M00, M01 | Decisions, glossary, IDs, money/time/tenant conventions, and test strategy are committed. |
| 1. Trust foundation | M02, M03, M04 | Identity, business isolation, authorization, audit, local event identity, and migrations are executable. |
| 2. Catalogue and parties | M05, M06 | Products, prices, customers, suppliers, and configurable payment methods have stable contracts. |
| 3. Core commerce | M07, M08 | Online/offline sales, payment confirmation, credit, repayment, receipts, and inventory effects pass P0 scenarios. |
| 4. Supply and exceptions | M09, M10 | Purchasing, weighted-average cost, supplier liabilities/returns, returns, corrections, and exception review preserve evidence. |
| 5. Cash and management | M11, M12 | Business-day sessions, cash custody, reconciliation, incentives, and reporting reconcile to source events. |
| 6. Delivery hardening | M13, M14 | Sync conflict handling, notifications, localization, backup/recovery, observability, and release controls pass failure tests. |
| 7. V1 acceptance | M15 | End-to-end, UAT, accessibility, performance, security, recovery, and release gates pass. |

## 4. Module contracts

Each module owns only the responsibilities stated here. A fresh agent must
receive the applicable module section plus the linked authoritative documents.

### M00 — Decision and specification control

- **Purpose/ownership:** Maintain decisions, terminology, traceability, scope,
  and handoff evidence. Owned by build control.
- **Dependencies:** Product Bible, final decision register, H01–H11.
- **Inputs/outputs:** Decisions and requirements in; versioned contracts,
  status, trace links, and handoff artifacts out.
- **Public interfaces:** Decision IDs, requirement IDs, module status, gate
  result, handoff template.
- **Invariants/transitions:** Locked decisions cannot be reinterpreted; open →
  decided → propagated; superseded history is never current authority.
- **Authorization/persistence:** Maintainer review; immutable decision history
  and traceability records.
- **Offline/reporting:** Not an end-user offline module; status affects release
  reporting and build gates.
- **Tests/limitations/forbidden:** Traceability and contradiction checks.
  Does not invent policy, implement domain behavior, or approve unverified work.

### M01 — Platform and shared domain primitives

- **Purpose/ownership:** Tenant context, IDs, money, quantity, time, errors,
  event metadata, migrations, and shared contracts. Platform team.
- **Dependencies:** M00; H01, H02, H04, H05, H06.
- **Inputs/outputs:** Validated primitives in; typed domain/API/storage
  primitives out.
- **Public interfaces:** Business ID, user/device/event ID, money/quantity
  types, error envelope, timestamps, migration API.
- **Invariants/transitions:** Exact arithmetic; business scope required;
  immutable event identity; explicit state transitions.
- **Authorization/persistence:** Every repository access is business-scoped;
  versioned migrations only.
- **Offline/reporting:** IDs and metadata support durable local writes and
  reproducible reports.
- **Tests/limitations/forbidden:** Precision, timezone, serialization,
  migration, and invalid-input tests. No feature policy or UI ownership.

### M02 — Identity, business membership, and sessions

- **Purpose/ownership:** Authentication, business switching, devices, sessions,
  revocation, and recovery. Identity/security team.
- **Dependencies:** M01, M03.
- **Inputs/outputs:** Credentials/session/device actions in; authenticated
  principal and active business context out.
- **Public interfaces:** Sign-in, sign-out, refresh/revoke, business switch,
  device/session list.
- **Invariants/transitions:** Unauthenticated → authenticated → revoked/expired;
  explicit business context; recovery never bypasses ownership.
- **Authorization/persistence:** Server-enforced identity and tenant checks;
  session/device/security events persisted.
- **Offline/reporting:** Minimized local identity cache; stale/revoked state is
  surfaced. Security reporting includes failures and revocations.
- **Tests/limitations/forbidden:** Session expiry, revocation, recovery,
  cross-business, and device-loss tests. No business-role policy or sales logic.

### M03 — Roles, permissions, and approvals

- **Purpose/ownership:** Owner/Manager/Staff authority, delegation, approval,
  separation of duty, and denial semantics. Authorization team.
- **Dependencies:** M01, M02, M04.
- **Inputs/outputs:** Principal, business, action, target, approval context in;
  allow/deny/pending decision out.
- **Public interfaces:** Permission evaluation, approval request/decision,
  policy configuration, authorization audit event.
- **Invariants/transitions:** Hidden UI never grants authority; consequential
  actions are explicit; Manager consequential self-corrections flag Owner.
- **Authorization/persistence:** This module is the authoritative policy
  boundary; decisions, reasons, and approvals are durable.
- **Offline/reporting:** Offline actions use the same rules and mark later
  verification; denial/approval and self-correction flags reportable.
- **Tests/limitations/forbidden:** Direct API, stale-role, self-approval,
  cross-business, and delegation tests. No authentication or UI-only checks.

### M04 — Audit, integrity, and correction evidence

- **Purpose/ownership:** Append-only audit, integrity metadata, tamper
  detection, evidence links, and historical correction records. Integrity team.
- **Dependencies:** M01–M03; all consequential modules.
- **Inputs/outputs:** State transitions and approvals in; immutable evidence,
  integrity alerts, and correction references out.
- **Public interfaces:** Record transition, verify integrity, query evidence,
  raise/resolve integrity issue.
- **Invariants/transitions:** Original evidence is never erased; alert →
  investigation → resolution; corrections create new evidence.
- **Authorization/persistence:** Protected append-only persistence; elevated
  operations require authorization and reason.
- **Offline/reporting:** Local evidence syncs idempotently; audit and integrity
  outcomes feed management reports.
- **Tests/limitations/forbidden:** Tamper, duplicate, correction, and chain
  verification tests. Does not decide business policy or rewrite source data.

### M05 — Catalogue, products, pricing, and search

- **Purpose/ownership:** Product/SKU identity, price/floor configuration,
  searchable catalogue, and stock visibility. Catalogue team.
- **Dependencies:** M01, M03, M04, M06.
- **Inputs/outputs:** Product and price commands in; sellable/searchable
  catalogue snapshots and price decisions out.
- **Public interfaces:** Product CRUD, search, price/floor policy, product
  history.
- **Invariants/transitions:** Product identity and historical price/cost
  snapshots remain traceable; future barcode support does not alter V1 SKU
  truth.
- **Authorization/persistence:** Management-controlled mutations; immutable
  historical references.
- **Offline/reporting:** Search and permitted reads work locally; price changes
  carry version/causal metadata and affect reporting only prospectively.
- **Tests/limitations/forbidden:** Search, pricing floor, stale-price,
  authorization, and historical snapshot tests. No inventory mutation or sale
  completion.

### M06 — Customers, suppliers, and payment methods

- **Purpose/ownership:** Party records, customer debt context, supplier
  identity, and configurable cash/non-cash payment catalogue. Parties/finance.
- **Dependencies:** M01, M03, M04, M05.
- **Inputs/outputs:** Party/payment configuration in; validated references and
  classification out.
- **Public interfaces:** Customer/supplier CRUD, search, payment-method
  classification, customer credit profile.
- **Invariants/transitions:** Name + phone is the corpus minimum, but Q11 remains
  pending; payment classification controls physical-cash expectation.
- **Authorization/persistence:** Business-scoped; sensitive identity changes
  are high-integrity and audited.
- **Offline/reporting:** Required local references are cached; changes reconcile
  without silently changing historical transactions.
- **Tests/limitations/forbidden:** Classification, party isolation, identity
  change, and historical reference tests. No debt arithmetic or payment success.

### M07 — Sales, payments, credit, repayments, and receipts

- **Purpose/ownership:** POS sale lifecycle and payment/debt events. Commerce
  team.
- **Dependencies:** M01–M06, M08, M04.
- **Inputs/outputs:** Sale/payment/credit/repayment commands in; authoritative
  transaction events, receipt status, and debt effects out.
- **Public interfaces:** Create/complete sale, confirm payment, credit sale,
  record repayment, receipt projection.
- **Invariants/transitions:** Draft → completed/cancelled; unconfirmed transfer
  is not successful; retries are idempotent; credit requires authority; no
  completed-sale deletion.
- **Authorization/persistence:** Command boundary evaluates business and role;
  sale, payment, debt link, and audit evidence persist atomically where defined.
- **Offline/reporting:** Normal sales and approved operations save locally;
  pending/conflict/rejected states are visible. Revenue, cash, debt, tax, and
  incentive inputs are traceable.
- **Tests/limitations/forbidden:** SALE, PAY, CREDIT, repayment, receipt,
  offline, duplicate, and failure matrix tests. No stock overwrite, cash
  reconciliation, or external money movement.

### M08 — Inventory and costing

- **Purpose/ownership:** Accepted inventory movements, balances, weighted-
  average cost, negative-stock exceptions, and stock investigation. Inventory.
- **Dependencies:** M01, M03, M04, M05, M07, M09.
- **Inputs/outputs:** Accepted sale/receipt/return/count movements in; derived
  balances, cost snapshots, and exceptions out.
- **Public interfaces:** Post movement, calculate balance/cost, investigate
  discrepancy, stock read model.
- **Invariants/transitions:** Event-derived quantity; no naïve overwrite;
  negative stock may occur only as visible exception; completed-sale COGS is
  stable.
- **Authorization/persistence:** Movement acceptance and corrections are
  server/domain authorized; source movements and cost snapshots persist.
- **Offline/reporting:** Concurrent offline movements converge without loss;
  stock health, COGS, and exceptions are reportable.
- **Tests/limitations/forbidden:** INV-001–004, costing, concurrency, count,
  and recovery tests. No supplier payable policy or price authorization.

### M09 — Purchasing, receiving, supplier liabilities, and returns

- **Purpose/ownership:** Receive accepted stock, supplier payments, payables,
  supplier returns, and supplier credit. Supply team.
- **Dependencies:** M01, M03, M04, M05, M06, M08.
- **Inputs/outputs:** Purchase/receipt/payment/return commands in; inventory
  movements, liability, payable reduction, or supplier credit out.
- **Public interfaces:** Receive purchase, record supplier payment, return
  goods, view liability/credit.
- **Invariants/transitions:** Stock rises only on accepted receipt; unpaid return
  reduces payable; paid return creates supplier credit/receivable; replacement
  is separate.
- **Authorization/persistence:** Management-controlled receiving/returns;
  immutable purchase and return evidence.
- **Offline/reporting:** Permitted receiving can be local and later verified;
  supplier liability and inventory reports remain linked.
- **Tests/limitations/forbidden:** PUR and SUP scenarios, partial receipt,
  payment, return, cost, and offline tests. No customer return or cash refund.

### M10 — Customer returns, refunds, and corrections

- **Purpose/ownership:** Verified returns, refund settlement states, voids, and
  ordinary/high-integrity corrections. Exceptions team.
- **Dependencies:** M03, M04, M07, M08, M11, M12.
- **Inputs/outputs:** Request/approval/correction commands in; additive return,
  refund, reversal, or correction evidence out.
- **Public interfaces:** Request/approve return, settle refund, request/perform
  correction, exception queue.
- **Invariants/transitions:** Original sale preserved; partial return supported;
  correction window configurable (15-minute default); later/high-integrity
  changes require appropriate control; external money is not executed here.
- **Authorization/persistence:** Management approval and separation of duty;
  reasons, actor, severity, and approvals persist.
- **Offline/reporting:** Offline requests are marked pending verification;
  returns/corrections recalculate stock, debt, tax, profit, and incentive views.
- **Tests/limitations/forbidden:** RET/COR scenarios, boundary times,
  self-correction, failed settlement, and later-activity tests. No silent
  cancellation or direct historical edit.

### M11 — Business day, cash custody, and reconciliation

- **Purpose/ownership:** Operational sessions, shared/individual custody, cash
  movements, expected cash, physical actual cash, and discrepancy review.
- **Dependencies:** M01, M03, M04, M07, M09, M10.
- **Inputs/outputs:** Session/cash movement/count commands in; expected vs
  actual reconciliation and exceptions out.
- **Public interfaces:** Open/close/reopen session, record cash in/out, count,
  reconcile, investigate discrepancy.
- **Invariants/transitions:** Session may cross midnight; Expected Cash is
  calculated, Actual Cash is physical count; discrepancy remains visible;
  custody mode is configurable.
- **Authorization/persistence:** Cash actions and reopening are role/approval
  controlled; movements, counts, and reconciliation evidence persist.
- **Offline/reporting:** Approved cash work is durable locally with visible
  sync state; cash reports distinguish cash, non-cash, and performance.
- **Tests/limitations/forbidden:** CASH and DAY scenarios, interruption,
  custody, mismatch, midnight, and recovery tests. No routine dashboard Actual
  Cash or accounting integration.

### M12 — Incentives and management reporting

- **Purpose/ownership:** Salesperson performance, dual-gate incentive policy,
  and explainable operational/financial read models. Reporting/finance.
- **Dependencies:** M04, M07–M11.
- **Inputs/outputs:** Authoritative events and configured policies in; derived
  performance, stock-health, profit, debt, cash, and incentive views out.
- **Public interfaces:** Report queries, incentive policy/configuration,
  eligibility calculation, release decision.
- **Invariants/transitions:** Gross Profit = Net Recognized Selling Value − COGS;
  value and minimum-sales-volume gates both pass before release; returns and
  corrections recalculate before payout.
- **Authorization/persistence:** Management policy changes audited; reports
  never become source truth.
- **Offline/reporting:** Cached read models identify freshness; every material
  metric drills to source records.
- **Tests/limitations/forbidden:** Financial, incentive, historical-cost,
  performance, and reconciliation tests. No mutation of source events.

### M13 — Offline synchronization and conflict resolution

- **Purpose/ownership:** Local durability, event upload, retry, ordering,
  duplicate prevention, conflict preservation, and management resolution.
- **Dependencies:** M01–M12; H06, H07.
- **Inputs/outputs:** Local events and server acknowledgements in; accepted,
  pending, retry, conflict, rejected, or superseded state out.
- **Public interfaces:** Sync batch, event status, retry, conflict queue,
  resolution command.
- **Invariants/transitions:** local → pending → synchronized/retry/conflict/
  rejected; duplicate submission yields one event; server time/causality
  governs financial truth; no silent overwrite.
- **Authorization/persistence:** Server rechecks authority; local queue and
  authoritative event log are durable.
- **Offline/reporting:** Core operations remain usable offline; all uncertain
  states are visible and operationally reportable.
- **Tests/limitations/forbidden:** SYNC scenarios, reconnect, duplicate,
  concurrency, stale permission, device loss, and partial batch tests. No
  automatic policy invention for unresolved conflicts.

### M14 — Notifications, localization, observability, and operations

- **Purpose/ownership:** English/Pidgin content, consequential messaging,
  alerts, telemetry, backups, restore, deployment, and incident controls.
- **Dependencies:** M01–M13; `33`, `38`, `39`, `45`, `46`, `49`.
- **Inputs/outputs:** Domain/security/sync events in; localized user messages,
  operational alerts, backups, metrics, and release evidence out.
- **Public interfaces:** Notification delivery, translation keys, health/metrics,
  backup/restore, release checklist.
- **Invariants/transitions:** User-facing status distinguishes local/synced/
  pending/conflict/failed; secrets never enter client source/logs; backup
  restore preserves evidence.
- **Authorization/persistence:** Operational access is restricted; audit,
  backup, and incident records retained per approved policy.
- **Offline/reporting:** Queue safe notifications; telemetry tolerates offline
  buffering; reports expose freshness and system health.
- **Tests/limitations/forbidden:** Localization, accessibility, alert, backup/
  restore, migration, monitoring, and incident tests. No business-state
  mutation outside authorized domain commands.

### M15 — V1 integration and acceptance

- **Purpose/ownership:** Prove the assembled product meets acceptance, QA,
  scenario, failure, security, accessibility, performance, and UAT bars.
- **Dependencies:** M00–M14.
- **Inputs/outputs:** Built release candidate and evidence in; release decision,
  known limitations, and handoff out.
- **Public interfaces:** CI gates, test reports, release checklist, UAT signoff.
- **Invariants/transitions:** candidate → accepted/rejected/conditional; no
  unresolved P0 defects; failed evidence blocks “verified.”
- **Authorization/persistence:** Release approval and test evidence retained.
- **Offline/reporting:** Includes full offline/conflict/recovery matrix and
  report traceability.
- **Tests/limitations/forbidden:** All P0 scenarios and mandatory regression
  domains. Does not waive requirements because screens compile.

## 5. Mandatory handoff artifact

Every completed module conversation must add or update a concise handoff under
`docs/build/handoffs/` containing: module ID and status; scope and forbidden
responsibilities; implemented public interfaces; schema/migration changes;
state transitions and invariants; authorization behavior; offline/sync behavior;
reporting effects; tests run with results; known limitations/open decisions;
downstream consumers; and exact next integration step. A module cannot become
VERIFIED without this artifact and evidence from the applicable acceptance and
failure tests.

