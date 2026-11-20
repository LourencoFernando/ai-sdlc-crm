# Spec: the Accountable MVP

This spec turns `docs/intent.md` into requirements and a design. The stack is in `docs/TECH_STACK.md`, and the look follows the brand skill (`.claude/skills/brand/`). Where this spec and the intent disagree, the intent wins, and the spec should be fixed.

## Concerns

### Decided

- **Scale.** The brand's design reference is now set for a data-heavy app: a 14px body, a 28px page title, 40px headline figures, 40px controls and 48px table rows. Display sizes and wide marketing gaps are gone.
- **Red for problems.** The brand now has an Alert red `#c4314b`, with Alert Wash `#feecef` for pills, used only for late, overdue, errors and delete.
- **Contrast.** The brand now has Violet Deep `#4b4bd6` for violet text and links, keeps Iron for placeholders and disabled icons only, and has chart colors that are all at least 3:1 on white. Every pair is listed in the reference's Contrast section.
- **Offline font.** Poppins is bundled from npm (`@fontsource/poppins`), so nothing is loaded from the web.
- **Reopening a won or lost deal.** It keeps its close date, and is late only if that date has passed. The user can edit it.
- **A contact who changes organization while being a deal's main contact.** Saving asks first, says which deals will lose this contact as their main contact, and then unlinks them.
- **Stage-change entries** are system entries. They can't be edited or deleted on their own, and they are deleted with their deal.
- **The blocked organization delete** lists the deals that block it, each linking to the deal so the user can reassign or delete it.
- **"Today" and dates.** Every date is a calendar date with no time zone, and "today" is the date on the computer running the browser. The frontend sends today's date with requests that depend on it (closing a deal, dashboard figures), so the backend and the browser always agree.
- **Sample data dates** are built relative to the day the seed runs, so "due soon" and "running late" never go stale.
- **Tables search, sort and page in the browser.** Each list endpoint returns every row, which is fine for a few thousand. If the data grows past about 10,000 rows, move these to the server.

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
- **D2** A new deal takes its stage's usual probability. Changing the stage, on the form or on the board, sets the probability to the new stage's usual one. A probability edited by hand is kept until the stage next changes.
- **D3** Moving to Won or Lost sets the close date to today. It can be edited afterwards.
- **D4** A deal is **late** when it's open (not Won or Lost) and its close date is before today. A late deal shows a red "Late" pill in the table and on its pipeline card, and its close date is in Alert red.
- **D5** Table columns: Name, Organization, Main contact, Stage, Value, Probability, Expected revenue (value × probability), Close date. Search covers name, organization and contact.
- **D6** Deal page: the details, links to the organization and main contact, and the timeline.
- **D7** Every change of stage, from the form or the board, adds a timeline entry, "Moved from Proposal to Negotiation", dated today, which also appears in the dashboard's recent activity.

### Pipeline

- **P1** Six columns in stage order: New, Qualified, Proposal, Negotiation, Won, Lost. Each column header shows its name, number of deals, total value and expected revenue.
- **P2** Above the board: the total value and expected revenue of all open deals. Won and Lost are left out.
- **P3** Each card shows the deal's name, organization, value, probability, close date, the main contact's initials, and a "Late" pill when it's late. Clicking a card opens the deal.
- **P4** Dragging a card to another column changes its stage (with D2, D3 and D7). Dragging within a column changes its place. A card can be dropped at any position, and its place is saved, so it's the same after a refresh.
- **P5** All totals update as soon as a card is dropped, before the server answers. If saving fails, the card goes back and an error message says so.
- **P6** Each column has an "Add deal" button that opens the deal form with that stage chosen. The new deal goes to the top of the column.
- **P7** Cards can also be moved with the keyboard (focus, Space to pick up, arrows, Space to drop).

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
  - **Won this month**: revenue and number of deals won with a close date this month, compared with last month.
  - **Open pipeline**: total value of open deals.
  - **Expected revenue**: the sum of value × probability over open deals.
  - **Follow-ups**: the number overdue and the number due soon.
