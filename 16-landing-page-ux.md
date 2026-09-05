# C05 — Landing Page UX

**Product:** Sabi Shop  
**Document ID:** C05  
**Package:** C — User Experience Specification  
**Status:** RECONCILED — DESIGN BASELINE — Landing Page UX  
**Version:** 1.0  
**Prepared:** 2026-09-04  
**Depends on:** C00 — UX & Design Foundation; C01 — Information Architecture; C03 — Sabi Shop Design System; B01 — Business Model  
**Authoritative for:** public landing-page information architecture, messaging hierarchy, conversion flow, trust presentation, public-page interaction behavior, and landing-page UX acceptance criteria  
**Does not replace:** B01 product/business rules, B09 permissions, C03 visual tokens, C04 application shell, or later implementation specifications

---

# 1. Purpose

C05 defines the public-facing landing experience for Sabi Shop.

The landing page has a different job from the authenticated application.

The application exists to help people operate a business.

The landing page exists to help the right small-business owner understand:

1. what Sabi Shop is;
2. why it matters;
3. what business problems it addresses;
4. how it works;
5. why it can be trusted;
6. what the next step is.

C00 establishes that the public landing experience and authenticated application should share one recognizable design language while behaving differently by context. fileciteturn30file8L1144-L1176

C05 therefore uses the external `landing-page-design` methodology selectively, while keeping Sabi Shop product truth authoritative.

---

# 2. Product Context

Sabi Shop is intended to be a lightweight but rigorous **POS and business operating system for small retail businesses**.

Its core purpose is to help a business reliably record and understand:

- daily sales;
- inventory;
- money received and spent;
- customer credit/debt;
- supplier purchases and liabilities;
- staff activity;
- business performance;
- operational exceptions and discrepancies. fileciteturn30file2L393-L410

The initial reference business is a small retail shop selling agricultural equipment, engine parts, accessories, belts, tools, and related goods, while the product itself must remain useful across broader small-retail categories. fileciteturn30file2L412-L432

---

# 3. Primary Audience

The primary landing-page audience is:

> **Small retail business owners and owner-managers who need better visibility and control over daily shop operations.**

Typical characteristics include:

- owner responsible for the business;
- one or more salespeople or shop staff;
- physical product sales;
- inventory that must be replenished;
- cash and other payment methods;
- periods when the owner is away from the shop;
- need to understand what happened during the day. fileciteturn30file7L1068-L1085

The landing page should speak primarily to the owner/decision-maker rather than attempting to separately market to every possible user role.

---

# 4. Primary Customer Problem

The landing page should frame the problem around **loss of visibility and control**, not around software features.

The owner needs to understand:

- what sold;
- what stock moved;
- what customers owe;
- what suppliers are owed;
- where money went;
- how staff performed;
- what needs attention;
- what decisions should be made next.

The core business value is therefore not simply:

> “Record your sales.”

It is:

> **Understand what is happening in your shop while it is happening.**

---

# 5. Core Value Proposition

B01 defines the primary value proposition as helping a small-business owner understand what is happening in the business so they can identify what needs attention and make better decisions about how and where to improve. fileciteturn30file7L1087-L1106

C05 translates that into the landing-page communication principle:

> **Sabi Shop helps you run the shop with a clearer view of sales, stock, money, customers, staff activity, and what needs attention.**

This is the working positioning statement.

Final marketing copy remains subject to product/content review.

---

# 6. Primary Conversion Objective

C05 adopts one primary landing-page conversion objective.

## Primary CTA

> **Get Started**

The CTA should lead into the approved acquisition/onboarding path when that path exists.

If onboarding is not yet implemented, the CTA may temporarily point to the approved next step rather than pretending a working registration flow exists.

Do not present a fake signup experience merely to complete the design.

---

# 7. Secondary Conversion Path

A secondary path may exist for users who are not ready to start.

Recommended:

> **See how it works**

This should move the visitor deeper into the page rather than competing with the primary CTA.

Secondary CTA styling must remain visually subordinate.

---

# 8. Landing Page Structure

Recommended page sequence:

```text
1. Header
2. Hero
3. Problem / recognition
4. Core outcomes
5. How Sabi Shop works
6. Product areas / operational visibility
7. Trust and control
8. Who it is for
9. FAQ / objections
10. Final CTA
11. Footer
```

