---
id: DSGN-001
type: design
status: open
created: 2026-07-26
---

# DSGN-001: y-axis affordance reads as vertical left-edge axis on builder

## Problem

On the Create Framework screen, the quadrant-labels editor in
`src/components/FrameworkBuilder.tsx:185-226` renders the Y-axis input as a
horizontal text field centered above the 2x2 quadrant preview (`:188-197`),
visually identical to the X-axis input below it (`:215-224`). Nothing about it
reads as a y-axis. The actual canvas renders the Y-axis as a vertical rail along
the grid's left edge — up/down arrow glyphs, an axis line, and a rotated label
(`src/components/QuadrantGrid.tsx:51-81`) — so the builder preview misrepresents
where the Y-axis lives and which input controls which axis.

## Goal

The Y-axis affordance on the framework builder reads as a true y-axis —
vertical, along the left edge of the quadrant preview — matching the canvas
idiom.

## Outcome

On the Create Framework screen, the Y-axis affordance appears alongside the left
edge of the 2x2 quadrant preview, oriented vertically (reading up/down) so it
visually reads as a y-axis label, while the X-axis affordance stays below the
grid; the Y-axis value remains keyboard-editable with its accessible name
intact; and creating a framework yields the same payload as today. The layout
holds on both the desktop and mobile builder layouts without crushing the
quadrant grid.

## Why it matters

The quadrant-labels section is a live preview of the framework being created —
the on-ramp moment where users form their mental model of the axes. Two
identical horizontal inputs stacked above and below the grid force users to read
placeholder text to tell the axes apart, and the preview contradicts the canvas
they land on immediately after creating.

## Discovery notes

The canvas's Y-axis rail (`QuadrantGrid.tsx:51-81` — arrows, hairline,
`-rotate-90` label) is the visual vocabulary to echo. A vertically-written text
input is awkward in HTML; directions the maker might weigh include rotating the
input (CSS transform or writing-mode with careful caret/focus behavior) versus a
vertical display label on the left rail paired with an ordinary horizontal input
for editing. The edit-framework mode shares the same form
(`FrameworkBuilder.tsx:254-255`), so whatever lands applies to both create and
edit — keep the existing accessible names ("Y axis label (optional)") working.
On narrow mobile widths, the left rail must not squeeze the two-column quadrant
grid (`:198`) below usable tap-target width.

## Related work

- IMPRV-002 — redesign template picker as responsive master-detail

## Working

The open design question — rotate the input itself vs. a vertical display label
paired with a horizontal input — was settled by the human on 2026-07-26: keep
the same element, rotate it in place.

Mechanism: `rotate: -90deg` (Tailwind `-rotate-90`), matching the canvas rail in
`QuadrantGrid.tsx:65`, rather than `writing-mode: vertical-rl`. The canvas
already establishes the transform idiom, and vertical writing-mode on form
controls has a shorter support history and its own caret quirks.

Layout: the rail is a narrow (`w-9`) stretched flex column and the input is
absolutely positioned and centered inside it, so its unrotated 132px box never
widens the column or pushes the grid. Tailwind v4 emits `translate` and `rotate`
as independent CSS properties, which the spec applies in that order — so the box
centers on the rail first, then rotates about its own centre, landing as a
30x132 vertical label spanning the grid's left edge.

The 132px width is the grid's height (two 62px rows plus the 8px gap) so the
label spans the axis it names. It is a fixed number in a file that already sizes
both axis inputs with `w-[180px]`; if the grid's height drifts the label just
runs slightly short or long rather than breaking. The X axis input gains `pl-11`
(rail 36px + 8px gap) so it stays centred under the grid rather than under the
whole row.

Mobile holds: at a 360px viewport the row keeps 312px of content, the rail takes
44px, and the two-column grid still gets ~134px per quadrant.

Verification: no browser is available in this environment (jsdom only), so the
automated checks cover the four utilities being emitted into the built
stylesheet (`-rotate-90` → `rotate:-90deg`, `w-[132px]`, `pl-11`, `w-9`), DOM
and tab order unchanged (Y, quadrants, X), the accessible name intact, and the
input still submitting its value. The human confirmed the rendered result
visually on 2026-07-26.
