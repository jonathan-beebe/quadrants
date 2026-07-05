---
id: RFCTR-004
type: refactor
status: resolved
created: 2026-07-05
resolved: 2026-07-05
---

# RFCTR-004: move window/history side effects out of logic/routing into an adapter

## Problem

`src/logic/routing.ts` lives in the pure-core folder but performs real I/O:
`getIdFromPath` and `getHashFromUrl` read `window.location` (lines 5-17), and
`pushPath`/`replacePath` call `history.pushState`/`replaceState` (lines 19-29).
Only `isNamedRoute` and the pathname→id parsing rule are pure. Consumers
(`App.tsx:8`, `hooks/useRouting.ts:2`, `hooks/useFrameworkSharing.ts:5`) import
side-effecting functions from `logic/`, violating the layer contract that
`src/logic/` contains no I/O.

## Outcome

- No module under `src/logic/` references `window`, `history`, `document`, or
  any other platform I/O (grep-verifiable).
- Pure route rules (named-route membership, pathname→id parsing over a string
  argument) remain in the core with direct unit tests that need no
  browser-global stubbing.
- All existing routing behavior — deep links, popstate back/forward, hash-based
  share import, the design-system named route — still passes its existing tests.

## Why it matters

The core's no-I/O guarantee is the project's central architectural principle
(functional core / imperative shell). A side-effecting module inside `logic/`
erodes that contract, misleads contributors about where effects are allowed, and
forces route-rule tests through jsdom location/history stubbing instead of plain
function calls.

## Discovery notes

Advisory. Found during a top-down architecture audit (2026-07-05). The impure
functions are `getIdFromPath`, `getHashFromUrl`, `pushPath`, `replacePath`; the
module also reads `import.meta.env.BASE_URL` at module scope, which is a
build-time constant and unproblematic on either side of a split. The codebase
already has sibling adapter modules (`storage.ts`, `io.ts`, `sharing.ts`) that
model where side-effecting code lives.

## Related work

- IMPRV-003 (done — extracted pure validation from the storage shell)
- MAINT-003 (done — App-level popstate and lifecycle coverage protects this
  change)
- RSRCH-001 (done — core-purity decision record)

## Working

- Re-validated 2026-07-05: `logic/routing.ts` still contained all four impure
  functions; consumers as listed in the ticket.
- Split: pure rules stay in `src/logic/routing.ts` (`NAMED_ROUTES`,
  `isNamedRoute`, `idFromPathname(pathname)`, `pathForId(id)` — both mapping
  directions live in the core); new adapter `src/routing.ts` holds
  `getIdFromPath`, `getHashFromUrl`, `pushPath`, `replacePath`, delegating
  path↔id mapping to the core.
- Tests first: rewrote `__tests__/logic/routing.test.ts` as pure unit tests (no
  jsdom, no browser-global stubbing; 8 tests, failing before the split). Moved
  the jsdom-based tests unchanged to `__tests__/routing.test.ts`.
- Repointed the three sharing-test `vi.mock('../../logic/routing')` calls to
  `'../../routing'`.
- Verified: grep of `src/logic/` shows no `window`/`history.`/`document` globals
  (only the local `History<T>` param in history.ts); tsc clean; 374/374 tests
  green.
