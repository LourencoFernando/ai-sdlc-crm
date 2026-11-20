# Accountable — Style Reference
> white workshop with pastel sticky notes

**Theme:** light

Accountable is a CRM people use all day, on a laptop or desktop screen. It uses a white-canvas productivity look with violet as its one brand voice. Screens breathe through whitespace, near-black type and pastel card surfaces drawn from a crayon-box palette (soft green, powder blue, peach, lavender, mint), which gives a playful, human feel in a business tool. Violet (#6161ff) owns the primary action and brand surfaces. Components are pill-shaped and rounded: pill buttons, 24px panels, 16px cards, 6px tags. The scale is set for working with data: compact enough for tables and boards with many records, with larger, lighter type kept for headline figures.

## Tokens — Colors

### Brand and neutrals

| Name | Value | Token | Role |
|------|-------|-------|------|
| Violet | `#6161ff` | `--color-violet` | Primary action buttons (with white text), brand surfaces, active states, chart series. Not for text on its own: use Violet Deep |
| Violet Deep | `#4b4bd6` | `--color-violet-deep` | Violet text, links, the current navigation item, focus rings |
| Ink | `#333333` | `--color-ink` | Primary text, headings, button labels. Near-black with a hint of warmth avoids the harshness of pure #000 |
| Slate | `#535768` | `--color-slate` | Secondary text, labels, navigation links, icon fills, axis labels |
| Iron | `#808080` | `--color-iron` | Disabled icons and input placeholders only. Too light for text people need to read |
| Fog | `#cacbcd` | `--color-fog` | Outline of the Lost pill, disabled borders |
| Mist | `#d0d4e4` | `--color-mist` | Light card outlines where a shadow isn't enough |
| Pebble | `#dddfeb` | `--color-pebble` | Input borders, outlined pill buttons |
| Cloud | `#f5f6f8` | `--color-cloud` | Page canvas, pipeline board, neutral button fills. The floor color everything floats on |
| Snow | `#ffffff` | `--color-snow` | Panels, cards, navigation bar, dialogs, input fields, button text |
| Shadow Dust | `#e6e7ea` | `--color-shadow-dust` | Lines between table rows, chart gridlines, shadow tint |

### Pastel surfaces

Pastels are backgrounds only, always with Ink text.

| Name | Value | Token | Role |
|------|-------|-------|------|
| Mint | `#bcfe90` | `--color-mint` | Won stage, Customer status, call entries |
| Sky | `#abf0ff` | `--color-sky` | New stage, Lead status, email entries |
| Periwinkle Wash | `#dbdbff` | `--color-periwinkle-wash` | Qualified stage and status, stage-change entries, the current navigation item |
| Lavender | `#eddff7` | `--color-lavender` | Proposal stage, note entries, the dashboard's follow-ups panel |
| Apricot Wash | `#ffd0b3` | `--color-apricot-wash` | Negotiation stage, Due soon pills |
| Periwinkle | `#e7ecff` | `--color-periwinkle` | Soft brand-tinted surface, hover on rows and menu items |
| Aqua | `#d1faff` | `--color-aqua` | Spare accent surface |
| Peony | `#fcd0f8` | `--color-peony` | Spare accent surface |

### Status and charts

| Name | Value | Token | Role |
|------|-------|-------|------|
| Alert | `#c4314b` | `--color-alert` | Late deals, overdue follow-ups, form errors, Delete buttons, figures that went down |
| Alert Wash | `#feecef` | `--color-alert-wash` | Background of Late and Overdue pills, with Alert text |
| Forest | `#2a5c4e` | `--color-forest` | Won deals in charts, figures that went up |
| Ocean | `#3a8fd9` | `--color-ocean` | New stage in charts |
| Ultra Violet | `#9450fd` | `--color-ultra-violet` | Proposal stage in charts |
| Ember | `#c25a14` | `--color-ember` | Negotiation stage in charts |
| Apricot | `#ff8940` | `--color-apricot` | Warm accent and the source of Apricot Wash. Too light for chart lines or text |
| Electric Cyan | `#3ac9ff` | `--color-electric-cyan` | Decorative accent only. Too light for chart lines or text |
| Prism | `#8181ff` | `--color-prism` | Base color of the prism gradient (`--gradient-prism`), used only in the logo mark |

### Stage and status colors

| Stage or status | Pill background (Ink text) | Chart color |
|-----------------|---------------------------|-------------|
| New | Sky | Ocean |
| Qualified | Periwinkle Wash | Violet |
| Proposal | Lavender | Ultra Violet |
| Negotiation | Apricot Wash | Ember |
| Won | Mint | Forest |
| Lost | Cloud with a Fog outline | Slate |
| Lead / Qualified / Customer | Sky / Periwinkle Wash / Mint | — |
| Late, Overdue | Alert Wash, Alert text | Alert |
| Due soon | Apricot Wash | — |

### Contrast

Every pair here has been checked against WCAG AA:

- Ink on white or any pastel: 9:1 or more. Slate on white: 7.2:1, on Cloud: 6.6:1.
- White on Violet: 4.5:1, fine for button labels. Violet Deep on white: 6.4:1.
- Alert on white: 5.4:1, on Alert Wash: 4.75:1.
- Chart colors on white, all at least 3:1: Ocean 3.4, Ultra Violet 4.4, Ember 4.4, Violet 4.5, Forest 7.7, Slate 7.2.

Don't put text in Violet, Iron, Apricot or Electric Cyan, and don't use pastels for lines, icons or text.

## Tokens — Typography

### Poppins · `--font-poppins`

The one typeface, used everywhere. A geometric sans with friendly rounded terminals that match the pill buttons and rounded panels. Weight 300 is for large headline figures only; 500 is for labels, buttons and titles; 400 for body and table cells. Bundle it with the app (for example `@fontsource/poppins`) rather than loading it from the web, so the app works offline.

- **Substitute:** Manrope, DM Sans, Plus Jakarta Sans
- **Weights:** 300, 400, 500, 600
- **Numbers:** tabular figures (`font-variant-numeric: tabular-nums`) in tables, cards and charts, so columns of figures line up.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Weight | Token |
|------|------|-------------|----------------|--------|-------|
| caption | 12px | 1.45 | 0 | 500 | `--text-caption` |
| body-sm | 13px | 1.5 | 0 | 400 | `--text-body-sm` |
| body | 14px | 1.5 | 0 | 400 | `--text-body` |
| label | 14px | 1.4 | 0 | 500 | `--text-label` |
| subheading | 16px | 1.4 | -0.01em | 500 | `--text-subheading` |
| heading-sm | 18px | 1.4 | -0.01em | 500 | `--text-heading-sm` |
| heading | 24px | 1.3 | -0.015em | 500 | `--text-heading` |
| page-title | 28px | 1.2 | -0.015em | 500 | `--text-page-title` |
| figure | 40px | 1.15 | -0.02em | 300 | `--text-figure` |

- **caption:** pills, chart axis labels, helper text.
- **body / label:** table cells, form fields, buttons, table headings.
- **heading-sm:** panel titles. **heading:** record names in dialogs. **page-title:** the title at the top of each page.
- **figure:** headline figures on the dashboard only.
- Small uppercase labels, if used at all, take +0.06em letter spacing.

## Tokens — Spacing & Shapes

**Base unit:** 8px (with 4px for tight gaps inside components)

**Density:** compact for data, roomy around it. Tables and the pipeline fit plenty of records on a laptop screen; panels and page edges keep generous space.

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 48 | 48px | `--spacing-48` |

### Sizes

| Element | Size |
|---------|------|
| Navigation bar | 64px high |
| Button | 40px high, 0 × 20px padding |
| Small button (toolbars, table rows, pipeline columns) | 32px high, 0 × 14px padding |
| Icon button | 32px square, round |
| Input, select | 40px high, 0 × 12px padding |
| Table row | 48px high |
| Table heading row | 40px high |
| Pipeline column | 280px wide |
| Pill | 22px high, 0 × 8px padding |
| Avatar | 24px (cards), 32px (lists) |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Panels and dialogs | 24px | `--radius-panel` |
| Cards (pipeline, small tiles) | 16px | `--radius-card` |
| Menus and tooltips | 12px | `--radius-menu` |
| Inputs, pills, navigation items | 6px | `--radius-input` |
| Buttons | 160px (full pill) | `--radius-button` |
| Avatars, icon buttons | 50% | — |

### Shadows

| Name | Value | Token | Use |
|------|-------|-------|-----|
| soft | `rgba(205, 208, 223, 0.4) 0px 2px 48px 0px` | `--shadow-soft` | Panels and cards at rest |
| lifted | `rgba(0, 0, 0, 0.15) 0px 5px 45px 0px` | `--shadow-lifted` | A pipeline card being dragged, a hovered card |
| overlay | `rgba(0, 0, 0, 0.15) 0px 4px 40px 0px` | `--shadow-overlay` | Dialogs, menus, tooltips |

### Layout

- **Content max-width:** 1200px, centered, with 32px side padding. The pipeline board uses the full width.
- **Gap between panels:** 24px
- **Panel padding:** 24px
- **Element gap:** 8px
- **Screen width:** designed for 1280px and wider, and works at 1024px. No phone layout.

## Components

### Primary Pill Button
**Role:** The main action on a screen, such as "New deal" or "Save"

Filled Violet #6161ff, white text in Poppins 14px weight 500, full pill radius, 40px high (32px in toolbars). One per screen area. Hover darkens to Violet Deep.

### Outlined Pill Button
**Role:** Secondary action, paired with the primary, such as "Cancel"

White background, 1px Pebble border, full pill radius, Ink text. Hover fills with Cloud.

### Danger Pill Button
**Role:** The confirm button in a delete dialog

Filled Alert #c4314b, white text, full pill radius. Only in confirmations.

### Icon Button
**Role:** Row actions (edit, delete) and small tools

32px round, Slate icon, transparent background, Periwinkle on hover, always with a tooltip and an accessible name.

### Panel
**Role:** The main container for tables, charts, record details and timelines

White surface, 24px radius, 24px padding, soft shadow, no border. The title is heading-sm in Ink, with any action on the right of the title row.

### Pastel Tile
**Role:** A headline figure or summary that should stand out, such as the dashboard's follow-ups count

One pastel background, 24px radius, 24px padding, small Slate label above a figure in Ink.

### Pipeline Card
**Role:** A deal on the pipeline board

White surface, 16px radius, 12px × 16px padding, soft shadow. Deal name in label weight, organization in Slate below, then value and probability on one line, close date and the contact's avatar on the next. A late deal carries a Late pill. While dragging it lifts with the lifted shadow and a 2° tilt; the drop place shows as a dashed Violet outline, 16px radius.

### Data Table
**Role:** Organizations, contacts and deals

Inside a panel. Headings in label weight, Slate, 40px row, with a sort arrow on the sorted column. Rows 48px, separated by a 1px Shadow Dust line, Periwinkle background on hover, pointer cursor because the row opens the record. Numbers right-aligned in tabular figures.

### Status Pill
**Role:** A deal's stage, a contact's status, Late, Overdue and Due soon

22px high, 6px radius, pastel background from the stage and status table, Ink text (Alert text on Alert Wash), caption size and weight.

### Avatar
**Role:** A contact, shown by initials

Round, Periwinkle Wash background, Violet Deep initials in caption weight. Overlapping avatars get a 2px white ring.

### Navigation Bar
**Role:** Top-level navigation between Dashboard, Organizations, Contacts, Deals and Pipeline

White, 64px high, sticky. Accountable logo (prism mark and wordmark in Ink) on the left, section links in label weight and Slate, the current one in Violet Deep on a Periwinkle Wash pill, and the main action on the right.

### Dialog
**Role:** Forms and confirmations

White, 24px radius, 24px padding, overlay shadow, a backdrop of Ink at 40%. Title in heading. Cancel and the main action at the bottom right.

## Do's and Don'ts

### Do
- Use full pill buttons everywhere. The pill shape defines Accountable's friendly tone
- Keep Violet for primary actions and brand surfaces, and use Violet Deep when violet must be text
- Use pastels as backgrounds for pills, tiles and timeline badges, always with Ink text
- Keep weight 300 for the 40px headline figures only
- Keep two radius tiers in step: 24px panels, 16px cards, 6px pills and inputs
- Keep the prism gradient for the logo mark only
- Use tabular figures wherever numbers line up

### Don't
- Don't use square or 4px-radius buttons
- Don't put text in Violet, Iron or any pastel
- Don't set body text below 13px or weight 400, or labels below weight 500
- Don't use pure #000000 for text. #333333 is the system's true black
- Don't put more than 3 pastel colors side by side outside the stage colors
- Don't use heavy drop shadows. Panels use one soft shadow
- Don't add action colors. Violet is the one action color; Alert is only for danger and problems
- Don't put a border on one edge of a panel, or a line across the top of the page or under the navigation bar
- Don't use gradient fills on surfaces, buttons or text

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#f5f6f8` | Page background and the pipeline board |
| 1 | Panel / Card | `#ffffff` | Panels, cards, dialogs, navigation bar |
| 2 | Tinted | a pastel | Pastel tiles, pills, timeline badges |
| 3 | Brand | `#6161ff` | Primary buttons and, rarely, a small brand highlight |

## Imagery

Accountable's visuals are its own data: tables, charts, pipeline cards, pills and avatars. There is no photography, illustration or stock imagery. Icons are simple line icons (Lucide), 16–20px, in Slate or Ink. The only decorative visual is the prism gradient in the logo mark.

## Charts

- White panel background, light Shadow Dust gridlines on the value axis only, no chart border.
- Axis labels in caption size, Slate. Values formatted as money with the currency, short form on axes (`USD 85K`).
- Lines 2.5px with small round points; bars with a 6px top radius.
- Colors from the stage and status table; one-series charts use Violet.
- Tooltips are white cards with a 12px radius and the overlay shadow.
- Label lines and bars directly where they fit, instead of a legend.

## Layout

A sticky white navigation bar sits at the top. Below it, content is centered at up to 1200px on the Cloud canvas, and each page starts with its title on the left and its main action on the right. Pages are made of white panels with 24px gaps. The pipeline board uses the full width and scrolls sideways when its columns don't fit.

## Quick Color Reference

- Primary text: #333333
- Secondary text: #535768
- Page background: #f5f6f8
- Panel surface: #ffffff
- Primary action: #6161ff, with white text
- Violet text and links: #4b4bd6
- Problems and danger: #c4314b

## Example Component Prompts

1. **Primary Button**: #6161ff background, #ffffff text, 160px radius, 40px high, 20px side padding, Poppins 14px weight 500.

2. **Pastel Tile**: Background #eddff7. 24px radius. 24px padding. Label in Poppins 13px weight 500 #535768, figure below in Poppins 40px weight 300 #333333 with tabular figures.

3. **Pipeline Card**: White #ffffff surface, 16px radius, 12px × 16px padding, shadow rgba(205,208,223,0.4) 0 2px 48px. Deal name in 14px weight 500 #333333, organization in 13px #535768, value as "USD 48,000" and "50%", close date, and a 24px avatar with initials on #dbdbff.

4. **Status Pill**: 22px high, 6px radius, background #ffd0b3, label "Negotiation" in Poppins 12px weight 500 #333333.

## Gradient System

There is one gradient: the **brand prism**, a conic gradient cycling violet → teal → green → yellow → pink → violet, used only for the logo mark. Gradients are never used on surfaces, buttons, text or charts.

## Component Visual Language

The system is **flat with a soft shadow**: white panels on a soft gray canvas, told apart by space and a single soft shadow rather than borders. Pastel tints mark meaning (a stage, a status, a type of activity) rather than decoration. Buttons are filled pills. The data areas are compact and orderly, and the space around them is generous, so the app feels like a calm, tidy workshop.

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Brand and neutrals */
  --color-violet: #6161ff;
  --color-violet-deep: #4b4bd6;
  --color-ink: #333333;
  --color-slate: #535768;
  --color-iron: #808080;
  --color-fog: #cacbcd;
  --color-mist: #d0d4e4;
  --color-pebble: #dddfeb;
  --color-cloud: #f5f6f8;
  --color-snow: #ffffff;
  --color-shadow-dust: #e6e7ea;

  /* Pastel surfaces */
  --color-mint: #bcfe90;
  --color-sky: #abf0ff;
  --color-periwinkle-wash: #dbdbff;
  --color-lavender: #eddff7;
  --color-apricot-wash: #ffd0b3;
  --color-periwinkle: #e7ecff;
  --color-aqua: #d1faff;
  --color-peony: #fcd0f8;

  /* Status and charts */
  --color-alert: #c4314b;
  --color-alert-wash: #feecef;
  --color-forest: #2a5c4e;
  --color-ocean: #3a8fd9;
  --color-ultra-violet: #9450fd;
  --color-ember: #c25a14;
  --color-apricot: #ff8940;
  --color-electric-cyan: #3ac9ff;
  --color-prism: #8181ff;
  --gradient-prism: conic-gradient(from 270deg, rgb(129, 129, 255) 15%, rgb(51, 219, 219) 40%, rgb(51, 213, 142) 55%, rgb(255, 214, 51) 65%, rgb(252, 82, 125) 85%, rgb(129, 129, 255) 100%);

  /* Typography */
  --font-poppins: 'Poppins', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  --text-caption: 12px;
  --leading-caption: 1.45;
  --text-body-sm: 13px;
  --leading-body-sm: 1.5;
  --text-body: 14px;
  --leading-body: 1.5;
  --text-label: 14px;
  --leading-label: 1.4;
  --text-subheading: 16px;
  --leading-subheading: 1.4;
  --tracking-subheading: -0.01em;
  --text-heading-sm: 18px;
  --leading-heading-sm: 1.4;
  --tracking-heading-sm: -0.01em;
  --text-heading: 24px;
  --leading-heading: 1.3;
  --tracking-heading: -0.015em;
  --text-page-title: 28px;
  --leading-page-title: 1.2;
  --tracking-page-title: -0.015em;
  --text-figure: 40px;
  --leading-figure: 1.15;
  --tracking-figure: -0.02em;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-48: 48px;

  /* Layout */
  --page-max-width: 1200px;
  --page-padding: 32px;
  --panel-gap: 24px;
  --panel-padding: 24px;
  --element-gap: 8px;
  --nav-height: 64px;

  /* Sizes */
  --control-height: 40px;
  --control-height-sm: 32px;
  --row-height: 48px;
  --pipeline-column-width: 280px;

  /* Radius */
  --radius-panel: 24px;
  --radius-card: 16px;
  --radius-menu: 12px;
  --radius-input: 6px;
  --radius-button: 160px;

  /* Shadows */
  --shadow-soft: rgba(205, 208, 223, 0.4) 0px 2px 48px 0px;
  --shadow-lifted: rgba(0, 0, 0, 0.15) 0px 5px 45px 0px;
  --shadow-overlay: rgba(0, 0, 0, 0.15) 0px 4px 40px 0px;

  /* Surfaces */
  --surface-canvas: #f5f6f8;
  --surface-panel: #ffffff;
}
```

### Tailwind v4

```css
@theme {
  --color-violet: #6161ff;
  --color-violet-deep: #4b4bd6;
  --color-ink: #333333;
  --color-slate: #535768;
  --color-iron: #808080;
  --color-fog: #cacbcd;
  --color-mist: #d0d4e4;
  --color-pebble: #dddfeb;
  --color-cloud: #f5f6f8;
  --color-snow: #ffffff;
  --color-shadow-dust: #e6e7ea;
  --color-mint: #bcfe90;
  --color-sky: #abf0ff;
  --color-periwinkle-wash: #dbdbff;
  --color-lavender: #eddff7;
  --color-apricot-wash: #ffd0b3;
  --color-periwinkle: #e7ecff;
  --color-aqua: #d1faff;
  --color-peony: #fcd0f8;
  --color-alert: #c4314b;
  --color-alert-wash: #feecef;
  --color-forest: #2a5c4e;
  --color-ocean: #3a8fd9;
  --color-ultra-violet: #9450fd;
  --color-ember: #c25a14;
  --color-apricot: #ff8940;
  --color-electric-cyan: #3ac9ff;
  --color-prism: #8181ff;

  --font-poppins: 'Poppins', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  --text-caption: 12px;
  --text-body-sm: 13px;
  --text-body: 14px;
  --text-subheading: 16px;
  --text-heading-sm: 18px;
  --text-heading: 24px;
  --text-page-title: 28px;
  --text-figure: 40px;

  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-48: 48px;

  --radius-panel: 24px;
  --radius-card: 16px;
  --radius-menu: 12px;
  --radius-input: 6px;
  --radius-button: 160px;

  --shadow-soft: rgba(205, 208, 223, 0.4) 0px 2px 48px 0px;
  --shadow-lifted: rgba(0, 0, 0, 0.15) 0px 5px 45px 0px;
  --shadow-overlay: rgba(0, 0, 0, 0.15) 0px 4px 40px 0px;
}
```
