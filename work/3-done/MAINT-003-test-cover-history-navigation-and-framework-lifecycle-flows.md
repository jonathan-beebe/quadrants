---
id: MAINT-003
type: maintenance
status: resolved
created: 2026-06-11
---

# MAINT-003: test: cover history navigation (popstate) and framework lifecycle flows at App level

## Problem

The imperative shell around routing and framework lifecycle is untested.
`src/hooks/useRouting.ts:6-23` (popstate handler plus the `skipPush` ref that
prevents a duplicate history push on back/forward navigation) has no test;
`src/__tests__/logic/routing.test.ts` covers only the pure path helpers and
`src/__tests__/App.test.tsx` never dispatches a popstate event. Likewise
untested at App level: `src/App.tsx:68-74` `handleDelete` (navigates home when
the active framework is deleted), `src/App.tsx:76-82` `handleDuplicate`
(navigates to the copy), and `src/App.tsx:91-102` the edit-structure flow
(`openEditor` → `handleSaveEdit` → `editStructure`). `Sidebar.test.tsx`
exercises these callbacks only via mocks.

## Outcome

Running the test suite exercises and verifies, end to end in rendered App:

1. After navigating between two frameworks and pressing back (popstate), the
   previously active framework is shown and history gains no duplicate entry.
2. Deleting the active framework returns the app to the empty state with the URL
   cleared.
3. Duplicating a framework shows the duplicate as active.
4. Editing a framework's structure via the builder updates the labels shown on
   the canvas.

A regression in any of these flows fails a test.

## Why it matters

These are core user journeys (back/forward, delete, duplicate, edit). The
skipPush logic is subtle and easy to break silently — a regression would
duplicate history entries or strand users on stale URLs. Project principle: test
what matters — protect end-to-end flows.

## Discovery notes

Advisory; /work-start may use or discard. jsdom history is real enough to assert
on: `window.history` length/state and `window.location.pathname` can be
inspected after dispatching `new PopStateEvent('popstate')`. `App.test.tsx`
already resets the URL with `history.replaceState` in `beforeEach` and seeds
localStorage for load-on-mount tests — the same setup pattern applies.

## Recommendation

Add the four flows to `src/__tests__/App.test.tsx` using Testing Library against
rendered `<App />` (no mocks of `useRouting`). For the popstate case, navigate A
→ B via the sidebar, call `history.back()` or dispatch `PopStateEvent` after
rewinding the URL, then assert framework A's canvas is shown and
`history.length` (or a `pushState` spy call count) did not grow — covering the
skipPush behavior observationally, not by reading the ref.

## Related work

- MAINT-001 — integration tests for quadrant drag-and-drop drop resolution
- FEAT-001 — integration tests for conflict dialog Replace / Keep both / Cancel
- Commits 4f9aeb3 / ecb4ee0 — builder and template changes touching these flows

## Working

- All four ticket flows implemented in a MAINT-003 describe in App.test.tsx,
  using the existing seeding pattern (two stored frameworks). The popstate case
  follows the ticket's recipe: rewind via replaceState, dispatch PopStateEvent,
  assert the previous framework's heading and that a pushState spy was not
  called.
- Honest caveat noted: after the URL rewind, pushPath's own pathname-equality
  check would also skip the push, so the spy assertion covers the
  no-duplicate-entry outcome observationally rather than isolating skipPush —
  exactly what the ticket asked for (no ref reads).
- Found and fixed real test pollution: `window.location.hash = ''` in the
  file-level beforeEach makes jsdom navigate and emit an async popstate that
  fires after the NEXT test mounts App, consuming skipPush and swallowing the
  first push (all four new tests failed file-run but passed standalone until
  this was removed). replaceState already clears the hash.
- Edit-structure flow asserts the renamed quadrant label appears on the canvas
  and the old label is gone.
