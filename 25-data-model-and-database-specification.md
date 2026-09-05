# D02 --- Data Model & Database Specification

**Product:** Sabi Shop\
**Package:** D --- Technical Implementation Specifications\
**Status:** DATA FOUNDATION / PLAN-OF-RECORD\
**Depends on:** D01, B03--B09, C00--C11, F00\
**Next dependencies:** D03--D11\
**Purpose:** Define the durable relational data model, integrity
constraints, ownership boundaries, state representation, and database
rules required to implement Sabi Shop without losing business evidence
or creating contradictory financial/inventory truth.

------------------------------------------------------------------------

# 1. Purpose

D02 translates the architectural boundaries established by D01 into a
database-level model.

D01 established that Sabi Shop should be a modular business system
rather than a collection of screens and arbitrary database mutations. It
also established explicit ownership for sales, payments, inventory,
credit/debt, cash/reconciliation, returns/corrections, authorization,
reporting, audit/integrity, and offline/sync.
fileciteturn1file0L104-L145

D02 now defines:

-   core entities;
-   relationships;
-   ownership;
-   identifiers;
-   lifecycle/state storage;
-   monetary representation;
-   inventory representation;
-   debt representation;
-   cash/reconciliation representation;
-   correction relationships;
-   authorization records;
-   offline/sync records;
-   audit references;
-   constraints and indexes;
-   deletion/retention rules;
-   migration principles.

This document intentionally does **not** fix every physical
implementation detail. Where a choice affects the exact database engine,
migration tooling, encryption mechanism, or vendor-specific feature, the
implementation must be selected and documented without weakening the
invariants defined here.

------------------------------------------------------------------------

# 2. Data Architecture North Star

> **Every consequential number and business state must be explainable
> from durable records, with clear ownership, relationships, and
> history.**

The database must make it difficult to create invalid business states.

It must not rely on application developers remembering every rule
manually.

------------------------------------------------------------------------

# 3. Source-of-Truth Hierarchy

The data model must respect the hierarchy established by C11:

1.  **Business truth** --- B03--B09
2.  **UX truth** --- C00--C11
3.  **Technical truth** --- Package D

C11 explicitly states that Package D defines implementation mechanisms
such as persistence, identifiers, authorization enforcement, audit
storage, integrity mechanisms, error codes, and database behavior.
fileciteturn1file9L1545-L1597

Therefore:

-   the database must enforce approved business invariants;
-   the schema must not invent a different business meaning;
-   UX terminology must remain aligned with the underlying data
    concepts;
-   later technical details must preserve the approved business
    behavior.

------------------------------------------------------------------------

# 4. Database Model Direction

D01 recommends a transactional relational database capable of strong
constraints, transactional updates, reporting queries, audit
relationships, and indexed search.

The logical model should be normalized around authoritative business
entities.

Read-optimized projections may exist for reporting and operational
performance, but they must be derived from authoritative records rather
than becoming competing sources of truth.

D01 explicitly states that reporting should consume authoritative
records rather than create competing business truth.
fileciteturn1file2L320-L336

------------------------------------------------------------------------

# 5. Universal Data Rules

## 5.1 Every business-owned record has an owner

Every business-scoped record must be associated with the correct
business/shop context.

A record must never become accessible to another business merely because
an identifier is guessed or supplied.

------------------------------------------------------------------------

## 5.2 Primary identifiers are opaque

Business records should use stable opaque identifiers rather than
relying on meaningful sequential IDs as public identifiers.

Examples:

-   UUID;
-   UUIDv7;
-   another stable opaque identifier strategy.

The exact identifier format should be standardized in D05/D07 where
needed.

Public identifiers must not expose sensitive internal sequencing
unnecessarily.

------------------------------------------------------------------------

## 5.3 Timestamps

Consequential records should carry sufficient timestamps to distinguish:

-   when the event was created;
-   when it was submitted;
-   when it was accepted;
-   when it was corrected;
-   when it synchronized.

The exact timestamp columns vary by entity.

Store timestamps in a consistent canonical representation and render
local business time at the UI boundary.

------------------------------------------------------------------------

## 5.4 Actor attribution

Consequential records must identify the actor responsible for the
operation where an authenticated actor exists.

Do not depend solely on a mutable display name.

Use stable actor/user identifiers plus audit evidence.

------------------------------------------------------------------------

## 5.5 Soft deletion is not a history strategy

Soft deletion is appropriate for selected configuration/reference
records where policy permits it.

It is **not** a substitute for transaction history.

Material sales, payments, debt events, stock movements, returns,
corrections, reconciliation events, and audit evidence must not be made
invisible through ordinary deletion.

------------------------------------------------------------------------

## 5.6 Foreign-key integrity

Relationships that are required for business interpretation must be
protected by foreign keys or equivalent database constraints.

Application code alone should not be the only protection against
orphaned consequential records.

------------------------------------------------------------------------

# 6. Core Entity Map

The initial logical entity set is:

