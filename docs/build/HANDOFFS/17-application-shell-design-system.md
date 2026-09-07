# Handoff 17 — Application Shell and Design System

**Module:** Cross-cutting application UI foundation (consumed by M05–M15 screens)  
**Status:** IMPLEMENTED FOUNDATION; domain screens remain downstream  
**Date:** 2026-09-06  
**Spec authority:** C00 (`11-ux-and-design-foundation.md`), C01 (`12-information-architecture.md`), C02 (`13-user-journeys-and-task-flows.md`), C03 (`14-design-system.md`), C04 (`15-application-shell-and-navigation.md`)

## Outcome

The repository now has one reusable application visual foundation instead of
the previous placeholder hero page. It implements the C03 design tokens and
the C04 adaptive hybrid shell as installable code:

- `src/ui/tokens.css` — the single Sabi Shop token system.
- `src/ui/` — shared component library (actions, inputs, tables, lists,
  status, feedback, overlays, confirmation, loading, states, money).
- `src/shell/` — the adaptive application shell, navigation model, system
  state, attention, and user menu.
- `src/App.tsx` — the shell wired to the existing PWA/sync boundaries with
  honest, unauthenticated Home content.

No screen invents its own fonts, colors, spacing, radii, buttons, status
colors, or icon family (C03-DEC-11). No marketing landing-page structure was
applied to the operational application.

## Design tokens (`src/ui/tokens.css`)

All values come from the authoritative C03 sections; screens consume the CSS
custom properties and must not introduce competing values.

| Token family         | Implemented system                                                                         | C03 source      |
| -------------------- | ------------------------------------------------------------------------------------------ | --------------- |
| Typography           | Geist (bundled variable font), Geist Mono for IDs/technical values                         | §6–7, DEC-02/03 |
| Type scale           | Display 48, H1 32, H2 24, H3 20, H4 18, Body L 16, Body 14, Body S 13, Caption 12, Mono 13 | §7              |
| Spacing              | Closed scale 0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96 px                             | §14, DEC-06     |
| Radius               | None 0, XS 4, SM 6, MD 8, LG 12, XL 16, Pill 999                                           | §16             |
| Semantic color roles | Primary, Neutral, Success, Pending, Warning, Danger, Info, Offline, Conflict, Integrity    | §10, DEC-04     |
| Surfaces             | App background → primary → raised → sunken/selected → exception                            | §12, DEC-05     |
| Motion               | 140/200/320 ms with `cubic-bezier(0.32,0.72,0,1)`; reduced-motion honored                  | §43–45          |
| Numbers              | Tabular figures for all data/money display                                                 | §9              |

Hex values are the operational light-theme starting values carried from the
established brand direction (`public/manifest.webmanifest` theme/background).
C03 section 69 still tracks final visual validation, dark theme, and exact
icon/motion validation as open decisions; this slice does not silently close
them. Fonts are bundled locally via Fontsource so the offline PWA never
depends on a network font request.

Icons use **Phosphor** (from the C03 §41 candidate families), one weight per
context, always paired with accessible text for state meaning — never color
or icon alone.

## Application shell (`src/shell/`)

Implements C04-DEC-01..15:

- **Desktop (≥1024px):** persistent left rail with grouped navigation
  (Work / Money / Activity / Management / System), collapsible to an
  icon-only rail with visually-hidden accessible labels; preference persists.
- **Tablet (768–1023px):** compact icon rail; collapse control hidden.
- **Mobile (<768px):** bottom navigation for Home, Sell, Activity, and a
  grouped **More** drawer for the remaining authorized destinations.
- **Header:** brand + active business context, attention indicator,
  system-state indicator, user menu. Account actions only in the user menu.
- **System state:** Online / Offline / `Sync pending · n` / `Conflict · n` /
  storage warnings, derived from the existing `LocalStorageStore` queue; the
  indicator opens a state drawer. Locally recorded work is never labeled as
  failed (C03 §38).
- **Role-aware navigation:** `navigationFor(permissions)` filters destinations
  by the real `src/auth` permission model. Staff do not see Suppliers,
  Money, or Management. Navigation visibility is presentation only and is
  never treated as authorization (C04 §15).
- **Unauthenticated state:** only Home is visible; the workspace shows the
  authorization-required state. No fake session, business, or metrics are
  rendered anywhere.

## Component library (`src/ui/`)

**Actions:** `Button` (primary/secondary/ghost/danger, sizes, loading,
disabled, icon slots), `IconButton` (accessible label required).

**Forms:** `Field` (label/hint/error wiring), `TextInput`, `CurrencyInput`
(explicit ₦ context, decimal input mode), `SearchInput`, `Select`,
`Textarea`, `Checkbox`, `Radio`.

**Data:** `DataTable` (numeric right-aligned tabular columns, mono IDs,
caller-provided empty state), `Table*` primitives, `DataList`/`ListItem`
(compact record rows), `Money` + `formatKobo` (integer-kobo → naira, no
floats in business display).

**Status system:** `Status` (icon + label + explanation, ten tones),
`Badge` (compact, use sparingly), `statusIconFor`.

