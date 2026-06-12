---
id: A11Y-013
type: a11y
status: resolved
created: 2026-06-11
---

# A11Y-013: color picker custom input unreachable by keyboard

## Problem

`src/components/ColorPicker.tsx:56-88` — the popup div has `role="listbox"` with
`onKeyDown` from `useMenuKeyboardNav` (`src/hooks/useMenuKeyboardNav.ts`). The
hook cycles Arrow-key focus only among `'[role="menuitem"], [role="option"]'`
elements and preventDefaults BOTH Escape and Tab, closing the popup and
restoring focus to the trigger. The "Custom" `<input type="color">` (lines
81-86) has no `role="option"`, so arrow keys skip it and Tab closes the popup
before focus can reach it: keyboard-only users can never open the native color
chooser. Secondary: `role="listbox"` requires owned children of role
option/group; the inner grid div, label, and input are invalid children, so AT
may mis-expose or hide them.

## Outcome

A keyboard-only user can open the ColorPicker popup, reach and activate the
custom color input (opening the native color chooser), and pick presets; Escape
still closes the popup and returns focus to the trigger; the popup's ARIA role
structure is valid (no disallowed children under a listbox role) and
`aria-haspopup` on the trigger matches the final popup role.

## Why it matters

WCAG 2.1.1 Keyboard (Level A) — choosing a custom quadrant color is currently
pointer-only functionality, a hard Level A failure. Secondary: 1.3.1 Info and
Relationships / 4.1.2 Name, Role, Value. ColorPicker is used in QuadrantGrid
headers (desktop), MobileQuadrantGrid zoomed toolbar, and DesignSystem.

## Discovery notes

Root cause is that `useMenuKeyboardNav` was designed for pure menus/listboxes;
the custom-color affordance was bolted into the popup without extending the
keyboard model or the ARIA structure. The hook's selector
(`'[role="menuitem"], [role="option"]'`) and its Tab-closes behavior are the two
mechanisms that lock the input out. If extending the hook ripples into other
consumers in awkward ways, consider routing a follow-up to the
refactor/architecture type rather than forcing it here.

## Recommendation

Either (a) make Tab move focus between the preset option grid and the custom
input while the popup is open (closing only on Escape / focus-out), and
restructure the ARIA so the popup is a dialog or group containing a listbox of
options plus the labeled input; or (b) give the custom input participation in
arrow navigation as an option. In either case: Escape must still close and
restore focus to the trigger, `aria-haspopup` on the trigger must match the
final popup role, and the existing fixes from A11Y-002/A11Y-009 (24x24 minimum
targets) must be preserved. Verify with a keyboard-only walkthrough: trigger ->
open -> arrow through presets -> reach custom input -> Enter/Space opens native
chooser -> Escape closes and restores focus.

## Related work

- A11Y-002 (trigger target size, commit bcf8713) — resolved, same component,
  target size only; did not address reachability
- A11Y-009 (custom input target size, commit 15547c6) — resolved, same
  component, target size only; did not address reachability
- Commit 090a3f2 (focus restore after preset selection)

## Working

- Chose option (a) from the ticket: dialog popup wrapping a listbox of presets +
  the labeled input. Option (b) (role="option" on the color input) was rejected
  — an option role on a native color input is its own ARIA violation and the
  invalid listbox-children problem would remain for the label/span.
- Did NOT extend useMenuKeyboardNav: Tab-closes is correct for its other
  consumers (Card move menu, Sidebar Actions menu — real menus). The picker gets
  a local handler (arrows cycle options, Tab toggles grid<->input, Escape
  closes/restores). No ripple into other consumers, so no follow-up refactor
  ticket needed.
- Native chooser activation on Enter/Space is browser-default behavior on a
  focused color input — nothing to wire.
- Tests: ARIA structure (dialog + listbox + 10 options, trigger
  haspopup=dialog), Tab to input and back, arrow cycling, Escape from both the
  grid and the input restoring trigger focus.
