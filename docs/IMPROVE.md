# Improve the harness

Run this at Deploy, after the review fixes and before the merge.

1. Look at what went wrong on this change: the review's findings, what the person corrected and what the checks caught. Find them in the review's report, the branch's fix commits (`git log main..HEAD`), what each phase found according to `plan.md` and the change's `docs/STATUS.md` entry, and ask the person what they corrected.
2. Look for an earlier time each mistake happened, in the "Seen once" notes in `docs/STATUS.md`.
3. For a mistake that has happened twice, add the correction to AGENTS.md or docs/REVIEW.md, or suggest a change to docs/STANDARDS.md for the person to make. If a tool can catch it, add it to the checks instead.
4. Add each mistake seen only once to the change's `docs/STATUS.md` entry, under "Seen once", so the next round can spot a repeat.
5. Remove anything out of date.
6. Improve this file, so that the next round makes a better change. Keep this as the last step.