``` text
Business
 ├── Shop / Business Settings
 ├── User Membership
 │     └── Role Assignment
 │
 ├── Product
 │     └── Inventory / Stock
 │
 ├── Customer
 │     └── Credit Account
 │            └── Debt Obligation
 │                   └── Repayment
 │
 ├── Sale
 │     ├── Sale Line
 │     ├── Payment
 │     ├── Return
 │     └── Correction
 │
 ├── Money-Out
 ├── Cash Session
 │     ├── Expected Cash
 │     ├── Physical Count
 │     └── Reconciliation
 │
 ├── Authorization Request
 ├── Audit Event
 └── Sync / Offline Operation
```

This is a logical entity map, not a final SQL schema.

------------------------------------------------------------------------

# 7. Business / Shop Entities

## 7.1 `business`

Represents the top-level business tenant.

Core attributes:

-   `id`
-   `name`
-   `status`
-   `created_at`
-   `updated_at`

Potential future attributes:

-   business contact information;
-   localization;
-   currency;
-   timezone;
-   subscription/account state.

Business-level settings should not be duplicated unnecessarily into
every child record.

------------------------------------------------------------------------

## 7.2 `shop`

If a business can contain one or more physical shops/locations, `shop`
represents an operational location.

Core attributes:

-   `id`
-   `business_id`
-   `name`
-   `status`
-   `created_at`
-   `updated_at`

If V1 operates as one shop per business, the model may still retain a
clean separation so future multi-shop support does not require rewriting
every ownership boundary.

Do not prematurely expose multi-shop UX if it is not in approved scope.

------------------------------------------------------------------------

# 8. User / Role Entities

## 8.1 `user`

Represents the authenticated person/account.

Core attributes:

-   `id`
-   authentication/provider reference;
-   display name;
-   status;
-   created/updated timestamps.

Authentication secrets should not be stored in ordinary application
tables unless explicitly required by the chosen identity architecture.

------------------------------------------------------------------------

## 8.2 `business_membership`

Associates a user with a business.

Core attributes:

-   `id`
-   `business_id`
-   `user_id`
-   `status`
-   `created_at`
-   `updated_at`

Unique constraint:

``` text
(business_id, user_id)
```

------------------------------------------------------------------------

## 8.3 `role_assignment`

Associates a membership with an approved role.

Core attributes:

-   `id`
-   `business_membership_id`
-   `role`
-   `assigned_by`
-   `assigned_at`
-   `revoked_at` where applicable

Role changes are consequential access events and should be auditable.

The exact role taxonomy belongs to B09/D04.

------------------------------------------------------------------------

# 9. Product & Catalog Entities

## 9.1 `product`

Represents a sellable/inventoriable product.

Core attributes:

-   `id`
-   `business_id`
-   `sku` where applicable;
-   `name`
-   `description` where applicable;
-   `status`
-   `unit_of_measure` where required;
-   pricing fields according to the approved pricing model;
-   created/updated timestamps.

Uniqueness should be scoped to business.

For example:

``` text
unique(business_id, sku)
```

where SKU is required.

------------------------------------------------------------------------

## 9.2 Product status

Use explicit status values rather than deleting products that have
historical transactions.

Example states:

-   active;
-   inactive;
-   archived.

A product with historical sales must remain referentially available to
historical records even if it is no longer sellable.

------------------------------------------------------------------------

# 10. Inventory Model

Inventory should be movement-oriented.

D01 requires that current stock be explainable through historical
stock-affecting events. fileciteturn1file7L1300-L1324

## 10.1 `inventory_balance`

Represents the current operational stock projection for a
product/location.

Core attributes:

-   `id`
-   `business_id`
-   `shop_id`
-   `product_id`
-   `quantity`
-   version/concurrency field
-   updated timestamp

Uniqueness:

``` text
unique(shop_id, product_id)
```

This is a current-state projection.

It must not become the only evidence of how stock reached its current
quantity.

------------------------------------------------------------------------

## 10.2 `inventory_movement`

Represents a stock-affecting business event.

Core attributes:

-   `id`
-   `business_id`
-   `shop_id`
-   `product_id`
-   movement type;
-   quantity;
-   direction;
-   unit cost where applicable;
-   source type;
-   source id;
-   occurred_at;
-   actor id;
-   created_at.

Examples of movement sources:

-   receiving;
-   sale;
-   return;
-   approved adjustment;
-   correction;
-   other approved stock movement.

A movement should point to the business event that caused it.

------------------------------------------------------------------------

## 10.3 `stock_count`

Represents a physical stock count operation.

Core attributes:

-   `id`
-   `business_id`
-   `shop_id`
-   status;
-   counted_by;
-   counted_at;
-   submitted_at;
-   reviewed_at where applicable.

------------------------------------------------------------------------

## 10.4 `stock_count_line`

Represents the counted quantity for a product.

Core attributes:

-   `id`
-   `stock_count_id`
-   `product_id`
-   expected quantity;
-   counted quantity;
-   variance;
-   resolution state;
-   resolution reference where applicable.

