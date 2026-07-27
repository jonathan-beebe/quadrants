---
id: MAINT-006
type: maintenance
status: resolved
created: 2026-07-27
---

# MAINT-006: exact-match matchMedia fake so keyboard tests exercise the hook

## Problem

The matchMedia fake in `src/__tests__/hooks/useExpectsOnScreenKeyboard.test.ts`
(`simulateDevice`, lines 15-32) matches media-query features by substring
(`query.includes(feature)`), so it cannot distinguish `(pointer: coarse)` from
`(any-pointer: coarse)` and it silently ignores declared capabilities the hook
never queries. The hook consults exactly two queries — `(pointer: coarse)` and
`(hover: none)` (`src/hooks/useExpectsOnScreenKeyboard.ts` lines 16-17) — so the
touchscreen-laptop test (line 94) passing `'any-pointer: coarse': true` as its
claimed distinguishing signal is inert (the test exercises the same
coarse=false/hover=false inputs as the desktop test at line 89), and the tablet
test (line 83) passing `'max-width: 768px': false` asks about a query the hook
never issues. Those tests partly assert on the simulator rather than the system
under test, and their names and comments claim coverage the fake cannot deliver.

## Goal

Every device-story test in this suite provably exercises only signals the hook
actually consumes, with a fake that fails loudly if the story and the queried
signals drift apart.

## Outcome

The device-simulation fake resolves media queries by exact query string, and a
declared capability the hook never consults — or a query the fake was not told
about — surfaces as a loud test failure rather than a silently inert entry; each
device-story test declares only signals the hook consumes, test names and
comments no longer claim distinctions the fake and hook do not exercise, and the
full suite is green with no production-code changes.

## Why it matters

Tests asserting on the simulator give false confidence — the touchscreen-laptop
test's name claims the suite covers the pointer/any-pointer distinction, so a
future regression there would go unnoticed, and a future contributor extending
the capability map with both pointer variants would get silently wrong answers
from the substring match.

## Discovery notes

Advisory. One shape that fits: key the capability map by full query string (e.g.
`'(pointer: coarse)': false`) and have the fake throw — or return matches:false
while recording the unknown query for a per-test assertion — when asked a query
not in the map, so an unconsulted or unknown capability is loud rather than
inert. The touchscreen-laptop and tablet scenarios may keep their device-story
names as documentation of why the hook avoids width breakpoints and any-pointer,
but each must pass only the two consulted signals; the comments can state that
the distinguishing signal is the hook's choice of `(pointer: coarse)` over
`(any-pointer: coarse)`, which is production behavior (hook lines 10-14), not
something this fake simulates. Pure test-quality work; no production code
changes.

## Related work

- MAINT-004 — precedent: converting implementation-pinning tests to behavioral
- RFCTR-006 — open, in 1-inbox; moves the keyboard-size judgment into the core
  and relies on these hook tests staying green; this ticket is confined to the
  fake and the device-story tests, and the two are compatible in either order
- RSRCH-002 — in 2-doing; source of the detection design
- 65acd74, f3f67cf — commits that introduced the suite

## Working

Re-validated: the substring fake was still in place (test lines 15-32) and the
hook still issues exactly the two queries `(pointer: coarse)` and
`(hover: none)`, so both inert declarations described in the Problem were live.

The fake now keys capabilities by full query string and matched exactly, with a
guard in each direction:

- an undeclared query throws from inside `matchMedia`, naming the query and what
  the story did declare;
- a declared-but-unread signal throws from `afterEach`
  (`expectEveryDeclaredSignalWasRead`), which is where an inert entry can first
  be detected — nothing else in the test can see that the hook finished without
  asking.

Both guards were verified to fire by temporarily reintroducing each fault, then
reverted:

- inert entry →
  `This device story declares (any-pointer: coarse), which the hook never asked about.`
- withheld answer →
  `The hook asked "(pointer: coarse)", which this device story does not answer. Declared: (hover: none).`

Device stories now declare only the two consulted signals. The tablet test kept
its story but was renamed to "expects a keyboard on a landscape tablet, wider
than a phone breakpoint" — the width breakpoint is described in a comment as the
hook's design rationale rather than claimed as something the test exercises. The
touchscreen-laptop test likewise keeps its name and states plainly in a comment
that it presents to the hook exactly as the desktop test does, because
`any-pointer` is never queried; the pointer/any-pointer distinction is the
hook's choice of query and is not simulated here.

No production-code changes. Full suite green: 432 tests, 35 files.
`tsc --noEmit` clean.
