# C10 — Offline, Conflict & Exceptional States UX

**Product:** Sabi Shop  
**Document ID:** C10  
**Package:** C — User Experience Specification  
**Status:** RECONCILED — DESIGN BASELINE — Cross-Cutting Exceptional States UX  
**Version:** 1.0  
**Prepared:** 2026-09-04  

## 1. Purpose

C10 defines the cross-cutting UX behavior for states that occur when normal execution is interrupted or when the system detects something requiring deliberate handling.

It applies across:

- POS
- Inventory
- Purchasing
- Customers & Credit
- Returns
- Corrections
- Money
- Management

The governing principle remains:

> **Fast for ordinary work. Deliberate for consequential work.**

---

## 2. Core State Distinctions

The interface must distinguish:

```text
Recorded
vs
Synchronized

Attempted
vs
Successful

Pending
vs
Completed

Current
vs
Historical

Permission available
vs
Authorization required

Error
vs
Integrity failure
```

These distinctions are business-critical.

---

## 3. Cross-Cutting State Model

```text
Normal
→ Offline
→ Locally Recorded
→ Sync Pending
→ Synchronized

or

Normal
→ Error
→ Recoverable / Failed

or

Normal
→ Conflict
→ Resolution Required
→ Resolved

or

Normal
→ Integrity Issue
→ Blocked
→ Escalated
→ Resolved
```

These are UX states and do not automatically define database statuses.

---

## 4. Connectivity States

Use:

```text
Online
Offline
Reconnecting
Connection unstable
```

The UX should communicate business implications rather than network diagnostics.

**Online does not mean:**

- payment succeeded;
- transaction completed;
- synchronization completed;
- authorization granted.

Those remain separate states.

---

## 5. Offline Mode

Offline is a first-class supported mode where configured.

It should be visible without becoming a disruptive application error.

Recommended indicator:

> **Offline**

The user should continue supported work without learning a completely different application.

---

## 6. Offline Capability

Every operation should clearly communicate whether it is:

```text
Available offline
Requires connection
Requires later synchronization
Requires online confirmation
```

An unsupported offline action should explain why it cannot proceed.

Offline must never become a blanket permission bypass.

---

## 7. Local Recording

When a supported action succeeds offline, use language such as:

> **Recorded on this device. Sync pending.**

Do not claim complete external confirmation when synchronization or payment confirmation is still outstanding.

---

## 8. Local Record vs Business Success

A local record is not automatically equivalent to an externally confirmed business event.

This distinction is especially important for payment.

```text
Local save
≠
Successful payment confirmation
```

---

## 9. Successful Payment

Only a successfully confirmed payment becomes a successful payment event according to the applicable business rules.

The UI must not turn a user's selection of “Transfer”, “POS”, or another method into false confirmation.

---

## 10. Unconfirmed Payment

Recommended state:

> **Payment not confirmed**

The sale should not silently become a successful paid sale when confirmation is required.

The exact confirmation mechanism remains domain/technical authority.

---

## 11. Failed or Reversed Attempts

Unsuccessful payment attempts must not be presented as successful business events.

Sabi Shop does not use a generic “reversed transaction” as a normal successful transaction state.

---

## 12. Sync Pending

After a locally recorded event:

> **Sync pending**

This means:

- the action exists locally;
- synchronization has not yet completed.

The state should remain discoverable from the relevant record.

---

## 13. Synchronization Success

After successful synchronization:

> **Synchronized**

The pending indicator may become less prominent, but the record retains its identity and history.

---

## 14. Sync Failure

A failed synchronization must remain visible.

Recommended:

```text
Sync failed
→ Retry
→ View issue
```

Do not encourage blind re-submission of a business action that may already exist remotely.

---

## 15. Duplicate Submission Protection

Prevent accidental duplicate submissions caused by:

- double-tapping Complete Sale;
- repeatedly recording the same payment;
- submitting receiving twice;
- retrying an uncertain transaction blindly.

Where technical idempotency exists, the UX should simply behave as though the user submitted once.

---

## 16. Conflict

A conflict exists when two states/events cannot safely be accepted together without deliberate resolution.