The expected quantity must be traceable to the inventory state at the
relevant point in time.

------------------------------------------------------------------------

## 10.5 Negative stock invariant

Negative stock is not a normal operating state.

C11 explicitly defines negative stock as an exception that must be
flagged and routed toward reconciliation or authorized resolution.
fileciteturn1file9L1630-L1635

Therefore:

-   ordinary completed sale processing should not intentionally create
    negative inventory;
-   database/application invariants should reject or quarantine invalid
    stock-changing operations according to B06/B07;
-   an already detected inconsistency must remain visible and traceable;
-   correction must not hide the original event.

------------------------------------------------------------------------

# 11. Purchasing / Receiving Model

## 11.1 `inventory_receipt`

Represents receiving inventory into the business.

Core attributes:

-   `id`
-   `business_id`
-   `shop_id`
-   supplier/reference information where applicable;
-   receipt status;
-   received_at;
-   recorded_by;
-   total cost where applicable;
-   created_at.

------------------------------------------------------------------------

## 11.2 `inventory_receipt_line`

Core attributes:

-   `id`
-   `receipt_id`
-   `product_id`
-   quantity;
-   unit cost;
-   line total;
-   inventory movement reference.

The receiving event must be distinguishable from a merely planned or
intended purchase.

------------------------------------------------------------------------

# 12. Cost Representation

Money and cost values must not use floating-point storage.

Use a fixed-precision numeric strategy or integer minor-unit
representation consistently.

The selected strategy must:

-   avoid binary floating-point errors;
-   support exact financial calculations;
-   define rounding;
-   define currency precision;
-   remain consistent across API, database, and reporting.

The exact implementation strategy should be finalized in the
financial/data implementation work without changing business meaning.

------------------------------------------------------------------------

# 13. Sale Model

## 13.1 `sale`

Represents the sale aggregate/lifecycle.

Core attributes:

-   `id`
-   `business_id`
-   `shop_id`
-   `customer_id` where applicable;
-   sale status;
-   subtotal;
-   discount total where applicable;
-   tax total where applicable;
-   grand total;
-   payment state;
-   created_at;
-   completed_at;
-   created_by;
-   version/concurrency field.

Do not overload one `status` field with unrelated concerns if separate
lifecycle dimensions are required.

------------------------------------------------------------------------

## 13.2 `sale_line`

Core attributes:

-   `id`
-   `sale_id`
-   `product_id`
-   quantity;
-   unit price;
-   discount where applicable;
-   line total;
-   relevant cost snapshot where required by reporting/accounting rules.

Historical sale lines should retain enough information to explain the
original sale even if the product's current price later changes.

------------------------------------------------------------------------

# 14. Sale State

The exact lifecycle is governed by B07, but the data model must be able
to distinguish states such as:

-   draft/local work;
-   pending;
-   completed;
-   failed;
-   cancelled where policy permits;
-   correction-related state where required.

Do not use a boolean such as:

``` text
is_completed
```

as the only lifecycle representation.

D01 requires explicit business states where external operations or
failures prevent atomic completion. fileciteturn1file7L1239-L1262

------------------------------------------------------------------------

# 15. Payment Model

## 15.1 `payment`

Represents a payment business record/attempt and its lifecycle.

Core attributes:

-   `id`
-   `business_id`
-   `sale_id` where payment is sale-related;
-   payment method;
-   amount;
-   currency;
-   state;
-   external reference where applicable;
-   idempotency reference;
-   attempted_at;
-   confirmed_at;
-   created_at;
-   actor/context.

The exact provider fields belong to D05.

------------------------------------------------------------------------

## 15.2 Payment state

The model must distinguish at least:

-   initiated/attempted;
-   pending/unconfirmed;
-   successful;
-   failed/rejected;
-   reversed where applicable.

C11 requires unsuccessful, abandoned, unconfirmed, and reversed payment
attempts not to appear as successful transfers or completed sales.
fileciteturn1file9L1636-L1640

Therefore:

> `payment_attempt_exists` must never be interpreted as
> `payment_successful`.

------------------------------------------------------------------------

## 15.3 External references

External provider transaction IDs must be stored separately from
internal identifiers.

Where the provider guarantees uniqueness, enforce appropriate uniqueness
within the relevant provider scope.

Never use a provider reference as the only internal primary key.

------------------------------------------------------------------------

# 16. Split / Multiple Payments

If approved by the business rules, a sale may relate to multiple payment
records.

Therefore:

``` text
sale 1 ──── * payment
```

The sale's payment state should be derived from the approved lifecycle
rules.

Do not store only one payment amount on the sale when multiple payment
records are supported.

------------------------------------------------------------------------

# 17. Customer Model

## 17.1 `customer`

Core attributes:

-   `id`
-   `business_id`
-   name;
-   phone/contact fields where permitted;
-   status;
-   created_at;
-   updated_at.

Customer identity must be scoped to the business.

