---
id: FEAT-001
type: feature
status: open
created: 2026-05-29
---

# FEAT-001: test: cover share-import conflict dialog Replace, Keep both, and Cancel actions

## Problem

src/**tests**/App.test.tsx covers the appearance of the share-import
ConflictDialog (lines 146-198) and the inert-skip-link a11y attribute, but never
exercises the three dialog actions wired in src/hooks/useShareImport.ts:110-143
— handleConflictReplace, handleConflictDuplicate, and handleConflictCancel —
through the rendered UI. The only handler-level coverage is the unit test
src/**tests**/hooks/useShareImportConflictFreshness.test.ts, which exercises the
BUG-027 freshness check on handleConflictReplace in isolation and does not
verify that the dialog buttons in ConflictDialog.tsx are wired to the right
handlers in App.tsx (App.tsx:156-163).

## Outcome

Running the App test suite exercises the rendered conflict dialog end-to-end for
each of the three resolutions: (1) choosing "Replace local" leaves the existing
framework id as the active framework with the incoming content persisted to
localStorage and the dialog dismissed; (2) choosing "Keep both" leaves two
frameworks in storage with the duplicate active and the dialog dismissed; (3)
choosing "Cancel" leaves the existing framework unchanged and active, the URL
hash cleared, and the dialog dismissed. Each test fails if its handler is
unwired, no-ops, or wired to the wrong action.

## Why it matters

These three handlers gate the highest-impact user actions in the import flow. A
regression in handleConflictReplace can silently overwrite the wrong framework;
a regression in handleConflictDuplicate can fail to create the duplicate while
appearing to succeed; a regression in handleConflictCancel can leave the URL
hash dirty and re-trigger the dialog on refresh (the BUG-020 family). The
current suite would not catch any of these — it only checks that the dialog
renders. Integration coverage on this surface is the cheapest hedge against
data-loss regressions in the share-import path.

## Discovery notes

- The three new tests can live in the existing `describe('hash import', ...)`
  block in src/**tests**/App.test.tsx, after the existing
  `'shows conflict dialog when hash has same ID but different content'` test
  which already sets up the conflict precondition and can be used as a template.
- ConflictDialog.tsx (lines 43-49) renders the three actions as Buttons with the
  visible text "Cancel", "Keep both", and "Replace local". Querying by role:
  'button' + accessible name should be sufficient — no aria-label change is
  required.
- For the Cancel test, the URL-hash assertion is the regression guard against
  the BUG-020 family; checking `window.location.hash === ''` (or no leading
  `#...` payload) after click is the observable signal.
- For the Keep-both test, the duplicate's "(imported)" suffix is the existing
  convention surfaced by addImport in useShareImport.ts; the sidebar listing two
  frameworks is the observable signal that doesn't depend on internal naming
  details.
- A small fixture helper for "set up
  existing-framework-with-id-X-and-conflicting-hash-payload-for-id-X" may reduce
  duplication across the three tests; whether to extract it is a judgment call
  at implementation time.
- There is no `test` type in the work-write type registry; filing as `feature`
  with a `test:` prefix on the title per the reporter's hint. The `feature` type
  forbids RECOMMENDATION, so directional suggestions are kept here as advisory.

## Related work

- BUG-001 (inbox) — file picker cancel in useShareImport.ts (adjacent code,
  different concern)
- BUG-002 (inbox) — share-button toast in useShareImport.ts (adjacent code,
  different concern)
- commit 7966c94 — BUG-027 freshness check inside handleConflictReplace (the
  existing unit-level coverage)
- commit 8d36028 — BUG-020 synchronous hash-clear on share-import start (the
  regression class the Cancel test should guard against)
- commit 3040e32 — initial integration tests for hash-based share import (the
  file these new tests extend)
- commits 088a559, da74a5f, f9ec0e0, 59d3f2f — prior ConflictDialog a11y work
  (buttons already have stable visible labels "Cancel", "Keep both", "Replace
  local"; no aria-label change needed)
