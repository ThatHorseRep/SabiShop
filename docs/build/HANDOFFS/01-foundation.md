# Handoff 01 — Engineering Foundation

## What was implemented

- Added a React 19 + Vite 7 TypeScript application shell.
- Added strict project and Node-side TypeScript configurations.
- Added Vitest with a jsdom environment and a baseline application-shell test.
- Added ESLint flat configuration and Prettier configuration.
- Added environment guidance that keeps only public Vite configuration
  client-visible and excludes local secrets from source control.
- Added an accessible mobile-first shell with visible focus treatment, a
  status announcement, and an uncaught-render error boundary.
- Added a GitHub Actions baseline for install, formatting, lint, tests, and
  production build.
- Added `docs/DEVELOPMENT.md` with local development, checks, configuration,
  error, logging, and future migration conventions.

## Files and areas changed

Application and tooling are at the repository root (`package.json`,
`tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`,
`prettier.config.js`, `index.html`, `src/`). CI is in
`.github/workflows/ci.yml`. Developer guidance is in `docs/DEVELOPMENT.md`.

## Verification commands

```sh
npm ci
npm run format:check
npm run lint
npm run test
npm run build
```

## Dependency assumptions

Node.js 20.19+ and npm 10+ are required. Runtime dependencies are React and
React DOM. Vite, TypeScript, Vitest, jsdom, ESLint, and Prettier are
development dependencies. No backend, database, authentication provider, or
business-domain dependency is selected by this foundation.

## Public conventions established

- TypeScript is strict; source modules use ESM and `moduleResolution: Bundler`.
- npm lockfile installation (`npm ci`) is the reproducible install path.
- Formatting uses Prettier: no semicolons, single quotes, trailing commas.
- ESLint is the code-quality gate; Vitest is the unit/component test runner.
- CI runs formatting, lint, tests, and build for pushes to `master` and all
  pull requests.
- Client environment variables must be public `VITE_*` values only; secrets
  remain in managed server/runtime configuration.
- Feature boundaries must keep business truth, authorization, tenant context,
  persistence, synchronization, audit, UI, and logging concerns explicit.
- Uncaught UI errors render a safe recovery state and are logged with
  `console.error`; expected domain failures must be typed and surfaced rather
  than silently swallowed.
- Database changes will use reviewed, versioned migrations once persistence is
  introduced.

## Unresolved issues

- The authoritative backend/database and migration tool are intentionally not
  chosen in this foundation phase; the current specification package contains
  conflicting historical references and requires the database/tenancy phase to
  make the traceable decision.
- Authentication, tenancy enforcement, offline storage, synchronization, PWA
  service-worker policy, and accessibility automation remain future module
  work.

## Later modules must not break

- Do not introduce business rules, financial calculations, dashboards, POS
  workflows, inventory workflows, or unrestricted global data access into the
  application shell.
- Do not put secrets in client bundles or `VITE_*` variables.
- Preserve strict TypeScript, the npm scripts, CI checks, accessible focus and
  labels, and the error distinction/logging conventions.
- Domain persistence must add migration validation and tenant-isolation tests
  before becoming a release dependency.
