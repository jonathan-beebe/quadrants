---
id: IMPRV-010
type: improvement
status: resolved
created: 2026-07-28
---

# IMPRV-010: present the framework builder in the shared modal

## Problem

The new-document flow renders FrameworkBuilder as a full screen swapped into
`<main>` (`App.tsx:219-226`). It already looks and feels like a modal, but it is
not officially one: its header row — the title and the Cancel exit — scrolls
away with the content in flow mode (`FrameworkBuilder.tsx:273, 275-283`), so on
short viewports the user loses both the context and the exit affordance while
scrolling the form.

## Goal

Creating or editing a framework happens in a modal whose title bar stays put
while the builder content scrolls beneath it.

## Outcome

Opening "new framework" (and editing an existing one) presents the builder
inside the shared modal component:

- the title ("Create Framework" / "Edit Framework") and close button remain
  visible at every scroll position; the builder content scrolls within the
  modal;
- the modal presents full screen on mobile and centered on large/wide screens;
- close, Escape, and Cancel dismiss it and return the user to the prior screen
  with focus restored;
- all existing builder capabilities — template picking including the mobile
  popover, validation, create and save — still work, with FrameworkBuilder tests
  passing after at most presentation-harness updates.

## Why it matters

This completes the batch's end state — a properly factored framework feature
displayable in a modal — and a persistent title plus always-reachable dismissal
serve the app's strict accessibility bar.

## Discovery notes

Advisory; use or discard. Depends on IMPRV-008 (extracted builder content) and
IMPRV-009 (the shared modal) — do those first. Watch four things: (a) the mobile
template popover is itself `role=dialog`, so it becomes a dialog opened inside a
modal — keep a single coherent focus owner (RFCTR-008's lesson); (b) BUG-003's
desktop full-height pinning was designed against `<main>`; inside a modal the
equivalent constraint is the modal's content area; (c) the sidebar toggle in the
builder header (`FrameworkBuilder.tsx:277`) has no role inside a modal — its
removal is part of the chrome swap; (d) today `showBuilder` replaces the current
screen — a modal naturally overlays it instead, which matches the stated intent;
the maker decides how `App.tsx` routing reflects that.

## Related work

- IMPRV-008 — extracts the builder content this ticket presents
- IMPRV-009 — the shared modal this ticket presents it in
- BUG-003 — full-height pinning constraint to re-evaluate in modal context
- BUG-017 — visible-viewport sizing history
- A11Y-005 — drawer focus-trap and Escape precedent
- A11Y-016 — template popover dialog semantics that must survive the move
- RFCTR-008 — single-owner focus lesson for nested dialog surfaces
- IMPRV-006 — EditModal precedent for modal-routed flows

## Working

- Re-validated: `FrameworkBuilder` was still a screen swapped into `<main>`
  (App.tsx), header scrolling away with content in flow mode.
- Tests first: `FrameworkBuilderModal.test.tsx` carries the full protected suite
  from the old `FrameworkBuilder.test.tsx` (template picking, mobile popover,
  DSGN-001 axes, IMPRV-005 arrow nav) plus the modal outcome — dialog titled
  Create/Edit Framework, title-bar close and Escape report onCancel, no sidebar
  toggle, `max-w-[860px]`, and the nested-dialog rule: Escape in the template
  popover closes only the popover.
- That last test exposed a real nested-dialog bug: the popover's Escape bubbled
  to the modal's trap and would have closed both. Fixed in `useFocusTrap` — an
  already-defaultPrevented Escape is ignored, so one press dismisses one
  surface.
- Built `FrameworkBuilderModal` (Modal + scroll-owner wrapper +
  FrameworkBuilderContent). Desktop create pins content height so the template
  list scrolls to the content area's bottom edge (BUG-003 re-anchored);
  edit/mobile scroll the whole form. Modal gained `maxWidthClassName` for the
  wide master-detail layout.
- App.tsx: the builder overlays the current screen instead of replacing it,
  rendered inside `<main>` so drawer modality still covers it; conflict keeps
  precedence. Opener captured at open time (`document.activeElement`) since the
  builder opens from sidebar, empty state, and canvas alike; Modal restores
  focus to it on close (A11Y-022). Deleted the obsolete `FrameworkBuilder`
  screen; sidebar-toggle chrome gone with it.
- App tests: BUG-013's builder-trigger test re-premised (the modal brings no
  sidebar trigger; the screen behind keeps the sole one); three submit clicks
  dialog-scoped because the empty state's CTA now stays in the DOM behind the
  modal. A failing submit had been leaking the BUG-010 storage spy into 27 later
  tests — scoping fixed the cascade.
- Verified in a real browser (Playwright headless, dev server): desktop create
  centered with the title bar fixed while the list scrolls; desktop edit
  centered over the dimmed canvas; mobile full screen. No console errors. Suite
  green at 486; tsc clean.
