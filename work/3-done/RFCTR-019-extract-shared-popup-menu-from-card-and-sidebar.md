---
id: RFCTR-019
type: refactor
status: resolved
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

The new shared component is well tested, and its various modes and options are
demoed in the design system.

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

## Working

Re-validated: both hand-rolled copies were still there, and the ARIA drift was
still real — Card wired `aria-controls`/id, Sidebar did not.

`src/components/PopupMenu.tsx` now owns the container, the items, and the
behavior: outside-click dismissal, arrow/Escape/Tab handling, focus-on-open, and
the menu's own ARIA. It composes `useClickOutside` and `useMenuKeyboardNav`
rather than replacing them, as the ticket asked.

Two design decisions worth recording:

- **Items are data, not children.** The menuitem classes and `role="menuitem"`
  were part of what had been copied, so the component owns them. A
  `variant: 'danger'` covers Sidebar's Delete.
- **`triggerToggles` is opt-in, and had to be.** BUG-005's `excludeRef` is
  correct only when the trigger's own click toggles the menu. Sidebar's does;
  Card's does not — its display button opens the menu on `M` and starts a drag
  on press, so a press on it is an ordinary outside click that must dismiss.
  Excluding it unconditionally would have left Card's menu open behind the
  inline editor. Both directions are tested.

The trigger half of the contract is `popupMenuTriggerProps(menuId, open)`,
spread onto the trigger. Card spreads it only when it has move targets and then
overrides `aria-haspopup` to `dialog` when the edit modal is the primary
activation, preserving A11Y-015 exactly. Sidebar gained the `aria-controls` link
it was missing; that gain has its own test.

14 tests for the component (written before it existed) plus the new Sidebar
assertion. Every pre-existing menu test — BUG-005 dismissal, A11Y-015 semantics,
keyboard navigation — passes unmodified. Demoed in the design system in both
modes, with the danger variant and both placements. 567 passed; tsc and eslint
clean.
