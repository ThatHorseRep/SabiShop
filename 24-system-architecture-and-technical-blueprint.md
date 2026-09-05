# D01 --- System Architecture & Technical Blueprint

**Product:** Sabi Shop\
**Package:** D --- Technical Implementation Specifications\
**Status:** FOUNDATION / PLAN-OF-RECORD\
**Depends on:** B03--B09, C00--C11, F00\
**Purpose:** Define the technical architecture that can enforce the
approved Sabi Shop business and UX behavior without weakening
auditability, transaction integrity, offline resilience, or role
authority.

------------------------------------------------------------------------

## 1. Purpose

D01 is the architectural foundation for Package D.

The business documents define **what must be true**.

The UX documents define **how users interact with that truth**.

D01 defines the system-level technical structure required to make those
rules reliable.

This specification is intentionally architectural. Detailed schemas,
endpoint contracts, offline algorithms, audit implementation, and other
subsystem specifications belong in later D documents.

The architecture must be:

-   understandable;
-   enforceable;
-   testable;
-   observable;
-   resilient;
-   secure;
-   maintainable;
-   suitable for incremental delivery.

Architecture documentation should communicate structure, behavior,
dependencies, constraints, and rationale clearly enough to guide
implementation and later conformance assessment.
citeturn0search1turn0search3

------------------------------------------------------------------------

# 2. Architectural North Star

> **Sabi Shop must make ordinary shop operations fast while making
> consequential business truth durable, traceable, and recoverable.**

The architecture must therefore optimize for two things at the same
time:

1.  **Operational speed**
2.  **Business integrity**

Neither may casually override the other.

A faster system that can lose transaction history is unacceptable.

A perfectly auditable system that makes ordinary selling unusably slow
is also unacceptable.

------------------------------------------------------------------------

# 3. System Boundary

Sabi Shop is a shop-management platform supporting:

-   sales/POS;
-   payments;
-   customers;
-   credit and debt;
-   repayments;
-   inventory;
-   purchasing/receiving;
-   returns;
-   refunds/settlement;
-   corrections;
-   cash management;
-   reconciliation;
-   management reporting;
-   role/permission control;
-   offline operation;
-   synchronization;
-   activity/history;
-   exception handling.

The architecture should treat these as connected business capabilities
rather than unrelated CRUD screens.

------------------------------------------------------------------------

# 4. Architectural Principles

## 4.1 Business truth has an explicit owner

Every consequential business fact must have a defined authoritative
owner.

Examples:

-   sale lifecycle → transaction/lifecycle domain;
-   payment result → payment/business transaction domain;
-   stock quantity → inventory domain;
-   debt obligation → credit/debt domain;
-   reconciliation result → cash/reconciliation domain;
-   authorization → access/control domain;
-   historical evidence → audit domain.

No UI component should become the hidden owner of business truth.

------------------------------------------------------------------------

## 4.2 Consequential actions are domain operations

Do not model important business events as arbitrary field updates.

Prefer explicit domain operations such as:

-   complete sale;
-   record successful payment;
-   create credit obligation;
-   record repayment;
-   receive stock;
-   count stock;
-   record discrepancy;
-   process return;
-   issue approved refund;
-   request correction;
-   approve correction;
-   reconcile cash;
-   authorize elevated action.

This makes business consequences explicit and testable.

------------------------------------------------------------------------

## 4.3 History is append-oriented

The architecture must preserve meaningful evidence.

Material business events should not be implemented as destructive
overwrites when doing so would remove the ability to explain what
happened.

Corrections should create traceable subsequent state.

The exact audit schema and append-only enforcement belong to the
dedicated audit specification.

------------------------------------------------------------------------

## 4.4 Server authority and local capability must be distinguishable

Offline capability does not mean every offline action is automatically
authoritative.

The architecture must distinguish:

-   locally persisted;
-   locally validated;
-   queued for synchronization;
-   server accepted;
-   server rejected;
-   awaiting confirmation;
-   conflicted.

This distinction is especially important for:

-   payments;
-   authorization;
-   credit;
-   corrections;
-   returns;
-   reconciliation.

------------------------------------------------------------------------

## 4.5 Idempotency is a business safety mechanism

Repeated submission must not accidentally create repeated business
events.

Idempotency applies to more than HTTP retries.

It must protect against:

