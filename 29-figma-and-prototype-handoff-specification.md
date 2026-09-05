# F00 --- Figma & Prototype Handoff Specification

**Product:** Sabi Shop\
**Phase:** Post-UX Specification / Design Production\
**Status:** READY FOR FIGMA + PROTOTYPE PRODUCTION\
**Depends on:** C00--C11\
**Purpose:** Convert the approved UX specification into a structured,
testable Figma artifact and interactive prototype without reopening
settled business decisions.

------------------------------------------------------------------------

## 1. Purpose

F00 is the bridge between the completed UX specification package and
visual/product design production.

Package C defined **what the experience must do**.

F00 defines **how that approved experience should be organized,
prototyped, reviewed, and handed off in Figma**.

This document is not a new UX requirements package.

It must not silently change:

-   transaction semantics;
-   audit behavior;
-   inventory rules;
-   credit/debt behavior;
-   cash/reconciliation behavior;
-   correction policy;
-   role authority;
-   offline truth;
-   synchronization truth.

Those remain governed by C00--C11 and the relevant B documents.

------------------------------------------------------------------------

## 2. Design Production Principle

> **Design the approved business behavior clearly; do not redesign the
> business behavior while producing the visuals.**

If a visual treatment exposes a contradiction in the approved UX, record
the issue and resolve it explicitly.

Do not bury a business decision inside a Figma component.

------------------------------------------------------------------------

## 3. Figma File Structure

The Figma project should be organized into clear, durable sections.

Recommended structure:

1.  `00 — Cover & Status`
2.  `01 — Foundations`
3.  `02 — Components`
4.  `03 — Patterns`
5.  `04 — Landing`
6.  `05 — App Shell`
7.  `06 — POS`
8.  `07 — Inventory`
9.  `08 — Customers & Credit`
10. `09 — Returns & Corrections`
11. `10 — Cash & Reconciliation`
12. `11 — Offline & Exceptional States`
13. `12 — Management`
14. `13 — Responsive`
15. `14 — Prototype Flows`
16. `15 — QA / Review`
17. `16 — Archive`

The exact page naming may change for practical Figma organization, but
the conceptual separation should remain.

------------------------------------------------------------------------

## 4. File Cover / Status

The first section should make project status immediately understandable.

Include:

-   Sabi Shop name;
-   design version;
-   current phase;
-   last reviewed date;
-   current owner;
-   Package C completion state;
-   prototype state;
-   development-handoff state;
-   link/reference to authoritative specifications.

Recommended status vocabulary:

-   Draft
-   In Review
-   Approved
-   Ready for Prototype
-   Ready for Development
-   Superseded

Do not use ambiguous statuses such as "Final-ish", "Done", or "Almost
Ready".

------------------------------------------------------------------------

## 5. Source-of-Truth References

The Figma file should reference:

### UX

-   C00 --- UX & Design Foundation
-   C01 --- Information Architecture
-   C02 --- User Journeys & Task Flows
-   C03 --- Design System
-   C04 --- Application Shell & Navigation
-   C05 --- Landing Page UX
-   C06 --- POS UX
-   C07 --- Inventory & Purchasing UX
-   C08 --- Customer & Credit UX
-   C09 --- Returns, Corrections & Reconciliation UX
-   C10 --- Offline, Conflict & Exceptional States UX
-   C11 --- UX Validation & Redesign Audit

### Business rules

-   B03 --- Credit & Debt
-   B04 --- Returns & Refund
-   B05 --- Cash & Reconciliation
-   B06 --- Inventory Accounting
-   B07 --- Transaction Lifecycle & State Rules
-   B08 --- Correction & Exception Policy
-   B09 --- Roles & Permissions

Figma should reference these documents rather than duplicate their
entire contents.

------------------------------------------------------------------------

## 6. Foundations

The foundations area should establish the reusable visual language
before detailed screens are produced.

### Required foundation categories

-   typography;
-   type scale;
-   spacing;
-   layout/grid;
-   colors;
-   semantic colors;
-   elevation;
-   borders;
-   radii;
-   iconography;
-   interaction states;
-   motion principles;
-   responsive breakpoints;
-   accessibility guidance.

### Semantic states

At minimum, the system should support visual treatment for:

-   neutral;
-   information;
-   success;
-   warning;
-   error;
-   pending;
-   offline;
-   conflict;
-   authorization;
-   restricted.

These must not rely on color alone.

------------------------------------------------------------------------

## 7. Design Tokens

Where Figma Variables or an equivalent token approach is used, organize
tokens around meaning rather than individual screens.

Examples:

