# C04 — Application Shell & Navigation

**Product:** Sabi Shop  
**Document ID:** C04  
**Package:** C — User Experience Specification  
**Status:** RECONCILED — DESIGN BASELINE — Application Shell & Navigation  
**Version:** 1.0  
**Prepared:** 2026-09-04  
**Depends on:** C00 — UX & Design Foundation; C01 — Information Architecture; C02 — User Journeys & Task Flows; C03 — Sabi Shop Design System  
**Authoritative for:** application shell structure, navigation behavior, role-aware navigation, responsive navigation principles, global/contextual navigation, persistent application context, and shell-level interaction patterns  
**Does not replace:** B01–B09 business rules, D02 terminology, D03–D11 technical specifications, or later domain UX documents

---

# 1. Purpose

C04 converts Sabi Shop's logical information architecture into the actual application shell and navigation model.

C01 deliberately left the final shell open. It identified sidebar, bottom navigation, top navigation, hybrid, and adaptive navigation as possible approaches and assigned the final decision to C04. fileciteturn29file1L188-L222

C04 now establishes the recommended shell:

> **Adaptive hybrid navigation: persistent primary navigation on larger screens, compact navigation on smaller screens, with Sell remaining immediately accessible at every supported size.**

The shell must support the central product principle:

> **Fast for ordinary work. Deliberate for consequential work.**

The application shell is not merely a frame around pages.

It must help users understand:

- where they are;
- what business they are operating in;
- what work they can perform;
- what requires attention;
- what is happening offline;
- what authority they have;
- how to return to the work they were doing.

---

# 2. Source Hierarchy

When shell or navigation decisions conflict, use this order:

1. Locked Sabi Shop business rules.
2. Authoritative Sabi Shop domain specifications.
3. C00–C02 UX decisions.
4. C03 design-system decisions.
5. C04 shell decisions.
6. Later domain UX specifications.
7. External design methodologies.
8. Framework defaults.
9. Agent preference.

Navigation must never bypass:

- authorization;
- business boundaries;
- audit requirements;
- correction controls;
- payment confirmation;
- inventory integrity;
- debt integrity.

C01 explicitly states that navigation cannot be used to weaken business rules. fileciteturn28file6L807-L826

---

# 3. Shell Decision

## C04-DEC-01 — Adaptive Hybrid Shell

Sabi Shop uses an adaptive hybrid application shell.

### Desktop

Use a persistent **left primary navigation rail/sidebar**.

### Tablet

Use a **compact collapsible navigation rail** or equivalent adaptive primary navigation.

### Mobile

Use a **compact bottom navigation model for the highest-frequency destinations**, supplemented by a contextual menu/drawer for the remaining application areas.

### All devices

Sell must remain immediately accessible.

This decision balances:

- the breadth of C01's information architecture;
- the speed requirement of the POS;
- management workflows;
- touch usability;
- responsive constraints.

It avoids forcing the same navigation mechanism onto every device.

---

# 4. Shell Model

The application shell is:

```text
┌─────────────────────────────────────────────────────────────┐
│ Global Header / Business Context / System State             │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│ Primary      │                Main Workspace                │
│ Navigation   │                                              │
│              │                                              │
│              │                                              │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│ Contextual actions / responsive navigation where applicable │
└─────────────────────────────────────────────────────────────┘
```

On mobile, the structure becomes:

```text
┌─────────────────────────────┐
│ Header / Context             │
├─────────────────────────────┤
│                             │
│ Main Workspace              │
│                             │
│                             │
├─────────────────────────────┤
│ Primary Mobile Navigation   │
└─────────────────────────────┘
```

The exact visual styling comes from C03.

---

# 5. Primary Navigation

The logical navigation from C01 remains:

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

C01 establishes this as the recommended top-level product model.

C04 does not rename business domains merely for visual convenience.

---

# 6. Navigation Grouping

On larger screens, navigation should be grouped by work context rather than presented as an undifferentiated list.

Recommended structure:

```text
SABI SHOP

WORK
  Sell
  Products & Inventory
  Customers & Credit
  Suppliers & Purchasing

MONEY
  Money

ACTIVITY
  Activity

MANAGEMENT
  Management

SYSTEM
  Settings
```

