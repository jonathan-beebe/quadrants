---
id: RFCTR-002
type: refactor
status: resolved
created: 2026-07-03
---

# RFCTR-002: unify split vocabulary — validation prefix, sanitize verbs, builder/editor, theme-cycle callback

## Problem

Four concepts are named with inconsistent vocabulary:

- `src/logic/framework.ts:9,19,29` use `isWellFormedItem`/`Quadrant`/
  `Framework` while `src/logic/sharePayload.ts:18` uses `isValidPayload` and
  `src/colors.ts:18` uses `isValidHexColor` — same contract (`unknown` → type
  guard), two prefixes.
- `src/logic/framework.ts:46` `sanitizeStoredFrameworks` drops malformed
  frameworks while `:148` `sanitizeImportedFramework` repairs by filling
  defaults — one verb, two opposite behaviors (the file's own comment at 41–44
  notes the difference).
- `src/App.tsx:134,139,144` `openBuilder`/`closeBuilder` vs `openEditor` — both
  open the same `FrameworkBuilder`.
- The theme-cycle callback is `onCycle`
  (`src/components/atoms/ThemeToggleButton.tsx:8`), `onCycleTheme`
  (`src/components/Sidebar.tsx:19`), `cycleMode` (`src/hooks/useDarkMode.ts`) —
  three names for one action.

## Outcome

All `unknown` → type-guard predicates share one prefix; the drop-vs-repair paths
in `framework.ts` carry distinct verbs naming their distinct behaviors; the
`FrameworkBuilder` open/close/edit entry points share one term; the theme-cycle
callback prop has one name at every component boundary. `git grep` for
`isWellFormed`, `sanitize` (in `framework.ts`), `openEditor`, and bare `onCycle`
returns no hits in `src/`; the test suite passes unchanged; tsc passes.

## Why it matters

Split vocabulary forces readers to check whether two names mean the same thing
(`isValid` vs `isWellFormed`) or hides that they don't (`sanitize` meaning both
drop and repair) — the sanitize case is the dangerous one, since callers cannot
know from the name whether malformed input survives.

## Discovery notes

Findings come from a naming-skill sweep. Scoping decision by the human:
`isValid*` wins over `isWellFormed*` (absorbs the existing `isValidHexColor` and
`isValidPayload` with zero churn there).

The sweep's suggested replacements (advisory): `isWellFormedItem`/`Quadrant`/
`Framework`→`isValidItem`/`isValidQuadrant`/`isValidFramework`;
`sanitizeStoredFrameworks`→`filterValidFrameworks`,
`sanitizeImportedFramework`→`repairImportedFramework`;
`openEditor`→`openBuilderForEdit`; `onCycle`→`onCycleTheme` in
`ThemeToggleButton` (keep `cycleMode` as the hook command; `onCycleTheme` as the
prop name wherever it crosses a component boundary).

Worker guidance: load the `naming` skill before settling on final names — every
replacement must pass its rules. If finding the right name reveals a deeper
design or architecture question, do not solve it here — use `/work-scope` to
file it as a new work item and keep this ticket rename-only.

## Working

- Re-validated all four findings; all still applied (post-RFCTR-001 the theme
  props are `isDark`/`onCycleTheme` at Sidebar, but `ThemeToggleButton` still
  took bare `onCycle`).
- Final names (advisory suggestions held up against the naming skill):
  `isValidItem`/`isValidQuadrant`/`isValidFramework` (private to framework.ts);
  `filterValidFrameworks` (drop path), `repairImportedFramework` (fill-defaults
  path); `openBuilderForEdit` (joins openBuilder/closeBuilder family);
  `onCycleTheme` prop on ThemeToggleButton (hook keeps `cycleMode`).
- Also updated the framework.ts doc comment ("Sanitize" -> "Repair") and one
  test description so no `sanitize` prose survives in framework.ts.
- Rename-only, no behavior change; suite is the characterization. 366/366 tests
  pass before and after; tsc clean; git grep for old names in src/ returns no
  hits.

## Related work

- IMPRV-003
- IMPRV-004
