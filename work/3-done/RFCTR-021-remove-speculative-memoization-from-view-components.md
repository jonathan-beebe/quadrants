---
id: RFCTR-021
type: refactor
status: abandoned
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

## Working

**Abandoned in favor of a careful audit. No code changed.**

The findings below were re-validated and still hold — the problem is real. What
did not hold was this ticket's _shape_: a blanket sweep across five files in one
commit, driven by a list compiled ahead of time.

### What the sweep would have covered

Re-validated against `main` (0989af6). Every enumerated site is still present
and still lacks a consumer requiring stable identity:

- `QuadrantCanvas.tsx` — 15 `useCallback`s plus the `frameworkRef` mirror
  (57-58). Traced every consumer: `Grid`/`Card` props are re-passed each render,
  `useDragAndDrop` re-assigns `onDropRef.current = onDrop` each render, and the
  component's only Effect is the share-timer cleanup, which touches none of
  them. Reading `framework` directly resolves to the same value on every path.
- `MobileQuadrantGrid.tsx:42` — `handleGridClick` → plain `div`.
- `ColorPicker.tsx:27` — `handleKeyDown` → plain `div`.
- `FrameworkBuilderContent.tsx:116` — `useMemo` over 31 static templates.
- `App.tsx` — 8 handlers whose only consumers are props of unmemoized children.

Sites that must **stay**, with the consumer that requires them:
`Card.closeMoveMenu` (subscribed via `useClickOutside`), `Card.resizeTextarea`
(`Card.tsx:81` dep array — unwrapping re-focuses and re-selects the textarea
every render), and every coordination-hook callback (`useFrameworks`,
`useFrameworkSharing`, `useRouting`) consumed in dep arrays.

### Why the shape was wrong

Two things surfaced while scoping that the ticket had not accounted for:

1. **The enumerated list was incomplete against its own Outcome.** `Card.tsx`
   carries 8 more `useCallback`s that fail the stated rule and were not in the
   Problem section. So the ticket as written could not be both "do the list" and
   "meet the Outcome" — and Card is the component where handler identity touches
   pointer gestures and native listeners (RSRCH-002, BUG-004, BUG-005), i.e. the
   worst place to sweep on momentum.
2. **The inventory found adjacent problems a memoization sweep would step
   past.** `Card.tsx:214` is a `useCallback` whose `moveTargets` dep is a fresh
   array every render — it memoizes nothing while looking correct. And
   `ColorPicker.tsx:18` is the mirror image: a `close` handler passed to
   `useClickOutside`, unwrapped, so the listener re-subscribes every render.
   Neither is a bug today; both are the same missing analysis, and "delete
   wrappers" as a task frame has nothing to say about either.

### What replaced it

`__local__/prompts/react-hooks-audit.md` — a hooks auditor prompt covering
`useEffect`, `useCallback`, `useMemo`, and the ref-mirror patterns: the rule for
each, the gotchas per use case, and a required per-site classification (KEEP /
REMOVE / REPLACE / BUG) where KEEP must name its specific consumer. It is
grounded in this codebase's recorded decisions (ARCH-002, RSRCH-002, MAINT-005,
BUG-012, the Modal-surfaces ordering rule).

The audit supersedes this ticket and will re-file the real work as tickets sized
to what it finds. `src/architecture.md`'s ARCH-002 decision (and its "Render
unmemoized" section, which currently names RFCTR-021 as the sweep that enforces
it) stands unchanged — only the mechanism for getting there moved. That
reference should be repointed when the audit files its tickets.
