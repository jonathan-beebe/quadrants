---
id: BUG-018
type: bug
status: resolved
created: 2026-07-28
---

# BUG-018: drag preview and drop ignore pinch zoom in zoomed cell view

## Problem

On mobile, with the quadrant canvas in its zoomed single-cell view
(MobileQuadrantGrid CELL_TRANSFORMS) and the page additionally pinch-zoomed in
the browser, dragging a card renders the floating drag preview at the wrong
location — offset from the finger, not accounting for the zoom. The preview is
GhostCard (src/components/Card.tsx:373-389), a position:fixed element placed at
the raw pointer clientX/clientY tracked by useDragAndDrop
(src/hooks/useDragAndDrop.ts:73-75, 104-115); under a pinch zoom the visual
viewport pans and scales over the layout viewport that fixed positioning anchors
to, and no code reconciles the two spaces. Whether the drop location is also
wrong under pinch zoom is unverified — the drop path compares client coordinates
against client rects (useDragAndDrop.ts:82-84) and may be self-consistent.

## Goal

Dragging works correctly — preview under the finger and drop where the finger
released — regardless of browser pinch-zoom level.

## Outcome

On a mobile device in the zoomed single-cell view with the page pinch-zoomed:
(1) the drag preview tracks the finger throughout the drag, holding the original
grab offset; (2) releasing places the item at the release point within the
target quadrant; (3) behavior at pinch scale 1 — mobile and desktop — is
unchanged and the existing drag-and-drop suites stay green. End-to-end
confirmation happens on a real device or simulator, since pinch zoom is not
reproducible in jsdom; any new pure coordinate-mapping rule is unit-tested.

## Why it matters

Pinch zoom must stay available (WCAG 1.4.4 / 1.4.10 — index.html's viewport meta
deliberately permits scaling), and zooming into a dense quadrant is precisely
when a user repositions items; a preview that detaches from the finger makes
drag unusable at the moment it is most needed.

## Discovery notes

Reproduction: on a phone, zoom into one cell of the canvas, pinch-zoom the page
in, then long-press and drag a card — the ghost renders offset from the finger.
The inquiry's center is coordinate spaces: GhostCard is position:fixed
(layout-viewport-anchored) at pointer client coordinates, while fireDragStart
(src/components/Card.tsx:112-124) and the drop path measure with
getBoundingClientRect(). Determine empirically which space each value occupies
under pinch zoom on the target browsers — interop here is historically
inconsistent between iOS Safari and Chrome. window.visualViewport
(offsetLeft/offsetTop/scale) is the reconciliation signal, already read in
src/hooks/useVisualViewportHeight.ts, which also records the relevant lesson:
write viewport-derived values straight to the DOM rather than through React
state (BUG-012 re-render hazard) — a preview updating at pointermove frequency
faces the same hazard. Verify early whether the drop is actually wrong or only
the preview is — the blast radius differs greatly. Keep viewport reads in the
shell (hook/component); they must not enter the core rules RFCTR-009 extracts.
This is the fourth-plus ticket circling mobile viewport geometry — if the fix
reveals broader viewport-space confusion, file a research candidate in
work/0-research per the standing note there rather than widening this ticket.

## Related work

- RFCTR-009 — pending, same hook; explicitly behavior-preserving, so this
  behavior fix stays a separate ticket. If the refactor lands first, this fix
  slots into its shell layer
- MAINT-001 — integration coverage of the drop-resolution path — the behavioral
  safety net
- MAINT-005 / commit 0fae107 — recent factoring of the same hook
- BUG-007 / commit a8ed56b — drop-coordinate clamp rigor
- BUG-015 / BUG-016 / BUG-017 and RSRCH-002 — the mobile viewport-geometry
  cluster; RSRCH-002 established visualViewport as the only signal that tracks
  the visible viewport on iOS
- commit 4df83ba — introduced the hook

## Working

**Re-validation.** Confirmed in code: GhostCard (Card.tsx) is `position: fixed`
at raw `drag.x/y` client coordinates. It renders in QuadrantCanvas as a sibling
of the grid, outside the CELL_TRANSFORMS transform, so the transformed-ancestor
containing-block trap is not in play — the mismatch is purely between coordinate
spaces under pinch zoom.

**Coordinate-space model (the root cause).** Within any one browser,
`event.clientX/Y` and `getBoundingClientRect()` report in the _same_ client
space: layout-viewport-based in Chrome/Firefox, visual-viewport-based in iOS
Safari (WebKit never shipped the layout-relative client-coordinate change;
floating-ui special-cases WebKit for exactly this). `position: fixed`, however,
anchors to the _layout_ viewport everywhere. So the one broken combination is a
client coordinate handed to fixed positioning — on iOS Safari under pinch zoom
the ghost drifts from the finger by exactly the visual-viewport pan
(offsetLeft/offsetTop), which matches the repro: wrong only when pinch-zoomed,
worse the further the pan (zoomed cell corners).

**Drop path verified unaffected.** The drop path (`getQuadrantAtPoint`,
`clientToQuadrantPercent`) compares client points against client rects — both
sides live in the same space per browser, so it is self-consistent at any pinch
level. Grab offsets are client-minus-client differences, also space-invariant.
No change needed there. (Device pass still expected per Outcome.)

**Fix.** Anchor the ghost in measured client space instead of fixed space:
QuadrantCanvas's root becomes `position: relative` and GhostCard positions
absolutely within it at `clientPoint − containerRect.origin` — both operands in
the same client space in every browser, so no UA sniffing and no visualViewport
listener is needed. At pinch scale 1 the container origin equals its layout
position, so behavior is unchanged; the existing suites plus a new
origin-compensation test cover that. New pure rule `clientToContainerPoint` sits
with the other drag geometry in useDragAndDrop.ts (travels with RFCTR-009's
extraction later). Container rect is read fresh per render — never stored in
state — honoring the BUG-012 lesson.

**Survey for broader confusion.** Grepped all client-coordinate consumers: Card,
MobileQuadrantGrid, useDragAndDrop — every other use compares client against
client. EditModal's fixed overlay is `inset-0`, not client-positioned. GhostCard
was the only fixed-at-client-coords element, so this fix closes the app's last
coordinate-space mismatch — no new research candidate filed.
