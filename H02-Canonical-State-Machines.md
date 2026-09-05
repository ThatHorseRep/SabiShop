# H02 — Canonical State Machines

**Status:** Pre-build hardening draft

## 1. Principle

Sabi Shop must not collapse independent lifecycle dimensions into one
overloaded status. A business record may simultaneously have business
lifecycle, payment, authorization and synchronization states.

## 2. Sale lifecycle

**States**

`DRAFT → PENDING_COMPLETION → COMPLETED`

Exceptional paths:

`PENDING_COMPLETION → FAILED`

`COMPLETED → CORRECTED/ADJUSTED`

`COMPLETED → RETURNED_IN_PART / RETURNED_IN_FULL` through separate
return events, not destructive mutation.

**Illegal transitions**

- DRAFT → RETURNED
- FAILED → COMPLETED without a new valid completion event
- COMPLETED → DELETED
- COMPLETED → DRAFT
- any state → COMPLETED using unconfirmed payment

## 3. Payment lifecycle

`INITIATED → PENDING → CONFIRMED_SUCCESS`

or

`INITIATED/PENDING → FAILED`

Where applicable:

`CONFIRMED_SUCCESS → REVERSED`

A failed or unconfirmed payment must never be interpreted as successful
payment.

## 4. Credit obligation lifecycle

`NONE → OUTSTANDING → PARTIALLY_SETTLED → SETTLED`

Exceptional:

`OUTSTANDING/PARTIALLY_SETTLED → REDUCED_BY_APPROVED_RETURN`

`OUTSTANDING/PARTIALLY_SETTLED → WRITTEN_OFF`

Corrections create traceable subsequent events.

## 5. Inventory lifecycle

Inventory quantity is movement-driven rather than a single lifecycle
enum.

Movement types include:

- receipt;
- sale;
- customer return;
- supplier return;
- loss/damage;
- found stock;
- adjustment.

A balance may become negative, but negative stock is an exception state
requiring investigation.

## 6. Return lifecycle

`REQUESTED → VERIFIED → APPROVED → APPLIED → SETTLED`

Possible:

`REQUESTED/VERIFIED → REJECTED`

A rejected return does not silently mutate the sale, stock or debt.

## 7. Correction lifecycle

`REQUESTED → AUTHORIZATION_REVIEW → APPROVED → APPLIED`

or

`REQUESTED → REJECTED`

For low-risk permitted corrections, the authorization step may be
represented as immediate approval according to the permission matrix.

## 8. Cash reconciliation lifecycle

`OPEN_SESSION → COUNT_RECORDED → RECONCILIATION_PREPARED → MANAGEMENT_CONFIRMED → CLOSED`

A closed day may later become:

`CLOSED → REOPENED → CLOSED`

Reopening requires durable actor, time and reason evidence.

An unresolved discrepancy may coexist with CLOSED.

## 9. Synchronization lifecycle

Synchronization state must remain separate from business state:

`LOCAL_ONLY → PENDING_SYNC → ACCEPTED`

or:

`PENDING_SYNC → REJECTED`

or:

`PENDING_SYNC → CONFLICT → RESOLVED`

or:

`PENDING_SYNC → FAILED → RETRY/ESCALATE`

A local operation must never be represented as server-authoritative
merely because it was saved locally.

## 10. Authorization lifecycle

`NOT_REQUIRED`

or:

`REQUESTED → APPROVED`

or:

`REQUESTED → REJECTED`

or:

`APPROVED → EXPIRED/INVALIDATED`

An authorization decision is tied to business, actor, operation, target
and relevant state.

## 11. State-machine implementation rules

- Every legal transition has a named command/use case.
- Every illegal transition has a deterministic error.
- State transitions are idempotent where retries are possible.
- State changes affecting multiple domains are atomic where business
  truth requires atomicity.
- State history remains reconstructable.
- Tests must cover every legal transition and representative illegal
  transitions.
