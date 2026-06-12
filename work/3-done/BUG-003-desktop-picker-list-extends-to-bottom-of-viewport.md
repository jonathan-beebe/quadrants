---
id: BUG-003
type: bug
status: resolved
created: 2026-06-10
---

# BUG-003: desktop picker list extends to bottom of viewport

## Problem

In the desktop master-detail template picker
(src/components/FrameworkBuilder.tsx), the template list does not reach the
bottom of the viewport. The page container is min-h-screen with py-10, the
two-column grid uses items-start (content-height), and the list's scroll region
is capped at md:max-h-[60vh] — so on tall viewports the list ends well short of
the bottom, leaving dead space below and showing fewer templates than the space
allows.

## Outcome

On large (non-mobile) screens, the template list column extends down to the
bottom edge of the viewport (less the page's padding) and scrolls internally
when its contents overflow; the detail/form pane stays anchored at the top as
today; the mobile dropdown picker is unchanged; framework create/edit behavior
and the create payload are unaffected; the full test suite passes.

## Why it matters

The IMPRV-002 redesign put the list/detail up top to make 23 templates
scannable, but capping the list at 60vh wastes the lower half of tall screens
and surfaces fewer templates than would fit — undercutting the very scannability
the redesign was for.

## Discovery notes

Current layout — outer container `flex justify-center px-6 py-10 min-h-screen`;
desktop grid `grid grid-cols-[280px_1fr] gap-8 items-start`; list scroll region
`... overflow-y-auto min-h-0 md:max-h-[60vh] pr-1`. The 60vh cap combined with
min-h-screen/items-start is why the list stops short. The mobile dropdown panel
uses max-h-[60vh] intentionally (popup) and is out of scope; useIsMobile
breakpoint is max-width:768px, so the change should be gated to the non-mobile
branch. Exact pixel height is hard to unit-test in jsdom (no layout) —
validation is likely visual/manual; keep the existing FrameworkBuilder tests
green.

## Recommendation

Make create-mode full-height on desktop: pin the builder to the viewport (e.g.
h-screen flex column, header a fixed-height row), let the desktop grid fill
remaining height (flex-1/min-h-0, h-full), and replace the list's
md:max-h-[60vh] with full height (e.g. md:max-h-none + h-full within a min-h-0
column) so it scrolls to the bottom edge. Keep the detail column top-aligned.
Leave the mobile branch and its max-h-[60vh] untouched. Mind the page padding
(py-10) so the list bottom doesn't run under the edge.

## Related work

- IMPRV-002 (work/3-done) + commit 4f9aeb3 — the picker redesign that introduced
  the desktop grid and the md:max-h-[60vh] list cap.

## Working

- Followed the ticket's recommended shape: `fullHeight = !editing && !isMobile`
  gates `h-screen` + `flex flex-col min-h-0` on the page container, header row
  is `shrink-0`, desktop grid gets `flex-1 min-h-0`, list column `self-stretch`,
  and the list's scroll region swaps `md:max-h-[60vh]` for `flex-1`.
- The shared `list` JSX gained `flex-1` — harmless inside the mobile dialog,
  whose own `max-h-[60vh]` cap is untouched as required.
- Page padding (`py-10`) is inside the h-screen box, so the list bottom respects
  the page padding per the outcome.
- Note: on very short desktop viewports the form column can extend past the
  fold; the document still scrolls normally (no overflow clipping), so nothing
  becomes unreachable.
- jsdom computes no layout, so per the ticket's discovery notes the pixel
  outcome is visual/manual; validation here = full suite green (it is) and no
  class-pinning tests added.