Do not assume a phone number is globally unique across all businesses.

------------------------------------------------------------------------

# 18. Credit Account

## 18.1 `credit_account`

Represents the customer's credit relationship.

Core attributes:

-   `id`
-   `business_id`
-   `customer_id`
-   status;
-   credit limit;
-   created_at;
-   updated_at.

Uniqueness:

``` text
unique(business_id, customer_id)
```

if the business model permits one primary credit account per customer.

------------------------------------------------------------------------

# 19. Debt Model

## 19.1 `debt_obligation`

Represents an explicit financial obligation.

Core attributes:

-   `id`
-   `business_id`
-   `customer_id`
-   source type;
-   source id;
-   original amount;
-   outstanding amount or derived balance;
-   state;
-   created_at;
-   settled_at where applicable.

D01 explicitly requires debt to represent an explicit business
obligation rather than merely replacing a customer balance field.
fileciteturn1file8L1339-L1362

------------------------------------------------------------------------

## 19.2 `repayment`

Represents a repayment event.

Core attributes:

-   `id`
-   `business_id`
-   `customer_id`
-   amount;
-   payment method;
-   state;
-   occurred_at;
-   recorded_by;
-   source/reference;
-   created_at.

------------------------------------------------------------------------

## 19.3 `repayment_allocation`

If a repayment can be allocated across multiple obligations:

-   `id`
-   `repayment_id`
-   `debt_obligation_id`
-   allocated_amount.

Constraint:

``` text
sum(allocations) <= repayment amount
```

and allocations must never exceed the outstanding amount permitted by
the governing business rules.

------------------------------------------------------------------------

# 20. Returns

## 20.1 `return`

Represents a return operation linked to an original sale.

Core attributes:

-   `id`
-   `business_id`
-   `sale_id`
-   customer where applicable;
-   return status;
-   reason;
-   refund/settlement state;
-   created_by;
-   approved_by where applicable;
-   created_at;
-   completed_at.

------------------------------------------------------------------------

## 20.2 `return_line`

Core attributes:

-   `id`
-   `return_id`
-   `sale_line_id`
-   quantity;
-   approved quantity;
-   inventory consequence;
-   refund consequence.

A return must not modify the original sale line in a way that destroys
the original evidence.

------------------------------------------------------------------------

# 21. Corrections

## 21.1 `correction_request`

Represents a request to alter business state through the approved
correction process.

Core attributes:

-   `id`
-   `business_id`
-   target entity type;
-   target entity id;
-   reason;
-   requested changes;
-   status;
-   requested_by;
-   requested_at;
-   reviewed_by;
-   reviewed_at;
-   resulting correction reference.

The exact representation of requested changes should be chosen
carefully; arbitrary JSON mutation should not become an excuse to bypass
domain rules.

------------------------------------------------------------------------

## 21.2 `correction_event`

Represents the approved business consequence.

Core attributes:

-   `id`
-   `business_id`
-   correction_request_id;
-   target entity;
-   original event/reference;
-   resulting event/reference;
-   correction type;
-   occurred_at;
-   actor;
-   authorization reference.

D01 requires corrections to be new controlled operations whose
relationship to the original event remains discoverable.
fileciteturn1file8L1391-L1414

------------------------------------------------------------------------

# 22. Cash & Reconciliation Model

## 22.1 `cash_session`

Represents the operational reconciliation period/context.

Core attributes:

-   `id`
-   `business_id`
-   `shop_id`
-   opened_at;
-   closed_at;
-   opened_by;
-   closed_by;
-   status.

------------------------------------------------------------------------

## 22.2 Expected cash

Expected cash should be represented as a derived/reconciliable value
from cash-affecting business events.

Where persisted as a snapshot for performance or close operations,
retain the calculation context.

D01 explicitly separates expected cash from physical cash and requires
reconciliation not to rewrite the events that produced expected cash.
fileciteturn1file8L1366-L1387

------------------------------------------------------------------------

## 22.3 `cash_count`

Represents physical cash counting.

Core attributes:

-   `id`
-   `cash_session_id`
-   counted_by;
-   counted_at;
-   physical_amount;
-   notes;
-   status.

This is the physical observation.

------------------------------------------------------------------------

## 22.4 `reconciliation`

Represents the comparison and resolution process.

Core attributes:

-   `id`
-   `cash_session_id`
-   expected_amount;
-   counted_amount;
-   variance;
-   explanation;
-   status;
-   submitted_by;
-   reviewed_by;
-   reviewed_at.

The reconciliation record must not rewrite the underlying
sale/payment/money-out records.

------------------------------------------------------------------------

## 22.5 Staff terminology implication

The database should preserve distinct concepts so the UI can maintain
the approved terminology.

C11 specifies that sales staff record sales and money-out activity,
physically count cash at close, and use reconciliation to determine
whether physical cash tallies with expected cash. It therefore rejects
an ordinary staff "Actual Cash" dashboard truth.
fileciteturn1file9L1642-L1648