Home remains the application entry point.

This grouping helps Staff understand the operational areas while allowing management functions to remain distinct.

---

# 7. Sell as the Primary Operational Destination

Sell is the highest-priority destination.

It should be:

- visually prominent;
- immediately reachable;
- available from every major application context;
- easy to return to;
- optimized for keyboard and touch where supported.

The shell must not force a salesperson to traverse multiple navigation levels to start a normal sale.

This follows C01's explicit requirement that Sell be structurally optimized for rapid access. fileciteturn29file1L226-L247

---

# 8. Home

Home is the orientation and business-overview surface.

It should provide:

- daily overview;
- relevant business performance;
- attention items;
- system/sync state;
- shortcuts to high-frequency work.

Home must not become a giant dashboard containing every possible function.

C01 explicitly rejects a generic dashboard-first architecture and requires important numbers to lead back to evidence. fileciteturn28file7L989-L1038

---

# 9. Header

The global header should provide stable context without consuming excessive operational space.

Recommended contents:

```text
[Business / Brand]    [Page Context]        [System State]
                                              [User]
```

Depending on viewport:

- business identity;
- current business context;
- page title/context;
- offline/sync state;
- user/account menu;
- globally available search where applicable.

Do not place every possible action in the header.

---

# 10. Business Context

Because the architecture is designed to support more than one business, business membership is an authorization boundary.

The shell must make the active business context clear.

A user should never have to guess:

> Which business am I currently operating?

If a user belongs to multiple businesses, switching business context must be deliberate.

---

# 11. Business Switching

Business switching should:

- identify the current business clearly;
- show only businesses the user is authorized to access;
- require deliberate selection;
- prevent accidental cross-business operation;
- preserve the active business context across navigation.

Switching business context must not silently change an in-progress consequential operation.

If a sale is in progress, the application should protect the work before switching context.

---

# 12. User Menu

The user menu should contain account-level actions rather than business operations.

Potential items:

- user identity;
- current role;
- business membership/context;
- account settings;
- sign out;
- relevant security/session information.

Do not place routine business actions inside the user menu merely because they are convenient.

---

# 13. Role-Aware Navigation

The shell must be role-aware.

C01 explicitly requires that the complete navigation tree not be exposed indiscriminately to every role. fileciteturn29file1L165-L184

## Staff / Salesperson

Primary navigation should emphasize:

```text
Home
Sell
Products & Inventory
Customers & Credit
Activity
```

Visibility within those areas remains permission-controlled.

Management areas should not appear merely as disabled menu items.

## Manager

Manager navigation may expose:

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

Exact visibility remains governed by B09 permissions.

## Owner

Owner receives the broadest navigation subject to the established permission model.

Owner authority never means historical evidence can be destroyed.

---

# 14. Hidden vs Disabled Navigation

Default rule:

> **Hide what the user has no reason to access. Explain what the user can see but cannot currently perform.**

Do not fill Staff navigation with a long list of inaccessible management pages.

If a user is inside a record and an action is unavailable because of authority, explain the restriction in context.

This preserves a clean navigation model while still communicating meaningful authorization states.

---

# 15. Navigation Is Not Authorization

A visible navigation item does not itself grant permission.

An action available inside a workspace must still be checked against:

- role;
- permission;
- business context;
- operation state;
- authorization requirement;
- offline constraints.

Likewise, hiding a navigation item must never be treated as the actual security mechanism.

Technical authorization belongs to D-series specifications.

---

# 16. Primary Navigation Behavior

Desktop navigation should:

- remain stable;
- show active destination;
- support collapse where useful;
- preserve labels for clarity;
- avoid excessive nesting.

Expanded:

```text
Products & Inventory
```

Collapsed:

```text
[icon]
```

If a collapsed rail is used, the user must still be able to discover the destination name through accessible tooltip/label behavior.

---

# 17. Navigation Depth

Keep primary navigation shallow.

Recommended:

```text
Primary area
  ↓
Workspace
  ↓
Record/detail
```

Avoid:

```text
Area
 ↓
Category
 ↓
Subcategory
 ↓
Sub-subcategory
 ↓
Action
```

Deep navigation is particularly harmful to POS workflows.

---

# 18. Contextual Navigation

Contextual navigation belongs inside the current workspace.

Examples:

### Product

```text
Product
├── Overview
├── Stock
├── Purchasing
└── History
```

### Customer

```text
Customer
├── Overview
├── Credit
├── Repayments
└── History
```

### Sale

```text
Sale
├── Summary
├── Payments
├── Customer
├── Inventory effects
├── Corrections
└── Related returns
```

The exact tabs/sections belong to later domain UX.

---

# 19. Breadcrumbs

Breadcrumbs are useful for management and investigation workflows.

They should show meaningful business hierarchy.

Example:

```text
Customers & Credit
→ Customer
→ Credit Sale
→ Sale Detail
```

Do not expose database hierarchy as breadcrumbs.

Bad:

```text
Database
→ sales
→ sale_items
→ sale_item_id
```

---

# 20. Back Navigation

Back navigation should preserve the user's task context.

If a user opens:

```text
Management
→ Inventory Attention
→ Product
→ Stock Movement
```

returning should normally preserve the previous investigation context rather than restarting the entire area.

Browser/device back behavior must also be considered in implementation.

---

# 21. Global Search

C01 establishes the need for strong search while leaving exact global search scope open. fileciteturn29file1L212-L218

C04 defines the UX position:

> Search should be globally discoverable, but its scope should remain understandable.

A global search entry may search across:

- products;
- customers;
- suppliers;
- sales;
- other records the current role can access.

However, domain search remains available inside each relevant workspace.

Global search must never become a replacement for meaningful domain navigation.

---

# 22. Search Results

Search results should identify records clearly.

For example:

```text
Product
Honda GX160 Belt
SKU: BELT-GX160
Stock: 12

Customer
Chinedu Okafor
Phone: 080...

Sale
SALE-...
Today · ₦85,000
```

The result must provide enough information to avoid selecting the wrong record.

---

# 23. Search and POS

Inside Sell, product search must be optimized for speed and identity confidence.

The POS should not require opening global search as a separate page.

Use contextual search within the sale workspace.

---

# 24. Attention / Exception Entry Point

Management needs a clear way to find work requiring attention.

The shell may provide an attention indicator for:

- pending approvals;
- inventory discrepancies;
- cash discrepancies;
- sync conflicts;
- integrity issues;
- other authorized management exceptions.

The indicator must not imply that every item is an emergency.

---

# 25. Attention Center

C04 recommends a shell-level entry point to management attention work.

Possible conceptual structure:

```text
Attention
├── Awaiting approval
├── Reconciliation
├── Inventory issues
├── Sync conflicts
└── Integrity issues
```

The final domain grouping belongs to C09/C10.

The attention center is an operational work queue, not a duplicate database.

---

# 26. System State in the Shell

Offline/sync status is cross-cutting and should not become a separate business domain. C01 explicitly establishes this. fileciteturn29file1L165-L184

The shell should provide a persistent but low-distraction system-state indicator.

Example:

```text
● Online
```

or:

```text
↗ Sync pending · 3
```

or:

```text
! Conflict · 1
```

The indicator should be actionable when the user has authority to investigate.

---

# 27. Offline Shell Behavior

When offline:

- core supported workflows remain available;
- the shell makes offline state visible;
- the application does not behave as though the entire product is broken;
- unsupported operations are clearly identified;
- locally accepted activity remains understandable.

Offline is a mode of operation, not a separate application.

This follows C02's explicit decision that offline is a variation of a supported workflow rather than a separate business workflow. fileciteturn29file6L869-L888

---

# 28. Sync Pending Indicator

Sync pending should distinguish:

> **Recorded locally**

from:

> **Synchronized with server**

Example:

```text
Recorded · Sync pending
```

Avoid wording that falsely suggests a valid local business operation failed merely because synchronization is pending.

---

# 29. Conflict Entry

A sync conflict should be discoverable from the system-state indicator and management attention area.

Selecting it should lead to a deliberate conflict-resolution workflow.

Never expose:

> Overwrite server

as a casual shell action.

C02 explicitly requires that sync conflict never silently overwrite accepted history. fileciteturn29file6L881-L888

---

# 30. Page Header

Each major workspace should have a consistent page header:

```text
Page title
Short context / status
Primary action
Secondary contextual actions
```

Example:

```text
Customers & Credit
Manage customers, credit sales, repayments and disputes.

[Add customer]
```

The header should not become a second navigation system.

---

# 31. Page-Level Action Hierarchy

Use:

```text
One primary action
Several contextual secondary actions
Rare high-risk actions
```

The primary action should correspond to the main purpose of the current workspace.

For Sell:

> Complete sale

For Customers:

> Add customer

For Receiving:

> Record receipt

For Reconciliation:

> Complete reconciliation

Exact wording belongs to later domain UX.

---

# 32. Sticky Context

Where useful, the shell may preserve contextual information while scrolling.

Examples:

- sale total;
- customer identity;
- page-level primary action;
- reconciliation status.

Sticky elements must not consume excessive screen area.

---

# 33. POS Shell Mode

Sell may use a specialized workspace mode while remaining within the application shell.

Recommended:

```text
Application shell
      ↓
Sell workspace
      ↓
Focused transaction environment
```

The POS should feel focused without becoming a completely separate application.

---

# 34. POS Exit Protection

If a sale is in progress, leaving Sell should not silently discard work.

Possible outcomes:

- continue sale;
- explicitly abandon;
- save supported local state;
- return later.

The exact behavior for abandoned/in-progress sale state belongs to C06 and technical state management.

The shell's responsibility is to prevent accidental loss.

---

# 35. Navigation During Active Sale

If navigation occurs while a sale is in progress:

- the current sale state should remain visible/accessible;
- the user should know that a sale is in progress;
- returning to Sell should restore the relevant context;
- consequential abandonment should require deliberate action.

Do not allow navigation mechanics to accidentally create or discard a business event.

---

# 36. Mobile Navigation

Mobile primary navigation should prioritize the highest-frequency destinations.

Recommended initial model:

```text
Home
Sell
Search
Activity
More
```

`More` exposes lower-frequency authorized areas.

The final mobile navigation labels and exact ordering should be validated during representative prototype testing.

---

# 37. Mobile More Menu

The More area should group:

```text
Products & Inventory
Customers & Credit
Suppliers & Purchasing
Money
Management
Settings
```

Visibility remains role-aware.

The More menu should not become an unstructured dump.

---

# 38. Mobile Sell Access

Sell should have a persistent primary position.

A salesperson must not open More, find Sales, then start a sale.

The shell should make:

> **Sell**

one of the easiest actions in the entire application.

---

# 39. Tablet Navigation

Tablet should balance:

- touch;
- operational speed;
- management information density.

Recommended approach:

- compact persistent rail when landscape width permits;
- collapsible rail when space is constrained;
- contextual navigation inside workspaces.

The implementation should not simply scale the desktop layout down.

---

# 40. Desktop Navigation

Desktop supports the broadest simultaneous context.

Recommended:

- persistent left navigation;
- global header;
- broad workspace;
- contextual record navigation;
- management tables and investigation surfaces.

The sidebar should be collapsible where useful, but the expanded state should remain the default for management-heavy workflows.

---

# 41. Responsive Breakpoint Principle

C04 does not hard-code framework-specific breakpoints.

Breakpoints should be selected based on:

- minimum viable content width;
- touch target requirements;
- navigation readability;
- table behavior;
- POS workspace integrity;
- management workflow density.

Exact breakpoint values belong to implementation/design validation.

---

# 42. Shell Accessibility

The shell must support:

- keyboard navigation;
- visible focus;
- semantic navigation landmarks;
- accessible names;
- predictable tab order;
- screen-reader context;
- touch usability;
- reduced motion.

Collapsed navigation must remain discoverable to assistive technology.

---

# 43. Role Change

If a user's role changes while the application is open:

- authorization must be reevaluated;
- navigation must update;
- inaccessible areas must no longer remain actionable;
- historical activity must retain its original attribution.

