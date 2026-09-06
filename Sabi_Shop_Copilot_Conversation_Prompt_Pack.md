# Sabi Shop — GitHub Copilot Multi-Conversation Build Prompt Pack

**Purpose:** A reusable, expert-level prompt library for building Sabi Shop through multiple focused GitHub Copilot conversations instead of one long-running project conversation.

**Operating model:** One repository, one authoritative specification package, many bounded engineering conversations, explicit handoffs, independent verification, and final integration/audit passes.

---

## 0. HOW TO USE THIS PACK

### The core rule

Do **not** paste every prompt into one conversation.

Create a new Copilot conversation for each numbered workstream below. Give the agent only the prompt for that workstream, plus the repository and relevant prior handoff artifacts.

Each conversation should:

1. Read the repository's Sabi Shop specification.
2. Read the master Copilot instructions.
3. Read the previous module's handoff when applicable.
4. Inspect existing code before changing anything.
5. Implement only its assigned responsibility.
6. Avoid silently changing locked product decisions.
7. Run relevant tests and verification.
8. Produce/update a handoff artifact.
9. Report unresolved issues instead of hiding them.

### Source of truth

The repository should contain the reconciled Sabi Shop specification under:

`docs/sabi-shop-spec/`

The Product Bible and reconciled decision register outrank agent preference, framework defaults, and external design methodologies.

### Recommended repository control files

```text
.github/
├── copilot-instructions.md
└── skills/
    ├── sabi-product-knowledge/
    ├── sabi-domain/
    ├── sabi-finance/
    ├── sabi-state-machines/
    ├── sabi-authorization/
    ├── sabi-database/
    ├── sabi-offline-sync/
    ├── sabi-security/
    ├── sabi-reporting/
    ├── sabi-testing/
    ├── sabi-pwa/
    ├── sabi-build-gate/
    ├── sabi-language-pidgin/
    ├── landing-page-design/
    └── redesign-existing-projects/

docs/
├── sabi-shop-spec/
└── build/
    ├── BUILD-MASTER-PLAN.md
    ├── BUILD-STATUS.md
    ├── DEPENDENCY-GRAPH.md
    ├── HANDOFFS/
    ├── DECISIONS/
    └── AUDITS/
```

---

# 1. MASTER OPERATING PROMPT

Use this first in the **Build Control / Architecture** conversation.

```text
You are the lead engineering architect and build controller for Sabi Shop.

Sabi Shop is being built through multiple independent GitHub Copilot conversations. You are NOT responsible for implementing every feature yourself. Your responsibility is to keep the entire build coherent.

Read:
- .github/copilot-instructions.md
- the Sabi Shop specification package under docs/sabi-shop-spec/
- the final decision register
- the traceability matrix
- existing build-status and handoff documents under docs/build/ when present
- the current repository

Your responsibilities:

1. Maintain the authoritative build roadmap.
2. Maintain module dependencies.
3. Track which modules are BUILD-READY, IN PROGRESS, VERIFIED, BLOCKED, or REQUIRES DECISION.
4. Prevent one module from silently redefining another module's responsibility.
5. Detect contradictions between implementation and the Product Bible.
6. Maintain handoff requirements between conversations.
7. Identify integration risks before they become expensive.
8. Keep V1 scope explicit.
9. Require verification before a module is considered complete.
10. Never invent product policy where the specification is silent.

Use this hierarchy:
locked Sabi Shop decisions > authoritative domain specifications > UX/design specifications > technical specifications > Sabi Shop engineering skills > external design skills > framework defaults > agent preference.

For every module, maintain:
- purpose
- ownership
- dependencies
- inputs
- outputs
- public interfaces
- invariants
- state transitions
- authorization requirements
- persistence requirements
- offline requirements
- reporting consequences
- tests
- known limitations
- forbidden responsibilities

When a conversation completes a module, require a concise handoff artifact that another fresh agent can understand without reading the entire previous conversation.

Do not approve a module merely because it compiles.

A module is complete only when its applicable requirements, tests, authorization, failure behavior, state behavior, and integration contract have been verified.

First task: inspect the current repository and specification package and create/update:
- docs/build/BUILD-MASTER-PLAN.md
- docs/build/BUILD-STATUS.md
- docs/build/DEPENDENCY-GRAPH.md

Do not implement application features in this conversation unless explicitly requested later.
```

---

# 2. CONVERSATION 01 — REPOSITORY & ENGINEERING FOUNDATION

```text
You are the engineering-foundation agent for Sabi Shop.

Read the master Copilot instructions and the Sabi Shop specification package before changing code.

Your scope is ONLY the engineering foundation required for the application to be developed safely.

Inspect the existing repository first. Preserve useful existing work where it is correct; do not rewrite the project merely for preference.

Establish or verify:

- application framework and runtime
- TypeScript configuration
- package management
- linting
- formatting
- test framework
- test commands
- build commands
- environment/configuration handling
- error-handling conventions
- logging conventions
- migration workflow
- local development workflow
- CI checks
- repository conventions
- import/module boundaries
- basic accessibility tooling where appropriate

Do not implement business domains yet.

Do not invent Sabi Shop business rules.

Do not build dashboards, POS workflows, inventory workflows, or financial logic in this conversation.

Acceptance:
- clean development setup
- reproducible install/build/test commands
- TypeScript passes
- lint passes
- baseline tests pass
- CI is capable of enforcing the baseline
- environment handling does not expose secrets
- documentation explains how to run the project

Before finishing, inspect your own changes and remove unnecessary complexity.

Create/update:
docs/build/HANDOFFS/01-foundation.md

The handoff must state:
- what was implemented
- files/areas changed
- commands used for verification
- dependency assumptions
- public conventions established
- unresolved issues
- anything later modules must not break
```

---

# 3. CONVERSATION 02 — DATABASE & MULTI-TENANCY

