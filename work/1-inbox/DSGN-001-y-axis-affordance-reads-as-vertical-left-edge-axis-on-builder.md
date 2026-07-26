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