-   double taps;
-   refreshes;
-   browser retries;
-   connection restoration;
-   queue replay;
-   worker retry;
-   client retry after uncertain response;
-   duplicate synchronization.

------------------------------------------------------------------------

## 4.6 Authorization is enforced below the UI

A hidden or disabled button is not a security boundary.

The system must enforce role and authority rules at the backend/domain
boundary.

The UI should reflect those rules, but must not be trusted to enforce
them.

------------------------------------------------------------------------

## 4.7 Inventory, cash, and debt are first-class business domains

They should not be calculated from fragile UI state.

Every material change must have a traceable cause.

------------------------------------------------------------------------

## 4.8 Reports derive from trusted business state

Reporting should not become an independent source of truth.

Sales, expenses, cash, inventory, debt, and performance metrics must be
derived from authoritative business records according to the reporting
rules.

------------------------------------------------------------------------

# 5. Recommended Logical Architecture

The initial architecture should use a modular application structure
rather than prematurely fragmenting the product into many independently
deployed services.

### Logical layers

``` text
Presentation
    ↓
Application / Use Cases
    ↓
Domain Modules
    ↓
Persistence / Integration
    ↓
Database / External Providers
```

Cross-cutting infrastructure:

``` text
Identity & Authorization
Audit & Integrity
Idempotency
Observability
Offline/Sync
Notifications
```

This keeps business rules centralized while allowing clear boundaries
between domains.

------------------------------------------------------------------------

# 6. Client Architecture

The client application is responsible for:

-   rendering the approved UX;
-   local interaction state;
-   form validation;
-   local offline persistence where supported;
-   optimistic presentation only where business rules permit it;
-   sync status;
-   safe retry behavior;
-   connectivity awareness;
-   accessibility;
-   role-aware presentation.

The client must **not** be the final authority for:

-   permissions;
-   completed payments;
-   durable transaction success;
-   financial totals;
-   stock authority;
-   debt authority;
-   correction authorization.

------------------------------------------------------------------------

# 7. Application Layer

The application layer coordinates use cases.

Examples:

-   `CompleteSale`
-   `RecordPayment`
-   `CreateCreditSale`
-   `RecordRepayment`
-   `ReceiveInventory`
-   `RecordStockCount`
-   `ProcessReturn`
-   `RequestCorrection`
-   `ApproveCorrection`
-   `ReconcileCash`
-   `ResolveConflict`

Application services should:

1.  validate input;
2.  establish actor/context;
3.  enforce authorization;
4.  load required domain state;
5.  execute domain operation;
6.  persist the result atomically where required;
7.  emit required audit/domain information;
8.  return an explicit result/state.

------------------------------------------------------------------------

# 8. Domain Modules

The initial modular boundary should include the following.

## 8.1 Identity & Access

Owns:

-   users;
-   roles;
-   permissions;
-   sessions;
-   authorization context;
-   elevated authorization.

------------------------------------------------------------------------

## 8.2 Business / Shop

Owns:

-   business identity;
-   shop configuration;
-   business day/session concepts where applicable;
-   foundational settings.

------------------------------------------------------------------------

## 8.3 Catalog & Inventory

Owns:

-   products;
-   SKUs/identifiers;
-   stock;
-   stock movements;
-   stock counts;
-   discrepancies;
-   receiving;
-   inventory adjustments;
-   cost information.

------------------------------------------------------------------------

## 8.4 Sales

Owns:

-   sale lifecycle;
-   sale lines;
-   totals;
-   discounts/price authority where applicable;
-   sale completion;
-   sale relationships.

------------------------------------------------------------------------

## 8.5 Payments

Owns:

-   payment attempts;
-   payment method/state;
-   successful payment result;
-   unconfirmed state;
-   failed/rejected state;
-   payment relationships to sales and other obligations.

Payment-provider integration details may be separated from the core
payment domain.

------------------------------------------------------------------------

## 8.6 Customers & Credit

Owns:

-   customers;
-   credit eligibility;
-   credit limits;
-   debt obligations;
-   repayments;
-   allocation;
-   customer financial history.

------------------------------------------------------------------------

## 8.7 Returns & Corrections

Owns:

-   return eligibility;
-   return operations;
-   refund/settlement state;
-   correction requests;
-   correction authorization;
-   links to original records;
-   exception workflows.

------------------------------------------------------------------------

## 8.8 Cash & Reconciliation

Owns:

