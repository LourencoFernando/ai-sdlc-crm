# Plan: dark mode

This plan turns `docs/changes/dark-mode/intent.md` into work. Requirement IDs (G11, P10…) refer to `docs/spec.md`, which already describes the product with dark mode. The brand reference (`.claude/skills/brand/DESIGN.md`) already has the role and hue tokens, their light and dark values, and the checked contrast pairs. The mockups are in `docs/mockups/3-dark-mode/`.

No new dependencies. The mode is one attribute on `<html>`, a saved string in the browser's storage and CSS custom properties. React state covers the switch, and Lucide already has the `Moon` icon.

## Files that change

### Frontend (`frontend/`)

| File | Change |
|------|--------|
| `index.html` | Links `tokens.css` and `global.css` so the first paint is styled. A small inline script in `<head>`, before any stylesheet or module, that reads `accountable.theme` from `localStorage` and sets `data-theme="dark"` or `"light"` on `<html>`. A missing value, an unknown value or storage that throws all mean light. Its comment names `app/theme-state.ts`, which uses the same key |
| `src/main.tsx` | No longer imports `tokens.css` and `global.css`; `index.html` links them instead (found in Phase 4: with `npm run dev`, styles imported by the script arrive only after the script runs, so the first paint was unstyled and white) |
| `src/styles/tokens.css` | Becomes a copy of the brand's CSS block: role and hue tokens on `:root` (light, with `color-scheme: light`) and `:root[data-theme="dark"]` redefining the same color and shadow tokens (with `color-scheme: dark`). Drops `--color-ink`, `--color-slate`, `--color-iron`, `--color-fog`, `--color-mist`, `--color-pebble`, `--color-cloud`, `--color-snow`, `--color-shadow-dust`, `--color-violet-deep`, `--color-periwinkle`, `--surface-canvas` and `--surface-panel` |
| `src/styles/global.css` | Every color moves to the role or hue token for what it does (see the mapping under Phase 2). The four raw colors become tokens: Delete hover `#a92a40` → `--color-alert-fill-hover`, dialog backdrop → `--color-backdrop`, column bar track → `--color-track-on-pastel`, drop place fill → `--color-drop-place`. Dialogs, menus, popovers and select lists use `--color-surface-raised`. Tooltips and toasts use `--color-inverse` and `--color-on-inverse`. Text on Violet and Alert fills uses `--color-on-fill`. New styles for the Dark mode row and its pill switch |
| `src/features/dashboard/dashboard.css` | Follow-ups panel outline `#dccbe9` → `--color-lavender-border`; its segmented control track → `--color-inset-on-pastel`; renamed tokens |
| `src/features/dashboard/Charts.tsx` | Renamed tokens: axis text `--color-text-muted`, gridlines `--color-divider`, point fill `--color-surface`, bar hover cursor `--color-surface-hover`, Lost bars and legend `--color-text-muted` |
| `src/lib/stages.ts` | Lost column header pastel `--color-snow` → `--color-surface`; Lost chart color `--color-slate` → `--color-text-muted` |
| `src/app/theme-state.ts` (new) | `readTheme()`, `writeTheme()`, `applyTheme()` (sets the `<html>` attribute) and `useTheme()`, shaped like `sidebar-state.ts`. Storage errors mean light and an unsaved choice, as for the sidebar |
| `src/app/Sidebar.tsx` | New `dark` and `onToggleDark` props. A "Dark mode" row just above "Collapse menu": a `button` with `role="switch"` and `aria-checked`, the `Moon` icon, the words and the pill switch. When collapsed, it shows the icon only, keeps its accessible name, and uses the existing `Tip` for its tooltip |
| `src/app/Layout.tsx` | Uses `useTheme()` and passes it to the sidebar |
| `src/styles/tokens.test.ts` (new) | The token guard and contrast tests (see Proof) |
| `src/app/theme-state.test.ts` (new) | Unit tests of the saved mode |
| `src/app/Sidebar.test.tsx` | Tests for the switch |

### End to end (`e2e/`)

| File | Change |
|------|--------|
| `dark-mode.spec.ts` (new) | The dark mode end-to-end tests (see Proof) |

### Docs

| File | Change |
|------|--------|
| `docs/spec.md` | Already updated. One wording fix in Layout: forms open in modal dialogs, so the switch can't be reached while a form is open. "Without losing anything typed into an open form" becomes "without reloading the page" |
| `docs/changes/dark-mode/*.png` | `dashboard-light.png`, `dashboard-dark.png`, `pipeline-light.png`, `pipeline-dark.png` (success criterion 3) |
| `docs/STATUS.md` | A line for each finished phase |

`.claude/skills/brand/DESIGN.md` and `docs/mockups/3-dark-mode/` are already done. They only change if the by-eye pass in Phase 4 finds a color that doesn't work, and then the brand reference, `tokens.css` and the mockups change together.

## Order of work

Each phase ends with `npm run check:quick` passing, and Phase 5 ends with `npm run check`.

### Phase 1: Baseline and guards