-   `color.surface`
-   `color.surface-elevated`
-   `color.text-primary`
-   `color.text-secondary`
-   `color.border`
-   `color.action-primary`
-   `color.status-success`
-   `color.status-warning`
-   `color.status-error`
-   `color.status-offline`
-   `spacing.xs`
-   `spacing.sm`
-   `spacing.md`
-   `spacing.lg`
-   `radius.sm`
-   `radius.md`
-   `radius.lg`

Do not create screen-specific tokens when a semantic token already
exists.

------------------------------------------------------------------------

## 8. Component Architecture

Components should represent repeated product behavior, not merely
repeated shapes.

### Core component families

-   buttons;
-   icon buttons;
-   inputs;
-   numeric inputs;
-   search;
-   select;
-   combobox;
-   checkboxes;
-   radio controls;
-   segmented controls;
-   tabs;
-   badges;
-   status indicators;
-   alerts;
-   banners;
-   cards;
-   tables;
-   lists;
-   drawers;
-   bottom sheets;
-   dialogs;
-   confirmation dialogs;
-   toasts;
-   navigation;
-   breadcrumbs where appropriate;
-   pagination;
-   empty states;
-   loading states;
-   error states;
-   offline indicators;
-   sync indicators;
-   authorization prompts;
-   activity/event rows.

------------------------------------------------------------------------

## 9. Component State Discipline

Critical components must be designed as explicit variants.

Example button states:

-   default;
-   hover;
-   focus;
-   pressed;
-   disabled;
-   loading;
-   success where meaningful;
-   destructive.

Example form states:

-   empty;
-   focused;
-   filled;
-   invalid;
-   valid;
-   disabled;
-   read-only;
-   loading;
-   offline-limited.

Example transaction-status presentation:

-   pending;
-   successful;
-   failed;
-   unconfirmed;
-   sync pending;
-   sync failed;
-   conflict;
-   restricted.

A component must not visually imply success merely because the user
clicked it.

------------------------------------------------------------------------

## 10. Landing Page Production

The landing page should implement C05 without becoming a separate visual
product.

### Recommended structure

1.  Navigation
2.  Hero
3.  Primary CTA
4.  Product/value proof
5.  Core operational benefits
6.  Sales/POS story
7.  Inventory story
8.  Credit/customer story
9.  Cash/reconciliation story
10. Management visibility
11. Trust/integrity
12. Offline resilience
13. Closing CTA
14. Footer

The exact section count may change after visual exploration.

### Landing-page quality bar

The page must be:

-   clear within seconds;
-   credible;
-   fast;
-   mobile-first;
-   accessible;
-   visually distinctive;
-   honest about capabilities.

Avoid invented metrics, fake customer logos, or unsupported claims.

------------------------------------------------------------------------

## 11. Application Shell Production

The shell should provide a stable frame around all operational modules.

Validate:

-   current business context;
-   current user role;
-   navigation;
-   notifications/attention;
-   connectivity state;
-   sync state;
-   account/session;
-   primary action access.

The shell should not overwhelm POS users with management navigation.

------------------------------------------------------------------------

## 12. POS Prototype

POS is the first major interactive prototype.

Prototype at least:

### Flow A --- Simple sale

Home → New Sale → Product Search → Add Product → Cart → Payment →
Success → Activity/Receipt

### Flow B --- Transfer

Sale → Transfer Payment → Confirmation state → Completed or unconfirmed
state

### Flow C --- Credit

Sale → Customer → Credit → Authorization if required → Completion → Debt
state

### Flow D --- Interrupted / uncertain

Sale → Submit → interrupted connection → uncertain/pending state →
Activity verification

### Flow E --- Duplicate protection

Submit → repeated action → processing/idempotent behavior → single
business result

------------------------------------------------------------------------

## 13. Inventory Prototype

Prototype:

-   product search;
-   stock detail;
-   receive stock;
-   purchase context;
-   stock count;
-   discrepancy;
-   adjustment request/authorization where required;
-   negative-stock exception;
-   activity/history.

The prototype must make it obvious that **receiving stock** and **simply
recording an intention to purchase** are not necessarily the same event.

------------------------------------------------------------------------

## 14. Customer & Credit Prototype

Prototype:

-   customer search;
-   customer profile;
-   current debt;
-   credit sale;
-   credit-limit boundary;
-   authorization;
-   repayment;
-   partial repayment;
-   debt history;
-   return affecting debt;
-   correction affecting debt.

The user should always be able to understand the customer's current
obligation.

------------------------------------------------------------------------

## 15. Returns & Corrections Prototype

Prototype the highest-risk integrity scenarios.

### Return

