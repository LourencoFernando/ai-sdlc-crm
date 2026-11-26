# Accountable

## Where to find things

- `docs/spec.md`: read this first. It describes the whole product as it stands today and is the authority on how it behaves.
- `docs/changes/<branch name>/`: one folder per change, named after its branch, with `intent.md` (why and what) and `plan.md` (how). Read only the folder for the current branch; the other folders are past changes and aren't current.
- `docs/TECH_STACK.md`: the stack
- `docs/STANDARDS.md`: the coding standards every change follows
- `docs/STATUS.md`: what's done so far

When a change alters what the product does, update `docs/spec.md` to match in the same branch.

Update `docs/STATUS.md` when you finish a piece of work

At Deploy, after the review fixes and before the merge, follow `docs/IMPROVE.md`.

## Checks and testing

Run `npm run check` before you call a piece of work done, and fix anything that fails without weakening a rule. If a rule doesn't suit the code, ask first. It runs Prettier, ESLint (recommended TypeScript, React Hooks and accessibility rules, and a cyclomatic complexity of at most 15 per function), tsc for the frontend and backend, gitleaks over the git history and the working tree, and `npm test`. It keeps going after a failing check, prints a pass/fail summary and exits non-zero if any check failed. It needs gitleaks installed.

- `npm run check:quick`: the same checks without the end-to-end tests, for while you work.
- `npm run format`: fixes the formatting.
- `npm test`: the backend (Jest and Supertest), frontend (Vitest) and end-to-end (Playwright, needs Google Chrome) tests. The backend and frontend suites fail below 80% coverage of statements, branches, functions or lines. It starts the app itself, so nothing else needs to be running.

## Commits

Write short, objective commit messages: a subject line of 72 characters or fewer saying what changed. Add a body of one or two lines only when the reason isn't clear from the diff.

## Hooks

- A lefthook pre-commit hook (`lefthook.yml`, installed by `npm install`) formats the staged files and adds the fixes to the commit, then runs ESLint on them, tsc and gitleaks over the staged changes. It skips the tests.
- A Claude Code Stop hook (`.claude/hooks/check-on-stop.mjs`) runs `npm run check:quick` when you finish a turn and sends any failure back once. Fix it rather than stopping again.
- A Claude Code PreToolUse hook (`.claude/hooks/protect-env.mjs`) blocks edits to any `.env` file. Ask the user to change it.
- GitHub Actions (`.github/workflows/ci.yml`) runs one `check` job on every push: gitleaks over the history and working tree first, then `npm run check` with the runner's Google Chrome. A failed run uploads the Playwright report.