1. **Light-mode baseline.** Before touching any style, run a one-off Playwright script (in the scratchpad, not the repo) against a freshly seeded app. It visits every route and opens a dialog, a menu, a tooltip and a toast. For every element it records the computed `color`, `background-color`, the border colors, `fill`, `stroke`, `box-shadow` and `outline-color` to a JSON file. This is the record of how light mode looks today.
2. **Guard tests.** Write `src/styles/tokens.test.ts` (see Proof). It fails now: `tokens.css` doesn't match the brand yet, and `global.css`, `dashboard.css`, `Charts.tsx` and `stages.ts` still use raw colors or the old names.

### Phase 2: Rename tokens and remove raw colors (light mode only)

1. Replace the light block of `tokens.css` with the brand's light block. No dark block yet.
2. Move every use to the token for its role. Most moves follow one rule, and a few depend on where the color is used:

   | Old | New |
   |-----|-----|
   | `--color-ink` as text | `--color-text` |
   | `--color-ink` as a tooltip or toast background | `--color-inverse` (with `--color-on-inverse` text) |
   | `--color-slate` | `--color-text-muted` |
   | `--color-iron` | `--color-text-faint` |
   | `--color-cloud`, `--surface-canvas` | `--color-canvas` |
   | `--color-snow` as a panel, card, sidebar, input or row | `--color-surface` |
   | `--color-snow` as a dialog, menu, popover or chart tooltip | `--color-surface-raised` |
   | `--color-snow` as text on Violet or Alert | `--color-on-fill` |
   | `--color-violet-deep` as text, link, focus ring or avatar initials | `--color-violet-text` |
   | `--color-violet-deep` as a button hover fill | `--color-violet-hover` |
   | `--color-periwinkle` | `--color-surface-hover` |
   | `--color-alert` as a button fill | `--color-alert-fill` |
   | `--color-pebble`, `--color-mist`, `--color-fog`, `--color-shadow-dust` | `--color-border-input`, `--color-border-soft`, `--color-border-disabled`, `--color-divider` |

3. Turn the six raw colors into their tokens.
4. Run the baseline script again and compare. **The two JSON files must be identical.** Any difference is a wrong role choice and is fixed before moving on.
5. The guard tests pass, except the one that compares the dark block with the brand.

### Phase 3: Dark tokens, saved mode and the switch

1. Add the dark block to `tokens.css`. The guard tests now all pass, including the contrast pairs.
2. `theme-state.ts` and its tests.
3. The inline script in `index.html`.
4. The Dark mode row in `Sidebar.tsx` and its styles, wired through `Layout.tsx`, with the Sidebar tests.
5. Run the baseline comparison once more with light mode on. It must still be identical, which proves the switch row adds no change elsewhere.

### Phase 4: Every screen in dark mode

Use the app in a real browser in dark mode, the way a salesperson would. Check each screen against `docs/mockups/3-dark-mode/` and the spec's Dark mode section:

- the dashboard, including chart tooltips and hover
- each table, including the status filter, row hover, sorting and paging
- each record page and its timeline
- the pipeline, including a drag (lifted card, drop place), the keyboard move and the Won and Lost lists
- every form, with its errors, selects, comboboxes, the date inputs and the checkboxes
- the delete confirmations and the "Discard your changes?" dialog
- toasts, loading placeholders and the "Can't reach Accountable" page
- the collapsed sidebar and its tooltips

Fix anything wrong with a token only, never a dark-mode override in a component. If a dark value itself needs changing, change it in the brand reference, `tokens.css` and the mockup set together, and re-check its contrast pairs.

### Phase 5: End-to-end tests, screenshots and finish

1. `e2e/dark-mode.spec.ts`.
2. Take the four screenshots into `docs/changes/dark-mode/` with a one-off Playwright script against a freshly seeded app, at 1440px wide, full page, after the sidebar has settled.
3. Fix the spec wording (see Docs).
4. Update `docs/STATUS.md`, then run `npm run check`.

## Risks

| Risk | What we do about it |
|------|---------------------|
| **Light mode changes by accident.** Renaming over 100 token uses by hand could put one in the wrong role, such as a dialog that should be raised but is set to the plain surface. In light mode that difference is invisible today and would only show in dark mode. | The computed-style baseline must match exactly after Phases 2 and 3. Phase 4's dark pass catches roles that are equal in light but differ in dark. |
| **A flash of light mode on load.** If the mode is set by React, the first paint is light. | The inline script in `<head>` sets the attribute before the stylesheets apply. An end-to-end test blocks every script file and checks that the page is already dark. |
| **The inline script and `theme-state.ts` drift apart.** They must agree on the key and the values, and the HTML can't import the TS constant. | Both name each other in a comment. The end-to-end reload test fails if they disagree, because the switch saves through `theme-state.ts` and the reload reads through the inline script. |
| **Storage is missing or throws** (private windows, blocked site data). | Both readers catch and fall back to light, and the switch still works for the session. Unit tests cover a throwing storage. |
| **Portals escape the theme.** Radix dialogs, menus, popovers and tooltips render into `<body>`, outside `#root`. | The attribute is on `<html>`, so every portal inherits it. An end-to-end test checks a dialog's background in dark mode. |
| **Charts keep light colors.** Recharts writes colors into SVG attributes. | `Charts.tsx` already passes `var(--…)` strings, which Chrome resolves in presentation attributes. They switch with the tokens, and the end-to-end test checks a gridline's computed stroke in dark mode. |
| **Native controls stay light.** Date pickers, checkboxes and scrollbars are drawn by the browser. | `color-scheme` is set with the tokens in each mode, and Phase 4 checks the date inputs and checkboxes. |
| **Hard-coded colors creep back later.** | The guard test fails on any hex, `rgb()`, `rgba()` or `hsl()` color in `frontend/src` outside `tokens.css`. |
| **`tokens.css` and the brand drift apart.** | The guard test compares both blocks with the brand's CSS block, token by token. |
| **Contrast slips when a dark value is tuned in Phase 4.** | The contrast test computes every pair listed in the brand's Contrast section from `tokens.css`, for both modes. |
| **A flicker when switching.** Elements with a CSS transition on `background-color` could animate between modes. | No transition is added for the switch. If one shows in Phase 4, disable it while switching, through a short-lived class on `<html>` in `applyTheme()`. |
| **Coverage drops below 80%.** | `theme-state.ts` and the switch have their own unit tests. The guard test reads files and adds no app code. |

