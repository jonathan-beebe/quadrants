---
id: BUG-006
type: bug
status: resolved
created: 2026-06-11
---

# BUG-006: imported quadrant colors not validated as #rrggbb break rendering

## Problem

The Import JSON gate `sanitizeImportedFramework` (`src/logic/framework.ts:109`)
accepts any string as a quadrant color (`"red"`, `"#abc"`, `"rgb(255,0,0)"`,
garbage), and `isValidPayload` (`src/sharing.ts:45-64`) plus `hydratePayload`
(`src/logic/framework.ts:12`) similarly pass any string through the share-link
path. Downstream consumers assume `#rrggbb` and parse hex by hand, bypassing the
validated `deriveColors` (`src/colors.ts`):
`src/components/QuadrantGrid.tsx:97-100` computes `rgba(NaN, NaN, NaN, 0.15)`
edge colors, `src/components/CornerGradient.tsx` `parseHex` (line 12) propagates
NaN into ImageData rendering black corner gradients, and
`src/components/ColorPicker.tsx` (~line 84) feeds the raw value to
`<input type="color">`, which requires `#rrggbb` and triggers a React DOM
warning.

## Outcome

After importing a JSON export whose quadrant `"color"` was edited to `"red"` or
`"#abc"` (and after opening an equivalent crafted share link), every quadrant
renders with valid edge/border colors, the corner gradient shows a real color
tint (not black), and the color picker's custom input holds a valid `#rrggbb`
value with no console warning. Frameworks with valid 6-digit hex colors are
unaffected.

## Why it matters

Users who round-trip their data through JSON export/import (a supported flow)
get silently corrupted visuals with no error message; invalid CSS and NaN canvas
math degrade the core quadrant view, and the same hole is reachable by anyone
crafting a share link.

## Discovery notes

Advisory — `deriveColors` already validates (`/^#[0-9a-fA-F]{6}$/` with slate
fallback), so the safe-rendering logic exists; the bug is that three consumers
re-parse hex inline instead of using it, and the import boundaries admit
non-`#rrggbb` strings. For `"red"`, `parseInt("ed", 16) === 237` yields
plausible-but-wrong channels rather than NaN, so garbage-in can also render
wrong-but-valid colors. Repro: export a framework to JSON, edit a quadrant
`"color"` to `"red"` or `"#abc"`, import it; observe broken quadrant edges,
black corner gradient, and a console warning from the color input. Tests
touching this area: `src/__tests__/colors.test.ts`, `io.test.ts`,
`sharing.test.ts`.

## Recommendation

Normalize at the import boundary: in `sanitizeImportedFramework` accept only
strings matching `/^#[0-9a-fA-F]{6}$/`, else fall back to `defaultColors[i]`;
consider the same tightening for the share path (`isValidPayload` and/or
`hydratePayload`). Additionally or alternatively, make the inline parsers
resilient by reusing `deriveColors` (or a shared `parseHex` with validation) in
`QuadrantGrid` and `CornerGradient` rather than hand-slicing. Start inquiry at
`src/logic/framework.ts:109` and `src/components/QuadrantGrid.tsx:97-100`.

## Related work

- Commit c095551 (BUG-017: hardened `deriveColors` + share payload color type
  check — same failure class, fixed only for the decode path)
- Commit 2a179a4 (introduced `sanitizeImportedFramework`)
- IMPRV-003 (consolidate divergent validators — coordinate; this bug tightens
  what "valid color" means, IMPRV-003 decides where shared shape checks live)
- IMPRV-004 (relocates/exports `isValidPayload` — coordinate)

## Working

- Root cause confirmed as ticketed: both import boundaries accepted any string
  color, and three consumers hand-parsed hex.
- Fix: exported `isValidHexColor` from `src/colors.ts` (now reused by
  `deriveColors`); `sanitizeImportedFramework` and `hydratePayload` fall back to
  `defaultColors[i]` for non-#rrggbb values.
- Judgment call: share path normalizes in `hydratePayload` rather than rejecting
  in `isValidPayload` — rejecting would fail the whole share link over a
  salvageable color, against the import path's salvage policy.
- Consumer hardening: QuadrantGrid edge tint parses `deriveColors().accent`
  (validated), `CornerGradient.parseHex` falls back to slate (covers
  MobileQuadrantGrid's raw pass-through too), ColorPicker feeds
  `deriveColors(color).accent` to its native input. This protects data persisted
  before this fix.
- Tests: hydratePayload + sanitizeImportedFramework color-fallback cases,
  isValidHexColor matrix in colors.test.ts, ColorPicker fallback render test.
