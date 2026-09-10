# Handoff 28 — Failure Injection and Reliability Verification

**Status:** VERIFIED FAILURE-INJECTION SUITE; production durability gates remain downstream

**Verified:** 2026-09-10
**Module:** Cross-cutting failure injection over M06–M13 domain engines, authorization, offline synchronization, local recovery, and reporting

## Outcome

`src/domain/failureTesting.test.ts` adds an adversarial suite that deliberately
tries to make Sabi Shop lie, duplicate a business effect, lose history, or
produce contradictory money/stock/debt/report state. The suite attacks the
composed domain graph together with the offline synchronization boundary:

- network loss before server acceptance;
- partial synchronization batch failure;
- timeout after the server has accepted and applied an operation;
- duplicate delivery, including two deliveries in flight at the same time;
- app restart and reconstruction from durable local state;
- stale authorization after a role or user change;
- reordered causal delivery;
- simultaneous inventory sales and a stale expected-version edit;
- duplicate and over-limit debt repayment;
- conflicting credit-sale corrections and reversals;
- impossible corrected quantity/payment values;
- corrupt main local state with a valid write-ahead record;
- authoritative reporting after every accepted or refused effect.

The suite is intentionally written through public engine and synchronization
boundaries. It does not mutate private engine state or “fix up” projections.

## Reliability contract

Every consequential operation must preserve all of the following, including
when a request is lost, delayed, replayed, reordered, or made concurrently with
another request:

1. a stable, globally unique operation identity and deterministic payload
   fingerprint;
2. durable local evidence before server synchronization is claimed;
3. one accepted business effect per logical operation;
4. server-side authorization and tenant revalidation;
5. causal ordering or an explicit conflict;
6. append-only domain and audit history;
7. reporting derived only from authoritative accepted events;
8. visible uncertainty instead of a fabricated successful outcome.

The current reference adapters prove these contracts in memory and in browser
`localStorage`. The production database/API adapter must still make
idempotency, causal state, domain effects, audit evidence, and server sequence
atomic in one durable transaction.

## Defects found and fixed

### 1. A rejected credit-sale correction could leave an inventory effect

**Attack:** fully repay a credit sale, then attempt to reduce its quantity so
the corrected credit obligation would fall below the amount already repaid.

**Defect:** `ReturnsCorrectionsEngine.correctSale` applied the inventory
adjustment before asking the credit engine to correct the debt. The credit
engine correctly rejected the impossible correction, but stock had already
changed. The result was an authoritative inventory effect with no correction,
credit, audit, or reporting effect.

**Fix:** the credit engine now exposes read-only correction validation. A
credit-sale correction is validated before any inventory or report effect is
created.

**Executable proof:** F8 — “a rejected credit-sale correction leaves no partial
inventory effect.”

### 2. Credit corrections and reversals could omit debt lineage

**Attack:** change or reverse a credit sale without supplying the customer and
debt identifiers that identify the obligation to adjust.

**Defect:** a quantity correction could change sale, stock, and reporting
totals while the customer debt remained unchanged. A reversal could reverse
sale and stock effects while the debt remained outstanding. Both produced
contradictory money/debt state.

**Fix:** a credit-amount correction and a credit-sale reversal now require
customer/debt lineage and validate the credit effect before changing any other
domain. The exceptions composition adapter now passes its known credit link to
the domain engine.

**Executable proof:** F9 — “credit corrections and reversals require debt
lineage before any effect,” plus the exceptions workspace reversal regression.

### 3. Impossible corrected quantities and payments were accepted

**Attack:** submit a correction with quantity zero or a negative payment
amount.

**Defect:** corrected quantity and payment values were not held to the same
positive-integer rules as the original sale. A zero-quantity correction could
add stock back; a negative payment could produce negative financial totals.

**Fix:** corrected quantities and payment amounts must be positive integers;
every explicitly corrected payment amount is checked before an effect is
created.

**Executable proof:** F10 — “impossible corrected quantities and payments fail
before any effect.”

### 4. A valid WAL could not recover corrupt main local state

**Attack:** corrupt the main local synchronization record while leaving the
last valid write-ahead record intact.

**Defect:** `LocalStorageStore.load` parsed the corrupt main record first and
threw before considering the valid WAL, so recoverable local work was lost.

**Fix:** load now preserves corrupt main evidence but recovers from a valid
WAL when one exists. If no valid recovery source exists, it fails closed rather
than replacing evidence with an empty queue.

