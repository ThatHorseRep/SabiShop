# C00 — UX & Design Foundation

**Product:** Sabi Shop  
**Document ID:** C00  
**Package:** C — User Experience Specification  
**Status:** Working Foundation  
**Version:** 1.0  
**Prepared:** 2026-09-04

---

## 1. Purpose

C00 establishes the UX and design foundation for Sabi Shop before individual screens, flows, components, or visual mockups are produced.

It reconciles:

1. Sabi Shop's existing product and business specifications;
2. the `landing-page-design` skill from `ThatHorseRep/ai-design-skills`;
3. the `redesign-existing-projects` skill from `ThatHorseRep/redesign-skill`.

The two external skills are treated as **design methodology and quality guidance**, not as business authority.

Sabi Shop's product, business, permission, financial, inventory, correction, lifecycle, audit, and integrity rules remain authoritative.

The goal is to create a UX system that is:

- fast for ordinary shop work;
- deliberate for consequential actions;
- visually distinctive without becoming decorative;
- complete across normal, exceptional, offline, and error states;
- consistent enough to support a shared component/design system;
- suitable for eventual Figma/design artifacts and implementation by an AI coding agent.

---

# 2. Source Hierarchy

When sources disagree, use this order:

1. **Explicit Sabi Shop product decisions and locked business rules**
2. **Authoritative Sabi Shop domain specifications**
3. **C00 and later Sabi Shop UX specifications**
4. **Sabi Shop design tokens and component decisions**
5. **External design skills**
6. **Framework defaults**
7. **Agent preference**

The external skills must never override a Sabi Shop business rule.

### Example

If a design pattern makes a correction look like an ordinary edit but B08 requires management authorization and preserved history, the business rule wins.

The UX must communicate the business rule clearly rather than simplifying it away.

---

# 3. External Skill Reconciliation

## 3.1 `landing-page-design`

The landing-page skill provides a structured system for designing from scratch.

Relevant principles adopted for Sabi Shop include:

- deliberate intake before visual decisions;
- clear information hierarchy;
- benefit-oriented communication;
- deliberate layout selection;
- section-by-section iteration;
- controlled typography;
- controlled spacing;
- controlled corner radii;
- consistent iconography;
- deliberate motion;
- realistic content rather than filler;
- complete interaction states;
- accessibility and shipping completeness.

The skill explicitly treats its visual values as a controlled system and provides a defined type scale, spacing scale, radius rules, icon families, and motion rules.

### Sabi Shop interpretation

These principles are useful, but their concrete values are **not automatically Sabi Shop values**.

They become candidate inputs to the Sabi Shop design system and must be evaluated against:

- POS speed;
- data density;
- readability;
- mobile and desktop workflows;
- offline use;
- management dashboards;
- financial/inventory information;
- accessibility;
- operational context.

---

## 3.2 `redesign-existing-projects`

The redesign skill is primarily diagnostic.

Its process is:

1. Scan the existing project.
2. Diagnose generic patterns, weak points, and missing states.
3. Report the diagnosis.
4. Apply targeted fixes without unnecessarily rewriting the existing project.

It emphasizes:

- typography quality;
- controlled color and surfaces;
- deliberate layout;
- interaction states;
- loading, empty, and error states;
- realistic content;
- component quality;
- accessibility;
- code quality;
- focused, reviewable improvements.

It also states that its **Design Values** section is its single source of truth and that concrete values should not be invented outside that section.

### Sabi Shop interpretation

This becomes the **continuous UX/design audit layer** for Sabi Shop.

It should be used to detect:

- generic AI-looking interfaces;
- inconsistent components;
- missing states;
- poor spacing;
- weak hierarchy;
- unnecessary visual noise;
- weak interaction feedback;
- incomplete workflows;
- implementation drift from the approved Sabi Shop design system.

It must not be used to change business behavior.

---

# 4. Combined Design Model

The two skills are complementary.

### Skill 1 — Create

`landing-page-design` supplies the strongest foundation for:

- brand expression;
- initial visual direction;
- landing-page structure;
- conversion-oriented public pages;
- initial design language;
- visual system construction.

### Skill 2 — Audit and Improve

`redesign-existing-projects` supplies the strongest foundation for:

- auditing implemented UI;
- finding generic patterns;
- checking state completeness;
- identifying visual inconsistencies;
- improving existing screens without unnecessary rewrites.

