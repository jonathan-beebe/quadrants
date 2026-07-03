---
id: RFCTR-003
type: refactor
status: resolved
created: 2026-07-03
---

# RFCTR-003: sweep residual noise names — underscore wrapper, bare ref, data params, hook name, hydrate

## Problem

Five low-severity naming defects remain after RFCTR-001 and RFCTR-002:

- `src/components/QuadrantCanvas.tsx:140` `handleDragStart_` —
  trailing-underscore disambiguator on a pass-through wrapper (the `button1`
  anti-pattern).
- `src/components/ColorPicker.tsx:15` bare `ref` spans the whole component while
  its siblings are specific (`triggerRef`, `customInputRef`).
- `src/io.ts:1` `downloadJson(filename, data)` — `data` is the serialized JSON
  string; `src/storage.ts:9` local `data` likewise.
- `src/hooks/useShareImport.ts` — the hook also owns `exportJson` (JSON file
  download), which the "ShareImport" name omits.
- `src/logic/framework.ts:51` `hydratePayload(payload, id): Framework` is the
  inverse of `toSharedPayload` but names neither its result nor a to/from pair.

## Outcome

Every ref names its element role; no parameter or local named `data` in
`io.ts`/`storage.ts`; the sharing hook's name covers share, import, and export,
and its file name matches its primary export; the payload→`Framework` transform
names its result. The old names grep to zero in `src/`; the test suite passes
unchanged; tsc passes.

## Why it matters

Individually small, but these are the residue that keeps the codebase from being
uniformly unambiguous — the stated finish line for this naming effort.

## Discovery notes

Findings come from a naming-skill sweep. Scoping decision by the human: rename
`useShareImport` only — do NOT split `exportJson` into a separate hook; a hook
split would be a separate refactor ticket if ever wanted.

The sweep's suggested replacements (advisory): inline `handleDragStart_` into
the `onDragStart` prop or name the wrapper for its role; `ref`→`popoverRef`;
`data`→`json` (`io.ts`) and `data`→`storedJson` (`storage.ts`);
`useShareImport`→`useFrameworkSharing` with matching file rename and import
updates; `hydratePayload`→`frameworkFromPayload`, pairing with
`toSharedPayload`.

Worker guidance: load the `naming` skill before settling on final names — every
replacement must pass its rules. If finding the right name reveals a deeper
design or architecture question, do not solve it here — use `/work-scope` to
file it as a new work item and keep this ticket rename-only.

## Working

- Re-validated all five findings; all still applied.
- `handleDragStart_` was a pure pass-through with an identical signature —
  inlined it (`onDragStart={handleDragStart}`) and removed the now-unused
  `Item`/`DragStartInfo` type imports.
- ColorPicker: bare `ref` -> `pickerRef`, not the advisory `popoverRef` — the
  ref sits on the component root wrapping trigger + popover, so `popoverRef`
  would itself be dishonest.
- `data` -> `json` (io.ts param), `data` -> `storedJson` (storage.ts local).
- `useShareImport` -> `useFrameworkSharing` with file rename and the five
  `useShareImport*.test.ts` files renamed to `useFrameworkSharing*.test.ts`;
  `UseShareImportOptions` -> `UseFrameworkSharingOptions`. Per human scoping, no
  hook split — `exportJson` stays inside.
- `hydratePayload` -> `frameworkFromPayload`, pairing with `toSharedPayload`;
  swept residual "hydrate/hydration" prose in comments and test descriptions.
- Rename-only, no behavior change; suite is the characterization. 366/366 tests
  pass before and after; tsc clean; old names grep to zero in src/.

## Related work

- IMPRV-004
- FEAT-001
- BUG-001
- BUG-002