Original sale → Return → Select item/quantity → Validate eligibility →
Approved return → Refund/settlement state → Inventory/debt consequence →
Activity

### Correction

Original event → Correction request → Reason → Permission/authorization
→ Corrected business state → Original evidence retained →
Activity/history

### Closed-day correction

Closed day → Correction attempt → Elevated control →
Authorization/review → Approved/rejected → History

The prototype must never communicate that a material original event has
been erased.

------------------------------------------------------------------------

## 16. Cash & Reconciliation Prototype

### Staff flow

Sales activity → Close/reconciliation → Expected Cash → Physical Count →
Variance → Explanation/escalation → Close

Do not prototype a routine "Actual Cash" dashboard field for sales
staff.

### Management flow

Management dashboard → Reconciliation issue → Review → Supporting
sales/money-out/activity → Resolution/authorization → Historical record

Use **Cash in Hand** terminology where the product needs to distinguish
physical cash position from generic balances.

------------------------------------------------------------------------

## 17. Offline & Exceptional-State Prototype

Create explicit prototype states for:

-   online;
-   offline;
-   reconnecting;
-   unstable connection;
-   pending sync;
-   sync failure;
-   authorization unavailable;
-   conflict;
-   interrupted workflow;
-   uncertain submission;
-   duplicate prevention;
-   integrity issue;
-   permission denied;
-   authorization required;
-   authorization pending;
-   authorization rejected.

These should not be treated as decorative edge cases.

They are part of the product's core reliability experience.

------------------------------------------------------------------------

## 18. Conflict Prototype

Conflict UI must communicate:

1.  what the user was working with;
2.  what changed elsewhere;
3.  why the values conflict;
4.  what actions are available;
5.  what authority is required;
6.  what evidence remains preserved.

Avoid simplistic:

> "Something went wrong. Refresh."

A conflict is a business-state disagreement, not merely a network error.

------------------------------------------------------------------------

## 19. Activity / Evidence Prototype

Activity should be prototype-tested as a verification tool.

Example uncertain transaction:

Action submitted → network interruption → user opens Activity → finds
transaction → sees current state → understands whether retry is safe.

The prototype should demonstrate why users do not need to blindly repeat
consequential actions.

------------------------------------------------------------------------

## 20. Management Dashboard Prototype

Prototype the management view around decisions.

### Core areas

-   sales;
-   expenses/money-out;
-   cash;
-   profit/performance;
-   inventory remaining;
-   debt/credit exposure;
-   reconciliation issues;
-   authorization requests;
-   exceptions;
-   sync/integrity attention.

Do not make every metric visually equal.

Prioritize what needs attention.

------------------------------------------------------------------------

## 21. Responsive Design Sets

Each major flow should be designed for at least:

### Mobile

Primary operational target.

Validate:

-   thumb reach;
-   tap targets;
-   keyboard;
-   bottom sheets;
-   sticky actions;
-   scrolling;
-   narrow tables;
-   banners;
-   dialogs.

### Tablet

Validate:

-   density;
-   split views;
-   inventory workflows;
-   POS catalog/cart arrangements.

### Desktop

Validate:

-   information density;
-   tables;
-   management review;
-   navigation;
-   keyboard operation.

Responsive behavior should preserve meaning rather than simply shrink
the desktop design.

------------------------------------------------------------------------

## 22. Prototype Flow Index

The prototype should contain clearly named starting points.

Recommended flows:

-   `P01 — Landing`
-   `P02 — Staff Sale`
-   `P03 — Transfer Payment`
-   `P04 — Credit Sale`
-   `P05 — Repayment`
-   `P06 — Stock Receipt`
-   `P07 — Stock Discrepancy`
-   `P08 — Return`
-   `P09 — Material Correction`
-   `P10 — Cash Reconciliation`
-   `P11 — Offline Sale`
-   `P12 — Uncertain Submission`
-   `P13 — Sync Conflict`
-   `P14 — Authorization`
-   `P15 — Management Review`

Figma supports multiple prototype flows and starting points, making
these journeys independently testable. citeturn0search11

------------------------------------------------------------------------

## 23. Interaction Fidelity

Prototype interactions should be faithful enough to validate:

-   navigation;
-   overlays;
-   sheets;
-   confirmation;
-   success;
-   failure;
-   loading;
-   state transitions;
-   error recovery;
-   role boundaries;
-   critical consequences.

Do not over-invest in cinematic animation before task correctness is
validated.

------------------------------------------------------------------------

## 24. Content Fidelity

Prototype with realistic operational content.

Avoid:

-   Lorem ipsum;
-   meaningless product names;
-   impossible prices;
-   fake status combinations;
-   unrealistic customer/debt values;
-   generic "Item 1" data in critical flows.

Content affects whether layout and comprehension can actually be tested.

Use representative Nigerian retail context where appropriate without
stereotyping users.

------------------------------------------------------------------------

## 25. Data-State Fidelity

Prototype realistic state combinations.

Examples:

-   low stock + active sale;
-   customer with outstanding debt;
-   credit limit reached;
-   pending transfer;
-   reconciliation variance;
-   offline + pending sync;
-   correction awaiting authorization;
-   stock discrepancy;
-   return affecting debt;
-   management attention queue.

A polished prototype that only shows happy-path data is insufficient.

------------------------------------------------------------------------

## 26. Annotation Standard

Important frames should include concise annotations for:

-   business consequence;
-   permission requirement;
-   state transition;
-   offline limitation;
-   accessibility behavior;
-   technical dependency;
-   unresolved implementation detail.

Annotations should explain **why**, not restate obvious visual facts.

------------------------------------------------------------------------

## 27. Ready-for-Development Discipline

A design should not be marked Ready for Development merely because it
looks finished.

Before marking a frame/component ready, confirm:

-   business behavior is approved;
-   required states exist;
-   responsive behavior is defined;
-   accessibility considerations are covered;
-   content behavior is understood;
-   component variants are complete;
-   dependencies are identified;
-   prototype behavior is validated.

Figma's Dev Mode supports Ready for dev statuses, annotations,
measurements, version comparison, and developer-focused inspection;
these should be used where the team's Figma plan and workflow support
them. citeturn0search0turn0search6

------------------------------------------------------------------------

## 28. Developer Handoff Standard

The Figma file should make implementation intent discoverable.

Use:

-   descriptive page/section names;
-   meaningful component names;
-   reusable components;
-   variants;
-   semantic styles/variables;
-   annotations for non-obvious behavior;
-   links to relevant specifications;
-   clear ready-for-development status.

Figma's own handoff guidance recommends descriptive naming, organized
sections, reusable components, documentation, and meaningful
descriptions for variants and accessibility guidance.
citeturn0search7

------------------------------------------------------------------------

## 29. Versioning & Change Control

Every material design revision should answer:

-   what changed;
-   why;
-   which UX/business rule it affects;
-   whether the change is visual or behavioral;
-   whether C11 validation needs to be repeated;
-   whether Package D requirements changed.

### Safe change

Example:

Changing a card layout while preserving the same data and action.

### Potentially unsafe change

Changing:

> "Pending transfer"

to:

> "Payment successful"

because the new visual treatment looks cleaner.

That is a business-state change and must not happen inside visual
iteration.

------------------------------------------------------------------------

## 30. Redesign Audit Loop

Every substantial redesign should pass:

1.  visual comparison;
2.  interaction comparison;
3.  business-rule comparison;
4.  role/permission comparison;
5.  exceptional-state comparison;
6.  accessibility comparison;
7.  responsive comparison;
8.  prototype regression.

Only then should it replace the previous design.

------------------------------------------------------------------------

## 31. Figma QA Checklist

### Foundations

-   [ ] Typography is tokenized.
-   [ ] Spacing is consistent.
-   [ ] Semantic colors exist.
-   [ ] Status colors are accessible.
-   [ ] Component radii are intentional.
-   [ ] Iconography is consistent.

### Components

-   [ ] Core controls have state variants.
-   [ ] Loading states exist.
-   [ ] Error states exist.
-   [ ] Disabled states are understandable.
-   [ ] Offline/sync states exist where needed.
-   [ ] Authorization states exist where needed.
-   [ ] Components are reusable.

### Screens

-   [ ] Primary screens exist.
-   [ ] Mobile versions exist.
-   [ ] Desktop versions exist where needed.
-   [ ] Empty states exist.
-   [ ] Loading states exist.
-   [ ] Error states exist.
-   [ ] Permission boundaries exist.

### High-risk workflows

-   [ ] POS
-   [ ] Transfer
-   [ ] Credit
-   [ ] Repayment
-   [ ] Stock receipt
-   [ ] Stock discrepancy
-   [ ] Return
-   [ ] Correction
-   [ ] Cash reconciliation
-   [ ] Offline
-   [ ] Conflict
-   [ ] Authorization

### Integrity

-   [ ] Original evidence remains visible where required.
-   [ ] Corrections do not look like deletions.
-   [ ] Unconfirmed payment is not presented as success.
-   [ ] Pending sync is not presented as server-confirmed success.
-   [ ] Expected Cash is not confused with physical count.
-   [ ] Cash in Hand terminology is consistent.
-   [ ] Negative stock is treated as an exception.

