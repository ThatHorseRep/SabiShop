# Handoff 24 — Public Landing Page

**Module:** C05 — Public landing page (marketing experience; cross-cutting
public entry, consumes the C03 design system and C04 application transition)
**Status:** IMPLEMENTED MARKETING PAGE over the verified application design
system; the acquisition/onboarding destination is intentionally temporary and
remains downstream
**Date:** 2026-09-08
**Spec authority:** C05 (`16-landing-page-ux.md` — the authoritative landing
page UX baseline), C00 (`11-ux-and-design-foundation.md` sections 9, 25 —
landing rules and landing/application synchronization), C03
(`14-design-system.md` sections 3.1, 5–16, 17–18, 41–45, 63–65, 67.3, 68 —
shared tokens and marketing/application relationship), A01
(`01-product-vision.md` sections 1, 3, 9, 10, 14), B01
(`02-business-model.md` positioning), and the external `landing-page-design`
skill used as methodology only
**Handoffs consumed:** 17 (application shell/design system — shared tokens,
buttons, badges, type utilities, icon family), 18 (POS UX — sale workspace
visual and seed catalogue)

## Outcome

The public Sabi Shop landing page exists as a **separate marketing entry**
(`landing.html` + `src/landing/`) built by the same Vite toolchain as the
operational application. It is a marketing experience, not the operational
application: it never imports the operational shell, domain engines, sync
queue, or service worker, so public visitors do not download the
application's code, and the application is untouched.

The page follows the external landing-page methodology for conversion
structure while Sabi Shop product truth outranks it everywhere they differ.
It shares visual DNA with the application — same C03 tokens, Geist typeface,
Phosphor icons, shared `.ui-button`/`.ui-badge` component classes — while
being more expressive: display typography, a floating glass pill header, a
deep brand trust band, controlled scroll motion, and a word-by-word tagline
reveal.

## Conversion strategy (skill output, as built)

1. **Primary conversion objective / CTA:** one action — **Get Started** —
   leading into the application (`/`). Onboarding is not implemented, so per
   C05 §6 the CTA temporarily points to the approved next step (the working
   product workspace) and no fake signup experience is presented. The final
   CTA matches the hero CTA exactly (A2; C05-DEC-02).
2. **Secondary path:** "See how it works" scrolls to the how-it-works
   section; it is styled with the shared secondary button and never competes
   with the primary CTA (C05 §7).
3. **Audience:** small retail business owners and owner managers who need
   visibility and control over daily shop operations (C05 §3). The page
   speaks to the owner, and staff are presented as supported workers, never
   as suspects (C05 §26).
