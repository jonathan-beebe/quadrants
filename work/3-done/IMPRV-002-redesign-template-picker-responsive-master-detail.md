---
id: IMPRV-002
type: improvement
status: resolved
created: 2026-06-10
resolved: 2026-06-10
---

# IMPRV-002: redesign template picker as responsive master-detail with preview near the top

## Problem

The framework template picker (src/components/FrameworkBuilder.tsx) renders all
23 templates (post-FEAT-002) as a flat 2-column grid stacked above the "build
your own" form, so the live colored quadrant preview sits far below the fold —
poor on large screens and worse on mobile, where the long list fills the small
viewport and the preview/edit area is only reachable after heavy scrolling.

## Outcome

On large screens, the picker is a master-detail view: a scrollable rich list of
templates beside an editable detail pane — reachable without scrolling — showing
the selected template's name, axis labels, and a live, color-accurate 2x2
quadrant preview; selecting a list entry updates the detail in place, and the
user edits fields and creates the framework from that pane. On small screens,
the template list is a collapsed dropdown so it does not push content down; the
editable detail and its live preview are the main content, visible without
scrolling past the list. The list's first entry is "Blank / Custom", whose
detail is the empty editable form (today's build-your-own path). The list is
organized by category (the FEAT-002 research groupings) and offers a text filter
narrowing entries by name/description. Creating from any selection — template or
custom — yields the same result as today (correct name, axes, quadrant labels,
per-quadrant colors); editing an existing framework is unaffected. The full test
suite passes, covering: selecting a template updates the detail/preview, the
custom entry yields a blank form, the filter narrows the list, and create still
emits the correct payload (including colors).

## Why it matters

The picker is the on-ramp to the product's core value. After FEAT-002 grew the
library to 23, the grid-over-form layout buries the preview — the very thing
that helps a user recognize and commit to a model — and is especially broken on
mobile, a primary PWA target. A list/detail with the preview up top makes the
richer library usable instead of overwhelming.

## Discovery notes

Current structure: template grid FrameworkBuilder.tsx:56-72; build-your-own form

- live preview inputs ~90-131; colors flow into the create payload via
  handleSubmit (FEAT-002 fix). Component is shared by create and edit; edit mode
  hides the picker (!editing). Categories aren't in the data model —
  templates.ts has no category field. The research doc
  (work/0-research/quadrant-model-library.md) proposes: Prioritize, Strategize,
  Understand, People & Self, Build, Retrospect. Maker decides whether to add a
  category field or map names in the picker. Strict-WCAG surface: a
  master-detail list is typically a listbox/radiogroup driving a detail region;
  mobile dropdown should follow the existing focus-trap/Escape drawer pattern.
  Keep tabular-numbers and color-as-reinforcement-only conventions. useIsMobile
  breakpoint is max-width: 768px.

## Recommendation

Reshape create mode into master-detail: left rich list (grouped sections +
filter input), right editable detail (reuse the existing name/axis/quadrant
inputs + colors state from the FEAT-002 fix as the live preview), detail
rendered near the top. Add a synthetic "Blank / Custom" entry at the top that
resets the detail to the empty form. On mobile, collapse the list into a
disclosure/dropdown reusing the Sidebar drawer's focus-trap + Escape pattern,
with detail+preview as primary content. Derive categories from the research doc;
simplest is a category field on FrameworkTemplate, ordered Prioritize →
Strategize → Understand → People & Self → Build → Retrospect. Preserve the
create/edit payload contract (name, axes, quadrants, colors); leave edit-mode
behavior untouched beyond shared code.

## Related work

- FEAT-002 (work/3-done) — expanded the library to 23 templates with colors +
  descriptions; cause of the length problem and source of the category groupings
  and description text.
- commits ecb4ee0, 865be0a — FEAT-002 library + builder color-passthrough fix
  (create payload now carries colors; the redesign must preserve this).
- A11Y-005 (work/3-done) + commit c1765b8 — mobile Sidebar drawer
  focus-trap/Escape pattern to reuse for the mobile dropdown.
- useIsMobile() (src/hooks/useIsMobile.ts) and MobileQuadrantGrid — existing
  responsive patterns.

## Working

Plan (TDD):

- types.ts: add `TEMPLATE_CATEGORIES` (ordered) + `TemplateCategory` union;
  `FrameworkTemplate.category?: TemplateCategory` (optional — custom/edit
  payloads omit it, mirroring `colors`/`description`).
- templates.ts: tag all 23 with a category (Prioritize/Strategize/Understand/
  People & Self/Build/Retrospect) per the research doc.
- FrameworkBuilder create mode → master-detail: left rich list (filter input +
  category groups + a "Blank / Custom" entry) and right editable detail (reuse
  existing name/axis/quadrant inputs + colors live preview). Desktop = two
  columns; mobile (useIsMobile) = list behind a dropdown (focus-trap + Escape +
  click-outside, reusing useFocusTrap/useClickOutside). Edit mode unchanged.
- Preserve the create payload (name/axes/quadrants/colors).

### Outcome

- types.ts: added `TEMPLATE_CATEGORIES` (ordered) + `TemplateCategory` union and
  `FrameworkTemplate.category?` (optional, like colors/description).
- templates.ts: tagged all 23 templates with a category.
- FrameworkBuilder rewritten:
  - Desktop create mode is a two-column master-detail (grid 280px / 1fr): a
    scrollable rich list (filter searchbox + category groups + a "Blank /
    Custom" entry) on the left, the editable detail + live colored preview on
    the right, visible at the top with no scrolling.
  - Mobile create mode collapses the list behind a dropdown trigger
    (aria-haspopup/aria-expanded) in a role=dialog panel with focus-trap +
    Escape (useFocusTrap) + click-outside (useClickOutside); the detail/preview
    is the primary content. Selecting closes the dropdown and returns focus to
    the trigger.
  - Selecting an entry updates the detail in place; selected entry carries
    aria-current="true". Edit mode unchanged (picker hidden, single form).
  - Create payload contract preserved (name/axes/quadrants/colors).
- Tests: FrameworkBuilder.test.tsx covers selection-updates-detail, custom→blank
  form, filter-narrows-list, category headings, desktop list visible, and the
  mobile dropdown (collapsed by default, opens on trigger, Escape closes,
  select-closes-and-fills). templates.test.ts asserts every template has a known
  category. Full suite 288 passing; `npm run ci` green.
