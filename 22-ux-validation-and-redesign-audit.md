# C11 — UX Validation & Redesign Audit

**Product:** Sabi Shop  
**Package:** C — UX & Product Experience  
**Status:** FINAL PACKAGE C DELIVERABLE  
**Purpose:** Validate C00–C10 as one coherent product experience, identify contradictions or implementation risks, define remediation rules, and establish the UX acceptance gate before Figma/prototype/build and Package D implementation specifications.

---

## 1. Purpose

C11 is the final UX governance and validation document for Sabi Shop.

It does **not** introduce a new product concept, redesign the business model, or reopen decisions that have already been resolved. Its job is to validate whether the UX system defined across C00–C10:

- expresses the approved business rules correctly;
- remains coherent across roles, workflows, states, devices, and connectivity conditions;
- protects transaction, cash, inventory, debt, and audit integrity;
- supports realistic Nigerian shop operations;
- avoids generic or inconsistent design patterns;
- is accessible and understandable under operational pressure;
- is implementation-ready;
- and can move into Figma/prototyping/build without hidden UX contradictions.

C11 treats previously approved decisions as **locked requirements** unless a genuine contradiction, safety issue, impossible interaction, or technical impossibility is discovered.

The governing validation principle is:

> **Audit the experience against the approved business truth; improve presentation and interaction without rewriting that truth.**

---

## 2. Package C Closure Rule

Package C consists of:

1. C00 — UX & Design Foundation
2. C01 — Information Architecture
3. C02 — User Journeys & Task Flows
4. C03 — Design System
5. C04 — Application Shell & Navigation
6. C05 — Landing Page UX
7. C06 — POS UX
8. C07 — Inventory & Purchasing UX
9. C08 — Customer & Credit UX
10. C09 — Returns, Corrections & Reconciliation UX
11. C10 — Offline, Conflict & Exceptional States UX
12. C11 — UX Validation & Redesign Audit

After C11 is accepted, **Package C is closed**.

Any later UX issue is handled in one of four ways:

- **Defect:** implementation differs from the approved UX;
- **Remediation:** an approved design can be improved without changing business rules;
- **Contradiction:** two approved specifications conflict and require explicit resolution;
- **New requirement:** the business intentionally changes scope after Package C closure.

A defect or remediation task does **not** reopen Package C.

---

## 3. Source-of-Truth Hierarchy

Validation must respect the following hierarchy.

### 3.1 Business truth

Authoritative business-policy documents govern:

- transaction meaning;
- inventory consequences;
- credit and debt;
- cash and reconciliation;
- corrections;
- returns;
- permissions;
- authorization;
- lifecycle rules;
- auditability.

Relevant documents include, but are not limited to:

- B03 — Credit & Debt
- B04 — Returns & Refund
- B05 — Cash & Reconciliation
- B06 — Inventory Accounting
- B07 — Transaction Lifecycle & State Rules
- B08 — Correction & Exception Policy
- B09 — Roles & Permissions

If UX wording conflicts with a business rule, the UX must be corrected.

### 3.2 UX truth

C00–C11 govern how approved business behavior is presented and operated.

The UX layer must never silently invent a different business result simply because it is easier to design.

### 3.3 Technical truth

Package D defines implementation mechanisms such as:

- persistence;
- offline architecture;
- sync;
- idempotency;
- identifiers;
- authorization enforcement;
- audit-log storage;
- integrity/hash mechanisms;
- technical error codes;
- database behavior.

UX may specify the experience and required observable states, but should not pre-empt technical details reserved for Package D.

### 3.4 Conflict rule

When documents appear inconsistent:

1. determine whether they are addressing the same business event;
2. identify which layer owns the disputed rule;
3. preserve the higher-authority business invariant;
4. revise the lower-level UX or implementation expression;
5. record the resolution;
6. do not silently average two contradictory rules.

---

## 4. Locked Product Principles

The following principles must survive every redesign, prototype, implementation, and visual refinement.

### 4.1 Audit trails are permanent business evidence

Consequential activity must remain explainable.

The product must never make a material event appear as though it never happened merely because it was corrected later.

Original evidence and subsequent correction history must remain traceable according to the approved lifecycle rules.

### 4.2 Corrections change business state without falsifying history

Where a correction is allowed, the correction must be attached to the original event or otherwise traceably related to it.

A UI that simply overwrites consequential records without preserved history fails validation.

### 4.3 Negative stock is an exception, not a normal operating state

The ordinary UX must not normalize negative inventory.

Where inventory inconsistency occurs, the system must flag it, explain the discrepancy, and route the user toward reconciliation or authorized resolution.

### 4.4 Successful business events and unsuccessful attempts are not equivalent

Failed, abandoned, unconfirmed, or reversed payment attempts must not appear as successful transfers or completed sales.

Where an attempt matters operationally, its state may be visible, but the ledger/business result must reflect the approved lifecycle.

