I want to build a commerce app that handles daily sales, has inventory of all available goods, can accept new inventory additions and would have a manger access and salesgirl like access and would be very simple but effective. As an expert in the field and also an expert mobile and webapp developer what should it look like and what are the questions I need to answer to bring the product idea in view very clearly and feasible

Thought for 18s
Good — and here's the free-tier fit confirmed: Supabase's free tier easily covers this (generous database storage, no monthly user limit that matters for 3 staff accounts), so ₦0 budget works fine for your stack.

Plain hash-chain, explained simply
Think of your record book like a receipt pad — but each new receipt has a copy of the fingerprint of the receipt before it printed at the top, before you can tear off the next one.

Concretely, in code:

Every time something happens (stock added, sale made, correction) → save the record as normal
Also compute a "fingerprint" (hash) made from: this record's data + the fingerprint of the record right before it
Store that fingerprint with the record
If anyone — even the manager — edits an old record afterward, its fingerprint changes, which breaks every fingerprint after it. You just check: does the chain still add up? If yes, nothing's been touched. If no, something in the history was altered. That's it — one small function, no wallet, no gas, no internet needed, works completely offline. I'll build it into the spec below.

Now let me put everything together into a build-ready spec.

Created a file, read a file
This covers everything you answered — roles, editable sales with audit flags, discretionary discounts, returns, shifts, profit/loss, offline sync, the hash-chain, and Pidgin/English — plus a clear v1 vs v2 line so you're not tempted to build barcode scanning before you have a working sale flow.

Hand this straight to Claude Code and it can scaffold the whole thing — the schema, screen list, and hash-chain logic are all concrete enough to build from directly. If you want, I can also draft the actual agent prompt for Claude Code (like the two-track approach you used on AwardOS) so the build session starts clean.


Shop app spec
Document·MD 
suggest names for the app

Here's a mix, leaning into the market-woman/Pidgin identity since that's your real differentiator:

Pidgin-flavored (memorable, on-brand)

Sabi Shop — "sabi" = to know/be skilled at; "the app wey sabi your shop"
Owo Book — "owo" (Yoruba: money/hand) + digital ledger book feel
MarketBook
Shop Sharp — "sharp" as in sharp/fast/on-point, very Naija slang
Waka Sales — "waka" = to move/go, ties to daily hustle
Alaajo App — "alaajo" is the traditional daily contribution/thrift collector — evokes trusted daily money-tracking
Simple & clean (easy to say, easy to brand)

DailySale
StockKeep / StockPal
ShopMind
TallyMi
PennyTrack
Trust/ledger-angle (plays on the hash-chain honesty feature)

TrueBook
ClearBook
HonestBooks
If I had to pick one to run with: Sabi Shop — it's catchy, works naturally in Pidgin ("Sabi Shop dey track your sales"), translates fine to English branding too ("the app that knows your shop"), and it's short enough to look good as a home-screen icon name.

Want me to check domain/app-name availability for any of these, or mock up a quick logo/icon concept?

i like that Sabi Shop

Sabi Shop it is 🙌

Want me to:

Check if the domain/app name is free to use (sabishop.app, etc.)
Update the design spec doc with the name baked in
Sketch a quick logo/icon concept
Draft the Claude Code build prompt so you can start scaffolding
Or all of the above — just say the word.

Now, I don't want this to be another app that was built on "vibe", there's a whole lot that needs to be defined for something like this to be built, assuming it was to be given to a dev to do, what are some of those things I must properly define or produce that would make this app a success?

Thought for 17s
Smart move — "vibe-built" apps usually fall apart at the exact points that matter most: money, disputes, and what happens when something goes wrong. Here's what actually needs to be pinned down before a dev touches code, beyond the architecture spec we already have.

1. Edge cases and "what happens when..." rules
This is the single biggest gap in most specs. A dev can't guess your business rules — you have to decide them:

What happens if a sale is recorded for more items than are in stock? Block it, warn but allow, or allow and let stock go negative?
Can a sales staff return an item from a sale made by a different staff member, or only their own?
What if a product is deleted from the catalog but there's still stock and past sales referencing it?
What if two staff are logged in on two devices and both sell the last unit of something offline — who "wins" when they sync?
What if a staff member forgets their PIN, or the manager needs to log in on a device they don't normally use?
What if the manager wants to delete a product entirely — is that even allowed, given the append-only philosophy?
Partial returns (customer bought 5, returns 2) — does the system support that cleanly?
Write these down as a plain list of "if X happens, the app should Y." This alone will save your dev days of guessing.

