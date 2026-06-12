---
id: BUG-010
type: bug
status: resolved
created: 2026-06-11
---

# BUG-010: silent localStorage save failure loses data with no user feedback

## Problem

localStorage save failures are silently swallowed. `src/storage.ts:26-34`
`saveFrameworks` catches storage exceptions (e.g. QuotaExceededError) and
returns `false`, but the only production caller — the persistence effect at
`src/hooks/useFrameworks.ts:16-18` — discards the return value, and no other
caller in src consumes it. When a save fails, every edit appears to succeed in
the UI but is never persisted.

## Outcome

When persisting frameworks to localStorage fails, the user sees a visible error
message telling them their changes could not be saved; when saves succeed, no
such message appears. The failure path is covered by an integration test.

## Why it matters

User-visible data loss with zero indication: if quota is exceeded (large
frameworks/many items), all changes since the last successful save vanish on
reload. Trust in a PWA whose whole job is persisting the user's frameworks
depends on saves being honest.

## Discovery notes

Advisory — /work-start may use or discard:

- The `false` return path is already unit-tested
  (`src/__tests__/storage.test.ts:94-121`) yet is dead code in production — the
  signal exists end-to-end except for the last hop.
- The app already renders a `Toast` from App (`src/App.tsx:176`) driven by
  `useShareImport`'s error state, an existing precedent for transient error
  surfacing.

## Recommendation

Start at the persistence effect in `useFrameworks.ts:16-18` — consume
`saveFrameworks`' return value and surface failure state up to App, reusing the
existing Toast pattern. Keep it simple: inform the user; no retry queues or
complex recovery. Cover with an integration test that mocks
`Storage.prototype.setItem` to throw (as `storage.test.ts` already does) and
asserts the message appears after an edit.

## Related work

- BUG-002 — precedent for surfacing a silently-failing operation (share now
  returns an outcome and falls back when clipboard fails)
- IMPRV-003 (work/1-inbox) — extracts pure validation from the same storage
  shell; adjacent but distinct concern
- A11Y-012 (work/1-inbox) — error-toast contrast; touches the same Toast surface

## Working

- Followed the ticket: kept it simple — consume the boolean, surface via the
  existing Toast; no retry queues. The error clears itself when a subsequent
  save succeeds (setSaveError(null) on success is a no-op bailout when already
  null, so no render loop).
- Judgment call: share-import errors take precedence over the save error in the
  single Toast slot (two stacked fixed toasts would overlap; the save error
  reappears on the next failing save anyway).
- Integration test in App.test.tsx mocks Storage.prototype.setItem to throw
  QuotaExceededError and spies console.error (saveFrameworks logs it; the
  test-setup fails tests on unspied console.error).