Examples:

- offline correction vs newer synchronized correction;
- stock state changed elsewhere;
- customer/debt state changed elsewhere;
- payment record conflict;
- duplicate transaction discovery.

A conflict is not merely a generic error.

Use:

> **Conflict detected**

rather than hiding it behind “Something went wrong.”

---

## 17. No Silent Overwrite

Universal rule:

> **Never silently overwrite conflicting business state.**

Do not automatically choose a local or remote version where doing so could destroy business evidence.

---

## 18. Conflict Resolution

Recommended flow:

```text
Conflict detected
→ Identify affected record
→ Compare states/events
→ Explain consequences
→ Identify authority
→ Resolve
→ Verify resulting state
→ Preserve conflict history
```

---

## 19. Conflict Comparison

Where appropriate, show:

```text
Local
Remote / synchronized
Difference
Source event
Actor
Date/time
Business effect
```

Technical synchronization metadata should not overwhelm ordinary users.

---

## 20. Conflict Authority

Conflict resolution remains permission-controlled.

A staff user does not gain management authority simply because a conflict appears on their device.

B09 remains authoritative.

---

## 21. Offline Authorization

Offline operation must not bypass authorization.

Where an authorized Manager/Owner is locally available, an operation may proceed according to the configured offline permission model.

Otherwise the operation may become:

```text
Blocked
Request pending
Requires later management review
```

depending on the domain rule.

---

## 22. Offline Staff Requests

Where staff cannot approve an action:

```text
Action requires management approval
→ Request / hand off
→ Management decision
```

Preserve the user's work where safe.

---

## 23. Offline Credit

Where supported, offline credit must still enforce:

- customer identity;
- credit status;
- credit limit;
- required authorization;
- auditability.

Offline does not mean unrestricted.

---

## 24. Offline Receiving

Where supported:

```text
Record physical receipt
→ Record actual quantity
→ Record actual acquisition cost
→ Record locally
→ Sync pending
```

The user must know that synchronization remains outstanding.

---

## 25. Offline Stock Count

Offline stock counts may be recorded where supported.

A resulting variance remains an investigation/correction workflow.

Synchronization must not silently convert a count discrepancy into an unexplained stock overwrite.

---

## 26. Offline Returns

Where supported, offline returns follow the applicable B04/B08 rules.

Preserve:

- original sale;
- return;
- approval;
- inventory/debt consequences;
- synchronization state.

---

## 27. Offline Corrections

Offline corrections affecting money, inventory, debt, payment, incentive, or attribution require the configured authority.

Where applicable, display:

> **Recorded offline — management review pending**

---

## 28. Offline Cash Reconciliation

Where supported, preserve:

```text
Expected
Physical
Difference
Investigation
Resolution
Sync state
```

A locally recorded reconciliation must not be mistaken for a synchronized final state.

---

## 29. Permission Denied

Permission denial is different from system failure.

Use:

> **You do not have permission to perform this action.**

Then offer the appropriate safe path, such as requesting management involvement.

---

## 30. Authorization Required

Authorization required means the user can initiate the workflow but another authorized user must approve it.

This is different from permission denial.

```text
Authorization required
≠
Permission denied
```

---

## 31. Authorization Pending

Show:

> **Waiting for Manager approval**

where appropriate.

The originating user should be able to see the request status where permissions allow.

---

## 32. Authorization Approved

After approval:

```text
Approved
→ Action may proceed
```

Approval remains attributable to the approving user.

---

## 33. Authorization Rejected

After rejection:

```text
Rejected
→ Underlying business state unchanged
```

The rejection remains part of management history.

---

## 34. Authorization Invalidated

If the underlying record changes materially after approval:

```text
Approval no longer applies
→ Review current record
→ Request fresh authorization if required
```

Do not apply stale approval to changed business state.

---

## 35. Integrity Issue

Integrity failure is materially different from ordinary error.

Recommended:

```text
Integrity issue detected
→ Block affected action
→ Preserve evidence
→ Escalate
```

Do not allow ordinary retry to bypass the block.

---

## 36. Integrity Escalation

