---
id: BUG-008
type: bug
status: resolved
created: 2026-06-11
---

# BUG-008: lastHash guard blocks re-importing same share link in session

## Problem

In `src/hooks/useShareImport.ts`, `importFromHash` (line 49) guards with
`if (!hash || hash === lastHash.current) return` and sets
`lastHash.current = hash` (line 50), but `lastHash` is never reset after the
import resolves. Within a single session, re-activating the exact same share
link is silently ignored: open a share link → import succeeds and the hash is
cleared → delete the imported framework (Sidebar → Actions → Delete) → click the
same link again in the same tab. The URL gains the `#hash`, `hashchange` fires,
`importFromHash` bails on the `lastHash` check — nothing imports, no error is
shown, and because the early return happens before the `replacePath(null)` at
line 56, the dead hash stays in the URL. A manual refresh then _does_ import
(fresh mount resets `lastHash`), making behavior inconsistent. The same silent
no-op hits a user who cancels the conflict dialog and later clicks the identical
link again.

## Outcome

After a share-link import has fully resolved (framework added, navigated to an
existing match, conflict dialog resolved or cancelled, or decode failed),
activating the exact same share link again in the same tab triggers the import
flow again — the user sees the framework imported (or the conflict dialog)
rather than nothing — and the URL hash never lingers after the hook has handled
(or ignored) it. The BUG-020 protection is preserved: a refresh or remount
during the async decode window still does not duplicate the import (regression
test `src/__tests__/hooks/useShareImportHashCleanup.test.ts` stays green).

## Why it matters

Share links are the app's primary collaboration path. A link that works once and
then silently does nothing — while leaving a stale `#hash` in the URL — reads as
data loss ("the link is broken") and is inconsistent: refreshing makes the same
link work again. Silent failure with no feedback also violates the app's
error-surfacing pattern (`showError` is used for every other import failure).

## Discovery notes

Advisory — the BUG-020 fix may have made `lastHash` redundant: the synchronous
`replacePath(null)` (`src/logic/routing.ts:26-29`, `history.replaceState` with a
hash-free URL) removes the fragment before any async gap, so any re-entry within
the same mount already bails on `!hash`. The original purpose of `lastHash`
(commit 4d59a9e) predates that fix. Note `replaceState` does not fire
`hashchange`, so clearing the hash this way cannot re-trigger the listener.

## Recommendation

Start in `importFromHash` (`src/hooks/useShareImport.ts:47-103`). Either remove
`lastHash` entirely (verify the BUG-020 regression test still passes — the
synchronous hash-clear already de-dupes remount re-entry) or clear
`lastHash.current` once the import resolves in every terminal branch (add /
navigate / conflict-resolution handlers / decode-error / invalid-payload).
Removal is the simpler end state if tests confirm it's safe. Add a regression
test (pattern: existing hook tests in
`src/__tests__/hooks/useShareImport*.test.ts`) that drives the same hash through
the hook twice with a resolution in between and asserts the second activation
imports.

## Related work

- 4d59a9e — introduced `lastHash` with the `hashchange` listener
- 8d36028 — BUG-020 fix: synchronous `replacePath(null)` before async decode
- 7966c94 — BUG-027 conflict freshness
- FEAT-001 — share-import conflict dialog action coverage
- IMPRV-001 — extracted pure `resolveImportAction`
- IMPRV-004 (inbox) — adjacent but distinct: sharing codec extraction

## Working

- Took the ticket's "simpler end state": removed `lastHash` entirely rather than
  resetting it per terminal branch. The BUG-020 synchronous `replacePath(null)`
  covers same-mount re-entry (`!hash` bails), and `history.replaceState` cannot
  fire `hashchange`, so no loop is possible.
- Regression test (`useShareImportReimport.test.ts`) drives the same hash
  through the hook twice with full resolution in between; verified it FAILS
  against the pre-fix hook (stash check) and passes after.
- BUG-020 regression test (`useShareImportHashCleanup.test.ts`) stays green, as
  required.
- Commit: see journal.
