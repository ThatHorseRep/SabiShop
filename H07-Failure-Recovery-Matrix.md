# H07 — Failure & Recovery Matrix

**Status:** Pre-build hardening draft

| Failure                                     | Required behavior                                              | Must not happen                                | Evidence                |
|---------------------------------------------|----------------------------------------------------------------|------------------------------------------------|-------------------------|
| Network disappears before sale completion   | Save/recover according to offline rules                        | Duplicate or fabricated completion             | Client event ID + state |
| Network disappears after completion request | Reconcile using same event identity                            | Second sale on retry                           | Idempotency record      |
| Payment confirmation unavailable            | Keep payment uncertain/pending                                 | Treat attempt as success                       | Payment state           |
| Duplicate submission                        | Return/reuse prior result                                      | Double stock/cash/debt effect                  | Idempotency             |
| Two devices sell same stock                 | Apply defined concurrency/conflict behavior                    | Silent overwrite                               | Versions/events         |
| Offline debt update conflicts               | Preserve conflict and escalate when material                   | Silent balance overwrite                       | Conflict record         |
| Sync interrupted                            | Resume safely                                                  | Lost or duplicated events                      | Sync operation          |
| App killed mid-operation                    | Recover durable operation state                                | Assume UI state was authoritative              | Local operation record  |
| Device restarted                            | Resume/reconcile pending work                                  | Recreate operations                            | Stable event identity   |
| Stale authorization                         | Reject/revalidate                                              | Use expired authority                          | Authorization decision  |
| Permission revoked while offline            | Apply defined stale-authority policy; do not invent authority  | Permanent bypass                               | Permission/auth context |
| Cash discrepancy                            | Preserve variance for investigation                            | Rewrite source records                         | Reconciliation          |
| Inventory discrepancy                       | Preserve count and investigate                                 | Overwrite ledger                               | Count + adjustment      |
| Missing sale discovered                     | Record appropriate corrective business event                   | Arbitrary cash/stock adjustment                | Correction/event chain  |
| Return rejected                             | Leave underlying sale unchanged                                | Mutate stock/debt/payment                      | Return decision         |
| Correction rejected                         | Leave underlying record unchanged                              | Partial correction                             | Authorization + result  |
| Database unavailable                        | Fail safely and follow recovery mode                           | Claim durable success without durability       | Operational logs        |
| Data corruption detected                    | Stop affected operations and restore/reconcile                 | Continue silently                              | Integrity alert         |
| Device lost                                 | Protect server data and revoke/expire device access as defined | Expose business data indefinitely              | Device/session records  |
| Backup restore                              | Restore to known consistent state and validate                 | Declare recovery complete without verification | Restore test evidence   |

## Recovery hierarchy

1.  Preserve durable evidence.
2.  Prevent duplicate or contradictory effects.
3.  Establish authoritative state.
4.  Reconcile projections.
5.  Surface unresolved exceptions.
6.  Escalate where human judgment is required.
7.  Record recovery actions.

## Reliability tests

At minimum test:

- network loss at each transaction stage;
- timeout after server acceptance;
- duplicate retry;
- app kill;
- device restart;
- stale client;
- concurrent edits;
- partial sync;
- database failure;
- restore from backup;
- corrupted local state.
