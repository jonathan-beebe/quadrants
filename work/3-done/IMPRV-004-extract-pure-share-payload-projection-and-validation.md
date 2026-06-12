---
id: IMPRV-004
type: improvement
status: resolved
created: 2026-06-11
---

# IMPRV-004: extract pure share payload projection and validation from sharing codec shell

## Problem

`src/sharing.ts` mixes pure logic with the platform compression codec. The
Framework → SharedPayload projection (strips ids/timestamps from items, keeps
label/color/text/x/y) is inlined in `encodeFramework` (`src/sharing.ts:14-24`),
and the pure validator `isValidPayload` (`src/sharing.ts:45-64`) is unexported
and reachable only through `decodeFramework`'s DecompressionStream/atob
pipeline. As a consequence, `src/__tests__/sharing.test.ts` hand-rolls the same
compress→base64url boilerplate three times (lines ~68-83, ~146-172, ~191-216)
solely to push crafted payloads through the codec to exercise validation rules;
the rules cannot be unit-tested directly.

## Outcome

- The payload projection (Framework → SharedPayload, metadata stripped) and the
  payload validator are verifiable by direct unit tests on pure functions in
  `src/logic/` — projection strips item ids/timestamps; validator accepts a
  valid payload and rejects each rule violation (missing/empty id or name, wrong
  quadrant count, non-string label, non-string color, malformed items) — with no
  CompressionStream/btoa involvement.
- `src/__tests__/sharing.test.ts` contains no hand-rolled compress→base64url
  boilerplate for validation cases; codec-level tests (encode/decode round-trip,
  URL-safety, unicode, unsupported-browser error) remain and pass.
- Share encode/decode behavior is unchanged: existing round-trip, BUG-017, and
  BUG-026 tests still pass.

## Why it matters

Violates the project's functional-core/imperative-shell principle; validation
rules guarded by regression tests (BUG-017) can only be exercised through async
platform I/O, making tests slow, duplicated, and brittle, and making it easy for
future validation changes to go untested.

## Discovery notes

Advisory — `SharedPayload` item shape differs from `Framework` items (no
`id`/`createdAt`), so the projection is a real transformation, not a
passthrough. `src/logic/` already hosts `shareImport.ts` and `framework.ts`;
either is a plausible neighbor for the extracted functions.

## Recommendation

Move the projection into an exported pure function `toSharedPayload(framework)`
and export `isValidPayload`, both in `src/logic/` (e.g.
`src/logic/sharePayload.ts` or alongside `shareImport.ts`); have
`encodeFramework`/`decodeFramework` delegate. Unit-test both directly; slim
sharing tests to codec concerns. No behavior change intended. If IMPRV-003's
consolidation lands first, reuse its shared quadrant/item checks rather than
duplicating them.

## Related work

- IMPRV-003 (extract pure framework validation from storage shell — sibling
  finding; it names `isValidPayload` as one of three divergent validators. This
  ticket relocates/exports `isValidPayload`; coordinate so both land cleanly,
  but scope here is `sharing.ts` only)
- IMPRV-001 (extracted pure `resolveImportAction` from `useShareImport` — same
  core-extraction pattern)
- Commits c095551 (BUG-017: validate shared payload color), f30eaf2 (BUG-026:
  assert CompressionStream support)

## Working

- Created `src/logic/sharePayload.ts` with `toSharedPayload` (projection, moved
  verbatim from `encodeFramework`) and `isValidPayload` (moved verbatim from
  `sharing.ts`); the codec now only does compression and base64url.
- Direct unit tests in `src/__tests__/logic/sharePayload.test.ts` cover the full
  rule matrix (empty id/name, quadrant count, non-string label/color, malformed
  items, tolerated optional fields, metadata stripping).
- Judgment call: kept ONE codec-level wiring test ("decoded payload fails
  validation") with a single compact `encodeRawPayload` helper, so the
  decode→validate wiring stays covered; the triplicated boilerplate blocks
  (invalid structure, BUG-017 color, missing id) are gone as the ticket
  required, their assertions now live in the pure tests.
- No behavior change; round-trip/unicode/chunking/BUG-026 tests untouched and
  green.
- Commit: see journal (improvement: extract pure share payload projection)
