# Sabi Shop --- Data Model & Schema Specification

**Phase:** 6 --- Technical Build Specification\
**Status:** Consolidation Specification\
**Authority:** Existing D02 Data Model & Database Specification.

## 1. Purpose

Define the persistent domain model required by approved business rules.

## 2. Domain Entities

The model must represent at minimum: - businesses; - users; - business
memberships/roles; - devices; - products/SKUs; - inventory movements and
balances; - sales; - sale items; - payments; - customers; - customer
debts; - repayments; - suppliers; - purchases/receipts; - supplier
liabilities; - supplier payments; - returns/refunds; - cash movements; -
shifts; - corrections; - incentives; - audit events; - synchronization
metadata; - integrity metadata.

## 3. Event Preservation

Historical events are immutable in principle. Current derived state may
be materialized for performance but must be reconstructable from
authoritative records.

## 4. Money

Monetary values require explicit precision/rounding rules. Currency must
not be represented with unsafe floating-point semantics.

## 5. Relationships

Every business-owned record must be scoped to a business. Sales link to
their items, payments, customer/debt context, staff attribution,
inventory effects and audit history as applicable.

## 6. Historical Snapshots

Sale items retain the historical cost basis needed for accurate later
performance reporting.

## 7. Inventory

Inventory quantity is derived from accepted movements rather than
destructive edits to a single quantity field.

## 8. Audit

Material state transitions reference their audit evidence.

## 9. Offline

Records include identifiers and synchronization metadata sufficient for
idempotent replication and conflict investigation.

## 10. Schema Governance

Schema changes require migration planning and must preserve historical
meaning.