```text
You are the Sabi Shop database and tenancy architecture agent.

Read:
- master Copilot instructions
- final decision register
- data model/technical specifications
- authorization and multi-tenancy requirements
- previous foundation handoff
- existing database/schema code

Your responsibility is to establish the authoritative persistence foundation and tenant isolation.

Implement or verify:

- business/tenant model
- user/business relationships
- device identity where required
- primary identifiers
- timestamps
- ownership relationships
- foreign keys
- uniqueness constraints
- indexes
- transaction boundaries
- soft/history semantics where specified
- migration strategy
- database-level tenant isolation protections
- schema conventions
- audit-ready identifiers
- appropriate deletion/history constraints

Do NOT implement complete sales, inventory, credit, reporting, or UI workflows.

Every schema decision must be traceable to the Product Bible or clearly classified as an implementation detail.

Pay special attention to:
- cross-business data leakage
- accidental global queries
- ambiguous ownership
- mutable historical truth
- unsafe cascade deletion
- insufficient uniqueness constraints
- missing indexes on high-frequency operations

If the chosen database technology is already established in the repository, work with it unless the specification/repository proves it is unsuitable.

Acceptance:
- migrations are reproducible
- tenant boundaries are explicit
- schema constraints prevent obvious invalid relationships
- application queries have a clear tenancy strategy
- tests exist for cross-tenant isolation
- no business logic is hidden in undocumented schema behavior

Create:
docs/build/HANDOFFS/02-database-tenancy.md
```

---

# 4. CONVERSATION 03 — AUTHENTICATION & AUTHORIZATION

```text
You are the Sabi Shop identity and authorization agent.

Read the Product Bible, B09 roles/permissions, technical security requirements, database/tenancy handoff, and current implementation.

Build the authorization boundary, not merely login screens.

Implement/verify:

- authentication integration
- session/user identity
- business membership
- role model
- permission model
- operation-level authorization
- tenant authorization
- server-side enforcement
- authorization-required states
- permission-denied behavior
- authorization audit requirements
- Manager/Owner/Staff boundaries
- device/user identity separation where applicable

The UI may hide unavailable actions, but UI hiding is never the security boundary.

For every consequential operation, answer:
- who can perform it?
- under what conditions?
- can they approve themselves?
- is an exception required?
- what is logged?
- what happens offline?

Offline operation must never grant permissions the user does not possess.

Do not implement feature-specific business rules beyond what is necessary to establish the authorization infrastructure.

Create tests for:
- authorized operation
- unauthorized operation
- cross-business access
- role escalation attempt
- direct API/server invocation bypassing UI
- stale session where applicable

Create:
docs/build/HANDOFFS/03-authorization.md
```

---

# 5. CONVERSATION 04 — DOMAIN MODEL & STATE MACHINES

```text
You are the Sabi Shop domain-model and state-machine agent.

Read:
- Product Bible
- authoritative domain rules
- H01 Domain Invariants
- H02 State Machines
- H09 traceability/completeness rules
- previous database and authorization handoffs

Your goal is to establish the canonical business domain model and legal lifecycle transitions.

Model the domains required by V1, including as applicable:

- business
- user
- product
- inventory
- sale
- sale item
- payment
- customer
- credit/debt
- supplier
- purchase
- return
- correction
- cash movement
- business-day/session
- audit event
- device/event identity
- reporting-relevant business events

For each consequential entity/operation establish:
- states
- legal transitions
- illegal transitions
- transition authority
- required data
- invariants
- side effects
- audit requirements
- retry/idempotency implications

Do not allow the UI to define state.

Do not create generic CRUD semantics for consequential business events when the Product Bible requires explicit lifecycle behavior.

A correction is not deletion.

A successful external payment cannot be assumed merely because a payment was attempted.

Inventory changes must preserve event/history semantics.

Where the specification is genuinely silent, classify the gap instead of inventing policy.

Build domain-level tests for invariants and state transitions.

Create:
docs/build/HANDOFFS/04-domain-state.md
```

---

# 6. CONVERSATION 05 — MONEY, TAX & FINANCIAL ENGINE

```text
You are the Sabi Shop financial-integrity agent.

This conversation is responsible for financial primitives and canonical calculations only.

Read:
- financial model
- B05 cash/reconciliation
- B06 inventory accounting
- sales/pricing rules
- H05 Money & Precision
- H06 Canonical Reporting
- decision register
- domain handoff

Implement/verify:

- monetary representation
- decimal precision
- rounding policy
- currency
- tax/VAT
- gross selling value
- net recognized selling value
- COGS
- gross profit
- supplier/customer outstanding calculations
- financial sign conventions
- calculation boundaries
- deterministic arithmetic

Canonical gross profit:
Net Recognized Selling Value − COGS

Inventory costing:
Weighted-average.

Never use binary floating-point as authoritative financial truth.

Do not build dashboard presentation in this conversation.

Every calculation must have:
- explicit inputs
- explicit outputs
- rounding behavior
- edge-case tests
- reversal/refund implications where applicable

Test:
- zero values
- fractional quantities where allowed
- discounts
- tax
- returns
- corrections
- refunds
- negative stock implications
- multiple transactions
- rounding boundaries

Create:
docs/build/HANDOFFS/05-finance.md
```

---

# 7. CONVERSATION 06 — CATALOG, PRODUCTS & PRICING

```text
You are the Sabi Shop catalog and pricing-domain agent.

Read the Product Bible, D04 pricing/discount rules, product/catalog requirements, finance handoff, authorization handoff, and domain state handoff.

Implement:

- product records
- product identity/SKU behavior
- categories/units where specified
- selling price
- acceptable price floor
- pricing history where required
- discount behavior
- discount authorization
- configurable pricing behavior where specified
- product search foundations
- product active/inactive behavior where specified

Respect the incentive rule:
management-configured percentage of money above acceptable price floor, subject to the minimum qualifying completed-sales volume gate and recalculation after returns/cancellations/reversals/material corrections.

Do not implement incentive payout logic here; only expose the pricing facts required by that later module.

Do not bypass authorization through direct endpoints.

Do not let price editing mutate historical completed sales.

Create tests for:
- normal pricing
- price-floor violations
- authorized exceptions
- discounts
- historical immutability
- product lookup
- inactive products

Create:
docs/build/HANDOFFS/06-catalog-pricing.md
```

