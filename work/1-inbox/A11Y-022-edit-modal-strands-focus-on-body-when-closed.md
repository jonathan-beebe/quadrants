---
id: A11Y-022
type: a11y
status: open
created: 2026-07-28
---

# A11Y-022: edit modal strands focus on body when closed

## Problem

`src/components/EditModal.tsx:53-56` focuses the textarea when the modal opens,
but nothing returns focus when it closes. Every exit — the close X
(`EditModal.tsx:83`), Delete (`:109`), Cancel (`:113`), and Save (`:116`) —
unmounts the modal while focus is inside it, leaving focus on `<body>`.

Unlike the conflict dialog, this surface is raised by a control the user
activated (`DesignSystem.tsx:338,347` at the only current call site), and that
control is still mounted after the modal closes, so there is somewhere specific
for focus to go.

Today the only consumer is the design-system demo (`DesignSystem.tsx:364`), so
the defect is not yet on a user-facing path. RSRCH-002 is expected to route
mobile item editing through this modal, at which point it is on the primary
mobile editing path.

## Goal

Closing the edit modal returns the user to the control they opened it from.

## Outcome

After Save, Cancel, the close X, or Delete, keyboard focus is back on the
control that opened the modal rather than on `<body>`, so the next Tab continues
from where the user left off. This holds for every exit path and is covered by
tests.

## Why it matters

WCAG 2.4.3 Focus Order (Level A). This is the newest modal surface in the
codebase and the one RSRCH-002 will put on the primary mobile item-editing path.
On touch with a screen reader, losing focus to `<body>` after every edit means
re-traversing the card list to reach the next item — a cost paid once per edit,
on the app's core interaction.

## Discovery notes

Advisory — `/work-start` may use or discard.

- Latent today, real after RSRCH-002. Cheaper to settle before that ticket wires
  the modal in than to retrofit onto a live editing path.
- The focus-on-open is a `useLayoutEffect` for a device reason — WebKit raises
  the on-screen keyboard only for a `focus()` taken during gesture processing
  (`EditModal.tsx:48-52`, measured under RSRCH-002). Whatever handles restore
  should leave that alone.
- `src/architecture.md` ("Modal surfaces", RFCTR-008) states which component
  owns this: whatever owns the open state. Here the opener and the open state
  already sit together in the parent, so the ownership question is much smaller
  than the drawer's was — this may be a genuinely small change.
- Worth deciding whether the restore belongs in `EditModal` or in its parent,
  given that the parent is currently a demo and the real consumer does not exist
  yet. Committing to a contract now shapes what RSRCH-002 has to wire.
- Existing coverage: `EditModal.test.tsx` and `DesignSystemEditModal.test.tsx`
  (the latter touched recently by MAINT-008). Neither asserts focus after close.

## Related work

- RFCTR-008 — recorded the modal-surface focus rule in `src/architecture.md`
- RSRCH-002 — will route mobile item editing through this modal, making this
  user-facing
- MAINT-008 — most recent work on the design-system demo's tests
- A11Y-005 — the drawer's focus contract, the closest existing precedent for
  restore-to-opener
- `work/0-research/mobile-drawer-focus-ownership-split-across-app-and-sidebar.md`
  — where this gap was found
