---
id: RFCTR-016
type: refactor
status: resolved
created: 2026-07-29
---

# RFCTR-016: views restate core-owned domain rules

## Problem

Four sites where a view restates a rule the core already owns or should own:

1. `src/components/QuadrantCanvas.tsx:60-66` — the local `updateFramework`
   wrapper stamps `updatedAt: Date.now()` before calling `onUpdate`; the core's
   `updateFramework` (`src/logic/framework.ts:74`) then stamps it again. The
   rule has two homes and the view's copy is a dead double-stamp.
2. `src/components/QuadrantGrid.tsx:158-160` and
   `src/components/MobileQuadrantGrid.tsx:134-136` — both grids independently
   derive move targets
   (`quadrants.map((q, i) => ({label, index})).filter(...)`), restating the
   "other quadrants are valid move targets" rule already typed as `MoveTarget`
   in `Card.tsx`.
3. `src/components/Sidebar.tsx:144` — a framework's total item count is folded
   inline (`fw.quadrants.reduce((sum, q) => sum + q.items.length, 0)`).
4. `src/components/DesignSystem.tsx:174-179` and `:440-445` — both grid demos
   hand-roll the exact body of `setQuadrantColor` (`src/logic/items.ts:122-127`)
   in their `onColorChange` handlers.

## Goal

Each domain rule restated in a view lives exactly once, in the core; views
delegate.

## Outcome

The restatements are gone from the views: no `updatedAt` stamping outside
`src/logic/`, the move-target and item-count rules each have one home under
`src/logic/`, and the design-system demos call the core transition. Behavior is
unchanged and the existing suite passes unmodified; tsc is clean.

## Why it matters

Restated rules drift independently — RFCTR-013 fixed this exact failure mode for
`editStructure`, and RFCTR-015 documents drift that has already happened on
another duplicated rule. Each inline copy also erodes the functional-core
boundary that makes the rules unit-testable.

## Discovery notes

(advisory) Site 1 is a deletion, not a move — the core already stamps; confirm
every `onUpdate` path routes through `useFrameworks.update` → core
`updateFramework` (it does today, so the change is behavior-preserving). Sites 2
and 3 are small pure functions next to their data (`logic/items` /
`logic/framework`); site 4 is an import swap.

## Related work

- RFCTR-013 — same species: a hook restating `replaceFramework`
- RFCTR-009 — established `logic/items` as the home for grid/item rules

## Working

Re-validated all four sites; all still present.

1. **Double stamp — deleted.** Confirmed the path: `App` passes
   `onUpdate={update}` → `useFrameworks.update` → core `updateFramework`, which
   stamps `updatedAt` (covered by `framework.test.ts:123`). `QuadrantCanvas`'s
   wrapper now just raises the transformed framework, with a comment naming the
   owner so the stamp does not grow back.
2. **Move targets — one home.** New `moveTargetsFrom(quadrants, sourceIndex)` in
   `logic/items`. `MoveTarget` moved from `Card.tsx` to `types.ts` (a pure
   shared module) so the core can return it without importing a view — Card had
   no other importers.
3. **Item count — one home.** New `itemCount(framework)` in `logic/framework`;
   `Sidebar` delegates.
4. **Design-system demos — import swap.** Both grid demos now call the core
   `setQuadrantColor` instead of hand-rolling its body.

Tests: unit tests for the two new core rules (written failing first). The rest
is behavior-preserving, so the existing suite stands as the characterization net
— it passed unmodified. 542 passed; tsc and eslint clean.