2. Actual screen-by-screen flow (not just a screen list)
We have a list of 10 screens — but a dev needs to know the exact sequence of taps, what's required vs optional, and what error/empty states look like:

What does "Record Sale" look like with zero products in stock?
What message shows when offline and about to sync?
What does a failed sync look like to the user?
Confirmation before destructive actions (e.g. "remove stock" — does it ask "are you sure"?)
Rough wireframes (even hand-sketched, photographed, and shared) are worth far more here than more written description.

3. Pidgin content — written and reviewed properly
This can't be "translate as you go." Every button label, error message, and confirmation text needs to be written out in both Pidgin and English before development, and ideally checked by someone who actually speaks market-floor Pidgin (not textbook Pidgin) — tone matters a lot for whether staff trust and actually use it.

4. Non-functional requirements
Device reality check: what phones will this actually run on? Nigerian market context often means older, lower-RAM Android phones — the dev needs a target minimum spec, or they'll build/test on a flagship and it'll lag for your staff.
Performance targets: you said "record a sale in under 10 seconds" — make that an explicit requirement the dev is held to, not just a nice idea.
Sunlight/visibility: market stalls are bright — UI needs good contrast, large tap targets, not tiny text.
Session timeout: should the app auto-lock after inactivity (someone else picks up the tablet)?
5. Security basics that are easy to skip
PIN length/complexity, lockout after X failed attempts
What happens if a staff phone with the app installed is lost or stolen — can the manager remotely deactivate that login?
Who can see what — you defined roles, but double check: can sales staff see each other's sales history, or just their own?
6. Backup and data-loss plan
Since it's offline-first and local, define: what happens if a phone is damaged/stolen/lost before it ever synced? Is there an acceptable data-loss window (e.g. "we accept losing at most 1 day of unsynced sales"), or does that need to be tighter?

7. Success metrics — define what "working" means
Before build, decide how you'll know it's actually succeeding once live:

Are staff actually using it instead of falling back to paper/memory?
Has stock-count accuracy improved (spot-check physical stock vs app numbers)?
Fewer arguments over "who sold what" at day's end?
Having these upfront also means you can test against them after launch, not just guess.
8. Training/onboarding plan
Even a simple app needs a short in-person walkthrough, especially if any staff aren't very tech-comfortable. Decide: is there a 2-minute in-app tutorial on first login? A one-page printed cheat sheet? Who trains the sales staff — you, or does the dev need to build tooltips/help text into the UI?

9. Support and maintenance after launch
Who fixes bugs once it's live and something breaks mid-sale on a Saturday? Even informally, decide this now — "vibe-built" apps often die not at launch but a month later when nobody's responsible for keeping them running.

If it'd help, I can turn all of this into a second document — an "Edge Cases & Business Rules" spec that sits alongside the design spec — so your dev (or Claude Code) has both the what and the what-if before writing code. Want me to draft that?

thats good, what other things do we need for basic app development??

Yes. At this point, the next step is to stop treating Sabi Shop as “an idea for an app” and start treating it as a software product that someone should be able to build without constantly asking you what you meant.

For a relatively simple commerce app like Sabi Shop, I’d want a proper product/build package before serious development begins.

The key distinction is this: the earlier things we discussed—edge cases, security, offline behaviour, training, etc.—define how the business should behave. But basic app development also needs documents that define what gets built, how users move through it, how the data works, and how we know each feature is finished.

The core Sabi Shop development package
Deliverable	What it answers	Importance
1. Product Requirements Document — PRD	What exactly are we building and why?	Essential
2. Scope / MVP Specification	What is V1, and what are we deliberately not building yet?	Essential
3. User Roles & Permissions Matrix	What can Manager, Salesgirl, Owner, etc. see/do?	Essential
4. User Stories / Use Cases	What jobs should each type of user be able to accomplish?	Essential
5. Business Rules	What is allowed, blocked, calculated or flagged?	Essential
6. User Flows	What sequence of actions gets the user from A → B?	Essential
7. Screen Specification	What exists on every screen, including errors/empty/loading states?	Essential
8. Wireframes	Rough visual structure of the app before visual design	Essential
9. UI/UX Design System	Colours, typography, buttons, forms, cards, spacing, navigation, etc.	Essential
10. Data Model / Database Schema	What information exists and how records relate	Essential
11. Functional Specification	Exactly how individual features behave	Essential
12. Acceptance Criteria	How do we objectively decide a feature is complete?	Essential
13. Technical Architecture	Web/mobile/PWA, database, auth, offline storage, sync, hosting	Essential
14. API / Server Contract	What the frontend sends/receives from the backend	Usually essential
15. Test Plan	What needs automated/manual testing before release	Essential
16. Analytics / Event Specification	What usage and business activity should be measured	Important
17. Security & Recovery Plan	Authentication, permissions, backups, lost phones, recovery	Essential
18. Deployment / Release Plan	How dev → testing → production works	Important
19. Seed/Test Data	Realistic fake products, staff, sales, stock movements, etc.	Very useful
20. Launch & Operations Guide	How actual shop staff get onboarded and supported	Important

