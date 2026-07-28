---
id: IMPRV-009
type: improvement
status: resolved
created: 2026-07-28
---

# IMPRV-009: reusable modal component with fixed title bar in the design system

## Problem

The app has no reusable modal component. Each modal surface hand-rolls its own
chrome: `EditModal.tsx` (top bar, close X, scroll region — lines 87-147),
`ConflictDialog.tsx`, and the mobile template popover in `FrameworkBuilder.tsx`
(lines 304-317). Focus traps, dialog semantics, and focus restores were each
fixed one surface at a time across A11Y-016, A11Y-021, A11Y-022, RFCTR-007, and
RFCTR-008 — the chrome keeps being rebuilt and re-broken.

## Goal

One reusable modal component owns modal chrome, so any feature can present
content in a modal without rebuilding dialog behavior.

## Outcome

A modal component exists with:

- a title bar showing a title and a close button, which remains visible and in
  place regardless of content length;
- a content area hosting arbitrary children that does not scroll itself — the
  content owns its own scrolling;
- responsive presentation: full screen on mobile viewports, centered over the
  page on large/wide screens;
- dialog semantics consistent with the app's prior modal fixes: accessible name
  derived from the title, modal behavior, Escape and close-button dismissal, and
  focus restored to the opener on close.

The design system page demonstrates it with content long enough to scroll,
showing the title bar staying put, and shows both the full-screen and centered
presentations.

## Why it matters

This is a strict-WCAG app, and five separate tickets have patched hand-rolled
dialog chrome; a single audited component turns every future modal into
content-only work. The framework-builder move (IMPRV-010) is the first consumer.

## Discovery notes

Advisory; use or discard. `EditModal.tsx:87-113` already implements the wanted
chrome — overlay, dialog role, `aria-labelledby` from the title, `useFocusTrap`,
labeled close X, and the `openerRef` focus-return contract (A11Y-022). Consider
generalizing that shell rather than writing a third implementation. Whether
EditModal itself is rebased onto the new component is the maker's call — its
visual-viewport keyboard clamp (RSRCH-002) is specialized and need not live in
the generic component. The mobile/desktop presentation split can lean on the
existing `useIsMobile` breakpoint. Keep the content region a `min-h-0` flex area
so children can own scrolling. Demo belongs in `DesignSystem.tsx` alongside
`EditModalDemo`.

## Related work

- IMPRV-008 — extracts the framework builder content this modal will host
- IMPRV-010 — presents that content in this modal
- A11Y-016 — template picker trigger/dialog semantics
- A11Y-021 — conflict dialog focus landing on dismissal
- A11Y-022 — focus returns to the opener when a modal closes
- RFCTR-007 — modal ids from useId, not module counters
- RFCTR-008 — one owner for modal focus behavior
- IMPRV-006 — EditModal wired into the canvas edit flow
- aa4e4c9 — EditModal added to the design system
- 65acd74 — EditModal gated on on-screen-keyboard detection

## Working

- Re-validated: three hand-rolled modal chromes confirmed (EditModal,
  ConflictDialog, the builder's template popover); no shared component existed.
- Tests first: `Modal.test.tsx` (10 tests) asserts the outcome — dialog named by
  its title, labeled close button, Escape, focus moves into the dialog on open
  with autofocusing children winning, focus returns to the opener on close
  (A11Y-022), content area carries no `overflow-y-auto` with the title bar a
  `shrink-0` sibling outside it, centered-with-rounded-panel on wide screens vs
  `w-full h-full` on mobile. `DesignSystemModal.test.tsx` covers the demo: opens
  with 12 scrolling content blocks whose child owns the scroll, closes back to
  the trigger.
- Built `Modal.tsx` by generalizing EditModal's shell as the discovery notes
  suggested: same title-bar markup, `useFocusTrap`, cleanup-time `openerRef`
  focus return; presentation split on `useIsMobile`. Content area is a
  `flex-1 min-h-0 flex` region with no scrolling of its own. EditModal left
  untouched — its visual-viewport keyboard clamp stays specialized (maker's-call
  note exercised).
- Demoed in `DesignSystem.tsx` as "Modal — shared chrome with a fixed title
  bar", placed with the other modal demos; ref-forwarded trigger Button is the
  opener. Full suite green at 482; tsc and lint clean via pre-commit CI.