-   expected cash;
-   money-out;
-   cash sessions/day context;
-   physical cash count;
-   variance;
-   reconciliation;
-   management review.

------------------------------------------------------------------------

## 8.9 Reporting

Owns:

-   report queries;
-   derived metrics;
-   dashboard projections;
-   reporting views.

Reporting must consume authoritative records rather than create
competing business truth.

------------------------------------------------------------------------

## 8.10 Audit & Integrity

Owns:

-   business-event evidence;
-   actor attribution;
-   timestamps;
-   correction relationships;
-   integrity evidence;
-   audit retrieval.

Detailed design belongs to the dedicated audit specification.

------------------------------------------------------------------------

## 8.11 Sync & Offline

Owns:

-   local queue/state;
-   synchronization;
-   retry;
-   deduplication;
-   conflict detection;
-   synchronization status.

This is a cross-cutting capability and should not be embedded
independently inside every business module.

------------------------------------------------------------------------

# 9. Domain Interaction Model

The core relationships are:

``` text
Customer ─────── Credit/Debt
                     ↑
                     │
Sale ─────── Payment ┘
 │
 ├──── Inventory
 │
 └──── Cash/Reconciliation

Sale ───── Returns/Corrections
 │
 └──── Audit

Inventory ───── Purchasing/Receiving
 │
 └──── Audit

All consequential domains ───── Audit
All authorized operations ───── Identity/Authorization

Client ───── Sync/Offline ───── Server Application
```

This is a logical model, not a database schema.

------------------------------------------------------------------------

# 10. Transaction Boundary Principle

A business operation should be atomic where the business requires the
resulting state to move together.

For example, completing a sale may require coordinated updates to:

-   sale state;
-   sale lines;
-   payment result;
-   inventory effect;
-   debt effect where applicable;
-   audit evidence.

The exact database transaction strategy belongs to the detailed
data/persistence specification.

The architectural requirement is:

> The system must never expose a partially completed business event as
> though the entire event succeeded.

Where external systems prevent atomicity, the lifecycle must represent
the intermediate state explicitly.

------------------------------------------------------------------------

# 11. External Payment Boundary

External payment providers may have their own lifecycle.

Therefore:

``` text
User intent
   ↓
Payment attempt
   ↓
Provider interaction
   ↓
Provider result
   ↓
Business payment state
   ↓
Sale completion
```

The architecture must not collapse these into one assumed instantaneous
event.

Particularly important:

-   provider timeout ≠ confirmed success;
-   local submission ≠ confirmed success;
-   retry ≠ permission to create a second business payment;
-   reversal ≠ original successful payment remaining unquestioned.

Exact provider integration contracts belong later.

------------------------------------------------------------------------

# 12. Inventory Architecture Principle

Inventory should be movement-oriented.

A product's current stock should be explainable through its historical
stock-affecting events.

Conceptually:

``` text
Opening / Existing Stock
       +
Purchasing / Receiving
       +
Approved Adjustments
       -
Completed Sales
       -
Other approved stock movements
       =
Current Stock
```

Returns and corrections must apply their approved inventory consequences
without erasing the original event.

Negative stock is an exception requiring controlled handling, not a
normal accounting strategy.

------------------------------------------------------------------------

# 13. Credit & Debt Architecture Principle

Debt should represent an explicit business obligation.

Conceptually:

``` text
Credit Sale
     ↓
Debt Obligation
     ↓
Repayment(s)
     ↓
Remaining Obligation
```

Returns, corrections, write-offs, and other approved actions may change
the obligation.

Each change must remain traceable.

Do not calculate "current debt" by simply replacing a customer balance
field without retaining the underlying financial evidence required by
B03 and the audit model.

------------------------------------------------------------------------

# 14. Cash Architecture Principle

Expected cash and physical cash are different concepts.

Architecture must preserve that distinction.

Conceptually:

``` text
Cash-affecting business events
          ↓
     Expected Cash
          ↓
Physical Count
          ↓
      Variance
          ↓
 Reconciliation / Review
```

The system must not allow reconciliation to rewrite the events that
produced expected cash.

------------------------------------------------------------------------

# 15. Corrections Architecture Principle

A correction is a new controlled business operation against an existing
record.

Conceptually:

``` text
Original Event
     ↓
Correction Request
     ↓
Authority / Policy Check
     ↓
Approved Correction
     ↓
New Business State
     ↓
Audit Relationship
```

