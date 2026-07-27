---
id: MAINT-007
type: maintenance
status: resolved
created: 2026-07-27
---

# MAINT-007: reset detaches on-screen-keyboard observation listeners in tests

## Problem

In `src/hooks/useExpectsOnScreenKeyboard.ts`, `install()` (lines 82-113)
registers a `resize` listener on `window.visualViewport` and a `focusin`
listener on `document`, guarded by the module-level `installed` flag with no
teardown path — intentional in production — but the test-only
`resetOnScreenKeyboardObservation()` (lines 172-178) sets `installed = false`
WITHOUT removing those listeners. Every test in
`src/__tests__/hooks/useExpectsOnScreenKeyboard.test.ts` that subscribes re-runs
`install()`, stacking a fresh listener pair on the shared jsdom document, each
closing over that test's stubbed visualViewport. Stale `focusin` listeners from
earlier tests still fire on later tests' focus events and compute
`keyboardHeight` from detached stub viewports with stale heights.

## Goal

Every test in the observation suite starts from zero attached observation
listeners and no stale viewport closures, so verdicts are deterministic rather
than an accident of listener ordering.

## Outcome

After `resetOnScreenKeyboardObservation()` runs, focusing an editable field
records no observation and fires no stale-viewport computation — each test's
observed verdict derives only from that test's own stubbed viewport, and the
suite stays green under test reordering. The suite gains a guard proving reset
actually detaches (e.g. a focus after reset records nothing). Production
behavior is unchanged: install-once, never uninstalled at runtime. Full suite
green.

## Why it matters

The suite currently passes only by accident — all stacked listeners share the
module-level `pendingTimer`, and each successive listener clears the previous
one's timer, so the last-installed listener happens to win. That is a fragile
invariant, not a design: reordering listener registration or adding a second
timer would make tests cross-pollute nondeterministically, eroding trust in the
detection suite that gates the EditModal (65acd74).

## Discovery notes

Advisory. One shape that fits: `install()` stores an uninstall closure (removing
both listeners) in module state, and `resetOnScreenKeyboardObservation()`
invokes it before clearing the flags — no production caller ever uninstalls.
Note `install()` returns early when `window.visualViewport` is absent, so reset
must tolerate a never- or partially-installed state. For the guard test: after
reset with no subscriber, focus an editable field, advance timers past
`SETTLE_MS`, and assert nothing was recorded (`observed` stays null on a fresh
render, or a notify spy stays silent). Small hygiene fix confined to the hook
module's test seam and its tests.

## Related work

- MAINT-006 — open, in 1-inbox; same test file (matchMedia fake); compatible in
  either order
- RFCTR-006 — open, in 1-inbox; same hook file; keeps the observation machinery
  in the shell, so this teardown fix stays valid after it lands
- MAINT-004 — precedent for behavioral test hygiene
- RSRCH-002 — in 2-doing; source of the detection design
- aa4e4c9, 65acd74, f3f67cf — commits that introduced the code under review

## Working

Re-validated, and the guard test pinned the defect precisely before the fix: it
failed with `expected false to be null`. That `false` is a listener from an
earlier render answering a focus event after the reset, computing
`keyboardHeight` from a viewport stub the test had already discarded — exactly
the cross-pollution the ticket describes.

Fix is the shape the discovery notes suggested: `install()` now stores an
`uninstall` closure removing both listeners, and
`resetOnScreenKeyboardObservation()` invokes it with `uninstall?.()` before
clearing the flags. The optional call covers the partially-installed state,
where `install()` set `installed = true` and returned early because
`window.visualViewport` was absent, so no closure was ever stored.

Production behavior is unchanged: nothing at runtime calls reset, so the
listeners are still installed once and never removed. A comment on the reset
function records that this is the only detach path and why tests need it.

Verified green under `--sequence.shuffle` across three runs, so the suite no
longer depends on the accidental last-listener-wins ordering. Full suite green:
433 tests, 35 files.
