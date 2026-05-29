---
id: A11Y-010
type: a11y
status: open
created: 2026-05-29
---

# A11Y-010: keyboard-reposition items within quadrant

## Problem

Items in a quadrant (`src/components/Card.tsx`,
`src/components/QuadrantCanvas.tsx`, `src/hooks/useDragAndDrop.ts`) can only be
positioned within a quadrant by pointer drag — the `onDragStart` flow writes
`x`/`y` percentages from pointer coordinates and the keyboard "Press M" shortcut
on `Card.tsx:185-196` only moves an item to a different quadrant (target index),
not to a different x/y location inside the current quadrant.

## Outcome

A keyboard user can change an item's x/y location within its quadrant using the
keyboard alone, and the change persists and is announced via the existing
aria-live region in `QuadrantCanvas`.

## Why it matters

WCAG 2.1.1 Keyboard (Level A) requires all functionality be available via
keyboard. WCAG 2.5.7 Dragging Movements (Level AA, WCAG 2.2) further requires a
single-pointer alternative to dragging. As written, keyboard-only and
motor-impaired users cannot complete a primary affordance of the app
(placing/repositioning items on the 2-D canvas).

## Discovery notes

`Card.tsx` already has a `handleDisplayKeyDown` handler for Enter/Space/M; an
item position handler could be added there. `moveItem` in `src/logic/items.ts`
accepts `x`/`y` and is the seam to use. Announcements use `announce(...)` in
`QuadrantCanvas.tsx` and could reuse that pattern.

## Recommendation

Extend the keyboard model on the focused card: ArrowLeft/Right/Up/Down move the
item by a small percentage step (e.g. 5%), Shift+Arrow by a larger step; clamp
to 0-95 within the canvas. Reuse `moveItem(fw, idx, idx, itemId, x, y)` and the
existing `announce(...)` live region. Update the `aria-keyshortcuts` attribute
on the card to advertise the new arrows and update the `aria-label`
instructional text.