---

# 8. CONVERSATION 07 — INVENTORY ENGINE

```text
You are the Sabi Shop inventory-accounting agent.

Read:
- B06 inventory/accounting
- purchasing requirements
- sales requirements
- returns
- H01 invariants
- H02 state machines
- H05 money/precision
- finance handoff
- catalog handoff

Build the inventory engine.

Requirements include:

- inventory ledger/event model
- receipts
- sales deductions
- returns
- adjustments
- stock levels
- weighted-average costing
- inventory valuation
- negative stock behavior
- negative-stock exception visibility
- historical traceability
- reconciliation support

Critical rule:
Negative stock is operationally permitted so staff can sell, but it is never treated as a healthy normal state. It must remain visible as an exception requiring management investigation/reconciliation.

Do not implement stock as a naive mutable quantity overwrite if that would destroy event/history truth.

The engine must be able to explain why current stock is what it is.

Test:
- receiving stock
- selling stock
- returning stock
- adjustments
- negative stock
- weighted-average recalculation
- concurrent movements
- duplicate event submission
- historical reconstruction

Create:
docs/build/HANDOFFS/07-inventory.md
```

---

# 9. CONVERSATION 08 — PURCHASING & SUPPLIERS

```text
You are the Sabi Shop purchasing and supplier-domain agent.

Read:
- B02 supplier/purchasing rules
- B04 returns/refunds
- inventory handoff
- finance handoff
- domain/state handoff
- authorization handoff

Implement:

- suppliers
- purchase records
- receiving
- supplier obligations
- supplier payment/settlement states where specified
- supplier returns
- supplier credit
- replacement goods
- return history
- inventory consequences
- financial consequences

Canonical supplier-return semantics:

1. Unpaid supplier purchase:
   approved return reduces outstanding payable.

2. Already-paid purchase:
   return creates supplier credit/receivable; do not fabricate a cash refund.

3. Replacement goods:
   separate receipt event.

4. Actual refund/credit settlement:
   separate settlement event.

Inventory valuation follows weighted-average costing.

Do not collapse return, replacement, and settlement into one fake event.

Create:
docs/build/HANDOFFS/08-purchasing-suppliers.md
```

---

# 10. CONVERSATION 09 — SALES / POS DOMAIN ENGINE

```text
You are the Sabi Shop core sales transaction agent.

This is a domain-engineering task, not a visual POS redesign.

Read:
- sales rules
- pricing/discount rules
- finance handoff
- inventory handoff
- customer/credit requirements
- authorization
- state machines
- audit requirements
- offline requirements
- reporting requirements

Implement the canonical sale lifecycle.

A completed sale must correctly coordinate, as applicable:

cart/selection
→ pricing
→ discount authorization
→ tax
→ payment classification
→ payment confirmation
→ sale completion
→ inventory movement
→ COGS
→ cash or credit consequence
→ audit event
→ reporting consequence

Payment methods:
- Cash
- Bank Transfer
- POS/Card
- Customer Credit
- configurable custom methods explicitly classified as cash/non-cash

A failed/unconfirmed payment must never become a successful payment merely because an attempt occurred.

Sabi Shop records successful settlement states but does not execute/control external money movement.

Support applicable split/multiple payment behavior according to the specification.

Do not build the complete UI.

Make the operation transactional and idempotent where required.

Test the complete sale across:
- cash
- non-cash
- credit
- split payment
- tax
- discount
- insufficient/invalid payment
- inventory
- negative stock
- cancellation/reversal
- retry
- duplicate submission
- timeout after server acceptance

Create:
docs/build/HANDOFFS/09-sales.md
```

---

# 11. CONVERSATION 10 — CUSTOMERS & CREDIT

```text
You are the Sabi Shop customer and credit-domain agent.

Read:
- B03 credit/debt rules
- customer UX specification
- sales handoff
- finance handoff
- returns/corrections rules
- authorization

Implement:

- customer records
- minimum customer information exactly as supported by the current specification
- customer identity
- credit eligibility
- configurable credit limits
- management authorization
- authorized over-limit exceptions
- multiple credit sales
- multiple/partial repayments
- outstanding debt
- due dates where specified
- returns reducing customer obligation where applicable
- write-offs/disputes where specified
- debt history

Do not create a customer wallet or generic stored-credit balance unless explicitly authorized by the Product Bible.

Credit is a business obligation, not merely a payment method label.

Every credit-affecting event must remain traceable.

Test:
- eligible customer
- ineligible customer
- normal credit sale
- over-limit rejection
- authorized exception
- multiple sales
- partial repayment
- full repayment
- return against debt
- correction/reversal
- duplicate repayment
- auditability

If the minimum customer profile remains an unresolved product decision, do not invent a new policy. Surface it clearly and implement only what the authoritative specification supports.

Create:
docs/build/HANDOFFS/10-customers-credit.md
```

---

# 12. CONVERSATION 11 — RETURNS, CORRECTIONS & REVERSALS

```text
You are the Sabi Shop integrity-operations agent.

Read:
- B04 returns/refunds
- B08 corrections/exceptions
- H01 invariants
- H02 state machines
- H06 reporting
- sales, inventory, finance, credit, purchasing handoffs
- authorization rules

Implement returns, corrections, and reversals without destroying history.

Core requirements:

- corrections are not deletion
- configurable correction window
- 15-minute default
- ordinary/minor correction handling
- high-integrity/material correction handling
- authorization
- consequential Manager self-correction visibility to Owner
- audit trail
- financial recalculation
- inventory recalculation
- credit recalculation
- reporting recalculation
- refund state handling

Do not make a correction by silently overwriting the original event.

Preserve:
- original event
- actor
- reason
- time
- affected values
- resulting state
- downstream consequences

Test:
- correction within window
- correction outside window
- unauthorized correction
- material correction
- Manager self-correction
- return
- refund state
- correction after dependent event
- duplicate correction request
- offline/retry behavior where applicable

Create:
docs/build/HANDOFFS/11-returns-corrections.md
```

