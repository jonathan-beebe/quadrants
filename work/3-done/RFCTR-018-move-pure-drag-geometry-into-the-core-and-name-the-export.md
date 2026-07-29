---
id: RFCTR-018
type: refactor
status: resolved
created: 2026-07-29
---

# RFCTR-018: move pure drag geometry into the core and name the export

## Problem

Two leftovers in `src/hooks/useDragAndDrop.ts`:

1. `clientToContainerPoint` (lines 32-38) is a pure coordinate-space function —
   no state, no DOM — living in the coordination layer and imported by a view
   (`src/components/Card.tsx:5`, used by `GhostCard`). RFCTR-009 moved its
   sibling geometry (`clientToQuadrantPercent`, `getQuadrantAtPoint`) into
   `src/logic/items.ts`; this one was left behind.
2. `useDragAndDrop` is the only hook of the fourteen exported as
   `export default` (line 40); every sibling uses a named export.

## Goal

Pure geometry lives in the core, and the hooks folder exports one way.

## Outcome

Views import drag geometry only from `src/logic/`; every file under `src/hooks/`
uses named exports. Behavior is unchanged — the drag/drop suite and the BUG-018
pinch-zoom positioning tests pass unmodified; tsc is clean.

## Why it matters

A view importing from `hooks/` for a pure function muddies the layer map — the
reader must open the hook to learn nothing stateful is involved. The BUG-018
client-space reasoning documented on this function belongs beside the other
geometry rules it complements. The lone default export is a small speed bump
every import site pays.

## Related work

- RFCTR-009 — moved the sibling drop-geometry rules into `logic/items`
- BUG-018 — the coordinate-space contract this function encodes

## Working

- Re-validated: both leftovers still present — `clientToContainerPoint` in
  `useDragAndDrop.ts` imported by `Card.tsx` (GhostCard), and the hook was the
  only default export among the fourteen files in `src/hooks/`.
- Moved `clientToContainerPoint` with its BUG-018 doc comment verbatim into
  `src/logic/items.ts`, placed beside `clientToQuadrantPercent` (the two
  client-space conversions now sit together, ahead of `getQuadrantAtPoint`).
- Moved its three unit tests verbatim into `logic/items.test.ts`, following the
  RFCTR-009 precedent of testing core geometry beside the other item rules.
- Converted the hook to a named export; updated `QuadrantCanvas.tsx` and the
  hook test's imports. `Card.tsx` now imports the geometry from `logic/items` on
  the same line as `clampPosition` — no view imports remain on the hook for pure
  functions.
- tsc clean; full suite green (43 files, 531 tests), including the BUG-018
  pinch-zoom positioning tests in `Card.test.tsx` and `QuadrantCanvas.test.tsx`
  unmodified.
