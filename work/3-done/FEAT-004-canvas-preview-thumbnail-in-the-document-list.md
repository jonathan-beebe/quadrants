---
id: FEAT-004
type: feature
status: resolved
created: 2026-07-29
resolved: 2026-07-29
---

# FEAT-004: canvas preview thumbnail in the document list

## Problem

The document list (`src/components/Sidebar.tsx:127-137`) identifies each
framework by name and item count alone — a text-only row. Nothing in the list
carries the framework's own visual identity: its four quadrant colors and the
spatial spread of its items, both of which the canvas already renders
(`QuadrantGrid.tsx:91-94` blends `quadrantColors()` corner-to-corner;
`Card.tsx:254` positions each item). Frameworks with similar names are
indistinguishable until read.

## Goal

Each framework in the document list is recognizable at a glance by its own
canvas.

## Outcome

Every row in the frameworks list shows, left of the name and item count, a
square preview of that framework's canvas — 128px source resolution displayed at
~44px, so existing row height is preserved. The preview shows the framework's
four quadrant colors blended full-strength corner to corner, a faint cross
dividing the square into quadrants, and one uniform translucent-white pill per
item, positioned where that item sits within its quadrant. A framework with no
items shows gradient and cross alone. The preview tracks current state: adding,
moving or deleting an item, or changing a quadrant color, is visible in the list
without a reload. The preview is decorative — each row's accessible name and
description remain the framework name and item count, unchanged, and assistive
technology announces nothing additional.

## Why it matters

The list is the app's only way to move between documents. Recognition beats
recall: the canvas is already a strong visual signature, and withholding it from
the list forces users to read names that are often near-identical
(template-derived frameworks share naming). It also carries the
gradient-quadrant identity established for the app icon (DSGN-002) inward into
the product.

## Discovery notes

- Coordinate space is the one real piece of geometry: item `x`/`y` are
  percentages within the item's own quadrant sub-canvas (`Card.tsx:254`; clamps
  at `logic/items.ts:17` and `DROP_POSITION_MIN`/`DROP_POSITION_MAX`), not the
  whole canvas. Mapping quadrant index + x/y into a single square is pure logic
  and unit-testable — `src/logic/` is where pure functions live.
- `CornerGradient` (`src/components/CornerGradient.tsx`) already paints exactly
  the wanted blend — linear-light interpolation with a smoothstep ease, on a
  256px canvas — from `quadrantColors(framework.quadrants)`. Reusing it at
  preview size vs. writing a painter that composes gradient + cross + pills
  together is the maker's call. Note the muting is applied at the call site
  (`opacity-20 dark:opacity-30`, `QuadrantGrid.tsx:93`), so full strength means
  not inheriting that class.
- DSGN-002's working notes record what made the icon read small: a saturation
  boost, and cross weight tuned per size (favicon 26/512 vs PNG 22/512, because
  thin lines vanish). 44px is smaller than any size tuned there — expect the
  cross weight to want its own value, checked against the sidebar surface in
  both themes.
- Derive, don't store: the preview is a pure projection of `Framework`, so
  regenerating from current state can never go stale and nothing new enters
  `storage.ts` or the share payload. If per-row regeneration proves costly at
  list scale, memoizing on framework identity/`updatedAt` is cheaper than
  persisting a bitmap.
- `Card`'s real fill is `bg-white/85 dark:bg-white/10` (`Card.tsx:253`). Over a
  full-strength gradient the dark value would nearly disappear, so the pill's
  alpha is its own design decision rather than a copy of the card's.
- Accessibility: `aria-hidden` on the preview (as `CornerGradient` already does)
  keeps the row button's accessible name intact. Contrast rules aren't
  implicated — nothing text-based is conveyed — but pills should stay visible
  against both light and dark quadrant colors.
- `src/test-setup.ts:8` — jsdom has no 2D context and canvas-drawing components
  tolerate a null context, so painted pixels aren't assertable in vitest. Keep
  the assertable behavior in the pure geometry layer; the row wiring is
  integration-testable (one preview per row, N pills for N items).
- `DesignSystem.tsx` catalogues shared visual components; a new preview
  component likely belongs in that gallery.

## Related work

- DSGN-002 — gradient quadrant app icon: established the corner-blend +
  white-cross identity and what makes it read at small sizes.
- RFCTR-017 / commit `0caec41` — consolidated every quadrant color rule in
  `colors.ts`, making `quadrantColors()` the one source for the four corner
  colors.
- IMPRV-002 — template picker redesign: prior work on how frameworks are
  presented for selection.

## Working

- Re-validated: the sidebar row is still name + `itemCount` only
  (`Sidebar.tsx:131-137`), and the gradient is still painted by `CornerGradient`
  from `quadrantColors()` and muted at both call sites (`QuadrantGrid.tsx:93`,
  `MobileQuadrantGrid.tsx:67`). The need holds.
- Shape chosen: one `<canvas width=128 height=128>` per row — a real bitmap as
  asked, one element per row, and a single paint pass for gradient + cross +
  pills. Geometry and pixel math go to the pure core, so what jsdom cannot
  assert (painted pixels) is not where the rules live.
  - `logic/canvasPreview.ts` — `previewPills(quadrants)` maps quadrant index +
    per-quadrant x/y percentages into rects in fractions of the square.
  - `logic/cornerGradient.ts` — the linear-light corner blend, lifted out of
    `CornerGradient.tsx` verbatim so the preview painter shares it instead of
    duplicating it (the RFCTR-017 pattern). Side benefit: the blend becomes
    unit-testable for the first time.
  - `components/CanvasPreview.tsx` — the imperative shell: put the pixels, fill
    the cross, fill the pills, `aria-hidden`.
- Full strength means simply not applying the callers'
  `opacity-20 dark:opacity-30`. A consequence worth noting: the preview's
  backdrop is the framework's own colors, not an app surface, so pill and cross
  contrast are theme-independent — only the container's border reacts to the
  theme.
- No memoization, per the recorded rule (`architecture.md:211-224`): the paint
  effect carries no dependency array, so the bitmap repaints with every render
  and cannot hold a stale framework. 128² pixels is far below the cost the rule
  weighs against.
- `ctx.roundRect` needs Safari 16.4+, which is already this app's floor —
  `sharing.ts` requires `CompressionStream` (same release).
- Component owns its frame (rounded border), caller passes only a size class:
  the frame stops a pale gradient corner bleeding into the row, and every call
  site would otherwise repeat it. Sidebar passes `w-11 h-11` (44px).
- Visual validation was out-of-band, as in DSGN-002: jsdom paints nothing, so
  the pure modules were compiled and run under node, the bitmap written as PPM
  and converted with ImageMagick, then reviewed at 128px and at the real 44px.
  Confirmed the four quadrant colors read as a signature, the cross survives the
  downscale, and an item at the far corner of the position envelope (95, 95)
  lands flush inside its own quadrant rather than across the line.
- One optical adjustment came out of that review, and it is the same lesson
  DSGN-002 recorded: at first pass (pill 0.11 of a quadrant tall, fill 0.78) the
  pills nearly vanished at 44px, because downscaling averages thin translucent
  marks into the background. Taller and near-opaque (0.13, 0.9) reads correctly
  at 44px without dominating at 128.
- Gallery entry added to `DesignSystem.tsx` under Components, showing sidebar
  size and enlarged, populated and empty.
- `architecture.md`'s core-module node listed six of the ten `logic/` modules;
  brought it current rather than leaving the diagram wrong about a layer this
  ticket added to.
- Suite green: 52 files / 605 tests, plus typecheck, lint, and format via
  `scripts/ci.sh` on commit.
