1.


Finish and publish this Sabi Shop slice.

1. Read the relevant product rules, technical handoffs, `AGENTS.md`,
   `docs/build/BUILD-STATUS.md`, and `docs/build/BUILD-MASTER-PLAN.md`.

2. Implement only this slice.

   - Preserve authorization, tenant isolation, audit history, and existing rules.
   - Do not change unrelated modules.
   - Add focused tests.

3. Run and report all checks:

```bash
npm ci
npm run format:check
npm run lint
npm test
npm run build
npx tsc -b --pretty false
git diff --check
```

Fix failures within this slice. Do not reformat unrelated legacy files.

4. Update the relevant handoff in `docs/build/HANDOFFS/` and
   `docs/build/BUILD-STATUS.md`.

5. Before publishing, show me:

- Branch name.
- Files to commit.
- Excluded unrelated files.
- Commit message.
- Pull request title and description.
- Results of all checks.

Wait for my approval.

6. After approval:

- Commit the approved files.
- Push the branch to GitHub.
- Create or update a draft pull request into `master`.
- Include the pull request URL in your final response.
- Report the commit SHA, branch name, PR number, and PR URL.
- Do not merge the pull request.
 





2.
The Sabi Shop slice has been reviewed and approved.

Merge its pull request into master. Do not modify unrelated files or start
another slice.









The smoothest setup is to make **GitHub, repository instructions, tests, and PRs** the shared source of truth. Then Claude Code, Cursor, Windsurf, Codex, or another coding agent can continue almost exactly where Copilot stopped.

## 1. Prepare the repository once

Clone the repository on the machine where you’ll use the other platform:

```bash
git clone https://github.com/ThatHorseRep/SabiShop.git
cd SabiShop
git switch master
git pull --ff-only origin master
npm ci
```

Verify the baseline:

```bash
npm test
npm run lint
npm run build
```

Use Node 20.19+ as required by `package.json`.

Create a persistent agent guidance file so every platform understands the project conventions. The most compatible filename is:

```text
AGENTS.md
```

Include:

- Run `npm ci`, `npm test`, `npm run lint`, and `npm run build`.
- Use feature branches; never work directly on `master`.
- Preserve tenant isolation, authorization boundaries, immutable historical records, and auditability.
- Read the relevant Product Bible and handoff documents before coding.
- Do not implement incentive payout logic in the catalog/pricing module.
- Keep changes scoped to the requested slice.
- Update the relevant handoff and `docs/build/BUILD-STATUS.md`.
- Create focused tests.
- Commit only after explicit approval.
- Push and create a draft PR only after explicit approval.
- Never merge unless explicitly instructed.

You can also add platform-specific instruction files if desired:

```text
CLAUDE.md       # Claude Code
.cursor/rules/  # Cursor
.windsurf/rules/ # Windsurf
```

Keep those files short and point them to `AGENTS.md` to avoid conflicting instructions.

## 2. Use the same branch-and-PR workflow

For each slice:

```bash
git switch master
git pull --ff-only origin master
git switch -c thathorserep-<slice-name>
```

Give the agent a prompt with four parts:

```text
You are working on the Sabi Shop <slice name>.

Read first:
- SabiShopProductBible.md
- <relevant business-rule documents>
- <relevant technical handoffs>
- docs/build/BUILD-STATUS.md

Implement only:
- <specific requirements>

Required:
- add focused tests
- preserve authorization and tenant boundaries
- preserve historical immutability
- update the slice handoff
- update docs/build/BUILD-STATUS.md
- run npm test, npm run lint, npm run build, and relevant formatting checks

Do not:
- modify unrelated modules
- invent unresolved business rules
- commit, push, merge, or create a PR without asking me first

Before making changes, show me the implementation plan and files in scope.
```

If the platform supports planning mode, approve the plan before allowing edits.

## 3. Recommended platform setups

### Claude Code

Install and authenticate using Anthropic’s current official instructions, then from the repository:

```bash
claude
```

Recommended workflow:

1. Start Claude Code from the repository root.
2. Let it read `AGENTS.md` and the relevant handoff files.
3. Ask for a plan first.
4. Approve implementation.
5. Ask it to run the targeted tests, lint, and build.
6. Review `git diff --stat` and `git status`.
7. Ask it to summarize the exact files and proposed commit/PR.
8. Explicitly approve commit and push.
9. Create the PR with GitHub CLI or the platform’s GitHub integration.
10. Review CI and merge from GitHub.

Useful final verification:

```bash
git diff --check
git status --short
gh pr checks <number>
```

### Cursor

1. Open the cloned repository as a project.
2. Add `AGENTS.md` at the repository root.
3. Add `.cursor/rules/sabishop.mdc` if you want Cursor-specific rules.
4. Enable project-wide indexing.
5. Use Agent mode for implementation and Ask mode for investigation.
6. Start each slice with the same plan-first prompt.
7. Keep the terminal commands visible and require the agent to run the project checks.
8. Use Cursor’s source-control panel to inspect the diff.
9. Commit and push only after your approval.
10. Open a draft PR and let GitHub Actions validate it.

For Cursor, avoid asking it to “fix all formatting” across the repository. Require it to format only changed files because the repository has existing formatting drift outside some slices.

### Windsurf

1. Open the repository folder.
2. Put shared rules in `AGENTS.md`.
3. Add `.windsurf/rules/sabishop.md` for Windsurf-specific behavior.
4. Use Cascade in planning mode first.
5. Require a file-scope declaration before edits.
6. Run tests and builds from the integrated terminal.
7. Inspect the diff before allowing commit.
8. Use the same branch and PR process as above.

### OpenAI Codex or another terminal coding agent

1. Clone the repository.
2. Install dependencies with `npm ci`.
3. Ensure the agent can access Git and GitHub CLI.
4. Place project instructions in `AGENTS.md`.
5. Start the agent from the repository root.
6. Use the same plan → implementation → validation → approval sequence.
7. Keep commit and push as explicit approval gates.
8. Use `gh pr create --draft` after pushing.

The key commands are:

```bash
git switch master
git pull --ff-only origin master
git switch -c thathorserep-<slice-name>

npm ci
npm test
npm run lint
npm run build

git status --short
git diff --check

git add <scoped-files>
git commit -m "Implement <slice>"
git push -u origin thathorserep-<slice-name>

gh pr create --draft \
  --base master \
  --head thathorserep-<slice-name> \
  --title "<PR title>" \
  --body "<PR description>"
```

## 4. Configure GitHub CLI once

Authenticate:

```bash
gh auth login
gh auth status
```

For each PR:

```bash
gh pr view <number> --json state,isDraft,mergeable,statusCheckRollup,url
gh pr checks <number> --watch
```

After approval:

```bash
gh pr ready <number>
gh pr merge <number> --merge --delete-branch=false
```

Use `--delete-branch=false` if you want to preserve the feature branch for auditability or follow-up work.

## 5. Keep handoffs as the cross-platform memory

For every completed slice, maintain:

```text
docs/build/HANDOFFS/<sequence>-<slice-name>.md
docs/build/BUILD-STATUS.md
```

Each handoff should record:

- What was implemented.
- Files changed.
- Business rules used.
- Authorization boundaries.
- Historical/audit behavior.
- Tests and commands passed.
- Commands that could not run and why.
- Known limitations.
- Unresolved decisions.
- Explicitly excluded modules.

This is more reliable than relying on chat history, because every platform can read it from Git.

## 6. Use a consistent approval gate

Before committing, require the agent to show:

```text
Files to commit:
...

Branch:
...

Proposed commit:
...

Draft PR title:
...

Draft PR description:
...

Validation:
...
```

Then approve with a clear instruction such as:

```text
Approved. Commit only those files, push this branch, and create the draft PR.
Do not merge.
```

For merging:

```text
PR approved. Verify the current GitHub state and passing checks, then merge it
into master. Do not modify unrelated files or start another slice.
```

This preserves the exact workflow used for Sabi Shop: scoped implementation, evidence-based validation, explicit publishing approval, draft PR, CI confirmation, and separate merge approval.