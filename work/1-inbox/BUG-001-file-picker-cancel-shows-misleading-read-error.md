---
id: BUG-001
type: bug
status: open
created: 2026-05-29
---

# BUG-001: file picker cancel via onchange-no-file shows misleading read error

## Problem

`pickJsonFile()` in `src/io.ts:11-30` has two divergent cancellation paths. The
modern `input.oncancel` handler resolves with null (correct — caller in
`src/hooks/useShareImport.ts:172` silently no-ops). The legacy fallback inside
`input.onchange` — entered when the browser fires change with no file (older
browsers, or some modern browsers depending on platform event ordering) —
instead rejects with `Error('No file selected')`. The caller's `.catch`
(`useShareImport.ts:181-184`) maps any rejection to the toast "The file could
not be read. Make sure it is valid JSON.", so cancelling the picker can surface
a misleading file-read error.

## Outcome

When the user opens the Import picker from the sidebar and cancels (Esc, Cancel
button, or otherwise closing the picker without selecting a file), no error
toast appears, regardless of whether the browser delivers the cancel via the
`cancel` event or via a `change` event with no file. A genuine read failure
(e.g. `FileReader.onerror`) still surfaces the existing error toast.

## Why it matters

Cancelling a file picker is a normal user action ("I changed my mind"), not an
error. Showing "The file could not be read. Make sure it is valid JSON." is
misleading and alarming, suggesting their file or the app is broken when nothing
went wrong. The bug also undoes the explicit intent established by commit
95b223d, which deliberately reclassified cancellation as a non-error.

## Discovery notes

`input.oncancel` is only available in Chromium 113+, Firefox 91+, Safari 16.4+.
Older browsers fire `change` with empty `files` instead, which is the path that
still rejects. Some modern browsers may also fire both events; in that case the
rejection from `onchange` races and can land first. Existing tests in
`src/__tests__/io.test.ts` cover (a) successful read and (b) `cancel` event, but
not the `change`-with-no-file legacy path — that path has no regression coverage
today.

## Recommendation

Replace `reject(new Error('No file selected'))` at `src/io.ts:19` with
`resolve(null)`. Both cancellation paths then converge on the same semantics and
the caller's existing `if (text === null) return` at `useShareImport.ts:172`
handles both silently. Extend `src/__tests__/io.test.ts` with a case that
dispatches `change` with no files and asserts the promise resolves to null, so
this regression cannot reappear silently.

## Related work

- commit 3faf51d — added `oncancel` handler that initially rejected
- commit 95b223d — reversed course: cancel now resolves null and caller silently
  no-ops; this is the policy the bug violates in the legacy fallback path