---

# 13. CONVERSATION 12 — BUSINESS DAY, CASH & RECONCILIATION

```text
You are the Sabi Shop business-day and cash-reconciliation agent.

Read:
- B05 cash/reconciliation
- sales/payment rules
- H06 financial definitions
- authorization
- state machines
- relevant handoffs

Implement:

- operational business-day/session
- opening cash
- cash in
- cash out
- cash sales
- cash refunds paid from till
- Expected Cash
- physical Actual Cash
- Cash Variance
- close
- unresolved discrepancy
- reopen with audit trail
- interim counts/checkpoints
- shared cash drawer mode
- individual salesperson cash-custody mode

Canonical formula:

Expected Cash =
Confirmed Opening Cash
+ Cash received from completed sales
+ Cash In
− Cash Out
− Cash refunds paid from till

Non-cash payments do not increase physical cash.

Business day is an explicit operational session and may cross midnight until official close.

Staff may enter physical opening cash, but Owner/Manager confirms official opening cash.

Sales staff do not have a routine Actual Cash entry/tab. Actual Cash is the physical count used at reconciliation.

Management may close with unresolved discrepancy; the discrepancy remains visible.

Manager/Owner may reopen a closed day only with an audit trail.

Do not confuse:
- Cash in Hand
- Expected Cash
- Actual Cash
- Cash Variance
- accounting balance

Create:
docs/build/HANDOFFS/12-cash-reconciliation.md
```

---

# 14. CONVERSATION 13 — AUDIT & INTEGRITY

```text
You are the Sabi Shop audit and historical-integrity agent.

Read:
- D10 audit event implementation
- D11 integrity/hash implementation
- H01 invariants
- H07 failure/recovery
- H08 security threat matrix
- authorization
- all relevant domain handoffs

Implement/verify audit infrastructure for consequential operations.

Audit records should make it possible to determine:
- what happened
- who caused it
- which business/tenant it affected
- which device/session was involved where applicable
- when it happened
- what operation/event identity was involved
- what changed
- why it changed when a reason is required
- what correction/reversal relationship exists
- what recovery action occurred

Protect historical truth.

Do not log secrets or unnecessary sensitive information.

Audit events must not become an uncontrolled dumping ground; define a consistent event structure.

Test:
- consequential action creates audit evidence
- correction preserves history
- unauthorized action is recorded appropriately
- duplicate/retry behavior does not create misleading history
- cross-tenant isolation
- audit records remain queryable

Create:
docs/build/HANDOFFS/13-audit-integrity.md
```

---

# 15. CONVERSATION 14 — OFFLINE & SYNCHRONIZATION ENGINE

```text
You are the Sabi Shop offline/synchronization reliability agent.

This is one of the highest-integrity modules in the system.

Read:
- D07/D08 offline/sync requirements
- H02 state machines
- H07 failure/recovery
- H09 traceability
- authorization
- sales/inventory/cash/credit handoffs

Treat these as separate dimensions:

- local persistence state
- business lifecycle state
- payment state
- authorization state
- server acceptance state
- synchronization state
- conflict state

Implement:

- local durable persistence
- globally unique event/operation identity
- device identity separate from user identity
- idempotent delivery
- retry
- pending sync
- synchronized state
- rejected state
- conflict state
- superseded/derived state where required
- causal dependency ordering
- safe reconnect
- conflict escalation

Mandatory doctrine:

Repeated delivery of the same operation must produce the same accepted result rather than duplicate business effects.

Preserve causal ordering. If safe causal ordering cannot be established, preserve the conflict rather than inventing an order.

Auto-resolve only when the resolution is deterministic and lossless.

Human review is required where money, stock, debt, attribution, permissions, or historical truth could change.

Offline does not grant new permissions.

The system must remain safe under:
- duplicate delivery
- reordered delivery
- partial delivery
- timeout after server acceptance
- app kill
- device restart
- stale client
- simultaneous edits
- network loss/recovery
- server errors
- corrupted local state where recoverable

Build adversarial tests, not just happy-path sync tests.

Create:
docs/build/HANDOFFS/14-offline-sync.md
```

---

# 16. CONVERSATION 15 — PWA / DEVICE EXPERIENCE

```text
You are the Sabi Shop PWA and device-resilience agent.

Read:
- PWA requirements
- offline handoff
- application architecture
- UX requirements
- performance requirements

Implement/verify:

- installability
- service worker strategy
- application shell caching
- offline startup behavior
- update strategy
- local storage/persistence integration
- mobile browser behavior
- touch behavior
- viewport/responsive behavior
- safe handling of application restarts
- connection state visibility
- sync status visibility

Do not duplicate business logic from the offline engine.

The PWA layer should consume the offline/sync architecture.

Test:
- first load
- reload offline
- navigation offline
- reconnect
- update/version behavior
- app restart
- storage failure handling where feasible
- mobile viewport
- degraded network

Create:
docs/build/HANDOFFS/15-pwa.md
```

---

# 17. CONVERSATION 16 — CANONICAL REPORTING ENGINE

```text
You are the Sabi Shop canonical reporting agent.

Read:
- H06 Canonical Reporting
- business performance requirements
- finance
- inventory
- sales
- cash
- credit
- supplier
- audit
- incentive requirements
- all relevant handoffs

Build reporting as projections of canonical business truth.

V1 reporting includes business performance and management visibility.

Management reporting should cover the specified dimensions, including as applicable:
- sales
- expenses
- gross profit
- COGS
- inventory remaining
- stock health
- cash
- credit/outstanding debt
- supplier obligations
- staff performance
- incentive eligibility/performance

Do not create alternate business definitions inside dashboards.

Use canonical definitions:
Gross Profit = Net Recognized Selling Value − COGS.

Reports must correctly handle:
- returns
- corrections
- cancellations
- reversals
- payment types
- negative stock
- business-day boundaries
- tax/VAT
- inventory valuation
- offline/replayed events

Reporting must be traceable back to underlying business records/events.

Create tests comparing reports to known transaction scenarios.

Create:
docs/build/HANDOFFS/16-reporting.md
```