And there are a few of these I would be especially strict about for Sabi Shop.

1. The PRD

This becomes the master document.

It should define Sabi Shop in plain language, something like:

Sabi Shop is a lightweight sales and inventory management application for small retail businesses, designed around extremely fast daily sales recording, accurate inventory tracking, clear staff accountability, offline resilience and simple business reporting.

Then it defines:

Problem: Shop owners often don't know exactly what was sold, what stock remains, who made a sale, how much profit they made, or whether recorded money corresponds with actual activity.

Users: Owner/Manager and Sales Staff.

Primary jobs: Record sales, track inventory, receive stock, see daily totals, track staff activity and identify discrepancies.

Product principles: Fast, simple, trustworthy, offline-capable, usable by people with limited technical experience.

That PRD stops the product from randomly growing features.

2. A very hard MVP boundary

This is incredibly important.

Otherwise someone eventually says:

"Since we're already tracking products, why don't we add suppliers?"

Then:

"What about customer accounts?"

Then:

"Can we add WhatsApp receipts?"

Then:

"We should add barcode scanning."

And suddenly you're building Shopify.

Sabi Shop V1 could deliberately contain only:

Authentication → Products → Inventory → Sales → Returns → Staff → Shifts → Reports → Audit Trail → Offline Sync → Settings.

While V2 could contain:

Barcode scanning, customer profiles, suppliers, purchase orders, WhatsApp receipts, expense management, multi-branch support, advanced analytics, debt/credit sales, etc.

Anything outside V1 gets rejected during development unless the specification is deliberately changed.

3. A permissions matrix

Saying "Manager and Salesgirl access" isn't detailed enough.

We should literally create a matrix like:

Action	Manager	Sales Staff
Record sale	✅	✅
View own sales	✅	✅
View everyone's sales	✅	Maybe
Add stock	✅	❌
Reduce stock manually	✅	❌
Create product	✅	❌
Change price	✅	❌
Apply discount	✅	✅ / limited
Delete/cancel sale	✅	❌
Process return	✅	Possibly
View cost price	✅	❌
View profit	✅	❌
View daily revenue	✅	Depends
Create staff account	✅	❌
Change another staff PIN	✅	❌
End shift	✅	✅
View audit trail	✅	❌

Every permission should be explicitly decided.

This becomes both the UX specification and the security policy.

4. User stories

Instead of telling the developer:

Build inventory.

We tell them:

As a manager, I want to add newly delivered cartons of Malt so that available stock increases without altering historical stock records.

Or:

As a sales staff member, I want to record a customer's purchase in fewer than five interactions so I can complete sales quickly while customers are waiting.

Or:

As a manager, I want to see today's expected cash against recorded sales so I can investigate discrepancies.

That tells us what the feature is actually supposed to accomplish.

5. Complete user flows

This is where a lot of “vibe coding” fails.

We map things like:

Opening the shop

Login → Start Shift → Opening cash balance → Dashboard → Begin selling.

Normal sale

Sales → Search/select product → Quantity → Add more products → Discount if applicable → Payment method → Confirm → Receipt/success → New sale.

Restocking

Inventory → Product → Add Stock → Quantity → Cost → Source/reference → Confirm → Stock movement recorded.

Return

Find Sale → Select Item → Quantity Returned → Reason → Refund method → Confirm → Inventory restored → Audit record created.

Closing

End Shift → Expected sales → Payment breakdown → Cash counted → Difference → Staff explanation if required → Manager review.

Those flows should exist before UI implementation.

6. Screen specifications

Wireframes alone are not enough.

For every screen we define:

Purpose

Who can access it

Data displayed

Actions

Required fields

Optional fields

Validation

Loading state

Empty state

Error state

Offline state

Success state

Permissions

For example:

Product inventory screen

Displays:

Product name
Current stock
Selling price
Low-stock status
Last restock date

Actions:

Add stock
Edit product
View stock history

Empty state:

No products yet. Add your first product to start selling.

Offline state:

You're offline. Changes made here will sync when you're connected.

That is much more useful to a developer than “make an inventory page.”

7. The actual data model

Before coding, we need to know what Sabi Shop believes exists in the world.

Probably something along these lines:

Shop

User

Role

Device

Product