### 4.5 Sales staff do not enter “Actual Cash” as a routine dashboard field

Sales staff record sales and money-out activity.

At close, staff physically count cash and use reconciliation to determine whether physical cash tallies with expected cash.

The staff dashboard must therefore avoid an ordinary “Actual Cash” entry/tab that encourages premature self-declaration as truth.

### 4.6 “Cash in Hand” is preferred over ambiguous “Balance”

Where the dashboard refers to expected cash position, terminology must be explicit enough to prevent confusion with account balance, wallet balance, or profitability.

### 4.7 Manager/Owner operational view includes inventory visibility

Management views should not isolate revenue from stock reality.

Stock remaining, stock risks, and inventory-related attention must be available alongside sales, expenses, cash, and business-performance information where relevant.

### 4.8 Authority must be role-aware

Owner authority, manager authority, staff permissions, approval requirements, and escalation paths must remain distinguishable.

The owner defines or governs manager authority according to B09 and subsequent technical implementation rules.

### 4.9 Poor operational performance is not “fixed” by corrupting records

The product may surface coaching, discrepancies, performance problems, or operational concerns.

It must not compensate for weak salesmanship or employee mistakes by falsifying cash, sales, stock, debt, or audit records.

### 4.10 Every consequential state should be explainable

A user with appropriate permission should be able to understand:

- what happened;
- when;
- who initiated it;
- its current state;
- whether action is still pending;
- what changed because of it;
- and what corrective or escalation path is available.

---

## 5. Validation Objectives

C11 validates Sabi Shop across ten dimensions:

1. Business-rule fidelity
2. Task-flow completeness
3. Role and permission clarity
4. Information architecture coherence
5. Design-system consistency
6. Responsive/mobile usability
7. Offline and exceptional-state resilience
8. Accessibility
9. Content and terminology clarity
10. Operational trust and auditability

A visually attractive screen that fails business fidelity is not acceptable.

A technically correct screen that is too confusing to use safely is also not acceptable.

---

## 6. Audit Method

Validation should run in five passes.

### Pass 1 — Document consistency audit

Review C00–C10 together and identify:

- duplicated rules;
- terminology mismatches;
- role inconsistencies;
- contradictory states;
- missing transitions;
- business-rule drift;
- unresolved references;
- screens or states that have no owning workflow.

### Pass 2 — Task walkthrough audit

Execute representative tasks from beginning to end as each role.

Do not validate isolated screens only.

Each walkthrough should verify:

- entry point;
- required context;
- action;
- confirmation;
- business result;
- next state;
- history;
- failure path;
- offline path where relevant;
- permission boundary;
- recovery path.

### Pass 3 — Interface/system audit

Inspect:

- typography;
- spacing;
- hierarchy;
- controls;
- navigation;
- state design;
- forms;
- feedback;
- responsiveness;
- motion;
- accessibility;
- consistency.

### Pass 4 — Exception and integrity audit

Deliberately test unusual or risky conditions:

- duplicate submission;
- offline submission;
- reconnection;
- stale data;
- conflicting edits;
- wrong SKU;
- wrong customer;
- wrong quantity;
- wrong price;
- payment ambiguity;
- return after close;
- debt changes;
- stock discrepancy;
- cash discrepancy;
- unauthorized action;
- rejected authorization;
- interrupted transaction;
- partial sync;
- attempted tampering.

### Pass 5 — Redesign verification

Any visual or interaction redesign must be checked again against the original business behavior.

No redesign passes solely because it looks better.

---

## 7. Severity Model

All findings must be classified.

### P0 — Integrity / Business-Critical

A flaw can:

- falsify records;
- misstate money;
- misstate stock;
- misstate debt;
- lose audit evidence;
- permit unauthorized consequential actions;
- record an unsuccessful transaction as successful;
- silently overwrite meaningful history;
- create unrecoverable ambiguity.

**Release rule:** Must be fixed before release.

### P1 — Task-Blocking

A legitimate user cannot reliably complete an important task.

Examples:

- cannot complete a valid sale;
- cannot reconcile;
- cannot receive stock;
- cannot repay debt;
- cannot resolve a permitted exception;
- cannot understand required authorization.

**Release rule:** Must be fixed before release unless an approved temporary operational workaround exists.

### P2 — High Friction / High Error Risk

The task can be completed, but the UX is likely to cause mistakes, hesitation, or repeated support requests.

**Release rule:** Fix before production where feasible; otherwise explicitly tracked.

### P3 — Consistency / Quality

Examples:

- inconsistent spacing;
- visual hierarchy issue;
- weak microcopy;
- small responsive issue;
- polish defect.

**Release rule:** May be scheduled, provided it does not undermine accessibility or operational safety.

### P4 — Enhancement

Optional improvement that does not correct a defect.

**Release rule:** Backlog unless strategically valuable.

---