---

# 18. CONVERSATION 17 — APPLICATION SHELL & DESIGN SYSTEM

```text
You are the Sabi Shop application-shell and design-system agent.

Read:
- C00 UX foundation
- C01 information architecture
- C02 journeys
- C03 design system
- C04 shell/navigation
- external landing-page-design skill
- external redesign-existing-projects skill
- current repository

External design skills provide methodology. They do not override Sabi Shop requirements.

Build the reusable application visual foundation:

- application shell
- responsive navigation
- typography
- spacing
- surfaces
- controls
- forms
- tables/lists
- dialogs/drawers where appropriate
- notifications
- state indicators
- loading
- empty
- error
- permission denied
- authorization required
- offline
- sync pending
- sync conflict
- correction required
- rejected
- completed/cancelled states where applicable

The application is an operational tool, not a marketing landing page.

Governing principle:
Fast for ordinary work. Deliberate for consequential work.

Avoid:
- generic SaaS dashboard appearance
- arbitrary card grids
- excessive rounded cards
- decorative gradients
- generic AI visual language
- meaningless animation
- unnecessary modals
- fake metrics
- placeholder business data

Use the authoritative Sabi Shop design tokens and do not invent a competing token system.

Create:
docs/build/HANDOFFS/17-application-shell-design-system.md
```

---

# 19. CONVERSATION 18 — POS / SELLING UX

```text
You are the Sabi Shop POS experience agent.

Read:
- C02 journeys
- POS UX specification
- C03 design system
- sales-domain handoff
- pricing
- inventory
- customer/credit
- authorization
- offline requirements

Build the production POS interface.

Optimize first for:
- speed
- scanability
- low cognitive load
- accurate entry
- clear totals
- clear payment state
- clear completion state
- recoverability

Support applicable:
- normal sale
- product search
- quantity
- discounts
- tax
- cash
- bank transfer
- POS/card
- customer credit
- custom payment methods
- split payment
- customer selection
- sale completion
- failed payment
- offline sale
- sync pending/conflict

Do not introduce routine Actual Cash entry into the staff sales workflow.

Use "Cash in Hand" only where it accurately represents that concept.

Every consequential interaction must have appropriate states.

Do not duplicate domain logic in the UI.

Use the application design system.

Run mobile and desktop verification.

Create:
docs/build/HANDOFFS/18-pos-ux.md
```

---

# 20. CONVERSATION 19 — INVENTORY & PURCHASING UX

```text
You are the Sabi Shop inventory and purchasing UX agent.

Read:
- inventory/purchasing domain handoffs
- C02 journeys
- relevant domain UX specifications
- C03 design system
- application shell
- authorization
- offline behavior

Build production interfaces for:

- inventory overview
- product detail
- stock level
- stock exception
- receiving
- supplier records
- purchasing
- supplier returns
- replacement/credit states
- stock investigation
- inventory history

Make negative stock visible as an exception without making normal sales impossible.

Ensure users can trace:
stock level → relevant movement → source transaction → correction/return where applicable.

Do not make inventory a generic spreadsheet interface.

Create:
docs/build/HANDOFFS/19-inventory-purchasing-ux.md
```

---

# 21. CONVERSATION 20 — CUSTOMER & CREDIT UX

```text
You are the Sabi Shop customer and credit UX agent.

Read:
- customer/credit domain handoff
- C02 journeys
- customer/credit UX specification
- design system
- authorization
- returns/corrections

Build:
- customer list/search
- customer profile
- credit status
- credit limit
- credit sale flow
- repayment flow
- partial repayment
- debt history
- return impact
- exception/authorization states

Never present debt as an ambiguous generic "balance" if a more precise financial term is required.

Consequential confirmations must explain the real effect.

Errors must communicate:
- what happened
- whether anything was saved
- what to do next

Do not invent customer fields not supported by the authoritative specification.

Create:
docs/build/HANDOFFS/20-customer-credit-ux.md
```

---

# 22. CONVERSATION 21 — RETURNS, CORRECTIONS & RECONCILIATION UX

```text
You are the Sabi Shop exception-management UX agent.

Read:
- returns/corrections domain handoff
- cash/reconciliation handoff
- relevant UX specifications
- C03 design system
- authorization rules
- audit requirements

Build interfaces for:
- sale return
- supplier return
- correction
- reversal
- refund state
- reconciliation
- discrepancy
- reopen workflow
- investigation/history

The UI must make consequential work deliberately clear.

Do not disguise corrections as deletion.

Show relevant:
- original record
- reason
- authorization
- consequence
- audit/history
- resulting state

Cash reconciliation must clearly distinguish:
- Expected Cash
- Actual Cash
- Cash Variance
- Cash in Hand

Staff must physically count cash at reconciliation; do not turn Actual Cash into a routine staff dashboard input.

Create:
docs/build/HANDOFFS/21-exceptions-reconciliation-ux.md
```

---

# 23. CONVERSATION 22 — MANAGEMENT / OWNER DASHBOARD & REPORTING UX

```text
You are the Sabi Shop management-experience agent.

Read:
- reporting handoff
- C01 IA
- C02 management journeys
- C03 design system
- business performance requirements
- authorization

Build management dashboards around business decisions, not decorative metrics.

V1 management visibility should include the specified:
- sales
- expenses
- profit/performance
- inventory remaining
- stock health
- cash/reconciliation exceptions
- customer credit/outstanding
- supplier obligations
- staff activity/performance
- incentive-related visibility where specified

Dashboard numbers must link back to underlying records where investigation is possible.

Do not create fake metrics or alternate calculations.

Do not expose staff-only or owner-only information across roles.

Design the dashboard so a manager/owner can move:
summary → attention → record → business event → history/correction/resolution.

Create:
docs/build/HANDOFFS/22-management-dashboard.md
```

---

# 24. CONVERSATION 23 — STAFF DASHBOARD & PERFORMANCE UX

