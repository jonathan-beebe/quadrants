---
id: RFCTR-011
type: refactor
status: open
created: 2026-07-28
---

# RFCTR-011: parameterize core path-id rules by base and test non-root base

## Problem

`src/logic/routing.ts:3` reads `import.meta.env.BASE_URL` at module scope,
coupling the core path↔id rules (`idFromPathname`, `pathForId`) to an ambient
build-time value, in violation of architecture.md's core rule ("pure functions
and types only"). The unit test `src/__tests__/logic/routing.test.ts:4` derives
its expected values from the same env read, so it can only ever prove
self-consistency under the vitest default base `/` — the subpath-strip branch of
`idFromPathname` (the `startsWith(BASE)` prefix strip and its `slice(1)`
fallback) is never exercised with a non-root base.

## Goal

The core routing rules are pure with respect to the base path — env-free and
fully testable under any base, including the real production subpath.

## Outcome

- No module under `src/logic/` reads `import.meta.env` (grep-verifiable).
- The core routing unit tests exercise the path↔id rules under both `/` and a
  non-root base (e.g. `/quadrants/`) using hard-coded expected literals rather
  than values derived from the environment, covering the subpath strip, the
  base-only pathname, and the outside-base fallback.
- All existing routing behavior (deep links, back/forward, share-import hash,
  design-system named route) still passes its existing tests.

## Why it matters

The app deploys to GitHub Pages under base `/quadrants/` (`vite.config.js:48`,
`.github/workflows/deploy.yml`), so the non-root base is the production case —
yet under vitest `BASE_URL` is always `/`, making any regression in base
handling invisible to the suite. The test currently mirrors the very value it
cannot control.

## Discovery notes

Advisory. A natural shape mirrors the RFCTR-004 split: make the base an explicit
argument of the core rules, with the adapter `src/routing.ts` supplying
`import.meta.env.BASE_URL ?? '/'` — the adapter already owns the platform side
of routing and delegates to the core. The adapter could become the sole owner of
the BASE read; `src/hooks/useFrameworkSharing.ts:180` and
`src/components/DesignSystem.tsx:500` also read `import.meta.env.BASE_URL`
directly — both are shell-layer and legal, so consolidating them is optional,
not required. Test cases worth pinning: base with trailing slash
(`/quadrants/`), pathname exactly equal to the base (yields null), pathname
outside the base (`slice(1)` fallback), and round-trips under both bases. The
adapter's own jsdom tests (`src/__tests__/routing.test.ts`) may keep deriving
BASE from the env — the prohibition on env-derived expectations applies to the
core tests.

## Related work

- RFCTR-004 (done — split window/history effects into the `src/routing.ts`
  adapter; its notes judged the module-scope env read "unproblematic" at the
  time — this ticket revisits that judgment on testability grounds)
- RSRCH-001 (done — accepted ambient Date.now/crypto.randomUUID in the core;
  that decision is scoped to time/randomness and does not cover build-env
  config)
- ARCH-001 (done — layer rules doc)
