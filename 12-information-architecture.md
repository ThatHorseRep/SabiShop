# C01 — Information Architecture

**Product:** Sabi Shop  
**Document ID:** C01  
**Package:** C — User Experience Specification  
**Status:** FINAL — RECONCILED V1
**Version:** 1.0  
**Prepared:** 2026-09-04  
**Depends on:** C00 — UX & Design Foundation  
**Authoritative for:** Sabi Shop UX information architecture, navigation hierarchy, area relationships, and structural grouping  
**Does not replace:** B01–B09 business rules, D02 terminology, D03/D04/D05 domain rules, D07/D08 offline/sync implementation, D10/D11 audit/integrity implementation

---

## 1. Purpose

C01 defines the information architecture (IA) of Sabi Shop.

It establishes:

- the major areas of the product;
- the hierarchy between those areas;
- what belongs in primary navigation;
- what belongs inside operational workspaces;
- how records and related business events connect;
- how the experience differs for Staff, Manager, and Owner;
- how the architecture supports both fast daily selling and deliberate management work;
- the structural rules that later UX deliverables must follow.

C01 is intentionally about **structure and relationships**, not final visual styling.

The architecture must support Sabi Shop's established product character:

> **Fast for ordinary work. Deliberate for consequential work.**

The system is a lightweight business operating system for small retail businesses, not a generic ERP dashboard.

---

# 2. Source Hierarchy

When determining the structure of the product, use this order:

1. Explicit Sabi Shop product decisions and locked business rules.
2. Authoritative Sabi Shop domain specifications.
3. C00 and later Package C UX specifications.
4. Sabi Shop design-system decisions.
5. External design methodologies.
6. Framework defaults.
7. Agent preference.

C01 cannot use information architecture to weaken or bypass a business rule.

For example:

- a correction cannot be hidden merely because it makes the interface cleaner;
- a management approval cannot be removed merely because it adds a step;
- a historical transaction cannot appear deletable merely because the record is shown in a standard table;
- staff cannot gain management information simply because it is convenient to place it in one dashboard.

---

# 3. Architectural Goals

The IA must achieve six goals simultaneously.

## 3.1 Fast daily operation

A salesperson should reach the normal selling workflow immediately.

Common actions must not require navigating through management-oriented areas.

## 3.2 Clear business understanding

Management must be able to move from summary information to the underlying records that explain it.

A dashboard number should lead to evidence, not become an isolated statistic.

## 3.3 Strong separation between execution and management

The application must distinguish:

- daily execution;
- operational records;
- management oversight;
- configuration;
- exceptions and corrections;
- system/integrity concerns.

This reduces cognitive load for Staff while preserving management control.

## 3.4 Relationship-first architecture

Sabi Shop records are interconnected.

Examples:

```text
Sale
 ├── Sale items
 ├── Payment(s)
 ├── Customer
 ├── Salesperson
 ├── Inventory effects
 ├── Receipt
 ├── Corrections
 └── Returns / settlement events
```

The IA must make these relationships discoverable.

## 3.5 Offline continuity

Core operational areas must remain usable when offline.

The architecture must allow users to understand:

- locally recorded activity;
- pending synchronization;
- stale information;
- conflicts;
- actions requiring later management review.

## 3.6 Audit-safe interaction

History must remain understandable.

The IA must never make the system feel like records can simply disappear.

---

# 4. Recommended Top-Level Product Model

Sabi Shop should be structured around **work**, not around a collection of generic dashboard cards.

Recommended top-level application areas:

```text
Sabi Shop
│
├── Home
│
├── Sell
│
├── Products & Inventory
│
├── Customers & Credit
│
├── Suppliers & Purchasing
│
├── Money
│
├── Activity
│
├── Management
│
└── Settings
```

This is the recommended conceptual architecture.

It does **not** mean every role sees every area.

The visible navigation is permission-aware.

---

# 5. Primary Information Architecture

## 5.1 Home

**Purpose:** Provide the user's appropriate starting point and immediate operational context.

Home is not merely a decorative dashboard.

### Staff Home

Staff Home should prioritize:

- starting a sale;
- current operational information;
- relevant stock/product access;
- own activity;
- pending actions;
- shift/reconciliation context where applicable;
- clear offline/sync status.

Staff should not receive management financial analysis merely because Home exists.

### Manager / Owner Home

Management Home should prioritize:

- Total Sales;
- Total Expenses;
- Cash in Hand;
- business performance;
- inventory attention;
- customer debt attention;
- supplier/purchasing attention;
- exceptions/reviews;
- staff activity;
- synchronization/integrity attention where relevant.

Management Home should answer:

> What happened?

> What needs attention?

> Where should I look next?

Home may summarize information from other areas, but those areas remain the underlying sources of detail.

