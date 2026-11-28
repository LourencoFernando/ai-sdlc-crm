# Accountable — Style Reference
> white workshop with pastel sticky notes

**Theme:** light, with a dark mode

Accountable is a CRM people use all day, on a laptop or desktop screen. It uses a white-canvas productivity look with violet as its one brand voice. Screens breathe through whitespace, near-black type and pastel card surfaces drawn from a crayon-box palette (soft green, powder blue, peach, lavender, mint), which gives a playful, human feel in a business tool. A dark mode keeps the same layout and components on deep blue-gray surfaces, with each pastel turned into a deep tint of the same hue. Violet (#6161ff) owns the primary action and brand surfaces. Components are pill-shaped and rounded: pill buttons, 24px panels, 16px cards, 6px tags. The scale is set for working with data: compact enough for tables and boards with many records, with larger, lighter type kept for headline figures.

## Tokens — Colors

### How the color tokens work

There are two kinds of color token, and components use only these tokens, never raw values:

- **Role tokens** are named for what they do (`--color-text`, `--color-surface`, `--color-border`), so the name stays true in both modes.
- **Hue tokens** are named for their hue (`--color-mint`, `--color-ocean`, `--color-alert`). Each hue has a light-mode value and a darker or brighter dark-mode value, so a Mint pill is still mint in dark mode.

Light values sit on `:root`. Dark values sit on `:root[data-theme="dark"]`, which redefines the same tokens and nothing else. Every color, including see-through ones, is a token: there are no raw values in component styles and no per-component dark overrides.

The light swatch names (Ink, Slate, Cloud, Snow…) are kept as names for the light values, so older mockups and notes still make sense.

### Brand and neutrals

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-violet` | Violet `#6161ff` | `#6161ff` | Primary button fill, brand surfaces, active states, the Qualified and one-series chart color. Never text: use Violet text |
| `--color-violet-hover` | Violet Deep `#4b4bd6` | `#4b4bd6` | Primary button hover |
| `--color-violet-text` | Violet Deep `#4b4bd6` | `#a9a9ff` | Violet text, links, the current navigation item, avatar initials, focus rings |
| `--color-on-fill` | White `#ffffff` | `#ffffff` | Text and icons on Violet and Alert fills |
| `--color-text` | Ink `#333333` | `#e7e8ef` | Primary text, headings, button labels. Neither mode uses pure black or pure white for text |
| `--color-text-muted` | Slate `#535768` | `#a4a8bb` | Secondary text, labels, navigation links, icons, axis labels, the Lost chart color |
| `--color-text-faint` | Iron `#808080` | `#7c8094` | Disabled icons and input placeholders only. Too faint for text people need to read |
| `--color-canvas` | Cloud `#f5f6f8` | `#14151b` | Page canvas, pipeline board, neutral button fills, the Lost pill. The floor everything sits on |
| `--color-surface` | Snow `#ffffff` | `#1d1e27` | Panels, cards, sidebar, input fields, table rows |
| `--color-surface-raised` | Snow `#ffffff` | `#262834` | Dialogs, menus, select lists, chart tooltips: things that float above a panel |
| `--color-surface-hover` | Periwinkle `#e7ecff` | `#272a40` | Hover on rows, menu items and icon buttons |
| `--color-inverse` | Ink `#333333` | `#e7e8ef` | Small tooltips and toasts, which stand out by being the opposite of the page |
| `--color-on-inverse` | White `#ffffff` | `#1d1e27` | Text on `--color-inverse` |
| `--color-border` | Border `#c3c7d6` | `#3b3e4f` | 1px outline on every side of panels, cards, the search field and the Lost column header |
| `--color-border-soft` | Mist `#d0d4e4` | `#323546` | Light card outlines where a shadow isn't enough |
| `--color-border-input` | Pebble `#dddfeb` | `#454859` | Input borders, outlined pill buttons, checkboxes |
| `--color-border-disabled` | Fog `#cacbcd` | `#4b4e5c` | Outline of the Lost pill, disabled borders |
| `--color-divider` | Shadow Dust `#e6e7ea` | `#2b2d39` | Lines between table rows, chart gridlines, probability bar tracks |
| `--color-backdrop` | Ink at 40%, `rgb(51 51 51 / 0.4)` | `rgb(0 0 0 / 0.6)` | Behind dialogs |

### Pastel surfaces

Pastels are backgrounds only, always with `--color-text`. In dark mode each becomes a deep tint of its hue, which keeps the stage and status colors recognisable without glare.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-mint` | Mint `#bcfe90` | `#1e3b24` | Won stage, Customer status, call entries |
| `--color-sky` | Sky `#abf0ff` | `#123845` | New stage, Lead status, email entries |
| `--color-periwinkle-wash` | Periwinkle Wash `#dbdbff` | `#2b2b5e` | Qualified stage and status, stage-change entries, the current navigation item, avatars |
| `--color-lavender` | Lavender `#eddff7` | `#33284a` | Proposal stage, note entries, the dashboard's follow-ups panel |
| `--color-lavender-border` | `#dccbe9` | `#4a3b66` | Outline of the Lavender follow-ups panel and its cards |
| `--color-apricot-wash` | Apricot Wash `#ffd0b3` | `#4a2c1b` | Negotiation stage, Due soon pills |
| `--color-aqua` | Aqua `#d1faff` | `#12393f` | Spare accent surface |
| `--color-peony` | Peony `#fcd0f8` | `#44203f` | Spare accent surface |
| `--color-track-on-pastel` | `rgb(255 255 255 / 0.7)` | `rgb(255 255 255 / 0.12)` | Track of the expected-revenue bar in pipeline column headers |
| `--color-inset-on-pastel` | `rgb(255 255 255 / 0.55)` | `rgb(0 0 0 / 0.25)` | The segmented control's track on the follow-ups panel |

### Status and charts

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-alert` | Alert `#c4314b` | `#ff7088` | Text and marks for late deals, overdue follow-ups, form errors and figures that went down |
| `--color-alert-wash` | Alert Wash `#feecef` | `#45202a` | Background of Late and Overdue pills, with Alert text |
| `--color-alert-fill` | `#c4314b` | `#c4314b` | Delete button fill, with `--color-on-fill` text |
| `--color-alert-fill-hover` | `#a92a40` | `#a92a40` | Delete button hover |
| `--color-forest` | Forest `#2a5c4e` | `#5cc49c` | Won deals in charts, figures that went up |
| `--color-ocean` | Ocean `#3a8fd9` | `#5aaef0` | New stage in charts |
| `--color-ultra-violet` | Ultra Violet `#9450fd` | `#b388ff` | Proposal stage in charts |
| `--color-ember` | Ember `#c25a14` | `#ec8a45` | Negotiation stage in charts |
| `--color-apricot` | Apricot `#ff8940` | `#ff8940` | Warm accent and the source of Apricot Wash. Too light for chart lines or text |
| `--color-electric-cyan` | Electric Cyan `#3ac9ff` | `#3ac9ff` | Decorative accent only. Too light for chart lines or text |
| `--color-drop-place` | `rgb(97 97 255 / 0.04)` | `rgb(97 97 255 / 0.12)` | Fill inside the dashed Violet outline where a dragged card will land |

### Stage and status colors

The same tokens in both modes; each token carries its own dark value.

| Stage or status | Pill background (`--color-text`) | Chart color |
|-----------------|----------------------------------|-------------|
| New | Sky | Ocean |
| Qualified | Periwinkle Wash | Violet |
| Proposal | Lavender | Ultra Violet |
| Negotiation | Apricot Wash | Ember |
| Won | Mint | Forest |
| Lost | Canvas with a disabled-border outline | Muted text |
| Lead / Qualified / Customer | Sky / Periwinkle Wash / Mint | — |
| Late, Overdue | Alert Wash, Alert text | Alert |
| Due soon | Apricot Wash | — |

### Contrast

Every pair here has been checked against WCAG AA (4.5:1 for text, 3:1 for chart marks). Use only these pairs.

**Light mode**

- Text on white or any pastel: 9:1 or more. Muted text on white: 7.2:1, on canvas: 6.6:1.
- White on Violet: 4.5:1, fine for button labels. Violet text on white: 6.4:1.
- Alert on white: 5.4:1, on Alert Wash: 4.75:1. White on Alert fill: 5.4:1.
- Chart colors on white, all at least 3:1: Ocean 3.4, Ultra Violet 4.4, Ember 4.4, Violet 4.5, Forest 7.7, Muted text 7.2.

**Dark mode**

- Text on canvas 14.9:1, on surface 13.6:1, on raised surface 12.0:1, on hover 11.5:1, on any pastel 10:1 or more.
- Muted text on surface 7.0:1, on canvas 7.7:1, on raised 6.2:1, on hover 6.0:1, on any pastel 5.2:1 or more.
- Faint text (placeholders) on surface 4.2:1.
- Violet text on surface 7.7:1, on canvas 8.5:1, on raised 6.8:1, on Periwinkle Wash 6.1:1, on Lavender 6.4:1, on hover 6.6:1.
- White on Violet 4.5:1, on Violet hover 6.4:1, on Alert fill 5.4:1. Text on inverse 13.6:1.
- Alert on surface 6.3:1, on raised 5.5:1, on Alert Wash 5.3:1. Forest on surface 7.8:1, on raised 6.9:1.
- Chart colors on surface, all at least 3:1: Ocean 6.9, Ultra Violet 6.2, Ember 6.5, Violet 3.7, Forest 7.8, Muted text 7.0, Alert 6.3.

Don't put text in Violet, Faint text, Apricot or Electric Cyan, and don't use pastels for lines, icons or text.

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
| Sidebar | 240px wide, 72px when collapsed |
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
| soft | `rgba(205, 208, 223, 0.4) 0px 2px 48px 0px` | `--shadow-soft` | Floating items with no outline, such as a toast. Panels and cards use the 1px Border outline instead |
| lifted | `rgba(0, 0, 0, 0.15) 0px 5px 45px 0px` | `--shadow-lifted` | A pipeline card being dragged, a hovered card |
| overlay | `rgba(0, 0, 0, 0.15) 0px 4px 40px 0px` | `--shadow-overlay` | Dialogs, menus, tooltips |

In dark mode the same tokens are deeper, because a pale shadow disappears on a dark canvas: soft `rgba(0, 0, 0, 0.35) 0px 2px 48px 0px`, lifted `rgba(0, 0, 0, 0.55) 0px 5px 45px 0px`, overlay `rgba(0, 0, 0, 0.5) 0px 4px 40px 0px, #3b3e4f 0px 0px 0px 1px`. The overlay adds a 1px ring in the Border color, because a dialog or list on top of another raised surface would otherwise have no visible edge. Floating things also sit on the raised surface, so they stand apart by color as well as shadow.

### Layout

- **Content width:** content fills the space beside the sidebar, with 32px side padding. Pipeline columns grow to fill it, and the board scrolls sideways when they don't fit.
- **Gap between panels:** 24px
- **Panel padding:** 24px
- **Element gap:** 8px
- **Screen width:** designed for 1280px and wider, and works at 1024px. No phone layout.

## Components

### Primary Pill Button
**Role:** The main action on a screen, such as "New deal" or "Save"

Filled Violet, On-fill text in Poppins 14px weight 500, full pill radius, 40px high (32px in toolbars). One per screen area. Hover darkens to Violet hover.

### Outlined Pill Button
**Role:** Secondary action, paired with the primary, such as "Cancel"

Surface background, 1px input border, full pill radius, Text color. Hover fills with Canvas.

### Danger Pill Button
**Role:** The confirm button in a delete dialog

Filled Alert fill, On-fill text, full pill radius, Alert fill hover. Only in confirmations.

### Icon Button
**Role:** Row actions (edit, delete) and small tools

32px round, Muted text icon, transparent background, hover surface on hover, always with a tooltip and an accessible name.

### Panel
**Role:** The main container for tables, charts, record details and timelines

Surface, 24px radius, 24px padding, 1px Border outline on all four sides, no shadow. The title is heading-sm in Text color, with any action on the right of the title row.

### Pastel Tile
**Role:** A headline figure or summary that should stand out, such as the dashboard's follow-ups count

One pastel background, 24px radius, 24px padding, small Muted text label above a figure in Text color.

### Pipeline Card
**Role:** A deal on the pipeline board

Surface, 16px radius, 12px × 16px padding, 1px Border outline. Deal name in label weight, organization in Muted text below, then value and probability on one line, close date and the contact's avatar on the next. A late deal carries a Late pill. While dragging it lifts with the lifted shadow and a 2° tilt; the drop place shows as a dashed Violet outline, 16px radius, filled with Drop place.

### Data Table
**Role:** Organizations, contacts and deals

Inside a panel. Headings in label weight, Muted text, 40px row, with a sort arrow on the sorted column. Rows 48px, separated by a 1px Divider line, hover surface on hover, pointer cursor because the row opens the record. Numbers right-aligned in tabular figures.

### Status Pill
**Role:** A deal's stage, a contact's status, Late, Overdue and Due soon

22px high, 6px radius, pastel background from the stage and status table, Text color (Alert text on Alert Wash), caption size and weight.

### Avatar
**Role:** A contact, shown by initials

Round, Periwinkle Wash background, Violet text initials in caption weight. Overlapping avatars get a 2px ring in Surface.

### Sidebar
**Role:** Top-level navigation between Dashboard, Organizations, Contacts, Deals and Pipeline

Surface, fixed to the left edge, full height, 240px wide. From the top: the Accountable logo, the primary "New deal" button, then one 40px link per section with an 18px Lucide icon and its name in label weight and Muted text. The current section is Violet text on a Periwinkle Wash pill. At the bottom, two 40px rows styled like the links: "Dark mode", a switch with a moon icon and a small pill track on the right (Faint text track when off, so the white knob stands out at 3:1 or more; Violet track with an On-fill knob when on, and the moon turns Violet text, so the collapsed sidebar still shows the state), and below it "Collapse menu", which shrinks the sidebar to 72px, showing only the logo mark, a round plus button and the icons, each with a tooltip and accessible name. Both choices are remembered per browser. The sidebar is told apart from the canvas by its Surface color, with no edge line.

### Logo
The mark is a ring in solid Violet: 24px across with a 5px stroke. Beside it, the wordmark "Accountable" in Text color, Poppins 18px weight 600. Collapsed, only the ring shows. The ring is Violet in both modes. The logo uses no gradient and no other color.

### Dialog
**Role:** Forms and confirmations

Raised surface, 24px radius, 24px padding, overlay shadow, the Backdrop behind it. Title in heading. Cancel and the main action at the bottom right.

## Do's and Don'ts

### Do
- Use full pill buttons everywhere. The pill shape defines Accountable's friendly tone
- Keep Violet for primary actions and brand surfaces, and use Violet text when violet must be text
- Use role and hue tokens for every color, in both modes, and check new pairs against the Contrast section for each mode
- Use pastels as backgrounds for pills, tiles and timeline badges, always with Text color
- Keep weight 300 for the 40px headline figures only
- Keep two radius tiers in step: 24px panels, 16px cards, 6px pills and inputs
- Use tabular figures wherever numbers line up

### Don't
- Don't use square or 4px-radius buttons
- Don't put text in Violet, Faint text or any pastel
- Don't set body text below 13px or weight 400, or labels below weight 500
- Don't use pure #000000 for text in light mode, or pure #ffffff in dark mode. Text color is the system's true black and true white
- Don't write a raw color in a component, or override a color for dark mode inside a component: change the token instead
- Don't put more than 3 pastel colors side by side outside the stage colors
- Don't use heavy drop shadows. Panels and cards use a 1px outline; shadows are for dragged cards, menus and dialogs
- Don't add action colors. Violet is the one action color; Alert is only for danger and problems
- Don't put a border on one edge of a panel or the sidebar, or a line across the top of the page
- Don't use gradient fills anywhere, including the logo

## Surfaces

| Level | Name | Light | Dark | Purpose |
|-------|------|-------|------|---------|
| 0 | Canvas | `#f5f6f8` | `#14151b` | Page background and the pipeline board |
| 1 | Surface | `#ffffff` | `#1d1e27` | Panels, cards, sidebar |
| 2 | Raised | `#ffffff` | `#262834` | Dialogs, menus, chart tooltips |
| 3 | Tinted | a pastel | a deep pastel | Pastel tiles, pills, timeline badges |
| 4 | Brand | `#6161ff` | `#6161ff` | Primary buttons and, rarely, a small brand highlight |

## Imagery

Accountable's visuals are its own data: tables, charts, pipeline cards, pills and avatars. There is no photography, illustration or stock imagery. Icons are simple line icons (Lucide), 16–20px, in Muted text or Text color.

## Charts

- Surface background, light Divider gridlines on the value axis only, no chart border.
- Axis labels in caption size, Muted text. Values formatted as money with the currency, short form on axes (`USD 85K`).
- Lines 2.5px with small round points filled with Surface; bars with a 6px top radius.
- Colors from the stage and status table; one-series charts use Violet. Charts take their colors from the tokens, so they follow the mode.
- Tooltips are Raised surface cards with a 12px radius and the overlay shadow.
- Label lines and bars directly where they fit, instead of a legend.

## Layout

A collapsible Surface sidebar sits on the left. Content fills the rest of the width on the canvas, with 32px side padding, and each page starts with its title on the left and its main action on the right. Pages are made of Surface panels with 24px gaps. Pipeline columns grow to fill the width, and the board scrolls sideways when they don't fit.

## Quick Color Reference

| Role | Light | Dark |
|------|-------|------|
| Primary text | #333333 | #e7e8ef |
| Secondary text | #535768 | #a4a8bb |
| Page background | #f5f6f8 | #14151b |
| Panel surface | #ffffff | #1d1e27 |
| Primary action, with white text | #6161ff | #6161ff |
| Violet text and links | #4b4bd6 | #a9a9ff |
| Problems (text) | #c4314b | #ff7088 |
| Danger fill, with white text | #c4314b | #c4314b |

## Example Component Prompts

These are light mode; in dark mode use the dark value of each token.

1. **Primary Button**: #6161ff background, #ffffff text, 160px radius, 40px high, 20px side padding, Poppins 14px weight 500.

2. **Pastel Tile**: Background #eddff7. 24px radius. 24px padding. Label in Poppins 13px weight 500 #535768, figure below in Poppins 40px weight 300 #333333 with tabular figures.

3. **Pipeline Card**: White #ffffff surface, 16px radius, 12px × 16px padding, 1px #c3c7d6 outline. Deal name in 14px weight 500 #333333, organization in 13px #535768, value as "USD 48,000" and "50%", close date, and a 24px avatar with initials on #dbdbff.

4. **Status Pill**: 22px high, 6px radius, background #ffd0b3, label "Negotiation" in Poppins 12px weight 500 #333333.

## Gradient System

There are no gradients. The logo, surfaces, buttons, text and charts all use flat colors.

## Component Visual Language

The system is **flat and outlined**: Surface panels and cards on a slightly darker canvas (white on soft gray in light mode, blue-gray on near-black in dark mode), each with a 1px Border outline so edges read clearly. Pastel tints mark meaning (a stage, a status, a type of activity) rather than decoration. Buttons are filled pills. The data areas are compact and orderly, and the space around them is generous, so the app feels like a calm, tidy workshop.

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Brand and neutrals (role tokens) */
  --color-violet: #6161ff;
  --color-violet-hover: #4b4bd6;
  --color-violet-text: #4b4bd6;
  --color-on-fill: #ffffff;
  --color-text: #333333;
  --color-text-muted: #535768;
  --color-text-faint: #808080;
  --color-canvas: #f5f6f8;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-hover: #e7ecff;
  --color-inverse: #333333;
  --color-on-inverse: #ffffff;
  --color-border: #c3c7d6;
  --color-border-soft: #d0d4e4;
  --color-border-input: #dddfeb;
  --color-border-disabled: #cacbcd;
  --color-divider: #e6e7ea;
  --color-backdrop: rgb(51 51 51 / 0.4);

  /* Pastel surfaces (hue tokens) */
  --color-mint: #bcfe90;
  --color-sky: #abf0ff;
  --color-periwinkle-wash: #dbdbff;
  --color-lavender: #eddff7;
  --color-lavender-border: #dccbe9;
  --color-apricot-wash: #ffd0b3;
  --color-aqua: #d1faff;
  --color-peony: #fcd0f8;
  --color-track-on-pastel: rgb(255 255 255 / 0.7);
  --color-inset-on-pastel: rgb(255 255 255 / 0.55);

  /* Status and charts (hue tokens) */
  --color-alert: #c4314b;
  --color-alert-wash: #feecef;
  --color-alert-fill: #c4314b;
  --color-alert-fill-hover: #a92a40;
  --color-forest: #2a5c4e;
  --color-ocean: #3a8fd9;
  --color-ultra-violet: #9450fd;
  --color-ember: #c25a14;
  --color-apricot: #ff8940;
  --color-electric-cyan: #3ac9ff;
  --color-drop-place: rgb(97 97 255 / 0.04);

  color-scheme: light;

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
  --page-padding: 32px;
  --panel-gap: 24px;
  --panel-padding: 24px;
  --element-gap: 8px;
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 72px;

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
}