The original event remains discoverable.

The exact correction data model belongs to the correction specification.

------------------------------------------------------------------------

# 16. Authorization Architecture

Authorization should be evaluated at multiple levels.

### Identity

Who is acting?

### Role

What role do they have?

### Permission

What capability does that role provide?

### Resource

Which shop/business/record are they acting on?

### Operation

What exact action are they attempting?

### State

Is the action allowed in the current business state?

### Additional authority

Does the action require approval, elevated authorization, or management
review?

A user may have permission to access a screen without having permission
to execute every consequential action on that screen.

------------------------------------------------------------------------

# 17. Multi-Tenant / Business Isolation

If Sabi Shop supports multiple businesses, business identity must be
part of the authorization and data-isolation model.

Every business-owned record must have a secure ownership boundary.

A request must never be able to access another business's data merely by
changing an identifier.

Exact tenancy enforcement belongs to the security/data specification.

------------------------------------------------------------------------

# 18. Offline Architecture

Offline operation is a product capability, not simply a browser cache.

The client requires a durable local representation for supported work.

Conceptually:

``` text
User Action
    ↓
Local Validation
    ↓
Local Durable State
    ↓
Outbox / Sync Queue
    ↓
Server Submission
    ↓
Server Result
    ↓
Local Reconciliation
```

The system must preserve enough metadata to determine:

-   what was attempted;
-   by whom;
-   when;
-   from which local context;
-   whether it has synchronized;
-   whether the server accepted it;
-   whether it conflicts.

Exact storage and sync protocol are later D deliverables.

------------------------------------------------------------------------

# 19. Conflict Architecture

Conflicts should be modeled explicitly.

A conflict may arise when:

-   the same business record changed on multiple devices;
-   offline work becomes incompatible with current server state;
-   authorization changed before synchronization;
-   an original record was corrected elsewhere;
-   inventory changed before an offline action was submitted.

Conflict resolution must preserve evidence.

Preferred conceptual flow:

``` text
Local Event
    +
Server State
    ↓
Conflict Detection
    ↓
Conflict Classification
    ↓
Safe Resolution
    ↓
Audit / Evidence
```

Never use "last write wins" as an unexamined default for consequential
business records.

------------------------------------------------------------------------

# 20. Idempotency Architecture

Every externally retriable consequential operation needs a stable
idempotency strategy.

The system should be able to recognize:

> "This is the same business operation being retried."

This applies to:

-   sale completion;
-   payment submission;
-   repayment;
-   stock receiving;
-   return;
-   correction;
-   reconciliation submission;
-   sync replay.

Exact identifier format and persistence rules belong in the dedicated
identifier/idempotency specification.

------------------------------------------------------------------------

# 21. Audit & Integrity Architecture

Audit is a cross-cutting system capability.

At minimum, the architecture must support traceability for consequential
actions.

Evidence should be associated with:

-   actor;
-   business context;
-   operation;
-   timestamp;
-   affected record(s);
-   prior state where required;
-   resulting state;
-   authorization;
-   correction relationship;
-   synchronization context where relevant.

Integrity mechanisms may be implemented separately from ordinary
user-facing history.

The UI should expose meaningful evidence without exposing cryptographic
implementation details unnecessarily.

Exact hash/integrity architecture belongs later.

------------------------------------------------------------------------

# 22. Reporting Architecture

Reports should use trusted business-state projections.

Recommended conceptual split:

``` text
Operational Write Model
        ↓
Authoritative Business State
        ↓
Reporting Queries / Read Models
        ↓
Dashboard / Reports
```

Do not let dashboard calculations become a second accounting engine.

Every important metric should have a defined source and calculation
rule.

------------------------------------------------------------------------

# 23. Search Architecture

Search should be optimized according to operational need.

High-frequency search targets include:

-   products;
-   SKUs;
-   customers;
-   transactions;
-   activity/history.

Search results must respect:

-   business boundary;
-   role permissions;
-   current state;
-   data freshness.

Search must not expose records the user cannot access merely because
they exist in the database.

------------------------------------------------------------------------

# 24. Notifications & Attention

Notifications should be event-driven from meaningful business state.

Examples:

-   authorization request;
-   reconciliation discrepancy;
-   sync failure requiring attention;
-   critical inventory condition;
-   correction awaiting review.

Do not generate notifications directly from arbitrary UI interactions.

