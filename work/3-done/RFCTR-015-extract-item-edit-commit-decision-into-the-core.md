---
id: RFCTR-015
type: refactor
status: abandoned
created: 2026-07-29
---

# RFCTR-015: extract item-edit commit decision into the core

## Problem

The domain decision "what happens to an item when an edit commits" is
implemented twice, once per editing surface:

1. `src/components/Card.tsx:182-191` — `commitEdit` (inline textarea path):
   empty or placeholder text → delete; unchanged text → no update; otherwise →
   update.
2. `src/components/QuadrantCanvas.tsx:143-162` — `handleModalSave` (edit-modal
   path): empty → delete, otherwise → update, with the comment "Saving an item
   empty deletes it, mirroring the inline commit" admitting the two are meant to
   be one rule.

They have already drifted: the inline path treats `PLACEHOLDER` text as a delete
and skips the update when text is unchanged; the modal path does neither, so an
unchanged modal save still commits a history entry.

## Goal

One pure rule decides an item-edit commit's fate; both editing surfaces delegate
to it.

## Outcome

The commit decision exists once under `src/logic/`, unit-tested, and both
surfaces produce identical outcomes for the same input: empty → delete,
placeholder → delete, unchanged → no state change (no undo entry), new text →
update. The existing edit-flow tests pass, adjusted only where they pinned the
drifted modal behavior.

## Why it matters

An `if` about whether a domain object continues to exist is exactly what
`src/architecture.md` sends to the core. Two copies of the rule drift silently —
they already have — and every future editing surface (or fix to this rule)
multiplies the divergence.

## Discovery notes

(advisory) Same species as IMPRV-001's `resolveImportAction`: a pure function
from (existing text, submitted draft) to a discriminated decision (delete / keep
/ update-with-text) that both callers switch on. BUG-004 defines why placeholder
text deletes on the inline path — aligning the modal path to that rule is the
intended direction of travel, not the reverse.

## Related work

- IMPRV-001 — extracted the share-import decision the same way
- BUG-004 — source of the placeholder-cleanup rule
- RSRCH-002 / A11Y-022 — why two editing surfaces exist at all