The shell must never imply that changing role changes historical ownership.

---

# 44. Disabled User

A disabled user may remain visible in historical records where their previous activity must be understood.

The shell must not rewrite or erase historical attribution because an account is disabled.

This follows B09's historical attribution principle.

---

# 45. Permission Denial

When an action is denied:

- explain the business reason when appropriate;
- distinguish permission denial from technical failure;
- provide a valid next step where one exists.

Example:

> **Manager approval required**  
> You can request this correction, but another authorized person must approve it.

Do not show:

> 403 Forbidden

as the primary user experience.

---

# 46. Management Context

Management navigation should make investigation easy.

A manager should be able to move:

```text
Attention
 ↓
Issue
 ↓
Source record
 ↓
Related records
 ↓
Correction / resolution
```

This follows C01's relationship-first architecture and C02's management-review journey.

---

# 47. Navigation and Auditability

Navigation must preserve discoverability of:

- corrections;
- returns;
- approvals;
- payment history;
- inventory effects;
- debt history;
- reconciliation history;
- sync conflicts;
- integrity events.

C01 explicitly requires corrections/history to remain discoverable from affected records. fileciteturn29file1L165-L184

---

# 48. No Generic Transactions Dump

Activity may provide cross-domain investigation.

However, C01 explicitly rejects making a generic "Transactions" dumping ground the primary architecture. fileciteturn28file7L1013-L1038

Therefore:

- Sell owns selling;
- Money owns cash/payment/reconciliation;
- Customers & Credit owns customer debt;
- Products & Inventory owns stock;
- Activity provides cross-domain history/investigation.

---

# 49. Settings

Settings should contain configuration.

It should not become a hiding place for:

- purchasing;
- cash reconciliation;
- inventory operations;
- customer debt;
- corrections;
- ordinary business activity.

C01 explicitly states this separation. fileciteturn29file1L165-L184

---

# 50. Navigation Persistence

The shell should remember appropriate navigation context.

Examples:

- expanded/collapsed navigation preference;
- last relevant workspace;
- filter context where safe;
- recent location.

However, persistent UI state must never override current:

- authorization;
- business context;
- transaction state;
- data freshness;
- integrity requirements.

---

# 51. Deep Links

Important records and work queues should be deep-linkable.

Examples:

```text
Customer detail
Sale detail
Product detail
Reconciliation
Management review item
Sync conflict
```

A deep link must still validate:

- current authorization;
- current business context;
- record availability;
- record state.

A link must not become a permission bypass.

---

# 52. Browser Refresh / Re-entry

Refreshing the application should not silently lose critical in-progress work.

Where a transaction is in progress, C06/D06/D07/D08 will define exact persistence behavior.

C04 establishes the shell requirement:

> Navigation and shell lifecycle must not accidentally destroy supported work.

---

# 53. Shell-Level Notifications

Notifications should be reserved for meaningful events.

Good:

- manager approval required;
- sync conflict detected;
- integrity issue detected;
- reconciliation requires attention.

Avoid notifying users about every routine operation.

---

# 54. Toasts

Toasts are appropriate for short-lived confirmation of low-risk events.

Examples:

> Customer saved

> Product added to sale

> Payment recorded

For consequential operations, the accepted state should be visible in the page/workflow itself.

Do not rely on a disappearing toast as the only evidence of an important business event.

---

# 55. Global Modal Policy

The shell should not use global modals for routine navigation.

Modals are reserved for:

- focused confirmation;
- authorization;
- high-consequence decisions;
- short contextual actions.

Large workflows should use dedicated surfaces/pages rather than giant modal stacks.

---

# 56. Shell Loading

On application startup:

1. establish application context;
2. establish business context;
3. establish authorization context;
4. load required shell data;
5. render available workspace;
6. surface offline/sync state.

Avoid a blank full-screen spinner when cached/local shell information can be shown safely.

---

# 57. Shell Error

If a shell-level service fails:

- preserve usable local application context where possible;
- explain what is unavailable;
- distinguish offline from actual failure;
- avoid blocking unrelated local workflows.

Example:

> **Sync unavailable**  
> Your device is still able to continue supported offline work.