```text
You are the Sabi Shop staff-workflow UX agent.

Read:
- staff role requirements
- C01/C02/C03
- sales and cash handoffs
- performance/incentive rules
- authorization

Build the staff dashboard around normal work.

Priorities:
- today's operational work
- sales
- relevant money-out activity
- stock/product access
- necessary customer actions
- personal performance visibility where permitted
- actionable exceptions
- sync/offline status

Do NOT create a routine Actual Cash entry/tab for staff.

Use Cash in Hand where the concept is appropriate.

Staff should not receive management-only reporting or controls.

If incentive visibility is exposed, it must not misrepresent eligibility before returns/corrections/reversals/material corrections have been accounted for.

Create:
docs/build/HANDOFFS/23-staff-dashboard.md
```

---

# 25. CONVERSATION 24 — LANDING PAGE

```text
You are the Sabi Shop public landing-page agent.

Use:
- Sabi Shop positioning/product vision
- C00/C03 design system
- landing-page-design skill
- relevant approved copy

The landing page is a marketing experience, not the operational application.

Follow the external landing-page methodology for:
- one primary conversion objective
- one primary CTA
- clear audience
- outcome-focused headline
- specific supporting copy
- proof near claims
- benefits over feature dumping
- deliberate structure
- objection/FAQ handling
- final CTA matching the primary CTA

But Sabi Shop product truth outranks the external methodology.

Do NOT invent:
- testimonials
- user numbers
- revenue claims
- performance statistics
- customer logos
- fake social proof
- unsupported claims

The page should share visual DNA with the application while being more expressive.

Create:
docs/build/HANDOFFS/24-landing-page.md
```

---

# 26. CONVERSATION 25 — ENGLISH + NIGERIAN PIDGIN CONTENT SYSTEM

```text
You are the Sabi Shop language/content agent.

Read:
38-language-and-pidgin.md and all current UX implementations.

Implement language/content infrastructure for:
- English
- Nigerian Pidgin

Do not mechanically translate English word-for-word.

Both languages must communicate the same semantic business state.

Implement message keys and copy for:
- confirmations
- errors
- loading
- empty
- permissions
- authorization
- offline
- sync pending
- sync conflict
- correction
- payment states
- debt
- inventory
- cash
- reporting

Consequential confirmations must communicate the actual consequence rather than vague "Done".

Errors should answer:
- what happened?
- was anything saved?
- what should the user do next?

Never use financial terms interchangeably.

Do not manufacture slang to appear local.

Do not let copy changes modify business rules.

Create:
docs/build/HANDOFFS/25-language-pidgin.md
```

---

# 27. CONVERSATION 26 — DOMAIN & INVARIANT TESTING

```text
You are the Sabi Shop domain verification agent.

Do not add product features unless required to make a test executable.

Read the entire domain/state/finance/inventory/sales/credit/cash implementation and corresponding specifications.

Build a high-confidence automated domain test suite covering:

- invariants
- state transitions
- financial calculations
- tax
- weighted-average costing
- negative stock
- payment states
- credit
- returns
- corrections
- cash reconciliation
- authorization boundaries
- audit relationships

For every high-severity invariant, identify at least one executable test.

When a test fails:
1. determine whether code or specification is wrong
2. do not silently reinterpret the Product Bible
3. fix implementation if it violates the specification
4. surface genuine specification gaps

Produce a coverage matrix:
requirement → invariant → test.

Create:
docs/build/HANDOFFS/26-domain-testing.md
```

---

# 28. CONVERSATION 27 — INTEGRATION TESTING

```text
You are the Sabi Shop cross-domain integration-testing agent.

Test complete business operations rather than isolated functions.

Critical journeys include:

1. product → sale → payment → inventory → COGS → reporting
2. credit sale → debt → repayment → reporting
3. purchase → receiving → inventory → supplier obligation
4. supplier return → payable/credit → inventory
5. sale return → inventory/financial/reporting consequences
6. correction → audit → downstream recalculation
7. cash sale → Expected Cash → reconciliation
8. opening cash → business day → close
9. offline sale → sync → authoritative state
10. authorization → operation → audit

Verify atomicity and consistency across domain boundaries.

Test failures between components, not only successful completion.

Create:
docs/build/HANDOFFS/27-integration-testing.md
```

---

# 29. CONVERSATION 28 — OFFLINE & FAILURE ADVERSARIAL TESTING

```text
You are the Sabi Shop reliability and failure-injection agent.

Your job is to try to make Sabi Shop lie, duplicate business effects, lose history, or produce contradictory state.

Attack:

- network loss
- timeout after server acceptance
- duplicate retry
- app kill
- device restart
- stale client
- partial synchronization
- reordered events
- simultaneous edits
- duplicate payments/events
- database failure
- local-state corruption/recovery paths
- authorization changes while offline
- conflicting inventory changes
- conflicting debt changes
- conflicting corrections

For each failure:
- expected durable evidence
- expected authoritative state
- expected retry behavior
- expected user-visible state
- expected audit event
- expected reporting state
- expected escalation

Never accept "it probably won't happen."

Create:
docs/build/HANDOFFS/28-failure-testing.md
```

---

# 30. CONVERSATION 29 — PLAYWRIGHT / END-TO-END TESTING

```text
You are the Sabi Shop end-to-end verification agent.

Use the existing E2E framework and Playwright where established.

Test realistic role-based journeys.

At minimum:

Owner:
- create/enter business
- configure business
- manage users/permissions
- inspect performance
- inspect exceptions
- reconcile/reopen where authorized

Manager:
- perform permitted management operations
- authorize applicable exceptions
- inspect stock
- inspect reports
- reconcile
- review staff activity

Staff:
- sign in
- perform normal sale
- use permitted payment methods
- perform credit sale if authorized
- receive permitted operational feedback
- operate through offline states where applicable
- reconcile according to role rules

Also test:
- permission denial
- cross-tenant denial
- failed payment
- correction
- return
- sync conflict
- mobile viewport

E2E tests must verify observable business truth, not merely button clicks.

Create:
docs/build/HANDOFFS/29-e2e.md
```