---

# 6. Sell

**Primary operational workspace.**

This should be the fastest path in the application.

## 6.1 Sell structure

```text
Sell
│
├── New Sale
│   ├── Find product
│   ├── Add product
│   ├── Adjust quantity
│   ├── Set/confirm actual price
│   ├── Apply permitted discount
│   ├── Identify customer when needed
│   ├── Select/record payment
│   └── Complete sale
│
├── Current / Open Sale
│
├── Recent Sales
│
└── Sale Detail
    ├── Items
    ├── Payment(s)
    ├── Customer
    ├── Salesperson
    ├── Receipt
    ├── Inventory effects
    ├── Corrections
    ├── Returns
    └── Related events
```

## 6.2 New Sale is a workspace, not a separate business domain

The user should not need to navigate to Customers, Inventory, or Payments before completing a normal sale.

Those records should be available contextually inside the sale workflow.

## 6.3 Payment

Payment belongs conceptually to the sale workflow but must preserve payment as its own underlying record/event.

Supported V1 methods include:

- Cash;
- Bank Transfer;
- POS/Card;
- Customer Credit.

Split payments must remain visible as individual components.

Unconfirmed transfer claims must not appear as confirmed successful payment.

## 6.4 Sale completion

The completion action should clearly communicate that the sale is becoming a recorded business event.

The system must preserve:

- actual items;
- actual quantities;
- actual prices;
- payment components;
- salesperson attribution;
- customer/credit relationship where applicable;
- transaction identity;
- relevant downstream effects.

## 6.5 Sale Detail

Sale Detail is a key cross-domain screen.

It should provide a coherent view of the sale while linking rather than duplicating related records.

Recommended conceptual sections:

```text
Sale Detail
│
├── Summary
├── Items
├── Payment
├── Customer
├── Salesperson
├── Receipt
├── Status / Current State
├── Corrections & History
├── Returns
└── Related Business Effects
```

Later UX specifications determine the exact visual presentation.

---

# 7. Products & Inventory

**Purpose:** Manage product identity, stock, pricing context, purchase history, and inventory movement.

```text
Products & Inventory
│
├── Products
│   ├── Search / Browse
│   └── Product Detail
│
├── Stock
│   ├── Current Stock
│   ├── Stock Attention
│   └── Stock Discrepancies
│
├── Stock Movements
│
├── Purchases / Receipts
│
└── Inventory Corrections
```

## 7.1 Products

Product search is a core operational capability.

The architecture must support discovery by appropriate signals such as:

- exact code;
- partial code;
- product name;
- aliases;
- categories;
- safe spelling variations.

The UI must reduce wrong-SKU selection risk.

## 7.2 Product Detail

Product Detail should connect:

- product identity;
- current selling price;
- stock;
- units/conversions;
- purchase history;
- acquisition-cost history;
- stock movement history;
- relevant sales/performance;
- applicable configuration.

Staff visibility must respect B09.

## 7.3 Stock

Stock is an operational view, not a replacement for the inventory ledger.

Important distinctions:

- current quantity;
- physical count;
- expected/recorded quantity;
- discrepancy;
- corrective action.

Negative stock must not become a normal successful outcome in the UX. Under the current correction policy it is an integrity/exception condition requiring investigation and reconciliation.

## 7.4 Stock Movements

Stock movements should be traceable back to their business causes.

Examples:

- received purchase;
- sale;
- approved return to stock;
- stock adjustment;
- damage/loss/write-off;
- other supported inventory event.

---

# 8. Customers & Credit

This area intentionally combines lightweight customer records with the credit/debt workflow.

```text
Customers & Credit
│
├── Customers
│   └── Customer Detail
│
├── Credit / Outstanding
│
├── Repayments
│
└── Debt Attention
```

## 8.1 Why these belong together

A general CRM is not a V1 objective.

Customer information matters primarily when it supports:

- identification;
- credit;
- debt;
- repayments;
- transaction history;
- return/refund context where applicable.

## 8.2 Customer Detail

Recommended conceptual structure:

```text
Customer Detail
│
├── Identity
├── Contact
├── Credit Status
├── Outstanding Debt
├── Credit Sales
├── Repayments
├── Clearance / Payment Proof
└── Related Transactions
```

The architecture must not expose sensitive management information to Staff simply because they can view a customer.

## 8.3 Credit

Credit is a controlled business capability.

The IA should make clear when the user is:

- requesting credit;
- approving credit;
- viewing outstanding debt;
- recording repayment;
- investigating a debt;
- resolving an exception.

A credit sale should never feel like an ordinary cash payment with a different button.

---

# 9. Suppliers & Purchasing

**Management-oriented operational area.**

