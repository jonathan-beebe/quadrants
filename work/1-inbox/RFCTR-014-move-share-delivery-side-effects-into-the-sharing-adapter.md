---
id: RFCTR-014
type: refactor
status: open
created: 2026-07-29
---

# RFCTR-014: move share-delivery side effects into the sharing adapter

## Problem

`src/hooks/useFrameworkSharing.ts:179-208` — `share()` calls
`navigator.clipboard.writeText`, `navigator.share`, and reads
`window.location.origin` directly from the coordination hook. Every other side
effect in the same hook goes through an adapter (`encodeFramework` /
`decodeSharedPayload` from `sharing.ts`, `replacePath` from `routing.ts`,
`downloadJson` / `pickJsonFile` from `io.ts`), and `src/architecture.md`'s
adapter table assigns the clipboard to `sharing.ts`. The asymmetry shows in the
tests: `src/__tests__/hooks/useFrameworkSharingShare.test.ts` must stub
`navigator.clipboard` / `navigator.share` on the raw global via
`Object.defineProperty`, while the hook's other dependencies are mocked cleanly
as modules.

## Goal

The sharing adapter owns every share-delivery side effect; the hook only
orchestrates.

## Outcome

`useFrameworkSharing.ts` touches no browser global directly — a grep for
`navigator.` under `src/hooks/` returns no hits. Share behavior is unchanged:
the copied / shared / cancelled / failed outcomes resolve exactly as today
(BUG-002 semantics), the existing share tests pass with the adapter mocked as a
module like its siblings, and tsc is clean.

## Why it matters

The adapter ring exists so each browser facility has exactly one owner; a hook
that reaches past it erodes the boundary the architecture doc records, and the
next delivery channel (or a fix to this one) gets written in the wrong layer.
Global-stubbing tests are also more brittle than module mocks — the test file
already pays for this violation.

## Discovery notes

(advisory) One shape: a `deliverShareUrl(url)` in `sharing.ts` returning the
delivery outcome, keeping the try-clipboard-then-share-sheet cascade and the
`AbortError` → cancelled mapping with it — that cascade is delivery policy, not
orchestration. The `window.location.origin` + `BASE_URL` read can ride along or
go through the routing adapter, maker's call; `composeShareUrl` itself is
already core (RFCTR-012) and stays put. `ShareResult` is imported as a type by
`QuadrantCanvas` — wherever it ends up, keep one home for it.

## Related work

- RFCTR-012 — moved the pure share-url rule into the core; this moves the impure
  remainder into the adapter
- BUG-002 — defined the copied/shared/cancelled/failed outcome semantics this
  must preserve
- ARCH-001 — recorded the adapter table cited here