The domain/application layer should determine whether a business event
warrants attention.

------------------------------------------------------------------------

# 25. Observability

The architecture must make important failures diagnosable.

Track appropriate technical signals for:

-   request failures;
-   synchronization failures;
-   retry rates;
-   idempotency collisions;
-   conflict frequency;
-   authorization failures;
-   payment-provider failures;
-   database failures;
-   queue backlog;
-   client errors;
-   offline duration where appropriate.

Business observability should also support:

-   incomplete/uncertain transactions;
-   reconciliation exceptions;
-   inventory discrepancies;
-   correction volume;
-   failed synchronization.

Do not log sensitive information unnecessarily.

------------------------------------------------------------------------

# 26. Security Architecture

Security controls should exist at multiple layers.

### Client

-   secure session handling;
-   safe storage practices;
-   no secret credentials embedded in the client;
-   minimal sensitive-data exposure.

### Application

-   authentication;
-   authorization;
-   input validation;
-   business-rule enforcement;
-   rate limiting where appropriate;
-   idempotency;
-   audit generation.

### Data

-   business isolation;
-   least-privilege access;
-   encrypted transport;
-   protected credentials/secrets;
-   controlled administrative access.

### Operations

-   monitoring;
-   alerting;
-   backups;
-   recovery;
-   incident response.

Exact controls belong in later security/operations specifications.

------------------------------------------------------------------------

# 27. Reliability & Recovery

The system must be designed around realistic failure.

Relevant failure classes:

-   device offline;
-   intermittent connectivity;
-   server unavailable;
-   database failure;
-   payment provider timeout;
-   duplicate request;
-   stale client state;
-   sync conflict;
-   authorization change;
-   corrupted local state;
-   partial external operation.

Every high-impact failure must have:

1.  a detectable state;
2.  a safe user-visible state;
3.  a recovery path;
4.  preserved evidence.

------------------------------------------------------------------------

# 28. Data Consistency Strategy

Not every read needs the same consistency guarantee.

### Stronger consistency required for

-   final business transaction state;
-   payment result;
-   debt obligation;
-   reconciliation result;
-   correction authorization;
-   stock-changing operations.

### More tolerant consistency may be acceptable for

-   dashboards;
-   analytics summaries;
-   non-critical activity refresh;
-   secondary reporting views.

The user experience must make stale or pending information clear where
it could affect a consequential decision.

------------------------------------------------------------------------

# 29. Caching Principle

Caching may improve performance but must not create false business
truth.

Do not treat cached:

-   stock;
-   debt;
-   payment status;
-   authorization;
-   reconciliation;

as current authoritative state without an appropriate freshness/state
model.

------------------------------------------------------------------------

# 30. API Architecture

The API layer should expose business operations rather than encouraging
arbitrary mutation of domain records.

Prefer:

``` text
POST /sales/{id}/complete
POST /payments
POST /customers/{id}/repayments
POST /inventory/receipts
POST /returns
POST /corrections
POST /reconciliations
```

over generic endpoints that allow arbitrary field mutation of
consequential records.

Exact endpoint names are illustrative only.

The detailed API contract belongs in the API specification.

------------------------------------------------------------------------

# 31. Database Architecture Direction

The persistence layer should favor a transactional relational database
suitable for:

-   relational business records;
-   strong constraints;
-   transactional updates;
-   reporting queries;
-   audit relationships;
-   indexed search;
-   durable state.

The exact database technology and schema belong to the relevant Package
D specifications.

Architecture must take advantage of database integrity mechanisms rather
than implementing every invariant only in application code.

------------------------------------------------------------------------

# 32. Background Processing

Background workers may be used for:

-   synchronization;
-   retry;
-   notifications;
-   report projection;
-   cleanup of non-business temporary data;
-   integration processing.

Workers must be idempotent.

A failed worker retry must not create duplicate business events.

------------------------------------------------------------------------

# 33. Deployment Shape

Initial deployment should favor operational simplicity.

Recommended conceptual shape:

``` text
Web / PWA Client
       ↓
Application API
       ↓
Relational Database

Supporting services:
- Object/file storage where required
- Background worker
- External payment provider(s)
- Notification provider(s)
- Monitoring/logging
```

Do not introduce microservices merely because the domain has modules.

Modularity should precede service decomposition.

------------------------------------------------------------------------

# 34. Architectural Quality Attributes