**Feedback:** `Alert` (info/success/pending/warning/danger/offline/conflict/
integrity with action slot), `ToastStack` + `useToasts` (low-risk
confirmations only; consequential results must be visible in the workflow).

**Overlays:** `Dialog` (focused confirmation/authorization), `Drawer`
(contextual panel, bottom sheet on mobile), both with focus management,
Escape/backdrop behavior, and a `dismissable` flag so consequential
confirmations cannot be dismissed accidentally.

**Deliberate confirmation:** `ConfirmationPanel` — action, affected record,
expected effects, authorization note, mandatory reason field for corrections
(B08), confirm/cancel. This is the "deliberate for consequential work"
primitive; it never resembles deletion.

**Loading:** `Skeleton`/`SkeletonList` (layout-preserving), `Progress`
(determinate/indeterminate). No whole-application spinners.

**States:** `StateMessage` plus the canonical vocabulary — `LoadingState`,
`EmptyState`, `ErrorState`, `PermissionDeniedState`,
`AuthorizationRequiredState`, `OfflineState`, `SyncPendingState`,
`SyncConflictState`, `CorrectionRequiredState`, `RejectedState`,
`CompletedState`, `CancelledState`. `src/auth/AuthStates.tsx` now re-exports
the shared presentation so authorization states look identical everywhere.

Every state answers: what happened, why it matters, and what can be done
next. None is a blank panel or a raw error code.

## Boundaries preserved

- UI code is not a source of business truth; it consumes `src/auth`,
  `src/sync`, and `src/pwa` boundaries without duplicating rules.
- Navigation hiding is not authorization; operations authorize at service
  boundaries as before.
- No business data, metrics, customers, or balances were invented; Home
  shows only honest foundation and access status.
- No completed-record deletion affordances or destructive-looking controls
  were introduced.
- The service worker, sync engine, and storage behavior are unchanged.

## Files changed

- Added: `src/ui/` (tokens, base and component styles, component library,
  tests), `src/shell/` (AppShell, navigation model, indicators, PageHeader,
  shell styles, tests).
- Rewrote: `src/App.tsx` (shell wiring), `src/index.css` (token imports),
  `src/App.test.tsx`.
- Updated: `src/auth/AuthStates.tsx` (shared presentation),
  `package.json`/`package-lock.json` (Geist/Geist Mono via Fontsource,
  Phosphor icons, `@testing-library/user-event` dev dependency).
- Added `.gitattributes` enforcing LF checkout for text files. The local
  `format:check` failure on six legacy files was not content drift: the
  repository blobs are already all-LF, but a Windows clone with
  `core.autocrlf=true` checks them out as CRLF, which Prettier
  (`endOfLine: lf`) rejects. `git add --renormalize .` confirmed zero
  content change for those files; `.gitattributes` makes the format gate
  platform-independent instead of masking the cause.

## Tests and validation

New coverage: button states, field/error wiring, currency/search inputs,
table alignment and empty state, status semantics, alert semantics, overlay
open/close behavior, confirmation reason enforcement, the full state
vocabulary, money formatting (bigint-safe), progress semantics, toast
push/dismiss, role-aware navigation filtering (staff vs manager vs no
session), shell rendering/navigation/More drawer, and the system-state
indicator matrix (online, sync pending, conflict, offline).

```text
npm ci                                       PASS
npm run format:check                         PASS
npm test                                      PASS (134 tests)
npm run lint                                  PASS (0 warnings)
npm run build                                 PASS (fonts bundled locally)
npx tsc -b                                    PASS
npx prettier --check <changed files>          PASS
git diff --check                              PASS
```

Manual browser check: production build served and verified — header, rail,
workspace, states, and locally bundled fonts render; mobile viewport uses
the compact layout.

## Known limitations / unresolved decisions

- Final brand hex values, dark theme, final typeface validation, exact icon
  family validation, and motion curve validation remain open per C03 §69;
  the current values are the documented starting system, not a silent
  decision.
- Breakpoint values (768/1024) are implementation starting points per C04
  §41 and should be validated in C11 representative workflows.
- There is no router yet; area switching is state-based. Domain slices
  (C06+) will choose the routing approach without redesigning the shell.
- Global search has a defined shell position but no implementation; the
  mobile Search destination is omitted until search exists (no dead links).
- POS exit protection hooks (C04 §34–35) are documented for C06; the shell
  exposes `onNavigate` for apps to guard in-progress work.
- Overlay entry/exit animation is intentionally minimal; native `dialog`
  behavior is used. jsdom lacks `showModal`, so an `open`-attribute fallback
  covers tests.
- The attention indicator currently surfaces local sync conflicts; the full
  management attention queue belongs to C09/C10.

## Excluded modules

No domain screens (POS, inventory, customers, suppliers, money, management),
no authentication/session UI, no business metrics or reports, no router, no
backend/API adapter, and no changes to sync, audit, or authorization logic.

## Next integration step

The POS slice (C06 / M07 UI) should build the Sell workspace inside
`AppShell` using the `src/ui` components, wire a real session through
`navigationFor(effectivePermissions(...))`, and add the sale-in-progress
navigation guard.
