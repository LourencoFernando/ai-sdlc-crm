# Plan: building the Accountable MVP

This plan turns `docs/spec.md` into work. Requirement IDs (G1, T3, P4…) refer to the spec. The stack is in `docs/TECH_STACK.md`.

## Files that change

Nothing has been built yet, so almost every file below is new.

### Repo root

| File | What it is |
|------|------------|
| `package.json` | npm workspaces (`frontend`, `backend`) and the `dev`, `test` and `seed` scripts, using concurrently |
| `package-lock.json` | Lock file for all workspaces |
| `playwright.config.ts` | Playwright Test with the installed Chrome (`channel: "chrome"`). It starts the app on its own ports with a temporary database |
| `.gitignore` | Add `data/`, `dist/`, `coverage/`, `test-results/`, `playwright-report/` |
| `docs/STATUS.md` | How to run the app, and a line per finished phase |

### Backend (`backend/`)

The backend has three layers, and each depends only on the one below it:

- **Controllers** read and check the request, and return the response. They hold no rules.
- **Services**, one per module, load and save with Prisma. They run each change that touches more than one table inside a single transaction, and call the domain for every decision. A service never calls another module's service, so the modules can't depend on each other in a circle. Work that crosses tables, such as a contact delete that unlinks deals and deletes activities, uses Prisma directly inside the owning service's transaction.
- **Domain** (`src/domain/`) is plain TypeScript with no Nest and no Prisma: the stage rules, dates, late and follow-up status, delete effects and dashboard figures. It takes data in and gives decisions back, so it can be tested without a database.