## 8. Redesign Rules

The redesign layer exists to improve quality without destabilizing the product.

### 8.1 Preserve working behavior

Do not change:

- transaction semantics;
- permissions;
- state transitions;
- audit behavior;
- inventory effects;
- debt effects;
- reconciliation rules;

merely to make a visual treatment simpler.

### 8.2 Diagnose before redesigning

Before changing an existing screen, identify:

- what is wrong;
- what user risk it creates;
- what rule it violates;
- whether the problem is visual, interactional, structural, semantic, or business-related.

### 8.3 Targeted upgrades beat arbitrary rewrites

Prefer surgical improvements over unnecessary full redesigns.

### 8.4 One product, one coherent visual system

Landing, authenticated application, POS, inventory, credit, correction, and management views must feel like one Sabi Shop product.

Different workflow needs may justify different density and emphasis, but not contradictory design languages.

### 8.5 Landing-page design and product redesign must remain synchronized

C00 governs the integrated use of the approved landing-page design discipline and redesign/audit discipline.

The landing page may be more expressive and conversion-oriented.

The operational application may be denser and task-oriented.

They must still share:

- brand identity;
- typography logic;
- core color language;
- component DNA;
- tone;
- quality threshold.

The redesign process must not create a second incompatible product aesthetic.

### 8.6 Avoid generic AI-generated composition

Audit for patterns such as:

- repetitive equal-width feature cards;
- arbitrary gradients;
- excessive centered text;
- decorative complexity without information value;
- overuse of pills;
- inconsistent radii;
- unnecessary glass effects;
- generic hero copy;
- repeated dashboard cards with no prioritization;
- fake-looking placeholder metrics;
- animation that slows operational work.

The goal is not novelty for its own sake.

The goal is a deliberate, recognizable, trustworthy retail product.

### 8.7 Operational UX outranks decorative motion

Motion should communicate state, hierarchy, feedback, or continuity.

Critical shop tasks must remain fast on lower-powered mobile devices and unstable networks.

---

## 9. Information Architecture Audit

Validate C01 and C04 against all later workflow documents.

### Required checks

- Every important task has a discoverable entry point.
- Navigation labels match user language.
- Role-specific navigation does not expose impossible or misleading actions.
- Management functions are separated from ordinary sales tasks where appropriate.
- Activity/history is easy to reach when users need to verify whether an action succeeded.
- Reconciliation and exception queues are not buried.
- Customers, debts, inventory, purchasing, sales, reports, and settings have predictable locations.
- Back navigation never creates accidental duplicate submission.
- Mobile navigation supports one-handed operation for high-frequency tasks.
- Deep links land in a state that still explains context.

### Failure condition

If a user must already know the internal data model to find a feature, the information architecture needs refinement.

---

## 10. Role & Permission UX Audit

Validate each important task as:

- Owner
- Manager
- Sales staff
- any additional role defined by B09

### Required checks

The UI must distinguish among:

- allowed;
- unavailable;
- requires authorization;
- pending authorization;
- rejected;
- expired/invalidated;
- restricted because of business state;
- restricted because of connectivity or sync state.

A disabled button with no explanation is insufficient for consequential tasks.

### Owner

Validate access to:

- business-wide oversight;
- role governance;
- policy/configuration areas;
- escalations;
- reports;
- high-integrity review;
- authorized corrections.

### Manager

Validate only the authority actually granted.

Do not assume that every manager has owner-equivalent powers.

### Sales staff

Optimize for:

- fast selling;
- product search;
- clear payment capture;
- customer attachment where needed;
- debt/credit flows within authority;
- money-out entry where approved;
- cash reconciliation;
- transparent escalation when authority ends.

### Failure condition

If a user can initiate an action that they can never legally complete and the system only tells them at the final step, the UX should be reconsidered.

---

## 11. POS Validation

C06 must be validated as the highest-frequency operational flow.

### 11.1 Start of sale

Verify:

- fast access;
- obvious sale state;
- no confusion with draft/history;
- reliable offline capability indication.

### 11.2 Product selection

Verify:

- product search;
- barcode/identifier handling where supported;
- clear price;
- clear quantity;
- low-stock awareness without blocking valid selling incorrectly;
- no silent negative stock normalization.

### 11.3 Cart

Verify:

- editable quantity;
- clear totals;
- discount/price authority;
- customer attachment when relevant;
- no hidden consequential changes.

### 11.4 Payment

Verify clear separation of:

- cash;
- transfer;
- split payment where approved;
- credit/debt where approved;
- unconfirmed transfer;
- failed attempt;
- successful payment.

### 11.5 Completion

A successful sale should clearly communicate:

- sale completed;
- payment state;
- receipt/share options where applicable;
- remaining obligations if any;
- inventory effect;
- debt effect where relevant.

### 11.6 Duplicate prevention

Repeated taps, refreshes, reconnection, or interrupted screens must not make users unknowingly create duplicate completed sales.

