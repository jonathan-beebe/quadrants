---
id: IMPRV-013
type: improvement
status: resolved
created: 2026-07-29
---

# IMPRV-013: mobile surfaces ignore device safe-area insets and clip at the edges

## Problem

The app never reads the device's safe-area insets. `env(safe-area-inset-*)`
appears nowhere in `src/`, and `index.html:5` declares
`width=device-width, initial-scale=1.0` with no `viewport-fit`. The app ships as
an installed PWA (`vite.config.js:74`, `display: 'standalone'`), so on a
home-screen launch the web view owns the entire display — rounded corners and
home-indicator strip included.

The app shell is the single place that states the viewport (`App.tsx:171`,
`flex h-svh overflow-hidden`), which BUG-017 deliberately consolidated there,
but it states height only and pads nothing. Every surface below runs to the raw
edges of that box: the mobile canvas is explicitly edge-to-edge
(`QuadrantCanvas.tsx:236`, `p-0` on mobile); the overview quadrant labels are
pinned into the four corners (`MobileQuadrantGrid.tsx:105-110`, `absolute` +
`bottom-0`/`left-0`/`right-0` with only `px-3 py-2.5`); the zoomed cell's footer
bar is `absolute bottom-0` (`:164-166`); the mobile drawer is
`fixed top-0 left-0 h-svh` (`Sidebar.tsx:87`); both toasts are `fixed bottom-5`.

In portrait the bottom-row labels "Direct" and "Motivate" land in the extreme
bottom corners, inside the corner radius and the home-indicator strip, and are
cut off —
`__local__/images/issues/mobile-portrait-clips-bottom-need-to-obey-safe-area.PNG`.
Landscape renders correctly today —
`__local__/images/issues/mobile-landscape-renders-canvas-well.PNG`.

## Goal

Every screen draws inside the device's safe area on mobile, with the inset
stated once for the whole shell rather than rediscovered surface by surface.

## Outcome

On a rounded-corner iPhone in portrait, launched from the home screen, nothing
the app draws is clipped or occluded at any edge: the bottom-row quadrant labels
are fully legible clear of the corner radius and the home indicator, the zoomed
cell's footer controls are fully visible and tappable, and the toasts clear the
home indicator. The same holds in mobile Safari. Landscape renders at least as
well as it does today, with no clipping on the camera side and no new
letterboxing or dead bands. Where a device reports no insets, layout is visually
unchanged from today. Pinch-to-zoom still works and the page still scales.

The standing guarantees hold: the document does not scroll on any screen, the
canvas measures the same in overview and zoomed states with no card position
shift across the transition, the three off-screen quadrants stay out of the
accessibility tree while zoomed, the sidebar and template lists still scroll
internally, desktop is unchanged, and the test suite passes.

## Why it matters

In overview the corner labels are the only thing naming the bottom two
quadrants, so clipping them removes information the canvas depends on — on the
platform this PWA most explicitly targets, in its default orientation, in the
launch mode the app asks the OS for. It is also content lost to a fixed hardware
boundary rather than to any user choice, which is the kind of loss a strict-WCAG
project should not ship.

This same bottom edge has already cost three tickets; BUG-015's recorded outcome
even asserts the footer controls "clear the home indicator" in standalone mode,
a claim nothing in the codebase can satisfy today because no inset is read
anywhere. And BUG-017's own conclusion applies directly: correcting a viewport
assumption at one surface leaves it wrong at every other, and the defect
resurfaces a layer up.

## Discovery notes

Advisory; diagnosed by reading the code and measuring the PNGs, not on a
debugger. Verify on a rounded-corner device or the simulator before building on
any of it.

Two facts that probably have to move together: `env(safe-area-inset-*)` resolves
to 0 unless the viewport meta opts in with `viewport-fit=cover`, so an
inset-padding change alone is likely a no-op — while the meta change alone
pushes content further into the unsafe region and makes the symptom worse.
Neither half is testable in isolation.

That makes `index.html:5` the risky edit, for two separate reasons. BUG-016
deliberately ruled `user-scalable=no` / `maximum-scale=1` out of that line on
WCAG 1.4.4 grounds — whatever is added there must not quietly acquire them. And
`viewport-fit=cover` enlarges the layout viewport to the full display, which is
exactly the condition BUG-017 fought; what `h-svh` resolves to will change
underneath the shell. Re-check BUG-017's no-document-scroll guarantee and
BUG-015's footer-clearance guarantee after that change, not before.

The no-reflow constraint is the sharpest boundary: the canvas must measure
identically in overview and zoomed states and must not resize mid-interaction —
this is why the chain avoids `dvh` (`QuadrantCanvas.tsx:231`). Safe-area insets
are static per orientation, so they shouldn't reintroduce that problem, but the
canvas measurement path deserves a look rather than an assumption.

The open judgment call is where the inset lands. Padding the shell insets every
screen at once and is the smallest statement of the rule, but the canvas loses
its edge-to-edge look and gains bands of shell background. Keeping the canvas
full-bleed and insetting only what is pinned to the edges — corner labels,
footer bar, toasts, drawer — preserves the look at the cost of naming those
sites individually. The gradient reaching the physical screen edge reads as
deliberate in the screenshots, which is worth weighing, but the call is the
maker's.

Landscape is a regression risk rather than a target: it renders well today, and
left/right insets on a notched device in landscape are non-zero. Check it before
and after.

