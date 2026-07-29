---
id: RFCTR-012
type: refactor
status: resolved
created: 2026-07-28
---

# RFCTR-012: extract pure share-url and export-filename rules from useFrameworkSharing

## Problem

Two pure domain rules live inline and untested in the shell hook
`src/hooks/useFrameworkSharing.ts`. (1) Share-URL composition, lines 180-181:
`share()` builds the link as
`` `${window.location.origin}${import.meta.env.BASE_URL ?? '/'}#${hash}` ``. Per
`src/architecture.md:34-36` a share link is "the routing adapter's URL plus the
sharing adapter's payload codec", yet the composition rule lives in a
coordination-layer hook, and no test pins the URL shape —
`src/__tests__/hooks/useFrameworkSharingShare.test.ts` covers only the
clipboard/native-share outcome matrix. (2) Export-filename slug, line 211:
`exportJson` derives the filename as
`` `${fw.name.replace(/\s+/g, '-').toLowerCase()}.json` ``, which only collapses
whitespace — a framework named `Q3 / Roadmap?` exports as `q3-/-roadmap?.json`,
a filename containing a path separator and an illegal character, left to
per-browser download sanitization. Both rules are pure domain knowledge ("an
`if` about the domain belongs in the core", `src/architecture.md:47`) with zero
direct tests.

## Goal

Share-link construction and export-filename slugging are pure, unit-tested core
rules, with the hook reduced to supplying environment inputs (origin, base) and
performing the effects.

## Outcome

- The share-URL rule lives in `src/logic/` as a pure function of explicit inputs
  (origin, base, payload hash) with node-project unit tests pinning the exact
  URL shape via hard-coded expectations under both root (`/`) and non-root (e.g.
  `/quadrants/`) bases; the hook's `share()` emits exactly that URL, and a
  hook-level test verifies the produced `url` field matches the core rule's
  shape.
- The export-filename rule lives in `src/logic/` as a pure function of the
  framework name with node-project unit tests; names containing path separators,
  characters illegal in filenames, and mixed whitespace all yield a safe
  lowercase hyphenated `.json` filename (the `Q3 / Roadmap?` repro no longer
  produces `/` or `?` in the name), and a name that reduces to nothing still
  yields a usable filename.
- `useFrameworkSharing.ts` contains no inline URL-composition or
  filename-derivation string logic — it passes environment inputs to the core
  rules and performs the effects (clipboard/share/download).
- All existing share, export, and import behavior still passes its existing
  tests.

## Why it matters

The share URL is the product's only sharing contract — its shape can silently
regress today because nothing tests it, and it can only be reached through jsdom
with clipboard/share mocking. The filename rule has a live defect: illegal
filenames are handed to the browser's download sanitization, whose behavior
varies by browser/OS (substitution, mangling, or failure). Both violate the
core/shell contract in `src/architecture.md` that keeps domain rules
unit-testable in the node core project.

## Discovery notes

Advisory. The share-URL rule is a natural sibling of the base-parameterized
path↔id rules RFCTR-011 creates — whichever ticket lands first, keep base an
explicit argument so the two compose; the shell supplies
`window.location.origin` and `import.meta.env.BASE_URL ?? '/'` (the routing
adapter `src/routing.ts` may become the sole owner of that env read, per
RFCTR-011's notes — optional). Watch the joint: base typically ends with `/`
(e.g. `/quadrants/`), so the composed URL must not double or drop separators
under either base. For the filename: `logic/framework.ts` is the natural
neighbor (it owns framework domain rules), and hardening should remove or
replace characters unsafe across platforms (`/ \ : * ? " < > |` and control
chars), collapse runs, and fall back to a fixed name (e.g. `framework.json`)
when the slug is empty. Test cases worth pinning: current happy path (whitespace
collapse + lowercase), the `Q3 / Roadmap?` repro, a name of only illegal
characters, and a unicode name. Note the exported filename for names containing
illegal characters will intentionally change — that is the fix, not a
regression.

## Working

- `composeShareUrl(origin, base, hash)` added to `logic/sharePayload.ts` (base
  stays an explicit argument, composing with RFCTR-011); shape pinned with
  literal expectations under `/` and `/quadrants/`, plus a hook-level test
  asserting `share()` emits exactly the core rule's URL.
- `exportFilename(name)` added to `logic/framework.ts`: strips the
  cross-platform illegal set + control chars, collapses whitespace to hyphens,
  lowercases, falls back to `framework.json`. The `Q3 / Roadmap?` repro now
  exports `q3-roadmap.json` — the intentional behavior change.
- Hook now supplies environment inputs and performs effects only; no inline URL
  or filename string logic remains.
- Suite 531 green, tsc and eslint clean.

## Related work

- RFCTR-011 (inbox — parameterizes core path↔id rules by an explicit base
  argument and bans `import.meta.env` reads under `src/logic/`; the share-URL
  rule must take base as an explicit input and compose with that work rather
  than duplicate base handling. RFCTR-011's discovery notes already flag the
  hook's line-180 BASE_URL read as an optional consolidation site.)
- RFCTR-004 (done — split pure route rules from the window/history adapter; the
  pattern this ticket mirrors)
- IMPRV-004 (done — extracted pure share-payload projection/validation into
  `logic/sharePayload.ts`)
- RFCTR-005, RFCTR-006, RFCTR-009 (done/inbox — the established pattern of
  extracting pure rules out of shell modules)
- BUG-002 (done — established the `share()` outcome matrix and its tests; those
  tests mock clipboard/`navigator.share` and do not pin the URL)
