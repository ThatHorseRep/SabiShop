# B07 --- Transaction Lifecycle & State Rules

**Package:** B --- Business Operations Specification\
**Deliverable:** B07 --- Transaction Lifecycle & State Rules\
**Status:** FINAL — RECONCILED V1\
**Authority:** Business Operations Specification\
**Depends on:** D03 Sales & Transaction Rules, B03 Credit & Debt, B04
Returns & Refund, B05 Cash & Reconciliation, B06 Inventory Accounting\
**Related technical deliverables:** D03 Data Schema, D08 Sync, D10 Audit
Trail, D11 Hash-Chain / Integrity Specification\
**Related business deliverable:** B08 Correction & Exception Policy

------------------------------------------------------------------------

## 1. Purpose

This document defines the business lifecycle of transactions in Sabi
Shop and establishes the rules for moving a transaction through its
lifecycle without destroying or silently rewriting its historical
evidence.

The central principle is:

> **Transaction correction must never destroy audit integrity.**

A transaction may be corrected, voided, returned, refunded, reversed, or
otherwise affected by a later business event. Those actions must
preserve the original transaction's identity and historical evidence.

This document defines the business invariants. Detailed implementation
mechanisms belong in the relevant technical deliverables.

------------------------------------------------------------------------

## 2. Core Lifecycle Principle

A transaction lifecycle represents what happened to a business
transaction over time.

Sabi Shop must distinguish between:

1.  **The original transaction**
2.  **The current accepted state of that transaction**
3.  **Subsequent business events affecting it**
4.  **The historical record of all changes and actions**

A later action must not make it appear that the original transaction
never existed.

### 2.1 Historical integrity invariant

For a completed transaction:

-   Its original identity must remain.
-   Its historical existence must remain.
-   Its historical business facts must remain traceable.
-   Changes must be attributable to a person or system actor.
-   Changes must have timestamps.
-   Corrections requiring authorization must retain their authorization
    evidence.
-   Relationships to related events must remain intact.
-   Historical prices, quantities, payment events, and other relevant
    facts must not be silently rewritten.
-   Audit evidence must not be deleted or bypassed.

### 2.2 Append-only principle

Lifecycle operations should be compatible with an
append-only/event/version-based history.

This is important because Sabi Shop's integrity model is intended to
support a future/related hash-chain mechanism. The business rule is
therefore stronger than simply "keep an audit log":

> **Business operations must not provide a legitimate path for
> destroying or silently rewriting evidentiary history.**

The technical implementation of hashes belongs to D11.

------------------------------------------------------------------------

## 3. Transaction Lifecycle States

The core lifecycle distinguishes between an unfinished transaction
attempt and a completed business transaction.

### 3.1 Draft

A **Draft** represents a transaction being prepared but not yet
completed.

A draft may contain:

-   Products
-   Quantities
-   Prices
-   Customer information
-   Intended payment information
-   Salesperson attribution
-   Other transaction details

A draft is not yet a completed sale.

### 3.2 Completed

A transaction becomes **Completed** only when the requirements for a
completed sale are satisfied.

Based on D03, a completed sale requires:

-   Product(s)
-   Actual quantities
-   Actual prices
-   Payment, including approved credit where applicable
-   Required authorization
-   Completion state

A conversation, quotation, abandoned attempt, or unconfirmed payment
does not by itself create a completed sale.

### 3.3 Cancelled

A Draft may be **Cancelled** before completion.

Cancellation means the attempted transaction was abandoned or
intentionally stopped before becoming a completed sale.

A cancelled draft is retained when needed for auditability and
operational traceability, but it does not become a completed sale merely
because it existed.

### 3.4 No completed-sale deletion

Once a transaction is completed, it must not be deleted as a normal
business operation.

The system may support later corrective actions, but those actions must
preserve the completed transaction's historical existence.

------------------------------------------------------------------------

## 4. Lifecycle Transition Rules

### 4.1 Draft → Completed

Allowed only when the completed-sale requirements are satisfied.

The completion event must establish the transaction as an actual
business event.

### 4.2 Draft → Cancelled

Allowed before completion.

Cancellation must not create:

-   Revenue
-   Customer receivable
-   Supplier payable
-   Inventory sale movement
-   Completed-sale payment settlement

unless another separate business event legitimately creates such an
effect.

### 4.3 Completed → Completed

A completed transaction may undergo an accepted correction without
becoming a different historical transaction.

The transaction remains completed.

The system records the correction as a subsequent version/event/action
rather than silently replacing history.

### 4.4 Completed → Void / Corrected