------------------------------------------------------------------------

# 23. Money-Out

## 23.1 `money_out`

Represents a cash-affecting expense/outflow recorded according to
approved policy.

Core attributes:

-   `id`
-   `business_id`
-   `shop_id`
-   amount;
-   category;
-   reason/description;
-   occurred_at;
-   recorded_by;
-   status;
-   cash_session_id where applicable;
-   correction/reference fields where applicable.

A money-out record must have a clear relationship to expected cash.

------------------------------------------------------------------------

# 24. Authorization Records

## 24.1 `authorization_request`

Represents elevated authority requested for a consequential action.

Core attributes:

-   `id`
-   `business_id`
-   requested_by;
-   action type;
-   target entity type/id;
-   reason;
-   status;
-   approved_by;
-   requested_at;
-   decided_at;
-   expiration/invalidation where required.

D01 defines authorization as a combination of identity, role,
permission, resource, operation, state, and possible additional
authority. fileciteturn1file8L1418-L1452

The database must preserve the decision context.

------------------------------------------------------------------------

# 25. Audit Reference Model

The complete audit implementation is deferred to D09, but every
consequential entity must be designed so audit records can reference it.

Minimum linkage concepts:

-   actor;
-   business;
-   operation;
-   target;
-   timestamp;
-   authorization;
-   source event;
-   resulting event;
-   sync context where relevant.

D01 establishes Audit & Integrity as a first-class domain owning
business-event evidence, actor attribution, timestamps, correction
relationships, integrity evidence, and audit retrieval.
fileciteturn1file4L849-L860

------------------------------------------------------------------------

# 26. Offline / Sync Data Model

The exact local database and synchronization protocol are deferred to
D07/D08.

However, the server model must accommodate synchronization metadata.

## 26.1 `sync_operation`

Conceptual fields:

-   operation id;
-   business id;
-   actor/device context;
-   client-generated event/idempotency key;
-   operation type;
-   target;
-   submitted_at;
-   accepted_at;
-   status;
-   conflict reference;
-   failure information.

The final field set belongs to D07/D08.

------------------------------------------------------------------------

# 27. Device / Client Identity

Where offline synchronization is supported, the system needs a durable
way to distinguish client/device context.

Conceptual entity:

`client_device`

Possible attributes:

-   `id`
-   `business_id`
-   user association where applicable;
-   device/client label;
-   status;
-   registered_at;
-   last_seen_at.

Do not store sensitive device fingerprints unnecessarily.

The purpose is operational synchronization and traceability, not
surveillance.

------------------------------------------------------------------------

# 28. Concurrency Control

Consequential mutable projections should carry a concurrency mechanism.

Examples:

-   version number;
-   revision number;
-   updated-at comparison where appropriate;
-   database optimistic-locking mechanism.

For critical records, the implementation must detect stale updates
rather than silently overwriting newer state.

D01 explicitly prohibits silent conflict overwrites and requires
explicit conflict handling. fileciteturn1file8L1508-L1520

------------------------------------------------------------------------

# 29. Uniqueness Constraints

Uniqueness should be scoped to the actual business context.

Examples:

``` text
business + SKU
business + customer identity where policy defines uniqueness
business + membership + user
shop + product inventory balance
provider + external transaction reference
idempotency scope + idempotency key
```

Do not impose global uniqueness where two businesses can legitimately
have the same value.

------------------------------------------------------------------------

# 30. Check Constraints

Use database-level checks where practical.

Examples:

-   money amount must not be negative where prohibited;
-   quantity must be valid for its movement type;
-   counted amount cannot be negative;
-   allocation cannot be negative;
-   percentage/rate fields must be within approved bounds;
-   lifecycle timestamps must be logically ordered;
-   required references must exist.

Business rules that depend on multiple records may require
application/domain transactions in addition to database checks.

------------------------------------------------------------------------

# 31. Referential Actions

Default behavior for consequential business records should favor
preservation.

Avoid:

``` text
ON DELETE CASCADE
```

across relationships where deletion of a parent could erase
financial/inventory/audit evidence.

Cascading deletion may be appropriate for disposable technical records,
but must be explicitly justified.

------------------------------------------------------------------------

# 32. Indexing Strategy

Indexes should support operational access patterns.

Expected high-value indexes:

### Sales

-   business + created_at;
-   shop + created_at;
-   customer + created_at;
-   status + created_at.

### Products

-   business + SKU;
-   business + normalized searchable name where supported.

### Customers

-   business + phone/contact search where appropriate;
-   business + normalized name.

### Inventory

-   shop + product;
-   product + movement time;
-   business + movement time.

### Debt

-   business + customer;
-   customer + state;
-   obligation source.

### Payments

-   sale + state;
-   provider + external reference;
-   idempotency scope + key.

### Audit

-   business + timestamp;
-   target entity;
-   actor + timestamp.

Exact index definitions depend on the chosen database engine and
measured workload.

------------------------------------------------------------------------