### 11.7 Activity verification

When the user is unsure whether a sale completed, Activity/history should allow verification without forcing a blind resubmission.

---

## 12. Inventory & Purchasing Validation

Validate C07 against B06 and related lifecycle rules.

### Required checks

- stock levels are understandable;
- receiving stock is distinct from merely ordering it;
- stock changes have identifiable causes;
- cost changes are explicit;
- new stock costing supports valid replacement/payment/profit decisions;
- purchasing workflows preserve supplier/purchase context where defined;
- adjustments require appropriate reason/authority;
- stock count variance is visible;
- negative stock is flagged rather than normalized;
- stock corrections preserve history;
- offline receiving or count behavior is explicit;
- conflict resolution never silently chooses a stock value.

### Management experience

Owner/Manager dashboards should surface inventory health meaningfully rather than reducing the business to revenue-only metrics.

---

## 13. Customer, Credit & Debt Validation

Validate C08 against B03.

### Required checks

- customer lookup avoids accidental duplicate customers where practical;
- credit sale status is explicit;
- customer debt is not confused with sales total;
- credit limit/authority behavior is understandable;
- over-limit action routes to authorization where allowed;
- partial repayment is clear;
- multiple repayments remain traceable;
- repayment allocation is understandable;
- return/refund impact on debt is visible;
- disputes and write-offs follow approved policy;
- corrections preserve debt history;
- closed-day corrections are controlled;
- offline credit limitations are explicit;
- sync conflict on debt is never silently resolved.

### Failure condition

If staff cannot tell whether a customer currently owes the business after a transaction, the workflow fails validation.

---

## 14. Returns & Corrections Validation

C09 must be treated as an integrity-sensitive workflow.

### Required checks

Validate:

- full return;
- partial return;
- no-receipt return where allowed;
- exchange represented according to approved return + new-sale semantics;
- refund state;
- original transaction linkage;
- inventory restoration or other inventory consequence;
- debt consequence;
- payment consequence;
- correction reason;
- authority;
- closed-day behavior;
- rejected correction;
- correction history;
- duplicate correction protection.

### Core acceptance rule

The user should be able to answer:

> What was originally recorded, what was later corrected, who authorized it, and what is the current business result?

If the UI hides one of these where it matters, the integrity experience is incomplete.

---

## 15. Cash & Reconciliation Validation

Validate C06/C09/C10 against B05.

### Sales staff closing experience

Sales staff should be able to:

1. understand expected cash;
2. physically count cash;
3. enter the reconciliation count at the proper closing/reconciliation step;
4. see variance;
5. explain or escalate variance where required;
6. complete the close according to role authority.

Do not introduce an ordinary “Actual Cash” dashboard field that behaves like continuously editable truth.

### Management review

Management should be able to identify:

- unresolved variance;
- material discrepancy;
- staff/member involved;
- business day/session;
- relevant sales/money-out records;
- explanation;
- approval/escalation state;
- correction history.

### Failure condition

A reconciliation workflow that allows a user to make a discrepancy disappear by rewriting the expected record fails validation.

---

## 16. Offline, Sync & Conflict Validation

Validate every core workflow against C10.

### Connectivity states

The product must distinguish useful states such as:

- Online
- Offline
- Reconnecting
- Connection unstable

The exact technical implementation belongs to Package D.

### Pending sync

Users should understand when an action is:

- safely stored locally;
- not yet synchronized;
- synchronized;
- failed;
- needs attention.

### Local record versus business success

A locally saved intent is not automatically equivalent to a successful external payment or server-confirmed business event.

### Conflict

Where two valid states conflict:

- do not silently overwrite;
- explain what differs;
- preserve history;
- apply authority rules;
- provide comparison and resolution where human choice is required.

### Offline authorization

If an action requires authority that cannot safely be verified offline, the UX must not pretend authorization exists.

### Recovery

Interrupted work should have a defined path:

- resume;
- verify;
- discard draft where safe;
- retry;
- escalate.

---

## 17. State Completeness Audit

Every important screen should be reviewed for all applicable states.

### Baseline states

- Default
- Hover
- Focus
- Active
- Disabled
- Loading
- Empty
- Error
- Success
- Partial success
- Offline
- Pending sync
- Sync failed
- Authorization required
- Authorization pending
- Rejected
- Conflict
- Integrity issue

Not every component needs every state, but every **workflow** must account for the states that can realistically occur.

---

## 18. Loading & Perceived Performance Audit

A slow network must not feel like broken software.

### Required checks

- show progress when users must wait;
- avoid indefinite blank screens;
- preserve already-known content while refreshing where safe;
- avoid layout jumps;
- prevent duplicate action while processing;
- make retry explicit;
- distinguish “still working” from “failed”;
- maintain fast perceived response for POS;
- avoid blocking unrelated local actions because one remote request is slow.

