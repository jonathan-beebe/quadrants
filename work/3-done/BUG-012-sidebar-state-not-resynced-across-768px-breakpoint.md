---
id: BUG-012
type: bug
status: resolved
created: 2026-06-11
---

# BUG-012: sidebar open state not re-synced across 768px breakpoint causes spontaneous modal overlay and focus steal

## Problem

`src/App.tsx:27` initializes `sidebarOpen` with `useState(!isMobile)` —
`isMobile` is read once at mount and `sidebarOpen` never re-syncs when the
viewport crosses the 768px breakpoint, even though `useIsMobile`
(`src/hooks/useIsMobile.ts`) is a live matchMedia subscription that updates
reactively. Resizing desktop→mobile with the sidebar open (the desktop default)
flips `isModal` true in `src/components/Sidebar.tsx:51` with no user action: the
backdrop appears (`Sidebar.tsx:82`), the drawer overlays the content the user
was reading, `<main>` becomes inert (`App.tsx:149`), and the modal focus effect
(`Sidebar.tsx:58-66`) moves focus into the drawer's close button. Resizing
mobile→desktop with the drawer closed leaves the sidebar closed — inconsistent
with the fresh-load default of open-on-desktop.

## Outcome

With the sidebar open on desktop, narrowing the viewport below 768px leaves the
main content visible and interactive (not inert) with focus where the user had
it — no backdrop or drawer appears uninvited. Widening above 768px yields
sidebar behavior consistent with a fresh desktop load. Behavior at the boundary
crossing in both directions is covered by tests.

## Why it matters

Window resizing, tablet rotation, and browser zoom changes all cross the 768px
boundary in real use. Spontaneously stealing focus and making `<main>` inert
interrupts the user mid-task and is a keyboard/AT hazard: focus moves without
user action and the content they were using is removed from the accessibility
tree.

## Discovery notes

Advisory. Root cause is initialization-only state: `useState(!isMobile)`
captures the mount-time value. Reproduce by loading at >768px (sidebar open by
default), then dragging the window below 768px — overlay, inert main, and focus
steal occur with no interaction. The mobile→desktop-closed case is arguably
defensible on its own but is inconsistent with the fresh-load default. Existing
tests in `src/__tests__/Sidebar.test.tsx` and `App.test.tsx` cover open-time
modal behavior but not breakpoint transitions. Severity: minor (recoverable by
dismissing the drawer; only triggered on boundary crossing).

## Recommendation

Sync on breakpoint change — e.g. an effect (or equivalent) reacting to
`isMobile` transitions: entering mobile closes the drawer; entering desktop
restores it. Per-mode remembered open-state is an acceptable alternative if it
stays simple. Keep it minimal per the simplicity-first principle; start inquiry
at `src/App.tsx:27`.

## Related work

- A11Y-005 (introduced the mobile modal drawer behavior — focus trap, inert main
  — that this state desync now triggers spontaneously; its open-time
  focus/Escape behavior must be preserved)
- A11Y-004

## Working

- First tried the ticket's suggested effect-based sync; the test proved focus
  was still stolen for one commit (child passive effects of the stale commit run
  before the corrective re-render — true for both useEffect and
  useLayoutEffect). Landed the render-time derived-state adjustment
  (`prevIsMobile` state compared during render) so the inconsistent (mobile &&
  open) state is never committed at all.
- Both crossing directions covered by App-level tests using the floating "Open
  sidebar" button as the closed-state observable (the aside stays in the DOM
  when closed — only inert/translated — so its Close button is not a valid
  marker).
- A11Y-005's open-time modal behavior (focus trap, Escape) is untouched:
  user-initiated opens on mobile still go modal; existing Sidebar tests green.