4. **Hero copy:** eyebrow "Shop operations for small retail businesses";
   headline "Know what is happening in your shop." (the approved C05 §11
   direction); subheadline explaining the connected picture of sales, stock,
   money, and customer credit; primary/secondary CTAs; an honest capability
   proof line ("Built for real shop conditions: multiple staff, cash and
   transfers, customer credit, negotiated prices, and unreliable
   connectivity"); and a representative sale-workspace visual labelled as
   example data.
5. **Benefits (five outcome pillars, C05 §15):** know your sales, know your
   stock, know your money, know who owes you, know what needs attention —
   each with a specific supporting sentence, before any internal product
   terminology.
6. **How it works (three steps, C05 §17–20):** record the work → keep the
   picture connected → see what needs attention, with the explicit caveat
   that Sabi Shop surfaces information and the owner decides.
7. **FAQ (ten questions, C05 §37):** the recommended question set, answered
   directly and honestly, exposed as native disclosures and as FAQPage
   structured data rendered from the same copy source.
8. **SEO / AEO:** the page is indexed (evergreen offer, matching search
   intent). Title "Sabi Shop — Know what is happening in your shop", meta
   description, Open Graph and Twitter summary tags, `og:image` pointing at
   the existing brand icon, semantic headings, and a `<noscript>` summary
   that links into the product.
9. **Layout type:** A — classic hero plus sections, because the product is
   understandable from a hero workspace visual and the offer needs a
   complete argument (problem → outcomes → mechanics → trust → objections)
   rather than a long-form story or a minimal page.

## Page outline (as built)

```text
1. Header (floating glass pill): brand, How it works, What it covers, FAQ,
   Sign in, Get Started
2. Hero: eyebrow, outcome headline, subheadline, Get Started + See how it
   works, capability proof line, representative sale workspace visual
3. Problem recognition: the shop does not pause for paperwork
4. Core outcomes: the five "know your …" pillars
5. Tagline reveal: "Run the shop. See the business." (word-by-word scroll
   activation)
6. How Sabi Shop works: record → connect → see what needs attention
7. Product areas: Sell, Products & Inventory, Customers & Credit, Suppliers
   & Purchasing, Money, Activity, Management — presented as one connected
   system, with the same icons the application shell uses
8. Trust and control (deep brand band): traceable activity, controlled
   corrections, clear authority, offline support
9. Audience fit: owner framing + staff framing + shop-type examples
10. FAQ: ten questions with direct answers
11. Final CTA: "Ready to see your shop clearly?" + Get Started (identical
    to the hero CTA)
12. Footer: brand line, navigation, Sign in, Get Started, honest legal note
```

## Product truth and proof governance

The page contains **no** testimonials, user numbers, revenue claims,
performance statistics, customer logos, ratings, or "trusted by" claims
(C05 §34, §35, §60; the skill's proof requirement is satisfied instead by an
honest capability statement beside the hero claim, per the C05 early-stage
proof strategy). Pinned tests enforce the absence of fabricated-proof
markers and the representative-data labelling.

Claims map to authoritative sources: visibility/control positioning (A01 §3,
C05 §5), sales/stock/money/credit outcomes (C05 §15), split payments and
payment methods (B01 §11), controlled corrections preserving history (B08;
C05 §33), offline as a bounded capability with conflicts surfaced (H06; C05
§23), one business's records never mixing with another's (B09 §22), and the
staff close-of-shift framing (B05). Pricing, security guarantees, and legal
terms are **not** invented: the footer states that privacy policy and terms
will be published with the public release (C05 §38, §39, §51).

The hero visual is composed from the application's own design language and
POS seed catalogue (Spark Plug NGK, Engine Oil 4L SAE 40, Air Filter Toyota
Corolla, customer Ada Obi), shows a split cash/transfer payment with an
offline badge, and is captioned "Representative view of the Sabi Shop sale
workspace with example data." (C05 §12, §46, §57).

## Visual system compliance

- **Shared DNA:** consumes `src/ui/tokens.css`, `src/ui/base.css`, and
  `src/ui/components.css` unchanged; CTA anchors reuse the `.ui-button`
  primary/secondary variants and the visual reuses `.ui-badge`. No
  competing token system is introduced (C03-DEC-11).
- **Typography:** Geist only; every font size resolves to a C03 type-scale
  token (display for the hero and tagline, H1 for section headings, H3/H4
  for tiles, body sizes for copy). Sentence case headings, no italics, no
  ultra-heavy weights, `text-wrap: balance`/`pretty`, and the hero heading
  is capped at 680px with a meaningful line break.
- **Colour and surfaces:** flat backgrounds only; the one gradient is the
  skill-permitted hero heading text gradient, adapted to the Sabi Shop
  palette and guarded by `@supports`. The trust band uses the existing
  brand token `--color-primary-active`; tiles use the existing surface,
  border, and radius tokens.
- **Motion:** all transitions use the shared `--ease-out` curve; scroll
  reveals (800ms, from the external methodology) and the tagline word
  activation run through `IntersectionObserver` — never an unthrottled
  scroll listener — and `prefers-reduced-motion` removes animation and
  tagline stagger. The 800ms reveal duration is a marketing-context
  extension of the C03 §44 candidate timings and is listed below as an open
  visual-validation item.
- **Icons:** Phosphor only (the application's C03 §41 choice); product-area
  tiles reuse the exact icons the application shell navigation uses.

## Interaction, states, and accessibility

- Skip link, semantic landmarks (`header`/`nav`/`main`/`section`/`footer`),
  one `h1`, logical heading hierarchy, and visible focus from the shared
  base styles.
- The mobile menu is keyboard operable: morphing hamburger (rotating into an
  X, never disappearing), full-screen overlay with staggered link reveal,
  focus moved into the menu on open, Tab wrapping, Escape to close with
  focus returned to the toggle, body scroll lock, and auto-close when the
  viewport returns to desktop width.
- FAQ answers use native `<details>` disclosures (no JavaScript required).
- Progressive enhancement: `main.tsx` adds a `js` class to `<html>` only
  when scripting runs; reveal and tagline-muted initial states apply **only**
  under that class. Without scripting or observers, every element renders in
  its final readable state, and the `noscript` summary remains available.
- All links resolve: in-page anchors point at existing section ids, and
  Sign in / Get Started point at the application. No dead `#` links.
- The page sets no cookies and loads no analytics (C05 §64 leaves the
  analytics/measurement strategy open), so no consent banner is presented;
  this must be revisited when analytics land.

## Files changed

```text
landing.html                            new public marketing entry (SEO/OG meta, noscript)
vite.config.ts                          multi-page build input (index + landing)
src/landing/main.tsx                    landing React entry (js class, no service worker)
src/landing/LandingPage.tsx             page component, copy source, FAQ schema, observers
src/landing/landing.css                 marketing styles over the shared C03 tokens
src/landing/LandingPage.test.tsx        focused tests (8)
docs/build/BUILD-STATUS.md              landing slice section, overall status, module table
docs/build/HANDOFFS/24-landing-page.md  this handoff
```

No schema, migration, domain, authorization, or application-shell files were
touched. The operational application (`index.html`, `src/main.tsx`,
`src/App.tsx`, and all workspaces) is byte-for-byte unchanged.

## Authorization, tenant, audit, and offline behaviour

Not applicable by design: the landing page is public, renders no business
data, performs no mutations, and calls no APIs. It links into the
application, where the existing verified authorization, tenant-isolation,
audit, and offline boundaries apply unchanged. The offline badge shown in
the hero visual is a representative presentation of an application state,
not a claim about this page.

## Tests and validation

Focused tests (`src/landing/LandingPage.test.tsx`, 8 tests) cover:

- the outcome headline, audience statement, and the single primary
  conversion path with the matching final CTA;
- the approved C05 section order including the mid-page tagline moment
  separate from the hero;
- the five outcome pillars and three steps (outcomes before features);
- absence of fabricated proof plus representative/example-data labelling;
- the ten FAQ questions and the FAQPage structured data rendered from the
  same source;
- native disclosure behaviour with bounded offline wording and no absolute
  claims;
- tagline words rendering fully without observers (progressive enhancement);
- the mobile menu open/Escape/focus-return behaviour.

Full validation on 2026-09-08:

```text
npm test                                      PASS (232 tests, 23 files)
npm run lint                                  PASS (0 errors, 0 warnings)
npm run build                                 PASS (dist/index.html + dist/landing.html)
npx tsc -b --pretty false                     PASS
npx prettier --check <landing slice files>    PASS
git diff --check                              PASS
```

Browser verification (production build via `vite preview`, 390 px and
1440 px viewports, 12/12 checks): no horizontal overflow at either width;
hero headline visible in Geist with the four Get Started CTAs present;
scroll reveals and tagline words activate through IntersectionObserver; the
FAQ disclosure opens on click; the mobile menu opens, focuses its first
link, and closes on Escape. Screenshots are archived under `work/`
(gitignored).

## Known limitations and unresolved decisions

- **CTA destination:** Get Started and Sign in both open the application
  (`/`), which currently runs on the reference session adapter. When the
  approved acquisition/onboarding and authentication paths exist, the CTAs
  must point there (C05 §6, §52, §64 open decisions: final CTA wording,
  exact signup destination, marketing navigation).
- **Deployment routing:** the landing page is served at `/landing.html`
  until hosting routes the public domain; deciding whether the marketing
  page or the application occupies the root is a deployment decision, as is
  any service-worker adjustment for offline landing access (the current
  `sw.js` navigation fallback serves the application shell offline).
- **Rendering:** the page is client-rendered (crawlable via JS execution,
  with a `noscript` summary). Static generation or richer server-rendered
  SEO can be revisited if organic search becomes a primary channel.
- **Copy review:** the copy implements the approved C05 working directions
  but final marketing copy remains subject to product/content review
  (C05 §64); the naira figures in the visual are example data from the POS
  seed catalogue.
- **Visual validation:** the hero heading gradient, the 800ms marketing
  reveal duration, and final breakpoint behaviour remain subject to the C11
  redesign-audit/visual-validation pass (C03 §69).
- **Bundle note:** the landing entry shares the Phosphor icon chunk with the
  application (~70 kB gzipped, cached across entries); a lighter inline-icon
  strategy is possible if landing payload weight ever matters.
- **Not implemented (deliberately):** no public interactive product demo, no
  pricing section, no cookie/analytics consent, no custom 404 for the
  marketing host, no legal pages, and no blog — each remains a C05 §64 open
  decision rather than an invented feature.

## Excluded modules

- No operational application changes of any kind: no shell, POS, inventory,
  customers, exceptions, management, staff, sync, auth, or domain changes.
- No business-rule, permission, tenant-isolation, audit, or financial
  behaviour is added, changed, or duplicated in marketing copy beyond
  capability statements mapped to the specifications above.
- No pricing, refund, or trial terms are published (C05 §38).
- No analytics, tracking, or third-party scripts are added.

## Next integration step

When the acquisition path is decided, point the Get Started and Sign in
links at the real onboarding/authentication routes and re-run the landing
tests (they pin the current `/` destination intentionally). Then run the C11
redesign audit against the live page for generic-SaaS appearance, hierarchy,
spacing, CTA discipline, states, mobile behaviour, accessibility, filler
copy, and unsupported claims — as an audit layer only, never a second
product authority (C05 §59).