The exact offline technical behavior belongs to D07/D08.

---

# 58. Navigation Anti-Patterns

Sabi Shop should explicitly avoid:

## 58.1 Permanent sidebar on every device

Desktop navigation should not simply be shrunk onto mobile.

## 58.2 Dashboard as the only entry point

Users should be able to reach their work directly.

## 58.3 Database navigation

Users should navigate business concepts, not tables.

## 58.4 Disabled-menu clutter

Do not show inaccessible management areas to Staff merely to advertise features.

## 58.5 Deep POS navigation

Selling must not require multi-level navigation.

## 58.6 Hidden system state

Offline/conflict state must be discoverable.

## 58.7 Navigation as permission

A hidden menu is not authorization.

## 58.8 Global modal application

Do not turn the shell into a collection of dialogs.

## 58.9 Generic activity replacement

Activity does not replace domain navigation.

## 58.10 Context loss

Navigation must not make users lose track of the business, customer, sale, product, or investigation they were working on.

---

# 59. Shell Component Inventory

C04 requires the following reusable shell components:

- application header;
- business switcher;
- user menu;
- primary navigation;
- navigation group;
- navigation item;
- mobile bottom navigation;
- mobile More menu;
- breadcrumbs;
- page header;
- contextual action bar;
- attention indicator;
- system-state indicator;
- sync status;
- workspace container;
- responsive navigation drawer;
- navigation collapse control.

These consume C03 design-system primitives.

---

# 60. Shell State Inventory

The shell must account for:

```text
Normal
Loading
Offline
Sync pending
Sync conflict
Integrity issue
Permission-limited
Business context switching
No business context
Session expired
System error
```

Not every state needs a dedicated page.

The shell should expose the relevant state without overwhelming ordinary work.

---

# 61. Business Context Safety

The shell must never allow a user to perform an operation while the business context is ambiguous.

Before consequential actions, the current business should be identifiable.

If business context becomes unavailable:

> block business-changing operations until context is restored.

Do not guess the active business.

---

# 62. Cross-Domain Navigation

Cross-domain links are encouraged when they explain relationships.

Examples:

```text
Sale
 → Customer
 → Payment
 → Inventory effect
 → Return
 → Correction
```

```text
Customer
 → Credit sale
 → Debt
 → Repayment
```

```text
Product
 → Stock movement
 → Purchase
 → Supplier
```

The link should explain why the user is being taken there.

---

# 63. Navigation and Source of Truth

The shell and navigation are presentation structures.

They do not maintain independent business balances or records.

C01 requires that screens point to the same underlying business truth rather than create competing versions. fileciteturn28file8L1105-L1117

Therefore:

- navigation counts are derived;
- attention counts are derived;
- activity is derived from authoritative events;
- business summaries link back to source records.

---

# 64. Shell and Correction

Correction is not a navigation destination that replaces the original record.

Instead:

```text
Affected record
 ↓
Correction history
 ↓
Correction workflow
 ↓
Accepted corrected state
```

This preserves the relationship between ordinary work and management correction.

---

# 65. Shell and Returns

Returns remain linked to original sales.

Navigation should make it possible to move:

```text
Sale
 ↓
Related returns
 ↓
Return detail
 ↓
Settlement
```

The original sale remains discoverable.

---

# 66. Shell and Credit

Customer and credit workflows should preserve:

```text
Customer
 ↓
Credit sales
 ↓
Outstanding debt
 ↓
Repayments
 ↓
Debt investigation/history
```

The shell must not collapse this into a generic "balance" concept.

---

# 67. Shell and Money

Money remains a distinct domain.

Navigation should preserve distinction between:

- Cash in Hand;
- Cash Activity;
- Reconciliation;
- Customer Debt;
- Supplier Liability;
- Business Performance.

Do not create a single generic financial "Balance" destination.

---

# 68. Shell and Management Review

Management review is cross-domain.

A manager may enter a review item from:

- Home;
- Attention;
- Activity;
- Money;
- Inventory;
- Customers & Credit;
- Returns/Corrections.

The review surface should always lead back to the affected authoritative record.

---

# 69. Role × Navigation Matrix

