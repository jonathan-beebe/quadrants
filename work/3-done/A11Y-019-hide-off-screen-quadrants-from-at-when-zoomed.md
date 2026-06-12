---
id: A11Y-019
type: a11y
status: resolved
created: 2026-06-11
---

# A11Y-019: hide off-screen quadrants from AT when zoomed and de-pointer overview labels

## Problem

In `src/components/MobileQuadrantGrid.tsx`, when a quadrant is zoomed
(`isZoomed`), the other three quadrants are panned out of the overflow-hidden
viewport via CSS transform (lines 56-63) but remain exposed to assistive
technology: only each quadrant's inner canvas div is `inert` (lines 114-120,
from A11Y-001), while the non-focused `<section>` elements keep their
`aria-label` (line 83) and still render their overview `<h2>` headings (lines
103-108). Screen-reader browse/heading navigation therefore encounters four
quadrant sections/headings while sighted users see one, and landing on an
invisible heading gives no feedback. Separately, in overview state the section
accessible names are `"${quadrant.label} - tap to edit"` (line 83) —
pointer-specific wording announced to keyboard and SR users who activate with
Enter/Space (lines 87-96).

## Outcome

When a quadrant is zoomed, screen-reader browse/heading navigation encounters
only the focused quadrant — the three off-screen quadrants' sections and
headings are absent from the accessibility tree — and keyboard focus is never
stranded inside a hidden section. In overview state, each quadrant's accessible
name contains no pointer-specific wording ("tap") and reads correctly for touch,
keyboard, and SR activation alike. A11Y-001's guarantees still hold: overview
tabbing reaches each quadrant exactly once; zoomed state exposes only the
focused quadrant's controls.

## Why it matters

SC 1.3.2 Meaningful Sequence / screen-reader–visual consistency: SR users
perceive four quadrants present while sighted users see one. Secondary:
device-agnostic instruction wording (4.1.2 naming quality, G96-style guidance) —
"tap" assumes touch. The entire mobile editing flow (useIsMobile ≤768px) is
built on this zoom interaction, so every mobile AT user is affected.

## Discovery notes

A11Y-001 fixed interactive-descendant exposure by inerting the canvases, but the
sections/headings of off-screen quadrants were left in the accessibility tree;
the "tap to edit" label wording predates keyboard support. Advisory only.

## Recommendation

When zoomed, hide the three non-focused sections from AT entirely — e.g. `inert`
(or `aria-hidden`) on the `<section>` when `isZoomed && !isFocused` — while
keeping the existing canvas inert logic for overview mode; ensure focus isn't
left inside a section that becomes hidden. Reword overview labels to
device-neutral phrasing (e.g. "…, select to edit" / "open"). Passing
measurements:

1. Zoomed state — exactly one quadrant section and one quadrant heading exposed
   to AT (off-screen sections have inert/aria-hidden ancestry).
2. `document.activeElement` never inside a hidden section after zooming.
3. Overview accessible names match the quadrant label plus device-neutral
   suffix, with no "tap".
4. Existing MobileQuadrantGrid tests and A11Y-001 regressions stay green
   (overview tabbing reaches each quadrant once; zoomed exposes only the focused
   quadrant's controls).

## Related work

- A11Y-001 (work/3-done — nested interactive descendants, same component and
  zoom state machine)

## Working

- `inert={isZoomed && !isFocused}` on each `<section>`; the existing overview
  canvas-inert logic from A11Y-001 is untouched (its regression tests pass —
  overview tabbing still reaches each quadrant once).
- Focus stranding: the only keyboard zoom path activates the section that
  becomes the focused quadrant, so focus is never inside a section that becomes
  inert; covered by a test asserting activeElement has no inert ancestor after
  keyboard zoom. (A pointer click on a different quadrant lets the browser eject
  focus from the inert subtree to body — standard inert behavior.)
- Labels: "- select to edit" (device-neutral per the ticket); the four existing
  tests that asserted the literal "tap to edit" wording were updated, plus a
  no-"tap" regression test.
- All four ticket passing-measurements covered by tests 1:1.
