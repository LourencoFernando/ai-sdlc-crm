# Accountable — Style Reference
> white workshop with pastel sticky notes

**Theme:** light

Accountable uses a white-canvas productivity look with violet as its one brand voice. Screens breathe through generous whitespace, near-black type and pastel card surfaces drawn from a crayon-box palette (soft green, powder blue, peach, lavender, mint). That gives a playful, human feel in a business tool. Violet (#6161ff) owns the primary action and brand surfaces. Components are pill-shaped and generously rounded: 160px buttons, 24px cards, 6px tags. Flat, text-led areas such as tables and forms sit next to elevated surfaces such as dashboard cards and pipeline boards.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Violet | `#6161ff` | `--color-violet` | Primary action buttons, brand surfaces, active states, gradient stops. Saturated indigo reads as confident but approachable, not corporate |
| Ink | `#333333` | `--color-ink` | Primary body text, headings, button labels. Near-black with a hint of warmth avoids the harshness of pure #000 |
| Slate | `#535768` | `--color-slate` | Secondary text, navigation links, icon fills. Cool gray supports hierarchy without competing with headings |
| Iron | `#808080` | `--color-iron` | Muted helper text, disabled icon strokes, tertiary borders |
| Fog | `#cacbcd` | `--color-fog` | Card and container borders, subtle dividers between content blocks |
| Mist | `#d0d4e4` | `--color-mist` | Light card borders, the standard outline color for elevated card surfaces |
| Pebble | `#dddfeb` | `--color-pebble` | Badge borders, pill-button outlines, input borders |
| Cloud | `#f5f6f8` | `--color-cloud` | Page canvas, section backgrounds, neutral button fills. The floor color everything floats on |
| Snow | `#ffffff` | `--color-snow` | Card surfaces, button text, navigation background, input fields |
| Shadow Dust | `#e6e7ea` | `--color-shadow-dust` | Box-shadow tint, barely-there surface lifts |
| Mint | `#bcfe90` | `--color-mint` | Green wash for highlight backgrounds and soft emphasis behind content |
| Sky | `#abf0ff` | `--color-sky` | Blue wash for highlight backgrounds and soft emphasis behind content |
| Apricot | `#ff8940` | `--color-apricot` | Orange wash for highlight backgrounds and soft emphasis behind content. Also the warm stop of the pink-to-orange accent gradient (`--gradient-apricot`) |
| Lavender | `#eddff7` | `--color-lavender` | Decorative card background, soft category surface |
| Periwinkle | `#e7ecff` | `--color-periwinkle` | Decorative card background, light brand-tinted surface |
| Cornflower | `#93beff` | `--color-cornflower` | Decorative card background, secondary brand surface |
| Aqua | `#d1faff` | `--color-aqua` | Decorative card background, cyan accent surface |
| Cotton Candy | `#e98dfe` | `--color-cotton-candy` | Card border accent, playful highlight stroke |
| Ultra Violet | `#9450fd` | `--color-ultra-violet` | Deep brand accent, chart series |
| Electric Cyan | `#3ac9ff` | `--color-electric-cyan` | Feature highlight, chart series |
| Forest | `#2a5c4e` | `--color-forest` | Teal for selected navigation states and positive outcomes such as won deals |
| Peony | `#fcd0f8` | `--color-peony` | Soft pink fill for tags and highlights |
| Periwinkle Wash | `#dbdbff` | `--color-periwinkle-wash` | Badge and tag background. Tints pill elements with brand warmth |
| Prism | `#8181ff` | `--color-prism` | Base color of the prism gradient (`--gradient-prism`), used for small decorative accents |

## Tokens — Typography

### Poppins · `--font-poppins`

The one typeface, used for navigation, body, headings, buttons, badges and every screen. A geometric sans with friendly rounded terminals; the rounded forms match the pill buttons and 24px card radii, so the whole interface feels approachable. Weight 300 for large display figures gives a soft, modern presence; weight 700 for navigation and button labels carries authority without heaviness.

- **Substitute:** Manrope, DM Sans, Plus Jakarta Sans
- **Weights:** 300, 400, 500, 700
- **Sizes:** 8, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 52, 56, 64
- **Line height:** 1.15–2.46
- **Letter spacing:** Negative tracking tightens large type: -0.04em at 64px, -0.02em at 48–56px, -0.015em at 28–40px, -0.01em at body sizes. Small uppercase labels (8–12px eyebrow text) use +0.2em.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 12px | 1.45 | -0.12px | `--text-caption` |
| body-sm | 14px | 1.5 | — | `--text-body-sm` |
| body | 16px | 1.5 | -0.16px | `--text-body` |
| subheading | 20px | 1.4 | -0.22px | `--text-subheading` |
| heading-sm | 24px | 1.3 | -0.36px | `--text-heading-sm` |
| heading | 36px | 1.2 | -0.54px | `--text-heading` |
| heading-lg | 48px | 1.15 | -0.96px | `--text-heading-lg` |
| display | 64px | 1.15 | -2.56px | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 8px

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 8 | 8px | `--spacing-8` |
| 16 | 16px | `--spacing-16` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |
| 64 | 64px | `--spacing-64` |
| 80 | 80px | `--spacing-80` |
| 96 | 96px | `--spacing-96` |

### Border Radius

| Element | Value |
|---------|-------|
| nav | 6px |
| cards | 24px |
| badges | 6px |
| images | 12px |
| inputs | 6px |
| buttons | 160px |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| xl | `rgba(205, 208, 223, 0.4) 0px 2px 48px 0px` | `--shadow-xl` |
| xl-2 | `rgba(0, 0, 0, 0.15) 0px 5px 45px 0px` | `--shadow-xl-2` |
| xl-3 | `rgba(0, 0, 0, 0.15) 0px 4px 40px 0px` | `--shadow-xl-3` |
| xl-4 | `rgba(0, 0, 0, 0.4) 0px 5px 55px 0px` | `--shadow-xl-4` |
| subtle | `rgb(0, 0, 0) 0px -2px 0px 0px inset` | `--shadow-subtle` |

### Layout

- **Content max-width:** 1200px (the pipeline board may use the full width)
- **Section gap:** 64px
- **Card padding:** 24px
- **Element gap:** 8px

## Components

### Primary Pill Button
**Role:** The main action on a screen, such as "New deal" or "Save"

Filled violet #6161ff background, white text in Poppins 16px weight 500, 160px border-radius (full pill), 13px vertical / 24px horizontal padding, optional inline icon.

### Outlined Pill Button
**Role:** Secondary action, paired with the primary, such as "Cancel"

Transparent background, 1px #535768 border, 160px border-radius, 13px vertical / 20px horizontal padding, Ink text.

### Text Link Button
**Role:** Tertiary action in navigation and inline text

No background or border, Slate (#535768) text weight 500, sometimes with a dropdown chevron. 8–10px horizontal padding for navigation items.

### Pastel Card
**Role:** Icon-and-text tile for dashboard summaries and grouped content

Soft-tinted background (one of the accent palette: Mint, Sky, Apricot, Lavender, Periwinkle, Aqua), 24px border-radius, 24px internal padding, small monochrome icon, Poppins 16px weight 500 label.

### Board Card
**Role:** Elevated white surface for the pipeline board, charts and record panels

White #ffffff surface, Mist (#d0d4e4) 1px border, 16–24px radius, soft shadow rgba(205,208,223,0.4) 0 2px 48px. On the pipeline it holds deal cards with colored status pills and contact avatars.

### Brand Panel
**Role:** Violet surface that frames a key area, used sparingly

Violet #6161ff background with a white card on top at 24px radius, giving strong contrast against the white canvas.

### Status Pill
**Role:** Inline badge for a deal's stage or a contact's status in tables, cards and timelines

Small pill (6px radius), tinted background matching the status color, Poppins 12–13px weight 500 label, 2px vertical / 8px horizontal padding.

### Avatar Stack
**Role:** Shows the contacts linked to a deal or organization

Circular avatars (full radius), 24–32px diameter, white 2px border separating overlapping members, slight negative margin between them.

### Navigation Bar
**Role:** Top-level navigation between Dashboard, Organizations, Contacts, Deals and Pipeline

White #ffffff background, sticky top, 8px vertical / 16px horizontal padding for navigation items, the Accountable logo on the left and the main action on the right. The logo mark uses the prism gradient.

## Do's and Don'ts

### Do
- Use 160px border-radius for all buttons. The pill shape defines Accountable's friendly tone
- Reserve #6161ff for primary actions and brand panels; let it carry the most important decision on every screen
- Apply pastel accent backgrounds (Mint, Sky, Apricot, Lavender) to cards, not to buttons or text
- Set large display figures at 48–64px Poppins weight 300 with negative letter-spacing (-0.04em to -0.02em)
- Use 24px radius for cards and 6px for badges and inputs, and keep these two tiers consistent
- Keep the prism gradient for the logo mark, brand dividers and loading states only

### Don't
- Don't use square or 4px-radius buttons
- Don't apply pastel accent colors to body text, borders or icons. They are surface treatments only
- Don't set type below weight 400 for body or below 500 for interface labels. Weight 300 is for large display figures only
- Don't use pure #000000 for large text blocks. #333333 is warmer and is the system's true black
- Don't put more than 3–4 pastel colors in adjacent cards. Pick a 2–3 color accent set per area
- Don't use heavy drop shadows on cards. The system uses one soft 48px-blur lavender-tinted shadow at 40% opacity
- Don't introduce new action colors. #6161ff is the one action color; the saturated alternatives are for charts and status, not buttons

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#f5f6f8` | Page background, the soft gray floor that everything sits on |
| 1 | Card | `#ffffff` | Standard card and component surface, the main elevated plane |
| 2 | Brand Panel | `#6161ff` | Violet surface that gives strong contrast to a key area |
| 3 | Tinted Accent | `#bcfe90` | Pastel surface for summary cards and category tiles |

## Elevation

- **Card / Board Card:** `rgba(205, 208, 223, 0.4) 0px 2px 48px 0px`
- **Elevated Card (hover, dragged pipeline card):** `rgba(0, 0, 0, 0.15) 0px 5px 45px 0px`
- **Dialogs and menus:** `rgba(0, 0, 0, 0.15) 0px 4px 40px 0px`

## Imagery

Accountable's visuals are its own data: tables, charts, pipeline cards, status pills and avatars. There is no photography, illustration or stock imagery. The only decorative visual is the prism gradient in the logo mark.

## Layout

Content is centered at a max-width of about 1200px; the pipeline board may use the full width. A single sticky white navigation bar sits at the top, with the logo on the left, the section links in the middle and the main action on the right. Soft gray (#f5f6f8) canvas separates white cards, and vertical rhythm is generous.

## Quick Color Reference

- Primary text: #333333
- Secondary text: #535768
- Page background: #f5f6f8
- Card surface: #ffffff
- Card border: #d0d4e4
- Brand accent and primary action: #6161ff

## Example Component Prompts

1. **Primary Action Button**: #6161ff background, #ffffff text, 160px radius, 13px / 24px padding, Poppins 16px weight 500.

2. **Pastel Card**: Background #abf0ff (or one of the accent palette: #bcfe90, #ff8940, #eddff7, #93beff, #d1faff). 24px border-radius. 24px internal padding. Small monochrome icon top-left, Poppins 16px weight 500 label below in #333333.

3. **Deal Card on the pipeline**: White #ffffff surface, 1px #d0d4e4 border, 24px border-radius, soft shadow rgba(205,208,223,0.4) 0 2px 48px. Shows the deal name, organization, value, a status pill (6px radius, tinted background such as #bcfe90) and the contact's avatar.

4. **Status Pill**: 6px radius, tinted background, Poppins 12px weight 500 label in #333333, 2px / 8px padding.

## Gradient System

Gradients have two roles, both used sparingly: (1) **Brand prism**, a conic gradient cycling violet → teal → green → yellow → pink → violet, used only for the logo mark, brand dividers and loading states, never as a surface fill. (2) **Accent gradients**, short 2-stop linear gradients (pink → orange, cyan → violet) for an occasional highlight such as a headline figure. Gradients are never applied to body text or button backgrounds.

## Component Visual Language

The system is **flat with a soft shadow**: components are mostly flat, with surfaces told apart by pastel tints rather than borders or heavy elevation. The single soft lavender-tinted shadow (rgba(205,208,223,0.4) 0 2px 48px) lifts cards just enough to read as elevated. Buttons are filled and rely on the pill radius for personality. Generous internal padding (24px in cards, 13–16px in buttons) keeps it feeling like a spacious workshop rather than a cramped spreadsheet.

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-violet: #6161ff;
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
  --color-apricot: #ff8940;
  --gradient-apricot: linear-gradient(90deg, rgb(254, 129, 228), rgb(254, 129, 228) 31%, rgb(253, 169, 0) 88%);
  --color-lavender: #eddff7;
  --color-periwinkle: #e7ecff;
  --color-cornflower: #93beff;
  --color-aqua: #d1faff;
  --color-cotton-candy: #e98dfe;
  --color-ultra-violet: #9450fd;
  --color-electric-cyan: #3ac9ff;
  --color-forest: #2a5c4e;
  --color-peony: #fcd0f8;
  --color-periwinkle-wash: #dbdbff;
  --color-prism: #8181ff;
  --gradient-prism: conic-gradient(from 270deg, rgb(129, 129, 255) 15%, rgb(51, 219, 219) 40%, rgb(51, 213, 142) 55%, rgb(255, 214, 51) 65%, rgb(252, 82, 125) 85%, rgb(129, 129, 255) 100%);

  /* Typography — Font Families */
  --font-poppins: 'Poppins', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 12px;
  --leading-caption: 1.45;
  --tracking-caption: -0.12px;
  --text-body-sm: 14px;
  --leading-body-sm: 1.5;
  --text-body: 16px;
  --leading-body: 1.5;
  --tracking-body: -0.16px;
  --text-subheading: 20px;
  --leading-subheading: 1.4;
  --tracking-subheading: -0.22px;
  --text-heading-sm: 24px;
  --leading-heading-sm: 1.3;
  --tracking-heading-sm: -0.36px;
  --text-heading: 36px;
  --leading-heading: 1.2;
  --tracking-heading: -0.54px;
  --text-heading-lg: 48px;
  --leading-heading-lg: 1.15;
  --tracking-heading-lg: -0.96px;
  --text-display: 64px;
  --leading-display: 1.15;
  --tracking-display: -2.56px;

  /* Typography — Weights */
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* Spacing */
  --spacing-unit: 8px;
  --spacing-8: 8px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;

  /* Layout */
  --page-max-width: 1200px;
  --section-gap: 64px;
  --card-padding: 24px;
  --element-gap: 8px;

  /* Border Radius */
  --radius-md: 6px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-3xl: 24px;
  --radius-3xl-2: 40px;
  --radius-full: 100px;
  --radius-full-2: 160px;

  /* Named Radii */
  --radius-nav: 6px;
  --radius-cards: 24px;
  --radius-badges: 6px;
  --radius-images: 12px;
  --radius-inputs: 6px;
  --radius-buttons: 160px;

  /* Shadows */
  --shadow-xl: rgba(205, 208, 223, 0.4) 0px 2px 48px 0px;
  --shadow-xl-2: rgba(0, 0, 0, 0.15) 0px 5px 45px 0px;
  --shadow-xl-3: rgba(0, 0, 0, 0.15) 0px 4px 40px 0px;
  --shadow-xl-4: rgba(0, 0, 0, 0.4) 0px 5px 55px 0px;
  --shadow-subtle: rgb(0, 0, 0) 0px -2px 0px 0px inset;

  /* Surfaces */
  --surface-canvas: #f5f6f8;
  --surface-card: #ffffff;
  --surface-brand-panel: #6161ff;
  --surface-tinted-accent: #bcfe90;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-violet: #6161ff;
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
  --color-apricot: #ff8940;
  --color-lavender: #eddff7;
  --color-periwinkle: #e7ecff;
  --color-cornflower: #93beff;
  --color-aqua: #d1faff;
  --color-cotton-candy: #e98dfe;
  --color-ultra-violet: #9450fd;
  --color-electric-cyan: #3ac9ff;
  --color-forest: #2a5c4e;
  --color-peony: #fcd0f8;
  --color-periwinkle-wash: #dbdbff;
  --color-prism: #8181ff;

  /* Typography */
  --font-poppins: 'Poppins', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 12px;
  --leading-caption: 1.45;
  --tracking-caption: -0.12px;
  --text-body-sm: 14px;
  --leading-body-sm: 1.5;
  --text-body: 16px;
  --leading-body: 1.5;
  --tracking-body: -0.16px;
  --text-subheading: 20px;
  --leading-subheading: 1.4;
  --tracking-subheading: -0.22px;
  --text-heading-sm: 24px;
  --leading-heading-sm: 1.3;
  --tracking-heading-sm: -0.36px;
  --text-heading: 36px;
  --leading-heading: 1.2;
  --tracking-heading: -0.54px;
  --text-heading-lg: 48px;
  --leading-heading-lg: 1.15;
  --tracking-heading-lg: -0.96px;
  --text-display: 64px;
  --leading-display: 1.15;
  --tracking-display: -2.56px;

  /* Spacing */
  --spacing-8: 8px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;

  /* Border Radius */
  --radius-md: 6px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-3xl: 24px;
  --radius-3xl-2: 40px;
  --radius-full: 100px;
  --radius-full-2: 160px;

  /* Shadows */
  --shadow-xl: rgba(205, 208, 223, 0.4) 0px 2px 48px 0px;
  --shadow-xl-2: rgba(0, 0, 0, 0.15) 0px 5px 45px 0px;
  --shadow-xl-3: rgba(0, 0, 0, 0.15) 0px 4px 40px 0px;
  --shadow-xl-4: rgba(0, 0, 0, 0.4) 0px 5px 55px 0px;
  --shadow-subtle: rgb(0, 0, 0) 0px -2px 0px 0px inset;
}
```
