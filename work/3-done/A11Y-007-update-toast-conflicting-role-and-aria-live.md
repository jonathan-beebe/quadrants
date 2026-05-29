---
id: A11Y-007
type: a11y
status: resolved
created: 2026-05-29
resolved: 2026-05-29
---

# A11Y-007: UpdateToast conflicting role and aria-live

## Problem

In `src/components/UpdateToast.tsx:13-16` (`UpdateToastView`), the wrapper has
both `role="alert"` and `aria-live="polite"`. `role="alert"` carries an implicit
`aria-live="assertive"`; pairing it with an explicit `polite` produces
conflicting hints. Different assistive technologies may either silently drop
one, double-announce, or fail to announce.

## Outcome

The element exposes a single live-region politeness level (either
alert/assertive or polite/status — not both), and is announced once when it
appears.

## Why it matters

WCAG 4.1.2 Name, Role, Value (Level A). Conflicting role/aria-live combinations
are an authoring error that produces inconsistent screen reader behavior; for a
"new version is available" toast, that may mean users miss the notification
entirely.

## Discovery notes

For an unobtrusive informational toast, `role="status"` (implies polite) is more
appropriate than `role="alert"` (implies assertive). The accompanying `<Toast>`
(`src/components/Toast.tsx`) correctly uses `role="alert"` alone for an error
message.

## Recommendation

Drop the explicit `aria-live="polite"` and switch the role to `role="status"`,
or keep `role="alert"` without the explicit `aria-live`. Choose based on whether
the update toast should interrupt (assertive) or wait (polite); the current
intent appears to be polite.

## Working

- Swapped `role="alert" aria-live="polite"` for `role="status"` in
  `UpdateToast.tsx`. `role="status"` carries an implicit `aria-live="polite"`,
  which matches the intent (a non-interrupting "new version" notice) and avoids
  the conflicting live-region hints.