```text
Suppliers & Purchasing
│
├── Suppliers
│   └── Supplier Detail
│
├── Purchases
│   └── Purchase Detail
│
├── Receive Stock
│
├── Supplier Payments
│
├── Supplier Returns
│
└── Supplier Liabilities
```

## 9.1 Supplier Detail

Should connect:

- supplier identity;
- purchases;
- received stock;
- acquisition costs;
- supplier payments;
- outstanding supplier liability;
- returns;
- corrections/history.

## 9.2 Purchase Detail

Purchase Detail should expose the relationship between:

```text
Supplier
   ↓
Purchase
   ↓
Received stock
   ↓
Acquisition cost
   ↓
Payment / supplier liability
```

Inventory should not increase merely because a purchase was discussed or expected.

Authoritative receiving occurs when management records receipt.

---

# 10. Money

**Purpose:** Give users an understandable view of money movements without collapsing cash, revenue, profit, receivables, payables, and inventory into one misleading balance.

Recommended structure:

```text
Money
│
├── Cash
│   ├── Cash Activity
│   ├── Staff Cash / Custody
│   ├── Handover
│   └── Reconciliation
│
├── Expenses
│
├── Owner Funding
│
├── Owner Withdrawals
│
├── Payments
│
└── Supplier / Customer Settlement
```

## 10.1 Cash

The principal management concept is **Cash in Hand**.

Cash views should support:

- opening/change cash;
- cash received;
- cash paid out;
- cash custody;
- handover/remittance;
- expected cash;
- actual cash;
- discrepancies.

## 10.2 Reconciliation

Reconciliation deserves its own operational surface because it is not merely a report.

```text
Reconciliation
│
├── Expected
├── Actual
├── Variance
├── Investigation
├── Corrective Action
└── Resolution History
```

An unresolved discrepancy must remain visible.

## 10.3 Expenses and Owner Withdrawals

These are distinct business concepts and should not be hidden under a generic "money out" category.

The IA should make the distinction obvious.

## 10.4 Payments

Payments may be viewed from Money, but the authoritative relationship remains with the underlying sale, debt, supplier liability, or other applicable business event.

The architecture must avoid creating a second disconnected payment history.

---

# 11. Activity

**Purpose:** Provide chronological operational visibility without becoming a duplicate database interface.

Recommended structure:

```text
Activity
│
├── All Activity
├── Sales
├── Payments
├── Inventory
├── Customer Debt
├── Purchases
├── Returns
├── Corrections
└── Reconciliation
```

Activity is particularly useful for management investigation.

It should answer:

> What happened?

> When did it happen?

> Who did it?

> What record does it belong to?

Activity must not replace domain-specific detail pages.

---

# 12. Management

Management is a cross-domain control and decision area.

It should not be treated as one giant dashboard.

Recommended conceptual structure:

```text
Management
│
├── Business Performance
├── Exceptions / Review
├── Staff Activity
├── Reconciliation
├── Inventory Attention
├── Customer Debt Attention
├── Supplier Attention
├── Returns Attention
├── Corrections
└── Audit / Integrity
```

## 12.1 Business Performance

This is where management sees the broader business picture.

It may connect:

- sales;
- expenses;
- profitability;
- inventory;
- receivables;
- payables;
- purchasing;
- staff performance;
- business growth.

The exact financial calculations belong to the financial model, not C01.

## 12.2 Exception / Review Centre

A consolidated review centre is strongly recommended architecturally because several domains produce management attention items.

Candidate contents:

- discounted sales requiring review;
- post-sale edits;
- credit transactions pending review;
- negative-stock exceptions;
- suspicious/unusual returns;
- reconciliation discrepancies;
- offline conflicts;
- integrity escalations.

The existence of a management exception/review centre was previously described as proposed rather than a locked implementation requirement. C01 therefore defines it as an **architectural recommendation**, not as an irrevocable V1 screen requirement.

## 12.3 Audit / Integrity

Management may need access to relevant audit/integrity information.

This should not be treated as ordinary activity.

The architecture must distinguish:

- business activity;
- correction history;
- audit history;
- integrity alerts.

---

# 13. Settings

Settings should contain configuration rather than operational history.

Recommended conceptual structure:

```text
Settings
│
├── Business
├── Users & Roles
├── Pricing Rules
├── Credit Rules
├── Returns Rules
├── Incentives
├── Inventory Configuration
├── Payment Configuration
├── Receipt Configuration
├── Language
├── Devices / Sessions
└── Offline / Sync Information
```

Exact settings depend on the final permission model.

A setting should not silently change historical records.

Configuration changes that affect future behavior must preserve appropriate history and attribution.

---

# 14. Cross-Domain Record Relationships

The architecture must be designed around relationships rather than isolated screens.

## 14.1 Sale relationship

