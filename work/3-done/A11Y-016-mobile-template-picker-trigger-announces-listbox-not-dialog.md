---
id: A11Y-016
type: a11y
status: resolved
created: 2026-06-11
---

# A11Y-016: mobile template picker trigger announces listbox but opens dialog

## Problem

In src/components/FrameworkBuilder.tsx (create mode on mobile, useIsMobile
max-width 768px), the template-picker trigger button (lines 247-259) declares
`aria-haspopup="listbox"`, but the panel it opens (lines 260-269) is
`role="dialog"` aria-label="Choose a template" containing a filter
`<input type="search">` and plain template `<button>`s (selection conveyed via
aria-current, no role="option"). The popup type exposed to assistive technology
does not match the actual popup role, violating WCAG 2.2 SC 4.1.2 Name, Role,
Value (Level A): per the ARIA spec, `aria-haspopup="listbox"` is only correct
when the popup is role="listbox". Additionally within the same surface: the
dialog lacks aria-modal, and the click-outside dismiss path (useClickOutside ->
setListOpen(false), line 78) does not restore focus to the trigger, unlike the
Escape path (closeList, lines 73-76).

## Outcome

On mobile create mode, the popup type announced on the trigger matches the role
of the panel that actually opens (AT users are told a dialog will open and a
dialog opens); the open/closed state remains programmatically exposed via
aria-expanded; dismissing the panel by any path (Escape, click outside, picking
a template) leaves keyboard focus in a sensible, consistent place — the trigger.
Verified by FrameworkBuilder tests asserting the trigger's declared popup type
equals the panel's role and that focus returns to the trigger across dismiss
paths; all existing FrameworkBuilder tests stay green.

## Why it matters

The template chooser is the main entry point of the create-framework flow on
mobile. Screen-reader users told a listbox will open expect arrow-key option
selection; instead they encounter a dialog with a text field and buttons,
breaking their interaction model at the start of the core creation flow (Level A
violation).

## Discovery notes

The panel is a positioned popover using useFocusTrap (Escape closes and restores
focus via closeList); behavior is largely fine — only the declared popup type is
wrong, plus the two secondary gaps noted (missing aria-modal, click-outside path
skipping focus restore). Root cause is the IMPRV-002 redesign from a
listbox-style dropdown to a dialog-style filtering panel.

## Recommendation

Change the trigger to `aria-haspopup="dialog"` to match the role="dialog" panel
— the minimal, correct fix. Optionally add aria-modal where accurate, and align
the click-outside dismiss path with the Escape path by routing it through
closeList so focus returns to the trigger. Passing measurement: trigger's
aria-haspopup value === panel's role; aria-expanded reflects open state; focus
lands on the trigger after each dismiss path; existing FrameworkBuilder tests
green.

## Related work

- IMPRV-002 (picker redesign, commit 4f9aeb3 — root cause: panel became a dialog
  but trigger semantics weren't updated)
- BUG-003 (work/1-inbox, same component, unrelated layout criterion)
- A11Y-015 (work/1-inbox, same SC 4.1.2 concern on a different component,
  Card.tsx)

## Working

- Minimal fix as recommended: aria-haspopup="dialog" + both secondary gaps
  (aria-modal, click-outside via closeList).
- aria-modal judged accurate: useFocusTrap already confines focus to the panel,
  so telling AT to ignore the background matches real behavior.
- Test note: the click-outside focus assertion fires the dismissal mousedown
  directly — a full userEvent.click would then apply the browser's own
  click-target focus default (jsdom: body), which is expected pointer behavior,
  not a dismissal-path defect. The guarantee under test is that focus is never
  stranded in the unmounted dialog.
- The trigger-toggle path (BUG-005's excludeRef) is unaffected: trigger presses
  never reach the click-outside handler.
