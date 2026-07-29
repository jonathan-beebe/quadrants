---
id: RFCTR-020
type: refactor
status: resolved
created: 2026-07-29
---

# RFCTR-020: unify modal chrome shared by Modal and EditModal

## Problem

`src/components/EditModal.tsx` repeats two blocks of `src/components/Modal.tsx`
— the component whose own docstring names it "the shared modal chrome
(IMPRV-009)":

1. The title bar (`EditModal.tsx:106-113` ≡ `Modal.tsx:69-76`) —
   character-identical `h2` + icon close-button block.
2. The focus-restore-on-unmount effect (`EditModal.tsx:80-83` ≡
   `Modal.tsx:45-48`) — identical down to the comment and the eslint-disable
   line.

Scope guard: this is chrome-level dedup only. It is NOT the shared modal-surface
contract — `src/architecture.md`'s RFCTR-008 re-open trigger ("ConflictDialog
and EditModal grow focus restore and all three turn out alike") has not fired;
ConflictDialog still delegates its dismissal focus to `useFrameworkSharing`
(A11Y-021).

## Goal

The modal chrome that is meant to be shared is actually shared.

## Outcome

The title bar and the focus-restore behavior each exist once; EditModal's
deliberate divergences — top-aligned presentation, visual-viewport height clamp,
glass styling, layout-effect focus (all documented in its header comment) —
remain intact. The A11Y-022 focus-restore tests and the edit-modal flow tests
pass unmodified.

The new shared component is well tested, and its various modes and options are
demoed in the design system.

## Why it matters

Verbatim chrome copies drift — close-button labeling, heading semantics, and the
focus-restore subtlety ("read at cleanup time, not captured on mount") are each
one divergent edit away from an accessibility regression that IMPRV-009 was
filed to prevent.

## Discovery notes

(advisory) The divergences live in the frame (positioning, sizing, styling), not
the chrome (title bar, focus restore) — a small shared header piece plus a
shared restore mechanism is likely enough; full composition of EditModal on
Modal is not required to close this and may fight the RSRCH-002 constraints.

## Related work

- IMPRV-009 — introduced Modal as the shared chrome
- A11Y-022 — the focus-restore contract both copies implement
- RFCTR-008 — the modality decision this ticket deliberately does not reopen

## Working

Re-validated: both copies were still character-identical, eslint-disable line
included.

Two extractions, matching the discovery note's shape — a small shared header
piece plus a shared restore mechanism, with no composition of EditModal on
Modal:

- `src/components/ModalTitleBar.tsx` — the title bar. A separate module rather
  than an export from `Modal.tsx`, so neither modal depends on the other and the
  piece can be demoed on its own.
- `src/hooks/useRestoreFocusOnUnmount.ts` — the focus restore, including the
  eslint-disable and the reason it is there. A view-ring hook per ARCH-002:
  per-instance, holds nothing another component could want.

The scope guard held: this touched chrome only. RFCTR-008's re-open trigger
still has not fired — `ConflictDialog` still delegates its dismissal focus to
`useFrameworkSharing` (A11Y-021) and was not touched.

EditModal's divergences are all intact: top-aligned presentation, the
`--visual-viewport-height` clamp, glass styling, and the layout-effect focus.
Its header comment is unchanged.

One consolidation beyond the two blocks: both `openerRef` prop docs restated the
mechanism the new hook now documents, so each was trimmed to what its own caller
needs — EditModal's notes why the prop is required there and Modal's is not.

Tests: `ModalTitleBar` (4) and `useRestoreFocusOnUnmount` (3), written failing
first. The hook test pins the subtle part — the ref is read at cleanup time, so
a host that re-points it mid-life is honoured. The A11Y-022 focus-restore tests
and the edit-modal flow tests passed unmodified, as the ticket required. Both
title-bar modes demoed in the design system. 574 passed; tsc and eslint clean.
