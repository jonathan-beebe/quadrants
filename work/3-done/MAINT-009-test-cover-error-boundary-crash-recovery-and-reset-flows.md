---
id: MAINT-009
type: maintenance
status: resolved
created: 2026-07-28
---

# MAINT-009: test-cover error boundary crash recovery and reset flows

## Problem

ErrorBoundary (src/components/ErrorBoundary.tsx) is the app's crash-recovery
mechanism, mounted in two places — at the root around `<App>` (src/main.tsx:9)
and inside `<main>` wrapping QuadrantCanvas, keyed by `activeFramework.id` so
switching frameworks remounts a crashed boundary (src/App.tsx:231). No test in
`src/__tests__/` covers it: the default alert fallback (`role="alert"`, error
message, "Try again" button), the reset behavior (Try again re-rendering
children), the custom fallback-prop branch, and the App-level contract (a canvas
crash leaves the sidebar usable; switching frameworks recovers via the key
remount) are all unprotected against regression.

## Goal

The crash-recovery flow is protected by integration tests so a regression in the
app's systemic failure-recovery path fails the suite.

## Outcome

Running the test suite exercises and verifies:

1. When a child throws during render, an alert fallback appears showing the
   thrown error's message and a "Try again" button.
2. Activating "Try again" restores the children — with a child that no longer
   throws, normal content returns.
3. When a custom fallback is provided, it renders instead of the default alert.
4. At App level, a crash inside the active framework's canvas shows the fallback
   within `<main>` while the sidebar remains rendered and navigable.
5. Navigating to another framework replaces the fallback with that framework's
   working canvas.

A regression in any of these fails a test.

## Why it matters

The boundary is what keeps one corrupt or crashing framework from taking down
the whole app. Project principle "test what matters": protect end-to-end flows
and systemic regressions — this is the failure-recovery flow, and today any
regression (dropping the key, breaking reset, losing the alert role) would ship
silently.

## Discovery notes

Advisory; /work-start may use or discard. `src/test-setup.ts` fails any test
that emits `console.error`; both React's error-boundary logging and
`componentDidCatch` (ErrorBoundary.tsx:22-23) do — the tests need the documented
opt-out, `vi.spyOn(console, 'error')` (test-setup.ts:34-36). For the reset case,
a throw-once child (throws on first render, renders normally afterward) makes
"Try again" observably recover. Component-level cases fit a new
`src/__tests__/ErrorBoundary.test.tsx`; the App-level cases fit
`src/__tests__/App.test.tsx`, which already seeds localStorage with frameworks
(MAINT-003 precedent) — a canvas crash can be induced by mocking QuadrantCanvas
to throw for one framework, and the `key={activeFramework.id}` remount is then
observable by selecting another framework in the sidebar.

## Working

- Re-validated: ErrorBoundary still mounted at root (main.tsx) and around
  QuadrantCanvas keyed by `activeFramework.id` (App.tsx:231); no existing test
  touches it.
- Component cases in new `ErrorBoundary.test.tsx` (alert fallback + message
  - Try again; throw-once child recovery; custom fallback branch), using the
    documented `vi.spyOn(console, 'error')` opt-out.
- App cases in `App.test.tsx`: a pass-through mock of QuadrantCanvas throws only
  for a framework named 'Crashy Framework', so a crash is induced from seeded
  localStorage; asserts the alert renders inside `<main>` with the sidebar still
  usable, and that selecting the healthy framework replaces the fallback via the
  key remount.
- Mutation-verified: removing `key={activeFramework.id}` from App.tsx fails the
  recovery test (then restored). Suite: 501 passing.

## Related work

- MAINT-001 — integration-test-coverage ticket, same species
- MAINT-003 — integration-test-coverage ticket, same species
- FEAT-001 — integration-test-coverage ticket, same species
- Commit 291f702 — introduced the error boundaries
- Commit 663710d — BUG-017, last touched the fallback layout
