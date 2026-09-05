# Development

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer

## Install and run

```sh
npm ci
npm run dev
```

Vite prints the local URL. Use `npm run preview` to serve the production build
locally after `npm run build`.

## Checks

```sh
npm run format:check
npm run lint
npm run test
npm run build
```

These are the same baseline checks enforced by GitHub Actions. `npm run
format` applies the repository's Prettier configuration.

## Configuration and secrets

Browser-exposed configuration uses Vite's `VITE_` prefix and must contain only
public values. Copy `.env.example` to a local `.env` file for development.
Never put service credentials, signing keys, database administrator
credentials, or other secrets in `VITE_*` variables or committed files.
Server-side secrets belong in the eventual backend/runtime secret store.

## Errors and logs

The application boundary renders a safe recovery message for uncaught UI
errors and logs diagnostic details through `console.error` without exposing
secrets. Feature modules must surface expected failures explicitly, preserve
the distinction between validation, authorization, conflict, dependency, and
integrity errors, and use structured logging at service boundaries.

## Migrations

No database schema is introduced by the foundation. Once the authoritative
database is selected, every schema change must be a versioned migration
reviewed in CI; do not edit a shared environment manually. Migration checks
must be added to the CI baseline before domain persistence is enabled.

## Boundaries

UI code must not become the source of business truth. Domain commands,
authorization, tenant context, persistence, synchronization, and audit
evidence belong in explicit modules as they are introduced.
