# Sabi Shop Dependency Graph

This graph is the integration contract for the build. Arrows point from a
dependency to the module that consumes it. A downstream module must not
redefine an upstream module's authority.

## 1. Module graph

```mermaid
flowchart TD
  M00["M00 Decision/spec control"] --> M01["M01 Domain primitives"]
  M00 --> M03["M03 Roles/permissions"]
  M01 --> M02["M02 Identity/sessions"]
  M01 --> M03
  M01 --> M04["M04 Audit/integrity"]
  M02 --> M03
  M03 --> M04
  M01 --> M05["M05 Catalogue/pricing/search"]
  M03 --> M05
  M04 --> M05
  M05 --> M06["M06 Customers/suppliers/payment methods"]
  M03 --> M06
  M04 --> M06
  M06 --> M07["M07 Sales/payments/credit/receipts"]
  M03 --> M07
  M04 --> M07
  M05 --> M07
  M01 --> M08["M08 Inventory/costing"]
  M07 --> M08
  M04 --> M08
  M08 --> M09["M09 Purchasing/supplier returns"]
  M06 --> M09
  M03 --> M09
  M04 --> M09
  M07 --> M10["M10 Customer returns/corrections"]
  M08 --> M10
  M03 --> M10
  M04 --> M10
  M07 --> M11["M11 Business day/cash/reconciliation"]
  M09 --> M11
  M10 --> M11
  M03 --> M11
  M04 --> M11
  M07 --> M12["M12 Incentives/reporting"]
  M08 --> M12
  M09 --> M12
  M10 --> M12
  M11 --> M12
  M04 --> M12
  M01 --> M13["M13 Offline sync/conflicts"]
  M02 --> M13
  M03 --> M13
  M04 --> M13
  M07 --> M13
  M08 --> M13
  M09 --> M13
  M10 --> M13
  M11 --> M13
  M12 --> M14["M14 Operations/localization/notifications"]
  M13 --> M14
  M04 --> M14
  M14 --> M15["M15 V1 integration/acceptance"]
  M13 --> M15
  M12 --> M15
  M11 --> M15
  M10 --> M15
  M09 --> M15
  M08 --> M15
  M07 --> M15
  M06 --> M15
  M05 --> M15
  M04 --> M15
  M03 --> M15
  M02 --> M15
  M01 --> M15
```

## 2. Contract boundaries

| Boundary | Authoritative owner | Consumers | Prohibited shortcut |
|---|---|---|---|
| Business/user/device identity | M02 | Every command and sync path | UI-selected business context without server validation |
| Role/approval decision | M03 | M04, M07–M13 | Treating hidden controls or offline status as permission |
| Historical evidence | M04 | All consequential modules, reports | Updating/deleting a completed record in place |
| Product identity and price | M05 | M06–M10 | Inventory or POS inventing SKU/price policy |
| Customer/supplier/payment classification | M06 | M07, M09–M12 | POS deciding whether a method is cash by label |
| Sale/payment/debt event | M07 | M08, M10–M13 | Inventory or reporting fabricating sale/payment truth |
| Inventory/cost | M08 | M07, M09, M10, M12, M13 | Quantity overwrite or recalculating prior COGS from current cost |
| Supplier liability/return | M09 | M08, M11, M12 | Recording a supplier return as a customer refund/cash event |
| Customer return/correction | M10 | M04, M07, M08, M11, M12, M13 | Calling a correction a deletion or silently reversing evidence |
| Cash/session truth | M11 | M12–M15 | Using performance revenue or a dashboard estimate as physical cash |
| Derived reporting/incentives | M12 | UX/operations | Mutating source records to make a report balance |
| Sync state/conflict | M13 | Every offline-capable module | Last-write-wins for consequential records without preserved evidence |
| Operational messaging/recovery | M14 | Users, release controls | Swallowing failures or exposing secrets in logs/messages |

## 3. Required state/data flow

```mermaid
flowchart LR
  UI["Client UI"] --> CMD["Authorized domain command"]
  CMD --> SRC["Authoritative event/record"]
  SRC --> AUD["M04 audit/integrity"]
  SRC --> DER["Derived read models"]
  CMD --> LOCAL["Durable local event"]
  LOCAL --> SYNC["M13 sync"]
  SYNC --> CMD
  SYNC --> CONFLICT["Preserved conflict/review"]
  DER --> REPORT["M12 reports/incentives"]
  SRC --> RECEIPT["Receipt/notification projections"]
```

The client may optimize reads and queue writes, but only the authoritative
command boundary can accept consequential business truth. Local state must
retain enough metadata to explain whether it is local, pending, synchronized,
retrying, conflicting, rejected, or superseded.

## 4. Integration order and evidence

1. M00–M04 establish IDs, tenant boundaries, authorization, audit, and state
   transitions before feature commands.
2. M05–M06 establish stable references and classifications before sales or
   purchasing.
3. M07–M11 implement source events and cross-domain effects. Each slice must
   include its failure and authorization tests before the next slice consumes
   it.
4. M12 reads source events only; M13 can transport events but cannot bypass M03
   or M04.
5. M14 supplies recovery/operations evidence; M15 rejects a release when any
   upstream contract is unverified.

## 5. Handoff dependency checklist

Before handing a module downstream, provide:

- module ID, owner, scope, and forbidden responsibilities;
- versioned public interfaces and migration/schema changes;
- inputs/outputs and authoritative versus derived fields;
- state transitions, invariants, authorization and self-approval behavior;
- local/offline/retry/conflict behavior and reporting consequences;
- normal, failure, security, and recovery test evidence;
- known limitations and unresolved decisions;
- consumer-facing compatibility notes and the next integration test.