# 33. Search / Normalization Fields

If the application supports fast search, consider derived normalized
fields such as:

-   normalized product name;
-   normalized SKU;
-   normalized customer name;
-   normalized phone/search token.

These are search aids, not authoritative business fields.

Do not mutate the canonical business value to optimize search.

------------------------------------------------------------------------

# 34. Reporting Data

Reporting may use:

-   database views;
-   materialized views;
-   derived tables;
-   read models;
-   scheduled projections.

But:

> **A reporting projection is disposable/rebuildable from authoritative
> business state.**

If deleting a reporting projection would destroy business truth, it was
incorrectly designed as a source of truth.

------------------------------------------------------------------------

# 35. Financial Invariants

At minimum, the data layer must support these invariants:

1.  Successful payment has a valid lifecycle.
2.  Unconfirmed payment is not successful payment.
3.  A sale cannot be treated as completed without the required
    completion conditions.
4.  Debt is represented by explicit obligations.
5.  Repayments cannot exceed permitted allocation.
6.  Expected cash remains explainable from cash-affecting events.
7.  Physical cash count remains distinct from expected cash.
8.  Reconciliation does not rewrite source events.
9.  Material corrections preserve original evidence.
10. Returns remain linked to their original sale.
11. Financial amounts use exact representation.
12. Duplicate business operations can be detected.

------------------------------------------------------------------------

# 36. Inventory Invariants

At minimum:

1.  Stock movements reference valid products and business context.
2.  Completed sales create only approved stock consequences.
3.  Returns create approved stock consequences.
4.  Receiving creates approved stock consequences.
5.  Adjustments require the authority defined by B06/B08/B09.
6.  Negative stock is not normalized as an ordinary state.
7.  Current stock can be explained from movements.
8.  Historical movement records are not silently overwritten.
9.  Product deletion cannot destroy historical inventory evidence.

------------------------------------------------------------------------

# 37. Credit Invariants

At minimum:

1.  Debt obligations belong to a customer/business.
2.  Credit sale consequences are traceable.
3.  Repayment belongs to the appropriate customer/business.
4.  Allocation cannot exceed valid repayment amount.
5.  Allocation cannot exceed the obligation permitted by policy.
6.  Returns/corrections that affect debt remain traceable.
7.  Debt history cannot be reconstructed only from a mutable balance
    field.

------------------------------------------------------------------------

# 38. Cash Invariants

At minimum:

1.  Expected cash is derived from approved cash-affecting events.
2.  Physical cash count is separately recorded.
3.  Variance is calculable from expected versus counted amounts.
4.  Reconciliation cannot rewrite source transactions.
5.  Money-out records have clear cash relationships.
6.  Closed/reconciled sessions retain evidence.
7.  Corrections to cash-related records remain traceable.

------------------------------------------------------------------------

# 39. Correction Invariants

At minimum:

1.  Every correction targets an existing business record.
2.  Every material correction has a reason.
3.  Authority is evaluated according to B08/B09.
4.  Original evidence remains accessible.
5.  Correction and original event are linked.
6.  Correction cannot silently mutate unrelated records.
7.  Correction effects on inventory/cash/debt are explicit.
8.  Closed-day corrections receive the required elevated control.

------------------------------------------------------------------------

# 40. Deletion Policy

### Generally deletable

-   temporary UI drafts that have never become business events;
-   expired technical caches;
-   non-business transient processing records where retention policy
    permits.

### Generally not ordinarily deletable

-   sales;
-   payments;
-   payment attempts where audit policy requires evidence;
-   debt obligations;
-   repayments;
-   inventory movements;
-   returns;
-   corrections;
-   reconciliations;
-   authorization decisions;
-   audit records.

Any exceptional deletion requirement must be explicitly authorized and
documented.

------------------------------------------------------------------------

# 41. Retention

Retention policy must distinguish:

-   business records;
-   audit evidence;
-   authentication/security records;
-   technical logs;
-   temporary synchronization data;
-   reporting projections.

Do not delete audit evidence merely because the corresponding UI record
is no longer visible.

Exact legal/compliance retention periods should be established
separately where applicable.

------------------------------------------------------------------------

# 42. Data Privacy

Store only data required for the product.

Customer/contact information should have:

-   clear purpose;
-   access control;
-   appropriate retention;
-   controlled exposure.

Do not put sensitive personal information into:

-   audit free-text unnecessarily;
-   logs;
-   error messages;
-   analytics payloads.

------------------------------------------------------------------------

# 43. Database Transactions

D01 requires atomicity where the business requires resulting state to
move together. fileciteturn1file7L1239-L1262

Examples that may require one database transaction:

### Sale completion

-   sale lifecycle update;
-   payment business state where internally controlled;
-   inventory movement;
-   debt creation where applicable;
-   required audit event.

### Approved correction

-   correction record;
-   affected business-state update;
-   inventory/debt/cash consequence;
-   audit relationship.

### Reconciliation submission

