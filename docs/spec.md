# Spec: the Accountable MVP

This spec turns `docs/intent.md` into requirements and a design. The stack is in `docs/TECH_STACK.md`, and the look follows the brand skill (`.claude/skills/brand/`). Where this spec and the intent disagree, the intent wins, and the spec should be fixed.

## Concerns

### Decided

- **Scale.** The brand's design reference is now set for a data-heavy app: a 14px body, a 28px page title, 40px headline figures, 40px controls and 48px table rows. Display sizes and wide marketing gaps are gone.
- **Red for problems.** The brand now has an Alert red `#c4314b`, with Alert Wash `#feecef` for pills, used only for late, overdue, errors and delete.
- **Contrast.** The brand now has Violet Deep `#4b4bd6` for violet text and links, keeps Iron for placeholders and disabled icons only, and has chart colors that are all at least 3:1 on white. Every pair is listed in the reference's Contrast section.
- **Offline font.** Poppins is bundled from npm (`@fontsource/poppins`), so nothing is loaded from the web.
- **Reopening a won or lost deal.** It keeps its close date, and is late only if that date has passed. The user can edit it.
- **A contact who changes organization while being a deal's main contact.** Saving asks first, says which deals will lose this contact as their main contact, and then unlinks them. The form gets the list from the organization-change preview, and the PATCH carries `confirmUnlink: true`. Without it, the backend refuses with 409 and the same list.
- **Stage-change entries** are system entries. They can't be edited or deleted on their own, and they are deleted with their deal.
- **The blocked organization delete** lists the deals that block it, each linking to the deal so the user can reassign or delete it.
- **"Today" and dates.** Every date is a calendar date with no time zone, and "today" is the date on the computer running the browser. The frontend sends today's date with requests that depend on it (creating or saving a deal, moving a card, the dashboard figures), so the backend and the browser always agree.
- **Sample data dates** are built relative to the day the seed runs, so "due soon" and "running late" never go stale.
- **Tables search, sort and page in the browser.** Each list endpoint returns every row, which is fine for a few thousand. If the data grows past about 10,000 rows, move these to the server.

- **Mockups.** The "pipeline first" design is the chosen one. Its mockups are in `docs/mockups/2-pipeline-first/` (dashboard, pipeline and contacts), and the Screens section below describes them. Where a mockup and this spec disagree, the spec wins.
- **Navigation** is a collapsible sidebar, not a top bar. Content uses the full width beside it.
- **Outlines.** Panels and cards have a 1px outline instead of a soft shadow, so their edges read clearly.
- **Logo.** The logo is a flat Violet ring with the wordmark. There are no gradients anywhere.

There are no open concerns.

## Requirements

Each requirement has an ID, so tests and reviews can refer to it.

### General

