---
trigger: always_on
---

design-system.md — Route
Design system rules for the agent.
Read before writing any UI code, component, or style.

---

## Source of Truth

All design tokens live in `tokens/theme.css`.
All base element styles live in `tokens/style.css`.
Import both files once at the root layout in this order:

```
import '../tokens/theme.css'
import '../tokens/style.css'
```

Never import them per component. Never duplicate token values.

---

## The Non-Negotiable Rule

**Never hardcode any colour, font size, font weight, spacing, radius, shadow, or transition value anywhere in the codebase.**

Every value must reference a CSS variable defined in `tokens/theme.css`.

Wrong:
```css
background-color: #1a56db;
padding: 16px;
border-radius: 12px;
```

Right:
```css
background-color: var(--color-primary);
padding: var(--spacing-4);
border-radius: var(--shape-corner-medium);
```

---

## Design System Foundation

Route follows **Material Design 3 (M3)** principles.
Source colour: Deep Near-Black.
Font: Nunito — soft, rounded, approachable, calm.
Light mode is the default. Dark mode is user-controlled.

---

## Colour Rules

**How to choose the right colour variable:**

| Situation | Variable to use |
|---|---|
| Primary CTA button background | `--color-primary` |
| Text on a primary CTA button | `--color-on-primary` |
| Tonal/filled button background | `--color-primary-container` |
| Text on a tonal button | `--color-on-primary-container` |
| Main page background | `--color-background` |
| Primary body text | `--color-on-background` |
| Card or sheet background | `--color-surface` or `--color-surface-container` |
| Secondary text, captions | `--color-on-surface-variant` |
| Input borders | `--color-outline` |
| Dividers, subtle borders | `--color-outline-variant` |
| Error state, dangerous vehicle | `--color-error` |
| Text on error background | `--color-on-error` |
| Safe vehicle indicator | `--color-safe` |
| Mild vehicle indicator | `--color-mild` |
| Concern vehicle indicator | `--color-concern` |
| Dangerous vehicle indicator | `--color-error` |
| Modal overlay background | `--color-scrim` |

**Surface container depth — use for layering:**
- `--color-surface-container-lowest` — bottom layer, page background
- `--color-surface-container-low` — input backgrounds
- `--color-surface-container` — default card background
- `--color-surface-container-high` — elevated cards
- `--color-surface-container-highest` — modals, bottom sheets

**Safety indicator colours are for safety status only.**
Never reuse `--color-safe`, `--color-mild`, or `--color-concern` for anything other than vehicle safety status circles and badges.

---

## Typography Rules

**How to choose the right typography variable:**

| Element | Variables to use |
|---|---|
| Large hero text, app name | `display-large` or `display-medium` |
| Screen title | `headline-large` or `headline-medium` |
| Section header | `headline-small` or `title-large` |
| Card title | `title-medium` |
| Body text, descriptions | `body-large` or `body-medium` |
| Secondary info, timestamps | `body-small` |
| Button labels | `label-large` |
| Chips, tags, nav labels | `label-medium` |
| Fine print, legal text | `label-small` |

**Apply typography like this:**
```css
.card-title {
  font-family:    var(--typography-title-medium-font-family);
  font-size:      var(--typography-title-medium-font-size);
  font-weight:    var(--typography-title-medium-font-weight);
  line-height:    var(--typography-title-medium-line-height);
  letter-spacing: var(--typography-title-medium-letter-spacing);
}
```

Always apply all five properties together — never just font-size alone.

**Minimum font size is 14px (`--typography-body-medium-font-size`) at default scale.**
Never go below this anywhere in the app.

**Font size scaling (`data-font-size` attribute) is already handled in `theme.css`.**
Do not write any additional scaling logic. It works automatically.

---

## Spacing Rules

All padding, margin, and gap values use spacing variables.
The base unit is 4px. Every spacing value is a multiple of 4.

```css
/* Correct */
padding: var(--spacing-4);          /* 16px */
gap: var(--spacing-2);              /* 8px */
margin-bottom: var(--spacing-6);    /* 24px */

/* Wrong */
padding: 16px;
gap: 8px;
```

Page content uses `--spacing-page-margin` (20px) as the horizontal gutter.
Maximum content width is `--spacing-page-max-width` (390px).

---

## Shape Rules

Use radius variables for all `border-radius` values:

| Use case | Variable |
|---|---|
| Small chips, tight elements | `--shape-corner-extra-small` (4px) |
| Inputs, small cards | `--shape-corner-small` (8px) |
| Standard cards | `--shape-corner-medium` (12px) |
| Large cards, prominent elements | `--shape-corner-large` (16px) |
| Bottom sheets, modals | `--shape-corner-extra-large` (28px) |
| Pills, badges, tags, FABs | `--shape-corner-full` (9999px) |

---

## Elevation Rules

Use elevation variables for all `box-shadow` values:

| Use case | Variable |
|---|---|
| Flat, no shadow | `--elevation-0` |
| Cards at rest | `--elevation-1` |
| Cards on hover or pressed | `--elevation-2` |
| Bottom sheets, dropdowns | `--elevation-3` |
| Modals, dialogs | `--elevation-4` |

---

## Dark Mode Rules

Dark mode is applied by setting `data-theme="dark"` on the `<html>` element.
The user controls this in app settings. It is stored in their Convex profile.

Read the current theme preference from Convex on app load.
Apply it to `<html>` before the first render to avoid flash of wrong theme.

```javascript
// In root layout on mount
document.documentElement.setAttribute('data-theme', userThemePreference)
```

Never use `prefers-color-scheme` media query as the sole dark mode trigger.
The user's explicit setting always takes priority over OS preference.

---

## Font Size Scaling Rules

Font size scaling is applied by setting `data-font-size` on the `<html>` element.
Options: `default`, `large`, `extra-large`.
Stored in Convex user profile. Applied on app load.

```javascript
document.documentElement.setAttribute('data-font-size', userFontSizePreference)
```

The scaling is already defined in `tokens/theme.css`.
Do not write any additional font scaling logic anywhere else.

---

## Motion Rules

Use motion variables for all transitions:

```css
transition: background-color var(--motion-duration-short) var(--motion-easing-standard);
```

All animations must be wrapped in `@media (prefers-reduced-motion: no-preference)`.
The global reduced motion reset is already applied in `tokens/style.css`.

---

## What the Agent Must Never Do

- Never hardcode any colour, font, spacing, radius, shadow, or transition value
- Never use Tailwind, inline styles, or CSS-in-JS
- Never define new colour values outside of `tokens/theme.css`
- Never use `--color-safe`, `--color-mild`, or `--color-concern` for non-safety UI
- Never remove focus indicators or override `:focus-visible` to `outline: none`
- Never set font size below `--typography-body-medium-font-size` (14px)
- Never write custom dark mode logic — use `[data-theme="dark"]` from `theme.css`
- Never write custom font scaling logic — use `[data-font-size]` from `theme.css`
- Never import `theme.css` or `style.css` more than once