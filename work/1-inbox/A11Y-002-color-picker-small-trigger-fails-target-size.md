---
id: A11Y-002
type: a11y
status: open
created: 2026-05-29
---

# A11Y-002: color picker small trigger fails target size

## Problem

`src/components/ColorPicker.tsx:35-49` renders the trigger button as
`w-[14px] h-[14px]` when `size="sm"`. This size is used in the desktop
`QuadrantGrid` header next to each quadrant label
(`src/components/QuadrantGrid.tsx` invokes `<ColorPicker ... size="sm" />`).
14x14 CSS pixels is well below the WCAG 2.5.8 minimum of 24x24 with no
equivalent target available nearby.

## Outcome

The color picker trigger used on the desktop quadrant header presents an
interactive hit area of at least 24x24 CSS pixels (including any transparent
padding), without enlarging the visible swatch beyond its current 14x14 design.

## Why it matters

WCAG 2.5.8 Target Size (Minimum) (Level AA, WCAG 2.2). Users with low motor
control, tremor, or touch interaction (the app is a PWA) cannot reliably
activate a 14px target.

## Discovery notes

The 14px size is the visual color swatch; the hit area can be expanded by
wrapping the visible swatch in a larger transparent button or using `::before`
to expand the target area without changing layout.

## Recommendation

Keep the 14x14 visible swatch but expand the clickable button to >=24x24 by
adding padding (or an absolutely positioned pseudo-element). Verify focus ring
still aligns to the visible swatch.
