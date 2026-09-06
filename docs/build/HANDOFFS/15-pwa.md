# Handoff 15 — PWA and device resilience

**Module:** PWA shell and device resilience  
**Status:** Implemented foundation; production API integration remains downstream  
**Date:** 2026-09-06

## Implemented

- Added `public/manifest.webmanifest` with standalone mobile display, theme/background colors, start URL/scope, and maskable SVG icon.
- Added `public/sw.js` application-shell service worker. It precaches the entry shell, uses network-first navigation with an offline `index.html` fallback, and stale-cache cleanup on activation.
- Registered the service worker from `src/main.tsx`; update detection is surfaced to the app and activated only after an explicit user action.
- Added online/offline connection visibility, pending sync count, storage-unavailable messaging, and update action to the shell. Pending state is read from the existing `LocalStorageStore`; no sync or business rules are duplicated.
- Added mobile-safe viewport/touch defaults (`100dvh`, 44px controls retained, tap-highlight and overscroll behavior) and a narrow-screen layout adjustment.

## Boundaries and behavior

The service worker owns only static shell/resource caching. It does not cache or mutate business/API responses. Domain operations remain authoritative in their existing modules and sync continues to consume the offline coordinator boundary. Local persistence failures are caught and shown without claiming that data was saved.

Reloading or starting offline serves the cached shell; reconnecting updates connection state and prompts a bounded service-worker update check. Existing write-ahead recovery and corruption preservation remain owned by `src/sync/offlineSync.ts`.

## Validation

- Focused UI test added for connection and sync status.
- Required commands run for this slice: `npm test`, `npm run lint`, `npm run build`.
- Manual browser checks still recommended: install prompt, first-load/offline reload, offline navigation, reconnect, update prompt, app restart, storage quota/private-mode failure, mobile viewport, and throttled network.

## Known limitations / unresolved decisions

- Production install icons may later add PNG sizes for platform-specific stores; SVG `any maskable` is sufficient for the current shell.
- Sync count is a local queue snapshot and intentionally does not infer server authority or retry policy.
- Background Sync, push notifications, API cache policy, and durable IndexedDB adapter remain downstream integration work.

## Excluded modules

No domain, authorization, tenant, audit, incentive, or offline-engine business logic was changed.