```text
Customer
    │
    ▼
  SALE ───────────────► Receipt
    │
    ├───────────────► Payment(s)
    │
    ├───────────────► Salesperson
    │
    ├───────────────► Inventory movement(s)
    │
    ├───────────────► Credit / Debt
    │
    ├───────────────► Return(s)
    │
    └───────────────► Correction / History
```

## 14.2 Purchase relationship

```text
Supplier
    │
    ▼
 Purchase
    │
    ├──────────────► Received stock
    │
    ├──────────────► Acquisition cost
    │
    ├──────────────► Supplier payment(s)
    │
    ├──────────────► Supplier liability
    │
    └──────────────► Return / correction history
```

## 14.3 Customer debt relationship

```text
Customer
   │
   ├── Credit Sale
   │       │
   │       └── Outstanding amount
   │
   ├── Repayment
   │
   └── Clearance / debt history
```

## 14.4 Cash relationship

```text
Business Day
    │
    ├── Opening Cash
    ├── Cash Sales
    ├── Cash Expenses
    ├── Owner Withdrawal
    ├── Other permitted cash movements
    ├── Staff Cash Custody
    ├── Handover
    └── Reconciliation
             │
             ├── Expected
             ├── Actual
             └── Variance
```

---

# 15. Primary Navigation Recommendation

C00 intentionally left the navigation model open.

C01 now recommends:

> **A task-oriented persistent application navigation with a fast Sell entry point and role-aware management areas.**

The preferred conceptual order is:

```text
Home
Sell
Products & Inventory
Customers & Credit
Suppliers & Purchasing
Money
Activity
Management
Settings
```

However, not every item should necessarily appear as a full persistent navigation item on every device or for every role.

This distinction is important:

> **Information architecture is not identical to the visible navigation UI.**

C04 will define the final application shell and responsive navigation behavior.

---

# 16. Role-Based IA

## 16.1 Staff

Staff's IA should be deliberately smaller.

Recommended primary access:

```text
Home
Sell
Products / Search
Customers / Credit (as permitted)
Activity / Own Activity
Shift / Reconciliation
```

Staff should not normally navigate through:

- acquisition-cost views;
- gross-margin analysis;
- supplier liabilities;
- unrestricted corrections;
- unrestricted audit history;
- management configuration;
- sensitive business-performance analysis.

B09 states that permissions should be mostly invisible during normal work. The IA therefore should not create a confusing maze of disabled management screens for Staff.

Prefer:

> **Do not expose what the user normally cannot use.**

When an action inside an accessible workflow requires management authorization, show the appropriate approval path instead.

## 16.2 Manager

Manager access expands to operational management:

```text
Home
Sell
Products & Inventory
Customers & Credit
Suppliers & Purchasing
Money
Activity
Management
Settings (permitted configuration)
```

Exact access remains permission-dependent.

## 16.3 Owner

Owner has the broadest business visibility and authority:

```text
Home
Sell
Products & Inventory
Customers & Credit
Suppliers & Purchasing
Money
Activity
Management
Settings
```

Owner authority never means permission to erase audit history.

---

# 17. Role-Aware Navigation Principle

The product should use **progressive exposure**, not arbitrary hiding.

### Normal action

Show the action directly.

### Action available with limits

Show the action and enforce its configured constraints.

### Management approval required

Show the action with a clear approval path.

### Action not permitted

Do not present it as an ordinary available action.

### Integrity block

Explain that the action has been blocked and route the issue to the appropriate authority.

This follows the B09 principle that permissions should be contextual rather than inferred solely from screen access.

---

# 18. Search Architecture

Search should be treated as a first-class cross-domain capability.

## 18.1 Global search

A global search may eventually support discovery of records such as:

- products;
- sales;
- customers;
- suppliers;
- transaction/reference numbers.

However, global search must respect permissions.

## 18.2 Contextual search

Each major domain should also have optimized contextual search.

Examples:

- product search inside Sell;
- customer search inside Credit;
- transaction lookup inside Returns;
- supplier search inside Purchasing.

## 18.3 Search must reduce business risk

For high-risk selection such as SKU/product identity, search results should provide enough distinguishing information to reduce wrong-product selection.

Search is therefore a correctness feature, not merely a convenience feature.

---

# 19. Detail Pages as Investigation Hubs

Important records should have a stable detail surface from which related events can be understood.

Recommended primary detail hubs:

- Product Detail;
- Sale Detail;
- Customer Detail;
- Supplier Detail;
- Purchase Detail;
- Reconciliation Detail;
- Correction Detail;
- Return Detail.

A detail hub should answer:

1. What is this?
2. What is its current accepted state?
3. What happened to it?
4. What other records are connected to it?
5. What requires attention?
6. What actions are permitted?