ProductVariant — possibly later

InventoryMovement

Sale

SaleItem

Payment

Return

ReturnItem

Shift

StockAdjustment

AuditEvent

SyncEvent

You shouldn't merely store:

product.stock = 53

A better system also knows why stock became 53.

For example:

Opening Stock       +100
Delivery             +20
Sale                  -4
Sale                  -2
Return                +1
Damaged Stock         -3
--------------------------------
Available Stock      112

That historical ledger becomes enormously important when somebody says:

"But I know we had 10 cartons here yesterday."

8. Data dictionary

This sounds boring.

It is also extremely useful.

We define what things mean.

For example:

Sale Total

Subtotal - Discount + Tax

Gross Profit

Revenue - Cost of Goods Sold

Available Stock

All inbound inventory - all valid outbound inventory

Submitted Sale

A sale that has passed confirmation, not merely something sitting in someone's cart.

Voided Sale

A historical sale invalidated through an authorised correction; it is never physically deleted.

That eliminates future arguments about what a dashboard number means.

AwardOS already showed you why undefined counting rules become serious bugs. The same problem is even more dangerous when the number represents money.

9. Acceptance criteria

Every feature should have a definition of done.

For example:

Record Sale

A sale is considered correctly implemented when:

an available product can be selected;
quantity cannot be zero;
the correct current selling price is used;
applicable discounts are recorded separately;
confirming the sale creates one immutable transaction;
corresponding inventory is reduced;
the responsible staff member is recorded;
timestamp and device are recorded;
duplicate submission does not create duplicate sales;
offline sales are queued safely;
syncing does not create duplicates;
the transaction appears in daily reports;
the transaction appears in the audit history.

Now Claude Code—or a human developer—can actually test it.

10. Design system

Before building 20 slightly different buttons, define:

Typography
Colour system
Button styles
Inputs
Numeric keypad
Cards
Modals
Tables/lists
Navigation
Status chips
Icons
Spacing
Borders
Error messages
Success messages
Warning states
Dark/light behaviour if applicable

And because this is primarily commerce, I'd optimise heavily for speed and readability rather than decorative UI.

For example, the Sales screen should probably have one unmistakable primary action:

COMPLETE SALE — ₦12,450

rather than six equally prominent buttons competing for attention.

11. Responsive/device strategy

Another thing we need to settle:

Are we building:

PWA first?

Android app?

Web dashboard + mobile sales application?

One responsive application for everything?

My inclination for Sabi Shop V1 would probably be:

Mobile-first PWA + responsive manager interface, installable on Android and still accessible through a browser.

Then native Android/iOS can happen later if there's an actual business reason.

But we'd properly evaluate that when creating the technical specification.

12. Offline and sync specification

This needs its own document, because offline-first systems are much harder than adding:

if (!navigator.onLine)

We have to define:

What gets stored locally?

How are IDs created offline?

What happens when two devices change the same product?

What happens if a sale syncs twice?

Which data must be available offline?

How far back does local sales history go?

Can users log in offline?

How long can credentials remain valid offline?

When does background syncing occur?

How does the user know sync is pending?

What happens after 50 unsynced transactions?

What happens if a sync partially succeeds?

This is probably one of the most technically important specifications for Sabi Shop.

13. Error catalogue

Instead of inventing messages during development, define common errors.

For example:

OUT_OF_STOCK

This item is out of stock.

INSUFFICIENT_STOCK

Only 3 are currently available.

SYNC_PENDING

Saved on this phone. It will sync when you're back online.

PRICE_CHANGED

The price of this item was changed after this sale started. Refresh the sale before continuing.

SESSION_EXPIRED

Your session has ended. Enter your PIN to continue.

Even the tone can be standardized.

14. Test strategy

We should decide what needs:

Unit testing

Calculations, inventory accounting, discounts, profit, audit hashing.

Integration testing

Database writes, transactions, authentication, synchronization.

End-to-end testing

Login → Record Sale → Inventory changes → Report updates.

Manual testing

Actual low-end Android devices, poor network, airplane mode, app closure during sale, sunlight readability.

Abuse testing

Repeated button taps, duplicate requests, incorrect PIN, unauthorized endpoints, editing requests manually.

And importantly, testing should be based on the business rules, not merely whether the page loads.

15. Sample business dataset

Before building, create a realistic test shop.

Something like:

Coca-Cola 50cl
Cost: ₦350
Selling: ₦500
Stock: 48

Maltina
Cost: ₦450
Selling: ₦600
Stock: 30

Indomie Chicken
Cost: ₦220
Selling: ₦300
Stock: 72

Then:

Manager: Amaka
Sales staff: Blessing
Sales staff: Joy

Add fake:

sales
returns
discounts
damaged goods
stock additions
cash payments
transfers
missing stock

Now every dashboard and workflow can be tested against something realistic.

16. Product analytics

Even a small app should tell you whether people can actually use it.

We don't need invasive analytics.

Just useful events like:

login_completed
shift_started
sale_started
sale_completed
sale_abandoned
stock_added
return_completed
sync_failed
sync_completed
low_stock_triggered
shift_closed

Then later you can discover something like:

34% of started sales are being abandoned on the payment screen.

That tells you there may be a UX issue.

17. Versioning and release process

You don't want the developer changing production directly.

At minimum:

Local Development
        ↓
Preview / Staging
        ↓
Automated Tests
        ↓
Manual Acceptance Test
        ↓
Production

And every release should have a version.

Sabi Shop v1.0.0
Sabi Shop v1.0.1
Sabi Shop v1.1.0

Plus database migrations that are tracked rather than manually changing Supabase tables.

18. Definition of Done

This one is deceptively useful.

A feature isn't complete because:

“Claude finished coding it.”

For Sabi Shop, we could define Done as:

Feature implemented
Types pass
Automated tests pass
Permissions verified
Mobile layout verified
Offline behaviour verified where applicable
Loading/error/empty states implemented
Accessibility checked
Acceptance criteria passed
No console errors
No critical audit issues
Documentation updated

Only then is it done.

What I think we should produce for Sabi Shop

Instead of creating random documents one at a time, I would build a proper Sabi Shop Product Bible.

Something structured like:

SABI SHOP
│
├── 00 — Product Vision & Principles
├── 01 — Product Requirements Document
├── 02 — MVP Scope & Roadmap
├── 03 — Personas & User Roles
├── 04 — Permissions Matrix
├── 05 — User Stories
├── 06 — Business Rules & Edge Cases
├── 07 — User Journeys & Flows
├── 08 — Information Architecture
├── 09 — Screen Specifications
├── 10 — UX Writing — English & Pidgin
├── 11 — Wireframes
├── 12 — Design System
├── 13 — Database & Data Dictionary
├── 14 — Technical Architecture
├── 15 — Offline & Sync Specification
├── 16 — Security & Audit Specification
├── 17 — API / Server Contracts
├── 18 — Acceptance Criteria
├── 19 — Testing Strategy
├── 20 — Analytics Specification
├── 21 — Deployment & Release Process
├── 22 — Training & Operations
└── 23 — V2 / Future Roadmap

That might look like overkill for a small app, but the documents themselves don't have to be enormous. Some may only be two or three pages.

What matters is that the important decisions exist somewhere.

Once those are complete, you should be able to give Sabi Shop to a competent developer who has never spoken to you before, and they should understand almost everything necessary to build the same product you have in your head.

And that is the standard I'd use to decide whether we've actually finished designing Sabi Shop before development begins.

Okay, research any other delieverable we may need to add and lets discuss processing and giving me the deliverables

Yes. I did a broader pass specifically from the perspective of “what would a serious product team hand to a developer/agency before building a commerce system?” rather than just collecting the usual PRD/UX documents.

And I think we should expand our original package.

The reason is that Sabi Shop is deceptively simple. It handles money + inventory + staff permissions + historical records + potentially offline transactions. So the specification needs to protect the business logic just as much as it describes the UI.

I also checked current software-quality/security frameworks. ISO/IEC 25010:2023 explicitly treats quality as something that should be specified and evaluated throughout the product lifecycle, while NIST's SSDF recommends integrating security practices into the development lifecycle rather than bolting them on afterward.

First: I would reorganize our deliverables

Rather than ending up with 23 disconnected documents, I'd create 7 major specification packages, containing around 30–35 individual deliverables.

That makes the whole thing much easier to manage.

SABI SHOP — PRODUCT DEVELOPMENT PACKAGE
PACKAGE A — Product & Business Definition

This answers:

What are we building, for whom, why, and what does success mean?

A01 — Product Vision

The one-page north star.

A02 — Problem Definition

The actual business problems Sabi Shop solves.

A03 — Product Principles

For example:

Simple over feature-heavy
Fast over decorative
Accurate over convenient
Every financial change is explainable
Offline shouldn't mean data loss
Staff shouldn't need technical knowledge
A04 — Target Users & Personas

Not generic “users.”

We define:

Shop owner
Manager
Sales staff
Potential future roles
A05 — Jobs-to-be-Done

What each person is actually trying to accomplish.

A06 — Product Scope

Everything Sabi Shop is.

A07 — Non-Scope

