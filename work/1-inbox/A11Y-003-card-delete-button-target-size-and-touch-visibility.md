---
id: A11Y-003
type: a11y
status: open
created: 2026-05-29
---

# A11Y-003: card delete button: target size and touch visibility

## Problem

The Card delete button at `src/components/Card.tsx:262-269` uses
`XIcon size={11}` in `p-0.5` with `absolute -top-2 -right-2`, yielding a target
area of ~14-15×15 CSS pixels. It also starts at `opacity-0` and only becomes
visible through `hover`, `focus`, `[div:hover>&]:opacity-100`, and
`[div:focus-within>&]:opacity-100` — none of which fire on touch input. On a PWA
used on phones/tablets the delete control is therefore both too small and
effectively invisible to touch users.

## Outcome

The delete control on each card is visible (no hover required) on touch input
and presents an interactive hit area of at least 24×24 CSS pixels. Keyboard
discoverability and the existing aria-label are preserved.

## Why it matters

WCAG 2.5.8 Target Size (Minimum) (Level AA, WCAG 2.2) and WCAG 1.3.1 Info and
Relationships — an essential affordance (delete) is hidden on the primary device
class for a PWA. Hover-only revealing also has implications under WCAG 1.4.13
Content on Hover or Focus when interactions are not pointer-driven.

## Discovery notes

Detecting "touch" by media query (`@media (hover: none)`) is a common technique.
The existing pattern is desktop-centric and relies on `[div:hover>&]` selectors
that never trigger on touch.

## Recommendation

1. Increase the hit area to ≥24×24 by enlarging padding (icon can stay 11px).
2. Either show the delete control always, or hide it only under
   `@media (hover: hover) and (pointer: fine)` so touch devices see it by
   default.
3. Keep the aria-label and existing keyboard focus behavior.

## Related work

- see related a11y ticket for the sidebar menu trigger which uses the same
  hover-only opacity pattern