---

## 19. Empty-State Audit

Empty states must explain the absence of data in context.

Good empty states answer:

- What is missing?
- Is this normal?
- What should I do next?
- Do I have permission to create it?
- Is the data unavailable only because I am offline?
- Is a filter hiding results?

Avoid decorative empty states that hide an operational problem.

---

## 20. Error-State Audit

Errors should be actionable.

### An error message should identify, where possible:

- what failed;
- what did not fail;
- whether data was saved;
- whether the action can be retried;
- whether retrying could duplicate the action;
- whether the user should verify Activity first;
- whether manager/owner help is required.

Technical stack traces or raw infrastructure error messages must not be exposed as ordinary business guidance.

---

## 21. Content & Terminology Audit

Terminology must remain stable across the product.

### Terms requiring deliberate consistency

- Cash in Hand
- Expected Cash
- Reconciliation
- Sale
- Payment
- Transfer
- Credit
- Debt
- Repayment
- Return
- Refund
- Correction
- Stock
- Stock Count
- Inventory Adjustment
- Authorization
- Activity
- Pending Sync

### Avoid

- multiple names for the same concept;
- vague “Balance” labels;
- “Success” when only local submission succeeded;
- “Delete” when the business rule actually requires reversal/correction;
- technical sync terminology in places where plain operational language is safer;
- accusatory wording for ordinary discrepancies.

Integrity-sensitive copy should be firm and precise without treating a user as dishonest by default.

---

## 22. Dashboard Audit

Dashboards must prioritize decisions, not merely display cards.

### Sales staff dashboard

Prioritize:

- quick sale;
- current shift/day context;
- sales summary;
- expected cash/cash-in-hand context;
- money-out where appropriate;
- stock alerts relevant to selling;
- pending sync/attention;
- reconciliation/close action.

Avoid cluttering staff with management analytics that do not help the next action.

### Manager/Owner dashboard

Prioritize:

- sales;
- expenses/money-out;
- cash;
- profit/performance;
- inventory remaining/stock health;
- debt/credit exposure;
- reconciliation issues;
- exceptions;
- authorization requests;
- sync/integrity attention.

### Validation rule

Each dashboard block must answer a management or operational question.

If a card exists only because dashboards “usually have cards,” remove or redesign it.

---

## 23. Responsive & Mobile Audit

Sabi Shop must be validated mobile-first while remaining effective on larger screens.

### Small phone

Check:

- tap targets;
- one-handed reach;
- sticky actions;
- numeric keyboard behavior;
- product search;
- cart management;
- payment;
- modals/sheets;
- long labels;
- offline banners;
- conflict screens;
- reconciliation entry;
- scrolling under keyboard.

### Tablet

Check:

- use of available width;
- cart + catalog combinations;
- management tables;
- side navigation;
- stock workflows.

### Desktop

Check:

- maximum readable widths;
- efficient data density;
- keyboard navigation;
- multi-column layouts;
- table scanning;
- management review.

### Orientation

Critical workflows must not become unusable on rotation.

---

## 24. PWA / Installable Experience Audit

Where Sabi Shop is delivered as a PWA, validate:

- install experience;
- app icon and metadata;
- standalone presentation;
- navigation without browser assumptions;
- reconnect behavior;
- offline launch behavior;
- update messaging;
- cached-shell behavior;
- data freshness indicators;
- safe handling of stale local state.

Package D owns exact implementation.

---

## 25. Accessibility Audit

Accessibility is part of correctness.

### Minimum validation areas

- keyboard operation;
- visible focus;
- logical focus order;
- form labels;
- error association;
- text contrast;
- control contrast;
- non-color state indicators;
- screen-reader naming;
- heading hierarchy;
- table semantics;
- dialog focus management;
- reduced-motion support;
- touch target sizing;
- zoom/reflow;
- readable numbers and currency.

### High-risk accessibility contexts

Pay special attention to:

- POS quantity controls;
- payment selection;
- authorization dialogs;
- reconciliation variance;
- return/correction confirmation;
- conflict comparison;
- error and offline banners.

---

## 26. Confirmation & Destructive-Action Audit

Confirmation dialogs should be reserved for meaningful risk.

### Require deliberate confirmation when an action:

- materially changes money;
- materially changes stock;
- creates or changes debt;
- submits a refund;
- completes a high-impact correction;
- closes reconciliation;
- resolves a conflict;
- invokes elevated authority;
- cannot be trivially undone.

### Avoid confirmation fatigue

Do not ask “Are you sure?” for routine reversible navigation.

A confirmation should explain the consequence, not merely restate the button label.

---

## 27. Activity, History & Evidence Audit

Activity/history must support operational verification.

### Users should be able to determine:

- whether an action exists;
- whether it completed;
- current state;
- sync state where relevant;
- related customer;
- related stock movement;
- related debt;
- related return/correction;
- who performed it;
- when it occurred;
- authorization where relevant.