The sequence follows the landing-page skill's information-hierarchy approach while adapting the content to Sabi Shop's actual positioning.

C00 explicitly recommends one primary conversion objective, one primary CTA, clear audience/offer, outcome-focused messaging, proof near claims, benefits rather than feature dumping, objection handling, and a final CTA matching the primary CTA. fileciteturn30file8L1180-L1197

---

# 9. Header

The public header should contain:

```text
Sabi Shop
[Product / How it works]   [About / FAQ if needed]
[Sign in]
[Get Started]
```

The exact navigation labels remain subject to content validation.

The header should not contain the application's authenticated navigation.

---

# 10. Hero

The hero must answer three questions immediately:

1. What is Sabi Shop?
2. Who is it for?
3. Why should the visitor care?

Recommended content hierarchy:

```text
Eyebrow
Outcome-focused headline
Short supporting explanation
Primary CTA
Secondary CTA
Product visual / contextual proof
```

The hero should not begin with a long feature list.

---

# 11. Hero Messaging Principle

The hero should sell **clarity and control**, not software complexity.

Strong conceptual direction:

> **Know what is happening in your shop.**

Supporting direction:

> Record sales, track stock, follow customer credit, reconcile money, and see what needs attention from one place.

This is a working content direction, not final copy approval.

---

# 12. Hero Visual

The hero visual should communicate the product through believable operational context.

Preferred:

- realistic Sabi Shop interface;
- sale workspace;
- stock visibility;
- business overview;
- relevant management information;
- connected operational views.

Avoid:

- generic abstract SaaS dashboard;
- fake analytics;
- floating random cards;
- decorative UI with no product meaning;
- invented metrics.

C00 explicitly prohibits fake metrics, filler content, generic dashboard templates, and decorative effects that do not aid comprehension. fileciteturn30file1L195-L221

---

# 13. Problem Recognition

After the hero, the page should demonstrate recognition of the visitor's real operating environment.

Possible themes:

```text
Sales happen all day.
Stock moves constantly.
Customers buy on credit.
Money comes in through different channels.
Staff may operate the shop when the owner is away.
At the end of the day, the owner still needs to know what happened.
```

The section should create recognition without fearmongering.

---

# 14. Problem-to-Outcome Transition

The page should transition from:

> “This is difficult.”

to:

> “This can be understood.”

The product should be positioned as an operating layer that turns daily activity into useful business visibility.

---

# 15. Core Outcomes

Use outcome-oriented sections rather than feature grids.

Recommended outcome pillars:

### Know your sales

Understand what was sold, when, at what price, and by whom.

### Know your stock

Understand what is available, what moved, what was received, and what needs attention.

### Know your money

Understand cash activity, other payment methods, reconciliation, expenses, and owner funding/withdrawals.

### Know customer credit

Understand credit sales, repayments, and outstanding obligations.

### Know what needs attention

Surface discrepancies, approvals, corrections, conflicts, and other management work.

These should only be stated to the extent supported by the actual product specification.

---

# 16. Feature Presentation Rule

Features should appear as evidence for an outcome.

Bad:

```text
Inventory Module
Debt Module
Cash Module
Audit Module
Reports Module
```

Better:

```text
Know what moved
→ inventory visibility

Know who owes
→ customer credit

Know where money went
→ cash and reconciliation

Know what changed
→ history and corrections
```

The visitor should understand the business benefit before the internal product terminology.

---

# 17. How It Works

Recommended three-step model:

```text
1. Record the work
2. Keep the business picture connected
3. See what needs attention
```

This is intentionally simpler than presenting the full internal transaction/event architecture.

The landing page should communicate the operating model without exposing unnecessary technical complexity.

---

# 18. How It Works — Step 1

## Record daily activity

Show examples such as:

- sales;
- payments;
- stock receipts;
- customer credit;
- repayments;
- business money activity.

The message should emphasize that the system records actual business activity rather than conversations or unconfirmed events.

---

# 19. How It Works — Step 2

## Keep the picture connected

Explain that relevant records remain connected:

```text
Sale
→ payment
→ customer
→ stock
→ return/correction where applicable
```

This supports the product's central promise of understanding the business rather than maintaining isolated spreadsheets.

---

# 20. How It Works — Step 3

