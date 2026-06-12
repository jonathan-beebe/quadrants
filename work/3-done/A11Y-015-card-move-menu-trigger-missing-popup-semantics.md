---
id: A11Y-015
type: a11y
status: resolved
created: 2026-06-11
---

# A11Y-015: card move-menu trigger missing popup semantics

## Problem

In src/components/Card.tsx, the display-mode item `<button>` (lines 274-283)
opens a move menu via the M key (handleDisplayKeyDown, lines 198-200; menu
rendered at lines 293-313 with role="menu" and role="menuitem" children, with
focus management via useMenuKeyboardNav), but the trigger exposes no popup
semantics: no `aria-haspopup="menu"` and no `aria-expanded`. The popup
relationship and open/closed state are not programmatically determinable,
violating WCAG 2.2 SC 4.1.2 Name, Role, Value (Level A). Sidebar.tsx:148-150 and
ColorPicker.tsx:46-47 both correctly set aria-haspopup + aria-expanded; this is
the one popup trigger in the app missing them.

## Outcome

A screen-reader user focusing a card item button hears that it opens a menu and
whether that menu is currently open or closed; when the move menu opens via M,
the trigger's exposed expanded state flips to true, and back to false when the
menu closes (Escape, Tab, selection). When the item has no move targets (M is a
no-op), no popup semantics are claimed. Verified by Card component tests
asserting the trigger's ARIA state across closed/open/no-target conditions.

## Why it matters

Moving items between quadrants via keyboard (desktop and mobile zoomed views) is
invisible-state for screen-reader users — they cannot discover the menu exists
from element lists or know whether it is open, undermining the keyboard move
power added in A11Y-010.

## Discovery notes

Root cause: the move menu shipped with focus management but the trigger-side
ARIA wiring was missed — an easy miss because the trigger is the item button
itself, not a dedicated menu button. The menu only renders when
`showMoveMenu && moveTargets.length > 0` (line 293).

## Recommendation

Add `aria-haspopup="menu"` and `aria-expanded={showMoveMenu}` to the display
button, applied only when `moveTargets.length > 0` (M is a no-op otherwise, so
claiming popup semantics would be false). Consider giving the menu an id and
wiring `aria-controls` from the trigger. Passing measure: with move targets
present, trigger exposes aria-haspopup="menu" and aria-expanded="false" closed /
"true" open; with zero move targets, neither attribute is present; existing Card
tests stay green plus new assertions cover these three states. Pattern
reference: Sidebar.tsx:148-150, ColorPicker.tsx:46-47.

## Related work

- A11Y-010 — added keyboard move/reposition powers on this button
- A11Y-014 (in 1-inbox) — focus indicator on the same button; different
  criterion, SC 2.4.7
- BUG-005 (in 1-inbox) — click-outside menu dismissal in
  Sidebar/FrameworkBuilder; different components

## Working

- Implemented exactly as recommended: conditional `aria-haspopup="menu"` +
  `aria-expanded={showMoveMenu}` gated on `moveTargets.length > 0`, plus the
  optional `aria-controls` wired to a per-item menu id (`move-menu-${item.id}`),
  present only while the menu is open.
- Three required states covered by new Card tests (closed / open via M + Escape
  round-trip / zero targets) — all pass, full suite green.
