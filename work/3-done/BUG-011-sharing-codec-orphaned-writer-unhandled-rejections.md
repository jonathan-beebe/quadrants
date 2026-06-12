---
id: BUG-011
type: bug
status: resolved
created: 2026-06-11
---

# BUG-011: orphaned writer promises in sharing codec cause unhandled rejections on corrupt share links

## Problem

`src/sharing.ts` fires `writer.write()` and `writer.close()` on
Compression/Decompression stream writers without awaiting them or attaching
rejection handlers — `encodeFramework` (`src/sharing.ts:31-32`) and
`decodeFramework` (`src/sharing.ts:75-76`). When the stream errors — e.g. a
share-link hash that is valid base64url but corrupt deflate data (truncated or
tampered) — the failure the caller sees comes from
`new Response(ds.readable).arrayBuffer()` rejecting, which IS handled
(`src/hooks/useShareImport.ts:97-102` shows the error toast). But the orphaned
`writer.write()`/`writer.close()` promises also reject with nothing attached,
yielding "Uncaught (in promise)" errors alongside the handled one.

## Outcome

Opening a corrupted share link still shows the existing "The shared link could
not be loaded…" toast, and no unhandled promise rejection is reported (browser
console or test runner). A test feeding syntactically-valid-base64url but
corrupt deflate data through `decodeFramework` fails cleanly via its returned
promise without tripping the test runner's unhandled-rejection detection.

## Why it matters

Console noise misleads anyone debugging share-link failures, and in stricter
environments unhandled rejections are worse than noise — Vitest can fail
unrelated tests on them, and some runtimes treat them as fatal. Low severity
today, but it silently undermines test reliability for everything that touches
the sharing path.

## Discovery notes

Advisory. Repro — take a valid share URL, delete a few characters from the
middle of the hash (keeping valid base64url chars), open it: toast appears
correctly, console also logs an unhandled rejection from the orphaned writer
promise. `encodeFramework` has the same pattern but only errors in practice if
the platform stream fails. Caution: naively awaiting write/close before reading
can deadlock on large payloads due to backpressure — write/close and the read
must not be strictly sequential without care.

## Recommendation

Either keep the fire-and-forget writes but attach a no-op/forwarding `.catch` to
both promises (the established pattern for this idiom), or eliminate manual
writer management entirely with
`new Response(new Blob([bytes]).stream().pipeThrough(cs))`. Add a
corrupt-deflate-payload case to `src/__tests__/sharing.test.ts` asserting the
rejection is delivered solely through `decodeFramework`'s returned promise.

## Related work

- IMPRV-004 (open — extracts pure payload projection/validation out of
  `src/sharing.ts`; whoever lands second should rebase around the other)
- BUG-008 (open — same share-import surface, different defect)
- Commit f30eaf2 — assert CompressionStream support before share encode/decode
- Commit 6f29993 — encode share binary in chunks to avoid arg-spread limit
- Commit e63928b — surface share/import errors to users instead of silently
  swallowing

## Working

- Bug proven first: corrupt-deflate regression test captured a Z_DATA_ERROR
  unhandledRejection before the fix.
- Judgment call: tried the ticket's writer-less alternative
  (`new Blob([bytes]).stream().pipeThrough(...)`) first, but jsdom's Blob has no
  `.stream()`, so the test environment can't exercise it. Landed the other
  recommended shape: keep fire-and-forget writes with `.catch` swallow handlers
  (errors still flow via the readable side), with comments explaining the
  backpressure deadlock risk of awaiting.
- Test listens on process 'unhandledRejection' via a typed globalThis cast (no
  @types/node in this project).
