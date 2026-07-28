---
id: IMPRV-008
type: improvement
status: resolved
created: 2026-07-28
---

# IMPRV-008: extract framework builder content from its screen chrome

## Problem

`src/components/FrameworkBuilder.tsx` mixes two responsibilities in one 333-line
component: the framework-authoring content (template picker, lines 129-178;
name/axes/quadrant form, lines 180-259) and the screen chrome that hosts it
(page header with sidebar toggle and Cancel, lines 275-283; page-level sizing
and scroll management, lines 261-274). The authoring UI cannot be presented
anywhere except this full-page screen.

## Goal

The framework-authoring UI is a self-contained component, independent of where
it is hosted.

## Outcome

A component exists that renders the template picker and framework form and
communicates only through data-in/callbacks-out (editing target, create,
cancel). The FrameworkBuilder screen renders it and behaves exactly as today —
the existing FrameworkBuilder tests pass unchanged apart from import-level
edits.

## Why it matters

The new-document flow is slated to move into a modal (IMPRV-009, IMPRV-010);
without this seam the move would drag page chrome into the modal or fork the
builder.

## Discovery notes

Advisory; use or discard. The seam is already visible in the file: `list` and
`form` are internal constants composed by three layout branches (lines 285-329).
Chrome concerns to leave behind: `SidebarToggleButton`, the `PageTitle` header,
and the BUG-003/BUG-017 page-sizing logic (lines 261-274). The mobile template
popover wiring (`useFocusTrap`/`useClickOutside`/ `useListArrowNav`, lines
88-114) belongs with the content, not the chrome. Layer-first placement per
`src/architecture.md:117` — it stays in `src/components/`.

## Related work

- IMPRV-009 — the reusable modal component this extraction feeds
- IMPRV-010 — presents the extracted content in that modal
- BUG-003 — desktop full-height pinning so the template list reaches the
  viewport bottom
- BUG-017 — sizing against `<main>` instead of the viewport
- DSGN-001 — Y-axis rail affordance in the builder form
- A11Y-016 — mobile template popover dialog semantics
- BUG-005 — trigger-toggle dismissal of the popover
- IMPRV-002 — responsive master-detail template picker redesign
- IMPRV-005 — arrow-key navigation through the template list

## Working

- Re-validated: `FrameworkBuilder.tsx` still carried both halves — authoring
  state/picker/form (lines 24-259) and screen chrome (header row 275-283,
  BUG-003/BUG-017 sizing 261-274) — in one component.
- Tests first: `FrameworkBuilderContent.test.tsx` asserts the seam — the content
  renders picker + form from `editingFramework`/`onCreate`/`onCancel` alone,
  carries no page heading or sidebar toggle, reports submit and Cancel through
  its callbacks, and pre-fills from an editing target.
- Extracted `FrameworkBuilderContent.tsx`: all authoring state, the `list` and
  `form` constants, the mobile popover wiring (BUG-005/A11Y-016 behaviors), and
  the three layout branches moved verbatim. `FrameworkBuilder` is now pure
  chrome: sizing wrapper, title row, sidebar toggle, ghost Cancel, and one
  `<FrameworkBuilderContent>` render.
- The pre-existing `FrameworkBuilder.test.tsx` suite (36 tests) passed with zero
  edits — not even import changes — confirming behavior preserved. Full suite
  green at 470 tests; tsc clean.
