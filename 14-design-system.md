# C03 — Sabi Shop Design System

**Product:** Sabi Shop  
**Document ID:** C03  
**Package:** C — User Experience Specification  
**Status:** RECONCILED — DESIGN BASELINE — Design System Foundation  
**Version:** 1.0  
**Prepared:** 2026-09-04  
**Depends on:** C00 — UX & Design Foundation; C01 — Information Architecture; C02 — User Journeys & Task Flows  
**Authoritative for:** Sabi Shop visual language, design tokens, component principles, state presentation, interaction patterns, and responsive design rules  
**Does not replace:** B01–B09 business rules, D02 terminology, D03–D11 technical specifications, or later domain UX documents

---

# 1. Purpose

C03 establishes the reusable visual and interaction system for Sabi Shop.

The purpose is to prevent each screen from becoming its own design experiment.

The system must make Sabi Shop feel:

- trustworthy;
- fast;
- clear;
- distinctive;
- operationally competent;
- calm under pressure;
- appropriate for real retail work.

The governing UX principle remains:

> **Fast for ordinary work. Deliberate for consequential work.**

C03 converts that principle into reusable visual rules.

---

# 2. Source Hierarchy

When visual or interaction decisions conflict, use this order:

1. Locked Sabi Shop business rules.
2. Authoritative Sabi Shop domain specifications.
3. C00–C02 UX decisions.
4. C03 design-system decisions.
5. Later domain UX specifications.
6. External design skills.
7. Framework defaults.
8. Agent preference.

The external design skills provide methodology and candidate values. They do not override Sabi Shop requirements.

C00 explicitly establishes that external fonts, colors, spacing, radius, and motion values are candidate values rather than automatically adopted Sabi Shop tokens. fileciteturn28file5L637-L649

---

# 3. Design-System Philosophy

## 3.1 One system, two contexts

Sabi Shop has two major visual contexts:

### Public / marketing

The landing experience may use:

- stronger visual composition;
- larger type;
- richer storytelling;
- stronger visual contrast;
- controlled motion;
- conversion-oriented hierarchy.

### Operational application

The application prioritizes:

- information density;
- speed;
- scanability;
- clear state;
- low visual distraction;
- reliable interaction;
- touch and pointer usability;
- exceptional-state clarity.

They should feel like the same product.

They should not behave like the same interface.

---

# 4. Visual Character

Sabi Shop should avoid looking like:

- generic SaaS;
- generic accounting software;
- a template dashboard;
- a spreadsheet with rounded cards;
- an AI-generated admin panel;
- an enterprise ERP clone.

The visual character should communicate:

> **Simple enough to use immediately. Serious enough to trust with the business.**

Distinctiveness should come from:

- typography;
- hierarchy;
- spacing;
- surface treatment;
- icon discipline;
- state language;
- motion restraint;
- high-quality composition.

Not from decorative effects.

---

# 5. Design Tokens

The tokens below are the starting Sabi Shop system.

They are intentionally centralized so later screens consume the same values.

---

# 6. Typography

## 6.1 Primary typeface

**Preferred family: Geist.**

Reason:

- strong UI readability;
- compact enough for operational interfaces;
- clear numerals;
- modern without feeling decorative;
- suitable across desktop and mobile.

## 6.2 Secondary / display candidate

**Manrope** may be used selectively for high-level marketing or display treatment if validated during implementation.

It should not create a second competing application typography system.

## 6.3 Monospace

**Geist Mono** is reserved for:

- IDs;
- technical references;
- audit/hash references;
- structured codes;
- diagnostic information.

Do not use monospace for ordinary prose.

## 6.4 Typography rules

Do:

- use strong hierarchy;
- use sentence case for most interface copy;
- use weight to establish hierarchy;
- preserve comfortable line length;
- make numerical information easy to scan.

Do not:

- use italics as a core hierarchy mechanism;
- use ultra-heavy display weights for ordinary UI;
- use decorative typography inside dense operational workflows;
- use all caps for large amounts of content.

---

# 7. Type Scale