## See what needs attention

Show management-oriented outcomes:

- discrepancies;
- outstanding customer debt;
- stock issues;
- approvals;
- corrections;
- reconciliation work.

Do not claim that Sabi Shop automatically makes business decisions for the owner.

The product surfaces information and supports controlled action.

---

# 21. Trust and Control Section

Trust is especially important because Sabi Shop records financially meaningful business activity.

The landing page should communicate that Sabi Shop is designed around:

- traceable activity;
- controlled corrections;
- preserved history;
- clear authorization;
- business visibility;
- operational accountability.

Do not claim absolute security, fraud prevention, or perfect accuracy unless those claims are technically and commercially substantiated.

---

# 22. Auditability Messaging

The landing page may communicate the philosophy:

> **Changes should be understandable, not invisible.**

This should remain simple.

Do not expose internal hash-chain terminology, event-sourcing terminology, or implementation architecture on the primary marketing page unless a later technical/product page specifically requires it.

The user should understand the benefit:

> Important business history does not simply disappear when something needs correcting.

---

# 23. Offline Capability

Offline support may be a meaningful differentiator for the target operating environment.

However, it must be described accurately.

Recommended conceptual message:

> **Keep working when connectivity is unreliable.**

Supporting explanation:

> Supported shop workflows can continue locally and synchronize when connectivity returns.

Do not imply:

- every feature works offline;
- synchronization is instantaneous;
- conflicts never happen;
- local data is automatically authoritative over server data.

C00 establishes offline as a first-class operational state rather than an error. fileciteturn30file9L1255-L1257

---

# 24. Product Areas Section

A visual product overview may introduce:

```text
Sales
Inventory
Customers & Credit
Suppliers & Purchasing
Money
Activity
Management
```

The section should show how these areas work together.

Avoid making the page feel like a list of eight software modules.

---

# 25. Audience Fit

The page should explicitly state who Sabi Shop is designed for.

Recommended direction:

> **Built for small shops where the owner needs to know what is happening.**

Supporting examples:

- retail shops;
- parts shops;
- equipment shops;
- hardware/tool shops;
- similar physical-goods businesses.

The initial agricultural-equipment/engine-parts reference context should inform examples without making Sabi Shop appear limited to that category. B01 explicitly requires broader applicability. fileciteturn30file7L1070-L1083

---

# 26. Staff and Owner Relationship

The landing page should communicate the owner benefit without presenting staff as untrusted by default.

Better framing:

> **Give staff a simple way to do the work while keeping the owner informed.**

Avoid marketing language that implies:

- staff are inherently dishonest;
- the product exists primarily to spy on workers;
- every discrepancy is evidence of theft.

The product supports accountability and visibility without making accusations.

---

# 27. Management Visibility

A strong differentiator is the owner's ability to understand the shop without personally performing every operation.

Conceptual message:

> **The shop can keep moving even when the owner is not standing at the counter.**

This should be presented as operational visibility, not surveillance.

---

# 28. Customer Credit

Customer credit is a meaningful business workflow.

The landing page may communicate:

> **Keep track of who owes the business and what has actually been paid.**

Avoid presenting customer credit as a generic CRM.

B01 explicitly distinguishes credit customer records from a general CRM. fileciteturn30file7L1006-L1012

---

# 29. Inventory

Inventory messaging should focus on understanding stock movement and availability.

Possible direction:

> **Know what you have, what came in, and what moved out.**

Do not promise automatic perfect stock accuracy.

The product records and reconciles physical business activity; discrepancies still require investigation and controlled correction.

---

# 30. Money

Money messaging should emphasize visibility and reconciliation.

Possible direction:

> **Understand where business money came from and where it went.**

Avoid collapsing all financial concepts into one generic balance.

The product distinguishes cash, other payment methods, business expenses, owner funding, withdrawals, customer debt, supplier liabilities, and performance.

---

# 31. Supplier and Purchasing

The landing page may communicate:

> **Keep purchases, supplier obligations, and received stock connected.**

Avoid claiming full procurement/enterprise purchasing functionality.

Sabi Shop's V1 purchasing model is deliberately lightweight.

---

# 32. Staff Activity

Performance visibility may be mentioned carefully.

Possible direction:

> **Understand activity without losing the context behind it.**

Do not market incentives as salary replacement.

