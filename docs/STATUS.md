Building the MVP from `docs/plan.md`.

## How to run Accountable

You need [Node.js](https://nodejs.org) 24 or later (Node 26 is the target; the build is tested on Node 24) and, for the end-to-end tests only, Google Chrome.

1. Install once: `npm install` in the repo folder. Only better-sqlite3 and Prisma are allowed to run install scripts (see `allowScripts` in `package.json`).
2. Start: `npm run dev`. It prints "Accountable is running. Open http://localhost:5173 in your browser." The first start creates `data/accountable.db` and fills it with sample data.
3. Reset to fresh sample data: `npm run seed`. It works while the app is running; refresh the browser afterwards.
4. Run every test: `npm test` (backend Jest and Supertest, frontend Vitest, then Playwright in Chrome). The tests use databases of their own in the system's temp folder, so your data is never touched.

The data lives in `data/accountable.db`. Set `ACCOUNTABLE_DB` to use another file.

## Progress

- 2026-11-20: Settled the open points in `docs/intent.md` through an interview. It now has a Rules section covering required links, stage probabilities, closing deals, deleting, follow-ups, form checks, the dashboard period and scale.

- 2026-11-20: Moved `docs/DESIGN.md` into the brand skill (`.claude/skills/brand/DESIGN.md`). The skill now points to it for the visual style and keeps only its Avoid and Tone sections.
- 2026-11-20: Rewrote the brand skill's `DESIGN.md` as Accountable's own style reference.
- 2026-11-20: Wrote `docs/spec.md` with the MVP requirements and design, and 11 concerns at the top that need a decision.
- 2026-11-20: Reworked the brand reference (`.claude/skills/brand/DESIGN.md`) for a data-heavy CRM: app type scale and sizes, Alert and Violet Deep colors, accessible chart colors, stage and status colors, and an offline font. `docs/spec.md` now points to it, with four concerns decided and seven still open.
- 2026-11-20: Spec complete. All concerns in `docs/spec.md` are decided; added the industry list and a requirement for when the backend can't be reached (G9). Next: build the MVP.
- 2026-11-20: Added three mockups of the dashboard and pipeline in `docs/mockups/` (1-classic, 2-pipeline-first, 3-ledger), each with HTML and a screenshot.
- 2026-11-20: Reworked the pipeline-first mockup: collapsible sidebar, full-width content, 1px outlines on panels and cards, and a flat Violet ring logo. Updated `docs/spec.md` and the brand reference to match.
- 2026-11-20: Kept only the pipeline-first mockup (removed 1-classic and 3-ledger) and added a contacts table mockup.
- 2026-11-20: Updated `docs/spec.md` to the chosen pipeline-first mockups: dashboard figures and panels (B1–B6), board search and Won/Lost columns (P8, P9), and the Screens section.
- 2026-11-20: Took screenshots of the pipeline-first mockups (dashboard, pipeline with the sidebar open and collapsed, contacts) and fixed the layout problems they showed.
- 2026-11-20: Switched the backend from Python and FastAPI to NestJS with Prisma in `docs/TECH_STACK.md`, and updated the architecture, libraries, API errors and testing in `docs/spec.md` to match.
- 2026-11-20: Wrote `docs/plan.md`: the files to create, eight phases of work, risks, and the unit and end-to-end tests that prove the MVP is done.
- 2026-11-20: Added to `docs/spec.md` the organization-change preview for contacts, that a probability sent with a stage change wins (D2), and an unsaved changes warning on forms. Updated `docs/plan.md` to match, with a layered backend (domain rules apart from services) and package safety checks.
- 2026-11-20: Fixed the spec before building: Won and Lost keep their dropped order (P9, per the intent), deal saves send today, camelCase API names, B1 compares with the whole of last month, no "Show more" on recent activity, a test-only reset endpoint, and a detailed drag and drop design (P10–P14). Added a Drag and drop section to `docs/plan.md` with its cases and tests.
- 2026-11-20: Phase 1 (skeleton) done. npm workspaces with `dev`, `test` and `seed`; a NestJS 11 backend answering `GET /api/meta`; a Vite app calling it through the proxy; Jest, Vitest and Playwright each with a passing test. Packages are pinned to versions at least 14 days old, two transitive fixes are forced with `overrides` (multer 2.5.0, effect 3.22.4), and only better-sqlite3 and Prisma may run install scripts (`allowScripts`).
- 2026-11-21: Phase 2 (data and rules) done. Prisma schema and first migration, the `{detail, fields}` error filter with 422 validation, domain rules in `backend/src/domain/` with unit tests, and the organizations, contacts, deals (with `move`), activities, delete previews and dashboard endpoints, each tested through the API with Supertest.
- 2026-11-21: Phase 3 (sample data) done. `backend/src/seed/sample-data.ts` builds 25 organizations, 80 contacts, 60 deals and 200 activities (plus stage changes) from a given today, tested on four dates including the 1st of a month. `npm run seed` reloads it, a new empty database is seeded on start, and `POST /api/test/reset` reseeds when `ACCOUNTABLE_TEST=1`.
- 2026-11-21: Phase 4 (frontend shell) done. Brand tokens and global styles, bundled Poppins, the collapsible sidebar remembered per browser, all routes, the API client and query client, toasts, the "Can't reach Accountable" screen with Retry, and the shared components (Dialog with the unsaved changes warning, ConfirmDelete, pills, Money, DateText and others).
- 2026-11-21: Phase 5 (tables, forms and record pages) done. Organizations, Contacts (with the status filter) and Deals tables with search, three-state sort and paging; forms with field errors, the organization search, the deal's contact tied to its organization and the unsaved changes warning; delete dialogs from the previews; record pages with timelines, logging, editing and deleting activities, and marking follow-ups done.
- 2026-11-21: Phase 6 (pipeline) done. Board with stage columns, totals and compact Won and Lost lists; the pure board logic in `frontend/src/lib/pipeline.ts`; dragging with dnd-kit (drop detection written for columns, overlay, dashed drop place, cancel, auto-scroll, keyboard moves and announcements); moves saved one at a time with the server's order taken as the truth; board search; Add deal in a column. All 17 drag end-to-end tests passed ten runs in a row (170 of 170). The backend's run build now goes to `backend/build`, so `npm run seed` and `npm test` no longer break a running `npm run dev`.