B08 establishes escalation to a higher authority than the acting account, with Owner resolution/override according to policy.

The UX should show:

- affected record;
- blocked action;
- seriousness;
- responsible authority;
- next safe action.

Ordinary users do not need technical hash-chain details.

---

## 37. Technical Integrity Details

D10/D11 may provide technical evidence such as:

- event hashes;
- chain relationships;
- integrity verification;
- tamper detection.

C10 only specifies how those outcomes should be communicated in the product.

---

## 38. Blocked State

Blocked means the user cannot safely continue the affected operation.

Examples:

```text
Integrity issue
Permission restriction
Stock conflict
Invalid correction
Required authorization unavailable
```

Every blocked state should explain why and provide the safe next path.

---

## 39. Recovery

Recovery should be explicit:

```text
Retry
Review
Request approval
Resolve conflict
Open source record
Return to safe state
```

Avoid generic “Try again later” where a specific action is possible.

---

## 40. Loading

Use localized loading states:

```text
Loading customer
Calculating correction impact
Recording receipt
Synchronizing
Checking authorization
Resolving conflict
```

Avoid making the entire application appear frozen.

---

## 41. Processing

Processing means an action has been submitted.

The primary action should be protected from duplicate submission until its outcome is known or safely recoverable.

---

## 42. Empty States

Empty states should distinguish normal absence from failure.

Examples:

```text
No outstanding debts
No discrepancies
No sync conflicts
No pending approvals
```

Normal emptiness should not look like an error.

---

## 43. Error States

An error should explain:

```text
What failed
What was preserved
What the user can do next
```

Example:

> We couldn't load this product history. No inventory record was changed.

---

## 44. Partial Failure

Where a workflow can have independent outcomes, do not claim everything succeeded when only part did.

Use:

```text
Completed
Pending
Failed
Requires review
```

where applicable.

---

## 45. Business Effect Visibility

When a state transition affects business records, communicate the effect.

Examples:

> Sale recorded locally. Sync pending.

> Return approved. Customer obligation reduced.

> Correction rejected. Original sale unchanged.

> Conflict detected. No automatic overwrite was applied.

---

## 46. Source Record Access

Exceptional states should link back to the affected source record.

Examples:

```text
Sync conflict → Open sale
Inventory issue → Open product
Debt dispute → Open debt
Cash discrepancy → Open reconciliation
Correction → Open original transaction
Integrity issue → Open investigation
```

---

## 47. Management Attention

C04's management attention surface should expose actionable categories:

```text
Approvals
Discrepancies
Corrections
Conflicts
Integrity issues
Sync failures
```

These should be actionable rather than mere notification counts.

---

## 48. Notifications

Suggested semantic categories:

```text
Informational
Needs attention
Approval required
Blocked
Integrity / security
Offline
```

Not every offline or sync state is urgent.

---

## 49. Status Persistence

Important states must survive navigation.

For example:

```text
Sync pending
Conflict
Correction pending
Integrity issue
```

must not disappear merely because the user leaves the screen.

---

## 50. Cross-Device Awareness

Where multiple devices/users are supported, communicate changes made elsewhere.

Example:

> **This sale was updated on another device.**

If the change creates a conflict, route the user to deliberate resolution.

---

## 51. Connectivity Recovery

After temporary connection loss:

```text
Reconnecting
→ Reconnected
→ Pending actions synchronized
```

Do not automatically replay ambiguous actions without duplicate protection.

---

## 52. Interrupted Workflow Recovery

Where technically supported, preserve safe local work after interruption.

The user must not accidentally submit the same business action twice.

---

## 53. Draft vs Business Event

The UX must distinguish:

```text
Draft / working state
```

from:

```text
Recorded business event
```

An abandoned basket is not a completed sale.

---

## 54. Offline Draft

An offline draft must remain visibly a draft.

It must not be presented as:

- completed sale;
- successful payment;
- confirmed receiving;
- approved correction.

---

## 55. Uncertain Submission

If the user cannot tell whether an action succeeded, verification is safer than blind resubmission.

Recommended:

