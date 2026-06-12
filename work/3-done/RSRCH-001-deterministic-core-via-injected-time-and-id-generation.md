---
id: RSRCH-001
type: research
status: resolved
created: 2026-06-11
---

# RSRCH-001: deterministic functional core via injected time and id generation

## Problem

Pure-by-intent core functions call nondeterministic platform APIs directly. In
`src/logic/framework.ts`: `hydratePayload` (crypto.randomUUID + Date.now, lines
4-24), `updateFramework` (Date.now, line 27), `duplicateFramework`
(crypto.randomUUID + Date.now, lines 34-42), `duplicateAsImport`
(crypto.randomUUID, lines 77-82), `sanitizeImportedFramework`
(crypto.randomUUID + Date.now, lines 94-129). In `src/storage.ts:36-61`:
`createFramework`/`createItem` use crypto.randomUUID, Date.now, and Math.random.
It is unknown whether this nondeterminism costs us anything (test weakness,
regression-detection gaps) that justifies the plumbing cost of injection — that
question has never been examined.

## Outcome

A written recommendation exists answering:

1. Whether the nondeterminism costs us anything today or foreseeably (flakiness
   risk, weaker regression detection, inability to test timestamp-dependent
   logic like `updatedAt` ordering).
2. The candidate designs — explicit `now`/`makeId` parameters with defaults; a
   module-level injectable clock; accepting vi.spyOn/fake-timers in tests as the
   standing answer — with their complexity costs.
3. A recommendation to adopt one design or explicitly document the status quo as
   accepted — with follow-up tickets filed if adoption is recommended, or the
   acceptance recorded if not.

## Why it matters

Unit tests can only make fuzzy assertions —
`src/__tests__/logic/framework.test.ts:58` asserts `createdAt`
toBeGreaterThan(0), `:100` asserts `updatedAt` toBeGreaterThan(1000), and
`src/__tests__/storage.test.ts:197-203` asserts Math.random output ranges.
Exact-value equality and stable snapshot-style comparisons are impossible,
weakening regression detection in the functional core — the layer the project's
functional-core/imperative-shell principle says should be most testable.
Conversely, the project principle is "simplicity first": no test is currently
flaky, and injection adds parameter plumbing through every caller — so this
needs research, not reflexive implementation.

## Discovery notes

Advisory. This was deliberately judged below the bar for an implementation
ticket during a functional-core/imperative-shell review. No flaky test exists
today. The cost is confined to assertion strength, not correctness. Any adopted
design would touch every caller of the listed functions, so the complexity-cost
analysis should weigh call-site count. The research deliverable is the decision
itself — implementation, if recommended, belongs in follow-up tickets, not this
one.

## Related work

- IMPRV-001 (done — extracted pure `resolveImportAction` from `useShareImport`)
- IMPRV-003 (inbox — extract pure framework validation from storage shell)
- IMPRV-004 (inbox — extract pure share payload projection/validation)
- MAINT-004 (inbox — make weak tests behavioral)

All four push logic toward the functional core; this research decides whether
that core should also be deterministic.

## Findings & Recommendation (research deliverable)

### 1. What the nondeterminism costs us

**Today: assertion strength only — and less than the ticket feared.**

- No flaky test exists (confirmed: full suite green across ~15 runs during this
  drain, including timing-adjacent suites).
- The fuzzy assertions cited (`createdAt toBeGreaterThan(0)`,
  `updatedAt toBeGreaterThan(1000)`, Math.random range checks) are weak, but the
  weakness is **already fixable test-side without injection**:
  - `vi.useFakeTimers()` + `vi.setSystemTime(n)` makes `Date.now()` exact
    (`useShareImportErrorTimer.test.ts` already uses fake timers today).
  - `vi.spyOn(crypto, 'randomUUID').mockReturnValue(...)` works — it is an
    ordinary method on a global object.
  - `vi.spyOn(Math, 'random')` likewise (storage.test.ts already spies on other
    globals).
- Timestamp-ordering logic (e.g. `updatedAt` recency) is testable today with
  `vi.setSystemTime` advancing between calls. Nothing is untestable; some things
  are merely unasserted.

**Foreseeably:** snapshot-style equality of whole Frameworks would need all
three sources pinned — still achievable with the vitest tools above. The only
scenario injection wins outright is running the core outside a test runner that
can fake globals (e.g. property-based testing in a bare node script, or porting
the core to another runtime). No such plan exists.

### 2. Candidate designs and complexity costs

| Design                                                                              | Cost                                                                                                                                                                                                         | Notes                                                                |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| (a) Explicit `now`/`makeId` params with defaults                                    | ~8 production call sites today, plus every future caller; widens 7 core signatures; risk of mixed styles (some callers pass, some default)                                                                   | Purest FP answer; highest ongoing tax                                |
| (b) Module-level injectable clock/id ("services" singleton)                         | Small diff, but introduces global mutable state the project doesn't have; needs per-test reset discipline; failure mode is cross-test leakage — i.e. it _creates_ the flakiness class it is meant to prevent | Worst fit with simplicity-first                                      |
| (c) Status quo: vitest fakes (`setSystemTime`, `spyOn`) when a test needs exactness | Zero production code; per-test opt-in; standard, documented vitest practice                                                                                                                                  | Capability-equivalent to (a)/(b) for every current and foreseen need |

### 3. Recommendation: keep the status quo — recorded as accepted

Injection is **not adopted**. `Date.now`, `crypto.randomUUID`, and `Math.random`
in the functional core are accepted as ambient effects, on these grounds:

1. The project principle is simplicity first; injection adds permanent
   signature/plumbing tax for a benefit vitest already provides on demand.
2. The observed cost is confined to assertion strength, and any test that wants
   exact values can have them today with `vi.setSystemTime` / `vi.spyOn` — adopt
   that pattern opportunistically when touching those tests, rather than as a
   sweep.
3. Re-open this decision only if one of these triggers occurs: a real flaky test
   traced to time/randomness; a need to run the core outside vitest
   (property-based harness, other runtime); or server sync / CRDT-style features
   where deterministic replay becomes a product requirement.

No follow-up tickets filed (adoption not recommended; the opportunistic
test-strengthening note above does not warrant a standing ticket).

## Working

- Surveyed production call sites: hydratePayload x2 (logic/shareImport),
  duplicateFramework x1, duplicateAsImport x1, sanitizeImportedFramework x1,
  createFramework x1, createItem x1, updateFramework x1 — the "every caller"
  plumbing in design (a) is ~8 sites today but grows with the app.
- Verified vi.spyOn(crypto, 'randomUUID') is viable in this environment (crypto
  is a plain global with a writable method in jsdom/node).
- Deliverable is this decision record, per the ticket; no code changed, so no
  commit accompanies this ticket.