| Area | Staff | Manager | Owner |
|---|---|---|---|
| Home | ✓ | ✓ | ✓ |
| Sell | ✓ | ✓ | ✓ |
| Products & Inventory | ✓ limited | ✓ | ✓ |
| Customers & Credit | ✓ limited | ✓ | ✓ |
| Suppliers & Purchasing | limited/hidden by permission | ✓ | ✓ |
| Money | limited/hidden by permission | ✓ | ✓ |
| Activity | own/relevant | ✓ | ✓ |
| Management | hidden by default | ✓ | ✓ |
| Settings | limited | ✓ by permission | ✓ |

This is a UX expression of B09, not a replacement for the permission matrix.

---

# 70. Navigation Priority Matrix

| Destination | Operational priority | Shell treatment |
|---|---|---|
| Sell | P0 | Persistent / primary |
| Products & Inventory | P0/P1 | Primary |
| Customers & Credit | P0/P1 | Primary |
| Home | P1 | Primary |
| Activity | P1 | Primary |
| Money | P1/P2 | Primary for management |
| Suppliers & Purchasing | P1/P2 | Primary for management |
| Management | P1/P2 | Role-aware |
| Settings | P2 | Secondary |

Exact ordering should be validated through C11 representative workflows.

---

# 71. C04 Design Decisions

### C04-DEC-01
Sabi Shop uses an adaptive hybrid navigation shell.

### C04-DEC-02
Desktop uses persistent left primary navigation.

### C04-DEC-03
Tablet uses adaptive compact navigation.

### C04-DEC-04
Mobile uses compact bottom navigation plus a role-aware More/contextual menu.

### C04-DEC-05
Sell remains immediately accessible across supported device sizes.

### C04-DEC-06
Primary navigation is role-aware.

### C04-DEC-07
Inaccessible management areas are not indiscriminately exposed as disabled navigation items.

### C04-DEC-08
Business context is persistent and explicit.

### C04-DEC-09
Business switching is deliberate and cannot silently disrupt consequential work.

### C04-DEC-10
Offline/sync state is visible from the shell but remains a cross-cutting system state.

### C04-DEC-11
Management attention is discoverable from the shell.

### C04-DEC-12
Global search is discoverable but does not replace domain navigation.

### C04-DEC-13
Contextual navigation preserves relationship-first architecture.

### C04-DEC-14
The shell never acts as an authorization bypass.

### C04-DEC-15
The shell must preserve user context during navigation and re-entry.

---

# 72. Remaining Open Decisions

C04 deliberately leaves these for later validation or domain work:

- exact desktop sidebar width;
- exact tablet breakpoint;
- exact mobile breakpoint;
- exact mobile bottom-navigation item count;
- exact navigation labels after copy validation;
- exact global search scope;
- exact attention-center structure;
- exact business-switching interaction;
- exact active-sale persistence behavior;
- exact session-expiration behavior;
- exact technical route structure;
- exact shell implementation framework;
- exact responsive table behavior;
- final visual values already governed by C03.

---

# 73. Reconciliation With C00

C00 established:

- business truth outranks design methodology;
- the application should not behave like a marketing page;
- routine work should be fast;
- consequential actions should be deliberate;
- state completeness is mandatory;
- Figma will become a visual source of truth;
- redesign is an audit loop.

C04 applies these principles to the persistent application frame.

---

# 74. Reconciliation With C01

C01 established the logical application structure:

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

It also explicitly left final shell type and device priority to C04. fileciteturn29file1L188-L222

C04 resolves that open architectural question with the adaptive hybrid model.

---

# 75. Reconciliation With C02

C02 establishes:

- normal sale as the highest-priority journey;
- contextual access to Products, Customers, and Money;
- deliberate authorization;
- consequence visibility;
- offline continuity;
- deliberate sync conflict resolution;
- management review as a cross-domain workflow. fileciteturn29file6L869-L888

C04 therefore keeps Sell immediately accessible while preserving management navigation and cross-domain investigation.

---

# 76. Reconciliation With C03

C03 provides the visual system for:

- navigation;
- page headers;
- buttons;
- status;
- alerts;
- responsive interaction;
- offline/conflict states;
- accessibility.

