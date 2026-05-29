---
id: A11Y-004
type: a11y
status: resolved
created: 2026-05-29
resolved: 2026-05-29
---

# A11Y-004: sidebar actions trigger invisible on touch

## Problem

`src/components/Sidebar.tsx:117-125` renders the per-framework "Actions for
<name>" menu trigger with `opacity-0 group-hover:opacity-100 focus:opacity-100`.
On touch devices (the app is a PWA) hover never fires and the trigger is
invisible — the only way to surface the Duplicate / Export JSON / Delete menu
becomes unreachable.

## Outcome

On touch input the Actions trigger for every framework in the sidebar is visible
at rest; on a desktop with a fine pointer the existing hover-reveal can be
preserved. Keyboard focus continues to reveal the trigger in all modes.

## Why it matters

WCAG 1.3.1 / 2.4.7 — a critical affordance for managing frameworks is hidden
from the primary device class. Without the menu, touch users can neither delete,
duplicate, nor export individual frameworks except through other indirect
actions.

## Discovery notes

`useIsMobile` already exists at `src/hooks/useIsMobile.ts`; alternatively a CSS
approach with `@media (hover: hover) and (pointer: fine)` keeps the desktop
behavior and exposes the button on touch.

## Recommendation

Show the trigger by default and only opt into the hover-reveal under
`@media (hover: hover) and (pointer: fine)`, or branch on `useIsMobile()` to
drop the `opacity-0` class on touch. Keep `aria-haspopup`, `aria-expanded`, and
`aria-label`.

## Related work

- See related a11y ticket for the Card delete button which uses the same
  hover-only opacity pattern.

## Working

- Added `[@media(pointer:coarse)]:opacity-100` to the per-framework actions
  trigger in `Sidebar.tsx`, matching the pattern adopted in A11Y-003 for the
  Card delete button. Desktop hover/focus reveal is preserved; touch devices see
  the trigger by default. ARIA attributes are untouched.