Void is a **correction/exception action**, not a normal lifecycle state
that replaces the original transaction.

When a completed transaction needs to be voided:

-   The original transaction remains identifiable.
-   The void action is recorded separately.
-   The actor is recorded.
-   The time is recorded.
-   The reason is recorded.
-   Required authorization is recorded.
-   Any downstream financial, inventory, cash, receivable, or other
    effects are traceable.
-   The original history remains available.

The exact financial and inventory mechanics of voiding belong in B08 and
the relevant accounting/technical specifications.

------------------------------------------------------------------------

## 5. Returns

A return is not a deletion or rewriting of the original sale.

### 5.1 Return as a separate business event

A return is a separate, auditable business event linked to the original
sale.

The original sale remains historically intact.

The return records the subsequent event and its relationship to the
original sale.

### 5.2 Full return

Where all items from a sale are returned and the return is approved, the
original sale remains in history.

The interface may derive a display status such as:

> **Completed --- Fully Returned**

This display status does not replace the original lifecycle state or
delete the original sale.

### 5.3 Partial return

Partial returns are supported.

For a partial return:

-   The original sale remains Completed.
-   The returned SKU(s) and quantities are recorded.
-   The return is linked to the original sale.
-   The reason is recorded.
-   Required approval is recorded.
-   Inventory and financial effects are generated by the return event
    according to the applicable business rules.

The interface may derive:

> **Completed --- Partially Returned**

Again, this is a derived operational status, not a replacement of the
original transaction history.

### 5.4 Rejected return

A rejected return remains in history.

A rejected return must not silently alter:

-   Inventory
-   Customer debt
-   Settlement
-   The original sale

------------------------------------------------------------------------

## 6. Refunds and Reversals

Refunds and reversals are subsequent events associated with an earlier
transaction.

The original transaction and original payment history remain available.

A later refund or reversal must not rewrite the original payment event
as though the original payment never occurred.

The exact distinction between:

-   Refund
-   Reversal
-   Void
-   Adjustment
-   Other financial correction

belongs to **B08 --- Correction & Exception Policy** and the relevant
financial rules.

This document establishes the lifecycle integrity requirement:

> **A later corrective financial event must preserve the historical fact
> that the original transaction/payment event occurred.**

------------------------------------------------------------------------

## 7. Editing Completed Transactions

Editing a completed transaction is a correction mechanism, not a new
lifecycle state.

### 7.1 Completed state remains

When an allowed edit is made to a completed transaction:

-   The transaction remains Completed.
-   The original version remains historically recoverable.
-   The accepted new version becomes the current state.
-   The editor is recorded.
-   The time is recorded.
-   The change is auditable.
-   Any required authorization is recorded.

### 7.2 Correction window

D03 establishes that completed sales may be edited during a configured
short correction window.

The exact:

-   Duration
-   Allowed fields
-   Authorization requirements
-   Role permissions
-   Exception process

are delegated to later business/permissions rules.

### 7.3 No silent overwrite

A database-style overwrite that causes the previous accepted state to
disappear is not an acceptable business operation.

The system must preserve enough history to establish:

-   What the transaction originally contained
-   What was changed
-   Who changed it
-   When it was changed
-   What the resulting accepted state became
-   Why/under what authorization the change occurred where applicable

------------------------------------------------------------------------

## 8. Deletion Policy

### 8.1 Completed transactions cannot be deleted

A completed transaction must never be deleted through normal application
operations.

This applies regardless of whether the transaction is:

-   Correct
-   Incorrect
-   Voided
-   Fully returned
-   Partially returned
-   Refunded
-   Reversed
-   Edited
-   Under dispute
-   Associated with a correction

The corrective action must preserve the original record.

### 8.2 Stronger integrity rule

Sabi Shop must not provide a legitimate business operation that destroys
or silently manipulates evidentiary history by:

-   Deleting a completed transaction
-   Overwriting its history
-   Removing related authorization events
-   Removing audit records
-   Breaking relationships to returns/refunds/reversals
-   Manipulating timestamps to conceal a correction
-   Rewriting historical prices or quantities without preserving the
    previous state
-   Removing payment history
-   Removing the evidence of who performed a correction

Technical enforcement belongs to D10 and D11.

------------------------------------------------------------------------

## 9. Derived Operational Statuses

The underlying lifecycle state and the operational status shown to users
are not necessarily identical.

For example:

  Underlying transaction   Related event              Possible derived display
  ------------------------ -------------------------- ----------------------------------
  Completed                None                       Completed
  Completed                Approved partial return    Completed --- Partially Returned
  Completed                Approved full return       Completed --- Fully Returned
  Completed                Approved void/correction   Completed --- Voided/Corrected
  Draft                    Cancelled                  Cancelled