```text
Check Activity
→ Find source event
→ Confirm whether recorded
→ Continue safely
```

This is especially important for:

- sales;
- payments;
- receiving;
- repayments;
- corrections.

---

## 56. Activity as Verification

C04 establishes Activity as a cross-domain investigation surface.

C10 uses it to verify uncertain outcomes.

Example:

```text
Payment submission uncertain
→ Open Activity
→ Find source event
→ Confirm whether recorded
```

---

## 57. Auditability

State transitions must remain historically understandable.

Example:

```text
Offline sale recorded
→ Sync pending
→ Synchronized
```

or:

```text
Correction requested
→ Rejected
```

or:

```text
Conflict detected
→ Resolved by Manager
```

These state transitions must not erase underlying event history.

---

## 58. State Naming

Use business-readable labels.

Prefer:

- Sync pending
- Payment not confirmed
- Authorization required
- Needs review
- Conflict detected
- Integrity issue detected

Avoid exposing technical identifiers such as:

- `ERR_409`
- `NETWORK_FAIL`
- `HASH_MISMATCH`
- `STATE_INVALID`

to ordinary users.

---

## 59. Accessibility

State must never depend on color alone.

Use:

- text;
- icons where appropriate;
- semantic structure;
- focus management;
- accessible status announcements where needed.

C03 remains authoritative for final visual implementation.

---

## 60. Mobile Presentation

On small screens:

```text
Compact state indicator
→ Tap/open for detail
```

Critical status should remain visible without consuming the entire interface.

---

## 61. POS Integration

C10 standardizes C06 states:

```text
Offline
Payment pending
Payment not confirmed
Authorization required
Processing
Completed
Sync pending
Conflict
Permission denied
Integrity issue
Error
```

C06 remains authoritative for the normal sale workflow.

---

## 62. Inventory Integration

C10 standardizes C07 states:

```text
Offline receiving
Sync pending
Stock conflict
Inventory discrepancy
Correction pending
Integrity issue
```

C07 remains authoritative for normal inventory/purchasing workflows.

---

## 63. Customer & Credit Integration

C10 standardizes C08 states:

```text
Offline credit
Repayment pending
Credit authorization
Debt conflict
Debt correction
Dispute
Integrity issue
```

B03/C08 remain authoritative for credit/debt rules and UX.

---

## 64. Returns & Corrections Integration

C10 standardizes C09 states:

```text
Return pending approval
Settlement not confirmed
Correction pending
Correction rejected
Conflict
Integrity issue
```

C09 remains authoritative for return/correction exception workflows.

---

## 65. Money Integration

Cash/reconciliation states include:

```text
Count recorded
Discrepancy detected
Investigation
Resolution pending
Resolved
Sync pending
Conflict
```

B05 remains authoritative.

---

## 66. Global State Matrix

| State | Meaning | User action | Business effect |
|---|---|---|---|
| Online | Connectivity available | Continue | None by itself |
| Offline | No required connection | Continue supported work | None by itself |
| Local | Recorded on device | Continue/review | Local business record where supported |
| Sync Pending | Awaiting synchronization | Continue/review | Not yet synchronized |
| Synchronized | Sync completed | Continue | Synchronized record |
| Sync Failed | Sync did not complete | Retry/review | Depends on prior record state |
| Conflict | Automatic resolution unsafe | Resolve | No silent overwrite |
| Authorization Required | Higher authority needed | Request/obtain approval | No final effect until authorized |
| Pending Approval | Awaiting decision | Wait/review | Underlying state unchanged |
| Approved | Authority granted | Continue/apply | Depends on action |
| Rejected | Request refused | Review/exit | Underlying state unchanged |
| Permission Denied | User lacks authority | Request/exit | No business effect |
| Blocked | Safe execution cannot proceed | Resolve/escalate | No unsafe effect |
| Integrity Issue | Evidence may be compromised | Escalate | Affected action blocked |
| Error | Operation failed | Recover/retry | Depends on operation |
| Empty | No records/state | Create/navigate | None |
| Loading | Data/action in progress | Wait | Unknown until resolved |

---

## 67. Global Invariants

Across the entire application:

