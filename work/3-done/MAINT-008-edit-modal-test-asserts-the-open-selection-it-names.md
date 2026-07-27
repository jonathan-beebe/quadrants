---
id: MAINT-008
type: maintenance
status: resolved
created: 2026-07-27
---

# MAINT-008: edit-modal test asserts the open-selection it names

## Problem

The test "opens with the current text, focused and selected so typing replaces
it" (src/**tests**/EditModal.test.tsx:20-25) asserts the field's value and focus
but never asserts selection — half the test's name and the behavior that makes
typing replace the text. The component does select the text on open
(src/components/EditModal.tsx:57-60, `textareaRef.current?.select()` in the
layout effect), so the behavior exists but is unprotected: deleting the
`select()` call leaves the whole suite green.

## Goal

The EditModal suite actually protects the select-all-on-open behavior its test
names, so the primary mobile flow (open modal, type to replace) cannot silently
regress.

## Outcome

When the modal's open-with-text-selected behavior is broken (verifiable by
temporarily removing the selection from the layout effect), the EditModal suite
fails; with the behavior intact, the suite is green. The test's name matches
what it asserts. No production code changes.

## Why it matters

A test that cannot fail for the behavior it names gives false confidence and
rots the suite's signal — the exact defect class MAINT-004 swept — and the
unguarded behavior is the primary mobile editing flow this component exists for
(RSRCH-002: open modal, keyboard up, type to replace). Violates the CLAUDE.md
principle "test what matters".

## Discovery notes

Advisory — `/work-start` may use or discard:

- Two candidate approaches: (a) assert full-text selection directly —
  selectionStart 0 and selectionEnd at value length on the textarea (jsdom
  supports both on textarea); (b) behavioral variant closer to user value — type
  a character into the freshly opened modal and assert the field's value was
  replaced, not appended.
- Follow MAINT-004's practice of mutation-verifying: temporarily remove the
  `select()` call and confirm the test fails.
- One-test change in src/**tests**/EditModal.test.tsx; no production code
  changes.

## Related work

- MAINT-004 — resolved; same defect class, swept before this suite existed
- Commit aa4e4c9 — introduced EditModal and its test suite
- RSRCH-002 — in 2-doing; the mobile-keyboard flow this behavior serves
- RFCTR-007 — in inbox; touches EditModal ids only, no overlap

## Working

Re-validated: the test asserted value and focus only, and the `select()` call in
the layout effect (EditModal.tsx:59) was unprotected.

Took approach (b) from the discovery notes — type into the freshly opened modal
and assert the text was replaced rather than appended. Preferred over asserting
`selectionStart`/`selectionEnd` because selection is the mechanism, not the
value: what matters is that a user typing on a phone does not end up having to
hand-delete the old text. The assertion also happens to cover focus, since
`user.keyboard` types wherever focus is.

Mutation-verified per MAINT-004's practice. With `textareaRef.current?.select()`
deleted, the test fails with exactly the defect it is meant to catch:

    Expected: Ship v3 release
    Received: Ship v3 releaseShip v2 release

Production file restored and confirmed clean by `git diff`. No production code
changes. Full suite green: 433 tests, 35 files.
