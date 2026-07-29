---
id: RFCTR-021
type: refactor
status: open
created: 2026-07-29
---

# RFCTR-021: remove speculative memoization from view components

## Problem

No component in the codebase is memoized (`React.memo` has zero uses), and the
consumers that care about callback identity insulate themselves — `Card` mirrors
its callback props into refs for its native window listeners
(`src/components/Card.tsx:101-111`), and `useDragAndDrop` holds `onDrop` in a
ref (`src/hooks/useDragAndDrop.ts:42-43`). Yet view components carry memoization
with no consumer that requires it:

- `src/components/QuadrantCanvas.tsx` — ~15 `useCallback`-wrapped handlers plus
  a `frameworkRef` mirror (lines 57-58) that exists only to keep those handlers
  stable; nothing downstream needs the stability.
- `src/components/MobileQuadrantGrid.tsx:41-52` — `handleGridClick` wrapped in
  `useCallback`, passed to a plain `div`.
- `src/components/ColorPicker.tsx:27` — `handleKeyDown` wrapped in
  `useCallback`, passed to plain elements.
- `src/components/FrameworkBuilderContent.tsx:116-124` — the only `useMemo` in
  `src/`, guarding a trivially cheap grouping of 31 templates with no
  referential-stability consumer.
- `src/App.tsx` — same-species handler wrappers whose only consumers are props
  of non-memoized children.

## Goal

Memoization appears only where a consumer structurally requires it.

## Outcome

View components contain no `useCallback`/`useMemo` without an identifiable
consumer that requires stability (a memoized child, an effect dependency, or a
once-registered listener); `QuadrantCanvas` reads its `framework` prop directly
with the ref mirror gone. Behavior is unchanged: the full suite passes
unmodified and tsc is clean.

## Why it matters

Speculative memoization is reading noise — every wrapper and dependency array is
a claim the reader must verify, and the `frameworkRef` indirection hides the
simple truth that handlers may close over props. Dependency arrays maintained
for no consumer are also where stale-closure bugs incubate. The project's
simplicity-first principle says the minimum complexity is none of this.

## Discovery notes

(advisory) Keep the coordination hooks' callbacks (`useFrameworks`,
`useFrameworkSharing`, `useRouting`, etc.) — they are API surface consumed in
dependency arrays (e.g. App's redirect effect depends on `navigate`). Card's
prop-to-ref mirrors stay: they serve its native listeners (RSRCH-002).
`useFocusTrap` takes `onClose` into an internal dependency array — an unstable
prop there only recreates a keydown handler per render, which is harmless, but
verify each site rather than sweeping blind. MAINT-005's updater-purity note
applies if any handler moves.

## Related work

- MAINT-005 — updater purity constraint on the drop path
- RSRCH-002 — why Card's native-listener ref mirrors exist and must survive