The system uses a restrained scale derived from the external design guidance and adapted for operational readability.

| Token | Size | Primary use |
|---|---:|---|
| Display | 48px | Marketing hero only |
| H1 | 32px | Major page heading |
| H2 | 24px | Section heading |
| H3 | 20px | Subsection / important panel |
| H4 | 18px | Component heading |
| Body Large | 16px | Primary readable content |
| Body | 14px | Default application UI |
| Body Small | 13px | Supporting information |
| Caption | 12px | Metadata / helper text |
| Mono | 13px | IDs / technical values |

Responsive implementations may reduce display sizes, but hierarchy must remain intact.

---

# 8. Typography Hierarchy

A typical operational page should read in this order:

```text
Page title
↓
Context / primary status
↓
Primary action
↓
Important numbers / records
↓
Supporting details
↓
Metadata
```

The system should not make every element visually loud.

---

# 9. Number Presentation

Numbers are business-critical information.

Use consistent alignment and formatting for:

- prices;
- quantities;
- balances;
- debts;
- supplier liabilities;
- cash;
- margins;
- incentives.

Currency amounts should visibly communicate currency context.

Avoid ambiguous numbers without labels.

Example:

```text
Customer Debt
₦125,000.00
```

rather than:

```text
125000
```

---

# 10. Color System

C00 deliberately left the final color system open. fileciteturn28file5L671-L677

C03 therefore establishes semantic roles first.

Exact final hex values should be finalized after visual validation.

## 10.1 Semantic roles

| Role | Meaning |
|---|---|
| Primary | Main Sabi Shop action / brand |
| Neutral | Default interface |
| Success | Successfully completed / confirmed |
| Warning | Attention required |
| Danger | Blocked / destructive consequence / serious exception |
| Info | Informational state |
| Pending | Awaiting completion |
| Offline | Local/offline operating state |
| Conflict | Requires resolution |
| Integrity | Security/integrity escalation |

Semantic color must never be the only indicator of state.

---

# 11. Color Usage Rules

Use color to communicate meaning.

Do not use:

- multiple unrelated accent colors;
- decorative rainbow status systems;
- saturated colors for ordinary content;
- red as generic attention;
- green as generic positive decoration.

A warning should look like a warning because of:

- label;
- icon;
- placement;
- wording;
- color.

Not color alone.

---

# 12. Surfaces

Sabi Shop should use a restrained surface hierarchy.

Recommended conceptual levels:

```text
Application background
    ↓
Primary surface
    ↓
Raised / interactive surface
    ↓
Focused / selected surface
    ↓
Exception surface
```

Avoid excessive nested cards.

A page should not become:

```text
card
  card
    card
      card
```

Prefer spacing and typography to establish hierarchy.

---

# 13. Borders and Dividers

Borders should be functional.

Use them to:

- separate table regions;
- establish input boundaries;
- distinguish panels;
- communicate grouping;
- define interactive controls.

Do not turn every section into a bordered box.

---

# 14. Spacing System

The starting spacing scale follows the controlled scale established by the external design methodology:

```text
0
2
4
8
12
16
24
32
40
48
64
80
96
```

Primary application spacing should favor:

- 8px;
- 12px;
- 16px;
- 24px;
- 32px.

Large values are primarily for major layout separation and marketing composition.

---

# 15. Spacing Rules

Use spacing to express hierarchy.

Typical relationship:

```text
Label → value
small

Field → field
medium

Section → section
large

Page → page region
very large
```

Avoid arbitrary one-off spacing values.

---

# 16. Radius

Use a controlled radius system.

Recommended starting tokens:

| Token | Radius |
|---|---:|
| None | 0px |
| XS | 4px |
| SM | 6px |
| MD | 8px |
| LG | 12px |
| XL | 16px |
| Pill | 999px |

The exact final values may be tuned during implementation.

## Nested radius principle

When a component is placed inside a rounded container:

> **Inner radius = outer radius − gap**

where appropriate.

This preserves visual alignment.

---

# 17. Buttons