1. Offline must never silently bypass authorization.
2. Local recording must never be confused with external confirmation.
3. Unconfirmed payment must not become successful payment.
4. Failed/reversed attempts must not become successful business events.
5. Sync must never silently overwrite conflicting business history.
6. Errors must not create duplicate business events through blind retry.
7. Integrity failures must block affected operations and escalate.
8. Permission cannot be bypassed through navigation.
9. Original business history remains preserved.
10. Consequential corrections remain auditable.
11. Current state and historical evidence remain distinguishable.
12. Exceptional states remain visible until safely resolved.

---

## 68. Representative Flow — Offline Sale

```text
Start Sale
→ Add products
→ Confirm payment according to supported method
→ Complete Sale
→ Sale recorded locally
→ Show “Sync pending”
→ Later synchronization
→ Show “Synchronized”
```

If synchronization conflicts:

```text
Sync pending
→ Conflict detected
→ No overwrite
→ Resolve
→ Verify
```

---

## 69. Representative Flow — Unconfirmed Transfer

```text
Sale total entered
→ Transfer selected
→ Confirmation unavailable
→ Payment not confirmed
→ Sale cannot complete as a successful transfer sale
```

---

## 70. Representative Flow — Offline Credit

```text
Select customer
→ Credit status
→ Credit limit
→ Authorization
→ Complete sale
→ Local record
→ Sync pending
→ Management review if configured
→ Synchronized
```

---

## 71. Representative Flow — Sync Conflict

```text
Local record
+
Remote changed record
        ↓
Conflict detected
        ↓
Compare
        ↓
Review consequences
        ↓
Authorized resolution
        ↓
Apply
        ↓
Preserve conflict history
```

---

## 72. Representative Flow — Integrity Failure

```text
Integrity validation fails
→ Block affected action
→ Preserve evidence
→ Escalate
→ Authorized investigation
→ Owner resolution where permitted
→ Record resolution
```

---

## 73. Representative Flow — Permission Denial

```text
User selects consequential action
→ Permission check
→ Permission denied
→ Explain limitation
→ Offer management request where applicable
→ No business event created
```

---

## 74. Representative Flow — Uncertain Submission

```text
User submits sale
→ Connection fails
→ Outcome uncertain
→ Do not blindly resubmit
→ Check Activity/source record
→ Determine whether event exists
→ Continue only after outcome is understood
```

---

## 75. Acceptance Criteria

C10 is successful when:

- online/offline state is clear;
- offline is treated as supported where configured;
- local recording is distinguished from synchronization;
- successful payment is distinguished from payment attempt;
- unconfirmed transfer cannot silently complete a sale;
- failed/reversed attempts are not represented as successful business events;
- sync pending is visible;
- sync failure is actionable;
- duplicate submission is prevented;
- conflicts never silently overwrite business history;
- conflict resolution is authority-aware;
- offline authorization does not bypass permissions;
- permission denial is distinct from authorization required;
- rejected approvals leave underlying business state unchanged;
- integrity failures block affected actions;
- integrity issues escalate appropriately;
- loading/empty/error states are meaningful;
- uncertain outcomes lead to verification rather than blind resubmission;
- source records remain accessible from exceptional states;
- audit history remains intact;
- current state remains distinguishable from historical events;
- state vocabulary is consistent across POS, inventory, credit, returns, and money;
- technical details are hidden from ordinary users unless needed.

---

## 76. Reconciliation With Existing Deliverables

### C00
C00 establishes offline, conflict, auditability, deliberate consequential actions, and business truth as foundational UX principles. C10 standardizes them.

### C01
C01 establishes the application information architecture. C10 is cross-cutting and does not create a new navigation hierarchy.

### C02
C02 established offline and conflict journey variations. C10 standardizes their behavior.

### C03
C03 owns visual tokens and component states. C10 defines semantic meaning and business behavior.

### C04
C04 provides global system-state visibility and management attention. C10 defines the detailed state model.

### C06
C06 owns POS workflow. C10 standardizes exceptional POS states.

### C07
C07 owns inventory/purchasing workflow. C10 standardizes offline, conflict, sync, and integrity states.