**Executable proof:** F11 — “a valid write-ahead record recovers when the main
local state is corrupt.”

### 5. Concurrent duplicate delivery could apply twice

**Attack:** deliver the same operation identity and fingerprint twice while
the reference server is awaiting an asynchronous authorization or apply
callback.

**Defect:** both requests could pass the “no stored response yet” check and
both invoke the application callback, creating two sales, two inventory
movements, and two server sequences.

**Fix:** the reference server now joins concurrent deliveries to one in-flight
processing promise. Later duplicate delivery returns the persisted accepted or
rejected result. A changed fingerprint remains an integrity conflict.

**Executable proof:** F12 — “concurrent duplicate delivery applies one business
effect.”

### 6. Stale offline authority had no review disposition

**Attack:** create an offline operation, revoke the actor’s authority, then
synchronize the original event.

**Defect:** the server correctly denied execution, but the local operation
only became terminal `REJECTED`. That prevented execution but did not provide
the management-review disposition required for a consequential operation whose
authority changed while offline.

**Fix:** authorization denial now keeps server acceptance as `rejected`, marks
the local synchronization state as `CONFLICT`, and escalates code
`authorization_denied_offline` to management review. The operation cannot retry
into acceptance; a separate reviewer must resolve or supersede it.

**Executable proof:** F4 and the stale-authority regression in
`src/sync/offlineSync.test.ts`.

## Prompt-book blocker triage (2026-09-10)

The remaining blockers were checked against
`Sabi_Shop_Copilot_Conversation_Prompt_Pack.md` and
`docs/build/BUILD-MASTER-PLAN.md`.

| Remaining blocker                       | Prompt-book owner                                                                                     | Sequence decision                                                                                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Durable transaction/outbox runtime      | Conversation 02 / M02 owns the persistence contract; Conversation 35 / M15 owns final execution proof | The past database contract gap is fixed now with migration 003. Runtime adapter execution remains future M15 work.                                                     |
| Production API/auth/device revocation   | Conversation 03 / M03 owns the seam; Conversation 31 and 35 audit it                                  | The authorization seam is already past work, but the production provider/API connection belongs to future M15 integration and security readiness. Leave until then.    |
| Backup/restore and incident recovery    | Conversation 35 / M14–M15                                                                             | Future module. Leave until then.                                                                                                                                       |
| Stale offline permission disposition    | No later module owns the product decision                                                             | Fixed now with a fail-closed default: server denial blocks execution and escalates the local operation to management review. Formal H11 Q24 sign-off remains recorded. |
| Durable payload-fingerprint enforcement | Conversation 02 / M02 owns schema; Conversation 33 audits replay                                      | The past schema gap is fixed now in migration 003. Connecting the runtime API to that schema remains future M15 work.                                                  |
| Domain-specific conflict review queues  | Conversation 14 / M13 owns the reference; M14–M15 own operations and acceptance                       | Future integration work. Leave until then.                                                                                                                             |

No future module was pulled forward. Only the past database-contract gap and
the unowned stale-authority safety gap were changed.

## Failure-injection expectations

### FT-01 — Network loss before server acceptance

- **Durable evidence:** local operation envelope, stable operation ID, payload
  fingerprint, `localRecordedAt`, and failed transport attempt count.
- **Authoritative state:** no server business effect; server has no accepted
  result for the operation.
- **Retry:** retry the same operation ID and fingerprint with bounded automatic
  backoff plus observable operator retry; never mint a new ID merely because a
  response was missing.
- **User-visible state:** “saved locally / sync failed or pending”; independent
  local work remains usable.
- **Audit event:** transport failure and later recovery evidence; no business
  success audit is manufactured.
- **Reporting state:** excluded until the authoritative server accepts; after
  recovery the effect appears exactly once.
- **Escalation:** operator attention after bounded retries; management only if
  the outage or queue becomes material.
- **Executable proof:** F1.

### FT-02 — Backend/database unavailable before commit

- **Durable evidence:** local envelope and failed transport/database attempt;
  production operational log with request identity and failure reason.
- **Authoritative state:** no partial business effect; any open database
  transaction rolls back.
- **Retry:** same operation ID after service recovery; idempotency must answer
  a previously committed result if the failure occurred after commit.
- **User-visible state:** failed/pending synchronization, not success.
- **Audit event:** infrastructure failure and recovery evidence; no domain
  success unless the authoritative transaction committed.
