---
id: A11Y-021
type: a11y
status: open
created: 2026-07-28
---

# A11Y-021: conflict dialog strands focus on body when dismissed

## Problem

`src/components/ConflictDialog.tsx:19-21` focuses the first action when the
dialog mounts, but nothing takes responsibility for focus when it unmounts. All
three exits — Replace local, Keep both, Cancel (`App.tsx:210-216`) — clear the
`conflict` state, which removes the dialog and the focused button with it,
leaving focus on `<body>`.

Unlike the sidebar drawer, this surface is raised by a share link arriving in
the URL (`useFrameworkSharing.ts:96-99`) rather than by a control the user
activated, so there is no opener to return focus to. The rest of the app is
`inert` while it is open (`App.tsx:162`), so `<body>` is also the only place
focus can be at that moment.

## Goal

Dismissing the import-conflict dialog leaves the user on the screen their choice
produced, rather than at the top of the document.

## Outcome

After choosing Replace local, Keep both, or Cancel, keyboard focus rests on the
content that choice produced rather than on `<body>`, so the next Tab continues
from there instead of restarting at the beginning of the page. A screen-reader
user is told what they landed on. All three dismissal paths are covered by
tests.

## Why it matters

WCAG 2.4.3 Focus Order (Level A). Focus on `<body>` means the next Tab starts
over from the top of the document, and for a screen-reader user the context they
just acted in disappears without announcement. This dialog is on the entry path
for every shared link, so it is frequently the first interaction someone has
with a framework another person shared with them.

## Discovery notes

Advisory — `/work-start` may use or discard.

- The app already has a landing target for this class of problem: `<main>` is
  `tabIndex={-1}` and exists precisely as the post-navigation focus spot
  (BUG-014), with `mainRef` now owned by `useDrawerModality` (RFCTR-008).
  Whether the conflict dialog should reuse that, or whether the revealed screen
  should claim focus itself, is open — the two differ in who owns the decision.
- This is the case the "Modal surfaces" section of `src/architecture.md` calls
  out: whatever owns the open state owns the focus move that follows from
  closing it. Here that is `App` (it owns `conflict`), not `ConflictDialog`.
- `ConflictDialog` is the only modal surface in the app with no backdrop; its
  focus trap comes from `useFocusTrap` (`ConflictDialog.tsx:23`) and is not in
  question.
- Existing coverage: FEAT-001's tests in `App.test.tsx` exercise all three
  actions for their data outcomes and assert nothing about focus. The inert
  assertion at `App.test.tsx:745` is the nearest neighbour.

## Related work

- RFCTR-008 — recorded the modal-surface focus rule in `src/architecture.md` and
  established the single-owner pattern this would follow
- BUG-014 — established `<main>` as the landing target after a surface that
  covered it goes away
- FEAT-001 — test coverage for the three conflict actions
- A11Y-005 — the drawer's focus contract, the closest existing precedent
- `work/0-research/mobile-drawer-focus-ownership-split-across-app-and-sidebar.md`
  — where this gap was found