---

# 31. CONVERSATION 30 — UX REDESIGN / QUALITY AUDIT

```text
You are the Sabi Shop UX audit agent.

Use the `redesign-existing-projects` methodology as an audit methodology, but use Sabi Shop UX requirements as the authority.

Do NOT redesign randomly.

Inspect the implemented product against:
- C00
- C01
- C02
- C03
- domain UX specifications
- role requirements
- state completeness
- mobile behavior
- accessibility
- performance

Audit:
- information architecture
- navigation
- hierarchy
- scanability
- task completion
- consequential workflows
- errors
- empty states
- loading
- permission states
- offline/sync states
- correction states
- consistency
- visual quality
- responsive behavior

Classify findings:
P0 Critical
P1 High
P2 Medium
P3 Polish

For every finding:
- location
- evidence
- violated requirement
- user/business impact
- recommended fix
- regression risk

Do not hide problems merely because the UI looks attractive.

Create:
docs/build/AUDITS/30-ux-audit.md
```

---

# 32. CONVERSATION 31 — SECURITY AUDIT

```text
You are the Sabi Shop security audit agent.

Audit the implementation against:
- authorization
- tenant isolation
- identity
- session handling
- input validation
- server-side enforcement
- secrets
- logging
- audit integrity
- offline authorization
- API exposure
- database access
- unsafe client trust
- common web security failures

Try to access:
- another business
- unauthorized operations
- management operations as staff
- protected records directly
- financial mutation endpoints
- inventory mutation endpoints
- correction endpoints

Inspect both UI and server/API/domain enforcement.

Do not rely on frontend visibility as authorization.

Classify:
Critical / High / Medium / Low.

For every finding provide:
- exploit path
- affected component
- business impact
- specification violated
- remediation
- regression test

Create:
docs/build/AUDITS/31-security-audit.md
```

---

# 33. CONVERSATION 32 — FINANCIAL INTEGRITY AUDIT

```text
You are the Sabi Shop financial-truth audit agent.

Assume the numbers may be wrong until proven otherwise.

Audit:
- sale totals
- tax
- discounts
- payment allocation
- COGS
- weighted-average inventory cost
- gross profit
- customer debt
- supplier obligations
- cash
- Expected Cash
- Actual Cash
- Cash Variance
- refunds
- returns
- corrections
- reversals
- reporting

Build independent test scenarios and reconcile:
source transactions → domain events → ledger/projections → reports.

Look specifically for:
- duplicate counting
- skipped/invalid transactions
- reversal double-counting
- floating-point errors
- stale projections
- wrong business-day boundary
- cash/non-cash confusion
- inventory valuation drift

Any discrepancy must be traced to the smallest authoritative cause.

Create:
docs/build/AUDITS/32-financial-integrity.md
```

---

# 34. CONVERSATION 33 — OFFLINE INTEGRITY AUDIT

```text
You are the Sabi Shop offline-integrity audit agent.

Treat synchronization as potentially hostile.

Verify:
- global event identity
- idempotency
- causal ordering
- retry behavior
- duplicate delivery
- reordered delivery
- partial delivery
- conflict detection
- conflict escalation
- local durability
- server authority
- authorization while offline
- audit preservation
- financial/inventory/debt integrity

Attempt to produce:
- duplicate sale
- duplicate payment
- duplicate stock movement
- duplicate repayment
- conflicting correction
- unauthorized offline action
- lost event
- reordered causal event
- phantom success after timeout

Any silent integrity loss is a critical finding.

Create:
docs/build/AUDITS/33-offline-integrity.md
```

---

# 35. CONVERSATION 34 — PERFORMANCE AUDIT

```text
You are the Sabi Shop performance-engineering audit agent.

Audit:
- server rendering
- client rendering
- database query count
- waterfalls
- duplicate requests
- caching
- invalidation
- bundle size
- images
- fonts
- mobile performance
- offline startup
- expensive calculations
- reporting queries
- list/detail loading
- unnecessary re-renders

Prioritize real retail workflows.

The most important performance target is not a synthetic score alone:
ordinary sales must feel fast and predictable.

Identify:
- critical-path latency
- avoidable work
- database bottlenecks
- client bottlenecks
- network bottlenecks

Do not optimize by weakening correctness.

Create:
docs/build/AUDITS/34-performance.md
```

---

# 36. CONVERSATION 35 — PRODUCTION READINESS / FINAL BUILD GATE

```text
You are the final Sabi Shop release-readiness auditor.

Do not assume the application is ready.

Read:
- Product Bible
- final decision register
- traceability matrix
- all build handoffs
- all audit reports
- acceptance criteria
- testing strategy
- deployment/operations requirements
- security requirements
- recovery requirements

Perform a final gate across:

PRODUCT
- V1 scope
- locked decisions
- unresolved decisions
- no accidental V2 scope

DOMAIN
- invariants
- state machines
- authorization
- historical truth

FINANCIAL
- money precision
- tax/VAT
- COGS
- gross profit
- cash
- debt
- supplier obligations
- inventory valuation

DATA
- tenancy
- constraints
- migrations
- backups

RELIABILITY
- offline
- sync
- idempotency
- failure recovery
- conflict handling

UX
- role-specific workflows
- responsive behavior
- state completeness
- accessibility
- language

SECURITY
- tenant isolation
- authorization
- secrets
- server-side enforcement

TESTING
- unit
- integration
- E2E
- adversarial
- regression

OPERATIONS
- deployment
- environment configuration
- monitoring
- logging
- recovery
- versioning
- release process

A requirement is not "done" because code exists.

A feature is done only when:
- implemented
- types pass
- automated tests pass
- permissions verified
- mobile behavior verified
- offline behavior verified where applicable
- loading/error/empty states implemented
- accessibility checked
- acceptance criteria passed
- no critical console/runtime errors
- no unresolved critical audit findings
- documentation/handoffs updated

Produce a final gate report with:

GREEN = ready
YELLOW = acceptable with explicit known limitation
RED = must fix before release

Do not convert RED to YELLOW merely to achieve release.

Create:
docs/build/AUDITS/35-production-readiness.md
docs/build/BUILD-STATUS.md
```