-   reconciliation record;
-   session state transition where applicable;
-   audit event.

External provider interactions cannot always be included in one database
transaction; the lifecycle must explicitly represent intermediate
states.

------------------------------------------------------------------------

# 44. Idempotency Persistence

The database must provide a durable uniqueness mechanism for
consequential operation keys.

Conceptually:

``` text
idempotency_scope
idempotency_key
operation_type
actor/business context
request fingerprint where required
result reference
status
created_at
completed_at
```

The exact implementation belongs to D05.

The essential invariant is:

> A retried request representing the same business operation must
> resolve to the existing operation/result rather than create a
> duplicate business event.

D01 explicitly identifies duplicate taps, browser retries, queue replay,
worker retry, uncertain client retry, and duplicate synchronization as
idempotency cases. fileciteturn1file3L568-L584

------------------------------------------------------------------------

# 45. Audit and Business Transaction Coupling

Where an operation changes consequential business state, the system must
ensure the corresponding audit evidence cannot be accidentally omitted.

The exact mechanism may be:

-   same database transaction;
-   transactional outbox;
-   database trigger for selected evidence;
-   application-level enforced event recording;
-   another rigorously tested mechanism.

D09 must choose the exact approach.

The invariant is more important than the mechanism:

> **A consequential state change must have its required evidence.**

------------------------------------------------------------------------

# 46. Event / Outbox Consideration

For integrations and asynchronous processing, a transactional outbox
pattern may be used.

Conceptually:

``` text
Business Transaction
      ↓
Database Commit
 ├── Business State
 └── Outbox Event
          ↓
      Worker/Publisher
          ↓
 External System / Projection
```

This prevents a committed business event from being lost merely because
an external publish operation failed.

The exact event model belongs to the implementation specifications.

------------------------------------------------------------------------

# 47. Migration Rules

Schema migrations must:

-   be versioned;
-   be repeatable in deployment;
-   preserve existing business data;
-   avoid destructive transformations without explicit approval;
-   support rollback strategy where practical;
-   be tested against realistic data volumes;
-   document data backfills;
-   preserve audit relationships.

For large tables, migrations should consider locking, runtime, and
operational impact.

------------------------------------------------------------------------

# 48. Seed / Reference Data

Reference data such as:

-   roles;
-   permission identifiers;
-   supported payment methods;
-   status definitions;
-   system categories;

should have deterministic identifiers or stable keys where appropriate.

Do not make application behavior depend on randomly generated seed IDs.

------------------------------------------------------------------------

# 49. Environment Separation

Production data must not be casually copied into development/testing
environments.

Where production-like data is needed for testing:

-   use synthetic data;
-   or apply appropriate anonymization/redaction.

Development/test fixtures must not accidentally become production
reference data.

------------------------------------------------------------------------

# 50. Backup Implication

The database is a primary business asset.

Backups must cover:

-   authoritative business records;
-   audit evidence;
-   required configuration;
-   synchronization state where recovery requires it.

Reporting projections can be rebuilt if their source data is intact.

D11 will define exact backup and disaster-recovery policy.

------------------------------------------------------------------------

# 51. Data Model to Domain Ownership

  Entity                   Owning domain
  ------------------------ -----------------------
  business                 Business
  shop                     Business
  user                     Identity & Access
  business_membership      Identity & Access
  role_assignment          Identity & Access
  product                  Catalog & Inventory
  inventory_balance        Catalog & Inventory
  inventory_movement       Catalog & Inventory
  stock_count              Catalog & Inventory
  stock_count_line         Catalog & Inventory
  inventory_receipt        Catalog & Inventory
  inventory_receipt_line   Catalog & Inventory
  sale                     Sales
  sale_line                Sales
  payment                  Payments
  customer                 Customers & Credit
  credit_account           Customers & Credit
  debt_obligation          Customers & Credit
  repayment                Customers & Credit
  repayment_allocation     Customers & Credit
  return                   Returns
  return_line              Returns
  correction_request       Corrections
  correction_event         Corrections
  money_out                Cash & Reconciliation
  cash_session             Cash & Reconciliation
  cash_count               Cash & Reconciliation
  reconciliation           Cash & Reconciliation
  authorization_request    Identity & Access
  audit_event              Audit & Integrity
  sync_operation           Sync & Offline
  client_device            Sync & Offline
  reporting projections    Reporting

------------------------------------------------------------------------

# 52. Cross-Domain Reference Rule

A domain may reference another domain's identifier and approved state.

It must not directly mutate another domain's authoritative tables as a
shortcut.

Example:

Bad:

``` text
Sales code directly edits inventory_balance.quantity.
```

Preferred:

``` text
Sales operation
    ↓
Inventory domain operation
    ↓
Inventory movement
    ↓
Inventory balance update
```

This preserves domain ownership.

------------------------------------------------------------------------

# 53. State Storage Rule

Where two lifecycle dimensions are genuinely independent, represent them
independently.

For example, a transaction may have:

-   business lifecycle state;
-   payment state;
-   synchronization state;
-   authorization state.

Do not encode all four into one overloaded status enum.

This is especially important because D01 requires local persistence,
synchronization, server acceptance, rejection, awaiting confirmation,
and conflict to remain distinguishable. fileciteturn1file0L254-L276

------------------------------------------------------------------------

# 54. Historical Snapshots

Historical business records should store snapshots where later mutable
reference data could otherwise change their meaning.

Examples:

-   sale unit price;
-   sale line description where needed;
-   applicable customer/business display information where
    legally/operationally necessary;
-   inventory unit cost where required for accounting/reporting.

Do not snapshot indiscriminately.

The rule is:

> Preserve the information required to explain the historical event
> under its governing business rules.

------------------------------------------------------------------------

# 55. Data Integrity vs Derived State

Use authoritative events and state records carefully.

### Authoritative

-   sale event;
-   successful payment;
-   debt obligation;
-   repayment;
-   inventory movement;
-   return;
-   correction;
-   money-out;
-   physical cash count;
-   reconciliation decision;
-   authorization decision.

### Derived/projection

-   current stock balance;
-   current customer debt summary;
-   dashboard totals;
-   sales charts;
-   inventory dashboard;
-   performance summaries.

Derived state must be rebuildable or reconcilable from authoritative
state.

------------------------------------------------------------------------

# 56. Acceptance Criteria

D02 passes when:

-   all major domains have explicit entities;
-   ownership is explicit;
-   business boundaries are enforced;
-   consequential relationships are represented;
-   lifecycle states are not collapsed into booleans;
-   payments distinguish attempt/result;
-   inventory is movement-oriented;
-   debt is obligation-oriented;
-   cash separates expected and physical count;
-   corrections preserve relationships to originals;
-   authorization decisions are durable;
-   offline/sync can be represented;
-   idempotency can be persisted;
-   concurrency can be detected;
-   critical foreign keys and uniqueness constraints are defined;
-   deletion policy protects business evidence;
-   financial values use exact representation;
-   reporting projections do not become sources of truth;
-   migrations/backups/privacy have explicit architectural direction.

------------------------------------------------------------------------

# 57. Historical Question Reconciliation

The data model preserves the previously resolved product decisions.

  -----------------------------------------------------------------------
  Locked decision                     Data-model consequence
  ----------------------------------- -----------------------------------
  Audit trails always preserved       Audit is a durable first-class
                                      model

  Material corrections retain         Correction records reference
  evidence                            original events

  Failed/reversed/unconfirmed         Payment lifecycle has explicit
  transfers are not successful        result states

  Negative stock is not normal        Inventory constraints and exception
                                      state are required

  Staff do not enter routine "Actual  Physical cash count is distinct
  Cash"                               from expected cash

  Use "Cash in Hand" where            Data concepts distinguish cash
  appropriate                         position from generic balance

  Management needs inventory          Inventory state is available to
  remaining                           reporting

  Owner controls manager authority    Role/authorization records support
                                      policy enforcement

  Poor salesmanship does not alter    Business event data remains
  records                             independent of performance
                                      management

  Offline does not automatically mean Sync/local/server state is
  authoritative                       separately represented

  Conflicts cannot silently overwrite Version/concurrency and conflict
                                      references are required

  Package C is closed                 D02 implements approved behavior
                                      rather than reopening UX discovery
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 58. Explicit Non-Decisions

D02 does not yet lock:

-   exact SQL dialect;
-   exact database vendor;
-   exact UUID version;
-   exact ORM;
-   exact migration framework;
-   exact local database;
-   exact sync protocol;
-   exact audit hash structure;
-   exact API representation;
-   exact payment provider fields;
-   exact hosting topology.

These belong to the appropriate D specifications.

------------------------------------------------------------------------

# 59. Dependency Handoff

D02 provides the data foundation for:

-   **D03** --- API & Application Contract Specification
-   **D04** --- Authentication, Authorization & Security Specification
-   **D05** --- Transaction, Payment & Idempotency Implementation
    Specification
-   **D06** --- Inventory, Credit, Cash & Reporting Implementation
    Specification
-   **D07** --- Offline Architecture & Local Persistence Specification
-   **D08** --- Synchronization, Conflict & Recovery Specification
-   **D09** --- Audit Trail & Integrity Specification
-   **D10** --- Testing, Observability & Operational Reliability
    Specification
-   **D11** --- Deployment, Backup, Disaster Recovery & Production
    Readiness Specification

The detailed schema should be finalized before API contracts and
persistence code are treated as implementation-ready.

------------------------------------------------------------------------

# 60. Final Principle

The database is not merely where Sabi Shop stores information.

It is one of the mechanisms by which the product protects business
truth.

The final standard is:

> **If a sale, payment, stock movement, debt change, return, correction,
> cash event, authorization, or reconciliation cannot be explained from
> durable records, the data model is not finished.**

**D02 establishes that durable foundation.**