Do not imply that the product automatically judges employees.

---

# 33. Returns and Corrections

The landing page can mention controlled correction and returns as trust features.

Possible direction:

> **Mistakes can be corrected without pretending they never happened.**

This is a particularly important Sabi Shop principle.

Avoid exposing complex correction mechanics in the marketing flow.

---

# 34. Proof

Proof should be evidence-backed.

Allowed proof may include:

- real product screenshots;
- real workflow demonstrations;
- actual customer stories once available;
- verified testimonials;
- real product capabilities;
- genuine implementation results.

Not allowed:

- invented testimonials;
- fake logos;
- fabricated statistics;
- invented customer counts;
- unsupported “trusted by” claims.

C00 explicitly requires realistic content and prohibits fake brands, fake metrics, and unsupported claims. fileciteturn30file1L195-L221

---

# 35. Early-Stage Proof Strategy

If Sabi Shop does not yet have public customer proof, do not manufacture it.

Instead use:

- real product demonstrations;
- transparent explanation of the workflow;
- product screenshots;
- actual operating scenarios;
- clear capability statements.

The page can still look credible without pretending the product has traction it does not yet have.

---

# 36. Objection Handling

The page should anticipate likely objections.

Initial objection categories:

### “Is this just a cash register?”

Answer direction:

> No. It connects sales with stock, customers, money, staff activity, and management visibility.

### “Will my staff be able to use it?”

Answer direction:

> The operational interface is designed for fast everyday shop work.

### “What if the internet goes off?”

Answer direction:

> Supported workflows can continue offline and synchronize later.

### “What happens when someone makes a mistake?”

Answer direction:

> Corrections are controlled and traceable rather than silently erasing history.

### “Can I use it for my type of shop?”

Answer direction:

> Sabi Shop is designed for small physical-goods retail businesses, not only one specific product category.

These are working answers and should be validated against final product scope.

---

# 37. FAQ

The FAQ should answer genuine purchase/understanding questions.

Recommended initial topics:

1. What is Sabi Shop?
2. Who is Sabi Shop for?
3. Does it work offline?
4. Can staff use it?
5. Can I track customer credit?
6. Can I track inventory?
7. Can I record different payment methods?
8. What happens when a sale needs correction?
9. Can Sabi Shop work for more than one business?
10. How do I get started?

The FAQ should not become a technical documentation dump.

---

# 38. Pricing

C05 does not establish pricing.

If pricing is not finalized, do not invent:

- subscription amounts;
- free tiers;
- usage limits;
- transaction fees;
- discounts.

Pricing should be inserted only when commercially approved.

The CTA may still operate without publishing pricing if that is the chosen acquisition strategy.

---

# 39. Security and Privacy Claims

The landing page should avoid absolute statements such as:

> “Your data is 100% secure.”

Prefer specific, substantiated statements once technical policy is finalized.

Possible future claims may cover:

- access control;
- business separation;
- audit history;
- offline behavior;
- data handling.

Technical security claims require D-series validation before publication.

---

# 40. Marketing Language Rules

Use:

- direct language;
- concrete business outcomes;
- short sentences;
- real examples;
- confident but credible claims;
- language understandable to small-business owners.

Avoid:

- enterprise jargon;
- excessive technical terminology;
- generic AI buzzwords;
- exaggerated promises;
- fake urgency;
- fear-based theft messaging;
- meaningless superlatives.

---

# 41. Nigerian Market Language

The initial product context is Nigerian.

The landing page may use Nigerian business language naturally where it improves comprehension.

Examples:

- shop;
- sales;
- stock;
- customer;
- supplier;
- transfer;
- cash;
- credit;
- repayment.

Do not force slang into the interface or marketing simply to appear local.

The tone should feel native and professional.

---

# 42. Currency and Examples

Where monetary examples are necessary for Nigerian positioning, use Nigerian naira formatting.

Do not use fake performance figures merely to make the design visually interesting.

Any example amount must be clearly understood as an illustrative example if it is not actual business data.

---

# 43. Visual Direction

The landing page may use stronger visual expression than the authenticated application.

Allowed:

- larger display typography;
- stronger composition;
- richer storytelling;
- controlled motion;
- prominent product imagery;
- larger whitespace.

Still required:

- clear hierarchy;
- accessibility;
- realistic content;
- coherent Sabi Shop visual system.

C00 explicitly distinguishes public marketing expression from the denser operational application. fileciteturn30file8L1144-L1176

---

# 44. Hero Motion

Motion may be used to establish product quality.

Good uses:

- subtle product reveal;
- controlled section entrance;
- meaningful UI state transition;
- visual emphasis on the core value proposition.

Bad uses:

- delayed CTA;
- excessive parallax;
- looping distractions;
- animation that obscures product information;
- animation that causes accessibility problems.

A landing page may be expressive; the application must remain restrained.

---

# 45. Imagery

Preferred imagery:

- real shop environments;
- real products where available;
- believable retail situations;
- authentic Sabi Shop product UI;
- carefully selected editorial/product photography.

Avoid generic stock imagery that looks disconnected from the product.

Avoid showing a sophisticated corporate office if the target user operates a physical retail shop.

---

# 46. Product Screenshots

Product screenshots should:

- show real or clearly labeled representative UI;
- use realistic data;
- avoid fake claims;
- demonstrate meaningful workflows;
- remain legible at their displayed size.

A screenshot should answer:

> “What would I actually use this for?”

rather than:

> “How many cards can the designer fit on one screen?”

---

# 47. Responsive Landing Experience

The landing page must support:

- desktop;
- tablet;
- mobile.

Mobile should not simply stack desktop sections without reconsidering hierarchy.

Priority on mobile:

1. value proposition;
2. primary CTA;
3. product understanding;
4. core outcomes;
5. trust;
6. objections;
7. final CTA.

---

# 48. Accessibility

The landing page must support:

- semantic HTML;
- keyboard navigation;
- visible focus;
- accessible CTA labels;
- meaningful image alt text;
- sufficient contrast;
- reduced motion;
- readable text sizes;
- logical heading hierarchy.

Accessibility is a release requirement, not a later polish step.

---

# 49. SEO / Discoverability

The page should have:

- meaningful page title;
- useful meta description;
- semantic headings;
- descriptive URLs;
- structured content where appropriate;
- meaningful image alt text;
- crawlable primary content.

SEO should support actual Sabi Shop positioning rather than keyword stuffing.

---

# 50. AEO / Answer-Oriented Content

Important product questions should have direct answers that can stand independently.

Examples:

> What is Sabi Shop?

> Who is Sabi Shop for?

> Does Sabi Shop work offline?

> Can Sabi Shop track customer credit?

This supports discoverability without turning the page into a question-and-answer directory.

---

# 51. Trust Footer

Footer should contain appropriate:

- product navigation;
- contact/support path;
- legal links;
- privacy;
- terms;
- sign-in;
- primary CTA where appropriate.

Do not invent legal pages that do not exist.

Placeholders should not be presented as finished links.

---

# 52. Application Transition

The public-to-application transition should feel continuous:

```text
Landing
  ↓
Get Started / Sign In
  ↓
Authentication / onboarding
  ↓
Sabi Shop application shell
```

The visual language should remain recognizable.

C00 explicitly requires that users should be able to move from the website into the application without feeling that they entered an unrelated product. fileciteturn30file1L225-L253

---

# 53. Landing vs Application

| Concern | Landing | Application |
|---|---|---|
| Primary goal | Understand and start | Operate business |
| Typography | Expressive | Dense/readable |
| Motion | More expressive | Restrained |
| Content | Benefits | Actions/evidence |
| Navigation | Marketing | Operational |
| CTA | Conversion | Task completion |
| Proof | Product/customer evidence | Business records |
| Errors | Conversion recovery | Operational recovery |
| Offline | Explain capability | Manage actual state |

---

# 54. Component Reuse

The landing page should reuse C03 primitives where appropriate:

- typography;
- buttons;
- iconography;
- color language;
- surfaces;
- radius;
- spacing;
- motion principles.

It should not reuse application-specific components merely for consistency.

For example:

- a POS payment panel does not belong on the landing page;
- a marketing feature section may use the same button system.

---

# 55. Landing Page State Model

Applicable states include:

```text
Default
Hover
Focus
Active
Loading
Error
Success
Reduced motion
Mobile
Desktop
```

For interactive acquisition/onboarding elements, also consider:

```text
Unavailable
Already signed in
Authentication failure
Network failure
```