- **Reporting state:** unchanged until authoritative acceptance.
- **Escalation:** operations/Owner alert for backend unavailability.
- **Executable proof:** F1 models the pre-commit failure. A real database
  failure cannot be claimed until the durable adapter exists.

### FT-03 — Timeout after server acceptance

- **Durable evidence:** server idempotency record, original response, server
  sequence, and the client’s transient `FAILED` state before reconciliation.
- **Authoritative state:** exactly one sale/payment/inventory/report effect.
- **Retry:** replay the same operation ID; the server returns the original
  response and does not invoke the domain callback again.
- **User-visible state:** initially “outcome uncertain / retry required,” then
  “synchronized” after the replay.
- **Audit event:** one accepted domain event; synchronization recovery evidence
  links the retry to the same operation.
- **Reporting state:** one effect, one source event, one traceable server
  sequence.
- **Escalation:** only if the server and client cannot reconcile the same
  operation identity.
- **Executable proof:** F2.

### FT-04 — Duplicate retry, payment, or event

- **Durable evidence:** operation ID plus deterministic fingerprint on the
  client and server; domain client request/event ID; persisted idempotency
  result.
- **Authoritative state:** one accepted business effect.
- **Retry:** identical retry returns the original result. A different payload
  under the same ID is an integrity conflict. A new ID is a new logical
  operation, never a silent retry.
- **User-visible state:** repeated submit/tap shows the same completed record
  or receipt state; it must not create a second basket effect.
- **Audit event:** one consequential domain audit event; duplicate delivery is
  reconciled, not recorded as a second business action.
- **Reporting state:** one sale/payment/stock/debt effect.
- **Escalation:** identity reuse with changed content escalates as an integrity
  conflict for management/integrity review.
- **Executable proof:** F3 and F12; Handoff 14 also covers changed-content
  identity reuse.

### FT-05 — App kill after local write

- **Durable evidence:** durable local record or WAL, stable operation ID,
  device ID, actor ID, business ID, and local persistence state.
- **Authoritative state:** no server effect until synchronization; local state
  is not automatically authoritative.
- **Retry:** reconstruct the queue from durable storage and reuse the same
  identity; never recreate the operation from UI state alone.
- **User-visible state:** “saved locally / pending sync” after restart.
- **Audit event:** local durability/recovery evidence; authoritative domain
  audit only after server acceptance.
- **Reporting state:** authoritative reporting unchanged until synchronization;
  local views must label local/pending state.
- **Escalation:** corruption or an unrecoverable WAL escalates to
  management/integrity review.
- **Executable proof:** F3 and the interrupted-WAL regression in Handoff 14.

### FT-06 — Device restart or replacement

- **Durable evidence:** stable operation and device identities; server device
  /session records in the production adapter.
- **Authoritative state:** accepted server records survive device loss;
  pending local work is recovered only from durable local evidence.
- **Retry:** a replacement device must not fabricate missing events; it
  synchronizes from authoritative records and documented recovery state.
- **User-visible state:** pending queue and synchronization state are visible;
  lost-device recovery is explicit.
- **Audit event:** device/session recovery or revocation evidence.
- **Reporting state:** derived from authoritative records, not one phone’s
  mutable UI state.
- **Escalation:** device loss requires management/Owner security action and
  access revocation.
- **Executable proof:** F3 proves restart identity stability. Device revocation
  and replacement recovery remain downstream auth-adapter work.

### FT-07 — Stale client and reordered causal events

- **Durable evidence:** dependency IDs, server sequences, missing-dependency
  conflict, and eventual recovery linkage.
- **Authoritative state:** a dependent effect is not accepted before its
  causal parent. Parent and child both appear only after valid ordering.
- **Retry:** retry the same child operation after its dependency is accepted;
  causal cycles remain conflicts and are never assigned an invented order.
- **User-visible state:** “sync conflict / dependency missing,” then
  “synchronized” after recovery.
- **Audit event:** conflict detection and resolution/recovery evidence.
- **Reporting state:** child effect is excluded until accepted.
- **Escalation:** unresolved causal cycles or competing material events go to
  management review.
- **Executable proof:** F5; Handoff 14 also covers stale-client dependency
  recovery and causal cycles.

### FT-08 — Partial synchronization batch

- **Durable evidence:** independent per-operation sync state, error, server
  acceptance, and server sequence.
- **Authoritative state:** only operations individually acknowledged by the
  authoritative server are accepted.
