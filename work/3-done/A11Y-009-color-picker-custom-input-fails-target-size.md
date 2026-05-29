---
id: A11Y-009
type: a11y
status: resolved
created: 2026-05-29
resolved: 2026-05-29
---

# A11Y-009: color picker custom input fails target size

## Problem

`src/components/ColorPicker.tsx:73-81` renders the "Custom" color input as
`<input type="color" className="w-7 h-[22px] ..." />` — 28×22 CSS pixels. The
22px height is below the WCAG 2.5.8 minimum of 24×24.

## Outcome

The `<input type="color">` control has an interactive hit area of at least 24×24
CSS pixels, including any padding, without changing the popover's overall layout
or appearance significantly.

## Why it matters

WCAG 2.5.8 Target Size (Minimum) (Level AA, WCAG 2.2). On a PWA used on touch
devices a 22px-tall control is hard to hit reliably.

## Discovery notes

The input is wrapped in a `<label>` whose row also includes the text "Custom" —
increasing the row height affects the popover. Native `<input type="color">`
swatches are visually small on most browsers but the hit area can be enlarged by
container padding without bloating the picker.

## Recommendation

Increase the input height (and width if needed) to at least 24×24, e.g.
`h-6 w-7` or `h-6 w-8`, and verify the popover layout. Alternatively, wrap the
input in a clickable container ≥24×24 and forward click to the input.

## Related work

- A11Y-002 (color picker small trigger fails target size)
- A11Y-008 (quadrant header add-item button fails target size)

## Working

- Bumped the `<input type="color">` from `h-[22px]` to `h-6` (24px) in
  `ColorPicker.tsx`. The popover's "Custom" row grows by 2px, well within the
  existing 10px row padding, so no other layout changes are needed.
