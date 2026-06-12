---
id: BUG-004
type: bug
status: resolved
created: 2026-06-11
---

# BUG-004: escape on new item leaves persisted placeholder card

## Problem

Pressing Escape while editing a freshly added item leaves a persisted "New
item..." placeholder card. `src/components/QuadrantCanvas.tsx` `handleAddItem`
(line 77) creates the item with `PLACEHOLDER` text ("New item...", exported from
`src/components/Card.tsx` line 8) and immediately persists it via
`updateFramework` → `addItem`. In `src/components/Card.tsx`, the Escape branch
of `handleTextareaKeyDown` (line 227) sets `cancelledRef` and exits edit mode,
and `handleBlur` (line 236) sees `cancelledRef` and skips `commitEdit` — so
`commitEdit`'s delete branch (line 172), which correctly removes
placeholder/empty items on blur or Enter, never runs.

## Outcome

After clicking "+" on a quadrant and pressing Escape without committing text, no
"New item..." card exists in the UI or in storage (it does not reappear after
reload). Pressing Escape while re-editing an existing item still leaves that
item intact with its original text.

## Why it matters

Users who change their mind mid-add accumulate junk "New item..." cards that are
persisted to localStorage and survive reload — data clutter the user never
authored and must manually delete.

## Discovery notes

Repro: open any framework → click "+" on a quadrant → press Escape. The item is
persisted by `handleAddItem` before any edit interaction, so the cancel path
must clean up after itself. Blur and Enter already clean up correctly via
`commitEdit`. The fix must distinguish two cases: a never-committed placeholder
(discard the item) vs. an existing item being re-edited (keep original text —
current Escape behavior is correct there).

## Recommendation

Start inquiry in `Card.tsx` at `handleTextareaKeyDown`'s Escape branch (line
227), `commitEdit` (line 168), and `handleBlur` (line 236), plus
`QuadrantCanvas.tsx` `handleAddItem` (line 77). One direction: in the Escape
branch, when the underlying item text is still `PLACEHOLDER` (never committed),
call `onDelete()` instead of only exiting edit mode. Tests live in
`src/__tests__/Card.test.tsx` and `src/__tests__/QuadrantCanvas.test.tsx`.

## Related work

- none directly; commits c728f9e [A11Y-010] and acb9eed [A11Y-003] most recently
  touched `Card.tsx`.

## Working

- Root cause as ticketed: Escape sets `cancelledRef` so `handleBlur` skips
  `commitEdit`, whose delete branch is the only placeholder cleanup.
- Fix in the Escape branch of `handleTextareaKeyDown`: when
  `itemTextRef.current === PLACEHOLDER` (never committed), call
  `onDeleteRef.current()`. Distinguishes fresh adds from re-edits exactly as the
  ticket required; BUG-018 cancel-preserves-text tests stay green.
- Tests: 2 Card unit tests (plain Escape; Escape after typing uncommitted
  text) + 1 QuadrantCanvas integration test with a stateful wrapper (add →
  Escape → no placeholder card, pre-existing item intact). All three failed
  before the fix.