### Sabi Shop layer

C00 sits between them and the implementation.

```text
Sabi Shop Product Truth
        ↓
C00 UX Foundation
        ↓
Sabi Shop Design System
        ↓
Figma / visual artifacts
        ↓
Implementation
        ↓
Redesign Audit
        ↓
Approved implementation
```

The audit feeds improvements back into the Sabi Shop design system only when the improvement is accepted as a Sabi Shop design decision.

---

# 5. Core UX Principle

## Fast for ordinary work. Deliberate for consequential work.

Sabi Shop should minimize friction for routine actions while increasing clarity and deliberate confirmation for actions that materially affect the business.

### Routine examples

- searching for a product;
- adding an item to a sale;
- changing a quantity before completion;
- recording a successful payment;
- viewing current stock;
- looking up a customer.

These should be fast and predictable.

### Consequential examples

- changing a completed transaction;
- correcting payment amount;
- changing customer identity;
- changing SKU/product attribution;
- changing salesperson attribution;
- changing inventory effects;
- changing credit/debt;
- approving a return;
- recording a management correction;
- resolving reconciliation discrepancies;
- resolving offline conflicts;
- handling suspected integrity problems.

These should be explicit, understandable, and appropriately authorized.

This principle is a UX interpretation of the business rules, not a replacement for them.

---

# 6. UX Truth Must Preserve Business Truth

The interface must never create the impression that a historical event disappeared when it did not.

The UX must therefore communicate:

- original transaction identity;
- current accepted state;
- corrections;
- returns;
- approvals;
- relevant authorization;
- conflicts;
- exceptions;
- current operational status.

Completed transactions are never presented as deletable objects.

A correction interface must not resemble destructive deletion.

A returned sale may show a derived status such as:

> Completed — Fully Returned

while retaining the original sale.

A partially returned sale may show:

> Completed — Partially Returned

while retaining the original sale and linked return.

These are presentation states, not replacements for the underlying business history.

---

# 7. UX Authority by Domain

| UX area | Authoritative source |
|---|---|
| Product vision | A01 / Product Foundation |
| Business model | B01 |
| Domain terminology | D02 |
| Sales completion | D03 |
| Pricing and discounts | D04 |
| Incentives | D05 |
| Supplier/purchasing | B02 |
| Credit/debt | B03 |
| Returns/refunds | B04 |
| Cash/reconciliation | B05 |
| Inventory accounting | B06 |
| Transaction lifecycle | B07 |
| Corrections/exceptions | B08 |
| Roles/permissions | B09 |
| Audit event implementation | D10 |
| Integrity/hash implementation | D11 |
| Offline/sync implementation | D07/D08 |
| UX structure and behavior | Package C |
| Visual system | C00 + later C deliverables |

---

# 8. Design System Strategy

Sabi Shop should have **one coherent visual system** across the public landing experience and the authenticated application.

The landing page may express the brand more dramatically.

The operational application should express the same brand with greater restraint.

### Shared

- typography family;
- core brand colors;
- icon family;
- spacing principles;
- radius language;
- interaction language;
- motion philosophy;
- visual hierarchy;
- content voice.

### Different by context

| Landing page | Business application |
|---|---|
| Large expressive typography | Dense readable hierarchy |
| Strong hero composition | Task-oriented screens |
| More visual storytelling | More information visibility |
| Conversion CTA | Operational actions |
| Marketing proof | Business evidence |
| Scroll choreography | Immediate task feedback |
| Decorative imagery where useful | Decoration only when it does not interfere |

The application must not become a marketing page.

---

# 9. Landing Page Rules

The landing-page skill establishes a useful baseline:

- one primary conversion objective;
- one primary CTA;
- clear audience and offer;
- outcome-focused headline;
- specific supporting copy;
- proof close to claims;
- benefits rather than feature dumping;
- deliberate page structure;
- FAQ/objection handling where appropriate;
- final CTA matching the primary CTA.

The landing page should use the skill's strategy as a starting point, but the actual Sabi Shop messaging must come from Sabi Shop's product positioning and approved content.

No placeholder copy, invented customer claims, fake testimonials, or unsupported performance numbers may be presented as factual.

---

# 10. Application UX Rules

The application is not subject to the landing page's conversion structure.

Its primary objective is **successful business operation**.

Application design should prioritize:

1. task completion;
2. correctness;
3. visibility of important information;
4. predictable navigation;
5. clear authorization;
6. auditability;
7. recovery from mistakes;
8. offline continuity;
9. performance;
10. visual quality.

A visually impressive interaction that slows down ordinary sales is a UX failure.

---

# 11. State Completeness

Every meaningful interactive workflow must account for applicable states.

At minimum, designers must evaluate:

- default;
- hover where applicable;
- active/pressed;
- focus;
- disabled;
- loading;
- empty;
- success;
- error;
- permission denied;
- authorization required;
- offline;
- sync pending;
- sync conflict;
- correction required;
- rejected;
- completed;
- cancelled where applicable.

Not every control requires every state visually, but no consequential workflow may be designed only for the happy path.

The external skills' requirement for hover, active, focus, loading, empty, and error states is therefore adopted as a baseline, expanded for Sabi Shop's operational environment.

---

# 12. Offline UX

Offline is a normal operating condition, not an exceptional error.

The UX must distinguish:

- available offline;
- locally recorded;
- pending synchronization;
- synchronized;
- synchronization conflict;
- action requiring management review after synchronization.

The interface must never imply successful remote synchronization when synchronization has not occurred.

Offline behavior must follow D07/D08 once those specifications define the implementation mechanics.

---

# 13. Conflict UX

Offline conflicts must never silently overwrite one side.

Where a conflict occurs:

1. preserve the underlying records;
2. identify that a conflict exists;
3. explain what requires attention;
4. prevent an ambiguous automatic overwrite;
5. route the conflict to an authorized resolver;
6. preserve the resolution history.

This follows B08's correction/conflict principle and the project's broader audit philosophy.

---

# 14. Permission UX

Permissions should be **mostly invisible during normal work**.

Staff should normally see:

- products they can sell;
- current selling prices;
- relevant stock information;
- their sales;
- permitted payment workflows;
- approval prompts when required;
- understandable explanations when management action is required.

Staff should not normally be exposed to unrestricted:

- acquisition cost;
- gross margin;
- sensitive management reports;
- supplier liabilities;
- management configuration;
- unrestricted correction controls.

Managers need operational visibility across sales, inventory, suppliers, customer debt, repayments, returns, cash reconciliation, staff activity, corrections, discrepancies, relevant audit history, and incentives.

The Owner has full business visibility and escalated authority.

These visibility rules come from B09 and must remain consistent with domain specifications.

---

# 15. Correction UX

Correction UX is one of Sabi Shop's most important design areas.

The system should visually distinguish:

- ordinary edit;
- controlled correction;
- adjustment;
- void;
- return;
- refund/settlement;
- duplicate handling;
- merge;
- rejected correction;
- conflict;
- integrity escalation.

The user must understand:

- what is being changed;
- why it can be changed;
- whether approval is required;
- what will happen to downstream business effects;
- who is authorizing it;
- what remains in history.

### Protected information

Customer identity, SKU/product identity, salesperson attribution, payment information, inventory effects, debt, and other high-integrity fields require stronger interaction patterns than ordinary cosmetic data entry.

The UX must not imply that changing these fields is equivalent to correcting a spelling mistake.

---

# 16. Auditability as a UX Requirement

Auditability is not only a backend requirement.

The interface must make important historical relationships understandable.

Where relevant, users should be able to see:

- original value;
- corrected value;
- actor;
- timestamp;
- reason;
- authorization status;
- resulting state;
- related transaction/event.

Customer-facing views should show that a correction occurred without exposing internal audit details unnecessarily.

The design must never provide a visual affordance that suggests an authorized user can erase evidence.

---

# 17. Data Density

Sabi Shop is an operational system.

Data-heavy screens may intentionally be denser than the marketing site.

Density must remain:

- readable;
- scannable;
- keyboard/mouse friendly;
- touch usable where applicable;
- visually grouped;
- consistent.

The redesign skill's advice against excessive whitespace on dense dashboards is relevant here, but it must be balanced against actual task requirements.

The goal is **efficient density**, not cramped density.

---

# 18. Typography

The external skills recommend a controlled type system and reject arbitrary font sizes.

Sabi Shop should adopt the principle of:

> **No ad hoc typography.**

A final Sabi Shop typeface and scale must be established in the design-system deliverable.

Until then:

- do not invent a final brand font;
- do not mix typefaces casually;
- do not use ultra-bold display weights by default;
- use a consistent type scale;
- use tabular numerals for data-heavy numeric views where useful;
- maintain readable body text;
- avoid orphaned headings;
- use sentence case unless there is a deliberate reason otherwise.

The exact font and token values remain a C03-level design decision.

---

# 19. Spacing

The external skills' strongest transferable principle is a **closed spacing vocabulary**.

Sabi Shop should use a controlled spacing token system rather than arbitrary per-screen values.

The final token set will be established in the design-system specification.

Until then:

- do not introduce arbitrary spacing values;
- reuse established tokens;
- maintain consistent vertical rhythm;
- use denser spacing for transactional/data-heavy areas where justified;
- use larger spacing for hierarchy and separation.

---

# 20. Radius and Surfaces

The external skills provide a nested-radius formula and insist on consistent radius values.

Sabi Shop should adopt the broader principle:

> **Corner radii are a system, not decoration.**

Nested components should use mathematically and optically coherent radii.

The final radius tokens remain a C03 decision.

Backgrounds, borders, shadows, and elevation must also be treated as a coherent surface system rather than individually styled components.

---

# 21. Color

Sabi Shop should not inherit the external skills' dark palette blindly.

The landing-page and redesign skills use a strongly opinionated neutral/dark visual system, including a restricted dark palette, a single accent, and limited gradient use.

Those principles are candidates, not final Sabi Shop decisions.

The Sabi Shop color system must ultimately support:

- brand recognition;
- high readability;
- business data;
- positive/negative states;
- warnings;
- authorization;
- errors;
- offline/conflict states;
- accessibility;
- light/dark environment decisions if supported.

Semantic colors must never rely on color alone.

---

# 22. Motion

Motion should communicate state and hierarchy rather than exist merely to impress.

The external skills strongly prefer:

- custom easing;
- transform/opacity based animation;
- IntersectionObserver for scroll reveals;
- physical feedback for interaction;
- deliberate staggered motion.

Sabi Shop should adopt these principles selectively.

### Marketing

More expressive motion is acceptable.

### Application

Motion must be:

- short enough not to slow work;
- predictable;
- interruptible where appropriate;
- disabled/reduced when accessibility settings require it;
- avoided on critical transactional confirmation where it could delay action.

A beautiful transition that makes a salesperson wait is a defect.

---

# 23. Components

Sabi Shop should develop reusable components rather than screen-specific visual inventions.

Likely component families include:

- buttons;
- inputs;
- search;
- product selectors;
- tables;
- data rows;
- badges/status indicators;
- alerts;
- confirmation surfaces;
- drawers;
- dialogs;
- approval prompts;
- receipts;
- transaction summaries;
- timeline/history views;
- correction summaries;
- conflict resolution surfaces;
- empty states;
- loading skeletons;
- error states;
- navigation;
- command/search surfaces.

The final component inventory belongs in the design-system deliverable.

---

# 24. Avoiding Generic AI UI

The redesign skill identifies several recurring generic patterns.

Sabi Shop should actively avoid:

- arbitrary card grids;
- excessive rounded cards;
- decorative gradients everywhere;
- purple/blue AI gradients;
- generic dashboard templates;
- unnecessary modals;
- arbitrary shadows;
- inconsistent icon families;
- filler copy;
- fake metrics;
- placeholder customer names;
- generic "AI" language;
- decorative animation that does not aid comprehension.

However, the solution is not to force novelty everywhere.

A familiar pattern is acceptable when it is the best pattern for the task.

The standard is:

> **Purposeful, coherent, and recognizably Sabi Shop.**

---

# 25. Landing Page and Application Synchronization

The public landing page and authenticated application must share a recognizable visual language.

A user should be able to move from:

```text
sabi shop website
        ↓
sign in
        ↓
application
```

without feeling that they entered an unrelated product.

The shared design system should therefore define:

- type;
- color;
- iconography;
- spacing;
- radius;
- surface language;
- button language;
- status language;
- motion principles.

The application can be more restrained and information dense.

---

# 26. Figma Strategy

A Figma artifact should be treated as a **design source of truth**, not as a substitute for the business specifications.

The intended structure is:

```text
Sabi Shop Figma
│
├── Foundations
│   ├── Typography
│   ├── Color
│   ├── Spacing
│   ├── Radius
│   ├── Elevation
│   ├── Icons
│   └── Motion
│
├── Components
│
├── Patterns
│
├── Landing
│
├── POS
│
├── Inventory
│
├── Customers
│
├── Suppliers
│
├── Returns
│
├── Corrections
│
├── Cash & Reconciliation
│
├── Management
│
└── States
    ├── Loading
    ├── Empty
    ├── Error
    ├── Offline
    ├── Sync conflict
    ├── Authorization
    └── Integrity
```

The Figma artifact should be created after the design foundations and representative workflows have been validated.

---

# 27. Representative Prototype Strategy

Before designing every screen, create a representative slice containing:

1. landing page hero;
2. application shell;
3. new sale;
4. payment;
5. completed sale;
6. correction flow;
7. inventory view;
8. customer credit view;
9. management approval;
10. offline/conflict state.

This slice should test whether the visual language works across both marketing and operational contexts.

If the system fails here, fix the system before producing dozens of screens.

---

# 28. Redesign Audit Loop

Every implemented major UI area should eventually pass through the redesign methodology.

### Audit sequence

```text
1. Scan
   ↓
2. Diagnose
   ↓
3. Report
   ↓
4. Review/approve
   ↓
5. Fix
   ↓
6. Test
   ↓
7. Re-audit
```

The agent must report the diagnosis before making substantial redesign changes.

The redesign audit must not:

- migrate frameworks merely for aesthetics;
- change business rules;
- remove audit behavior;
- bypass permissions;
- rewrite transaction history;
- change financial logic;
- silently alter UX requirements.

---

# 29. AI Coding Agent Handoff

The eventual coding agent should receive four distinct inputs:

### Product authority

Sabi Shop business/product specifications.

### UX authority

Package C specifications, including the approved design system.

### Design methodology

The two external skills.

### Implementation authority

The technical package and repository conventions.

The agent's hierarchy should be:

```text
Business/Product rules
        >
UX requirements
        >
Approved Sabi Shop design system
        >
External design skills
        >
Framework defaults
```

The external skills should be installed or supplied to the agent as supporting methodology, not merged blindly into Sabi Shop requirements.

---

# 30. What the Agent Must Not Do

The coding/design agent must not:

- invent business rules;
- reinterpret permissions;
- remove approval steps because they feel inconvenient;
- turn corrections into deletions;
- hide historical states;
- silently overwrite conflicting offline data;
- create negative stock as a normal UI outcome;
- expose management-only information to staff;
- invent unsupported metrics;
- invent customer claims;
- introduce arbitrary design tokens;
- redesign unrelated functionality merely because it prefers another pattern;
- migrate the technical stack solely for visual reasons.

---

# 31. Design Decision Governance

Any new design decision that affects multiple screens should be recorded centrally.

Examples:

- new typography;
- new spacing token;
- new button hierarchy;
- new status color;
- new navigation model;
- new confirmation pattern;
- new table pattern;
- new approval pattern.

A decision should not exist only inside one screen.

If a design pattern becomes a system rule, it belongs in the design-system deliverable.

---

# 32. Relationship to Existing Deliverables

C00 does not replace B01–B09.

It translates their consequences into UX principles.

Examples:

### B03 — Credit

Because credit requires management authorization, the UX must make authorization explicit.

### B04 — Returns

Because returns are linked events and do not delete the original sale, the UI must preserve that relationship.

### B05 — Cash

Because discrepancies remain visible until resolved, the UI must not hide unresolved reconciliation issues.

### B06 — Inventory

Because physical count discrepancies require investigation before correction, the UX must distinguish investigation from final correction.

### B07 — Lifecycle

Because completed transactions cannot be deleted, the interface must not expose destructive deletion as a normal operation.

### B08 — Corrections

Because material corrections require stronger controls and history preservation, correction UX must differ from ordinary editing.

### B09 — Permissions

Because staff, managers, and owners have different authority and visibility, the interface must adapt to permissions without creating confusing dead ends.

---

# 33. Reconciliation Notes

This section exists so future contexts can distinguish newly established UX decisions from older unresolved requirements.

## 33.1 External skill relationship resolved

The two external skills are **not competing systems**.

- `landing-page-design` is the primary creation/visual-direction methodology.
- `redesign-existing-projects` is the audit/improvement methodology.
- C00 is the Sabi Shop-specific integration layer.

## 33.2 External design values are not automatically adopted

The fonts, colors, spacing, radius, and motion values in the external skills are treated as candidate values.

They are not authoritative Sabi Shop tokens.

