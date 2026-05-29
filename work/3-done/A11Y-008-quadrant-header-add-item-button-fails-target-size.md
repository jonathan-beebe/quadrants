---
id: A11Y-008
type: a11y
status: resolved
created: 2026-05-29
resolved: 2026-05-29
---

# A11Y-008: quadrant header add-item button fails target size

## Problem

`src/components/QuadrantGrid.tsx:115-121` renders the "Add item to <label>"
button with `p-[3px]` padding around a `<PlusIcon size={14} />`, producing a
target area of roughly 20×20 CSS pixels — below the WCAG 2.5.8 minimum of 24×24.

## Outcome

The Add Item button in each quadrant header presents an interactive hit area of
at least 24×24 CSS pixels without disturbing the visual density of the quadrant
header.

## Why it matters

WCAG 2.5.8 Target Size (Minimum) (Level AA, WCAG 2.2). The app is a PWA used on
touch devices where small targets are unreliable for users with motor
impairment.

## Discovery notes

There is no equivalent "Add item" target nearby on desktop; on mobile
(`MobileQuadrantGrid.tsx`) a separate larger button is used, so this issue is
desktop-specific.

## Recommendation

Increase the clickable area to ≥24×24 by raising padding (e.g. `p-1.5`) or by
adding an invisible expansion via a pseudo-element so the icon stays at size 14.
Confirm focus ring still aligns and the layout in the quadrant header is
unchanged.

## Working

- Swapped `p-[3px]` for `w-6 h-6 grid place-items-center` on the quadrant-header
  Add Item button in `QuadrantGrid.tsx`, mirroring the pattern adopted in
  A11Y-003. The 14px PlusIcon is centered in a guaranteed 24x24 hit area; the
  visible icon and hover/focus treatment are unchanged.
