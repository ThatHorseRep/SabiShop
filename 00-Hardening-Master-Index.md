# Sabi Shop — Pre-Build Hardening Master Index

**Status:** Draft for final clarification and consolidation  
**Source of truth:** `SabiShopProductBible.md`
(`1.0-final-reconciled-v1`, 2026-09-04)

## Purpose

This hardening package does not replace the Product Bible. It converts
the Bible’s distributed business rules and technical intentions into
implementation-grade contracts, tests, ownership boundaries, and
explicit remaining decisions.

## Deliverables

| ID  | Deliverable                       | Purpose                                                                | Gate                 |
|-----|-----------------------------------|------------------------------------------------------------------------|----------------------|
| H01 | Domain Invariants                 | Formal business truths that must never be violated                     | P0                   |
| H02 | Canonical State Machines          | Explicit lifecycle states and legal/illegal transitions                | P0                   |
| H03 | Authorization Matrix              | Operation-level authority and separation of duties                     | P0                   |
| H04 | Tenant Isolation                  | Business-context isolation and enforcement model                       | P0                   |
| H05 | Financial Metric Contracts        | Canonical formulas, sources, timing, exclusions and reconciliation     | P0                   |
| H06 | Offline/Sync Conflict Doctrine    | Local persistence, idempotency, ordering, conflicts and recovery rules | P0                   |
| H07 | Failure & Recovery Matrix         | Failure modes, expected behavior, recovery and evidence                | P0                   |
| H08 | Security Threat-to-Control Matrix | Threats mapped to controls, enforcement and tests                      | P1                   |
| H09 | Requirements Traceability         | Requirement → rule → invariant → implementation → test chain           | P0                   |
| H10 | Pre-Build Gate                    | Objective readiness criteria before production feature construction    | P0                   |
| H11 | Clarification Register            | All decisions the Bible cannot safely determine                        | Final input required |

## Consolidation rule

No document is considered final until the answers in H11 are applied
consistently across every affected document.

Resolved business decisions must not be reopened merely because an older
historical artifact calls them open.

## Existing authority

- B03: Credit/Debt
- B04: Returns/Refunds
- B05: Cash/Reconciliation
- B06: Inventory/Costing
- B07: Transaction lifecycle/history
- B08: Corrections/Exceptions
- B09: Roles/Permissions
- D02+: technical implementation
- F-series: QA/verification

## Hardening principle

**Business truth first; technical mechanism second; UI expression third;
tests prove all three remain aligned.**