- **G1** `npm run dev` starts the backend and frontend together on Mac, Linux and Windows. It prints the address to open, and the app opens on the Dashboard.
- **G2** The app needs no internet connection: no fonts, scripts or data come from outside.
- **G3** Every change is saved to the SQLite database as soon as it's made, and survives a browser refresh and an app restart.
- **G4** `npm run seed` replaces all data with fresh sample data. The app fills a new, empty database with sample data by itself.
- **G5** `npm test` runs the frontend, backend and end-to-end tests against a database of their own and fails if any test fails.
- **G6** There is no sign-in, dark mode or phone layout. The layout works from 1280px wide and still works at 1024px.
- **G7** Money is in US dollars and always shown with its currency (see [Formatting](#formatting)).
- **G8** There are no errors in the browser's console during normal use.
- **G9** If the frontend can't reach the backend, the page says "Can't reach Accountable. Check that it's running." with a Retry button, instead of showing empty or broken screens. A failed save keeps what the user typed and says the change wasn't saved.

### Tables (Organizations, Contacts, Deals)

- **T1** Each table has a search box that filters as you type, ignoring case, across the columns listed for it below.
- **T2** Clicking a column heading sorts by it. Clicking again reverses the order, and a third click goes back to the default order. The heading shows the direction.
- **T3** Each table pages its rows, 25 per page, with the page size selectable from 25, 50 and 100. It shows "Showing 1–25 of 312".
- **T4** Each table has a "New …" button that opens a form in a dialog. Each row has Edit and Delete actions, and clicking the row opens the record's page.
- **T5** Delete always asks first in a dialog that names the record and says exactly what will happen to the linked records (see [Deleting](#deleting)).
- **T6** A table with no rows, or no matches for a search, says so and offers to clear the search or add a record.

### Organizations

- **O1** Fields: name (required), website, industry (one of Software, Financial services, Healthcare, Manufacturing, Retail, Logistics, Construction, Education, Media, Professional services, Hospitality, Energy or Other), notes.
- **O2** Table columns: Name, Industry, Website, Contacts (count), Open deals (count), Open pipeline (USD). Search covers name, industry and website.
- **O3** Organization page: the details, with Edit and Delete; a list of its contacts, with "New contact" pre-filled with this organization; and a list of its deals, with "New deal" pre-filled the same way.

### Contacts

- **C1** Fields: first name and last name (required), email (optional, but valid and unique when given), phone, job title, organization (optional, searchable select), status (Lead, Qualified or Customer; new contacts default to Lead).
- **C2** Table columns: Name, Organization, Job title, Email, Phone, Status. Search covers name, email, organization and job title.
- **C3** A status filter above the table: All, Leads, Qualified, Customers, each with its count. It works together with search.
- **C4** Contact page: the details, a link to the organization, the deals where this contact is the main contact, and the timeline.

### Deals

- **D1** Fields: name (required), organization (required), main contact (optional; the list only offers contacts of the chosen organization, and clears if the organization changes), stage, value (USD, 0 or more, whole dollars), probability (0–100, whole percent), expected or actual close date (required).
- **D2** A new deal takes its stage's usual probability. Changing the stage, on the form or on the board, sets the probability to the new stage's usual one. A probability edited by hand is kept until the stage next changes. When one save changes both the stage and the probability, the probability sent wins, because the form has already filled in the new stage's probability and the user may have changed it.
- **D3** Moving to Won or Lost sets the close date to today. It can be edited afterwards.
- **D4** A deal is **late** when it's open (not Won or Lost) and its close date is before today. A late deal shows a red "Late" pill in the table and on its pipeline card, and its close date is in Alert red.
- **D5** Table columns: Name, Organization, Main contact, Stage, Value, Probability, Expected revenue (value × probability), Close date. Search covers name, organization and contact.
- **D6** Deal page: the details, links to the organization and main contact, and the timeline.
- **D7** Every change of stage, from the form or the board, adds a timeline entry, "Moved from Proposal to Negotiation", dated today, which also appears in the dashboard's recent activity.

### Pipeline

- **P1** Six columns in stage order: New, Qualified, Proposal, Negotiation, Won, Lost. Each column header shows its name, number of deals and total value, and the open columns also show their expected revenue.
- **P2** Above the board: the total value and expected revenue of all open deals, the number of open deals, and a pill with the number running late. Won and Lost are left out.
- **P3** Each card shows the deal's name, organization, value, probability, close date, the main contact's initials, and a "Late" pill when it's late. Clicking a card opens the deal.
- **P4** Dragging a card to another column changes its stage (with D2, D3 and D7). Dragging within a column changes its place. A card can be dropped at any position, and its place is saved, so it's the same after a refresh.
- **P5** All totals update as soon as a card is dropped, before the server answers. If saving fails, the card goes back and an error message says so.
- **P6** Each column has an "Add deal" button that opens the deal form with that stage chosen. The new deal goes to the top of the column.
- **P7** Cards can also be moved with the keyboard (focus, Space to pick up, arrows, Space to drop).
- **P8** A search box above the board filters the cards by deal name, organization or contact as you type. The totals still count every open deal. Cards can still be dragged while the board is filtered (see P11).
- **P9** Won and Lost are narrower columns showing a compact line per deal (name and short value), in their board order like any column, the first 10 and then "Show all 26", which lists the rest in the column. A deal that reaches Won or Lost from its form goes to the top, so the newest usually come first; one dragged there stays where it was dropped.

#### Drag and drop

Drag and drop is the heart of the board, so it's specified in detail.

- **P10 Picking up.** The whole card is the handle. A drag starts once the pointer has moved 6px, so a plain click still opens the deal. While dragging, a copy of the card follows the pointer (lifted, slightly tilted), and the space it left stays open as a placeholder. Escape, or dropping outside every column, cancels: the card goes back and nothing is sent.
- **P11 Where it lands.** The drop place shows as a dashed Violet outline between cards, and the cards around it move aside smoothly. Empty columns accept a drop. Over a column header the card goes to the top; over the space below the last card it goes to the end. The place is always worked out in the column's full list: with a search on (P8), or with only the first 10 of Won or Lost showing (P9), the card lands right after the visible card above the drop place. Dropping a card back where it started sends nothing.
- **P12 Scrolling while dragging.** Near the left or right edge of the board it scrolls sideways, and near the top or bottom of a long column, or of the page, it scrolls up or down.
- **P13 Saving.** Each drop sends one `move` with the card's stage, its index in the full column and today. The board shows the new place and totals at once (P5). Moves are saved one at a time in the order they were made, so quick moves never arrive out of order. The server answers with the order of both columns, and the board takes that as the truth. If a move fails, the board reloads from the server and a message says "Couldn't move Acme renewal. The board has been refreshed."
- **P14 Announcements.** A screen reader hears each step, in plain words: "Picked up Acme renewal in Proposal", "Over Negotiation, position 2 of 5", "Moved Acme renewal to Negotiation, position 2", "Move cancelled".

### Activities and follow-ups

- **A1** Fields: type (Note, Call or Email), description (required), date it happened (defaults to today), follow-up date (optional), done (only when there's a follow-up date).
- **A2** "Log activity" is on every contact and deal page. Logged on a deal, it also relates to the deal's main contact, if there is one, which the form shows and lets the user untick.
- **A3** The timeline lists activities and stage changes, newest first by date, then by time created. Each entry shows its type icon, description, date, the record it also relates to (as a link), and its follow-up with a due soon or overdue label.
- **A4** Activities can be edited and deleted from the timeline. Deleting asks first.
- **A5** A follow-up is **due soon** when its date is from today to 7 days ahead, and **overdue** when its date is before today, until it's marked done. A done follow-up shows as done and leaves the dashboard.
- **A6** A follow-up can be marked done with a checkbox on the dashboard or on the timeline, and the mark can be undone from the timeline.

### Deleting

- **X1** An organization with deals can't be deleted. The dialog says so, lists the deals with links, and only offers Close.
- **X2** Deleting an organization with no deals unlinks its contacts. The dialog says "Its 4 contacts will be kept without an organization."
- **X3** Deleting a contact deletes its activities and unlinks it from the deals where it's the main contact. The dialog gives both counts.
- **X4** Deleting a deal deletes its activities and stage-change entries. The dialog gives the count.
- **X5** An activity related to both a contact and a deal is kept, related only to the one left, when the other is deleted. It's deleted only when neither is left.

### Dashboard

- **B1** Four headline figures:
  - **Won this month**: revenue won from deals with a close date this month, compared with the whole of last month.
  - **Deals won**: the number of deals won this month.
  - **Open pipeline**: total value of open deals, with the number of open deals.
  - **Expected revenue**: the sum of value × probability over open deals.

  Under the page title, a line gives the number of overdue follow-ups and of late deals: "5 follow-ups overdue and 4 deals running late".
- **B2** **Revenue won** (line chart): revenue won per month over the last 12 months, the current month included, with the 12-month total and number of deals won.
- **B3** **Deals won and lost** (bar chart): the number won and lost per month over the same 12 months, as grouped bars.
- **B4** **Sales funnel**: one step per open stage plus Won, each as wide as the total value of the deals at that stage or beyond, labelled with that value, the number of deals and the share kept from the step before ("62%"). Lost is left out.
- **B5** **Pipeline by stage**: one block per open stage in a row, each as wide as its share of the open value, showing the stage name, its value, number of deals and expected revenue. It links to the Pipeline board. Won and Lost are left out.
- **B6** **Follow-ups**: two tabs, Overdue (oldest first) and Due soon (soonest first), each with its count. Overdue is shown first when it has any, otherwise Due soon. Each follow-up has its checkbox, description, a link to its contact or deal, and its date as a pill.
- **B7** **Recent activity**: the 10 newest activities and stage changes, each linking to its record.
- **B8** Every figure is calculated from the data when the dashboard loads, so it reflects a deal just won or a follow-up just added.

### Sample data

- **S1** About 25 organizations across at least 8 industries, 80 contacts (about half leads, a quarter qualified, a quarter customers, a few without an organization), 60 deals and 200 activities.
- **S2** Deals at every stage: won and lost spread over the last 12 months, so every month on the charts has data; open deals closing over the next 4 months; and 3 to 5 open deals running late.
- **S3** Activities spread over the past year, with about 8 follow-ups due soon, 5 overdue and some done. Each deal that isn't New has stage-change entries that match its stage.
- **S4** Names, companies, values and descriptions read as realistic B2B sales. Every date is relative to the day the seed runs (see Concerns).

## Design: system

### Architecture

```
browser ── React app (Vite, frontend/) ──JSON over HTTP──▶ NestJS (backend/) ──Prisma──▶ SQLite file
```

- In development, Vite serves the frontend and proxies `/api` to NestJS, so the browser sees one address.
- The backend owns every rule: probabilities, close dates, stage-change entries, delete effects and validation. The frontend repeats a few of them only to update the screen straight away (P5) and to show form errors early.
- The database file is `data/accountable.db`, which git ignores. The tests set `ACCOUNTABLE_DB` to a temporary file. The schema lives in `backend/prisma/schema.prisma`, and `prisma migrate deploy` creates and updates the database before the backend starts.

### Libraries

| Need | Library |
|------|---------|
| Routing | React Router |
| Server data and caching | TanStack Query |
| Tables | TanStack Table |
| Drag and drop | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`) |
| Charts | Recharts (with its peer `react-is`) |
| Forms and validation | React Hook Form with Zod |
| Dialogs, menus, selects, tooltips | Radix UI primitives |
| Icons | Lucide |
| Dates | date-fns |
| Font | `@fontsource/poppins` |
| Run both servers | concurrently |
| Backend | NestJS 11, Prisma 7 with SQLite through its better-sqlite3 driver adapter (`@prisma/adapter-better-sqlite3`), class-validator and class-transformer |
| Tests | Vitest with jsdom and Testing Library; Jest (ts-jest) and Supertest against the Nest app; Playwright Test |

### Data model

| Table | Columns |
|-------|---------|
| `organizations` | `id`, `name`, `website`, `industry`, `notes`, `created_at`, `updated_at` |
| `contacts` | `id`, `first_name`, `last_name`, `email` (unique when not null), `phone`, `job_title`, `organization_id` (nullable FK), `status` (`lead`, `qualified`, `customer`), `created_at`, `updated_at` |
| `deals` | `id`, `name`, `organization_id` (FK, required), `contact_id` (nullable FK), `stage` (`new`, `qualified`, `proposal`, `negotiation`, `won`, `lost`), `value` (integer dollars), `probability` (integer 0–100), `close_date` (date), `position` (integer, order within its stage), `created_at`, `updated_at` |
| `activities` | `id`, `kind` (`note`, `call`, `email`, `stage_change`), `contact_id` (nullable FK), `deal_id` (nullable FK), `description`, `occurred_on` (date), `follow_up_on` (nullable date), `done` (bool), `from_stage`, `to_stage` (stage changes only), `created_at`, `updated_at` |

- An activity must have a contact, a deal or both. `stage_change` activities have a deal, no contact and no follow-up.
- The stage probabilities live in one shared constant in the backend, which the API also exposes so the frontend never has its own copy.
- Indexes on every foreign key, on `deals (stage, position)` and on `activities (follow_up_on, done)`.

### API

Everything is under `/api` and uses JSON. Field names in requests and responses are camelCase (`organizationId`, `closeDate`, `followUpOn`), and Prisma maps them to the snake_case columns in the Data model with `@map`. Errors return `{"detail": ..., "fields": {"email": "Already used by Dana Reyes"}}` with status 409 for a conflict and 422 for an invalid field. A global exception filter produces this shape, and the validation pipe uses 422 rather than Nest's default 400.

| Method and path | Purpose |
|-----------------|---------|
| `GET /api/meta` | Stages, their probabilities and the industry list |
| `GET/POST /api/organizations`, `GET/PATCH/DELETE /api/organizations/{id}` | Organizations, with counts and open pipeline in the list |
| `GET /api/organizations/{id}/delete-preview` | What deleting would do: the blocking deals, or the contacts to be unlinked |
| `GET/POST /api/contacts`, `GET/PATCH/DELETE /api/contacts/{id}` | Contacts; `?status=` filters |
| `GET /api/contacts/{id}/delete-preview` | The counts of activities to delete and deals to unlink |
| `GET /api/contacts/{id}/organization-change-preview?organizationId=` | The deals that would lose this contact as their main contact if it moved to that organization (or to none) |
| `GET/POST /api/deals`, `GET/PATCH/DELETE /api/deals/{id}` | Deals; POST and PATCH carry `today`, and a PATCH that changes the stage applies D2, D3 and D7 |
| `GET /api/deals/{id}/delete-preview` | The count of activities to delete |
| `POST /api/deals/{id}/move` | `{stage, index, today}`: moves the deal to a position in a column (an index past the end means the end), renumbers that column and the one it left in one transaction, applies the stage rules only when the stage changed, and returns the ordered deal ids of both columns |
| `GET /api/contacts/{id}/timeline`, `GET /api/deals/{id}/timeline` | Activities, newest first |
| `POST /api/activities`, `PATCH/DELETE /api/activities/{id}` | Activities; PATCH `{done}` marks a follow-up |
| `GET /api/dashboard?today=YYYY-MM-DD` | All dashboard figures (B1–B7) in one response |

### Frontend structure

```
frontend/src/
  app/          router, layout, navigation, query client
  api/          one typed client function per endpoint
  features/     dashboard/, organizations/, contacts/, deals/, pipeline/, activities/
  components/   Button, Dialog, ConfirmDelete, DataTable, StatusPill, Money, DateText, EmptyState…
  lib/          formatting, dates (today, due soon, late), stage colors
  styles/       tokens.css (the brand tokens), global.css
```

Routes: `/` Dashboard, `/organizations` and `/organizations/:id`, `/contacts` and `/contacts/:id`, `/deals` and `/deals/:id`, `/pipeline`.

## Design: look and feel

The look follows the brand skill and its `DESIGN.md`. The brand's Avoid and Tone sections take priority over `DESIGN.md`.

### Brand reference

Colors, type, sizes, radii, shadows, components, chart styling and the stage and status colors all come from the brand reference, `.claude/skills/brand/DESIGN.md`. `frontend/src/styles/tokens.css` is a copy of its CSS custom properties, and components use the tokens, never raw values. In short:

- **Surfaces:** a Cloud `#f5f6f8` canvas with white panels (24px radius) and white pipeline cards (16px radius), each with a 1px Border `#c3c7d6` outline on all sides.
- **Type:** Poppins throughout; 14px body and table cells, 18px panel titles, 28px page titles, 40px weight 300 headline figures; tabular figures for numbers.
- **Actions:** violet pill buttons, 40px high, or 32px in toolbars, table rows and pipeline columns. Delete confirmations use the Alert pill.
- **Meaning by color:** each stage and status has a pastel pill and a chart color, per the reference's stage and status table. Late and overdue use Alert.
- **Avoid:** no border on one edge of a panel (late deals get a pill, not a stripe), no edge line on the sidebar or across the top of the page, and no gradient fills anywhere. The logo is a solid Violet ring beside the wordmark in Ink.

### Layout

- A white sidebar, fixed on the left and 240px wide, holds the Accountable logo, a primary "New deal" button, then Dashboard, Organizations, Contacts, Deals and Pipeline, each with an icon. The current section is shown in Violet Deep with a Periwinkle Wash pill behind it. A "Collapse menu" button at the bottom shrinks it to 72px, showing icons only with tooltips; the choice is remembered per browser.
- Content fills the width beside the sidebar, with 32px side padding. Pipeline columns grow to fill the width and the board scrolls sideways if they don't fit.
- Every page starts with its title on the left and its main action (a violet pill) on the right.

### Screens

**Dashboard** (mockup: `dashboard.html`). The page title, today's date and the overdue and late line (B1), with "Log activity" on the right.
- First row: one wide panel. On the left, the four headline figures in a 2 × 2 grid, each with a small Slate label, the figure in weight 300 and a line below, such as "USD 4,600 more than October" in Forest, or in Alert when it's lower. On the right, Pipeline by stage (B5): blocks in each stage's pastel with a dot in its chart color, and a line saying Won and Lost are not counted.
- Second row: a "Last 12 months" panel, two thirds wide, with Revenue won (line chart) above Deals won and lost (grouped bars, Forest and Slate). Beside it, the Follow-ups panel (B6) on a Lavender background with a Lavender-tinted outline, its tabs as a segmented control, and each follow-up on a white card.
- Third row, side by side: the Sales funnel as tapering steps in the stage chart colors, with stage names on the left and values on the right; and Recent activity, each entry with its pastel badge, description, link and date.
- Charts follow the reference's Charts section.

**Tables** (mockup: `contacts.html`). The page title with a short count below it ("80 contacts · 19 customers") and the "New …" button on the right.
- Above the panel, the toolbar: the search box (pill, 320px wide, with a search icon and outline), then on Contacts the status filter as outlined pill toggles with counts; the selected one is Violet Deep on Periwinkle Wash.
- One white outlined panel holds the table. Headings in Slate, label weight; the sorted one in Ink with a Violet Deep arrow. Rows 48px with a Shadow Dust line between them, Periwinkle on hover.
- The first column shows the name in label weight, with a 32px initials avatar on Contacts. Linked records (such as the organization) are Violet Deep links that open that record. Empty values show "—" in Slate, and a contact with no organization shows "No organization".
- Status and stage show as pills. Row actions are icon buttons (pencil, bin) with tooltips, on every row, faint until the row is hovered.
- The panel's footer shows "Showing 1–25 of 80" on the left, and "Rows per page" with the page buttons on the right.

**Record pages.** A header panel with the record's name as the page title, its key facts as label and value pairs, its status or stage pill, and Edit and Delete. Below it, two columns: on the left, the linked records (contacts and deals as compact lists); on the right, the timeline with "Log activity" at the top.

**Timeline.** A vertical list with a type icon in a round pastel badge for each entry: note (Lavender), call (Mint), email (Sky), stage change (Periwinkle Wash, arrow icon). Follow-ups show their date and label beside a checkbox. Edit and Delete are in a small menu on each entry; stage changes have none.

**Pipeline** (mockup: `pipeline.html`). Below the title, a toolbar with the search box (P8) on the left and the open totals on the right (P2).
- Six columns on the Cloud canvas. The four open ones are at least 280px wide and grow to fill the width. Won and Lost are narrower (P9).
- Each column starts with a header card in its stage's pastel (Lost is white with an outline) showing the stage name, count, total value and "Expected USD …". On open columns, a thin bar shows expected revenue as a share of the value, in the stage's chart color. Won says "All time" and Lost says "Not counted in totals".
- Cards are white, 16px radius, outlined. Each shows the name, the organization, the value and probability, a thin probability bar in the stage's chart color, the close date with a calendar icon, and the contact's initials. A late card has a Late pill at the top right and its date in Alert.
- Open columns end with a dashed-outline "Add deal" button.
- A card being dragged lifts with `--shadow-lifted` and a slight tilt, and the drop place shows as a dashed Violet outline.

**Dialogs.** Forms and confirmations open in a centered white dialog with a 24px radius, `--shadow-overlay`, a dimmed backdrop, and Cancel (outlined pill) and the main action (filled pill) bottom right. A delete confirmation uses an Alert-colored "Delete" button and lists the effects as plain sentences.

**Unsaved changes.** Closing a form that has changes, with Cancel, Escape, the close button or a click on the backdrop, asks "Discard your changes?" with "Keep editing" (outlined pill, focused) and "Discard" (Alert pill). A form with no changes closes straight away. Leaving the page or refreshing with a form open and changed shows the browser's own leave warning.

**Feedback.** Saving shows a short message in the corner ("Deal saved"), with no exclamation marks. Form errors appear under their field in Alert red. Loading shows soft gray placeholders in the shape of the content.

### Formatting

- **Money:** `USD 12,500`, whole dollars, using `Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencyDisplay: "code", maximumFractionDigits: 0 })`. Short form on charts and pipeline columns: `USD 1.2M`, `USD 85K`.
- **Dates:** `Nov 20, 2026`. On timelines and follow-ups, add "Today", "Tomorrow" or "3 days overdue" where it helps.
- **Percentages:** `75%`.
- **Labels:** short, in sentence case, in plain business English: "New deal", "Log activity", "Mark done", "No deals match your search".

### Accessibility

- Text meets 4.5:1 contrast and chart marks 3:1, using only the pairs in the reference's Contrast section.
- Every control can be used with the keyboard, focus shows as a 2px Violet Deep ring, and the pipeline supports keyboard moves (P7).
- The collapsed sidebar keeps an accessible name and a tooltip on every icon, and its toggle reports whether it's expanded.
- Status is never shown by color alone: pills carry words, and charts have labels.

## Testing

- **Backend (Jest and Supertest):** each rule in the Rules section of the intent, the probability and close-date rules, positions after a move, delete effects and previews, validation, and the dashboard figures against a small known data set.
- **Frontend (Vitest):** formatting, date helpers (due soon, overdue, late), the optimistic totals on the board, and form validation.
- **End to end (Playwright, installed Chrome):** the app starts on the dashboard with sample data; create, search, sort, edit and delete on each table; the contact status filter; collapsing the sidebar and finding it collapsed after a refresh; searching the board; drag and drop as listed in `docs/plan.md` (between and within columns, to an empty column, cancelling, with a search on, quick moves, a failed save, and refresh); a new deal from a column; logging an activity with a follow-up and marking it done from the dashboard; winning a deal and seeing the dashboard change; the blocked organization delete; and no console errors on any screen.
- **Resetting between end-to-end tests:** when the backend runs with `ACCOUNTABLE_TEST=1`, it adds `POST /api/test/reset`, which reseeds the database. It doesn't exist otherwise.
- **By eye (success criterion 8):** before it's called done, someone uses every section and action in a real browser and checks each screen against this design.
