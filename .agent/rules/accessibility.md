---
trigger: always_on
---

accessibility.md — Route
Accessibility rules for this project.
Route serves commuters in a hurry, older citizens, and non-technical contacts.
These rules are non-negotiable. Accessibility is a safety requirement for this product.

---

## Touch Targets

- Every interactive element (buttons, links, dropdowns, icons) must have a minimum touch target of 44x44px.
- This applies even if the visible element is smaller — use padding to extend the touch area.
- Never place two interactive elements closer than 8px apart.
- The YES and NO safety check response buttons must be especially large — minimum 64px height. A contact may be panicked when tapping these.

---

## Colour and Contrast

- Never use colour alone to communicate meaning. Every colour-coded element (safety indicators, status badges) must also have a text label.
- The red / yellow safety indicator circles must always have "Dangerous" or "Mild" text beneath them.
- Minimum contrast ratios following WCAG 2.1 AA:
  - Normal text (below 18px): 4.5:1 contrast ratio minimum
  - Large text (18px and above): 3:1 contrast ratio minimum
  - Interactive elements and focus indicators: 3:1 minimum
- Never use colour combinations that fail for common colour blindness types (red-green, blue-yellow).
- Test all colour combinations from `rules/design-system.css` against these ratios before marking any screen done.

---

## Typography and Readability

- Font size scaling (default / large / extra-large) must be applied consistently across the entire app — no screen is exempt.
- Minimum body text size is 14px at default scale. Never go below this.
- Line height for body text must be at least 1.5× the font size.
- Never use font weight below 400 for any body or label text.
- Never use all-caps text for anything longer than 3 words.
- Letter spacing on all-caps labels must be at least 0.05em for readability.

---

## Focus and Keyboard Navigation

- All interactive elements must have a visible focus indicator.
- Focus indicator must meet 3:1 contrast ratio against adjacent colours.
- Never remove the default focus outline without replacing it with a visible custom one.
- Tab order must follow the logical reading order of the screen.

---

## Screen Reader Support

- Every image, icon, and non-text element must have a descriptive `alt` attribute or `aria-label`.
- Decorative icons (purely visual) must have `aria-hidden="true"`.
- Every form input must have an associated `<label>` element — never use placeholder text as the only label.
- Use semantic HTML: `<button>` for actions, `<a>` for navigation, `<input>` for form fields. Never use `<div>` as a button.
- Dynamic content updates (feed updates, notification alerts, status changes) must use `aria-live` regions so screen readers announce them.
- The safety check YES/NO response page must be fully operable by screen reader — a contact may have visual impairment.

---

## Motion and Animation

- Any animation or transition must respect `prefers-reduced-motion`.
- Wrap all animations in:
  ```css
  @media (prefers-reduced-motion: no-preference) {
    /* animation here */
  }
  ```
- Never use flashing or strobing effects.
- Loading animations must be subtle — a spinner or progress indicator only. No full-screen motion.

---

## Forms and Inputs

- Every dropdown, input, and selector must have a visible label above it — not just a placeholder.
- Error messages must be specific and placed directly below the field they refer to.
- Success and error states must use both colour AND an icon or text — never colour alone.
- Required fields must be indicated clearly — not just with an asterisk that has no explanation.
- The plate confirmation step (YES / NO after OCR) must be operable without a camera — manual input must always be reachable.

---

## Contact Activation Page

- This page is used by non-technical people who may be elderly or unfamiliar with PWAs.
- Instructions must use plain language — no technical terms.
- The home screen add instructions for iOS must use actual screenshots or clear animated visuals.
- Every step must be numbered and shown one at a time — not a wall of text.
- The "Enable notifications" button must not appear until the home screen step is confirmed — never show a confusing double-permission flow.
- Text on this page must be at least 16px. Prefer 18px for instruction text.

---

## Older Citizen Considerations

- The font size setting (default / large / extra-large) exists specifically for older users. It must actually work across every screen.
- Extra-large mode increases all text, all touch targets scale accordingly — never clip or overflow at extra-large size.
- The home screen feed cards must remain readable and fully functional at extra-large font size.
- Never hide critical information behind a small icon with no label — always pair icons with text labels in navigation and key actions.

---

## What the Agent Must Never Do

- Never remove focus indicators
- Never use colour as the only differentiator between states
- Never use `<div>` or `<span>` as interactive elements
- Never set font size below 14px anywhere in the app
- Never place touch targets smaller than 44x44px
- Never add animations without a `prefers-reduced-motion` fallback
- Never leave form inputs without visible labels
- Never make the contact activation page technically demanding