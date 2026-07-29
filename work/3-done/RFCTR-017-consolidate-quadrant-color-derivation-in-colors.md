---
id: RFCTR-017
type: refactor
status: resolved
created: 2026-07-29
---

# RFCTR-017: consolidate quadrant color derivation in colors.ts

## Problem

Quadrant color rules are re-implemented and duplicated across the two grid views
instead of living in the pure shared module `src/colors.ts`:

1. `src/components/QuadrantGrid.tsx:105-108` — manually re-parses the derived
   `accent` hex with `parseInt` to build a third rgba variant (`innerEdge`,
   alpha 0.15), duplicating the exact parsing `deriveColors`
   (`src/colors.ts:30-32`) already performs to produce the 0.08 and 0.4
   variants.
2. `src/components/QuadrantGrid.tsx:91-96` and
   `src/components/MobileQuadrantGrid.tsx:66-71` — the four-line
   `quadrants[i]?.color || defaultColors[i]` array fed to `CornerGradient` is
   duplicated verbatim.
3. `src/components/QuadrantGrid.tsx:100` and
   `src/components/MobileQuadrantGrid.tsx:75` — the per-quadrant fallback
   `quadrant.color || defaultColors[idx]` is restated in both grids.

## Goal

`colors.ts` owns every quadrant color rule; the grids only consume derived
values.

## Outcome

No hex parsing or color math remains in `src/components/`; the color-fallback
rule appears exactly once; rendered output is unchanged (same computed colors in
both grids and the corner gradients); the suite passes and tsc is clean.

## Why it matters

`deriveColors` exists precisely so color derivation cannot drift per surface — a
change there (a new alpha, a dark-mode adjustment) currently misses the view
copies silently. The re-parse also bypasses the validated-hex guarantee the
comment above it relies on.

## Discovery notes

(advisory) Candidate shapes: an `innerEdge` field (or alpha parameter) on
`deriveColors`, and a pure helper for the resolved per-quadrant color that the
corner-gradient array falls out of. `DerivedColors` in `src/types.ts` is the
type to grow.

## Related work

- BUG-006 — established validated `#rrggbb` as the contract `deriveColors`
  enforces
- ARCH-001 — records `colors.ts` as a pure shared module on the core ring

## Working

Re-validated all three sites; all still present.

1. **innerEdge — a derived variant, not a re-parse.** `DerivedColors` grew an
   `innerEdge` field (alpha 0.15) alongside `bg` (0.08) and `border` (0.4);
   `QuadrantGrid` destructures it. This also restores the validated-hex
   guarantee the deleted comment leaned on — the re-parse read `accent`, which
   is validated, but did its own `parseInt` to get there.
2. **Corner-gradient array — `quadrantColors(quadrants)`**, returning the
   `[string, string, string, string]` tuple `CornerGradient` takes. Written as
   four explicit positions so it still yields four colors when the framework
   holds fewer, exactly as the duplicated literal did.
3. **Per-quadrant fallback — `quadrantColor(quadrant, index)`**, which
   `quadrantColors` is built from. Both grids delegate; neither imports
   `defaultColors` any more.

Beyond the three enumerated sites, to make the stated outcome ("no hex parsing
or color math remains in `src/components/`") literally true: `CornerGradient`'s
`parseHex`, `toLin`, and `toSrgb` moved to `colors.ts` as `hexToRgb`,
`srgbToLinear`, and `linearToSrgb`. That also removed a third copy of the slate
fallback — `#94a3b8` was written out in `deriveColors` and again as the literal
`[148, 163, 184]` in `CornerGradient`, under a comment claiming they were the
same. It is now the exported `FALLBACK_COLOR`. `CornerGradient` is left doing
only canvas painting.

Tests: written failing first — `innerEdge` (including that it derives from the
validated hex, not the caller's string), `quadrantColor`/`quadrantColors`,
`hexToRgb` (3-digit, hash-less, fallback), and a linear/sRGB round-trip. The one
existing exact-shape assertion on `deriveColors` was updated for the new field.
552 passed; tsc and eslint clean.
