---
id: RFCTR-006
type: refactor
status: resolved
created: 2026-07-27
---

# RFCTR-006: extract keyboard-size judgment into onScreenKeyboard core

## Problem

The domain judgment "does this viewport change count as an on-screen keyboard"
lives in the shell. `src/hooks/useExpectsOnScreenKeyboard.ts` inlines
`keyboardHeight(viewport) >= KEYBOARD_MIN_PX` at three decision points (lines
89, 100, 107), owns the `KEYBOARD_MIN_PX = 120` threshold (line 24), and encodes
the settle-timer verdict semantics (no keyboard-sized shrink within `SETTLE_MS`
of focusing an editable field concludes false, lines 104-108). The layer table
in `src/architecture.md` (line 47) says `hooks/` is thin orchestration and "an
`if` about the domain belongs in the core" (`src/logic/`). Today the threshold
rule is tested only indirectly, through hook integration tests in
`src/__tests__/hooks/useExpectsOnScreenKeyboard.test.ts`. The hook file also
carries a dead re-export — `export { decidingSignal }` at line 166 — that no
module imports; `DesignSystem.tsx` imports `decidingSignal` from the logic
module directly, which is the sanctioned path.

## Goal

The keyboard-size judgment lives in the functional core, directly unit-tested,
with the hook a thin shell that only observes and delegates.

## Outcome

1. The judgment of whether a viewport change counts as an on-screen keyboard —
   including the 120px threshold and its recorded rationale — resides in
   `src/logic/onScreenKeyboard.ts` as pure logic with direct unit tests in
   `src/__tests__/logic/onScreenKeyboard.test.ts`.
2. `src/hooks/useExpectsOnScreenKeyboard.ts` contains no domain conditionals: no
   threshold constant and no keyboard-size comparison; its decision points
   delegate to the core.
3. The dead `export { decidingSignal }` re-export is gone from the hook file and
   every existing import still resolves.
4. Detection behavior is unchanged: existing hook integration tests still pass,
   full suite green.

## Why it matters

The 120px threshold is a recorded domain decision (RSRCH-002 measured real
keyboards at 295-311px against a 108px Safari toolbar, the main false-positive
source). Buried in event-listener plumbing it can only be tested through timers
and fake viewports, and it is duplicated three times, so a future adjustment can
drift between call sites. This is a direct violation of the architecture's
hooks-layer rule.

## Discovery notes

Advisory. One shape that fits: a pure predicate taking the document client
height and visual-viewport height (or the computed shrink), owning the threshold
and its rationale comment, exported beside `expectsOnScreenKeyboard`; the hook
keeps the observation machinery (listeners, settle timer, subscriber store) and
calls the predicate at its three decision points. The settle timer itself is
timing, not domain, and may stay in the shell — only the judgment needs to move.
This is a factoring correction, not a redesign: keep it minimal and do not alter
detection behavior.

## Related work

- RSRCH-002 — in 2-doing; source of the threshold measurements
- ARCH-001 — the layer rule violated
- IMPRV-001, IMPRV-003, IMPRV-004 — precedent pure-logic extractions from shells
- aa4e4c9, 65acd74, f3f67cf — commits that introduced the code under review

## Working

Re-validated: the comparison was inlined at all three decision points, the
threshold lived in the hook, and `export { decidingSignal }` had no importer
anywhere in `src/` (DesignSystem takes it from the logic module directly).

Core gains `isKeyboardSized(shrinkPx)`, which owns the 120px threshold and the
RSRCH-002 rationale. It takes the shrink rather than the two heights: which
heights to subtract is a DOM question (`clientHeight`, not `innerHeight`) that
belongs to the shell, while how big the shrink has to be is the domain judgment.
A single numeric argument also removes the transposition hazard of two
same-typed height parameters.

The shell keeps the measurement, renamed `keyboardHeight` → `viewportShrink`,
since it now reports a distance and no longer decides what that distance means.
All three decision points read `isKeyboardSized(viewportShrink(viewport))`.

Unit tests were written first and failed on the missing export. They pin the
threshold against the measurements that justify it — 295px and 311px keyboards
true, the 108px Safari toolbar false — plus the 119/120 boundary and a negative
shrink, which the inlined comparison had never been asked about.

Outcomes: (1) judgment and threshold in `src/logic/onScreenKeyboard.ts` with
direct unit tests; (2) hook has no threshold constant and no size comparison —
verified by grep; (3) dead re-export gone, `tsc` confirms every import still
resolves; (4) detection behavior unchanged, hook integration tests untouched and
green. Settle timer left in the shell as the discovery notes allow — it is
timing, not domain.

Full suite green: 438 tests, 35 files. `npm run ci` fully green.
