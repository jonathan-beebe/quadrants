---
id: MAINT-005
type: maintenance
status: resolved
created: 2026-06-11
---

# MAINT-005: move onDrop side effect out of setDrag updater in useDragAndDrop

## Problem

src/hooks/useDragAndDrop.ts — handleUp (lines 73-89) performs a side effect
inside the setDrag functional updater: the updater computes the drop target via
getQuadrantAtPoint and calls onDropRef.current({...}) before returning null.
React requires state updaters to be pure, and React.StrictMode (enabled in
src/main.tsx:8) intentionally double-invokes updaters in development to surface
exactly this, so onDrop can fire twice per pointerup in dev.

## Outcome

Releasing a drag over a quadrant invokes the onDrop callback exactly once per
pointerup — including when the hook runs under React.StrictMode — and the drag
state clears afterward. Existing drop-resolution behavior is unchanged:
cross-quadrant move, same-quadrant reposition, and out-of-bounds release (no
onDrop call) all behave as today. A test verifies the exactly-once invariant
under StrictMode so a regression reintroducing the impure updater fails the
suite.

## Why it matters

Today the double-fire is latent: onDrop flows to QuadrantCanvas.handleDrop
(src/components/QuadrantCanvas.tsx:59-61) → updateFramework → moveItem
(src/logic/items.ts), and a second call with identical args converges to the
same result (same-quadrant repositions are idempotent; cross-quadrant moves
recompute from a frameworkRef that hasn't re-rendered yet). But any future
non-idempotent work on the drop path — analytics, screen-reader announcements,
undo/history entries, server sync — would silently double-fire in dev and behave
differently between dev and prod. That dev/prod divergence is exactly the
failure class StrictMode exists to catch, and the current code defeats it.

## Discovery notes

Advisory. The effect at useDragAndDrop.ts:66-97 re-subscribes on every `drag`
change, so the current drag value is already available in the effect's closure —
handleUp does not need the functional updater to read it. None of the existing
tests render under StrictMode or assert an onDrop call count of exactly 1, which
is why the double-invocation has gone unnoticed. Verified by code reading during
a bug sweep; no user-visible repro exists today.

## Recommendation

In handleUp, read the in-flight drag from the effect's closure (`drag`), compute
the target and call onDropRef.current(...) outside any updater, then call
setDrag(null) plainly. handleMove's updater (`prev => ({...prev, x, y})`) is
pure and can stay. Add a hook test that renders under <React.StrictMode>
(renderHook's `wrapper` option) and asserts onDrop toHaveBeenCalledTimes(1) for
a pointerup inside a quadrant; the MAINT-001 integration block and existing hook
tests protect the rest of the behavior.

## Related work

- MAINT-001 (3-done) — drop-resolution integration tests in
  src/**tests**/QuadrantCanvas.test.tsx, the protective net for this change
- A11Y-010 (3-done) — keyboard-reposition counterpart, out of scope here
- src/**tests**/hooks/useDragAndDrop.test.ts — hook-in-isolation coverage,
  including the existing "does not call onDrop when pointerup is outside all
  quadrants" case

## Working

- Implemented exactly the ticket's recommendation: drop computation and onDrop
  call moved into handleUp's body using the closure `drag`; handleMove's pure
  updater untouched.
- StrictMode test (renderHook wrapper) proved the double-fire first: onDrop
  called 2x before the fix, exactly 1x after. Existing outside-all-quadrants and
  cleanup tests stay green, MAINT-001 integration block green.
