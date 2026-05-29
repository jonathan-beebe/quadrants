---
id: A11Y-005
type: a11y
status: open
created: 2026-05-29
---

# A11Y-005: mobile sidebar drawer focus and escape behavior

## Problem

On mobile, `src/components/Sidebar.tsx` renders a dimming backdrop and an
`<aside>` drawer that behaves like a modal, but: (1) opening does not move focus
into the drawer, (2) there is no Escape-key handler to close it, and (3) focus
is not trapped inside while open. The trigger to open lives in `QuadrantCanvas`/
`App`; after opening, focus remains on the trigger.

## Outcome

When the mobile drawer opens, focus moves into the drawer (e.g. to the close
button or the first nav item); Escape closes the drawer and restores focus to
the trigger that opened it; while open, Tab cycles within the drawer.

## Why it matters

WCAG 2.4.3 Focus Order (Level A), WCAG 2.1.1 Keyboard (Level A), and modal
dialog UX expectations. Screen reader and keyboard users currently have no
signal that the drawer opened, no way to escape it without searching for the
close button, and may tab into background content that is supposed to be hidden
behind the dim overlay.

## Discovery notes

The desktop sidebar is permanent (not modal); the modal behavior is only the
mobile case (`useIsMobile()` already exists). The `inert` attribute could hide
the main content from AT while the drawer is open on mobile.

## Recommendation

When `isMobile && open`: focus the close button on open (saving the previously
focused element), apply `useFocusTrap` to the `<aside>`, handle Escape to call
`onToggle()`, and apply `inert` to the `<main>` element. Restore focus to the
previous element on close.

## Related work

- `src/hooks/useFocusTrap.ts` already exists and is used by `ConflictDialog.tsx`
  and `ReflectionMode.tsx`.