## Proof

### Frontend unit tests (Vitest)

**`src/styles/tokens.test.ts`** reads the files from disk.

- `tokens.css` has every token in the brand's light block with the same value, and the brand's dark block matches the `:root[data-theme="dark"]` block token by token.
- The dark block only redefines tokens that the light block defines, and both blocks set `color-scheme`.
- No hex, `rgb()`, `rgba()` or `hsl()` color appears in any `.css`, `.ts` or `.tsx` file under `src/` other than `tokens.css`. Test files and the SVG favicon in `index.html` are outside this check.
- Every `var(--color-…)` and `var(--shadow-…)` used under `src/` is defined in `tokens.css`. This catches a misspelt or old name such as `--color-snow`.
- **Contrast, light mode:** text on the surface and on each pastel is at least 4.5:1, muted text on the surface and canvas, violet text on the surface, white on Violet and on the Alert fill, Alert on the surface and on Alert Wash. Each chart color on the surface is at least 3:1.
- **Contrast, dark mode:** every pair in the brand's dark list, using the values from `tokens.css`. Text and muted text on canvas, surface, raised, hover and each pastel; faint text on the surface (3:1); violet text on surface, canvas, raised, Periwinkle Wash, Lavender and hover; white on Violet, Violet hover and the Alert fill; text on inverse; Alert on surface, raised and Alert Wash; Forest on surface and raised. Each chart color (Ocean, Ultra Violet, Ember, Violet, Forest, muted text, Alert) on the surface is at least 3:1.

**`src/app/theme-state.test.ts`**

- With nothing saved, the mode is light.
- A saved `dark` reads as dark, and a saved unknown value reads as light.
- `writeTheme` saves the choice, and `applyTheme` sets `data-theme` on `<html>`.
- When storage throws on read or write, the mode is light and the switch still changes it.
- `useTheme` starts from the saved mode, and switching updates the attribute and the saved value.

**`src/app/Sidebar.test.tsx`**

- There is a switch named "Dark mode", just above "Collapse menu", and it is off by default.
- Clicking it, or pressing Space or Enter on it, turns it on (`aria-checked="true"`), sets `<html data-theme="dark">` and saves the choice. A second click turns it off.
- It starts on when dark was saved.
- When collapsed, it keeps its accessible name and shows a "Dark mode" tooltip on hover or focus.

### End-to-end tests (Playwright, installed Chrome): `e2e/dark-mode.spec.ts`

- **Default:** with nothing saved, the app opens in light mode. `<html>` is `light`, the switch is off and the page background is `rgb(245, 246, 248)`.
- **Switch and reload (success criterion 2):** turning dark mode on makes the page background `rgb(20, 21, 27)` and the switch report on. After a reload it is still dark and on. Turning it off and reloading brings back light mode.
- **No flash:** with dark saved, load the page with every script file blocked, so only the inline script runs. `<html>` is already `dark` and the body background is already dark.
- **No reload:** set a marker on `window`, switch the mode, and the marker is still there.
- **Every screen follows:** in dark mode, visit the dashboard, organizations, contacts, deals, a record page and the pipeline, with no console errors on any of them. Check the canvas, a panel background and the text color against the dark tokens.
- **Portals and charts:** in dark mode, a dialog (New deal) has the raised dark background, a sidebar tooltip uses the inverse colors, a toast after saving uses the inverse colors, and a dashboard chart gridline has the dark divider stroke.
- **Collapsed sidebar:** collapsed, the switch is reached by its name, works, and the choice still holds after a reload.

The existing end-to-end tests run unchanged in light mode. That they all still pass is part of the proof that light mode didn't change.

### By eye

- After Phases 2 and 3, the light-mode computed-style comparison shows no difference.
- Phase 4's walk through every screen in dark mode, against `docs/mockups/3-dark-mode/`.
- The four screenshots in `docs/changes/dark-mode/` show the dashboard and the pipeline in both modes, and they match the mockups.