This is especially important for management and audit-sensitive workflows.

---

# 20. Correction and History Architecture

Correction should not be a hidden subsection of Settings.

It is a cross-domain capability.

Recommended conceptual structure:

```text
Original Record
      │
      ▼
Current Accepted State
      │
      ├── Correction
      ├── Adjustment
      ├── Void
      ├── Return
      ├── Refund / Settlement
      ├── Duplicate Handling
      └── Merge Relationship
```

The exact business mechanics are owned by B08 and domain specifications.

C01 only establishes where those relationships should be discoverable.

The UX must preserve the distinction between:

- current state;
- historical state;
- corrective action;
- linked business event.

---

# 21. Returns Architecture

Returns should be discoverable from:

1. the Returns/management area;
2. the original Sale Detail;
3. relevant Customer Detail;
4. relevant Activity/history views.

Conceptually:

```text
Sale Detail
   │
   └── Returns
          │
          ├── Return request
          ├── Approval
          ├── Condition
          ├── Settlement/refund
          └── Resulting inventory effect
```

The original sale remains visible.

A fully returned sale may receive a derived presentation status such as:

> Completed — Fully Returned

A partially returned sale may receive:

> Completed — Partially Returned

These are presentation states, not replacements for the underlying history.

---

# 22. Reconciliation Architecture

Reconciliation is a cross-domain management capability.

The IA should support at least:

```text
Reconciliation
│
├── Cash Reconciliation
├── Inventory Reconciliation
├── Payment Reconciliation
└── Other Supported Reconciliation
```

Each reconciliation follows the general pattern:

```text
Expected / Recorded
        ↓
Observed / Confirmed Actual
        ↓
Variance
        ↓
Investigation
        ↓
Corrective Action
        ↓
Resolution
```

The architecture must not make the correction step appear to be an opportunity to simply overwrite the expected value.

---

# 23. Offline and Synchronization Architecture

Offline status must be visible at the application level and relevant local workflow level.

Recommended conceptual system state:

```text
Application
│
├── Online
├── Offline
├── Sync Pending
├── Syncing
├── Sync Conflict
└── Integrity Attention
```

Offline does not become a separate product area.

Instead, synchronization state is a cross-cutting system layer.

Users should encounter it in context:

- sale recorded locally;
- receipt available locally;
- payment recorded locally;
- correction pending management review;
- data waiting to synchronize;
- conflict requiring authorized resolution.

The architecture must never imply successful remote synchronization when synchronization has not occurred.

---

# 24. Notifications and Attention

Sabi Shop should not rely on a generic notification inbox for every event.

Use **attention architecture** based on business importance.

Potential attention categories:

- Action required;
- Management review;
- Approval required;
- Reconciliation issue;
- Sync conflict;
- Integrity issue;
- Informational update.

These should be surfaced where the user naturally works.

For example:

- a Staff member should see that management approval is required;
- a Manager should see the pending approval in Management/Review;
- an Owner should see unresolved escalations.

---

# 25. Dashboard-to-Record Navigation

Management summaries must be drillable.

For example:

```text
Total Sales
   ↓
Sales Performance
   ↓
Sales list
   ↓
Sale Detail
```

```text
Cash in Hand
   ↓
Cash Activity
   ↓
Reconciliation
   ↓
Variance investigation
```

```text
Inventory Attention
   ↓
Stock issue
   ↓
Product Detail
   ↓
Stock Movements
```

```text
Customer Debt
   ↓
Outstanding customers
   ↓
Customer Detail
   ↓
Credit sales / repayments
```

The principle is:

> **Every important number should have an understandable path back to the records that explain it.**

---

# 26. Avoiding Duplicate Sources of Truth

The IA must not create multiple competing versions of the same business information.

Examples:

- Payment history should not be independently recreated in three unrelated places.
- Inventory quantity should not be maintained separately by the dashboard and product screen.
- Customer debt should derive from its underlying credit/payment events.
- Cash in Hand should derive from applicable cash movements and reconciliation rules.
- Business performance should derive from authoritative financial/business calculations.

Screens may present information differently, but they must point to the same underlying business truth.

---

# 27. Application Information Architecture vs Figma Architecture

C01 defines the logical IA.

The later Figma artifact should reflect it.

Recommended Figma page grouping:

```text
Foundations
Components
Patterns

Application
├── Home
├── Sell
├── Products & Inventory
├── Customers & Credit
├── Suppliers & Purchasing
├── Money
├── Activity
├── Management
└── Settings

States
├── Loading
├── Empty
├── Error
├── Offline
├── Sync Pending
├── Sync Conflict
├── Authorization
├── Correction
├── Rejected
└── Integrity
```

This should be refined after C03 and C04.

---