Everything Sabi Shop isn't.

This is extremely important.

A08 — MVP Definition

The exact V1.

A09 — Product Roadmap

V1 → V1.1 → V2 → future.

A10 — Success Metrics

How we determine whether Sabi Shop actually works in the real world.

PACKAGE B — Business Operations Specification

This is where Sabi Shop becomes a real commerce product rather than a CRUD app.

B01 — Business Model

We define the actual shop operation:

Supplier
   ↓
Inventory received
   ↓
Stock available
   ↓
Sale
   ↓
Payment
   ↓
Inventory deduction
   ↓
Revenue
   ↓
Profit
B02 — Commerce Glossary / Domain Dictionary

This is surprisingly important.

We define exactly what:

Product
Stock
Inventory
Sale
Sale Item
Revenue
Cost
Profit
Discount
Return
Refund
Adjustment
Void
Shift
Cash balance

actually means.

B03 — Business Rules Catalogue

Every important rule gets a unique ID.

For example:

INV-RULE-001

Inventory cannot become negative unless the manager explicitly enables controlled negative stock.

B04 — Edge Case Catalogue

Our huge “what if?” document.

B05 — Financial Rules

How we calculate:

Sales totals
Discounts
Cost of goods
Gross profit
Returns
Refunds
Cash expected
Cash variance
B06 — Inventory Accounting Rules

Exactly how stock moves.

B07 — Transaction Lifecycle

For example:

Draft
 ↓
Confirmed
 ↓
Completed

versus:

Draft
 ↓
Cancelled

And importantly, whether completed transactions can ever be deleted.

B08 — Correction & Exception Policy

What happens when someone makes a mistake?

This is where we define:

Edit vs void vs reversal vs adjustment.

That distinction matters enormously.

PACKAGE C — User Experience Specification

Now we define what people actually interact with.

C01 — Information Architecture

The complete structure of the application.

For example:

Sabi Shop
│
├── Home
├── Sales
│   ├── New Sale
│   └── Sales History
│
├── Inventory
│   ├── Products
│   ├── Stock
│   └── Stock History
│
├── Reports
│
├── Staff
│
└── Settings
C02 — User Journey Maps

Manager journey.

Salesgirl journey.

Opening shift.

Making a sale.

Returning an item.

Receiving inventory.

Closing shift.

C03 — User Flow Diagrams

More technical than journey maps.

C04 — Screen Inventory

Every screen in the product.

C05 — Screen Specifications

Every screen gets:

Purpose
Access
Components
Data
Actions
Validation
Empty state
Loading state
Error state
Offline state
Success state
C06 — Wireframes

Low-fidelity structure before visual polish.

C07 — High-Fidelity UI Design

Actual production interface.

C08 — Design System

Typography, spacing, buttons, inputs, cards, modals, navigation, tables, status indicators, etc.

C09 — UX Writing Specification

English + Pidgin.

Not just translations, but approved product language.

C10 — Accessibility Specification

Touch targets, contrast, text sizing, keyboard behaviour where relevant, screen-reader semantics, etc.

PACKAGE D — Technical Specification

This is what allows the developer to actually build it.

D01 — System Architecture

Frontend + backend + database + local storage + sync + hosting.

D02 — Technology Decision Record

Why we're using particular technologies.

Not:

“Because Claude recommended it.”

😂

Actual decisions with alternatives considered.

D03 — Database Schema

Tables, relationships, indexes, constraints.

D04 — Data Dictionary

Every important field.

For example:

sale.total
Type: decimal
Required: yes
Mutable: no after completion
Meaning: final amount charged to customer
D05 — API Specification

Endpoints/actions, inputs, outputs, errors and authentication.

D06 — State Management Specification

What data belongs:

server-side
local
cached
temporary
synchronised
D07 — Offline Architecture Specification

This deserves its own document for Sabi Shop.

D08 — Synchronization Protocol

Conflict resolution, retries, duplicate prevention, ordering, failed syncs, etc.

D09 — ID / Reference Number Strategy

How we identify:

Sales
Products
Inventory movements
Users
Devices
Shifts
D10 — Audit Trail Specification

Exactly what gets recorded when something changes.

D11 — Hash-Chain / Integrity Specification

The tamper-evident history mechanism we discussed earlier.

PACKAGE E — Security, Reliability & Data Protection

This is where we move from:

“The app has login.”

to:

“The application has a defined security model.”

NIST's SSDF specifically emphasizes preparing the organization, protecting software, producing secure software, and responding to vulnerabilities across the development lifecycle.

E01 — Authentication Specification

PIN/password/session behaviour.

E02 — Authorization Specification