Buttons communicate action hierarchy.

## Primary

Use for:

- completing a normal sale;
- committing an important normal operation;
- primary page action.

## Secondary

Use for:

- alternative actions;
- navigation within context;
- less prominent valid actions.

## Tertiary / ghost

Use for:

- contextual actions;
- secondary utilities;
- low-emphasis operations.

## Danger

Use only when the consequence genuinely warrants danger semantics.

Do not use red merely to make an action noticeable.

---

# 18. Button Rules

Every button must have:

- default;
- hover;
- active;
- focus;
- disabled;
- loading where applicable.

Loading must prevent ambiguous double submission.

The user should know whether the action:

- is still processing;
- succeeded;
- failed;
- requires authorization.

---

# 19. Inputs

Inputs should prioritize speed and error prevention.

Required characteristics:

- clear labels;
- visible value;
- predictable focus;
- useful keyboard behavior;
- validation near the affected field;
- understandable errors;
- appropriate input type.

For POS:

- search should be fast;
- quantity entry should be easy;
- price editing should be explicit;
- payment entry should minimize unnecessary movement.

---

# 20. Forms

Forms should be structured around the user's task rather than the database schema.

Bad:

```text
SKU
Product ID
Customer ID
User ID
Business ID
```

Better:

```text
Product
Customer
Salesperson
Quantity
Price
Payment
```

Technical identifiers may exist in detail views without becoming primary user-facing concepts.

---

# 21. Tables

Tables are important for management workflows.

They must support:

- clear column hierarchy;
- readable numbers;
- consistent alignment;
- row hover/focus;
- selection where needed;
- pagination or controlled loading;
- empty state;
- loading state;
- error state;
- responsive strategy.

Numeric columns should normally align consistently.

Dates and IDs should be visually subordinate to business-critical values.

---

# 22. Dense Data Without Visual Noise

Sabi Shop requires meaningful data density.

Density should come from:

- spacing discipline;
- typography;
- alignment;
- grouping;
- predictable columns.

Not from:

- tiny text;
- cramped controls;
- excessive borders;
- excessive badges;
- compressed tap targets.

---

# 23. Cards

Cards should be used when they represent a meaningful conceptual unit.

Good uses:

- daily business summary;
- exception;
- customer summary;
- product summary;
- reconciliation summary.

Bad use:

> Every piece of information becomes a card.

Important information should sometimes simply be a well-composed section.

---

# 24. Status System

Status is a first-class design primitive.

The system must distinguish:

- Completed;
- Pending;
- Awaiting Authorization;
- Rejected;
- Blocked;
- Offline;
- Sync Pending;
- Conflict;
- Correction;
- Returned;
- Partially Returned;
- Fully Returned;
- Integrity Issue.

These are not necessarily all business lifecycle states.

The UI must distinguish:

> **business state** from **system/task state**.

---

# 25. Status Component

A status presentation may contain:

```text
[Icon] Label
       Supporting explanation
```

Examples:

```text
✓ Completed
  Payment confirmed

⏳ Awaiting approval
   Manager authorization required

↗ Sync pending
  Recorded on this device

! Conflict
  Management review required
```

The exact copy is finalized by domain UX.

---

# 26. Badges

Badges are for compact status communication.

Do not use badges for every piece of metadata.

Avoid badge overload such as:

```text
[Active] [Paid] [Verified] [Good] [Online] [Staff]
```

If everything is emphasized, nothing is emphasized.

---

# 27. Alerts

Alerts should answer:

1. What happened?
2. Why does it matter?
3. What can the user do?

Example structure:

```text
Payment not confirmed

The transfer could not be confirmed, so this sale has not
been completed using that payment.

[Try another payment method]
```

Avoid vague:

> Something went wrong.

---

# 28. Confirmation Patterns

Confirmation should be proportional to consequence.

## Low consequence

Immediate action may be appropriate.

## Medium consequence

Inline confirmation or clear state change.

## High consequence

Use a deliberate confirmation surface showing:

- action;
- affected record;
- expected consequences;
- authorization requirement;
- reason field where required.

Do not use confirmation dialogs for every action.

---

# 29. Authorization UI

Authorization should feel like a business control, not a software failure.

Good:

> **Manager approval required**  
> This price is below the configured floor.

Bad:

> Error 403.

Authorization surfaces should show:

- why authorization is required;
- what is being authorized;
- who may authorize;
- resulting consequence;
- approval/rejection path.

---

# 30. Correction UI

Correction must visually differ from deletion.

A correction surface should show:

```text
Current accepted state
        ↓
Proposed correction
        ↓
Expected effects
        ↓
Reason
        ↓
Authorization if required
        ↓
Confirm correction
```

For material corrections, show affected areas such as:

- payment;
- inventory;
- debt;
- incentive;
- attribution.

---

# 31. Auditability as a Design Pattern

Important records should expose understandable history.

A useful history model:

```text
Current accepted state
        ↓
What changed
        ↓
Who changed it
        ↓
When
        ↓
Why
        ↓
Related business effects
```

Do not expose raw technical logs as the primary user experience.

Auditability is about reconstructability.

---

# 32. Timeline Pattern

A timeline is appropriate for:

- corrections;
- approvals;
- returns;
- reconciliations;
- sync conflicts;
- important record history.

Example:

```text
10:42  Sale completed
       Staff — ₦85,000

11:10  Correction requested
       Price changed

11:14  Manager approved
       Reason recorded

11:14  Corrected state accepted
```

Exact event vocabulary belongs to the relevant domain.

---

# 33. Search

Search is a core operational pattern.

It should prioritize:

- speed;
- relevance;
- clear identity;
- useful distinguishing information;
- keyboard support where appropriate.

Product search must reduce wrong-SKU risk.

Customer search must reduce wrong-customer risk.

Transaction search must support investigation.

---

# 34. Empty States

Empty states should explain the situation and, where useful, offer the next action.

Examples:

```text
No customers yet
Add a customer when you need to record credit or customer details.

[Add customer]
```

Avoid:

> Nothing here.

---

# 35. Loading States

Loading should preserve layout where possible.

Prefer:

- skeletons for predictable content;
- progress indicators for meaningful long operations;
- immediate feedback for locally completed offline work.

Avoid replacing the whole application with an unnecessary spinner.

---

# 36. Error States

Errors should be actionable.

A useful error contains:

```text
What happened
Why it matters
What can be done
```

For operational errors, preserve entered data where safe.

Never make the user re-enter an entire sale because a later step failed.

---

# 37. Offline States

Offline must be visible but not disruptive.

The application should communicate:

```text
Online
Offline
Sync pending
Syncing
Conflict
```

Offline status should not dominate the screen when ordinary work can continue.

---

# 38. Sync Pending

A locally accepted operation may show:

> **Recorded · Sync pending**

This distinguishes:

- accepted local business activity;
- successful server synchronization.

Do not falsely label a locally recorded operation as "failed" simply because synchronization has not yet occurred.

---

# 39. Conflict State

Conflict is a deliberate state.

Use stronger visual treatment than ordinary sync pending.

Show:

- affected record;
- conflicting versions;
- relevant users;
- timestamps;
- business effects;
- required authority.

Never provide a casual "overwrite" action that could destroy accepted history.

---

# 40. Integrity State

Integrity issues require the strongest system treatment.

The UI should communicate:

> **Action blocked**

followed by:

> This record requires higher-level review.

Do not expose a normal edit flow as the recovery mechanism.

---

# 41. Icons

C00 and the external skills support icon families such as:

- Phosphor;
- Solar;
- Iconamoon.

C03 recommends **one primary icon family** for the application.

Final family selection should be validated against:

- clarity;
- weight consistency;
- available symbols;
- licensing;
- implementation quality.

Do not mix icon families casually.

---

# 42. Icon Rules

Icons should:

- reinforce meaning;
- have accessible labels when necessary;
- maintain consistent stroke/weight;
- not replace critical text;
- not be used as decoration without purpose.