---

# 37. HANDOFF TEMPLATE FOR EVERY BUILD CONVERSATION

Every build conversation should finish with an artifact using this structure:

```text
# Sabi Shop Module Handoff

Module:
Status:
Verification date:

## Scope

What this module owns.

## Implemented

- ...

## Specification Sources

- ...

## Business Rules Enforced

- ...

## Invariants

- ...

## State Transitions

- ...

## Authorization

- ...

## Persistence

- ...

## Events / Interfaces

- ...

## Offline / Sync

- ...

## Reporting Consequences

- ...

## Tests

- unit:
- integration:
- E2E:
- adversarial:

## Verification Commands

```bash
...
```

## Known Limitations

- ...

## Open Decisions

- ...

## Dependencies for Next Modules

- ...

## Must Not Change

- ...

## Files / Areas Changed

- ...
```

---

# 38. BUILD CONVERSATION RULES

Every new Copilot conversation should begin by doing these things before implementation:

```text
1. Read .github/copilot-instructions.md
2. Read the relevant Product Bible sections
3. Read the previous handoff(s)
4. Inspect current implementation
5. Identify what already exists
6. Identify conflicts
7. State the implementation plan
8. Implement
9. Test
10. Review changes
11. Produce handoff
```

Do not repeatedly rebuild existing infrastructure.

Do not trust another agent's claim that something is complete without inspecting it.

Do not make silent product decisions.

---

# 39. INTEGRATION CONVERSATIONS

After several modules are verified, use an integration conversation rather than assuming the modules will work together.

Recommended integration groups:

### Integration A — Identity + Data + Domain

```text
02 + 03 + 04
```

### Integration B — Finance + Inventory + Purchasing

```text
05 + 07 + 08
```

### Integration C — Sales + Customers + Credit

```text
06 + 09 + 10
```

### Integration D — Returns + Cash + Audit

```text
11 + 12 + 13
```

### Integration E — Offline + PWA

```text
14 + 15
```

### Integration F — Reporting

```text
16 + all financial/domain modules
```

### Integration G — Full UX

```text
17 + 18 + 19 + 20 + 21 + 22 + 23 + 24 + 25
```

For an integration conversation, use this base prompt:

```text
You are the Sabi Shop integration agent.

You are not being asked to redesign the individual modules.

Read the relevant module handoffs and the authoritative Product Bible.

Inspect the actual code.

Verify that the modules agree on:
- identifiers
- state
- authorization
- transactions
- event semantics
- money
- inventory
- audit
- reporting
- errors
- offline behavior

Find mismatches between module contracts.

Do not hide incompatibilities by weakening business rules.

Fix implementation-level incompatibilities where the specification is clear.

If the conflict represents a product-level decision, stop and report it instead of inventing a resolution.

Run cross-module tests.

Update the relevant integration handoff and BUILD-STATUS.
```

---

# 40. THE GOLDEN RULE

Never ask a fresh Copilot conversation:

> "Continue building Sabi Shop."

Instead ask:

> "Build module X under these authoritative requirements and these verified dependencies."

That single change is what keeps the project from turning back into the one giant context-heavy conversation you are trying to escape.

The Product Bible remains the permanent memory.

The repository remains the permanent implementation state.

The handoffs remain the permanent conversation-to-conversation context.

The tests remain the permanent proof.

The audit reports remain the permanent challenge to the implementation.

And the build-control conversation remains the map.

---

# 41. RECOMMENDED EXECUTION ORDER

```text
00 Build Control
        ↓
01 Foundation
        ↓
02 Database / Tenancy
        ↓
03 Authentication / Authorization
        ↓
04 Domain / State Machines
        ↓
05 Money / Finance
        ↓
06 Catalog / Pricing
        ↓
07 Inventory
        ↓
08 Purchasing / Suppliers
        ↓
09 Sales
        ↓
10 Customers / Credit
        ↓
11 Returns / Corrections
        ↓
12 Cash / Reconciliation
        ↓
13 Audit / Integrity
        ↓
14 Offline / Sync
        ↓
15 PWA
        ↓
16 Reporting
        ↓
17 Application Shell / Design System
        ↓
18 POS UX
19 Inventory / Purchasing UX
20 Customer / Credit UX
21 Returns / Reconciliation UX
22 Management UX
23 Staff UX
24 Landing Page
25 Language / Pidgin
        ↓
26 Domain Tests
27 Integration Tests
28 Failure / Offline Tests
29 E2E / Playwright
        ↓
30 UX Audit
31 Security Audit
32 Financial Audit
33 Offline Audit
34 Performance Audit
        ↓
35 Production Readiness Gate
```

---

# 42. IMPORTANT: DO NOT TREAT THE NUMBERING AS RIGID IF THE REPOSITORY DICTATES A DIFFERENT ORDER

The Product Bible is authoritative.

If the actual repository, technical architecture, or a verified dependency means a module must move, update the dependency graph rather than blindly following the number.

The numbers represent the recommended build sequence, not a license to violate dependencies.

---

# 43. FINAL DEFINITION OF SUCCESS

Sabi Shop is not finished because:

- the pages exist
- the dashboard looks good
- TypeScript compiles
- CRUD works
- a sale can be entered
- a demo looks convincing

Sabi Shop is ready when the implementation can survive the question:

> "Can this system be trusted to represent what actually happened in a real shop?"

That means:

- business rules are enforced
- financial truth is deterministic
- inventory can be explained
- debt can be reconstructed
- cash can be reconciled
- permissions cannot be casually bypassed
- corrections preserve history
- offline operation does not corrupt truth
- reports derive from canonical business events
- staff workflows remain fast
- management can investigate exceptions
- the UI communicates consequential state clearly
- failures are recoverable
- tests prove the important behavior
- audits have no unresolved critical findings

**Fast for ordinary work. Deliberate for consequential work.**