- **Retry:** retry only failed/pending work; already synchronized operations
  are not replayed as new logical events.
- **User-visible state:** the queue can show one synchronized and one failed
  operation without blocking unrelated local work.
- **Audit event:** accepted subset has domain audit evidence; failed subset has
  transport/recovery evidence.
- **Reporting state:** includes the accepted subset exactly once.
- **Escalation:** bounded retry exhaustion or a material queue requires
  operator/management attention.
- **Executable proof:** F1 and the partial-batch regression in Handoff 14.

### FT-09 — Simultaneous inventory sales

- **Durable evidence:** two distinct operation IDs and two append-only inventory
  movement events with actors and sale references.
- **Authoritative state:** stock is the sum of accepted movements. Selling below
  recorded stock may produce negative stock, but it remains an explicit
  exception; it is not silently overwritten.
- **Retry:** each logical sale retries under its own stable ID; neither sale is
  discarded to make stock look tidy.
- **User-visible state:** current stock plus a visible negative-stock
  investigation state.
- **Audit event:** both sale completion events and inventory lineage.
- **Reporting state:** both sales are reported and `negativeStockProductIds`
  identifies the exception.
- **Escalation:** negative stock requires management investigation and
  reconciliation.
- **Executable proof:** F6.

### FT-10 — Conflicting inventory expected-version edit

- **Durable evidence:** expected inventory version, current version, rejected
  command identity, and unchanged movement ledger.
- **Authoritative state:** the stale edit has no inventory effect.
- **Retry:** re-read current stock/version and submit a complete replacement
  command with its own stable identity; do not blind-retry a stale version.
- **User-visible state:** “stock changed; review and try again”; nothing is
  saved from the rejected edit.
- **Audit event:** concurrent-change rejection/authorization evidence without a
  domain effect.
- **Reporting state:** unchanged until a fresh accepted movement.
- **Escalation:** repeated conflicts or a physical-count variance go to
  management review.
- **Executable proof:** F6.

### FT-11 — Conflicting debt changes

- **Durable evidence:** accepted repayment event, allocation, payment
  components, client event ID, actor, and resulting outstanding amount.
- **Authoritative state:** duplicate repayment returns the original event; an
  over-repayment is refused with no event and outstanding debt is unchanged.
- **Retry:** an identical repayment retry is idempotent. An over-allocation is
  not retryable as-is; it requires an authorized correction or valid
  allocation.
- **User-visible state:** successful repayment or an explicit “allocation
  exceeds outstanding” failure.
- **Audit event:** accepted repayment history; rejected attempt evidence at the
  authorization/service boundary.
- **Reporting state:** outstanding debt is derived from accepted obligations,
  repayments, returns, write-offs, and authorized corrections.
- **Escalation:** contradictory debt evidence or disputed balances require
  management review.
- **Executable proof:** F7.

### FT-12 — Authorization changed while offline

- **Durable evidence:** local operation plus server-side authorization denial
  with actor, business, operation ID, and reason.
- **Authoritative state:** no authoritative sale/payment/inventory/report
  effect.
- **Retry:** replaying the same operation ID receives the same denial; a new ID
  cannot be used to bypass revocation.
- **User-visible state:** the local record is marked as a conflict requiring
  management review; server acceptance remains `rejected`, and it must not be
  presented as a successful synchronized sale.
- **Audit event:** `authorization.denied` at the authoritative boundary; local
  evidence remains inspectable.
- **Reporting state:** unchanged.
- **Escalation:** the operation is escalated to `management_review` with code
  `authorization_denied_offline`. It cannot execute or retry into acceptance;
  a reviewer must resolve or supersede it. This is the implemented fail-closed
  default while formal H11 Q24 sign-off remains recorded.
- **Executable proof:** F4 and the authorization tests in Handoffs 14 and 27.

### FT-13 — Conflicting credit-sale correction

- **Durable evidence:** original sale snapshot, repayment history, correction
  request, validation failure, and unchanged stock/debt/report/audit counts.
- **Authoritative state:** no partial correction; stock, debt, sale, report,
  and audit state remain exactly as before the refused correction.
- **Retry:** only a correction that respects already accepted repayments,
  returns, and write-offs may be submitted. Identical retry is idempotent;
  changed content requires a new logical operation and conflict-safe handling.
- **User-visible state:** “correction did not complete; nothing was saved.”
- **Audit event:** failed/denied correction evidence; no applied-correction
  audit is created.
