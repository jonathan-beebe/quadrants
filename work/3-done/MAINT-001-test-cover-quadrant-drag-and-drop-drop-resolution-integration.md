---
id: MAINT-001
type: maintenance
status: resolved
created: 2026-05-29
resolved: 2026-05-29
---

# MAINT-001: test: cover quadrant drag-and-drop drop-resolution integration

## Problem

The drag-and-drop drop-resolution path that moves an item between quadrants is
covered only at two ends: the pure helpers and the hook in isolation in
src/**tests**/hooks/useDragAndDrop.test.ts (pageToQuadrantPercent,
getQuadrantAtPoint, and the useDragAndDrop hook with `quadrantRefs.current`
populated with `null`s), and the visual ghost positioning in
src/**tests**/Card.test.tsx (GhostCard rendering). The wiring between
useDragAndDrop and the framework — handleDrop in
src/components/QuadrantCanvas.tsx:60-65 calling moveItem with the resolved
(sourceIdx, targetIdx, itemId, x, y) — is never exercised through the rendered
component. The hook tests in useDragAndDrop.test.ts:228-249 explicitly note that
pointerup in jsdom yields clientX/clientY of 0, so they only assert "onDrop was
not called" rather than verifying the cross-quadrant drop result; the test at
lines 180-203 likewise documents that "drag.x/y become 0" and only asserts the
handler ran without error. No test verifies that a pointerup inside a target
quadrant's bounding rect produces a moveItem call with the right sourceIdx,
targetIdx, and clamped percent coordinates.

## Outcome

Running the test suite exercises the drag-and-drop drop resolution end-to-end on
the rendered QuadrantCanvas surface: starting a drag on an item in one quadrant
and releasing the pointer over a different quadrant results in the framework
being updated such that the item is removed from its source quadrant, appears in
the target quadrant, and has x/y coordinates within the clamped 2-85 range. A
release outside all quadrant bounding rects leaves the framework unchanged. A
release within the source quadrant's own rect produces a reposition (same
quadrant, updated x/y) rather than a no-op or a cross-quadrant move. Each test
fails if the pointer-coordinate plumbing, the quadrant hit-testing, or the
moveItem wiring regresses.

## Why it matters

Drag-and-drop is the primary input method for repositioning items on the canvas
and one of the highest-frequency interactions in the app. The current suite
would not catch regressions in: (1) the clientX/clientY vs pageX/pageY
coordinate system (the inline comment at useDragAndDrop.ts:29 and the
"coordinate system consistency" describe block at useDragAndDrop.test.ts:116
both flag this as a known historical hazard), (2) the canvas-rect vs
quadrant-rect distinction surfaced in getQuadrantAtPoint, (3) the (clientX -
grabX, clientY - grabY) offset applied before pageToQuadrantPercent at
useDragAndDrop.ts:78, or (4) the moveItem call shape in handleDrop. Each of
these has a plausible regression mode — wrong axis, off-by-one quadrant index,
ungrabbed offset, swapped source/target — that would ship without any test
failure. Integration coverage on this surface is the cheapest hedge against
silent data-position regressions in the canvas's hot path.

## Discovery notes

- The existing src/**tests**/QuadrantCanvas.test.tsx is the natural home for
  these tests; it already constructs a framework with an item in quadrant 0 ("Do
  First" with item "Task A") and renders the full QuadrantCanvas with vi.fn()
  for onUpdate, which is the observable assertion surface (moveItem's output
  flows through onUpdate at QuadrantCanvas.tsx:55).
- jsdom does not implement layout, so element.getBoundingClientRect() returns
  zeros for every quadrant by default; the test that asserts the drop-resolution
  path needs to stub getBoundingClientRect on the four quadrant refs and four
  canvas refs to non-zero rects before dispatching pointerup. A small helper
  that mirrors the makeMockEl approach already used at
  useDragAndDrop.test.ts:49-60 — applied via vi.spyOn or by overriding the
  prototype for the rendered quadrant/canvas elements after render — keeps the
  setup readable.
- PointerEvent in jsdom accepts clientX/clientY in its init dict
  (useDragAndDrop.test.ts:197 shows the pattern), but the values do not survive
  on the dispatched event in older jsdom versions; the test may need to
  construct the event with `new MouseEvent('pointermove', { clientX, clientY })`
  cast to PointerEvent, or set the coordinates on the event object after
  construction. The existing hook test sidesteps this — these new tests cannot.
- Three flows worth covering: (a) drop in a different quadrant (the primary
  cross-quadrant move), (b) drop within the same quadrant (reposition, no
  source/target swap), and (c) drop outside all quadrant rects (no onUpdate
  call, framework unchanged). Card.test.tsx already covers the dragging-styles
  branch and the drag-threshold branch, so these tests should not duplicate
  per-card behavior.
- Scope exclusions: keyboard-reposition coverage is A11Y-010's territory; the
  GhostCard visual is already covered in Card.test.tsx:341-348; the pure helpers
  and hook-in-isolation are covered in useDragAndDrop.test.ts. This ticket is
  strictly about the rendered-component drop resolution.
- There is no `test` type in the work-write type registry; filing as
  `maintenance` per the reporter's call, with a `test:` prefix on the title to
  match the FEAT-001 sibling's convention. The `maintenance` type allows
  RECOMMENDATION, but on the reporter's direction the mechanics above are kept
  here as advisory rather than directive — the implementer can pick a different
  stubbing strategy if a cleaner one presents itself.

## Related work

- FEAT-001 (inbox) — analogous integration-coverage ticket for the share-import
  conflict dialog actions (same protective-coverage pattern, different surface)
- A11Y-010 (inbox) — keyboard-reposition items within quadrant (the non-pointer
  counterpart to this drop-resolution path; intentionally out of scope here)
- src/**tests**/hooks/useDragAndDrop.test.ts — existing pure-helper and
  hook-in-isolation coverage that these new tests extend, not replace
- src/**tests**/Card.test.tsx (lines 73-114, 341-348) — existing drag-threshold
  and GhostCard visual coverage (adjacent, not duplicative)
- src/components/QuadrantCanvas.tsx:60-71 — the handleDrop / useDragAndDrop
  wiring under test
- src/hooks/useDragAndDrop.ts:69-89 — the pointermove/pointerup effect whose
  end-to-end behavior these tests protect

## Working

- Added a `drag-and-drop drop resolution (MAINT-001)` describe block in
  `QuadrantCanvas.test.tsx` with three integration tests. Each test stubs
  `getBoundingClientRect` on the four `<section>` quadrants, their inner canvas
  divs, and the dragged card's outer wrapper to a 2x2 200px grid in client
  coords. Pointer events are dispatched as `MouseEvent` (clientX/Y survive in
  jsdom; PointerEvent's constructor drops them).
- **Cross-quadrant move:** drop on (250, 80) — quadrant 1 — and assert
  `onUpdate` is called with the item removed from quadrant 0, added to quadrant
  1, and its x/y clamped to 2..85.
- **Same-quadrant reposition:** drop on (120, 120) — still quadrant 0 — and
  assert the item stays in quadrant 0 with the same id, no cross-quadrant side
  effects.
- **Out-of-bounds drop:** drop on (1000, 1000) and assert `onUpdate` is not
  called.
- These exercise the previously-untested wiring between `useDragAndDrop`,
  `handleDrop`, and `moveItem` on the rendered surface.
