---
id: RFCTR-009
type: refactor
status: resolved
created: 2026-07-28
---

# RFCTR-009: extract drop-geometry rules from useDragAndDrop into the core

## Problem

Pure drop-geometry domain rules live in the hook layer:
`src/hooks/useDragAndDrop.ts` defines and exports `clientToQuadrantPercent`
(lines 30-41), which owns the [2,85] drop-placement envelope, and
`getQuadrantAtPoint` (lines 47-63), the point-in-quadrant hit-test. The
placement envelope is half of a domain rule whose other half
(`POSITION_MIN`/`POSITION_MAX` [0,95]) lives in `src/logic/items.ts` (lines
3-11) — the halves cross-reference each other only by comment, across layers.
`src/architecture.md` (line 47) says hooks are thin orchestration: "an `if`
about the domain belongs in the core." The unit tests for these pure rules sit
in `src/__tests__/hooks/useDragAndDrop.test.ts` and therefore run in the jsdom
"dom" vitest project instead of the faster node "core" project
(vitest.config.ts).

## Goal

The drop-placement and quadrant hit-testing rules live in the functional core
beside the canonical position envelope, directly unit-tested there, with the
hook a thin shell that only reads the DOM and wires events.

## Outcome

1. The drop-placement envelope rule ([2,85]) and the point-in-quadrant hit-test
   reside in the core (`src/logic/`), co-located with the canonical [0,95]
   envelope so both halves of the position-envelope rule live next to each
   other, rationale comments intact.
2. Core functions operate on data only — coordinates and rects — with no element
   access; `getBoundingClientRect()` and ref plumbing remain in the hook.
3. `src/hooks/useDragAndDrop.ts` contains no domain arithmetic or clamping; its
   drop path delegates to the core.
4. Unit tests for the pure rules live in `src/__tests__/logic/` and run in the
   node "core" vitest project; remaining hook tests keep covering the shell.
5. Drag-and-drop behavior is unchanged: existing hook and integration tests
   still pass, full suite green.

## Why it matters

The [2,85] drop envelope and the [0,95] canonical envelope are one domain
decision split across two layers, linked only by comments — a future edit can
drift them apart, and BUG-007 was exactly such a clamp-disagreement bug. The
split also violates the recorded hooks-layer rule (ARCH-001), and it forces
pure-rule tests through the slower jsdom project.

## Discovery notes

Advisory. One shape that fits (per RFCTR-006 precedent): a core module beside
items.ts — or new functions inside items.ts, since both envelopes concern item
positions — exporting a placement function taking client coordinates plus a
plain rect and a hit-test taking a point plus rect data for the quadrants; the
hook keeps refs, `getBoundingClientRect()` calls, and pointer-event wiring,
calling the core at the drop site (useDragAndDrop.ts lines 82-84). DOMRect is
acceptable as a parameter type since it is plain data, but the core must not
touch elements. The existing pure-function tests (useDragAndDrop.test.ts lines
9-111) can move nearly verbatim; the makeMockEl helper collapses to rect
literals once elements leave the signature. This is a factoring correction, not
a redesign — do not change the [2,85] envelope or any drop behavior.

## Working

- Both rules moved into `logic/items.ts` directly beside POSITION_MIN/MAX, with
  the [2,85] envelope now named (DROP_POSITION_MIN/MAX, module-private) and the
  cross-reference comments rewritten as one adjacent pair.
- `getQuadrantAtPoint` now takes `(DOMRect | null)[]` for quadrants and
  canvases; the hook maps refs → rects at the drop site. `QuadrantTarget` moved
  with it.
- Tests moved first (red), then the code: 13 pure-rule tests now run in the node
  "core" project inside `logic/items.test.ts`; hook tests keep the shell
  coverage plus `clientToContainerPoint`.
- Deliberately left `clientToContainerPoint` in the hook: it is BUG-018's
  client-space preview mapping used by Card, not a drop-domain rule, and the
  ticket scopes exactly the two geometry rules.
- Suite green at 501 (same count — tests moved, none lost).

## Related work

- RFCTR-006 — same extraction pattern for the on-screen-keyboard judgment
- RFCTR-004 — window side effects out of logic/routing
- BUG-007 / commit a8ed56b — unified the clamps; origin of the cross-referencing
  envelope comments
- MAINT-001 — integration coverage of the wired drop-resolution path — the
  behavioral safety net
- MAINT-005 / commit 0fae107 — recent factoring of the same hook
- ARCH-001 — the layer rule
- commit 4df83ba — introduced the hook
- BUG-018 — pending pinch-zoom drag bug in the same hook's shell; a behavior
  change, so it stays out of this behavior-preserving refactor — do not fix it
  here, but keep viewport reads in the shell so its fix has a place to land
