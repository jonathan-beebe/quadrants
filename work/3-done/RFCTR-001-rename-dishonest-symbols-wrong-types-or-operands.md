---
id: RFCTR-001
type: refactor
status: resolved
created: 2026-07-03
---

# RFCTR-001: rename dishonest symbols that assert wrong types or operands

## Problem

Eight symbols assert something false about what they hold or do:

- `src/hooks/useDragAndDrop.ts:30` `pageToQuadrantPercent` claims page
  coordinates but operates on `clientX`/`clientY` (client space).
- `src/sharing.ts:37` `decodeFramework` returns `SharedPayload | null`, not a
  `Framework`, while its pair `encodeFramework` genuinely takes a `Framework`.
- `src/hooks/useDarkMode.ts:34,41,42,15,60` `resolveMode` returns a boolean, not
  a `ThemeMode`; `darkMode`, `systemDark`, `getSystemDark` are booleans not
  written as assertions, sitting beside `mode` which IS the `ThemeMode`.
- `src/components/Card.tsx:54` `spanRef` is typed `HTMLButtonElement` and
  attached to a `<button>`.
- `src/hooks/useFrameworks.ts:28` `activeFramework` is a by-id lookup function
  (any id, not "the active" one), re-aliased to `getFramework` at export, while
  `App.tsx:78` uses `activeFramework` for the resolved value — one word, two
  meanings.
- `src/logic/framework.ts:105` `frameworksMatch` compares a `Framework` against
  a `SharedPayload`, not two frameworks.
- `src/components/FrameworkBuilder.tsx:15` prop `editing` reads as a boolean but
  carries `Framework | null`.
- `src/components/Sidebar.tsx:44` `menuId` holds the framework id whose action
  menu is open, not a menu's id.

## Outcome

A reader at any of these call sites can infer the value's type and meaning from
the name alone; `git grep` for the old names (`pageToQuadrantPercent`,
`decodeFramework` as a payload-returning symbol, `resolveMode`, `spanRef`,
`frameworksMatch`, bare `editing` prop, bare `menuId` in Sidebar) returns no
hits in `src/`; the full test suite passes unchanged; tsc passes.

## Why it matters

These names actively mislead — a maintainer trusting `pageToQuadrantPercent`
would pass `pageX`/`pageY` and introduce a scroll-offset bug; trusting
`decodeFramework` would treat the result as a `Framework`. Dishonest names are
where naming debt turns into defects.

## Discovery notes

Findings come from a naming-skill sweep (3 parallel reviewers, findings verified
against source). Rename-only; no behavior change intended. Test files
referencing these symbols rename with them.

The sweep's suggested replacements (advisory — the maker may pick better names):
`pageToQuadrantPercent`→`clientToQuadrantPercent`;
`decodeFramework`→`decodeSharedPayload`; `resolveMode`→`resolveIsDark`,
`darkMode`→`isDark`, `systemDark`→`isSystemDark`,
`getSystemDark`→`getIsSystemDark` (or `prefersSystemDark`);
`spanRef`→`displayButtonRef`; internal const `activeFramework`→`getFramework`
(match its export); `frameworksMatch`→`frameworkMatchesPayload`;
`editing`→`editingFramework`; `menuId`→`openMenuFrameworkId`.

Worker guidance: load the `naming` skill before settling on final names — every
replacement must pass its rules. If finding the right name reveals a deeper
design or architecture question, do not solve it here — use `/work-scope` to
file it as a new work item and keep this ticket rename-only.

## Working

- Re-validated all eight findings against source; all still applied.
- Loaded the `naming` skill; final names (all advisory suggestions held up):
  `clientToQuadrantPercent`, `decodeSharedPayload`, `resolveIsDark`, `isDark`,
  `isSystemDark`, `getIsSystemDark`, `displayButtonRef` (local `span` →
  `displayButton`), internal `getFramework` (export becomes shorthand),
  `frameworkMatchesPayload`, `editingFramework`, `openMenuFrameworkId`.
- The `isDark` rename ripples through the `darkMode` props on `Sidebar` and
  `ThemeToggleButton` (same boolean flowing through) — renamed for one word per
  concept. `useDarkMode` hook name and `mode`/`themeMode` left as-is (theme
  vocabulary is RFCTR-002 territory).
- `editingFramework` prop matches the variable App.tsx already used to feed it.
- Rename-only: no behavior change; suite is the characterization. Baseline and
  after: 366/366 tests pass, tsc clean. `git grep` for old names in `src/`
  returns no hits.

## Related work

- IMPRV-004
- BUG-011
- MAINT-005
- FEAT-003