### C08
C08 owns customer/credit workflow. C10 standardizes offline, repayment uncertainty, conflict, and authorization states.

### C09
C09 owns returns, corrections, and reconciliation exception workflows. C10 standardizes their cross-cutting offline, conflict, authorization, error, and integrity states.

### B03
B03 remains authoritative for credit/debt rules.

### B04
B04 remains authoritative for returns/refunds.

### B05
B05 remains authoritative for cash reconciliation.

### B07
B07 establishes transaction lifecycle and history preservation.

### B08
B08 establishes correction/exception rules.

### B09
B09 establishes permission and authorization rules.

### D07–D11
Technical specifications remain authoritative for offline architecture, synchronization, IDs/idempotency, audit trail, and integrity/hash mechanisms.

---

## 77. Historical Question Reconciliation

| Earlier question | Status | C10 treatment | Authority |
|---|---|---|---|
| Offline sales? | Resolved | Supported | B07/D07 |
| Offline core debt operations? | Resolved | Supported | B03 |
| Offline receiving/counting? | Resolved | Supported where configured | B06/D07 |
| Offline returns/corrections? | Resolved | Supported subject to authority | B04/B08 |
| Offline permissions? | Resolved | Cannot bypass authorization | B08/B09 |
| Sync conflicts? | Resolved | Never auto-overwrite | B08/D08 |
| Duplicate detection? | Resolved | Prevent duplicate submission + controlled duplicate handling | B08/D08 |
| Payment confirmation? | Resolved | Successful events only | B03/B04/B07 |
| General reversal transaction? | Resolved | Not a normal successful business event | B08 |
| Tamper detection? | Resolved | Block + escalate | B08/D11 |
| Hash-chain rationale? | Resolved | Technical detail remains D11 | D11 |
| Exact offline conflict algorithm? | Deferred | Not invented | D08 |
| Exact sync retry policy? | Deferred | Not invented | D08 |
| Exact local database behavior? | Deferred | Not invented | D07 |
| Exact connectivity detection? | Deferred | Not invented | D07 |
| Exact technical error codes? | Deferred | Not invented | D05/D08 |

---

## 78. Explicit Non-Decisions

C10 does not establish:

- synchronization algorithms;
- conflict-resolution algorithms;
- local database implementation;
- idempotency-key format;
- hash algorithms;
- API error codes;
- network retry intervals;
- exact connectivity detection;
- final permission IDs;
- accounting treatment;
- domain transaction states;
- final visual tokens;
- final copy.

---

## 79. Design Principle

The exceptional-state experience should feel like:

> **The system knows what happened, tells me what is uncertain, prevents me from making it worse, and gives the right person a safe way forward.**

Not:

> **The app failed, so I should click the button again and hope.**

---

## 80. Package C Status

```text
C00  UX & Design Foundation                 COMPLETE
C01  Information Architecture               COMPLETE
C02  User Journeys & Task Flows             COMPLETE
C03  Design System                           COMPLETE
C04  Application Shell & Navigation         COMPLETE
C05  Landing Page UX                         COMPLETE
C06  POS UX                                  COMPLETE
C07  Inventory & Purchasing UX               COMPLETE
C08  Customer & Credit UX                    COMPLETE
C09  Returns, Corrections & Reconciliation  COMPLETE
C10  Offline, Conflict & Exceptional States COMPLETE
C11  UX Validation & Redesign Audit          NEXT
```

**C11 is the final planned Package C deliverable. It should validate the existing work rather than reopen the product into another requirements cycle.**

---

# FINAL RECONCILIATION — BUSINESS DECISIONS APPLIED

This document must express the finalized business decisions: configurable 15-minute-default correction window; ordinary vs high-integrity corrections; Owner visibility for consequential Manager self-corrections; logged/reviewable transfer confirmation; core plus configurable payment methods; tax-aware totals; supplier-return settlement states; operational business-day sessions that may cross midnight; shared or individual cash custody; weighted-average costing; visible negative-stock exceptions; and Cash in Hand / Expected Cash / Actual Cash terminology.
