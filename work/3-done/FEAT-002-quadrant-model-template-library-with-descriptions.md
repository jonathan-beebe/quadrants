---
id: FEAT-002
type: feature
status: resolved
created: 2026-06-10
resolved: 2026-06-10
---

# FEAT-002: quadrant model template library with descriptions

## Problem

The framework template picker (src/components/FrameworkBuilder.tsx:59-70) offers
only six presets from src/templates.ts. None define colors, so every preset
renders with the same default palette; three have empty axis labels; and the
picker shows only a name plus the four quadrant labels, so a user must already
know a model to recognize whether it fits. The vetted library in
work/0-research/quadrant-model-library.md — 17 additional well-known models with
names, axes, quadrant labels, colors, and rationale, plus axis/color retrofits
for the six shipped presets — is not implemented.

## Outcome

When creating a framework, the user sees all library models (the 17 from the
research doc plus the six existing presets) in the template picker; each entry
shows a one-line description of when to use it, scannable alongside the name;
picking any template produces a framework whose name, axis labels, quadrant
labels, and per-quadrant colors match the research doc's spec (for retrofitted
presets, the retrofit section); no two presets render with an identical color
set; and the full test suite passes with template invariants (4 quadrants,
non-empty labels, valid palette colors, description present) covered.

## Why it matters

The template library is the on-ramp to the product's core value. Today a user
who doesn't already know the Eisenhower Matrix gets no help choosing, and the
six identical-looking presets undersell the app's color system. The researched
library turns the picker into a reason to use the app.

## Discovery notes

Advisory — FrameworkTemplate already has optional `colors` consumed at
src/storage.ts:45, so the color retrofit needs no schema change; `description`
is the only new field (src/types.ts:25-31). The picker grid is
src/components/FrameworkBuilder.tsx:59-70 (flat 2-column grid; name + quadrants
joined in a Caption). src/**tests**/templates.test.ts holds the template
invariants to extend. applyTemplateEdit (src/logic/framework.ts:44) deliberately
preserves user-chosen quadrant colors on structure edit — template colors apply
at creation time only. The research doc tiers models Core (9) / Extended (8) as
a sequencing aid and notes a flat grid gets unwieldy near 20 entries (categories
deferred to a future ticket) — Core-first ordering mitigates. All proposed
colors are drawn from colorPresets in src/colors.ts. The Vision × Execution
model must not ship under the trademarked "Magic Quadrant" name. Per WCAG 1.4.1
color stays reinforcement-only — the description text carries the meaning.
One-line descriptions can be compressed from each model's "Why it works"
paragraph in the research doc.

## Related work

- work/0-research/quadrant-model-library.md — the spec for all template data
- commit f3a0497 — fix: rename Strengths/Weaknesses/Opportunities/Threats to
  SWOT Analysis
- commit 69f414f — fix: update Start/Stop/Continue/Change template layout and
  axes
- commit 2849c7d — fix: rename Urgent-Important Matrix to Eisenhower Matrix and
  swap columns (three content-fix commits to shipped templates — evidence that
  template data without a written spec churns)
- commit 51da673 — feat: add CRR (Cooperative Reciprocal Relationships)
  framework template

## Working

- Added optional `description?: string` to `FrameworkTemplate` (src/types.ts);
  `colors` already existed and applies at creation time via storage.ts:45.
- Rewrote src/templates.ts: 6 → 23 templates (17 new models #2–#18 + 6
  retrofitted presets), ordered Core → Extended → reflection presets. Each has
  colors + a one-line description compressed from the research doc's "Why it
  works".
- Spec conflict resolved (with approval): the research doc gave Worry Matrix the
  same ordered palette as the Eisenhower Matrix. Recolored Worry's "Accept &
  Adapt" Blue → Emerald (#34d399) so no two templates render an identical color
  set.
- Picker (FrameworkBuilder.tsx) now shows `description` instead of the quadrant
  list; color stays reinforcement-only (WCAG 1.4.1).
- Extended src/**tests**/templates.test.ts: description present, 4 palette
  colors per template, no duplicate color sets, SWOT axes, full-library roster.
  Full suite 289 passing; `npm run ci` green.