------------------------------------------------------------------------

## 32. Prototype QA Checklist

For every prototype flow:

-   [ ] Starting point is named.
-   [ ] Happy path works.
-   [ ] Important failure state works.
-   [ ] Recovery path works.
-   [ ] Back navigation is safe.
-   [ ] Repeated submission is safe.
-   [ ] Role restrictions are represented.
-   [ ] Critical consequences are visible.
-   [ ] Activity/history can verify uncertain actions where required.
-   [ ] Mobile interaction is usable.

------------------------------------------------------------------------

## 33. User Testing Priorities

If prototype testing is performed, prioritize real operational
comprehension over aesthetic preference.

### Ask users to perform tasks such as:

-   make a sale;
-   find a product;
-   sell on credit;
-   collect repayment;
-   receive stock;
-   resolve a stock discrepancy;
-   process a return;
-   correct a mistake;
-   reconcile cash;
-   determine whether an interrupted sale completed;
-   interpret a sync conflict.

### Observe

-   hesitation;
-   incorrect taps;
-   terminology confusion;
-   accidental destructive actions;
-   inability to locate evidence;
-   misunderstanding of payment state;
-   misunderstanding of debt;
-   misunderstanding of expected cash;
-   inability to recover after interruption.

Do not ask only:

> "Do you like the design?"

Preference is weaker evidence than successful task completion.

------------------------------------------------------------------------

## 34. Acceptance Criteria for F00

F00 is complete when:

1.  The Figma file structure exists.
2.  Foundations are established.
3.  Core components and variants exist.
4.  Primary application screens are represented.
5.  Landing page is represented.
6.  Critical workflows are prototyped.
7.  Exceptional states are represented.
8.  Responsive behavior is defined for core workflows.
9.  Accessibility requirements are represented.
10. Business-integrity constraints remain intact.
11. Prototype flows are testable.
12. High-risk workflows have passed review.
13. Development-ready screens can be clearly identified.
14. Material changes remain traceable.

------------------------------------------------------------------------

## 35. Handoff Gate

A screen is **Ready for Development** only when:

> **The visual design, interaction behavior, business consequence,
> responsive behavior, and exceptional states are sufficiently defined
> that engineering does not need to invent the intended product
> behavior.**

Engineering may still determine implementation mechanisms.

Engineering should not have to decide:

-   whether a transfer is successful;
-   whether a correction erases history;
-   whether a user may perform an action;
-   whether debt should change;
-   whether inventory should change;
-   whether an offline event is confirmed;
-   whether reconciliation can rewrite expected cash.

Those decisions already belong to the product specification.

------------------------------------------------------------------------

## 36. Relationship to Package D

F00 is the final design-production bridge before technical
implementation specification.

Package D should receive:

-   approved Figma structure;
-   approved prototype flows;
-   component behavior;
-   responsive rules;
-   state requirements;
-   business consequences;
-   accessibility requirements;
-   handoff annotations;
-   open technical dependencies.

Package D must then specify how the system technically guarantees the
approved behavior.

------------------------------------------------------------------------

## 37. Historical Question Reconciliation

F00 does not reopen previously resolved questions.

The following remain locked:

-   audit trails are always preserved;
-   material corrections retain traceable original evidence;
-   unsuccessful/reversed/unconfirmed transfers are not represented as
    successful payments;
-   negative stock is an exception requiring reconciliation;
-   sales staff do not maintain an ordinary "Actual Cash" dashboard
    truth;
-   reconciliation uses expected cash versus physical count;
-   "Cash in Hand" is preferred to ambiguous "Balance" where
    appropriate;
-   management sees inventory remaining alongside business performance;
-   role authority is governed by the approved permissions model;
-   offline UX must not fabricate authorization or payment success;
-   conflicts must not silently overwrite business truth.

Any new issue discovered while designing is classified as defect,
remediation, contradiction, or genuinely new requirement according to
C11.

------------------------------------------------------------------------

## 38. Next Deliverable

After F00 is accepted and the Figma/prototype artifact is sufficiently
mature:

> **Begin Package D --- Technical Implementation Specifications.**

Package D should not restart UX discovery.

It should translate the approved product behavior into a technically
enforceable system.

------------------------------------------------------------------------

## 39. Final Principle

The Figma file is not the product's source of truth for business rules.

It is the clearest visual and interactive expression of that truth.

The final quality bar is:

> **A designer can explain it, a shop worker can use it, a manager can
> trust it, and an engineer can implement it without inventing missing
> business behavior.**