For unfamiliar actions, pair icon with text.

---

# 43. Motion

Motion should communicate state and hierarchy.

Use motion for:

- entering/leaving contextual surfaces;
- status transitions;
- loading;
- success feedback;
- expanding detail;
- navigation transitions where useful.

Avoid:

- constant animated backgrounds;
- decorative motion during selling;
- excessive bouncing;
- motion that delays operational work.

---

# 44. Motion Timing

Motion should feel quick and controlled.

Candidate timing:

| Type | Range |
|---|---:|
| Micro interaction | 100–160ms |
| Standard transition | 160–240ms |
| Larger transition | 240–360ms |

Use a consistent custom easing curve rather than arbitrary defaults.

Final timing should be validated in C11.

---

# 45. Reduced Motion

Respect user/device reduced-motion preferences.

When reduced motion is enabled:

- remove decorative movement;
- shorten transitions;
- preserve state clarity;
- do not remove essential feedback.

---

# 46. Responsive Design

C00 and C01 deliberately leave final device priority open. C01 defines content hierarchy independently of device and assigns final responsive behavior to C04. fileciteturn28file7L957-L985

C03 therefore defines responsive principles rather than final shell decisions.

## Desktop

Prioritize:

- information density;
- simultaneous context;
- management workflows;
- tables;
- investigation.

## Tablet

Prioritize:

- operational flexibility;
- touch interaction;
- compact navigation;
- POS continuity.

## Mobile

Prioritize:

- Sell;
- Search;
- recent activity;
- contextual actions;
- essential management information.

C04 finalizes the shell.

---

# 47. Touch Targets

Interactive controls must remain comfortably usable by touch.

Do not shrink controls merely to fit more information.

Operational density should come from layout discipline, not unusably small targets.

---

# 48. Keyboard and Focus

Where desktop workflows matter:

- search should support keyboard use;
- common POS actions should minimize pointer movement;
- focus must remain visible;
- tab order must follow task logic;
- dialogs must trap focus appropriately;
- escape should behave predictably.

Keyboard behavior must not conflict with business confirmation requirements.

---

# 49. Accessibility

The design system must support:

- sufficient contrast;
- visible focus;
- semantic structure;
- labels for controls;
- non-color-only status;
- readable type;
- keyboard navigation;
- reduced motion;
- understandable error messaging.

Accessibility is part of correctness, not polish.

---

# 50. Component Inventory

The initial shared component library should include:

### Foundations

- typography;
- color tokens;
- spacing;
- radius;
- elevation/surface;
- icon wrapper;
- motion tokens.

### Actions

- button;
- icon button;
- split button where justified;
- link;
- menu item.

### Inputs

- text input;
- search input;
- number input;
- currency input;
- select;
- combobox;
- date input;
- textarea;
- checkbox;
- radio;
- segmented control.

### Data

- table;
- list;
- stat;
- detail row;
- data cell;
- pagination;
- filter;
- sort control.

### Feedback

- status;
- badge;
- alert;
- toast;
- inline validation;
- loading;
- empty;
- error.

### Workflow

- confirmation;
- authorization request;
- approval panel;
- correction panel;
- review panel;
- timeline;
- conflict panel.

### Navigation

- navigation item;
- breadcrumbs;
- tabs;
- page header;
- contextual action bar.

---

# 51. Component State Requirement

Every interactive component must define applicable:

```text
Default
Hover
Focus
Active
Disabled
Loading
Error
Empty
Selected
```

Domain components additionally need applicable:

```text
Awaiting authorization
Rejected
Offline
Sync pending
Conflict
Correction
Integrity blocked
```

Not every component needs every state.

But no state should be omitted merely because it is inconvenient to design.

---

# 52. Component Anatomy Standard

Every reusable component specification should define:

```text
Purpose
When to use
When not to use
Anatomy
Variants
States
Content rules
Accessibility
Responsive behavior
Interaction
Examples
Anti-patterns
```

This becomes the handoff contract for implementation.

---

# 53. Content Rules