Role permissions.

E03 — Threat Model

We explicitly ask:

How could someone abuse Sabi Shop?

Examples:

Salesgirl manipulates a price
Staff member tries to access another shop
User replays a sale request
Someone modifies local storage
Someone steals a logged-in device
Someone attempts to alter historical records
Two devices submit conflicting inventory changes
E04 — Security Requirements

Concrete requirements derived from the threat model.

E05 — Secrets & Environment Management

API keys, service credentials, environment variables, etc.

E06 — Backup & Recovery Plan

What happens if:

database dies
phone is lost
device is stolen
data is corrupted
sync fails
user accidentally deletes something
E07 — Disaster Recovery Plan

How quickly can we restore the system?

E08 — Data Retention Policy

How long do we retain:

sales
audit records
staff accounts
deleted products
logs
E09 — Privacy/Data Handling Specification

What personal information exists and why?

PACKAGE F — Quality Assurance & Verification

This is the package I think we were missing most.

Not merely “we will test it.”

We need to define how we prove it works.

F01 — QA Strategy

Overall testing philosophy.

F02 — Test Plan

What gets tested and when.

F03 — Test Case Catalogue

Actual tests.

Example:

SALE-TEST-017

Given: Product has 3 units.

When: Sales staff attempts to sell 4.

Then: Sale is blocked and inventory remains 3.

F04 — Acceptance Criteria

Feature-by-feature definition of done.

F05 — Automated Test Specification

What must have:

unit tests
integration tests
E2E tests
F06 — E2E User Journey Tests

For example:

Login
 ↓
Start shift
 ↓
Create sale
 ↓
Complete payment
 ↓
Inventory decreases
 ↓
Dashboard updates
 ↓
Sale appears in history
F07 — Offline Test Matrix

This is important.

Test:

online
offline
intermittent network
reconnecting
duplicate sync
interrupted sync
app killed during transaction
device restarted
F08 — Permission Test Matrix

Attempt every sensitive action as every role.

F09 — Financial Accuracy Test Suite

We test calculations independently.

F10 — Performance Requirements

For example:

sale completion < X seconds
dashboard load < X seconds
app startup < X seconds
inventory search < X ms

We shouldn't choose these numbers arbitrarily; we'll establish realistic targets.

F11 — Device Compatibility Matrix

Especially important for the Nigerian market.

We define minimum:

Android version
RAM
screen size
browser
network conditions
F12 — UAT Plan

User Acceptance Testing.

Actual shop users use the system against realistic scenarios before launch.

PACKAGE G — Delivery, Operations & Governance

This is what keeps the project from becoming another abandoned codebase.

G01 — Development Environment Specification

How a new developer gets the project running.

G02 — Repository Structure

How code is organized.

G03 — Coding Standards

Naming, architecture, error handling, etc.

G04 — Git / Branching Strategy

How changes are developed and merged.

G05 — CI/CD Specification

What happens when code is pushed.

For example:

Push
 ↓
Lint
 ↓
Typecheck
 ↓
Unit tests
 ↓
Build
 ↓
E2E
 ↓
Preview
 ↓
Approval
 ↓
Production
G06 — Environment Specification

Development / staging / production.

G07 — Database Migration Policy

No random production database changes.

G08 — Monitoring & Observability

How we know something broke.

G09 — Error Reporting

How production errors are captured and investigated.

G10 — Incident Response

What happens when:

“Sales aren't recording.”

or

“Inventory is wrong.”

G11 — Release Checklist

A formal pre-release checklist.

G12 — Rollback Plan

What happens when a release breaks something.

G13 — User Training Guide

For the actual shop staff.

G14 — Administrator Manual

For whoever manages Sabi Shop.

G15 — Developer Handover Documentation

So another developer can take over.

And there's one more document I strongly recommend
The Decision Log

This sounds insignificant, but I would absolutely have one.

Every major decision gets recorded:

DEC-001
Decision: Sabi Shop will initially be a PWA.

Why:
...

Alternatives considered:
Native Android
React Native

Reason rejected:
...

Date:
...

Status:
Accepted

Why?

Because six months later someone will ask:

“Why don't we just make this native?”

And instead of debating from memory, we can see exactly why that decision was made.

The really important addition: Requirements Traceability

This is the thing I'd add if we're serious about avoiding a “vibe-built” product.

Every important requirement gets an ID.

For example:

REQ-SALE-001

Staff must be able to complete a normal sale.

That requirement maps to:

REQ-SALE-001
       │
       ├── UX-FLOW-004
       ├── SCREEN-SALE-001
       ├── API-SALE-001
       ├── DB-SALE-001
       ├── RULE-SALE-003
       ├── TEST-SALE-001
       └── E2E-SALE-001

