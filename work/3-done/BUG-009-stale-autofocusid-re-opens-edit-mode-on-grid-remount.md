---
id: BUG-009
type: bug
status: resolved
created: 2026-06-11
---

# BUG-009: stale autoFocusId re-opens edit mode on grid remount

## Problem

`src/components/QuadrantCanvas.tsx` line 36 holds `autoFocusId` state that
`handleAddItem` (lines 77-85) sets to a newly created item's id and never
clears. `src/components/Card.tsx` line 59 reads `autoFocus` only as the initial
value of `editing` (`useState(autoFocus)`), so the stale id is dormant until a
Card remounts. `QuadrantCanvas` line 162 swaps the entire grid component between
`MobileQuadrantGrid` and `QuadrantGrid` when `useIsMobile()` (768px matchMedia,
`src/hooks/useIsMobile.ts`) flips — remounting every Card — at which point the
card whose id equals the stale `autoFocusId` re-enters edit mode with its text
selected (`Card.tsx` lines 84-91 run `focus()` + `select()`).

## Outcome

After a user adds an item and commits its text, a later remount of the grid
within the same framework (e.g. resizing the window across the 768px breakpoint,
rotating a device, or zooming) renders every card in display mode — no card
re-enters edit mode or selects its text. The add flow is unchanged: a newly
added item still mounts in edit mode with its text selected.

## Why it matters

A card unexpectedly popping into edit mode with all its text selected long after
the user finished editing is disorienting, and because the textarea mounts with
`select()`, a single accidental keypress silently overwrites the item's current
text — low severity but a real data-loss path.

## Discovery notes

Repro: at desktop width, add an item to a quadrant, type text, click away to
commit, then resize the window below 768px (or rotate a tablet) — the item
re-enters edit mode with its text selected. Switching frameworks is NOT
affected: `App.tsx` line 162 keys `ErrorBoundary` by `activeFramework.id`, which
remounts `QuadrantCanvas` and resets the state, so the bug is confined to grid
remounts within one framework. Prop plumbing: `QuadrantGrid.tsx` line 149 and
`MobileQuadrantGrid.tsx` line 126 pass `autoFocus={autoFocusId === item.id}`.

## Recommendation

Clear `autoFocusId` once consumed, preserving one-shot semantics — e.g. a
callback from Card when it has consumed the auto-focus (an `onAutoFocusConsumed`
prop), or clear it on the next commit/blur. Start inquiry in
`QuadrantCanvas.tsx` (`autoFocusId` line 36, `handleAddItem` line 77) and
`Card.tsx` (line 59 `useState(autoFocus)`, lines 84-91). Tests live in
`src/__tests__/QuadrantCanvas.test.tsx` and `src/__tests__/Card.test.tsx`.

## Related work

- BUG-004 (work/1-inbox, open) touches the same add/edit surface in
  `Card.tsx`/`QuadrantCanvas.tsx` via the Escape path — a distinct defect, but a
  fixer should be aware of both.
- Commit c7bffeb — wired MobileQuadrantGrid for small screens (introduced the
  remount trigger).
- Commit 7981145 — Card Escape cancel fix.
- Commit c728f9e [A11Y-010] — most recent `Card.tsx` change.

## Working

- Judgment call: instead of plumbing an `onAutoFocusConsumed` prop through both
  grid components into Card, the id is consumed in QuadrantCanvas's existing
  terminal handlers — `handleEditItem` and `handleDeleteItem` — via a
  `consumeAutoFocus(itemId)` helper. Every fresh placeholder add ends in exactly
  one of those (commitEdit either fires onChange with new text or onDelete for
  empty/placeholder; Escape now deletes per BUG-004), so one-shot semantics hold
  with zero new props.
- Add flow unchanged: new items still mount in edit mode with text selected.
- Test: QuadrantCanvas integration — add, commit text, flip the mocked
  useIsMobile and re-render (grid swap remounts all Cards), assert no textarea
  reappears. Failed before the fix.
