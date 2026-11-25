# Accountable

## Where to find things

- `docs/spec.md`: read this first. It describes the whole product as it stands today and is the authority on how it behaves.
- `docs/changes/<branch name>/`: one folder per change, named after its branch, with `intent.md` (why and what) and `plan.md` (how). Read only the folder for the current branch; the other folders are past changes and aren't current.
- `docs/TECH_STACK.md`: the stack
- `docs/STATUS.md`: what's done so far

When a change alters what the product does, update `docs/spec.md` to match in the same branch.

Update `docs/STATUS.md` when you finish a piece of work

## Testing

Run `npm test` before you call a piece of work done, and fix anything that fails. It runs the backend (Jest and Supertest), frontend (Vitest) and end-to-end (Playwright, needs Google Chrome) tests, keeps going after a failing suite, prints a pass/fail summary and exits non-zero if any test failed. It starts the app itself, so nothing else needs to be running.

## Commits

Write short, objective commit messages: a subject line of 72 characters or fewer saying what changed. Add a body of one or two lines only when the reason isn't clear from the diff.