The exact authenticated states belong to application UX.

---

# 56. CTA Behavior

Primary CTA must:

- be visually obvious;
- have an explicit label;
- respond immediately;
- provide feedback;
- never submit twice accidentally;
- handle network failure clearly;
- preserve the user's context where possible.

Do not make a CTA look clickable if the acquisition path is not implemented.

---

# 57. No Fake Product State

The landing page may use representative product screens, but it must not imply that a workflow exists if it has not been implemented.

For example, a visual showing:

> “AI detected ₦4.2M leakage”

would be unacceptable unless the product actually supports that capability and the claim is substantiated.

The marketing layer must not invent product behavior.

---

# 58. Content Governance

Landing-page copy should have an owner.

Recommended hierarchy:

```text
Product/business truth
        ↓
Approved positioning
        ↓
Approved marketing copy
        ↓
Visual presentation
```

Designers and coding agents must not invent business claims to fill empty sections.

---

# 59. Redesign Audit Application

Once implemented, the landing page should be audited using the `redesign-existing-projects` methodology.

Audit for:

- generic SaaS appearance;
- weak typography;
- poor hierarchy;
- inconsistent spacing;
- excessive cards;
- decorative gradients;
- weak CTA hierarchy;
- missing interaction states;
- poor mobile behavior;
- inaccessible controls;
- filler copy;
- unsupported claims.

The redesign methodology is an audit layer, not a second product authority. C00 explicitly defines this relationship. fileciteturn30file4L649-L691

---

# 60. Landing Page Anti-Patterns

Avoid:

## 60.1 Feature dumping

Do not list every module before explaining why the product matters.

## 60.2 Generic SaaS hero

Avoid:

> “The future of intelligent business management.”

It says nothing concrete.

## 60.3 Fake dashboards

Do not fabricate impressive-looking business numbers.

## 60.4 Fake testimonials

Never invent customer quotes.

## 60.5 Fake social proof

No fabricated logos, user counts, ratings, or “trusted by” claims.

## 60.6 Fear-based theft marketing

Do not imply that every employee is stealing.

## 60.7 AI buzzword positioning

Do not add AI language unless actual product capability supports it.

## 60.8 Excessive animation

Motion should communicate quality and meaning, not compensate for weak content.

## 60.9 Marketing inside the POS

The application's operational screens must remain operational.

## 60.10 Overly corporate language

Sabi Shop should sound like it understands small-shop operations.

---

# 61. Initial Landing Page Wireframe

```text
┌──────────────────────────────────────────────┐
│ Sabi Shop              How it works  Sign in │
│                                  [Get Started]│
├──────────────────────────────────────────────┤
│                                              │
│        KNOW WHAT IS HAPPENING                │
│        IN YOUR SHOP.                         │
│                                              │
│   Sales, stock, money, credit and            │
│   business activity in one clear view.       │
│                                              │
│   [Get Started]   [See how it works]         │
│                                              │
│              Product visual                  │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│        RUN THE SHOP. SEE THE BUSINESS.       │
│                                              │
│   Sales      Stock      Credit      Money    │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│             HOW IT WORKS                     │
│                                              │
│  Record → Connect → See what needs attention │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│          BUILT FOR REAL SMALL SHOPS          │
│                                              │
│          realistic product / workflow        │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│              TRUST & CONTROL                 │
│                                              │
│  Traceable activity · Controlled correction  │
│  · Offline support · Clear authority         │
│                                              │
├──────────────────────────────────────────────┤
│                    FAQ                        │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│       READY TO SEE YOUR SHOP CLEARLY?        │
│              [Get Started]                   │
│                                              │
├──────────────────────────────────────────────┤
│ Footer                                       │
└──────────────────────────────────────────────┘
```

This is an information architecture, not a final visual design.

---

# 62. Content-to-Product Truth Mapping

| Landing claim/theme | Authoritative source |
|---|---|
| Small retail focus | B01 |
| Sales | D03 |
| Pricing/discounts | D04 |
| Staff/incentives | D05 |
| Suppliers/purchasing | B02 |
| Customer credit/debt | B03 |
| Returns/refunds | B04 |
| Cash/reconciliation | B05 |
| Inventory | B06 |
| Transaction history | B07 |
| Corrections/exceptions | B08 |
| Roles/authority | B09 |
| Offline/sync | D07/D08 |
| Audit/integrity | D10/D11 |
| Visual language | C03 |
| Application transition | C04 |