Derived statuses must never be used as a reason to delete or rewrite the
underlying transaction history.

------------------------------------------------------------------------

## 10. Downstream Effects

Lifecycle actions can affect multiple business domains.

Depending on the event, the system may need to account for effects on:

-   Inventory
-   Revenue
-   Customer receivables
-   Supplier payables
-   Cash
-   Bank/POS settlement
-   Incentives
-   Other financial records

Those effects must be represented by the appropriate business event or
correction mechanism.

A lifecycle action must not silently modify another domain without a
traceable relationship.

For example:

-   A return should be represented as a return event and its resulting
    inventory/financial effects.
-   A customer repayment remains a separate payment event.
-   A cash correction remains traceable in cash history.
-   An incentive recalculation caused by a transaction change remains
    attributable to the underlying transaction change.

------------------------------------------------------------------------

## 11. Relationship to Audit Trail

Audit integrity is a cross-cutting invariant.

D10 defines what changes/actions are recorded in the audit trail.

This B07 document establishes **why** lifecycle operations must preserve
that history.

For every material lifecycle/correction action, the system should be
able to establish the relationship among:

-   Original transaction
-   Subsequent action/event
-   Actor
-   Timestamp
-   Reason where required
-   Authorization where required
-   Resulting state
-   Downstream effects

No lifecycle feature should bypass the audit model.

------------------------------------------------------------------------

## 12. Relationship to Hash-Chain / Integrity

D11 defines the technical hash-chain/integrity mechanism.

B07 does not prescribe the cryptographic implementation.

The business requirement is:

> **Lifecycle and correction operations must preserve an ordered,
> attributable history that can be made tamper-evident by the technical
> integrity layer.**

Therefore:

-   Original events must remain identifiable.
-   Subsequent events must remain linked.
-   History must not be silently rewritten.
-   Event ordering and timestamps must not be manipulated as a normal
    correction mechanism.
-   Audit records must remain available to the integrity layer.

------------------------------------------------------------------------

## 13. Offline Behaviour

Core transaction lifecycle operations must work within the offline-first
model where the underlying business operation is supported offline.

An offline transaction may later synchronize.

Synchronization must not erase the locally established transaction
history.

Where a conflict occurs, the system must preserve enough information to
establish:

-   The locally recorded event
-   The synchronized/remote event
-   The resulting accepted state
-   The conflict or resolution action

Detailed synchronization conflict handling belongs to D08.

------------------------------------------------------------------------

## 14. Responsibilities

### Staff

Staff may create and complete sales within their permissions.

Staff must not be able to use normal transaction operations to:

-   Delete completed transactions
-   Destroy audit history
-   Bypass required approval
-   Silently rewrite completed transactions

### Manager / Owner

Managers/Owners may have additional authority for:

-   Corrections
-   Voids
-   Returns
-   Refund-related actions
-   Exceptions
-   Other controlled operations

Exact permissions are defined by the Roles & Permissions rules.

Authorization does not grant permission to destroy historical evidence.

### System

The system must enforce the lifecycle invariants and preserve
transaction relationships/history.

------------------------------------------------------------------------

## 15. Examples

### Example 1 --- Abandoned sale

A staff member adds products to a basket but the customer leaves without
purchasing.

**Result:** - Draft may be cancelled. - No completed sale is created. -
No revenue is recognized. - No completed-sale payment exists.

### Example 2 --- Completed sale later corrected

A completed sale contains an incorrect quantity.

**Result:** - Original completed transaction remains historically
identifiable. - An authorized correction is recorded. - The accepted
current state reflects the correction. - The original state remains
auditable.

### Example 3 --- Partial return

A customer buys 10 units and later returns 2.

**Result:** - Original sale remains Completed. - A separate return event
records 2 returned units. - The return links to the original sale. -
Inventory/financial effects follow the return rules. - Display may show
Completed --- Partially Returned.

### Example 4 --- Full return

A customer returns all items from an approved sale.

**Result:** - Original sale remains in history. - Return event records
the full return. - Display may show Completed --- Fully Returned. - The
original payment event is not erased.

### Example 5 --- Void

A completed transaction was created in error and requires management
correction.

**Result:** - The original transaction is retained. - A void/correction
event records the action. - Actor, time, reason, and authorization are
preserved. - Downstream effects are traceable. - Audit history remains
intact.

------------------------------------------------------------------------

## 16. Non-Negotiable Invariants

The following are mandatory:

