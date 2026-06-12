---
id: BUG-007
type: bug
status: resolved
created: 2026-06-11
---

# BUG-007: inconsistent position clamps shift shared items and trigger false import conflicts

## Problem

Item x/y clamp ranges disagree across three code paths: keyboard repositioning
(`src/components/Card.tsx:37-40`) clamps to [0,95]; drag-and-drop
(`src/hooks/useDragAndDrop.ts:34-35`, `pageToQuadrantPercent`) clamps to [2,85];
share-import hydration (`src/logic/framework.ts:16-17`, `hydratePayload`) clamps
to [2,85]. `encodeFramework` (`src/sharing.ts:12-24`) shares raw x/y, so a
keyboard-positioned item outside [2,85] is silently moved on the recipient's
side. Worse, `frameworksMatch` (`src/logic/framework.ts:58-75`) compares stored
(clamped) item positions against raw payload positions, so after importing a
payload containing any out-of-[2,85] position, opening the very same share link
again makes `resolveImportAction` (`src/logic/shareImport.ts`) return
`kind:'conflict'` instead of `'navigate'` — a false-positive "framework already
exists locally but differs from the shared version" dialog.

## Outcome

1. An item placed at any position reachable through the app's own controls
   (keyboard or drag) survives a share/import round-trip at the same
   coordinates.
2. Opening a share link for a framework that was already imported unchanged
   navigates to it; the conflict dialog never appears for a byte-identical
   payload.
3. The conflict dialog still appears when the local copy genuinely differs.

## Why it matters

Users lose item placement silently when sharing, and the spurious conflict
dialog erodes trust in the share feature — it claims local divergence the user
never made, and pushes them toward Replace/Keep-both actions that can duplicate
or clobber data for no reason.

## Discovery notes

Advisory. Repro: create framework → add item → focus it and arrow-key until x=95
→ copy share link → simulate fresh import (delete the framework or second
profile) → open link (item lands at x=85) → open the same link again → conflict
dialog instead of navigation. Root cause is two independent defects that
compound: divergent clamp constants, and `frameworksMatch` comparing clamped
stored state to raw payload. The share-import surface has accrued several
tickets (BUG-002, FEAT-001, IMPRV-001/003/004); the structural cleanup is
already ticketed there, so this ticket stays symptom-scoped.

## Recommendation

Two complementary directions; the maker picks. (a) Unify the clamp into a single
exported constant/helper (e.g. in `src/logic/`) used by `Card.tsx` keyboard
repositioning, `useDragAndDrop.pageToQuadrantPercent`, and `hydratePayload`,
choosing one canonical range. (b) Make matching clamp-insensitive: have
`frameworksMatch` compare the existing framework against `hydratePayload`'s
output (clamped-vs-clamped) rather than raw payload values — this alone kills
the false conflict even if ranges later drift again. Start inquiry in
`src/logic/framework.ts` (`hydratePayload`, `frameworksMatch`) and add unit
tests there plus a re-import-same-link case in `src/__tests__/sharing.test.ts`
or the shareImport logic tests.

## Related work

- A11Y-010 / commit c728f9e (introduced the [0,95] keyboard clamp)
- Commit faede7f (introduced the [2,85] hydration clamp)
- Commit c2adef3 (deepened `frameworksMatch` to compare coords — origin of
  raw-vs-clamped comparison)
- IMPRV-001 / commit 1fad93b (extracted `resolveImportAction`)
- FEAT-001 (conflict-dialog tests)
- IMPRV-003 and IMPRV-004 (open inbox tickets extracting pure
  validation/projection in the same files — coordinate, don't duplicate)

## Working

- Took BOTH complementary directions from the ticket: (a) shared
  `clampPosition`/`POSITION_MIN`/`POSITION_MAX` in `src/logic/items.ts`,
  canonical range [0,95]; (b) `frameworksMatch` compares clamped-vs-clamped.
- Judgment call: canonical range is the keyboard envelope [0,95], because the
  import path must accept anything the app's own controls can produce.
  Drag-and-drop's [2,85] was kept as-is — it is a deliberate drop-placement UX
  choice (keeps the card visually inside the quadrant), not a validity rule;
  changing it would alter drop behavior beyond this bug's scope. It is
  documented in `pageToQuadrantPercent` against the canonical envelope.
- `frameworksMatch` mirrors hydration exactly (`clampPosition(x ?? 10)`), so
  even future range drift cannot resurrect the false conflict.
- Tests: hydrate preserves x=95/y=0; clamps 9999→95, -500→0; frameworksMatch
  clamp-insensitivity + genuine-difference case; full re-import scenario via
  resolveImportAction (add → navigate).
