---
id: RFCTR-005
type: refactor
status: resolved
created: 2026-07-05
resolved: 2026-07-05
---

# RFCTR-005: split domain factories out of the storage adapter

## Problem

`src/storage.ts` mixes two concepts: the localStorage adapter
(`loadFrameworks`/`saveFrameworks`, lines 7-25) and the domain factories
`createFramework`/`createItem` (lines 27-52). As a consequence, a view
(`src/components/QuadrantCanvas.tsx:2`) imports `createItem` from the storage
adapter just to construct a domain object — the render layer depends on the
persistence adapter for pure domain construction.

## Outcome

- `src/storage.ts` exports only persistence operations (localStorage load/save);
  domain construction of frameworks and items lives in `src/logic/` beside the
  other domain transformations.
- No file under `src/components/` imports from `storage.ts` (grep-verifiable);
  the storage adapter is imported only by the coordination layer.
- All existing tests pass, with factory behavior verified by unit tests
  colocated with the logic tests rather than the storage tests.

## Why it matters

A view importing the persistence adapter is a dependency-direction violation: it
couples rendering to storage and blurs which module owns domain construction.
Factories are domain code — their ambient `Date.now`/
`crypto.randomUUID`/`Math.random` usage is the pattern RSRCH-001 explicitly
accepted for the core — so nothing but file placement keeps them out of `logic/`
today.

## Discovery notes

Advisory. Found during a top-down architecture audit (2026-07-05). Import sites
today: `useFrameworks.ts:2` (createFramework + load/save) and
`QuadrantCanvas.tsx:2` (createItem). `logic/framework.ts` and `logic/items.ts`
already hold the transformation functions these factories pair with, and
`createItem`'s random default placement is domain policy, not a storage concern.

## Related work

- IMPRV-003 (done — extracted pure validation from the storage shell; this
  completes the same separation for construction)
- RSRCH-001 (done — accepted ambient time/id generation in the core)

## Working

- Re-validated 2026-07-05: both factories still in `storage.ts`; import sites as
  listed (`useFrameworks.ts`, `QuadrantCanvas.tsx`).
- Tests first: moved the `createFramework` and `createItem` describe blocks
  verbatim from `__tests__/storage.test.ts` into
  `__tests__/logic/framework.test.ts` and `__tests__/logic/items.test.ts`
  (failing until the factories moved).
- Moved `createFramework` → `logic/framework.ts` (which already imported
  `defaultColors`) and `createItem` → `logic/items.ts`, both verbatim.
  `storage.ts` now exports only `loadFrameworks`/`saveFrameworks`.
- Updated imports: `useFrameworks.ts` pulls `createFramework` from
  `logic/framework`; `QuadrantCanvas.tsx` pulls `createItem` from `logic/items`
  and no longer touches storage.
- Verified: grep shows no `src/components/` file imports from `storage`; storage
  is imported only by `hooks/useFrameworks.ts`; tsc clean; 374/374 tests green.