The architecture must be evaluated against:

  -----------------------------------------------------------------------
  Attribute                           Requirement
  ----------------------------------- -----------------------------------
  Integrity                           Consequential business truth cannot
                                      be silently rewritten

  Availability                        Core workflows recover safely from
                                      temporary failures

  Offline resilience                  Supported workflows remain useful
                                      without connectivity

  Consistency                         Critical business state follows
                                      explicit consistency rules

  Security                            Authorization is enforced
                                      server-side

  Auditability                        Material actions remain explainable

  Performance                         POS interactions remain responsive

  Scalability                         Architecture can support growth
                                      without premature complexity

  Maintainability                     Domain boundaries remain
                                      understandable

  Testability                         Business rules can be tested
                                      independently of UI

  Observability                       Important failures and state
                                      transitions are diagnosable

  Accessibility                       UX requirements remain
                                      implementable

  Recoverability                      Failed/interrupted operations have
                                      safe recovery paths
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 35. Architecture Decision Record Discipline

Every significant architectural choice should record:

-   decision;
-   context;
-   alternatives;
-   rationale;
-   consequences;
-   affected modules;
-   migration implications;
-   validation method.

Do not document technology choices without explaining why they serve the
approved business requirements.

Good architecture documentation should preserve rationale and remain
current and referenceable. citeturn0search0turn0search4

------------------------------------------------------------------------

# 36. Anti-Patterns Prohibited by This Architecture

### 36.1 UI-as-database

The interface must not become the authoritative record.

### 36.2 Generic CRUD for consequential business operations

Important operations need domain semantics.

### 36.3 Silent overwrite

Do not silently replace material state when history matters.

### 36.4 Client-only authorization

Never trust hidden buttons as security.

### 36.5 "Offline means success"

Local persistence must not be represented as server-confirmed business
success.

### 36.6 "Last write wins" everywhere

Unsafe for consequential records.

### 36.7 Reporting as accounting

Dashboard calculations must not become an alternative source of
financial truth.

### 36.8 Microservice-first architecture

Do not distribute the system before stable domain boundaries and
operational reasons justify it.

### 36.9 Audit as an afterthought

Audit requirements must be represented in domain/application
architecture from the beginning.

### 36.10 Delete-to-correct

Where policy requires preserved history, use controlled
correction/reversal semantics.

------------------------------------------------------------------------

# 37. Testing Architecture

Testing should occur at multiple levels.

## Unit

Test:

-   domain rules;
-   calculations;
-   state transitions;
-   permission decisions.

## Integration

Test:

-   application + database;
-   transaction boundaries;
-   authorization;
-   idempotency;
-   audit generation.

## Contract

Test:

-   API request/response contracts;
-   external payment contracts;
-   sync contracts.

## End-to-end

Test:

-   critical user journeys;
-   offline recovery;
-   payment uncertainty;
-   correction;
-   reconciliation;
-   inventory;
-   credit.

## Conformance

Compare implementation behavior against B/C/F specifications.

Architecture documentation is most useful when it can guide
implementation and support later conformance assessment.
citeturn0search13

------------------------------------------------------------------------

# 38. Failure-Injection Priorities

Before production, intentionally test:

-   duplicate submission;
-   connection loss during sale;
-   connection loss after payment request;
-   server response lost after successful operation;
-   sync replay;
-   conflicting stock updates;
-   conflicting debt updates;
-   revoked authorization;
-   database transaction failure;
-   worker retry;
-   stale client;
-   interrupted reconciliation.

The purpose is to prove that failure does not become false business
success.

------------------------------------------------------------------------

# 39. Migration & Evolution

The architecture should allow:

-   new reports;
-   new payment integrations;
-   additional roles;
-   additional inventory capabilities;
-   more sophisticated sync;
-   larger business datasets;
-   future multi-shop/business structures where intentionally
    introduced.

Do not prematurely build speculative features.

But avoid designs that make current integrity requirements impossible to
evolve.

------------------------------------------------------------------------

