# Intent: dark mode

## Problem

Accountable only has a light mode, and some people prefer a dark screen.

## Proposed outcome

A dark mode with a toggle on every page, across every section.

- The toggle is a "Dark mode" switch at the bottom of the sidebar, just above "Collapse menu". When the sidebar is collapsed it shows the moon icon only, with a tooltip, like the other items.
- The dark palette, with its contrast pairs checked, is in the brand reference (`.claude/skills/brand/DESIGN.md`) and shown in `docs/mockups/3-dark-mode/`. It is copied into `frontend/src/styles/tokens.css`, so tokens.css stays a copy of the brand.
- Neutral color tokens are renamed by role (`--color-text`, `--color-surface`, `--color-violet-text`…), so their names stay true in dark mode; hue tokens (`--color-mint`, `--color-ocean`…) keep their names. Every component moves to the new names.
- The raw colors in component styles today (the Delete hover, the dialog backdrop, the column bar track, the drop place fill, and the follow-ups panel's outline and segmented control) become tokens, with the same light values.

## Constraints

- Light mode stays the default, and the app remembers the choice per browser, like the collapsed sidebar. The saved mode is applied before the first paint, so a dark page never flashes light on load.
- Light mode looks exactly as it does today, apart from the toggle.
- Colors stay in one place, as tokens, with no scattered overrides.
- Text in dark mode meets the same contrast rules as spec.md.
- Charts, dialogs and messages follow the mode too.
- No new dependencies unless the plan makes the case for one.

## Not in this change

- Following the device's own dark mode setting.
- A layout for phones.

## Success criteria

1. npm run check passes.
2. A new end-to-end test proves that the toggle works and is remembered after a reload.
3. Screenshots of the dashboard and the pipeline in both modes are saved in docs/changes/dark-mode/.