/* Dark mode: the same tokens, nothing else */
:root[data-theme="dark"] {
  --color-violet-text: #a9a9ff;
  --color-text: #e7e8ef;
  --color-text-muted: #a4a8bb;
  --color-text-faint: #7c8094;
  --color-canvas: #14151b;
  --color-surface: #1d1e27;
  --color-surface-raised: #262834;
  --color-surface-hover: #272a40;
  --color-inverse: #e7e8ef;
  --color-on-inverse: #1d1e27;
  --color-border: #3b3e4f;
  --color-border-soft: #323546;
  --color-border-input: #454859;
  --color-border-disabled: #4b4e5c;
  --color-divider: #2b2d39;
  --color-backdrop: rgb(0 0 0 / 0.6);

  --color-mint: #1e3b24;
  --color-sky: #123845;
  --color-periwinkle-wash: #2b2b5e;
  --color-lavender: #33284a;
  --color-lavender-border: #4a3b66;
  --color-apricot-wash: #4a2c1b;
  --color-aqua: #12393f;
  --color-peony: #44203f;
  --color-track-on-pastel: rgb(255 255 255 / 0.12);
  --color-inset-on-pastel: rgb(0 0 0 / 0.25);

  --color-alert: #ff7088;
  --color-alert-wash: #45202a;
  --color-forest: #5cc49c;
  --color-ocean: #5aaef0;
  --color-ultra-violet: #b388ff;
  --color-ember: #ec8a45;
  --color-drop-place: rgb(97 97 255 / 0.12);

  --shadow-soft: rgba(0, 0, 0, 0.35) 0px 2px 48px 0px;
  --shadow-lifted: rgba(0, 0, 0, 0.55) 0px 5px 45px 0px;
  --shadow-overlay: rgba(0, 0, 0, 0.5) 0px 4px 40px 0px, #3b3e4f 0px 0px 0px 1px;

  color-scheme: dark;
}
```

### Tailwind v4

The light values. For dark mode, add the `:root[data-theme="dark"]` block above after the theme, so the same utilities switch with the mode.

```css
@theme {
  --color-violet: #6161ff;
  --color-violet-hover: #4b4bd6;
  --color-violet-text: #4b4bd6;
  --color-on-fill: #ffffff;
  --color-text: #333333;
  --color-text-muted: #535768;
  --color-text-faint: #808080;
  --color-canvas: #f5f6f8;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-hover: #e7ecff;
  --color-inverse: #333333;
  --color-on-inverse: #ffffff;
  --color-border: #c3c7d6;
  --color-border-soft: #d0d4e4;
  --color-border-input: #dddfeb;
  --color-border-disabled: #cacbcd;
  --color-divider: #e6e7ea;
  --color-backdrop: rgb(51 51 51 / 0.4);
  --color-mint: #bcfe90;
  --color-sky: #abf0ff;
  --color-periwinkle-wash: #dbdbff;
  --color-lavender: #eddff7;
  --color-lavender-border: #dccbe9;
  --color-apricot-wash: #ffd0b3;
  --color-aqua: #d1faff;
  --color-peony: #fcd0f8;
  --color-track-on-pastel: rgb(255 255 255 / 0.7);
  --color-inset-on-pastel: rgb(255 255 255 / 0.55);
  --color-alert: #c4314b;
  --color-alert-wash: #feecef;
  --color-alert-fill: #c4314b;
  --color-alert-fill-hover: #a92a40;
  --color-forest: #2a5c4e;
  --color-ocean: #3a8fd9;
  --color-ultra-violet: #9450fd;
  --color-ember: #c25a14;
  --color-apricot: #ff8940;
  --color-electric-cyan: #3ac9ff;
  --color-drop-place: rgb(97 97 255 / 0.04);

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