# 40. Technical Ownership Matrix

  Concern         Primary Owner         Supporting Areas
  --------------- --------------------- ---------------------------------
  Identity        Access module         Security
  Permissions     Access module         All domains
  Sales           Sales module          Payment, Inventory, Cash
  Payment         Payment module        Sales, external provider
  Inventory       Inventory module      Sales, Returns
  Credit/Debt     Credit module         Sales, Returns, Payments
  Returns         Returns module        Sales, Inventory, Payment, Debt
  Corrections     Correction module     All affected domains
  Cash            Cash module           Sales, Money-out
  Reporting       Reporting             All authoritative domains
  Audit           Audit                 All consequential domains
  Offline         Sync                  Client + all supported domains
  Conflict        Sync + domain owner   Audit
  Observability   Platform              All modules
  Security        Platform/Access       All modules

------------------------------------------------------------------------

# 41. Package D Dependency Map

D01 establishes the architecture for later documents.

Expected progression:

-   **D01** --- System Architecture & Technical Blueprint
-   **D02** --- Data Model & Database Specification
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

Later numbering may be adjusted if the implementation plan requires it,
but dependencies must remain explicit.

------------------------------------------------------------------------

# 42. Historical Question Reconciliation

D01 carries forward the resolved product decisions rather than reopening
them.

  -----------------------------------------------------------------------
  Previously resolved question        Architectural consequence
  ----------------------------------- -----------------------------------
  Audit trails must always be         Audit is a first-class
  preserved                           cross-cutting capability

  Material corrections must retain    Corrections are explicit domain
  evidence                            operations

  Unsuccessful/reversed/unconfirmed   Payment lifecycle distinguishes
  transfers are not successful        attempt/result/state
  payments                            

  Negative stock should not be normal Inventory architecture exposes
                                      discrepancy/exception state

  Staff do not maintain routine       Cash architecture separates
  "Actual Cash" truth                 expected cash from physical
                                      reconciliation

  Use "Cash in Hand" rather than      Reporting/domain terminology
  ambiguous "Balance" where           preserves distinct financial
  appropriate                         concepts

  Management needs inventory          Reporting/dashboard projections
  remaining                           include inventory health

  Owner governs manager authority     Authorization is policy-driven and
                                      role-aware

  Poor salesmanship must not corrupt  Business records remain independent
  records                             of performance management

  Offline does not automatically      Offline architecture distinguishes
  create authority                    local capability from authoritative
                                      success

  Conflicts must not silently         Explicit conflict detection and
  overwrite truth                     resolution

  Package C is closed                 D does not reopen UX discovery; it
                                      implements approved behavior
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 43. Explicit Non-Decisions

D01 intentionally leaves detailed implementation choices to later
specifications.

Not yet fixed here:

-   exact database engine;
-   exact table schema;
-   exact API paths;
-   exact payment provider;
-   exact local database;
-   exact sync protocol;
-   exact conflict algorithm;
-   exact idempotency-key format;
-   exact audit table/hash structure;
-   exact authentication provider;
-   exact hosting platform;
-   exact observability vendor;
-   exact backup tooling.

Those decisions must be documented with rationale in their owning D
specification.

------------------------------------------------------------------------

# 44. Architecture Acceptance Criteria

D01 passes when:

-   domain boundaries are understandable;
-   ownership of consequential business truth is explicit;
-   critical workflows have clear architectural homes;
-   authorization is below the UI layer;
-   audit is first-class;
-   offline behavior is architecturally supported;
-   synchronization is explicit;
-   conflicts are explicit;
-   idempotency is treated as a core requirement;
-   payment uncertainty is representable;
-   inventory/debt/cash state cannot depend on fragile UI state;
-   reporting does not become a competing accounting engine;
-   observability and recovery are planned;
-   later D specifications have clear ownership and dependencies.

------------------------------------------------------------------------

# 45. Architecture Completion Rule

D01 is complete when the implementation team can answer:

1.  Where does this business rule live?
2.  Which module owns this state?
3.  Which layer enforces it?
4.  What happens when the network disappears?
5.  What happens when the request is repeated?
6.  What happens when two devices disagree?
7.  How is authorization enforced?
8.  How is history preserved?
9.  How can an operator diagnose failure?
10. Which later D document contains the detailed contract?

If those questions have clear architectural answers, the system has a
sound foundation for detailed technical specifications.

------------------------------------------------------------------------

# 46. Final Principle

Sabi Shop should not be architected as a collection of screens connected
to database tables.

It should be architected as a **business system with explicit state,
authority, evidence, and recovery**.

The implementation should make the correct business behavior the easiest
behavior to preserve.

**D01 is therefore the technical foundation for turning the approved
Sabi Shop UX and business rules into a reliable system.**