## 33.3 Audit philosophy adopted

The redesign skill's scan → diagnose → report → fix approach is adopted for future UI quality review.

## 33.4 State completeness adopted and expanded

The external skills' hover/active/focus/loading/empty/error requirement is adopted and expanded for Sabi Shop with authorization, offline, sync conflict, correction, rejection, and integrity states.

## 33.5 Business rules remain authoritative

Nothing in the design skills changes the decisions already made in B01–B09.

## 33.6 Figma is a planned design artifact

Figma is intended to become a visual source of truth for approved UX/design decisions.

It does not replace written requirements or technical specifications.

---

# 34. Open Design Decisions

These are intentionally not silently decided by C00.

### C00-OPEN-01 — Final brand typeface

Candidate options may be evaluated against the external skills, but the final Sabi Shop typeface remains open.

### C00-OPEN-02 — Final color system

The external dark palette is not automatically adopted.

### C00-OPEN-03 — Light/dark mode

Whether both themes are supported remains a product/UX decision.

### C00-OPEN-04 — Final spacing token set

The external closed spacing scale is a candidate baseline.

### C00-OPEN-05 — Final radius system

The nested-radius principle is adopted, but final Sabi Shop tokens remain open.

### C00-OPEN-06 — Navigation model

The redesign skill warns against assuming every dashboard needs a permanent left sidebar. Sabi Shop must evaluate navigation against real workflows before deciding.

### C00-OPEN-07 — Device priority

Desktop/tablet/mobile priorities must be established from actual operating conditions.

### C00-OPEN-08 — Figma tooling/workflow

The exact method for producing and maintaining the Figma artifact remains open.

---

# 35. Acceptance Criteria

C00 is successful when:

- the two external skills have a clearly defined relationship;
- Sabi Shop business rules outrank external design rules;
- landing-page design and application UX share one coherent design language;
- the application is not treated like a marketing page;
- routine work is optimized for speed;
- consequential actions are deliberately explicit;
- auditability is visible where appropriate;
- permission differences are reflected in UX;
- offline and conflict states are treated as first-class states;
- correction UX does not resemble deletion;
- state completeness is mandatory;
- Figma is defined as a planned visual source of truth;
- the design system is centralized rather than invented per screen;
- the redesign skill is used as an audit loop rather than a second independent design authority;
- unresolved visual decisions are explicitly listed rather than guessed.

---

# 36. Next Deliverables

C00 should be followed by:

### C01 — Information Architecture

Define the complete application structure, navigation, major areas, and relationships.

### C02 — User Journeys & Task Flows

Translate the business rules into real user journeys for Staff, Manager, and Owner.

### C03 — Sabi Shop Design System

Finalize:

- typography;
- colors;
- spacing;
- radius;
- surfaces;
- buttons;
- inputs;
- tables;
- status system;
- icons;
- motion;
- responsive rules.

### C04 — Application Shell & Navigation

Define the persistent application structure and navigation behavior.

### C05+ — Domain UX

Design individual operational areas from the approved foundation.

### Final UX Validation

Run representative implementations through the redesign audit methodology and verify that the implementation remains faithful to the written UX and business requirements.

---

# 37. Summary

Sabi Shop will use the two external design skills as complementary tools.

The first establishes a strong approach to creating a distinctive visual experience.

The second provides a disciplined mechanism for auditing and improving the resulting implementation.

Neither becomes the product authority.

The Sabi Shop UX system sits between the business requirements and those skills:

> **Business truth → UX truth → Sabi Shop design system → visual artifact → implementation → redesign audit**

The central UX standard is:

> **Fast for ordinary work. Deliberate for consequential work.**

The objective is not merely to make Sabi Shop look impressive.

The objective is to make it **feel trustworthy, fast, clear, distinctive, and exceptionally competent while preserving the business integrity we have already specified.**

---

# FINAL RECONCILIATION — BUSINESS DECISIONS APPLIED

This document must express the finalized business decisions: configurable 15-minute-default correction window; ordinary vs high-integrity corrections; Owner visibility for consequential Manager self-corrections; logged/reviewable transfer confirmation; core plus configurable payment methods; tax-aware totals; supplier-return settlement states; operational business-day sessions that may cross midnight; shared or individual cash custody; weighted-average costing; visible negative-stock exceptions; and Cash in Hand / Expected Cash / Actual Cash terminology.