# 28. IA Rules for Later UX Deliverables

All later Package C documents must follow these rules.

### C02 — User Journeys & Task Flows

Must start from the C01 structure and map real user journeys through it.

### C03 — Design System

Must provide visual patterns for the information hierarchy established here.

### C04 — Application Shell & Navigation

Must convert C01's logical navigation into responsive, role-aware navigation behavior.

### C05 — Landing Page UX

May use a different public information architecture while remaining visually connected to the application.

### C06 — POS UX

Must treat Sell as the highest-speed operational workflow.

### C07 — Inventory & Purchasing UX

Must preserve Product, Stock, Purchase, Supplier, and Movement relationships.

### C08 — Customer & Credit UX

Must preserve Customer, Credit Sale, Debt, and Repayment relationships.

### C09 — Returns, Corrections & Reconciliation UX

Must make historical relationships and corrective actions understandable.

### C10 — Offline, Conflict & Exceptional States

Must treat synchronization and exceptional states as cross-cutting states rather than disconnected pages.

### C11 — UX Validation & Redesign Audit

Must audit implemented navigation against this IA and approved later decisions.

---

# 29. Mobile / Desktop Architectural Principle

C00 left device priority open.

C01 therefore defines a **content hierarchy independent of device**.

The same business areas exist across devices, but their presentation may differ.

For example:

### Desktop

May expose more persistent navigation and simultaneous information.

### Tablet

May use a compact navigation model while preserving fast POS access.

### Mobile

May prioritize:

- Sell;
- Search;
- recent activity;
- key management information;
- contextual navigation.

The final responsive model belongs in C04.

---

# 30. IA Anti-Patterns

Sabi Shop should explicitly avoid:

## 30.1 Generic dashboard-first architecture

Do not make every capability a card on Home.

## 30.2 Screen-per-table architecture

Users should not have to understand the database structure to operate the shop.

## 30.3 Management controls mixed into Staff navigation

Do not expose sensitive controls merely because they exist.

## 30.4 Deep navigation for routine selling

A salesperson should not traverse several screens to complete a normal sale.

## 30.5 Hidden business relationships

A sale should not become an isolated receipt with no obvious connection to payment, customer, inventory, returns, or corrections.

## 30.6 Generic "Transactions" dumping ground

A universal transaction list may exist for investigation, but it should not replace meaningful domain navigation.

## 30.7 Generic "Balance" concept

Use the established business concepts such as:

- Cash in Hand;
- Customer Debt;
- Supplier Liability;
- Business Performance.

Do not collapse them into a single balance.

## 30.8 Giant Settings area

Settings should contain configuration, not become a hiding place for business operations.

## 30.9 Excessive disabled navigation

A Staff user should not see a long list of inaccessible management pages.

## 30.10 Audit history hidden behind destructive-looking interactions

History and correction relationships should be discoverable without suggesting deletion.

---

# 31. Recommended Information Architecture Map

```text
SABI SHOP
│
├── HOME
│   ├── Daily Overview
│   ├── Business Performance
│   ├── Attention
│   └── Sync / System State
│
├── SELL
│   ├── New Sale
│   ├── Current Sale
│   ├── Recent Sales
│   └── Sale Detail
│       ├── Items
│       ├── Payments
│       ├── Customer
│       ├── Salesperson
│       ├── Receipt
│       ├── Corrections
│       └── Returns
│
├── PRODUCTS & INVENTORY
│   ├── Products
│   ├── Product Detail
│   ├── Stock
│   ├── Stock Movements
│   ├── Purchases / Receipts
│   └── Inventory Corrections
│
├── CUSTOMERS & CREDIT
│   ├── Customers
│   ├── Customer Detail
│   ├── Credit / Outstanding
│   ├── Repayments
│   └── Debt Attention
│
├── SUPPLIERS & PURCHASING
│   ├── Suppliers
│   ├── Supplier Detail
│   ├── Purchases
│   ├── Receive Stock
│   ├── Supplier Payments
│   ├── Supplier Returns
│   └── Supplier Liabilities
│
├── MONEY
│   ├── Cash
│   ├── Cash Activity
│   ├── Handover
│   ├── Reconciliation
│   ├── Expenses
│   ├── Owner Funding
│   ├── Owner Withdrawals
│   └── Payments / Settlement
│
├── ACTIVITY
│   ├── All Activity
│   ├── Sales
│   ├── Payments
│   ├── Inventory
│   ├── Customers / Debt
│   ├── Purchases
│   ├── Returns
│   ├── Corrections
│   └── Reconciliation
│
├── MANAGEMENT
│   ├── Business Performance
│   ├── Exceptions / Review
│   ├── Staff Activity
│   ├── Reconciliation
│   ├── Inventory Attention
│   ├── Debt Attention
│   ├── Supplier Attention
│   ├── Returns Attention
│   ├── Corrections
│   └── Audit / Integrity
│
└── SETTINGS
    ├── Business
    ├── Users & Roles
    ├── Pricing
    ├── Credit
    ├── Returns
    ├── Incentives
    ├── Inventory
    ├── Payments
    ├── Receipts
    ├── Language
    └── Device / Sync
```

