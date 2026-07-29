---
id: RFCTR-017
type: refactor
status: open
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