### Important

Activity is not merely a feed.

It is an operational evidence surface.

---

## 28. Notification & Attention Audit

Not everything deserves a push notification.

Define urgency according to consequence.

### Immediate attention may include

- important authorization requests;
- sync/integrity failure affecting active work;
- serious reconciliation discrepancy;
- critical inventory condition where relevant;
- failed consequential operation needing human action.

### In-app attention may include

- pending reconciliation;
- low stock;
- pending approval;
- unresolved correction;
- debt follow-up;
- non-critical sync item.

### Validation rule

Notifications should lead directly to the relevant context.

---

## 29. Security-Sensitive UX Audit

UX should help users avoid dangerous mistakes without pretending to replace backend enforcement.

Validate:

- role boundaries;
- re-authentication for high-impact actions where specified later;
- session-expiry behavior;
- permission changes;
- sensitive settings;
- audit visibility;
- secure handling of approval actions;
- no reliance on hidden buttons as authorization.

Package D owns technical enforcement.

---

## 30. Data-Density Audit

Retail management contains dense operational information.

Do not solve density by hiding business-critical context.

### Prefer

- hierarchy;
- grouping;
- progressive disclosure;
- filters;
- summaries with drill-down;
- sticky headers;
- clear columns;
- meaningful defaults.

### Avoid

- excessive cardization;
- horizontal scrolling for ordinary phone tasks;
- tiny typography;
- collapsing distinct financial concepts into one number.

---

## 31. Visual-System Audit

Validate C03 across all surfaces.

### Typography

Check:

- approved typefaces;
- readable numeric forms;
- hierarchy;
- consistent scale;
- no arbitrary one-off sizes.

### Color

Check:

- semantic use;
- contrast;
- status consistency;
- restrained accent use;
- no arbitrary gradients unless intentionally defined.

### Spacing

Check:

- token usage;
- consistent rhythm;
- density appropriate to the workflow.

### Radius

Check:

- consistent hierarchy;
- nested elements feel geometrically coherent;
- not every component uses the same radius mechanically.

### Icons

Check:

- consistent icon family;
- familiar meaning;
- labels where ambiguity is possible.

### Motion

Check:

- state communication;
- no blocking animation;
- reduced-motion support;
- restrained use in POS.

---

## 32. Landing Page Validation

Validate C05 against C00 and the final product truth.

### The landing page should accurately communicate

- who Sabi Shop is for;
- what operational problems it solves;
- major value propositions;
- trust;
- offline capability where promised;
- inventory;
- sales;
- cash/reconciliation;
- customer credit/debt;
- management insight.

### Do not promise

- features not in approved scope;
- perfect operation under conditions the technical product cannot support;
- automatic financial truth where human reconciliation is required;
- unlimited permissions;
- irreversible-delete behavior that conflicts with audit policy.

### Conversion audit

Check:

- hero clarity;
- CTA hierarchy;
- proof;
- feature sequencing;
- objections;
- mobile conversion;
- page performance;
- semantic/accessibility quality.

---

## 33. End-to-End Scenario Suite

The following scenarios should be validated before Package C is considered implementation-ready.

### Scenario 1 — Simple cash sale

Staff sells an in-stock item for cash and sees correct post-sale state.

### Scenario 2 — Transfer sale

Staff records a confirmed successful transfer according to policy.

### Scenario 3 — Unconfirmed transfer

The UI avoids falsely completing the payment as confirmed success.

### Scenario 4 — Split payment

If enabled, the user sees how each payment component contributes to the completed sale.

### Scenario 5 — Credit sale

Authorized staff sells on credit and customer debt updates correctly.

### Scenario 6 — Credit limit exceeded

The action is blocked or routed to authorization according to policy.

### Scenario 7 — Partial repayment

Customer repays part of an outstanding debt and the remaining obligation is clear.

### Scenario 8 — Stock receipt

Authorized user receives new stock, records applicable cost information, and stock updates.

### Scenario 9 — Stock discrepancy

A count identifies mismatch and routes to reconciliation rather than silently rewriting quantity.

### Scenario 10 — Return

A valid return links to the original transaction and produces the approved cash/stock/debt effects.

### Scenario 11 — Correction

A material mistake is corrected while original evidence remains visible.

### Scenario 12 — Closed-day correction

The UI applies stricter control and appropriate authority.

### Scenario 13 — Cash reconciliation matches

Staff counts cash and closes with no discrepancy.

### Scenario 14 — Cash reconciliation differs

Variance is explained/escalated without rewriting expected cash.

### Scenario 15 — Offline sale

A supported offline sale is safely recorded and clearly marked for sync.

### Scenario 16 — Offline authorization-required action

The system does not pretend approval exists.

### Scenario 17 — Duplicate submission

Repeated action does not create duplicate completed business events.

### Scenario 18 — Sync conflict