Sabi Shop interface copy should be:

- direct;
- specific;
- calm;
- professional;
- human;
- operational.

Avoid:

- fake metrics;
- fake testimonials;
- placeholder names in shipped UI;
- generic AI phrases;
- vague system language;
- unnecessary jargon.

The external design skill's realism requirement is adopted, while business terminology remains controlled by Sabi Shop's domain specifications. C00 explicitly places business terminology above external design guidance.

---

# 54. Microcopy Rules

Prefer:

> Payment not confirmed

over:

> Payment error

Prefer:

> Manager approval required

over:

> Unauthorized

Prefer:

> Sale recorded · Sync pending

over:

> Offline transaction created

Prefer:

> Stock conflict detected

over:

> Inventory error

Microcopy should explain business meaning before technical mechanism.

---

# 55. Data Visualization

Management visuals should be:

- explainable;
- connected to source records;
- appropriately scaled;
- free of decorative chart effects.

Charts should never become the only representation of a critical business figure.

A chart should lead to:

```text
Metric
 ↓
Relevant records
 ↓
Underlying events
```

This follows C01's rule that important numbers must have a path back to records that explain them. fileciteturn28file8L1099-L1117

---

# 56. Financial Display

Financial information requires unusually high clarity.

Distinguish visually between:

- Cash in Hand;
- Customer Debt;
- Supplier Liability;
- Revenue;
- Cost;
- Profit;
- Incentive;
- Owner withdrawal;
- Expense.

Do not collapse them into a generic "Balance."

---

# 57. POS Visual Rules

The POS must be the fastest part of the application.

Prioritize:

```text
Product search
 ↓
Selected items
 ↓
Quantity
 ↓
Actual price
 ↓
Total
 ↓
Payment
 ↓
Completion
```

Management information should not visually compete with the sale.

Exception controls should appear only when relevant.

---

# 58. Management Visual Rules

Management screens may be denser.

Prioritize:

- exceptions;
- business health;
- cash;
- inventory;
- credit;
- supplier liabilities;
- performance;
- unresolved work.

Management pages should support drill-down.

---

# 59. Record Detail Pattern

Important records should follow a consistent structure:

```text
Header
 ├── Identity
 ├── Current state
 └── Primary actions

Summary
 └── Key business values

Relationships
 ├── Customer
 ├── Payment
 ├── Inventory
 └── Other relevant records

History
 └── Corrections / approvals / related events

Actions
 └── Contextual authorized operations
```

Not every record needs every section.

---

# 60. Destructive-Looking Interaction Anti-Pattern

Avoid labels such as:

- Delete Sale;
- Erase Transaction;
- Remove History.

Completed business records are not ordinary deletable objects.

Correction and exception language should reflect the business model.

---

# 61. Visual Hierarchy for Consequential Actions

For consequential actions:

```text
What is happening?
        ↓
Why?
        ↓
What changes?
        ↓
Who authorizes?
        ↓
Reason
        ↓
Final action
```

This is the visual equivalent of C02's Discover → Prepare → Authorize → Commit → Verify model.

---

# 62. Landing Page Relationship

The landing page may use:

- stronger display typography;
- larger composition;
- visual storytelling;
- proof;
- benefits;
- CTA hierarchy.

The application should share:

- type family;
- core brand color language;
- icon family;
- radius philosophy;
- spacing philosophy;
- tone.

The application should not inherit marketing-page density or animation.

---

# 63. Figma Structure

The eventual Figma source of truth should be organized approximately as:

```text
00 — Foundations
01 — Components
02 — Patterns
03 — Application
04 — Marketing
05 — States
06 — Prototypes
07 — Archive
```

Application pages should map to C01.

States should cover:

```text
Loading
Empty
Error
Offline
Sync Pending
Conflict
Authorization
Correction
Rejected
Integrity
```

C00 already establishes Figma as a planned visual source of truth rather than a replacement for requirements. fileciteturn28file5L655-L659

---

# 64. Design Token Governance

No screen should invent its own:

- font;
- primary color;
- spacing scale;
- radius;
- button treatment;
- status color;
- icon family.

If a new value is necessary:

1. identify why;
2. determine whether an existing token can work;
3. add a system token if genuinely reusable;
4. document it;
5. update the design system;
6. propagate to implementation.

---

# 65. External Skill Reconciliation

The `landing-page-design` skill contributes:

- controlled typography;
- spacing;
- radius;
- icon discipline;
- motion;
- complete interaction states;
- realistic content;
- strong composition.

The `redesign-existing-projects` skill contributes:

- diagnosis before fixing;
- targeted changes;
- audit of typography, color, layout, interaction, content, components, accessibility, and missing states;
- protection of existing functionality.

C00 explicitly establishes this relationship: creation methodology plus implementation audit, not two competing authorities. fileciteturn28file0L68-L106 fileciteturn28file0L110-L131

---

# 66. Design Audit Checklist

Before a component or screen is accepted:

### Visual

- correct type;
- correct token usage;
- hierarchy is obvious;
- spacing is consistent;
- surfaces are intentional;
- no decorative clutter.

### Interaction

- hover;
- active;
- focus;
- disabled;
- loading;
- error;
- empty where applicable.

### Business state

- authorization;
- correction;
- offline;
- sync;
- conflict;
- rejection;
- integrity.

### Content

- realistic;
- specific;
- concise;
- no fake data;
- no unexplained technical language.

### Accessibility

- keyboard;
- focus;
- contrast;
- semantics;
- non-color-only status;
- reduced motion.

---

# 67. Anti-Patterns

Sabi Shop should explicitly reject:

## 67.1 Template dashboard styling

Do not assemble the product from generic metric cards.

## 67.2 Excessive glass / blur

Operational data needs clarity, not visual spectacle.

## 67.3 Gradient-heavy application UI

Gradients may be appropriate for controlled marketing emphasis, but should not become the application background language.

## 67.4 Giant typography in POS

Large display typography wastes operational space.

## 67.5 Tiny dense controls

Density is not an excuse for poor usability.

## 67.6 Badge overload

Not everything needs a status pill.

## 67.7 Icon soup

Do not decorate every action with an icon.

## 67.8 Modal overload

Do not turn every action into a modal.

## 67.9 Generic error language

Explain the business meaning.

## 67.10 Hidden consequential effects

Never make material corrections look like harmless edits.

---

# 68. Design Decisions

### C03-DEC-01
Sabi Shop uses one coherent design system across marketing and application contexts, with different context-specific behavior.

### C03-DEC-02
Geist is the primary application typeface candidate and should be validated as the default system font.

### C03-DEC-03
Geist Mono is reserved for structured technical/identifier content.

### C03-DEC-04
Semantic color roles are established before final hex values.

### C03-DEC-05
The application uses restrained surfaces and avoids excessive card nesting.

### C03-DEC-06
The controlled spacing scale begins with 0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96.

### C03-DEC-07
Components must define their applicable interaction and exceptional states.

### C03-DEC-08
Correction, authorization, offline, conflict, and integrity states are first-class design-system concerns.

### C03-DEC-09
Important financial numbers use explicit business terminology rather than generic balances.

### C03-DEC-10
The POS receives the highest speed and clarity priority.

### C03-DEC-11
Design tokens are centralized and screen-level invention is prohibited.

### C03-DEC-12
The redesign methodology is an audit loop, not a competing design authority.

---

# 69. Remaining Open Decisions

C03 intentionally does not silently finalize:

- exact brand color hex values;
- light/dark theme support;
- final typeface selection after visual validation;
- exact final spacing tokens;
- exact final radius tokens;
- final icon family;
- final motion curve;
- exact responsive breakpoints;
- final navigation shell;
- final Figma tooling workflow.

These require visual validation and/or C04.

---

# 70. Reconciliation With C00

C00 established that:

- external design values are candidates;
- business rules outrank visual rules;
- state completeness is mandatory;
- Figma is a planned visual source of truth;
- redesign methodology is an audit loop.

