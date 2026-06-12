---
id: BUG-005
type: bug
status: resolved
created: 2026-06-11
---

# BUG-005: menu trigger cannot dismiss its own open menu

## Problem

Open menus driven by `useClickOutside` cannot be dismissed by clicking their own
trigger button. `src/hooks/useClickOutside.ts` listens on document `mousedown`
and calls `onClose` when the press lands outside the given ref. In
`src/components/Sidebar.tsx` the ref (`menuRef`, line 157, wired at line 54)
covers only the dropdown panel, while the "Actions for {fw.name}" trigger (lines
148-151) is outside it; in `src/components/FrameworkBuilder.tsx` the ref
(`panelRef`, line 262, wired at line 78) covers only the mobile template
dropdown panel, while its trigger (line 253) is outside it. Pressing the open
menu's trigger fires `mousedown` first (menu closes, state flushes), then the
click handler's toggle runs against the now-closed state and reopens the menu.
Net effect: the menu flickers and stays open; the trigger can never close it.

## Outcome

In the sidebar, clicking the open Actions menu's own trigger closes the menu and
it stays closed; in the mobile FrameworkBuilder, clicking the open "Choose a
template" dropdown's trigger closes the dropdown and it stays closed. Clicking
elsewhere outside still closes both menus, and clicking the trigger of a closed
menu still opens it.

## Why it matters

The trigger is the most natural dismissal target for a toggle menu; users who
click it see a flicker and a menu that refuses to close, forcing them to find
empty space or press Escape. This violates expected disclosure-widget behavior
and degrades accessibility/usability of the two menus.

## Discovery notes

Advisory — `/work-start` may use or discard.

- Event-order race: document `mousedown` (close + React flush) precedes the
  trigger's `click` (toggle reads post-flush state and reopens). Sidebar's
  toggle reads the now-null `menuId`; FrameworkBuilder's functional update flips
  false back to true — both reopen.
- `src/components/ColorPicker.tsx` (line 34, wired at line 20) is the
  in-codebase counter-example: it wraps BOTH trigger and popup in the ref passed
  to `useClickOutside`, so trigger presses count as "inside" and the onClick
  toggle works.
- Repro: open sidebar, hover a framework row, click the Actions button (menu
  opens), click it again — menu closes and instantly reopens; same for the
  mobile template dropdown trigger.
- Existing tests: `src/__tests__/Sidebar.test.tsx`,
  `src/__tests__/FrameworkBuilder.test.tsx`.

## Recommendation

Start inquiry at `src/hooks/useClickOutside.ts` and the two call sites. Two
viable shapes: (a) scope the click-outside ref to include the trigger
(ColorPicker pattern), or (b) have the hook/call sites ignore `mousedown` events
originating on the trigger element. Add integration coverage: trigger-click on
an open menu results in a closed menu (both components).

## Related work

- A11Y-004 (same Sidebar trigger, touch visibility)
- A11Y-005 (sidebar drawer focus/escape)
- IMPRV-002 / BUG-003 (FrameworkBuilder picker layout)
- Commits 5ed4060, c1765b8, 4f9aeb3

## Working

- Chose shape (b) from the ticket: hook-level `excludeRef` parameter. Shape (a)
  (wrap trigger + panel in one ref, ColorPicker pattern) would have required
  restructuring Sidebar's per-row DOM since one menuRef serves many row
  triggers.
- Both call sites already had trigger refs (`menuTriggerRef`, `triggerRef`) —
  wiring was two one-line changes. ColorPicker's 3-arg call is untouched.
- Integration tests (both components): trigger-click on an open menu closes it
  and it stays closed; both failed before the fix. Existing click-outside-closes
  tests stay green.