This is the **logical IA**, not the final navigation UI.

---

# 32. Reconciliation With Existing Deliverables

This section exists so future contexts can distinguish newly resolved IA decisions from older unresolved requirements.

## 32.1 C00 — UX Foundation

C00 explicitly left navigation as open.

C01 resolves that open question at the **recommended architectural level**:

> Sabi Shop should use a task-oriented, role-aware application architecture with a fast Sell entry point and separate operational, money, management, and configuration areas.

C04 remains responsible for final shell/navigation behavior.

C00 also established:

- business truth outranks design methodology;
- normal work should be fast;
- consequential work should be deliberate;
- permissions should shape UX;
- offline/conflict states are first-class;
- auditability must remain understandable.

C01 operationalizes those principles structurally.

## 32.2 B01 — Business Model

B01 establishes Sabi Shop as a lightweight POS/business operating system focused on:

- sales;
- inventory;
- money;
- customer demand/debt;
- supplier activity;
- staff accountability;
- business performance;
- exceptions.

C01 maps those concepts into product areas without turning them into an ERP-style menu explosion.

## 32.3 B02 — Supplier & Purchasing

Purchasing belongs to management.

C01 therefore places Suppliers & Purchasing as a management-oriented domain and does not make it part of the normal Staff selling path.

## 32.4 B03 — Credit & Debt

Credit requires management authorization and supports independent repayments.

C01 therefore makes Customers & Credit a distinct domain rather than hiding debt inside generic customer records.

## 32.5 B04 — Returns & Refunds

Returns remain linked to original sales and require approval.

C01 therefore makes return relationships discoverable from Sale Detail and management surfaces without replacing the original sale.

## 32.6 B05 — Cash & Reconciliation

Cash discrepancies remain visible and require investigation.

C01 therefore gives Money and Reconciliation explicit structural homes.

## 32.7 B06 — Inventory Accounting

Inventory is traceable through movements and uses weighted-average costing for V1.

C01 therefore treats inventory history and movement as first-class information rather than presenting only a current stock number.

## 32.8 B07 — Transaction Lifecycle

Completed transactions are not deleted and corrective activity preserves history.

C01 therefore makes Sale Detail and history/correction relationships permanent structural concepts.

## 32.9 B08 — Correction & Exception Policy

B08 establishes:

> **The system should correct the business, not rewrite history.**

C01 therefore makes corrections, returns, duplicate handling, merge relationships, and reconciliation outcomes discoverable without turning them into deletion workflows.

## 32.10 B09 — Roles & Permissions

B09 establishes:

- Owner;
- Manager;
- Staff/Salesperson;
- contextual permissions;
- least privilege;
- separation of duties;
- business membership boundaries;
- elevated controls for high-integrity actions.

C01 therefore defines a role-aware IA rather than one identical navigation tree for everyone.

---

# 33. Reconciliation With Historical Context

The original product context listed Navigation and screen-by-screen UX as later Package C work.

C01 now owns the **logical information architecture**.

Historical navigation questions should therefore not be re-asked at the foundation level merely because older context still labels navigation as undecided.

The following distinctions now apply:

| Question | Current owner/status |
|---|---|
| What major areas exist? | **C01 — Recommended architecture** |
| How domains relate | **C01** |
| Which role should see which areas? | **B09 + C01** |
| Exact persistent navigation UI | **C04** |
| Mobile navigation behavior | **C04** |
| Desktop navigation behavior | **C04** |
| Exact screen layouts | Later domain UX |
| Visual styling | C03 |
| User task flows | C02 |
| Offline implementation | D07/D08 |
| Audit implementation | D10/D11 |

---

# 34. Decisions Established by C01

The following are now recommended IA decisions rather than open structural questions.

### C01-DEC-01
Sabi Shop should be organized around business work domains rather than database entities.

### C01-DEC-02
Sell is the primary high-speed operational workspace.

### C01-DEC-03
Products & Inventory is a distinct operational domain.

### C01-DEC-04
Customers & Credit is a combined lightweight customer/debt domain, not a general CRM.

### C01-DEC-05
Suppliers & Purchasing is a distinct management-oriented domain.

### C01-DEC-06
Money is a distinct domain covering cash and relevant money movements while preserving financial distinctions.

### C01-DEC-07
Activity provides cross-domain operational visibility but does not replace domain detail.