The user is shown a controlled resolution path rather than a silent overwrite.

### Scenario 19 — Interrupted sale

User can determine whether the sale was draft, completed, or uncertain.

### Scenario 20 — Manager review

Manager sees sales, expenses, inventory health, debt, reconciliation, and outstanding attention in one coherent operational system.

---

## 34. Validation Traceability Matrix

| Area | Primary UX Owner | Business Dependencies | Core Validation |
|---|---|---|---|
| Foundation | C00 | All B rules | Principles remain consistent |
| Information architecture | C01 | B09 | Features discoverable by role |
| Journeys | C02 | B03–B09 | End-to-end task completeness |
| Design system | C03 | C00 | One coherent product system |
| Shell/navigation | C04 | B09 | Correct role-aware access |
| Landing page | C05 | Approved product scope | Claims match actual product |
| POS | C06 | B05, B07, B09 | Fast, correct, duplicate-safe selling |
| Inventory/Purchasing | C07 | B06, B07, B09 | Accurate stock consequences |
| Customer/Credit | C08 | B03, B07, B08, B09 | Debt truth and controlled credit |
| Returns/Corrections | C09 | B04, B05, B06, B07, B08, B09 | Preserve history while correcting |
| Offline/Exceptions | C10 | B03–B09, D07–D11 | No false certainty or silent overwrite |
| Validation | C11 | C00–C10, B03–B09 | Package-wide coherence |

---

## 35. Acceptance Gate

Package C passes only when all of the following are true.

### Business fidelity

- No known P0 business-integrity contradiction remains.
- Transaction states match business rules.
- Stock effects match inventory rules.
- Debt effects match credit/debt rules.
- reconciliation rules are preserved.
- corrections and returns preserve history appropriately.
- permissions reflect approved authority.

### Workflow completeness

- High-frequency tasks can be completed from start to finish.
- Required exception paths exist.
- Offline paths exist where the product claims offline support.
- Recovery paths exist for uncertain submissions.

### UI consistency

- One design system is used.
- Key terminology is stable.
- mobile and desktop variants remain conceptually equivalent.
- landing page and application feel like the same brand.

### Accessibility

- Critical workflows are keyboard and screen-reader operable where applicable.
- Contrast and focus are acceptable.
- error states are accessible.
- state is not communicated by color alone.

### Operational trust

- Users can verify whether consequential actions succeeded.
- Audit history is discoverable.
- corrections do not erase original evidence.
- pending sync is distinguishable from success.
- conflicts do not silently overwrite records.

---

## 36. UX QA Checklist for Figma

Before Figma is approved for build, check:

- every primary screen exists;
- every primary workflow has start/end states;
- component variants include real states;
- offline/sync indicators are represented;
- permission/authorization states are represented;
- loading/empty/error states are designed;
- mobile views exist for core flows;
- confirmation dialogs show consequence;
- reconciliation variance is designed;
- credit/debt status is designed;
- activity/history is designed;
- stock discrepancy is designed;
- correction history is designed;
- management attention states are designed;
- design tokens are reusable;
- typography and spacing are consistent;
- no screen relies on placeholder business logic.

---

## 37. UX QA Checklist for Implementation

Before production release, verify:

- implementation matches approved Figma and C documents;
- backend authorization matches visible permissions;
- transaction completion cannot be duplicated through repeated submission;
- local/offline state is recoverable;
- data shown as “successful” is actually successful under business rules;
- no consequential edits bypass audit history;
- stock cannot silently drift through unsupported negative-state behavior;
- reconciliation does not permit history rewriting;
- debt changes remain traceable;
- activity/history is complete enough for verification;
- accessibility checks pass;
- key mobile devices are tested;
- PWA behavior is tested where applicable;
- lower-connectivity conditions are tested;
- high-risk error messages are tested.

---

## 38. Audit Finding Template

Every C11 finding should use the following format.

### Finding

**ID:** UX-AUDIT-###  
**Severity:** P0 / P1 / P2 / P3 / P4  
**Area:**  
**Affected role(s):**  
**Source documents:**  
**Observed issue:**  
**User/business risk:**  
**Expected behavior:**  
**Recommended remediation:**  
**Business rule change required?:** Yes / No  
**Owner:** Design / Product / Engineering / Business  
**Verification:**  
**Status:** Open / In Progress / Resolved / Accepted Risk

This format prevents vague redesign feedback.

---

## 39. Redesign Remediation Order

Where multiple UX problems exist, fix in this order unless a P0/P1 issue requires immediate escalation:

1. business integrity;
2. broken task flow;
3. authorization/role clarity;
4. missing states;
5. accessibility;
6. terminology/content;
7. navigation/information architecture;
8. layout and hierarchy;
9. design-token consistency;
10. motion and polish.

Aesthetic polish must never delay an integrity fix.

---

## 40. Figma Handoff Standard

