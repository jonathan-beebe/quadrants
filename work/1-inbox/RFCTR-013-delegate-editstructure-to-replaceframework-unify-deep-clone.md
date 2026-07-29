---
id: RFCTR-013
type: refactor
status: open
created: 2026-07-28
---

# RFCTR-013: delegate editStructure to replaceFramework and unify deep-clone idiom

## Problem

Two consistency drifts between the functional core and its coordination layer:

1. `src/hooks/useFrameworks.ts:73-79` — `editStructure` restates the
   framework-replacement rule inline
   (`apply((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))`),
   which is character-for-character the rule already owned by the core function
   `replaceFramework` (`src/logic/framework.ts:138-140`). This violates the
   Coordination-layer rule in `src/architecture.md:47` ("Delegates only — an
   `if` about the domain belongs in the core").
2. `src/logic/framework.ts` uses two deep-clone idioms for the same operation in
   one file: `duplicateFramework` (line 83) clones via
   `JSON.parse(JSON.stringify(fw))` while its sibling `duplicateAsImport`
   (line 132) uses `structuredClone`.

## Goal

The framework-replacement rule has exactly one home (the core), and
`logic/framework.ts` uses a single deep-clone idiom.

## Outcome

`editStructure` in `useFrameworks.ts` contains no inline domain mapping — it
delegates to the core; `git grep` for `JSON.parse(JSON.stringify` over
`src/logic/` returns no hits and one deep-clone idiom is used consistently in
`framework.ts`; behavior is unchanged — the existing suite
(`src/__tests__/logic/framework.test.ts`, `src/__tests__/App.test.tsx` duplicate
and edit-structure flows) passes unmodified and tsc passes.

## Why it matters

A duplicated rule drifts independently — if replacement semantics ever change,
the inline copy in the hook gets missed; the inline copy also erodes the
functional-core/imperative-shell boundary the architecture doc records. Two
clone idioms for one operation force readers to ask whether the difference is
intentional (JSON round-trip drops `undefined`/functions; `structuredClone` does
not) when it is not.

## Discovery notes

(advisory) For (1), `replaceFramework(prev, updated)` is the exact-match reuse;
`updateFramework` is NOT a substitute — it re-stamps `updatedAt`, and
`applyTemplateEdit` has already stamped it, so routing through `updateFramework`
would double-stamp and subtly change semantics. For (2), `structuredClone` is
the modern idiom already in use in the same file, and the `Framework` shape is
plain JSON data, so the swap is behavior-equivalent. Both changes are
behavior-preserving; the existing tests already pin these behaviors and no new
tests should be needed — verification is the suite staying green.

## Related work

- RFCTR-001, RFCTR-002, RFCTR-003 — prior small-consistency sweeps of the same
  species
- ARCH-001 — recorded the coordination-layer rule cited here
- commit f5817f4 (FEAT-003) — introduced the current `apply`/`editStructure`
  shape
