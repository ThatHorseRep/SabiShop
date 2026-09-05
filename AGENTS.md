# Sabi Shop Agent Instructions

These rules apply to every coding agent working in this repository (Claude Code, Cursor, Windsurf, Codex, and others).

## Environment

- Use Node 20.19+ as required by `package.json`.
- Install dependencies with `npm ci`.

## Required validation commands

Run all of these before declaring work complete:

```bash
npm test
npm run lint
npm run build
```

Run relevant formatting checks on changed files only. Do not reformat the entire repository; it contains intentional formatting drift outside active slices.

## Read first

Before coding, read:

- `SabiShopProductBible.md`
- Relevant business-rule documents (`docs/H01`–`docs/H11` and numbered product docs)
- Relevant technical handoffs in `docs/build/HANDOFFS/`
- `docs/build/BUILD-STATUS.md`
- `docs/build/BUILD-MASTER-PLAN.md`

## Branch and PR workflow

- Use feature branches named `thathorserep-<slice-name>`; never work directly on `master`.
- Start each slice from an up-to-date `master`:

```bash
git switch master
git pull --ff-only origin master
git switch -c thathorserep-<slice-name>
```

## Scope and safety

- Keep changes strictly scoped to the requested slice. Do not modify unrelated modules.
- Do not invent unresolved business rules; ask or record them as unresolved decisions.
- Preserve tenant isolation and authorization boundaries.
- Preserve immutable historical records and auditability.
- Do NOT implement incentive payout logic in the catalog/pricing module.

## Documentation

For every completed slice:

- Update the slice handoff in `docs/build/HANDOFFS/<sequence>-<slice-name>.md`.
- Update `docs/build/BUILD-STATUS.md`.
- Record files changed, business rules used, authorization/tenant boundaries, historical/audit behavior, tests passed, commands that could not run and why, known limitations, unresolved decisions, and excluded modules.

## Tests

- Create focused tests for the behavior you implement.
- Run targeted tests during development, then the full suite before finishing.

## Approval gates

- Do not commit without explicit user approval.
- Do not push or create a PR (use `gh pr create --draft`) without explicit user approval.
- Never merge unless explicitly instructed.
- Before any publishing action, show: files to commit, branch, proposed commit, draft PR title/description, and validation results.