The Figma artifact should become the visual implementation source while remaining traceable to C00–C11.

### Minimum organization

Recommended high-level sections:

- Foundations
- Components
- Landing
- App Shell
- POS
- Inventory & Purchasing
- Customers & Credit
- Returns & Corrections
- Reconciliation
- Offline & Exceptional States
- Management
- Responsive
- Prototype Flows
- Audit / QA

### Component expectations

Components should encode:

- size variants;
- states;
- semantic status;
- responsive behavior where needed;
- accessibility notes for non-obvious interaction;
- content rules for critical components.

### Prototype expectations

Prototype at least the high-risk flows in Section 33.

---

## 41. Package D Handoff

C11 does not define implementation mechanisms.

Package D should consume the approved UX and specify the technical reality beneath it.

Examples include:

- data model;
- API contracts;
- transaction lifecycle enforcement;
- offline storage;
- sync engine;
- idempotency;
- identifiers;
- authorization enforcement;
- audit architecture;
- integrity/hash mechanisms;
- conflict mechanics;
- technical error mapping;
- PWA/service-worker strategy;
- observability and recovery.

If Package D discovers a genuine technical impossibility, that issue must be classified as a contradiction or design constraint and resolved explicitly.

Engineering should not silently alter the user-facing business outcome.

---

## 42. Historical Question Reconciliation

This section closes previously raised ambiguities that have already been resolved by the product specification process.

| Historical question / ambiguity | Resolution now governing C11 |
|---|---|
| Should audit trails ever be sacrificed to simplify correction? | No. Preserve audit trails and consequential history. |
| Can a correction simply overwrite a prior material event? | No. Correct the business state while retaining traceable original evidence. |
| Should reversed/failed/unconfirmed transfer attempts be recorded as successful transfers? | No. Only actual successful transfer/payment state may be treated as success. |
| Should negative stock be accepted as normal? | No. Flag and reconcile inventory inconsistency. |
| Should sales staff enter a continuous “Actual Cash” dashboard value? | No. Staff count physical cash during reconciliation/close and compare it with expected cash. |
| Should “Balance” be used for expected shop cash position? | Prefer explicit “Cash in Hand” / expected-cash terminology to avoid ambiguity. |
| Should owner/manager dashboards show inventory remaining? | Yes. Management needs stock visibility alongside sales, expenses, cash, profit/performance, and attention areas. |
| Who determines manager authority? | Owner-defined role governance under B09 and subsequent implementation controls. |
| Can poor staff performance be hidden by changing records? | No. Operational performance is managed separately from record truth. |
| Should unauthorized consequential actions be allowed because the user is offline? | No. Offline operation must preserve authorization boundaries. |
| Can sync conflicts be resolved by silently choosing one value? | No. Preserve evidence and apply explicit conflict resolution/authority rules. |
| Should Package C continue expanding indefinitely? | No. C11 closes Package C. Further work moves to Figma/prototype/build and Package D unless the business intentionally introduces new scope. |
| Should the landing-page design discipline and redesign discipline create separate visual languages? | No. C00 governs their synchronized use as one Sabi Shop design system. |
| Should later UX validation reopen all previous questions? | No. Previously resolved questions remain locked unless a genuine contradiction is found. |

---

## 43. Explicit Non-Decisions

C11 intentionally does not decide technical implementation details reserved for later specifications.

These include:

- exact offline database technology;
- exact synchronization algorithm;
- exact conflict metadata schema;
- exact idempotency-key format;
- exact server/API error codes;
- exact cryptographic/hash-chain implementation;
- exact notification infrastructure;
- exact PWA cache strategy;
- exact database transaction/isolation approach;
- exact monitoring stack;
- exact infrastructure topology.

The UX may require observable behavior, but Package D owns these mechanisms.

---

## 44. Completion Rule

C11 is complete when:

- C00–C10 have been audited against this framework;
- any P0/P1 contradictions are resolved;
- unresolved P2 issues have owners;
- Figma/prototype requirements are traceable;
- Package D receives clear behavioral requirements;
- the locked historical decisions above are preserved.

Once complete:

> **Package C is closed.**

Further design work should be expressed as Figma/prototype production and targeted remediation—not as an endless sequence of new foundational UX specification documents.

---

## 45. Final Product Validation Principle

A shop-management product earns trust when its interface makes the business easier to run **without making the truth easier to manipulate**.

Sabi Shop should therefore feel:

- fast enough for daily selling;
- clear enough for staff;
- powerful enough for management;
- resilient enough for unstable connectivity;
- structured enough for growth;
- and trustworthy enough that cash, stock, debt, corrections, and history remain explainable.

The final UX acceptance question is:

> **Can the right user complete the right task quickly, understand what happened, recover safely when something goes wrong, and trust that the system did not silently rewrite the business truth?**

If the answer is yes across the critical scenarios in this document, Package C has done its job.
