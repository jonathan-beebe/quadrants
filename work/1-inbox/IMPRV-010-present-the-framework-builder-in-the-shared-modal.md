---
id: IMPRV-010
type: improvement
status: open
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
