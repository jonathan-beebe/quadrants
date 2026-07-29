---
id: RFCTR-019
type: refactor
status: open
created: 2026-07-29
---

# RFCTR-019: extract shared popup menu from Card and Sidebar

## Problem

`src/components/Card.tsx` (move menu: lines 72-83, 305-307, 331-353) and
`src/components/Sidebar.tsx` (actions menu: lines 60-75, 146-190) hand-roll the
same popup-menu apparatus: the same `useClickOutside` + `useMenuKeyboardNav`
wiring, a character-identical "focus first menu item" effect (same comment), an
identical menu container class string, and identical menuitem button classes.
The copies have already drifted on semantics: Card's trigger wires
`aria-controls` and a menu `id` (`Card.tsx:305-307`); Sidebar's trigger declares
`aria-haspopup`/`aria-expanded` but no `aria-controls`/id link
(`Sidebar.tsx:150-152`).

## Goal

One menu surface owns popup-menu behavior and semantics; both call sites render
through it.

## Outcome

The popup-menu behavior — open/close contract, outside-click dismissal,
arrow/Escape/Tab keyboard handling, focus-on-open, and the trigger + menu ARIA
wiring — is implemented once, and both menus expose the full contract (including
the `aria-controls` link Sidebar is missing today). Existing menu flows pass:
BUG-005's trigger-toggle dismissal, A11Y-015's popup semantics, keyboard
navigation tests.

## Why it matters

Two real call sites with observed drift is exactly the extraction bar this
project sets — and under strict WCAG targets, menu-ARIA drift is a recurring bug
category this extraction eliminates rather than patches.

## Discovery notes

(advisory) `useClickOutside` and `useMenuKeyboardNav` are clean primitives —
compose them, don't replace them. Mind BUG-005's `excludeRef` subtlety (the
trigger's own click must close the menu, not the outside-click handler) and
Sidebar's one-menu-across-many-rows ref pattern.

## Related work

- BUG-005 — the trigger/outside-click race the shared component must preserve
- A11Y-015 — popup semantics contract for the trigger