- **Reporting state:** original accepted totals only.
- **Escalation:** accepted material corrections require management authority
  and, where applicable, Owner review; rejected attempts remain visible for
  investigation.
- **Executable proof:** F8.

### FT-14 — Correction or reversal missing debt lineage

- **Durable evidence:** rejection reason and unchanged before/after effect
  counts for inventory, sale, correction, credit, and audit state.
- **Authoritative state:** no sale, stock, debt, correction, or report change.
- **Retry:** submit a complete new correction/reversal with customer and debt
  identifiers; do not mutate the rejected envelope in place.
- **User-visible state:** explicit validation error; no partial reversal or
  correction is shown as successful.
- **Audit event:** denied/failed consequential-operation evidence.
- **Reporting state:** unchanged.
- **Escalation:** repeated missing-lineage attempts are an integrity concern.
- **Executable proof:** F9 and the exceptions workspace regression.

### FT-15 — Impossible corrected quantity or payment

- **Durable evidence:** validation failure and unchanged authoritative effect
  counts.
- **Authoritative state:** no negative/zero quantity correction and no negative
  payment amount.
- **Retry:** submit a valid positive integer quantity/payment with the
  required authority and reason.
- **User-visible state:** invalid correction is refused before save.
- **Audit event:** validation/authorization rejection; no applied correction.
- **Reporting state:** unchanged.
- **Escalation:** repeated malformed input is treated as possible tampering.
- **Executable proof:** F10.

### FT-16 — Corrupt main local state with valid WAL

- **Durable evidence:** preserved raw corrupt main record in `.corrupt`,
  valid WAL, recovery timestamp, and recovered operation identity.
- **Authoritative state:** local queue is recovered; no server effect is
  claimed until synchronization.
- **Retry:** the recovered operation keeps its original ID and fingerprint.
- **User-visible state:** local queue recovers to pending/synchronization
  states; corruption evidence remains available.
- **Audit event:** local recovery/integrity evidence.
- **Reporting state:** unchanged until authoritative acceptance.
- **Escalation:** corruption is surfaced to management/integrity review even
  when the WAL recovers the queue.
- **Executable proof:** F11.

### FT-17 — Corrupt local state with no valid recovery source

- **Durable evidence:** preserved raw corrupt record and explicit
  `corrupt_local_state` error.
- **Authoritative state:** unaffected; the system must not replace the queue
  with empty state and pretend nothing happened.
- **Retry:** recovery requires documented restore/human reconciliation; missing
  business events must not be fabricated.
- **User-visible state:** integrity failure/“requires review”; affected local
  operations fail closed.
- **Audit event:** integrity alert and recovery action.
- **Reporting state:** authoritative reporting remains derived from accepted
  server records.
- **Escalation:** management/integrity review and, for broad corruption,
  Owner/operations recovery.
- **Executable proof:** Handoff 14’s corrupt-local-state and non-JSON payload
  regressions.

### FT-18 — Database failure after a partial domain write

- **Durable evidence:** transaction/outbox log, operation ID, partial-write
  diagnosis, rollback/commit decision, and recovery action.
- **Authoritative state:** either the complete cross-domain effect commits once,
  or no business effect is visible. If durability cannot be determined, the
  affected records are held as an integrity conflict rather than guessed.
- **Retry:** after recovery, the same operation ID must return the committed
  result or safely reapply only if no effect committed.
- **User-visible state:** “operation uncertain / under recovery”; never
  “successful” without durable confirmation.
- **Audit event:** failed/recovered transaction evidence linked to the
  operation and affected domain records.
- **Reporting state:** exclude uncertain records until the authoritative
  transaction outcome is known; regenerate projections from source records.
- **Escalation:** operations/Owner incident path; material uncertain state
  requires human review.
- **Executable proof:** **SCHEMA PREPARED; RUNTIME BLOCKED.**
  `migrations/003_sync_durability.sql` now defines the immutable operation
  fingerprint/payload/response contract and append-only effect links.
  `tests/database/003_sync_durability.sql` prepares rollback, tamper, duplicate,
  and accepted-effect checks. It could not be executed because PostgreSQL/psql
  is not installed; the production API adapter also remains future M15 work.

## Authorization, tenant, and audit boundaries

- Every operation envelope carries `businessId`, `deviceId`, and `actorUserId`.
- Synchronization reads, retries, conflict lists, and delivery are
  business-scoped.