C04 defines where and when those patterns appear.

C04 must not invent a competing visual language.

---

# 77. Reconciliation With B09

B09 owns permissions.

C04 only determines how permission differences are represented in navigation.

Therefore:

```text
B09 = authority
C04 = navigation expression
D-series = technical enforcement
```

---

# 78. Reconciliation With B08

B08 owns correction and exception policy.

C04 ensures correction/history remains discoverable without turning correction into deletion-style navigation.

Material correction workflows belong to C09.

---

# 79. Reconciliation / Historical Open Questions

| Earlier question | Earlier status | C04 resolution | Authority |
|---|---|---|---|
| Navigation model | Open in C00/C01 | Adaptive hybrid | C04 |
| Device priority | Open in C00/C01 | Adaptive behavior by device | C04 |
| Global search scope | Open | Conceptual shell placement defined; scope remains open | Later UX/technical |
| Exception center | Open | Shell-level attention entry supported | C04 + C09/C10 |
| Manager self-correction | Open | Not changed | B09 |
| Settings inventory | Open | Shell placement established; contents remain domain/permission-driven | B09 + later UX |

Historical open-question labels must not be treated as unresolved where C04 now explicitly resolves them.

---

# 80. Acceptance Criteria

C04 is successful when:

- the logical IA has an actual shell model;
- desktop navigation is defined;
- tablet navigation is defined;
- mobile navigation is defined;
- Sell is immediately accessible;
- role-aware navigation is explicit;
- Staff are not overloaded with inaccessible management navigation;
- business context is explicit;
- business switching is protected;
- global search has a defined shell position;
- attention work is discoverable;
- offline state is visible;
- sync conflicts are discoverable;
- integrity state can escalate visibly;
- contextual navigation preserves record relationships;
- deep links remain authorization-safe;
- navigation preserves work context;
- the shell does not create duplicate sources of truth;
- settings remains separate from business operations;
- Activity does not replace domain navigation;
- accessibility requirements are explicit;
- C06–C10 can build their domain UX inside the shell without redesigning the shell.

---

# 81. Next Deliverables

## C05 — Landing Page UX

Define the public-facing Sabi Shop experience while preserving the shared design language established by C00/C03.

## C06 — POS UX

Deeply specify the highest-priority selling experience inside the C04 shell.

## C07 — Inventory & Purchasing UX

Specify products, stock, receiving, suppliers, purchasing, and inventory investigation.

## C08 — Customer & Credit UX

Specify customer identity, credit authorization, debt, repayments, and disputes.

## C09 — Returns, Corrections & Reconciliation UX

Specify the consequential workflows where auditability and management authority are most visible.

## C10 — Offline, Conflict & Exceptional States

Specify cross-cutting system states across the application.

## C11 — UX Validation & Redesign Audit

Validate representative implementation against the approved C00–C10 system and apply the redesign audit methodology.

---

# 82. Summary

C04 turns Sabi Shop's logical IA into a practical application shell.

The core decision is:

> **Adaptive hybrid navigation, with Sell always close at hand.**

Desktop can expose breadth.

Tablet can balance breadth and touch.

Mobile can prioritize the work that happens most often.

But across all of them:

> **Navigation should reduce cognitive load, not hide business truth.**

The shell must help a salesperson sell quickly, help a manager find and resolve important work, and help an owner understand where the business activity lives.

It must never make authorization invisible when authorization matters, make offline work look broken when it is supported, or make historical records appear disposable.

The shell is therefore not just chrome.

> **It is the persistent operating context of Sabi Shop.**

---

# FINAL RECONCILIATION — BUSINESS DECISIONS APPLIED

This document must express the finalized business decisions: configurable 15-minute-default correction window; ordinary vs high-integrity corrections; Owner visibility for consequential Manager self-corrections; logged/reviewable transfer confirmation; core plus configurable payment methods; tax-aware totals; supplier-return settlement states; operational business-day sessions that may cross midnight; shared or individual cash custody; weighted-average costing; visible negative-stock exceptions; and Cash in Hand / Expected Cash / Actual Cash terminology.
