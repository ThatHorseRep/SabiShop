# Handoff 14 - Offline Synchronization and Conflict Reliability

**Module:** M13 - offline synchronization and conflict resolution  
**Status:** IMPLEMENTED REFERENCE BOUNDARY; authoritative database/API adapter remains downstream

## Scope

This slice implements the shared offline operation envelope and synchronization
state boundary. It does not implement sale, inventory, cash, credit, payment,
return, correction, or incentive business rules, and it does not invent a
domain-specific conflict winner.

## Implemented contract

`src/sync/offlineSync.ts` provides:

- durable local operation storage through `DurableStore`;
- an in-memory store and a browser `localStorage` store;
- a write-ahead record for interrupted local writes;
- preservation of corrupt local state for investigation instead of silent
  replacement;
- caller-supplied globally unique operation identities that survive retry,
  reconnect, app kill, and device restart;
- device identity separate from actor/user identity;
- explicit local durability, business lifecycle, payment, authorization,
  server acceptance, synchronization, and conflict dimensions;
- `LOCAL_ONLY → PENDING_SYNC → SYNCHRONIZED`, with `FAILED`, `REJECTED`,
  `CONFLICT`, and `SUPERSEDED` outcomes;
- deterministic operation fingerprints so operation identity reuse with
  different content becomes an integrity conflict;
- idempotent server delivery: replay returns the original accepted result and
  server sequence;
- bounded automatic transport retries plus observable operator retry;
- causal dependency gating, missing-dependency conflict, terminal-dependency
  conflict, and causal-cycle conflict;
- server-side authorization revalidation through the server adapter;
- tenant-scoped coordinator reads, lists, retries, and synchronization;
- management-review conflict escalation;
- explicit supersession requiring a separate reviewer, reason, and replacement
  operation;
- no destructive merge or automatic material-conflict winner.

The reference `InMemorySyncServer` records request fingerprints and accepted
operation identities, rechecks the supplied authorization hook, checks accepted
dependencies in server sequence, and invokes an application callback at most
once per accepted operation identity. It is a test/API integration model, not
the production persistence transaction.

## State dimensions

| Dimension          | Representation                                                   |
| ------------------ | ---------------------------------------------------------------- |
| Local persistence  | `localState: durable`, `localRecordedAt`, durable store          |
| Business lifecycle | caller-provided `businessState`                                  |
| Payment            | caller-provided `paymentState`                                   |
| Authorization      | caller-provided `authorizationState`; server recheck on delivery |
| Server acceptance  | `unknown`, `accepted`, `rejected`, `conflict`                    |
| Synchronization    | `SyncState`                                                      |
| Conflict           | `ConflictRecord` with escalation and resolution evidence         |
| Supersession       | `supersedes` plus conflict resolution metadata                   |

The coordinator deliberately requires the business, payment, and authorization
dimensions instead of choosing defaults. Domain adapters must map their
canonical states into these fields without collapsing them.

## Authorization, tenant, and audit boundaries

Every operation carries `businessId`, `deviceId`, and `actorUserId`.
Coordinator queries and sync runs are business-scoped. Local dependency and
supersession checks reject cross-business references. The server adapter is the
authoritative authority boundary; an offline record never grants permission.

This module preserves operation evidence and conflict resolution metadata. It
does not rewrite domain audit records. The downstream API transaction must map
accepted, rejected, conflicted, recovered, and superseded outcomes into the
append-only audit contract from handoff 13.

## Business and historical behavior

Domain engines remain authoritative for business effects. A local operation is
never treated as server-authoritative merely because it was saved locally.
Accepted operation results and server sequences are recorded on the local
envelope after the server response.

Conflicts preserve evidence and escalate to management review. Resolution only
marks the original operation superseded and links a replacement operation; it
does not mutate the original payload or execute business effects. Money, stock,
debt, attribution, permission, and historical-truth conflicts remain subject to
human review and server-side authorization.

## Adversarial tests

`src/sync/offlineSync.test.ts` covers:

- stable identity and queue recovery after restart;
- duplicate logical enqueue;
- timeout after server acceptance;
- duplicate network delivery;
- operation identity reuse with changed content;
- causal ordering and stale-client dependency recovery;
- tenant isolation and cross-business dependency rejection;
- partial synchronization batch failure;
- server-side authorization rejection;
- bounded retry and operator retry observability;
- material conflict escalation and separate human resolution;
- causal-cycle preservation;
- interrupted write-ahead recovery;
- corrupt local state preservation;
- rejection of non-JSON durable payloads.

## Validation

Final validation is recorded in `docs/build/BUILD-STATUS.md`.

## Known limitations and unresolved decisions

- The production local database and server transaction adapter remain
  downstream; `localStorage` is only the browser reference adapter.
- Exact production retry schedule/backoff is not fixed here; this slice bounds
  automatic attempts to five by default and exposes operator retry.
- Domain-specific conflict classifiers, review roles, and resolution queues
  must be connected at the API/domain adapter boundary.
- Server acceptance, domain effect, idempotency record, causal check, and audit
  evidence must be atomic in the authoritative database transaction.
- H11 Q22–Q24 remain unresolved: the exact offline operation catalogue,
  conflict authority by operation, and stale-permission review policy.

## Excluded modules

No sales, inventory, purchasing, customer credit, returns, corrections, cash,
audit, authorization, catalog, finance, or incentive module was changed. No
incentive payout logic was added.

## Next integration step

Connect `DurableStore` to the production local database and `SyncServer` to an
authenticated, business-scoped API transaction that atomically persists the
operation fingerprint, idempotency result, causal state, domain effects, audit
evidence, and server sequence. Add domain-specific conflict classifiers and the
management resolution queue on top of this boundary.
