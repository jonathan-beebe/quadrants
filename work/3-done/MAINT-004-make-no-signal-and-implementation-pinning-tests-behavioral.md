---
id: MAINT-004
type: maintenance
status: resolved
created: 2026-06-11
---

# MAINT-004: make no-signal and implementation-pinning tests assert observable behavior or remove them

## Problem

Five tests in `src/__tests__` assert implementation details or assert nothing,
violating the project principle "test what matters / don't test implementation
details":

1. `src/__tests__/hooks/useDragAndDrop.test.ts:180-203` — "updates drag position
   on pointermove" only asserts `drag` is not null (the comment at lines 200-201
   admits jsdom PointerEvent clientX/Y default to 0), so it cannot fail for the
   behavior it names.
2. `src/__tests__/hooks/useDragAndDrop.test.ts:116-131` — the "coordinate system
   consistency" describe duplicates an assertion already made in the
   `pageToQuadrantPercent` suite (lines 11-16) and "documents" the
   clientX-vs-pageX choice only in comments, with no assertion that could catch
   a regression.
3. `src/__tests__/App.test.tsx:97-101` — "shows the conflict dialog elements"
   actually asserts the dialog is ABSENT on the empty state — the name is
   misleading and real conflict-dialog assertions live elsewhere (FEAT-001
   tests).
4. `src/__tests__/sharing.test.ts:121-133` — spies on `String.fromCharCode` and
   asserts max call-arg count <= 8192, pinning the exact chunking implementation
   rather than user-visible behavior.
5. `src/__tests__/hooks/useShareImportErrorTimer.test.ts:41-65` — asserts
   `clearTimeout` "has been called" after unmount — any clearTimeout call
   satisfies it, including React internals.

## Outcome

For each of the five listed tests, one of two end states holds: the test fails
when the named behavior is broken (verifiable by temporarily reverting/mutating
the code under test), or the test no longer exists. Test names accurately
describe what is asserted. The full suite remains green with no production code
changes.

## Why it matters

Tests that cannot fail provide false confidence and rot the suite's signal;
tests that pin internals (spied built-ins, jsdom quirks, call shapes) break on
harmless refactors and train developers to ignore failures. Both directly
violate the CLAUDE.md testing principle and undermine the
functional-core/imperative-shell discipline the project relies on.

## Discovery notes

Advisory — `/work-start` may use or discard:

- jsdom's PointerEvent constructor does accept clientX/clientY in its init dict,
  so test (1) is fixable in-place.
- The sharing test (4) references BUG-011 chunking; spread-argument limits in V8
  are around 64k+ elements, well above the 8192 chunk size.
- The useShareImport hook clears a 5-second error timer in its unmount cleanup;
  fake timers are already enabled in that file.

## Recommendation

1. Construct the pointermove PointerEvent with explicit clientX/clientY and
   assert the updated drag.x/y values.
2. Delete the "coordinate system consistency" describe, or replace it with a
   real scrolled-page scenario that would fail if pageX/pageY were used.
3. Rename the App test to describe what it asserts (e.g. "does not show the
   conflict dialog on the empty state") or delete it.
4. Drop the `String.fromCharCode` spy and instead make the encoded payload large
   enough that an unchunked spread would throw RangeError, keeping the
   round-trip assertion so the test fails on the actual user-visible breakage.
5. Replace the clearTimeout spy with a behavioral check: unmount, advance fake
   timers past 5s, and assert no setState-after-unmount warning/error is
   emitted.

Verify each kept test can fail by temporarily breaking the behavior it guards.
No production code changes.

## Related work

- MAINT-001 — drag-and-drop drop-resolution integration tests
- FEAT-001 — conflict dialog Replace/Keep both/Cancel tests (the real home of
  conflict-dialog assertions)
- MAINT-003 — App-level history/lifecycle coverage (in inbox)
- BUG-002 — sharing
- Commit f0690c1 — chore: remove warning from tests

## Working

- All five items resolved per the ticket's recommendations; (2) chose deletion
  over a scrolled-page scenario (the kept pointermove test now asserts exact
  clientX/Y propagation, which is the same regression surface).
- (4) sizing: V8 spread throws RangeError ≥~125k args; unique-random text
  (repeat()-based text deflated to 11KB — too small) yields ~240KB compressed,
  verified to throw unchunked in this Node.
- (5) judgment call: the ticket suggested asserting no setState-after-unmount
  warning, but React 19 removed that warning entirely, so such a test could
  never fail. vi.getTimerCount() === 0 after unmount is the observable cleanup
  behavior and fails when the cleanup is removed (mutation-verified).
- Mutation verification performed for items 1, 4, 5 (the behavioral ones); 2 is
  a deletion and 3 a rename.
