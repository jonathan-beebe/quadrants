---
id: A11Y-001
type: a11y
status: resolved
created: 2026-05-29
resolved: 2026-05-29
---

# A11Y-001: mobile quadrant section nested interactive descendants

## Problem

In `src/components/MobileQuadrantGrid.tsx:80-131`, each `<section>` is rendered
with `role="button"` and `tabIndex=0` while `!isZoomed`, but the section also
contains focusable `<Card>` buttons (which render as `<button>` with
aria-labels, plus their own delete button and move menu). In zoomed mode the
focused section drops the button role but non-focused sections still render
their `<Card>` buttons in the tab order even though `pointer-events: none`
blocks pointer interaction.

## Outcome

In overview state, tabbing reaches each quadrant once and Enter/Space zooms it;
no Card or inner button receives focus. In zoomed state, only the focused
quadrant's Cards, color picker, "Add", and "Done" controls are reachable by tab.

## Why it matters

WCAG 4.1.2 Name, Role, Value (Level A) — ARIA forbids interactive descendants
inside `role="button"`; screen readers will announce conflicting roles and
keyboard users get unpredictable tab stops. Combined with the cards' own focus
behavior this breaks the operability of the mobile view for AT users.

## Discovery notes

The Cards' tabbability comes from their `<button>` element in `Card.tsx`.
`pointer-events: none` does not remove an element from the tab order. The
`inert` attribute (already used in `App.tsx` for the sidebar when a conflict
dialog is open) is the natural primitive here.

## Recommendation

Use `inert` on non-active quadrant subtrees: in overview state, apply `inert` to
each section's canvas div so the section itself is the only focus stop; in
zoomed state, apply `inert` to all non-focused sections. Drop `role="button"`
from the section in favor of an explicit `<button>` element layered over the
canvas, or keep `role="button"` only when the inner subtree is fully inert.

## Working

- Applied `inert={!isFocused ? true : undefined}` to the canvas `<div>` in
  `MobileQuadrantGrid.tsx`. In overview, every quadrant canvas is inert (the
  section itself remains the focus stop); when zoomed, only the focused
  quadrant's canvas drops `inert`, while non-focused sections were already
  non-focusable (no `tabIndex`/`role`) and their canvases stay inert. Kept the
  section's `role="button"` since its inner subtree is now fully inert.
- Added two regression tests in `MobileQuadrantGrid.test.tsx` asserting cards
  have an `[inert]` ancestor in overview and lose it when their quadrant is
  zoomed.