So we can eventually ask:

“Have we actually implemented and tested every requirement?”

That's how you prevent the classic:

“We built all the screens but somehow the actual business doesn't work.”

So what are we actually going to produce?

I'd make the final Sabi Shop documentation repository look something like this:

SABI SHOP — MASTER PRODUCT SPECIFICATION
│
├── 00_MASTER_INDEX.md
│
├── 01_PRODUCT
│   ├── Product Vision
│   ├── Problem Definition
│   ├── Personas
│   ├── Jobs-to-be-Done
│   ├── MVP Scope
│   ├── Non-Scope
│   ├── Roadmap
│   └── Success Metrics
│
├── 02_BUSINESS
│   ├── Business Model
│   ├── Domain Glossary
│   ├── Business Rules
│   ├── Edge Cases
│   ├── Financial Rules
│   ├── Inventory Rules
│   ├── Transaction Lifecycle
│   └── Correction Policy
│
├── 03_UX
│   ├── Information Architecture
│   ├── User Journeys
│   ├── User Flows
│   ├── Screen Inventory
│   ├── Screen Specifications
│   ├── Wireframes
│   ├── UI Design
│   ├── Design System
│   ├── UX Writing
│   └── Accessibility
│
├── 04_TECHNICAL
│   ├── Architecture
│   ├── Technology Decisions
│   ├── Database Schema
│   ├── Data Dictionary
│   ├── API Specification
│   ├── State Management
│   ├── Offline Architecture
│   ├── Sync Protocol
│   ├── ID Strategy
│   ├── Audit Trail
│   └── Integrity / Hash Chain
│
├── 05_SECURITY
│   ├── Authentication
│   ├── Authorization
│   ├── Threat Model
│   ├── Security Requirements
│   ├── Secrets Management
│   ├── Backup & Recovery
│   ├── Disaster Recovery
│   ├── Data Retention
│   └── Privacy
│
├── 06_QA
│   ├── QA Strategy
│   ├── Test Plan
│   ├── Test Cases
│   ├── Acceptance Criteria
│   ├── Automated Tests
│   ├── E2E Tests
│   ├── Offline Test Matrix
│   ├── Permission Tests
│   ├── Financial Tests
│   ├── Performance Requirements
│   ├── Device Matrix
│   └── UAT
│
├── 07_DELIVERY
│   ├── Development Setup
│   ├── Repository Standards
│   ├── Coding Standards
│   ├── Git Strategy
│   ├── CI/CD
│   ├── Environments
│   ├── Migration Policy
│   ├── Monitoring
│   ├── Incident Response
│   ├── Release Checklist
│   ├── Rollback Plan
│   ├── Training Guide
│   └── Developer Handover
│
└── 08_GOVERNANCE
    ├── Requirements Traceability Matrix
    ├── Decision Log
    ├── Change Request Process
    ├── Risk Register
    └── Open Questions
And I'd add three things to our working process

Risk Register — what could kill the project or product, how likely it is, impact, mitigation.

Open Questions Register — every unresolved decision. Nothing gets silently guessed.

Change Request Log — once the specification is approved, changes are tracked rather than casually injected into development.

That gives us a very clean lifecycle:

Discover → Define → Design → Specify → Build → Verify → Release → Operate.

Not:

Idea → Claude → UI → “Looks nice” → Production → 😭

One important distinction

I don't think we should write all 35 documents immediately.

That would actually become another form of “vibe.”

We should process the product systematically, and each deliverable should be produced from decisions we've already made.

For example:

Phase 1 — Product Discovery

We interview you about Sabi Shop and resolve the business questions.

↓

Phase 2 — Product Definition

We turn those answers into the PRD, scope, personas, requirements and business rules.

↓

Phase 3 — UX

We turn those requirements into journeys, flows, screens and wireframes.

↓

Phase 4 — Technical Architecture

Only after we know what the product actually needs do we design the database, APIs, offline architecture, sync system, etc.

↓

Phase 5 — Verification

We derive acceptance criteria and tests from the requirements.

↓

Phase 6 — Developer Package

We assemble everything into a clean handoff package.

That order matters because the later documents should derive from the earlier ones, rather than us independently writing 35 documents and hoping they agree.

And I would keep a single source of truth so that if we later decide, for example, that sales staff can process returns, that decision propagates through permissions → user flows → business rules → UI → API → tests.

That is the level of rigor I'd recommend for Sabi Shop.

If we do this properly, by the time we hand the package to a developer, the developer's job should primarily be implementation—not product interpretation.
