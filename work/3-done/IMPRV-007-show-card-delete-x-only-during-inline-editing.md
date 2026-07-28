---
id: IMPRV-007
type: improvement
status: resolved
created: 2026-07-28
resolved: 2026-07-28
---

# IMPRV-007: show card delete X only during inline editing

## Problem

Every card on the canvas renders a floating delete X
(`src/components/Card.tsx:312-319`) that is revealed on hover/focus and is
permanently visible on coarse-pointer devices
(`[@media(pointer:coarse)]:opacity-100`, added by A11Y-003). Since IMPRV-006
routed on-screen-keyboard devices' editing through EditModal — which has its own
Delete button (`src/components/EditModal.tsx:136-137`) — the always-visible X on
those devices is redundant clutter, and on desktop the X appears merely on hover
even when the user has no deletion intent.

## Goal

The canvas shows no delete affordance until the user is actually editing;
deletion lives where editing lives.

## Outcome

On devices that edit inline (no on-screen keyboard expected), the X on a card is
visible only while that card's inline textarea editing is active — hovering or
focusing a non-editing card no longer reveals an X. On devices routed through
EditModal, no X ever appears on any card; deletion happens via the modal's
Delete button. A keyboard-only user retains a working way to delete an item. The
full test suite is green, including the existing deletion coverage in
`Card.test.tsx` and `QuadrantCanvas.test.tsx` updated to the new visibility
rules.

## Why it matters

Reduces visual noise on the canvas (the X sits atop every card on touch devices
today) and removes a redundant interactive descendant from mobile cards — the
thinning A11Y-001/IMPRV-006 anticipated. Deletion intent almost always coincides
with editing intent; surfacing the control only then matches the interaction
model.

## Discovery notes

Advisory. Modal-routed devices never set Card's `editing` state —
`enterEditMode` (`Card.tsx:126-137`) returns early into `onRequestEdit` — so
gating the X's render on `editing` alone likely yields both halves of the
outcome with no media query; the A11Y-003 coarse-pointer opacity rule would go
away with it. Keyboard-only deletion on the inline path already exists without
the X: committing an emptied textarea deletes the item (`commitEdit`,
`Card.tsx:184-188`). Watch one hazard: clicking the X while editing races the
textarea's blur-commit (`handleBlur`, `Card.tsx:253-259`) — the commit flips
`editing` off, which could unmount the X before its click lands; ensure the
delete still completes.

## Related work

- IMPRV-006 — forecast this exact removal as follow-up; commit 9169019
- A11Y-003 — made the X touch-visible; its outcome is superseded on modal-routed
  devices by the modal's Delete
- A11Y-001 — interactive-descendant thinning
- BUG-004 — empty-commit deletion path
- A11Y-022 / aa468c4 — modal focus-return contract

## Working

- Re-validated: the X at `Card.tsx:312-319` still carried the A11Y-003
  always-visible-on-coarse-pointer rule, and `EditModal` still owns Delete on
  the modal path.
- TDD: wrote the new-behavior tests first (no X in display mode; X appears while
  editing inline; mid-edit delete does not also blur-commit typed text; no X
  ever when `onRequestEdit` routes to the modal) and watched the three
  new-behavior ones fail red before changing the component.
- Change: the X now renders only while `editing` is true. Because modal-routed
  devices never enter `editing` (`enterEditMode` short-circuits into
  `onRequestEdit`), that single gate covers both halves of the outcome — the
  discovery-note prediction held, no media query needed; the A11Y-003
  opacity-reveal rules went away with it.
- The blur-commit race was real and is handled: the X's pointerdown now calls
  `preventDefault()` so focus stays in the textarea — without it the blur-commit
  flips `editing` off and unmounts the button before its click lands (the
  mid-edit test fails exactly that way if the guard is removed).
- Keyboard-only deletion is preserved via the empty-commit path (`commitEdit`),
  covered by existing tests; the modal path keeps its Delete button per
  IMPRV-006's tests.
- Updated the callers that used the always-visible X as test setup:
  `QuadrantCanvas.test.tsx` (deletion announcement) and seven sites in
  `App.test.tsx` undo/redo tests, now routed through a `deleteItem` helper that
  enters edit mode first.
- Full suite green: 38 files / 465 tests (net +3).