This mapping prevents marketing copy from drifting away from the actual product.

---

# 63. C05 Design Decisions

### C05-DEC-01
The landing page has one primary conversion objective.

### C05-DEC-02
The primary CTA is provisionally **Get Started**.

### C05-DEC-03
The landing page communicates outcomes before features.

### C05-DEC-04
The core positioning centers on business visibility and control.

### C05-DEC-05
The primary audience is the small-business owner/owner-manager.

### C05-DEC-06
The initial reference retail context may inform examples but does not limit product positioning.

### C05-DEC-07
Product visuals must represent real or clearly representative Sabi Shop behavior.

### C05-DEC-08
Fake metrics, testimonials, logos, customer counts, and unsupported claims are prohibited.

### C05-DEC-09
The landing page may use stronger visual expression than the application while sharing the same design language.

### C05-DEC-10
Offline support may be communicated as a capability but must not be overstated.

### C05-DEC-11
Trust messaging should emphasize traceability, control, and visibility rather than fear.

### C05-DEC-12
The public landing experience and authenticated application must feel like one product.

---

# 64. Open Decisions

C05 intentionally leaves these open:

- final headline;
- final supporting copy;
- final CTA wording if acquisition strategy changes;
- final pricing presentation;
- final proof/testimonial strategy;
- final photography/illustration direction;
- final marketing navigation;
- exact signup/onboarding destination;
- exact SEO keywords;
- final legal/footer destinations;
- whether a public product demo is interactive;
- final analytics/measurement strategy.

These are content/product/implementation decisions, not permission to invent facts.

---

# 65. Historical Question Reconciliation

| Earlier question | Earlier status | C05 treatment | Authority |
|---|---|---|---|
| Landing/application relationship | Open | Shared design language, different behavior | C00/C05 |
| Landing page structure | Open | Defined initial structure | C05 |
| Primary CTA | Open | Provisionally Get Started | C05 |
| Public audience | Established | Owner/owner-manager primary | B01/C05 |
| Proof | Open | Real evidence only; no fabricated proof | C05 |
| Pricing | Open | Not invented | C05 |
| Offline marketing message | Open | Capability can be communicated accurately | C05 |
| Final copy | Open | Deliberately remains open | C05/content review |
| Marketing claims | Open | Must map to product truth | C05 |

Historical open labels must not be interpreted as unresolved where C05 now establishes the treatment.

---

# 66. Acceptance Criteria

C05 is successful when:

- the landing page has one clear primary objective;
- the target audience is obvious;
- the core value proposition is understandable quickly;
- benefits precede feature details;
- the primary CTA is clear;
- the page contains a coherent narrative;
- product visuals are believable;
- no unsupported claims are presented;
- proof is real or clearly representative;
- trust is communicated without fearmongering;
- offline capability is described accurately;
- the initial reference business context is represented without over-narrowing the product;
- mobile and desktop hierarchy are intentional;
- accessibility requirements are explicit;
- the page shares the C03 design language;
- the page transitions naturally into the C04 application;
- the redesign audit can evaluate the implementation without changing product truth.

---

# 67. Next Deliverable

## C06 — POS UX

C06 is the most operationally important UX document in Package C.

It will specify the actual selling experience:

```text
Open sale
→ find product
→ add product
→ quantity
→ price/floor behavior
→ customer
→ payment
→ credit authorization where needed
→ completion
→ receipt
→ offline behavior
→ errors/conflicts
```

It will also translate the most important D03/D04/B03/B08/B09 rules into an interface that is fast for ordinary sales while becoming deliberately explicit whenever money, stock, credit, authority, or corrections are involved.

---

# 68. Summary

C05 defines the public experience around one central idea:

> **Sabi Shop helps the owner understand what is happening in the shop.**

The landing page should not sell a pile of modules.

It should sell:

- visibility;
- control;
- connected business records;
- practical daily operation;
- confidence that important activity can be understood later.

The public experience may be expressive.

The product itself must remain operational.

Both should feel unmistakably like Sabi Shop.

> **Show the value clearly. Prove it honestly. Let the product earn the trust.**