### C01-DEC-08
Management is a cross-domain decision, exception, and oversight area.

### C01-DEC-09
Settings contains configuration and must not become a substitute for operational domains.

### C01-DEC-10
Role-aware navigation is required; the same complete navigation tree should not be exposed indiscriminately to every role.

### C01-DEC-11
Important records should have detail hubs exposing their relationships and current accepted state.

### C01-DEC-12
Offline/sync state is cross-cutting and should not be modeled as a separate business domain.

### C01-DEC-13
Correction/history is cross-cutting and must remain discoverable from affected records.

### C01-DEC-14
Dashboard summaries should provide drill-down paths to authoritative underlying records.

### C01-DEC-15
The final visual navigation shell remains a C04 responsibility.

---

# 35. Remaining Open Decisions

C01 should not pretend to settle decisions that require later validation.

## C01-OPEN-01 — Final navigation shell

Resolved by C04: Sabi Shop uses an adaptive hybrid shell — persistent primary navigation on larger screens, compact navigation on smaller screens, with Sell immediately accessible across supported sizes. Remaining C04 work is implementation detail, not a competing navigation model.

## C01-OPEN-02 — Responsive implementation detail

C04 resolves the shell behavior across desktop, tablet and mobile. Exact breakpoint values and final interaction tuning remain implementation/design details.

## C01-OPEN-03 — Exception Centre implementation

The architecture strongly supports a management exception/review centre, but its final V1 screen structure remains subject to C02/C04/domain UX decisions.

## C01-OPEN-04 — Global search scope

The conceptual need for strong search is established, but the exact global search scope and command/search behavior belong to later UX/technical specifications.

## C01-OPEN-05 — Manager self-correction

The exact authority remains owned by B09/final permissions configuration.

## C01-OPEN-06 — Exact settings inventory

The architecture identifies configuration domains, but final settings screens should be derived from the final permission and domain specifications.

---

# 36. Acceptance Criteria

C01 is successful when:

- the complete logical application structure is defined;
- primary business domains are clearly separated;
- Sell is optimized structurally for rapid access;
- management functionality is not mixed indiscriminately into Staff workflows;
- Customer and Credit relationships are clear;
- Supplier and Purchasing relationships are clear;
- Money and Reconciliation are structurally distinct;
- Activity provides cross-domain visibility without becoming a duplicate source of truth;
- Management has a clear home for business performance and exceptions;
- Settings is separated from daily business operations;
- important records have detail/investigation hubs;
- dashboard information can lead back to underlying records;
- corrections and historical relationships remain discoverable;
- offline/sync state is treated as a cross-cutting concern;
- role-aware visibility follows B09;
- no navigation structure implies deletion of historical records;
- the IA does not turn Sabi Shop into a generic ERP;
- later C deliverables have clear structural ownership.

---

# 37. Next Deliverables

C01 should be followed by:

## C02 — User Journeys & Task Flows

Translate this architecture into real workflows for:

- Staff/Salesperson;
- Manager;
- Owner.

Priority flows should include:

- normal sale;
- split payment;
- credit sale;
- repayment;
- purchase receiving;
- stock investigation;
- return;
- correction;
- cash reconciliation;
- management review;
- offline sale;
- sync conflict.

## C03 — Sabi Shop Design System

Define the visual system used to express this architecture.

## C04 — Application Shell & Navigation

Convert the logical IA into the actual responsive application shell.

## C05+ — Domain UX

Design each operational domain from the approved architecture.

---

# 38. Summary

C01 establishes the recommended Sabi Shop information architecture around one central idea:

> **Organize the product around the work the business needs to do, while preserving the relationships between the records that explain that work.**

The architecture therefore separates:

- selling;
- inventory;
- customers and credit;
- suppliers and purchasing;
- money;
- activity;
- management;
- configuration.

It also preserves cross-domain relationships so that a user can move from:

```text
summary
  ↓
attention
  ↓
record
  ↓
related business event
  ↓
history / correction / resolution
```

The result should feel simple to the salesperson and powerful to management without becoming a generic enterprise system.

The governing UX principle remains:

> **Fast for ordinary work. Deliberate for consequential work.**

C01 now gives C02 and C04 a structural foundation to build on.

---

# FINAL RECONCILIATION — BUSINESS DECISIONS APPLIED

This document must express the finalized business decisions: configurable 15-minute-default correction window; ordinary vs high-integrity corrections; Owner visibility for consequential Manager self-corrections; logged/reviewable transfer confirmation; core plus configurable payment methods; tax-aware totals; supplier-return settlement states; operational business-day sessions that may cross midnight; shared or individual cash custody; weighted-average costing; visible negative-stock exceptions; and Cash in Hand / Expected Cash / Actual Cash terminology.