1.  **Completed transactions are never deleted.**
2.  **The original transaction identity remains traceable.**
3.  **Returns are separate linked business events.**
4.  **Partial returns do not rewrite the original sale.**
5.  **Refunds/reversals do not erase original payment history.**
6.  **Edits preserve the previous accepted state.**
7.  **Void is a correction/exception action, not silent deletion.**
8.  **Rejected corrective events remain auditable where they were
    recorded.**
9.  **Authorization evidence must not be removed.**
10. **Historical relationships must not be broken by correction.**
11. **No normal business operation may silently destroy evidentiary
    history.**
12. **Lifecycle operations must remain compatible with the audit and
    integrity architecture.**

------------------------------------------------------------------------

## 17. Deferred / Owned Elsewhere

This document intentionally does not finalize:

-   Exact correction-window duration
-   Exact field-level edit permissions
-   Exact void accounting mechanics
-   Exact reversal accounting mechanics
-   Exact refund settlement mechanics
-   Exact inventory effects of each correction type
-   Detailed authorization matrix
-   Technical event/version schema
-   Sync conflict resolution
-   Hash-chain implementation

Ownership:

  Topic                                                    Authoritative home
  -------------------------------------------------------- ------------------------------------------
  Sale completion requirements                             D03
  Pricing/floor rules                                      D04
  Incentives                                               D05
  Customer credit/debt                                     B03
  Returns/refunds                                          B04
  Cash/reconciliation                                      B05
  Inventory costing/accounting                             B06
  Detailed correction/void/reversal/adjustment mechanics   B08
  Audit event recording                                    D10
  Hash-chain/integrity implementation                      D11
  Data model                                               D03 / D04 technical schema as applicable
  Offline/sync implementation                              D07 / D08
  Roles and permissions                                    Roles & Permissions specification

------------------------------------------------------------------------

## 18. Reconciliation Notes

This section exists so a future model/context can distinguish historical
unanswered questions from decisions that have since been resolved.

### 18.1 Questions resolved by this deliverable

The earlier B07 working questions concerning the following are now
resolved at the business-rule level:

-   **Void:** Treat as a correction/exception action while preserving
    the original transaction and audit history.
-   **Returns:** Preserve the original sale and represent the return as
    a separate linked business event.
-   **Partial returns:** Keep the original sale Completed; represent the
    partial return separately.
-   **Refund/reversal:** Preserve the original transaction/payment
    history; represent the later action separately.
-   **Editing:** Editing is not a new lifecycle state; preserve the
    previous accepted state and record the correction.
-   **Deletion:** Completed transactions must never be deleted.
-   **Audit integrity:** No lifecycle operation may destroy or silently
    rewrite evidentiary history.

### 18.2 Stale historical deferrals

If an earlier requirements document lists the above topics as
"unresolved" or "deferred," those entries are now stale for the
business-rule questions covered here.

They should not be re-asked merely because an older document still
contains the old unresolved label.

The exact implementation details may remain deferred to the
authoritative deliverables listed in Section 17.

### 18.3 Hash-chain rationale

The earlier discussion about hashes is captured here as a design
rationale:

-   Lifecycle history must be preserved.
-   Corrections should be represented as subsequent events/versions.
-   Audit history must remain attributable and ordered.
-   This structure allows D11 to provide a tamper-evident integrity
    mechanism.

The hash-chain implementation itself is not defined by B07.

------------------------------------------------------------------------

## 19. Acceptance Criteria

B07 can be considered complete when:

-   Draft, Completed, and Cancelled are clearly distinguished.
-   Completed transaction deletion is prohibited.
-   Void is defined as a correction/exception action.
-   Returns are defined as separate linked events.
-   Partial returns preserve the original sale.
-   Refunds/reversals preserve original history.
-   Completed edits preserve previous accepted state.
-   Derived statuses do not replace underlying history.
-   Lifecycle actions cannot silently destroy audit evidence.
-   Ownership boundaries with B03, B04, B05, B06, B08, D10, and D11 are
    explicit.
-   Historical unresolved labels are explicitly reconciled so they are
    not re-asked by future contexts.

------------------------------------------------------------------------

## 20. Summary

Sabi Shop's transaction lifecycle is built around one central rule:

> **A correction changes the business record without pretending the
> original event never happened.**

Drafts may be cancelled. Completed transactions remain historically
intact. Corrections, voids, returns, refunds, reversals, and edits are
subsequent attributable actions/events rather than mechanisms for
destroying history.

This gives Sabi Shop a transaction model that remains understandable to
users, auditable to management, compatible with offline operation, and
structurally suitable for the technical integrity mechanisms defined
elsewhere.
