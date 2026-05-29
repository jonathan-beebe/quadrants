---
id: IMPRV-001
type: improvement
status: resolved
created: 2026-05-29
resolved: 2026-05-29
---

# IMPRV-001: Extract share-import decision into pure resolveImportAction

## Problem

In `src/hooks/useShareImport.ts`, the `importFromHash` callback (lines 39-94)
interleaves three concerns inside a single `decodeFramework(hash).then(...)`
chain:

1. **Decision logic** — given a decoded `payload` and the current `existing`
   framework, decide whether this is a fresh import, a no-op (frameworks match),
   or a conflict. This is a pure function of two inputs.
2. **State transitions** — `setImporting`, `setConflict`, `navigate`,
   `replacePath`, `addRaw`.
3. **Scheduling** — `setTimeout(..., 0)` wrappers around the navigate/replace
   calls in each branch.

The three branches (lines 62-71 no-existing, 73-80 match, 82-86 conflict) each
re-encode the same decision in imperative form, and the decision is not
independently testable — every test must drive the hook through React, mock
`decodeFramework`, and assert on observable side effects. Related conflict
handlers (`handleConflictReplace` lines 110-128, `handleConflictDuplicate` lines
130-136, `handleConflictCancel` lines 138-143) each repeat the same
`navigate(...) → replacePath(...) → setConflict(null)` shape, suggesting a
shared post-decision action shape that is not currently named.

## Outcome

The decision of what to do with a decoded share payload (fresh add, no-op
navigate, or surface a conflict) is expressible as a pure function call whose
result is independently unit-testable without rendering the hook or mocking
React state. The hook's `importFromHash` reads as a thin shell that decodes,
asks the pure function what to do, and dispatches the resulting action. Behavior
visible to the user (which framework is shown, whether the conflict dialog
appears, when the URL hash clears, when `importing` flips) is unchanged.

## Why it matters

`useShareImport` is the entry point for a primary user-value flow — opening a
shared link. The decision logic is exactly the kind of business rule that the
project's "functional core / imperative shell" principle targets: it has no
React, no DOM, no timers, just data in and a discriminated action out. Leaving
it tangled inside the `.then` chain means:

- Every new branch (e.g. a future "incoming is older — warn the user" case)
  forces another `setTimeout`-wrapped imperative block instead of a new variant
  in a discriminated union.
- Tests of the decision (e.g. FEAT-001's planned conflict-dialog coverage) must
  go through the hook, inflating their setup and obscuring what they protect.
- Past bug fixes that touched this region (BUG-020 synchronous hash clear,
  BUG-027 freshness re-read) read as comments inside an imperative chain rather
  than as named cases in the decision.

Extracting the pure core raises the testability and readability of the share
flow without changing what the user sees.

## Recommendation

Introduce a pure function in `src/logic/` (e.g. `src/logic/shareImport.ts`) with
a directional shape along the lines of:

```ts
export type ImportAction =
  | { kind: 'add'; framework: Framework }
  | { kind: 'navigate'; id: string }
  | { kind: 'conflict'; existing: Framework; incoming: Framework }

export function resolveImportAction(
  payload: SharedPayload,
  existing: Framework | null,
): ImportAction {
  if (!existing) {
    return { kind: 'add', framework: hydratePayload(payload, payload.id) }
  }
  if (frameworksMatch(existing, payload)) {
    return { kind: 'navigate', id: payload.id }
  }
  return {
    kind: 'conflict',
    existing,
    incoming: hydratePayload(payload, payload.id),
  }
}
```

Then `importFromHash` becomes a thin dispatcher:

```ts
const action = resolveImportAction(payload, getFramework(payload.id))
switch (action.kind) {
  case 'add':
    /* addRaw + deferred navigate/replace */ break
  case 'navigate':
    /* deferred navigate/replace */ break
  case 'conflict':
    /* deferred setConflict */ break
}
```

The exact action shape, file location, and how much of the deferred-schedule
choreography moves with it are the maker's call — this sketch is directional,
not prescriptive. The load-bearing constraint is that the decision (which
branch) is reachable without React, and the three conflict handlers'
post-decision shape (`navigate → replacePath → setConflict(null)`) is a
candidate to deduplicate alongside it if it falls out naturally.

Keep BUG-020's synchronous `replacePath(null)` before the async decode and
BUG-027's freshness re-read in `handleConflictReplace` — both are imperative
shell concerns, not part of the pure decision.

## Related work

- FEAT-001 — test: cover share-import conflict dialog Replace, Keep both, and
  Cancel actions (the extracted core makes these tests cheaper to write)
- BUG-020 — share-import: no URL hash cleanup on error (`replacePath(null)` must
  stay synchronous in the shell)
- BUG-027 — referenced in-file as the freshness re-read in
  `handleConflictReplace`

## Working

- Added `src/logic/shareImport.ts` with `resolveImportAction(payload, existing)`
  returning a discriminated `ImportAction` (`'add' | 'navigate' | 'conflict'`).
  Pure — no React, no DOM, no timers.
- Added `src/__tests__/logic/shareImport.test.ts` covering the three branches.
- Rewrote `importFromHash` in `useShareImport.ts` as a thin dispatcher: it
  decodes, calls `resolveImportAction`, and switches on `action.kind`. The
  imperative shell (BUG-020's synchronous `replacePath(null)`, the deferred
  `navigate/replace`, `setImporting` lifecycle, error path) is unchanged.
- Existing app/hook tests (App.test.tsx,
  useShareImportConflictFreshness.test.ts) remain green, confirming behavior is
  unchanged.
