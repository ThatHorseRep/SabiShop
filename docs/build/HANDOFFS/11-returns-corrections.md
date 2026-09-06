# Handoff 11 — Returns, Refunds, Corrections and Reversals

**Status:** IMPLEMENTED DOMAIN SLICE  
**Date:** 2026-09-06  
**Module:** M10 — Customer returns, refunds, and corrections

## Scope

This slice implements the integrity operations that coordinate an existing
completed sale with downstream inventory, credit, financial-reporting, audit,
and synchronization consequences. It does not replace the sales, inventory,
finance, credit, purchasing, or authorization engines.

The public seam is `src/domain/returnsCorrections.ts`:

- request, verify, approve, reject, and apply customer returns;
- record refund `due` and `settled` states without executing money movement;
- correct minor and material sale records through additive evidence;
- reverse a completed sale through the existing sales reversal boundary;
- expose audit history, Owner review flags, report effects, and sync state.

## Business rules implemented

- The original completed sale, actor, values, and completion time remain
  available in an immutable snapshot.
- Every correction and reversal requires a reason and records actor, role,
  time, original state, corrected state, authorization, and downstream event
  IDs.
- The ordinary correction window is configurable and defaults to 15 minutes
  from sale completion.
- Ordinary, non-material corrections may be made by the original salesperson
  inside the window or by Manager/Owner after it expires.
- Material corrections affecting quantity, payment, inventory, finance, or
  credit are additive corrective events and require management authority.
- Protected customer identity and salesperson attribution corrections are
  classified as high-integrity and require elevated authority.
- Manager self-correction of a consequential sale is flagged for Owner review;
  a Manager cannot satisfy separate approval requirements alone.
- A material correction is blocked when a dependent applied return or reversal
  already exists, instead of manufacturing compensating history.
- Rejected returns remain in history and have no inventory, financial, credit,
  or settlement effect.

## Return and refund behavior

- Returns follow `requested -> verified -> approved -> applied -> settled`,
  with rejection available from `requested` or `verified`.
- Verification and approval require Manager/Owner authority; approval is
  separate from the requester.
- Partial returns are supported and are linked to the original sale lines.
- Applied returns add inventory customer-return movements using the approved
  `sellable` or `held` condition.
- Return effects recalculate reporting totals, tax, COGS, and gross profit.
- Credit returns reduce the customer debt through the existing credit ledger
  while preserving sale and repayment history.
- Refund money is never executed. A fully or partly non-credit return records
  a refund as `due`; settlement records the stated method/reference and moves
  only that settlement state to `settled`.

## Authorization and tenant boundaries

- Every record is keyed by `businessId`, and sale lookup is business-scoped.
- Staff may request a correction or return but cannot approve or apply the
  consequential action.
- Manager/Owner authority is enforced in the domain engine for this slice.
- The authoritative session/device/business policy in `src/auth` remains the
  outer boundary; this engine does not bypass or replace it.
- Offline operation records local state, and accepted authority must still be
  rechecked by the authoritative service during synchronization.

## Historical, audit, and offline behavior

- Corrections and reversals never delete or overwrite the original sale object.
- Audit events retain the original snapshot, corrected snapshot, actor, reason,
  times, severity, authorization, owner-review flag, and downstream references.
- Duplicate client event IDs return the original correction without another
  inventory, report, credit, or audit effect.
- Offline records start as `local_only`, can move to `pending_sync`, and become
  `accepted` only after explicit acknowledgement.
- Conflicts remain downstream work; no accepted history is automatically
  overwritten.

## Reporting and recalculation

`getReportingSnapshot` derives current accepted totals from authoritative sales
report events plus additive return/correction events. It recalculates:

- total due;
- tax;
- COGS;
- gross profit;
- cash, non-cash, and credit effects.

The reporting view is derived, never source truth. Historical sale and audit
records remain independently inspectable.

## Files changed

- `src/domain/returnsCorrections.ts`
- `src/domain/returnsCorrections.test.ts`
- `docs/build/HANDOFFS/11-returns-corrections.md`
- `docs/build/BUILD-STATUS.md`

## Verification

`src/domain/returnsCorrections.test.ts` covers:

- ordinary correction inside the window;
- ordinary correction outside the 15-minute default;
- unauthorized correction;
- material correction with inventory, financial, and reporting recalculation;
- high-integrity customer identity correction requiring Owner authority;
- consequential Manager self-correction visibility to Owner;
- approved customer return;
- refund `due` and `settled` states;
- unauthorized return approval;
- credit recalculation and preserved credit history;
- material correction after a dependent return;
- duplicate correction and offline retry idempotency;
- controlled reversal without deleting sale history.

Required validation:

```text
npm test                                      PASS (74 tests)
npm run lint                                  PASS
npm run build                                 PASS
npx prettier --check <returns/corrections>    PASS
```

## Known limitations

- This is an in-memory domain engine. Durable transactions, database
  persistence, API envelopes, and server-side sync storage are downstream.
- Material corrections currently implement quantity and payment adjustments as
  coordinated additive evidence. Broader field-specific correction workflows
  and corrected receipts remain downstream.
- Refund settlement records stated evidence only; Sabi Shop does not execute
  or verify external money movement.
- Cash reconciliation integration and incentive recalculation/release are not
  implemented here.
- Offline conflicts are represented as a distinct future state; automatic
  conflict resolution is intentionally absent.
- The domain role checks do not replace the authoritative session/device
  authorization service.

## Unresolved decisions

- Exact UI presentation for correction severity, Owner review, and refund
  settlement.
- Exact reconciliation treatment for each configurable refund method.
- Treatment of already-released incentives after a later return or correction.
- Durable conflict-resolution workflow and API contracts.

## Excluded modules

- No incentive payout logic.
- No supplier return or supplier settlement behavior.
- No cash reconciliation engine.
- No general customer wallet or stored return credit.
- No deletion, destructive restoration, or direct historical edit.
