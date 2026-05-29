---
id: BUG-002
type: bug
status: open
created: 2026-05-29
---

# BUG-002: share button reports "Link copied!" even when clipboard write skipped or failed

## Problem

In `src/hooks/useShareImport.ts` (lines 145-161), `share()` silently swallows
two clipboard-write failure modes — (1) `navigator.clipboard` / `writeText`
absent (insecure context, sandboxed iframe) and (2) `writeText` rejecting
(NotAllowedError, Permissions-Policy, unfocused page) — and returns the URL in
both success and failure cases. The caller `handleShare` in
`src/components/QuadrantCanvas.tsx` (lines 136-146) treats "no throw" as success
and sets `shareStatus = 'copied'`, so the aria-live region renders "Link
copied!" even when nothing was written to the clipboard. The user believes the
link was copied, pastes, and gets stale or unrelated content (or nothing).

## Outcome

After pressing Share, the user only sees a "Link copied!" confirmation when the
link is actually on the clipboard. In environments where the automatic clipboard
write does not happen or fails, the user is shown the share URL in a form they
can copy manually (e.g. selectable text and/or an explicit copy control), and
the affordance is announced to assistive technology.

## Why it matters

A false-positive "Link copied!" erodes trust — users send empty/stale clipboard
contents believing they shared their framework. Disproportionately affects
mobile-web Safari (writeText sometimes rejects outside a direct user gesture),
iframe embeds, and any HTTP deployment. This bug is the residual half of BUG-025
(commit f8ebfd8), which correctly preserved the URL on failure but did not
preserve the success/failure signal.

## Discovery notes

Two repros produce the false "Link copied!":

1. Insecure-context / clipboard API absent — inner block is skipped, no error
   thrown, status reports success.
2. `writeText` rejects (NotAllowedError, permission policy, unfocused page) —
   empty `catch` swallows it, status reports success.

Existing share/import error-surfacing path (`showError` in `useShareImport`) is
unrelated — it handles decode/import errors, not copy outcome. A reusable
accessible dialog pattern exists at `src/components/ConflictDialog.tsx`
(`role="dialog"`, `aria-modal="true"`) that the fallback UI could model itself
on. Existing test `src/__tests__/hooks/useShareImportShare.test.ts` already
exercises clipboard-failure paths and would need updating once the contract
changes.

## Recommendation

Two viable directions; pick one at `/work-start` time:

- **(a)** Change `share`'s return type to convey copy outcome (e.g.
  `{ url: string, copied: boolean }`), then in `handleShare`, only set
  `shareStatus = 'copied'` when `copied` is true; otherwise enter a new
  "fallback" state that renders the URL in a copyable affordance (selectable
  text with a manual Copy button inside the existing button row or a small
  popover/dialog).
- **(b)** Keep `share` returning `string` and introduce a sibling signal (state
  or callback) for copy outcome.

Either path requires UI work; the fallback affordance is in scope and should be
designed to be accessible (focus management if it's a dialog, aria-live
announcement, target-size compliant — consistent with the A11Y tickets already
in inbox). Update `src/__tests__/hooks/useShareImportShare.test.ts` and add a
QuadrantCanvas test that asserts the "Link copied!" message is not shown when
the clipboard write was skipped or rejected.

## Related work

- commit f8ebfd8 (BUG-025: guard clipboard in share, still return URL on
  failure)
- commit f16e4b6 (clear share status timer on unmount)
- commit e63928b / 1fc28ff (surface share/import errors to users)
- commit 7966c94 (BUG-027: refresh existing snapshot for share-import conflict
  replace)