- **B2** **Revenue won** (line chart): revenue won per month over the last 12 months, the current month included.
- **B3** **Deals won and lost** (bar chart): the number won and lost per month over the same 12 months, as grouped bars.
- **B4** **Sales funnel**: one bar per open stage plus Won, each showing the total value of the deals at that stage or beyond, with the number of deals. Lost is left out.
- **B5** **Pipeline by stage**: a stacked bar of open value by stage, with expected revenue beside it, linking to the Pipeline board.
- **B6** **Follow-ups**: overdue first (oldest first), then due soon (soonest first), each with its checkbox, description and a link to its contact or deal.
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
browser ── React app (Vite, frontend/) ──JSON over HTTP──▶ FastAPI (backend/) ──SQLAlchemy Core──▶ SQLite file
```

- In development, Vite serves the frontend and proxies `/api` to FastAPI, so the browser sees one address.
- The backend owns every rule: probabilities, close dates, stage-change entries, delete effects and validation. The frontend repeats a few of them only to update the screen straight away (P5) and to show form errors early.
- The database file is `data/accountable.db`, which git ignores. The tests set `ACCOUNTABLE_DB` to a temporary file.

### Libraries

| Need | Library |
|------|---------|
| Routing | React Router |
| Server data and caching | TanStack Query |
| Tables | TanStack Table |
| Drag and drop | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`) |
| Charts | Recharts |
| Forms and validation | React Hook Form with Zod |
| Dialogs, menus, selects, tooltips | Radix UI primitives |
| Icons | Lucide |
| Dates | date-fns |
| Font | `@fontsource/poppins` |
| Run both servers | concurrently |
| Backend | FastAPI, Pydantic v2, SQLAlchemy Core, Uvicorn |
| Tests | Vitest and Testing Library; pytest with FastAPI's TestClient; Playwright Test |

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

Everything is under `/api` and uses JSON. Errors return `{"detail": ..., "fields": {"email": "Already used by Dana Reyes"}}` with status 409 for a conflict and 422 for an invalid field.

| Method and path | Purpose |
|-----------------|---------|
| `GET /api/meta` | Stages, their probabilities and the industry list |
| `GET/POST /api/organizations`, `GET/PATCH/DELETE /api/organizations/{id}` | Organizations, with counts and open pipeline in the list |
| `GET /api/organizations/{id}/delete-preview` | What deleting would do: the blocking deals, or the contacts to be unlinked |
| `GET/POST /api/contacts`, `GET/PATCH/DELETE /api/contacts/{id}` | Contacts; `?status=` filters |
| `GET /api/contacts/{id}/delete-preview` | The counts of activities to delete and deals to unlink |
| `GET/POST /api/deals`, `GET/PATCH/DELETE /api/deals/{id}` | Deals; a PATCH that changes the stage applies D2, D3 and D7 |
| `GET /api/deals/{id}/delete-preview` | The count of activities to delete |
| `POST /api/deals/{id}/move` | `{stage, index, today}`: moves the deal to a position in a column, renumbers that column and the one it left in one transaction, and applies the stage rules |
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

- **Surfaces:** a Cloud `#f5f6f8` canvas with white panels (24px radius, soft shadow, no border) and white pipeline cards (16px radius).
- **Type:** Poppins throughout; 14px body and table cells, 18px panel titles, 28px page titles, 40px weight 300 headline figures; tabular figures for numbers.
- **Actions:** violet pill buttons, 40px high, or 32px in toolbars, table rows and pipeline columns. Delete confirmations use the Alert pill.
- **Meaning by color:** each stage and status has a pastel pill and a chart color, per the reference's stage and status table. Late and overdue use Alert.
- **Avoid:** no border on one edge of a panel (late deals get a pill, not a stripe), no line across the top of the page or under the navigation bar, and no gradient fills. The prism gradient appears only in the logo mark.

### Layout

- A sticky white navigation bar, 64px high, holds the Accountable logo (the prism mark and the wordmark in Ink) on the left, then Dashboard, Organizations, Contacts, Deals and Pipeline. The current section is shown in Violet Deep with a Periwinkle Wash pill behind it. A primary "New deal" button sits on the right.
- Content is centered with a max-width of 1200px and 32px side padding. The Pipeline board uses the full width and scrolls sideways if six columns don't fit.
- Every page starts with its title on the left and its main action (a violet pill) on the right.

