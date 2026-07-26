---
id: BUG-013
type: bug
status: open
created: 2026-07-26
---

# BUG-013: mobile floating sidebar opener misaligned and overlaps title

## Problem

On mobile with the sidebar closed, the floating "Open sidebar" button in
`src/components/Sidebar.tsx:202-210` (fixed top-4 left-4, p-2 + 20px icon ≈ 38px
square) renders on every screen — the `{!open && ...}` guard has no mobile
check. The mobile canvas header (`src/components/QuadrantCanvas.tsx:166-174`) is
a compact px-3 py-2.5 row (~44px tall) that already contains its own in-header
"Open sidebar" trigger, so the floating button stacks in the same corner, starts
16px down, extends below the header's bottom edge, and visibly sits too low,
overlapping the framework title. Screens without an in-header trigger
(FrameworkBuilder at `src/components/FrameworkBuilder.tsx:245-252`, EmptyState)
also get the floating button overlapping their title area.

## Goal

The mobile menu trigger is a single, correctly aligned control that never
overlaps screen content.

## Outcome

On mobile with the sidebar closed, each screen (framework canvas, create/edit
framework, empty state) shows exactly one visible "Open sidebar" trigger,
vertically aligned with that screen's header/title row, overlapping neither the
title nor any other content. Desktop behavior with the sidebar closed is
unchanged.

## Why it matters

The overlapping button obscures the page title and puts two identical stacked
tap targets (both labeled "Open sidebar") in the same corner — visually broken,
confusing to touch users, and duplicate/ambiguous for screen-reader users in an
app with strict WCAG requirements.

## Discovery notes

Likely root cause is the missing mobile guard at `Sidebar.tsx:202` — the
floating opener was designed as the desktop affordance for a closed sidebar,
while mobile has its own in-header trigger in QuadrantCanvas. Note that
FrameworkBuilder and EmptyState currently rely on the floating button as their
only mobile trigger, so simply hiding it on mobile would leave those screens
with no way to open the sidebar — check each screen's trigger coverage. The
duplicate aria-label "Open sidebar" pair on the canvas screen is also worth a
look while in there.

## Related work

- BUG-012 — sidebar state not resynced across 768px breakpoint
- A11Y-005 — mobile sidebar drawer focus and escape behavior

## Working

Re-validated 2026-07-26. Root cause confirmed: `Sidebar.tsx:202` guards the
floating opener on `!open` only. On mobile it lands at `top-4 left-4` (36px
square) while the canvas header row (`QuadrantCanvas.tsx:166-167`, py-2.5 + 30px
content = 50px tall) centers its own trigger at y=10..40 — so the floating copy
sits 6px lower, spills past the header's bottom border into the grid, and sits
over the title row.

Two corrections to the scoped problem statement:

- EmptyState does **not** suffer an overlap — its content is vertically centered
  (`EmptyState.tsx:11`), so the floating button lands on empty space. It does
  still depend on that button as its only mobile trigger.
- FrameworkBuilder does overlap: its title row starts ~40px down (`px-6 py-10`
  container at `:245`) with the heading at x≈24, under the floating button's
  x=16..52 footprint.

Prior recorded constraint found at `Sidebar.test.tsx:114-120`: the opener must
never be hidden by a `hidden` utility, "otherwise mobile users cannot reopen the
sidebar from EmptyState/FrameworkBuilder". That guarantee is the thing to
preserve — hiding the floating opener on mobile is only safe if both screens
grow their own trigger, so this fix moves the guarantee up to App-level tests
that assert one reachable trigger per mobile screen.

Chosen direction: the floating opener becomes the desktop-only affordance (it
already pairs with the `pl-12` desktop reservation at `QuadrantCanvas.tsx:167`),
and each mobile screen owns an in-flow trigger in its own title row — the
pattern QuadrantCanvas already uses. The shared button is extracted as an atom
so the accessible name cannot drift across the three call sites, matching the
existing `atoms/ThemeToggleButton` precedent.

Observed but out of scope: on mobile, tapping "New Framework" inside the open
drawer leaves the drawer open over the builder (`App.tsx:135-138` does not close
it). Separate from this ticket; noted for a follow-up.