## Related work

- [BUG-015](../3-done/BUG-015-mobile-safari-bottom-toolbar-occludes-canvas-footer-controls.md)
  — cleared the canvas footer of Safari's toolbar and claimed home-indicator
  clearance in standalone mode; that claim is what this ticket makes true.
- [BUG-016](../3-done/BUG-016-mobile-inputs-under-16px-make-ios-auto-zoom-and-clip-the-canvas.md)
  — holds the standing decision against scale-locking `index.html:5`.
- [BUG-017](../3-done/BUG-017-app-shell-and-canvas-do-not-lock-to-the-visible-viewport.md)
  — made the shell the single owner of the viewport claim; this ticket extends
  that ownership from height to insets.
- [BUG-018](../3-done/BUG-018-drag-preview-and-drop-ignore-pinch-zoom-in-zoomed-cell-view.md)
  — the canvas coordinate space that any inset change has to leave intact.
- [A11Y-019](../3-done/A11Y-019-hide-off-screen-quadrants-from-at-when-zoomed.md)
  — the inert/off-screen-quadrant guarantee on the same component.
- [DSGN-003](DSGN-003-update-banner-renders-at-half-width-on-small-screens.md) —
  filed alongside; the update banner's bottom offset is one of the sites this
  ticket governs.
- [work/0-research/viewport-height-sizing-has-no-shared-answer.md](../0-research/viewport-height-sizing-has-no-shared-answer.md)
  — the prior research on viewport units in this codebase.

## Working

**Re-validated.** `env(safe-area-inset-*)` appeared nowhere in `src/`, and
`index.html:5` carried no `viewport-fit`, exactly as filed. Both halves landed
together, as the discovery notes predicted they had to.

**Decision — where the inset lands.** The shell (`App.tsx:171`), chosen by the
human over insetting each edge-pinned surface. It extends BUG-017's single-owner
rule from height to insets and is what the Goal asks for. The accepted cost is
that the mobile canvas is no longer edge-to-edge: the inset bands are shell
background, and the gradient now stops at the safe area rather than the physical
edge. Recorded in `src/architecture.md` under Accepted decisions.

**The wrinkle that modified that decision.** `position: fixed` positions against
the viewport, so a fixed box escapes the shell's padding box no matter what the
shell declares. Shell padding alone therefore satisfies the Outcome for
everything in flow — corner labels, zoomed footer, canvas — but leaves every
fixed surface exactly where it was, including the toasts the Outcome names.
Those take the inset on their own offsets:

- `Toast.tsx` — the shared anchor, so both toasts move together (DSGN-003 had
  just made that one constant). Folded into the `bottom`/`left`/`right` offsets
  rather than padding or margin, because the x margins are already spoken for by
  the `auto` centering.
- `Sidebar.tsx` — the drawer (padded, so its own surface still reaches the
  physical edge and only its contents move in) and the desktop opener.
- `App.tsx` — the skip link, a WCAG-critical control that was pinned at `top-4`,
  i.e. under the notch.
- `Modal.tsx` — the fullscreen mobile dialog. Not itself `fixed`, so the guard
  test does not catch it; it fills a `fixed` backdrop and escapes the shell the
  same way. Padded, not inset, for the same reason as the drawer.
- `EditModal.tsx` — overlay padding, and the `max-h` clamp now subtracts the
  insets: its `100svh` fallback spans the whole display once the viewport opts
  in, so the card could otherwise reach into the home indicator.

Full-bleed backdrops are deliberately left alone — a scrim that stopped at the
safe area would leave a live strip of app showing through it.

**BUG-016 made executable.** Its decision against `user-scalable=no` /
`maximum-scale=1` on `index.html:5` was a standing decision with nothing
guarding it, on the exact line this ticket had to edit. `safeArea.test.ts` now
asserts their absence alongside `viewport-fit=cover`, so the two cannot trade
off against each other.

**Verified against the built stylesheet**, since jsdom loads no Tailwind and the
arbitrary values here were the failure risk — an `env()` inside `calc()` inside
a Tailwind arbitrary value needs `_` for its spaces or it silently fails to
generate. All 12 rules emit correctly, the skip link's `focus:` variant among
them. Also confirmed `p-3` is emitted before `pt-[calc(…)]` in the sheet, so
EditModal's longhand override actually wins — same specificity, source order
decides.

**Standing guarantees re-checked after the meta change, not before.** Suite
green at 588 (was 582). `viewportLock.test.ts` still passes, so no surface
reintroduced a large-viewport unit; the canvas measurement path is untouched,
and insets are static per orientation so they do not reintroduce the
mid-interaction resize the chain avoids `dvh` for.

**Not verified on device — the ticket's own instruction, still outstanding.**
Everything above is read off source and the built CSS. Unverified: that portrait
labels actually clear the corner radius and the home indicator; that landscape
did not regress on the camera side, which the ticket flags as the real risk
since it renders correctly today; that `viewport-fit=cover` did not change what
`h-svh` resolves to underneath the shell in a way BUG-017's guarantee cares
about. That last one is the sharpest — it is a runtime question a
source-inspection test cannot answer.

**Left for a later ticket.** The mobile canvas losing its edge-to-edge look is a
deliberate consequence of the chosen option, not a defect, but it is a visible
design change worth a look on device before it is called settled.
