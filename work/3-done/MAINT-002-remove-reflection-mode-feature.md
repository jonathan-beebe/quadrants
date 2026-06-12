---
id: MAINT-002
type: maintenance
status: resolved
created: 2026-06-10
resolved: 2026-06-10
---

# MAINT-002: remove reflection mode feature

## Problem

The app ships a full-screen "Reflection Mode" overlay
(src/components/ReflectionMode.tsx, 167 lines) reached via the "Reflect" button
in src/components/QuadrantCanvas.tsx:191. Its purpose is unclear — it only
re-offers add-item capability the main quadrant canvas already provides — yet it
has consumed disproportionate upkeep: five fix commits (6118d92, 6317de0,
9cbe727, d9089f5 / PR #10, 131031e) covering focus trapping, tab keyboard
navigation, AT badge exposure, a rapid-add data-loss race, and stale ARIA
wiring. Every a11y audit and design-system sweep must account for this surface.

## Outcome

No "Reflect" affordance appears anywhere in the UI and no interaction can reach
a Reflection Mode overlay; all framework CRUD and item-add flows on the main
canvas behave exactly as before; the full test suite passes with no
reflection-related tests or mocks remaining.

## Why it matters

This feature is pure carrying cost — it duplicates existing capability while
being one of the largest sources of fix work in the repo (5 of ~12 feature-area
commits), and as a modal dialog it enlarges the strict WCAG audit surface every
accessibility pass must re-verify.

## Discovery notes

Advisory touchpoint inventory — src/components/ReflectionMode.tsx (delete);
src/**tests**/ReflectionMode.test.tsx (delete); src/App.tsx lines 11, 28,
125–127, 174 (import, reflectionMode state, early-return branch, onReflect
prop); src/components/QuadrantCanvas.tsx lines 22, 32, 191–194 (onReflect prop
and Reflect button — MaximizeIcon import stays, it's used by DesignSystem);
src/**tests**/QuadrantCanvas.test.tsx lines 30, 81–86 (mock + onReflect test);
src/components/DesignSystem.tsx:379 (empty "Reflection Mode" subsection). Shared
modules useFocusTrap, Badge, Caption are used by other components and must
remain. No persisted data is reflection-specific, so no storage migration is
needed. FrameworkBuilder.tsx:83 contains the placeholder text "My Reflection
Framework" — cosmetic, unrelated to the feature.

## Recommendation

Delete the component and its test file, strip the App.tsx state/branch and the
QuadrantCanvas prop/button, and drop the DesignSystem subsection. Success
measures: `grep -ri reflection src/` returns no functional hits (the
FrameworkBuilder placeholder string is the only acceptable remainder, or rewrite
it too); `npx tsc --noEmit` is clean (catches orphaned props/imports); the full
test suite is green.

## Related work

- commit 6118d92 — a11y: fix ReflectionMode focus trap, dialog role, and Tab
  hijacking
- commit 6317de0 — a11y: add arrow key navigation to ReflectionMode tabs
- commit 9cbe727 — a11y: hide item count badge from AT in ReflectionMode tabs
- commit d9089f5 (PR #10) — fix: prevent item loss during rapid adds in
  ReflectionMode
- commit 131031e — fix: drop aria-controls on inactive ReflectionMode tabs
- A11Y-005 — cites ReflectionMode.tsx as a focus-management reference

## Working

- Deleted src/components/ReflectionMode.tsx and
  src/**tests**/ReflectionMode.test.tsx.
- App.tsx: removed the ReflectionMode import, the `reflectionMode` state, the
  early-return overlay branch, and the `onReflect` prop on QuadrantCanvas.
- QuadrantCanvas.tsx: dropped the `onReflect` prop, the Reflect button, and the
  now-unused `MaximizeIcon` import (the icon's definition in Icons.tsx stays —
  DesignSystem still references it).
- QuadrantCanvas.test.tsx: removed the `onReflect` mock and its click test.
- DesignSystem.tsx: removed the empty "Reflection Mode" subsection.
- FrameworkBuilder.tsx: rewrote the cosmetic placeholder "My Reflection
  Framework" → "My Decision Matrix" so `grep -ri reflection src/` is fully clean
  of the feature; the only remaining matches are FEAT-002 template comments,
  which I reworded to "retro-style presets".
- Verification: `grep -ri reflection src/` no functional hits; `tsc --noEmit`
  clean; full suite 276 passing (25 → 24 files after dropping the reflection
  test); `npm run ci` green.