- Offline state never grants authority; the server adapter rechecks
  authorization before applying an operation.
- Cross-business dependencies are refused.
- Credit corrections/reversals require customer/debt lineage and management
  authority; separate approval and Owner-review rules remain those documented in
  Handoff 11.
- Denied and failed operations must leave no business effect while retaining
  authorization/failure evidence.
- No audit history is deleted or rewritten to make a failed operation disappear.

## Historical and reporting behavior

- Original completed sales remain historical records.
- Accepted corrections, reversals, and returns are additive linked events.
- A refused correction leaves no inventory, credit, report, or audit effect.
- Negative stock remains visible as an exception rather than being overwritten.
- Canonical reports are rebuilt from accepted source records and include
  traceable source IDs.
- Local/pending/rejected/conflicted work is not treated as authoritative
  reporting truth.

## Files changed

- `src/domain/failureTesting.test.ts` (new) — 12 failure-injection tests.
- `src/domain/customersCredit.ts` — read-only correction/reversal validation
  contexts and preflight methods.
- `src/domain/returnsCorrections.ts` — credit-lineage requirements, credit
  prevalidation before effects, and positive-integer correction validation.
- `src/sync/offlineSync.ts` — valid-WAL recovery from corrupt main state and
  concurrent in-flight idempotency; server authorization denial now escalates
  the offline operation to management review.
- `src/sync/offlineSync.test.ts` — stale-authority escalation regression.
- `src/domain/integration.test.ts` — cross-domain stale-authority escalation
  regression.
- `src/exceptions/exceptionsController.ts` — passes known customer/debt lineage
  into corrections and reversals.
- `migrations/003_sync_durability.sql` (new) — durable sync fingerprint,
  payload, dependency, response, sequence, and effect-link contract.
- `tests/database/003_sync_durability.sql` (new) — pgTAP-style durability and
  rollback checks.
- `docs/build/HANDOFFS/02-database-tenancy.md` — records the sync-durability
  follow-up.
- `docs/build/HANDOFFS/28-failure-testing.md` (this file).
- `docs/build/BUILD-STATUS.md`.

## Validation

```text
npm test                                      PASS (27 files, 275 tests)
npm run lint                                  PASS
npm run build                                 PASS
npx tsc -b --pretty false                     PASS
npx prettier --check <changed source files>   PASS
git diff --check                              PASS
tests/database/003_sync_durability.sql        NOT RUN — PostgreSQL/psql unavailable
```

All Node/TypeScript validation commands ran in the repository environment. The
SQL script could not run for the stated environmental reason.

## Genuine gaps and release blockers

1. **No durable database runtime.** Migration 003 prepares the immutable
   transaction/effect contract, but there is still no production adapter that
   executes it against PostgreSQL.
2. **No production API/auth adapter.** Server authorization, tenant isolation,
   session/device revocation, and audit persistence remain composition
   contracts rather than deployed infrastructure.
3. **No backup/restore test.** Restore, incomplete restore, migration failure,
   and backend-incident recovery remain unimplemented.
4. **Formal stale-permission sign-off is unresolved.** The safe implementation
   default is now denial plus management review; H11 Q24 still needs explicit
   product confirmation.
5. **Runtime fingerprint enforcement is not connected.** Migration 003 persists
   the fingerprint contract, but the production API adapter must use it so a
   direct replay cannot bypass the sync reference server.
6. **Conflict queues are reference models.** Domain-specific classifiers,
   management review workflows, and notification routing remain downstream.

## Known limitations

- The suite runs against in-memory engines and the reference sync server; it is
  not an end-to-end browser/network kill test.
- `localStorage` is a reference durable store, not the production local
  database.
- Authorization denial is modeled with a server hook, not a real identity
  provider.
- The suite does not implement or release incentive payout logic.

## Excluded modules

- No production PostgreSQL/API adapter, authentication provider, backup system,
  or deployment infrastructure.
- No incentive payout calculation/release.
- No payment-provider execution or external money movement.
- No general ledger/accounting module.
- No unrelated UI redesign or repository-wide formatting.

## Next integration step

Connect the future M15 authoritative transaction adapter to migration 003, then
replay this exact failure suite against PostgreSQL-backed storage with process
kills, database restarts, forced rollbacks, restored backups, real session
revocation, and multi-device concurrency. The release gate is not met until
FT-18 and backup/restore behavior have executable runtime proof.