### Screens

**Dashboard.** First row: four headline-figure panels, each with a small label in Slate, the figure at 40px weight 300, and a comparison line, such as "USD 12,400 more than October" in Forest, or in Alert when it's lower. The Follow-ups panel has a Lavender background. Second row: Revenue won (line chart, two thirds of the width) and Pipeline by stage (one third). Third row: Deals won and lost (bar chart) and the Sales funnel, side by side. Fourth row: Follow-ups and Recent activity, side by side. Charts follow the reference's Charts section.

**Tables.** One white panel per page. The toolbar is the search box (with a search icon, 320px wide), the status filter on Contacts (a row of pill toggles with counts), and the page size and paging on the right at the bottom. Row actions are icon buttons (pencil, bin) with tooltips, shown on every row and stronger on hover. The heading of the sorted column shows an arrow.

**Record pages.** A header panel with the record's name as the page title, its key facts as label and value pairs, its status or stage pill, and Edit and Delete. Below it, two columns: on the left, the linked records (contacts and deals as compact lists); on the right, the timeline with "Log activity" at the top.

**Timeline.** A vertical list with a type icon in a round pastel badge for each entry: note (Lavender), call (Mint), email (Sky), stage change (Periwinkle Wash, arrow icon). Follow-ups show their date and label beside a checkbox. Edit and Delete are in a small menu on each entry; stage changes have none.

**Pipeline.** Six columns, 280px wide, on the Cloud canvas, each with a header showing its pastel stage pill, count, total and expected revenue, and an "Add deal" pill button at the bottom. Cards are white with a 16px radius. A card being dragged lifts with `--shadow-lifted` and a slight tilt, and the drop place shows as a dashed Violet outline. The board's open totals sit in a summary row above the columns.

**Dialogs.** Forms and confirmations open in a centered white dialog with a 24px radius, `--shadow-overlay`, a dimmed backdrop, and Cancel (outlined pill) and the main action (filled pill) bottom right. A delete confirmation uses an Alert-colored "Delete" button and lists the effects as plain sentences.

**Feedback.** Saving shows a short message in the corner ("Deal saved"), with no exclamation marks. Form errors appear under their field in Alert red. Loading shows soft gray placeholders in the shape of the content.

### Formatting

- **Money:** `USD 12,500`, whole dollars, using `Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencyDisplay: "code", maximumFractionDigits: 0 })`. Short form on charts and pipeline columns: `USD 1.2M`, `USD 85K`.
- **Dates:** `Nov 20, 2026`. On timelines and follow-ups, add "Today", "Tomorrow" or "3 days overdue" where it helps.
- **Percentages:** `75%`.
- **Labels:** short, in sentence case, in plain business English: "New deal", "Log activity", "Mark done", "No deals match your search".

### Accessibility

- Text meets 4.5:1 contrast and chart marks 3:1, using only the pairs in the reference's Contrast section.
- Every control can be used with the keyboard, focus shows as a 2px Violet Deep ring, and the pipeline supports keyboard moves (P7).
- Status is never shown by color alone: pills carry words, and charts have labels.

## Testing

- **Backend (pytest):** each rule in the Rules section of the intent, the probability and close-date rules, positions after a move, delete effects and previews, validation, and the dashboard figures against a small known data set.
- **Frontend (Vitest):** formatting, date helpers (due soon, overdue, late), the optimistic totals on the board, and form validation.
- **End to end (Playwright, installed Chrome):** the app starts on the dashboard with sample data; create, search, sort, edit and delete on each table; the contact status filter; drag between and within columns and refresh; a new deal from a column; logging an activity with a follow-up and marking it done from the dashboard; winning a deal and seeing the dashboard change; the blocked organization delete; and no console errors on any screen.
- **By eye (success criterion 8):** before it's called done, someone uses every section and action in a real browser and checks each screen against this design.
