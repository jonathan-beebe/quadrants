---
id: DSGN-002
type: design
status: resolved
created: 2026-07-28
resolved: 2026-07-28
---

# DSGN-002: gradient quadrant app icon across all icon assets

## Problem

The app's icon assets — `public/favicon.svg`, `public/pwa-192x192.png`,
`public/pwa-512x512.png` (also declared as the maskable icon), and
`public/apple-touch-icon.png`, wired in `vite.config.js:69-95` — are a
placeholder identity: a flat blue rounded square with four white tiles. It
reflects neither the product's actual canvas aesthetic nor the gradient-quadrant
look the owner wants for the installed app.

## Goal

The installed PWA carries a distinctive icon identity drawn from the product's
own canvas: a square gradient crossed by clear quadrant lines.

## Outcome

Installing the PWA (Android/desktop via manifest icons, iOS via
apple-touch-icon) shows a square icon with a soft multi-hue gradient background
and clearly visible lines dividing it into four quadrants. The browser-tab
favicon presents the same identity. The maskable variant survives a circular
mask with the quadrant composition still legible (safe-zone: inner 80%). The
icon reads clearly at 512, 192, and favicon sizes.

## Why it matters

The icon is the app's face on the user's home screen and dock; a placeholder
identity undercuts the product at the exact moment a user commits to installing
it. Coherence across favicon / touch icon / manifest icons prevents a split
identity between tab and home screen.

## Discovery notes

Inspiration image at `__local__/images/grid-screenshot.jpg` — a soft gradient
blending green (top-left), blue (top-right), slate (bottom-left), and warm olive
(bottom-right), crossed by thin lighter quadrant lines whose intersection sits
slightly off-center. Advisory: `favicon.svg` is already an SVG of the old
identity; authoring the new identity as SVG and rendering the PNG sizes from it
keeps one source of truth. The manifest reuses `pwa-512x512.png` for
`purpose: maskable` — a full-bleed gradient background makes that reuse
legitimate, but verify quadrant lines stay legible inside the safe zone. The
manifest `theme_color` is `#3b82f6` (the old placeholder blue); whether it
should follow the new palette is the maker's call. Thin lines may vanish at
16-32px favicon rendering — consider slightly heavier line weight at small
sizes.

## Working

- Sampled the inspiration image (`__local__/images/grid-screenshot.jpg`,
  1260x1260): corners green `#325245` (TL), blue `#304363` (TR), slate `#3B4350`
  (BL), warm olive `#534B36` (BR); quadrant lines essentially centered
  (x≈628/1260) and a lighter tint of the local background.
- PNGs are generated with ImageMagick `-sparse-color Bilinear` (exact
  four-corner interpolation — Barycentric was tried first and rejected: it fits
  a plane and washes out the corners), a `-modulate 100,125` saturation boost
  for home-screen presence, and a centered cross of `rgba(255,255,255,0.42)`
  lines at 22/512 proportional width, rendered natively at 512, 192, and 180 for
  crispness.
- `favicon.svg` reproduces the same blend (two linear gradients, the lower one
  through a vertical fade mask) with the post-boost corner colors baked in
  (`#2E5645`/`#294169`/`#384252`/`#564C32`). Its lines are 26/512 — slightly
  heavier than the PNGs — the size-specific optical adjustment the discovery
  notes anticipated, so the cross survives 16px tab rendering. ImageMagick's
  internal SVG renderer ignores masks, hence the parallel PNG pipeline; browsers
  render the mask fine.
- Maskable check: simulated a circular crop of `pwa-512x512.png` — the full
  quadrant composition stays legible inside the safe zone (full-bleed
  background, centered cross), so the manifest's reuse of the 512 for
  `purpose: maskable` remains legitimate. Verified small-size reading at 96 and
  48px.
- `theme_color` (`#3b82f6` in `vite.config.js:72` and `index.html:7`) left
  untouched: it is window-chrome behavior, not icon identity, and the app's
  actual accent is `#2563eb`/`#60a5fa` (`index.css:15,44`) — aligning those
  three is its own decision, not this ticket's.
- No committed tests: the deliverable is static image assets; validation was
  objective but out-of-band (dimension checks via `identify`, corner-color
  sampling, circular-mask simulation, multi-size visual review). Full suite run
  anyway: 38 files / 462 tests green. `types/design.md` is still TO BE DEFINED,
  so this followed the canonical workflow plus DSGN-001 precedent.
