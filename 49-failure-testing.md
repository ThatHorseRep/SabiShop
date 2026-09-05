# Sabi Shop --- Failure & Resilience Testing

**Phase:** 7 --- Prove It Works\
**Status:** FINAL — RECONCILED V1

## 1. Purpose

Prove that failure does not corrupt business truth.

## 2. Network Failures

Test: - network disappears before commit; - network disappears during
commit; - network returns after local commit; - backend unavailable; -
repeated timeout; - partial synchronization batch failure.

Expected principle: the user must be able to determine whether the local
operation committed, and retries must be idempotent.

## 3. Device Failures

Test: - app termination after local write; - phone restart; - storage
pressure; - browser refresh; - device loss; - device replacement.

## 4. Concurrency Failures

Test simultaneous sales, repayments, stock receipts and corrections from
multiple devices.

## 5. Authorization Failures

Attempt direct unauthorized operations, stale-role operations and
self-approval.

## 6. Data Failures

Test malformed records, duplicate IDs, invalid quantities, impossible
monetary values and corrupted integrity metadata.

## 7. Financial Failures

Test interrupted cash reconciliation, failed refunds, partial payment
submission and correction after later business activity.

## 8. Recovery Failures

Test restore from backup, incomplete restore, migration failure and
recovery after a backend incident.

## 9. Expected Safety Rule

When the system cannot safely determine the correct state, it must
preserve evidence and surface the uncertainty rather than guess.

## 7. Reconciled Financial & Operational Failure Cases

Test all of the following as P0/P1 resilience cases:

- sale below recorded stock: sale behavior remains valid and negative stock becomes visible as an exception;
- weighted-average cost changes after a completed sale: historical COGS does not change;
- return after incentive accrual: incentive eligibility/value recalculates;
- incentive volume gate boundary: payout does not release below the configured qualifying-sale count;
- correction at 14:59 versus 15:00 under the default window, and equivalent behavior after a management-configured window change;
- Manager performs a consequential self-correction: Owner visibility/audit flag is generated;
- unconfirmed transfer: sale/payment cannot be treated as successful;
- custom payment method with cash classification: cash expectation changes; custom non-cash method does not;
- business remains open after midnight: the same operational business day continues until official close;
- physical cash count differs from Expected Cash: discrepancy remains visible and does not silently close;
- supplier return on unpaid purchase versus already-paid purchase: payable reduction and supplier credit/receivable semantics remain distinct;
- tax/VAT value is retained through sale, correction, return and reporting flows;
- Gross Profit calculation does not subtract discount twice.
