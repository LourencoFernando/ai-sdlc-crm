# Accountable

## Where to find things

- `docs/intent.md`: what we're building
- `docs/TECH_STACK.md`: the stack
- `docs/STATUS.md`: what's done so far

Update `docs/STATUS.md` when you finish a piece of work

## Testing

Run `npm test` before you call a piece of work done, and fix anything that fails. It runs the backend (Jest and Supertest), frontend (Vitest) and end-to-end (Playwright, needs Google Chrome) tests, keeps going after a failing suite, prints a pass/fail summary and exits non-zero if any test failed. It starts the app itself, so nothing else needs to be running.

## Commits

Write short, objective commit messages: a subject line of 72 characters or fewer saying what changed. Add a body of one or two lines only when the reason isn't clear from the diff.
