---
id: IMPRV-003
type: improvement
status: resolved
created: 2026-06-11
---

# IMPRV-003: extract pure framework validation from storage shell and align divergent validators

## Problem

Pure framework-shape validation is trapped inside the storage shell:
`loadFrameworks` (`src/storage.ts:6-24`) embeds an inline predicate (lines
12-20) that checks only `id`/`name`/`quadrants.length === 4` and ignores
quadrant internals (label/color/items), so malformed quadrant entries pass into
app state. The codebase has three divergent ad-hoc validators for closely
related shapes: that inline predicate, `sanitizeImportedFramework`
(`src/logic/framework.ts:94-129`, stricter, fills defaults), and
`isValidPayload` (`src/sharing.ts:45-64`, shared-link payloads). The storage
validator can only be exercised through `localStorage` round-trips
(`src/__tests__/storage.test.ts:46-69`) rather than directly as a pure function.

## Outcome

- A framework persisted in `localStorage` with malformed quadrant internals
  (e.g. a quadrant missing label or items, or items that are not an array of
  well-formed items) does not reach app state; `loadFrameworks` returns only
  well-formed frameworks.
- The load-time validation/sanitization behavior is verified by direct unit
  tests on a pure function in `src/logic/`, with no `localStorage` involvement;
  existing `localStorage` round-trip tests still pass.
- The shape rules that genuinely overlap among the three validation sites (what
  makes a valid quadrant/item) come from shared logic, so the sites cannot drift
  apart on the common shape.

## Why it matters

Violates the project's functional-core/imperative-shell principle; divergent
validators mean bad data admitted through the storage door would be rejected at
the import door, producing inconsistent runtime behavior and forcing tests
through I/O.

## Discovery notes

Advisory — severity is higher than "malformed data passes into app state": a
framework that passes the shallow filter but has non-object quadrants or
quadrants missing `items` crashes at render in `src/components/Sidebar.tsx:143`
(`fw.quadrants.reduce((sum, q) => sum + q.items.length, 0)`). The Sidebar
renders outside the per-framework `ErrorBoundary` in `src/App.tsx` (that
boundary only wraps `QuadrantCanvas`), so the crash bubbles to the root boundary
in `src/main.tsx`. "Try again" re-renders against the same stored data and
crashes again — the app is permanently wedged until the user manually clears
`localStorage`, because `saveFrameworks` never gets a chance to overwrite the
bad entry. Repro:
`localStorage.setItem('quadrants_frameworks', JSON.stringify([{id:'x', name:'Broken', quadrants:[1,2,3,4]}]))`
then reload. Missing `axisX`/`axisY`/timestamps are tolerated downstream; the
hard crash is specifically non-object quadrants, missing `items` arrays, or
non-string item fields rendered by Card. This makes the ticket a user-facing
crash fix, not just a code-organization improvement — prioritize accordingly.

Advisory — `isValidPayload` guards `SharedPayload`, whose item shape differs
from `Framework` items (no `id`/`createdAt`, optional color), so full
unification of all three is likely over-engineering; the genuinely common ground
is the quadrant/item structural checks. `sanitizeImportedFramework` both
validates and repairs (fills defaults); discarding whole frameworks that are
salvageable would regress user data, so prefer salvage where
`sanitizeImportedFramework` already does.

## Recommendation

Extract load-time validation/sanitization into a pure function in `src/logic/`
(plausibly next to `sanitizeImportedFramework`) and have `loadFrameworks` do
only `JSON.parse` + delegate. Consolidate overlapping quadrant/item shape checks
among the three validators only where it removes real divergence — simplicity
first; do not introduce a generic schema/validation layer.

## Related work

- IMPRV-001 (extracted pure `resolveImportAction` from `useShareImport` — same
  core-extraction pattern)

## Working

- Re-validated: the shallow filter in `loadFrameworks` admitted
  `{id,name,quadrants:[1,2,3,4]}`, which crashes `Sidebar` at render — confirmed
  the crash class before fixing.
- Extracted `sanitizeStoredFrameworks` plus private deep predicates
  (`isWellFormedFramework/Quadrant/Item`) into `src/logic/framework.ts`;
  `loadFrameworks` is now parse + delegate only.
- Judgment call: stored frameworks are _filtered_, not repaired — repair (as
  `sanitizeImportedFramework` does) would regenerate ids/timestamps, which must
  stay stable for stored data. Items tolerate a missing `createdAt` (nothing
  downstream needs it; dropping data over it would regress users), but require
  string id/text and numeric x/y.
- Judgment call: did NOT unify with `isValidPayload`/`sanitizeImportedFramework`
  into a shared schema layer — per the ticket's own advisory, payload item shape
  differs and import repairs rather than rejects; the real divergence (storage
  shallow vs import deep) is what was removed.
- Direct unit tests added in `src/__tests__/logic/framework.test.ts` (7 cases,
  no localStorage) plus one wiring test in `storage.test.ts` covering the
  crash-repro shape end to end.
- Commit: 6ac1bff