C03 converts those principles into reusable design-system rules.

---

# 71. Reconciliation With C01

C01 establishes the logical application areas and explicitly says C03 must provide visual patterns for that information hierarchy. fileciteturn28file7L911-L925

C03 therefore does not introduce new business navigation.

It provides the visual language with which C04 and later domain UX will express C01.

---

# 72. Reconciliation With C02

C02 establishes:

```text
Discover
 ↓
Prepare
 ↓
Authorize
 ↓
Commit
 ↓
Verify
```

C03 turns those workflow stages into visual patterns.

For example:

- Discover → search;
- Prepare → form/selection;
- Authorize → approval surface;
- Commit → primary action;
- Verify → resulting accepted state.

C02 also establishes that material actions should expose consequences before commitment and that correction must differ from deletion. C03 provides the visual mechanisms for those principles.

---

# 73. Reconciliation With B09

B09 establishes role-aware authorization and least-privilege behavior.

C03 therefore treats:

- permission;
- authorization;
- approval;
- denied action;

as meaningful UX states rather than generic disabled buttons.

A user should understand when an action is unavailable because of authority rather than technical failure.

---

# 74. Reconciliation With B08

B08 establishes that material corrections require stronger controls and that every correction requires a reason.

C03 therefore requires correction components to make:

- original state;
- proposed state;
- consequences;
- reason;
- authorization;

understandable before commitment.

---

# 75. Reconciliation With C01's Single Source of Truth Principle

C01 says screens may present information differently but should point to the same underlying business truth. fileciteturn28file8L1105-L1117

C03 therefore defines presentation components, not duplicate data models.

A visual component never becomes a second source of truth.

---

# 76. Acceptance Criteria

C03 is successful when:

- typography is systematized;
- color roles are systematized;
- spacing is systematized;
- radius is systematized;
- surfaces are systematized;
- buttons are systematized;
- inputs are systematized;
- tables are systematized;
- status presentation is systematized;
- icons are systematized;
- motion is systematized;
- responsive principles are defined;
- exceptional states have visual patterns;
- authorization has a visual pattern;
- correction has a visual pattern;
- audit history has a visual pattern;
- offline/conflict states have visual patterns;
- accessibility requirements are explicit;
- POS density rules are explicit;
- management density rules are explicit;
- marketing/application relationship is explicit;
- token governance is explicit;
- implementation agents have a reusable component contract;
- unresolved visual decisions remain explicitly listed.

---

# 77. Next Deliverables

## C04 — Application Shell & Navigation

Convert C01's logical architecture into the persistent responsive application shell.

C04 should resolve:

- sidebar / top / bottom / hybrid navigation;
- desktop/tablet/mobile behavior;
- role-aware navigation;
- global search placement;
- persistent business-day/system state;
- contextual navigation;
- shell-level action hierarchy.

## C05 — Landing Page UX

Define the public-facing Sabi Shop experience.

## C06 — POS UX

Deeply specify the highest-speed operational workflow.

## C07 — Inventory & Purchasing UX

Deeply specify products, inventory, receiving, suppliers, and stock investigation.

## C08 — Customer & Credit UX

Deeply specify customer identity, credit, debt, repayments, and disputes.

## C09 — Returns, Corrections & Reconciliation UX

Deeply specify consequential management workflows.

## C10 — Offline, Conflict & Exceptional States

Deeply specify cross-cutting system states.

## C11 — UX Validation & Redesign Audit

Apply the redesign methodology to representative implementations and verify fidelity to the approved UX system.

---

# 78. Summary

C03 establishes Sabi Shop's reusable visual language.

The central principle is:

> **Visual simplicity for routine work. Visual seriousness for consequential work.**

The design system should make ordinary operations feel fast without making important actions feel casual.

It should make management information dense without becoming chaotic.

It should make exceptions obvious without becoming alarmist.

It should make history understandable without turning the interface into a raw audit log.

And most importantly:

> **The design system exists to express Sabi Shop's business truth clearly, not to decorate it.**