| File | What it is |
|------|------------|
| `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `jest.config.ts` | NestJS app setup and its tests |
| `prisma/schema.prisma` | The four tables, indexes and SQLite datasource from the Data model |
| `prisma/migrations/` | The first migration, made by `prisma migrate dev` |
| `src/main.ts` | Starts Nest under `/api`, with the error filter and validation pipe |
| `src/app.module.ts` | Wires the modules |
| `src/config/database.ts` | Database path from `ACCOUNTABLE_DB`, defaulting to `data/accountable.db` |
| `src/prisma/prisma.service.ts` | The shared Prisma client |
| `src/domain/stages.ts` | Stages, their order and probabilities: the one shared constant |
| `src/domain/industries.ts` | The industry list (O1) |
| `src/domain/dates.ts` | Calendar-date helpers: parse and check `YYYY-MM-DD`, compare, add days, month keys |
| `src/domain/deal-rules.ts` | What a stage change does: new probability, close date, the stage-change entry (D2, D3, D7), and late (D4) |
| `src/domain/follow-ups.ts` | Due soon and overdue (A5) |
| `src/domain/delete-effects.ts` | What a delete keeps, unlinks or deletes, used by both the preview and the delete (X1–X5) |
| `src/domain/dashboard.ts` | Works out B1–B7 from the rows it's given |
| `src/domain/positions.ts` | New positions in both columns after a move (P4, P6) |
| `src/common/api-exception.filter.ts` | Turns every error into `{detail, fields}` with 409 or 422 |
| `src/common/validation.ts` | The global validation pipe, set to 422 |
| `src/common/today.ts` | Reads and checks the `today` the frontend sends |
| `src/meta/` | `GET /api/meta` |
| `src/organizations/` | Controller, service, DTOs and delete preview (O1–O3, X1, X2) |
| `src/contacts/` | Controller, service, DTOs, status filter, delete preview, the change-organization check (C1–C4, X3) |
| `src/deals/` | Controller, service, DTOs, stage rules, `move`, delete preview (D1–D7, P4, P6, X4) |
| `src/activities/` | Controller, service, DTOs, the deal's main contact by default, timelines (A1–A6, X5) |
| `src/dashboard/` | Controller, and a service that loads the rows and hands them to `domain/dashboard.ts` |
| `src/seed/sample-data.ts` | Builds the sample data relative to a given today (S1–S4) |
| `src/seed/seed.ts` | `npm run seed`: clears and refills the database |
| `src/seed/seed-on-start.ts` | Seeds the database on start when it's empty (G4) |
| `src/test-support/` | `POST /api/test/reset`, loaded only when `ACCOUNTABLE_TEST=1` |
| `src/domain/*.spec.ts` | Unit tests of the domain, with no database |
| `test/` | Supertest API tests (see Proof) and a helper that makes a fresh, migrated database for each test file |

Migrations run with `prisma migrate deploy` in the npm scripts before the backend starts (`dev`, `test` and `seed`), not inside the app. The Prisma CLI is the supported way to apply them.

### Frontend (`frontend/`)

| File | What it is |
|------|------------|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html` | Vite app, with `/api` proxied to the backend |
| `src/main.tsx` | Entry point, fonts and global styles |
| `src/styles/tokens.css`, `src/styles/global.css` | Copy of the brand reference's custom properties, and base styles |
| `src/app/` | Router, layout, collapsible sidebar, query client, "Can't reach Accountable" screen (G9), toasts |
| `src/api/` | One typed function per endpoint, the error type and the shared response types |
| `src/lib/format.ts` | Money (full and short), dates, percentages |
| `src/lib/dates.ts` | Today, due soon, overdue, late, "3 days overdue" |
| `src/lib/stages.ts` | Stage and status colors (the probabilities come from `/api/meta`) |
| `src/lib/pipeline.ts` | Pure board logic: move a card, the index in the full column from a drop in a filtered or shortened list, column and board totals |
| `src/components/` | Button, Dialog, ConfirmDelete, DataTable, SearchBox, StatusPill, StagePill, Money, DateText, EmptyState, Skeleton, Avatar |
| `src/features/organizations/` | Table, form, record page |
| `src/features/contacts/` | Table with status filter, form, record page |
| `src/features/deals/` | Table, form with the contact list tied to the organization, record page |
| `src/features/activities/` | Timeline, activity form, follow-up checkbox |
| `src/features/pipeline/` | Board, columns, cards, Won and Lost lists, board search, the drag layer (sensors, drop detection, overlay, auto-scroll, announcements), the move queue and keyboard moves |
| `src/features/dashboard/` | Headline figures, the two charts, funnel, pipeline by stage, follow-ups, recent activity |
| `src/**/*.test.ts(x)` | Vitest tests next to the code they test |

### End to end (`e2e/`)

| File | What it covers |
|------|----------------|
| `e2e/fixtures.ts` | Calls `POST /api/test/reset` before each test and fails the test on any console error |
| `e2e/drag.ts` | Helpers that drag a card to a place with real mouse steps, and with the keyboard |
| `e2e/*.spec.ts` | One spec per area (see Proof) |

The intent, the spec, the tech stack and the brand skill don't change. If building shows the spec is wrong, fix the spec first.

## Order of work

Each phase ends with `npm test` passing and a commit. Rules are built test-first: write the failing test, then the code.

### Phase 1: Skeleton

1. Root `package.json` with workspaces, and the `dev`, `test` and `seed` scripts.
2. An empty NestJS app answering `GET /api/meta`, and an empty Vite app that calls it through the proxy.
3. Jest, Vitest and Playwright each with one passing test, so `npm test` runs all three from the start (G5).
4. Check that `npm run dev` prints the address on macOS, and that the scripts use nothing tied to one shell (G1).
5. Add only packages that pass the checks in [Packages](#packages), and commit `package-lock.json`.

### Phase 2: Data and rules (backend)

1. Prisma schema, first migration, `prisma migrate deploy` in the npm scripts, and the `ACCOUNTABLE_DB` setting.
2. The error filter and the 422 validation pipe.
3. The domain modules and their unit tests, before any service uses them.
4. Organizations, contacts and deals: create, read, list, update, with validation (O1, C1, D1) and unique email (409).
5. Deal stage rules: probability from the stage (D2), close date on Won or Lost (D3), stage-change entries (D7), main contact belongs to the organization.
6. `POST /api/deals/{id}/move`: positions and renumbering in one transaction (P4, P6).
7. Activities and timelines: the deal's main contact by default (A2), newest first (A3), follow-ups done and undone (A6).
8. Deleting and delete previews (X1–X5), and the contact changing organization check.
9. The dashboard endpoint (B1–B8).

### Phase 3: Sample data

1. `sample-data.ts` built from a given today, so it can be tested with a fixed date (S1–S4).
2. `npm run seed`, and seeding a new, empty database on start (G4).

### Phase 4: Frontend shell

1. Tokens, global styles and bundled Poppins (G2).
2. Layout with the collapsible sidebar, remembered per browser, and all routes with placeholder pages.
3. API client, query client, toasts, and the "Can't reach Accountable" screen with Retry (G9).
4. Shared components: Button, Dialog (with the unsaved changes warning), ConfirmDelete, pills, Money, DateText, EmptyState, Skeleton.

### Phase 5: Tables, forms and record pages

1. The shared DataTable: search, sort with three states, paging and empty states (T1–T3, T6).
2. Organizations, Contacts (with the status filter, C3) and Deals tables, with their forms and Late pills (D4).
3. Delete dialogs using the previews (T5, X1–X4).
4. Record pages (O3, C4, D6) with the timeline and the activity form (A1–A6).

### Phase 6: Pipeline

Drag and drop must work well, so this phase builds it in small steps, each tested before the next. See [Drag and drop](#drag-and-drop) for the design.

1. Board, columns, cards and totals (P1–P3), with Won and Lost as compact lists (P9), with no dragging yet.
2. The pure board logic in `lib/pipeline.ts` and its Vitest tests, before any drag code.
3. Dragging against local state only, with no saving: sensors, drop detection across columns, the overlay and placeholder, empty columns, cancel, auto-scroll (P10–P12). Check it by hand with a mouse and a trackpad.
4. Saving: the move queue, optimistic totals, taking the server's order, and the reload when a move fails (P4, P5, P13).
5. Keyboard moves and announcements (P7, P14).
6. Board search with dragging still on, and the Won and Lost index rule (P8, P11).
7. "Add deal" in a column (P6).
8. All the drag end-to-end tests pass ten runs in a row, so none of them is flaky.

### Phase 7: Dashboard

1. Headline figures and the overdue and late line (B1).
2. Revenue won line chart and the deals won and lost bars (B2, B3).
3. Sales funnel and pipeline by stage (B4, B5).
4. Follow-ups with tabs and the checkbox, and recent activity (B6, B7).

### Phase 8: Finish

1. Fill in the end-to-end specs not yet written, and fix any console errors (G8).
2. Check the layout at 1280px and 1024px (G6), keyboard use and focus rings, and contrast.
3. Check each screen by eye against the mockups and the spec (success criterion 8).
4. Write how to run the app in `docs/STATUS.md`.

## Risks

| Risk | What we do about it |
|------|---------------------|
| **Dates shift by a day.** Prisma stores SQLite `DateTime` as an instant, so a calendar date can move with the time zone. | Store every calendar date as a `YYYY-MM-DD` string, and compare dates in `common/dates.ts`. Test with a date near midnight and a month end. |
| **No raw SQL, but the dashboard needs month-by-month totals.** Prisma's `groupBy` can't group by month. | Fetch the deals closed in the last 12 months and add them up by month in TypeScript. That's fine at a few thousand rows. |
| **SQLite and the native driver on Windows and Node 26.** Prisma's SQLite adapter may need a native build if no prebuilt binary is out for Node 26 yet. | Try a clean install on Node 24 and 26 in Phase 1. If one fails, say which Node versions are supported in `docs/STATUS.md`. |
| **Unique email and letter case.** SQLite's unique index treats `Dana@x.com` and `dana@x.com` as different. | Save emails trimmed and in lowercase, and check for a duplicate in the service so the 409 can name the contact who has it. |
| **Delete rules live in the service, not in foreign keys.** X3 to X5 keep, unlink or delete depending on what's left, which cascades can't express. | Do each delete in one transaction in its service, and test every case, including X5's activity that relates to both. |
| **Drag and drop is the hardest part, and it must work well.** Moving within and between columns, filtered lists, quick moves, optimistic totals and failures can go wrong in small ways. | Follow [Drag and drop](#drag-and-drop): pure logic tested first, one move saved at a time, the server's order taken as the truth, and the full list of end-to-end cases run with a real mouse and the keyboard. |
| **"Today" differs between machines and tests.** | The frontend sends today. Backend tests and the seed take today as an argument, and dashboard tests use a fixed date. |
| **Sample data near the start of a month** could leave "Won this month" empty. | The seed always puts at least one won deal on today's date or earlier in the current month, and a test runs the seed on the 1st of a month. |
| **End-to-end tests depend on each other.** | Before each test, `POST /api/test/reset` reseeds the database, which exists only when `ACCOUNTABLE_TEST=1`. The tests run one at a time on their own ports. |
| **Playwright needs Google Chrome installed.** | `docs/STATUS.md` says so, and the config fails with a clear message if Chrome is missing. |
| **Backend tests sharing a database.** Jest runs test files in parallel. | Each test file gets its own migrated database file. |
| **A dangerous or compromised npm package.** | Follow [Packages](#packages). |
| **Offline (G2).** A library might fetch fonts or files from the web. | Bundle everything. An end-to-end test fails on any request that leaves `localhost`. |

## Drag and drop

The board must feel solid: a card always lands where it was dropped, the totals never disagree with the cards, and nothing is lost if a save fails. The spec's P4 to P14 say what the user sees. This is how we build it.

### Library

`@dnd-kit/core` and `@dnd-kit/sortable`, the stable releases, with one sortable list per column inside a single drag area. Not the newer `@dnd-kit/react`, which is still a pre-release.

### How it works

- **Sensors.** A pointer sensor that starts after 6px of movement, so clicks still open deals, and a keyboard sensor using sortable's keyboard coordinates (P7, P10).
- **Drop detection.** A detection rule written for several columns: first the column under the pointer, then the closest card inside it. A column with no cards is still a drop target. This avoids the common bug where a card can't reach an empty column or flickers between two.
- **Overlay.** The dragged card is drawn in a `DragOverlay`, so it isn't clipped by a column's scrolling, and its place stays open in the column.
- **One source of truth.** During a drag only the drag layer's local copy of the board changes. On drop, `lib/pipeline.ts` works out the new board and the index in the full column, and that one result updates the screen, the totals and the request.
- **Saving.** Moves go through TanStack Query mutations with one shared scope, so they're sent one at a time in order. Each one first stops any board reload in progress, so a late answer can't put back an old order. When a move succeeds, the board takes the server's order for both columns. When one fails, the board reloads from the server, which also covers any later moves that depended on it.
- **Server.** `move` does everything in one transaction: it takes the card out of its old column, puts it in at the index (clamped to the end), renumbers both columns from 0 with no gaps, and applies D2, D3 and D7 only if the stage changed.
- **Dropping where it started** sends nothing and adds no stage-change entry.
- **Speed.** Cards in the overlay and the columns are memoized, so a drag over 60 cards, or a few hundred, stays smooth.

### Cases that must work

Each of these has a test (see Proof):

1. Within a column: up, down, to the top, to the end.
2. Between columns: to the top, the middle and the end, and to an empty column.
3. Into Won or Lost (close date today, totals change) and back out to an open column (keeps its close date, D2 probability).
4. Dropping back in the same place, pressing Escape, and dropping outside every column.
5. A click on a card still opens the deal, and a tiny wobble while clicking isn't a drag.
6. With a search on, the card lands after the visible card above the drop place in the full column.
7. Into Won or Lost with only 10 showing, and after "Show all".
8. Two or three quick moves in a row are all saved, in order.
9. A move the server refuses: the board reloads and the message shows.
10. After a refresh, every card is where it was dropped.
11. The same moves with the keyboard, with the announcements.
12. Auto-scroll: dragging to a column off screen at 1280px and 1024px.

## Packages

Every package added while building passes these checks first:

1. **The exact name** comes from the spec's Libraries table, or is that library's own tooling (such as `@nestjs/cli`, `prisma`, `@types/*`, `@vitejs/plugin-react`). Check the spelling before installing, to avoid lookalike names.
2. **A stable version at least 14 days old.** Read the publish date with `npm view <name> time`. Never take a version published in the last 14 days, a pre-release (`-beta`, `-rc`, `-next`) or a deprecated one.
3. **Exact versions.** Install with `--save-exact`, and commit `package-lock.json` so every install gets the same files. Use `npm ci` once the lock file exists.
4. **Signed and clean.** After each install, `npm audit signatures` must pass and `npm audit` must show no high or critical issues.
5. **Install scripts.** List the packages that run scripts on install. Only the expected ones, such as Prisma and the SQLite driver, may run them. Anything else is removed.
6. **Nothing new on a whim.** A package not in the Libraries table needs a reason in the commit message, and goes into the spec's Libraries table if it stays.

## Proof

The work is done when `npm test` passes, every test below exists, and the by-eye check in Phase 8 is complete.

### Backend unit and API tests (Jest and Supertest)

The rules below are tested twice where it matters: as domain unit tests with no database, and through the API with Supertest to prove the services and transactions apply them.

- **Meta:** returns the six stages in order with 10, 25, 50, 75, 100 and 0, and the industry list.
- **Errors:** a missing required field gives 422 with that field in `fields`. A duplicate email gives 409, naming the contact who has it. An unknown id gives 404.
- **Organizations (O1, O2):** name required, industry must be from the list. The list includes contact count, open deal count and open pipeline, leaving out Won and Lost.
- **Contacts (C1, C3):** email checked and unique ignoring case. Status defaults to Lead. `?status=` filters. Winning a deal doesn't change the contact's status.
- **Changing a contact's organization:** the preview names the deals that will lose this contact as their main contact. A PATCH without `confirmUnlink` is refused with 409 and that list, and with it the deals are unlinked.
- **Deals (D1, D2):**
  - Organization required, and the main contact must belong to that organization.
  - Value can't be negative, and probability must be 0 to 100.
  - A new deal takes its stage's probability. A probability set by hand is kept until the stage next changes.
- **Stage and probability in one save (D2):** the probability sent wins.
- **Closing (D3):** moving to Won or Lost sets the close date to today. Editing the date afterwards is kept. A reopened deal keeps its close date.
- **Late (D4):** an open deal with a close date before today is late. A Won or Lost deal never is.
- **Stage changes (D7):**
  - Every stage change, from the form or from `move`, adds one entry dated today, "Moved from Proposal to Negotiation".
  - Saving without changing the stage adds none.
  - Stage-change entries can't be edited or deleted.
- **Move (P4, P6, P13):**
  - Moving to the top, middle and end of another column, and to an empty column.
  - Moving within a column, up and down, to the top and to the end.
  - An index past the end puts the card at the end.
  - Both columns are renumbered from 0 with no gaps or repeats, and the answer gives both columns' order.
  - Moving to the same place changes nothing and adds no stage-change entry.
  - Moving within a column adds no stage-change entry; moving to another column adds exactly one.
  - Moving into Won or Lost sets the close date to today; moving back out keeps it and sets the stage's probability.
  - A deal saved into Won from its form goes to the top of Won.
  - A move for an unknown deal or stage is refused, and nothing changes.
  - A new deal goes to the top of its column.
- **Activities (A1–A3, A6):**
  - Description required.
  - Logging on a deal relates it to the main contact unless that's turned off.
  - Timelines are newest first by date, then by creation time.
  - Done can be set and undone.
- **Deleting (X1–X5):**
  - An organization with deals is refused, and its preview lists the deals.
  - An organization with no deals unlinks its contacts.
  - A contact takes its activities with it and unlinks its deals, and the preview gives both counts.
  - A deal takes its activities and stage changes with it.
  - An activity on both a contact and a deal survives the first delete, related only to the one left, and goes with the second.
- **Dashboard (B1–B8), against a small known data set and a fixed today:**
  - The headline figures: won this month against last month, open pipeline and its count, expected revenue.
  - The overdue follow-up and late deal counts.
  - 12 months of revenue won and of deals won and lost, with empty months as zero.
  - Funnel values and the "% kept" share.
  - Pipeline by stage shares.
  - The overdue tab oldest first and the due soon tab soonest first, with a follow-up due exactly 7 days ahead counted as due soon.
  - The 10 newest activities.
  - Winning a deal changes the figures straight away.
- **Sample data (S1–S4), seeded with a fixed today:**
  - The counts and the status mix.
  - At least 8 industries.
  - Every stage used, and every month of the last 12 with won and lost deals.
  - 3 to 5 late deals.
  - About 8 follow-ups due soon and 5 overdue.
  - Stage-change entries match each deal's stage.
  - The same checks pass when seeded on the 1st of a month.
- **Database setting:** the tests run against the `ACCOUNTABLE_DB` file, and a new database is migrated and seeded on start.

### Frontend unit tests (Vitest and Testing Library)

- **Formatting:**
  - `USD 12,500`, and the short forms `USD 1.2M` and `USD 85K`.
  - `Nov 20, 2026`, "Today", "Tomorrow" and "3 days overdue".
  - `75%`.
- **Dates:** due soon from today to 7 days ahead, overdue from the day after the date, and late only for open deals. Month and year ends are handled.
- **Pipeline logic (`lib/pipeline.ts`):**
  - Moving within and between columns gives the right order, and dropping where it started gives no move.
  - The index in the full column from a drop in a filtered list (P8) and in the first 10 of Won or Lost (P9).
  - Column and board totals, with open totals leaving out Won and Lost, before and after every kind of move.
  - Board search filters cards but not totals.
- **Move queue:** moves are sent one at a time in order; a success takes the server's order; a failure reloads the board and shows the message; a late board reload can't undo a move.
- **Drop detection:** a card over an empty column, over a header and below the last card lands in the right place.
- **Forms:**
  - Required fields, a malformed email, a negative value and a probability outside 0 to 100 show errors under the field.
  - Changing a deal's organization clears its contact.
  - Changing the stage sets the probability.
  - Closing a changed form asks "Discard your changes?" whether it's closed by Cancel, Escape or the backdrop. "Keep editing" keeps what was typed, and a form with no changes closes straight away.
- **DataTable:** search ignores case, sort goes up, then down, then back to the default order, paging shows "Showing 1–25 of 80", and empty states appear (T1–T3, T6).
- **Sidebar:** the collapsed state is saved, it still works when storage throws, and the toggle reports whether it's expanded.
- **Can't reach Accountable (G9):** a network error shows the message and Retry, and a failed save keeps what was typed in the form.

### End-to-end tests (Playwright, installed Chrome)

Each test starts from fresh sample data and fails on any console error or any request that leaves `localhost`.

| Spec | What it proves |
|------|----------------|
| `start.spec.ts` | The app opens on the Dashboard with sample data on every screen (G1, criterion 1) |
| `organizations.spec.ts` | Create, search, sort, edit and delete; the blocked delete lists the deals with links; deleting one with no deals keeps its contacts (T1–T6, X1, X2) |
| `contacts.spec.ts` | Create, search, sort, edit and delete; the status filter with search; a duplicate and a malformed email are refused; changing the organization of a deal's main contact asks first and unlinks the deal; closing a changed form asks before discarding (C1–C3, X3) |
| `deals.spec.ts` | Create, search, sort, edit and delete; a negative value and a probability of 101 are refused; late deals show a Late pill (D1, D4, X4) |
| `records.spec.ts` | Each record page shows its linked records; an activity logged on a deal shows on its contact's timeline too; activities can be edited and deleted (O3, C4, D6, A1–A4) |
| `pipeline.spec.ts` | Columns, cards and totals; "Add deal" in a column; board search; a moved deal's stage and probability show in the deals table (P1–P3, P6, P8, P9) |
| `pipeline-drag.spec.ts` | Every case in [Cases that must work](#cases-that-must-work), with real mouse steps and with the keyboard, each checked after a refresh. A refused move is made with Playwright's request routing returning an error. It runs at 1280px and 1024px (P4, P5, P7, P10–P14) |
| `dashboard.spec.ts` | A follow-up logged with a date shows on the dashboard and leaves when marked done; winning a deal changes the figures and adds a recent activity entry; the stage change shows in the deal's timeline (B1–B8, D7) |
| `sidebar.spec.ts` | Collapsing the sidebar, and finding it collapsed after a refresh |
| `persistence.spec.ts` | A change survives a server restart; `npm run seed` brings back the sample data (G3, G4) |
| `offline.spec.ts` | Stopping the backend shows "Can't reach Accountable" with Retry, and Retry recovers once it's back (G9) |

### By eye

Before it's called done, someone uses every section and action in Chrome:

- Check each screen against the mockups in `docs/mockups/2-pipeline-first/` and the spec's Screens section, at 1280px and 1024px.
- Use every action with the keyboard as well.
- Drag cards on the board for a few minutes with a mouse and with a trackpad, trying the cases in [Cases that must work](#cases-that-must-work), and watch for flicker, jumps, cards in the wrong place or totals that don't match.
- Confirm the console stays empty.
