---
id: IMPRV-011
type: improvement
status: open
created: 2026-07-28
---

# IMPRV-011: show framework name and doc summary above the builder's Customize section

## Problem

When a user picks a template in the framework builder, nothing above the
"Customize" section identifies or explains the chosen framework — the template's
name lands only inside the "Framework Name" input
(src/components/FrameworkBuilderContent.tsx:179-258; the form's first
SectionLabel is "Customize" at line 182). The one-sentence summaries documented
at the top of each of the 31 docs/frameworks/\*.md files (blockquote under the
H1, added in commit b84c1b0) exist only in the docs and are not surfaced
anywhere in the app.

## Goal

The builder teaches at the moment of choice — selecting a template shows what
the framework is and what it is for.

## Outcome

With a template selected in the framework builder, the framework's name and its
one-sentence summary (matching the blockquote at the top of the corresponding
docs/frameworks/\*.md) are visible above the "Customize" section, on both mobile
and desktop; with Blank / Custom selected, no summary is shown. Verifiable for
all 31 templates.

## Why it matters

The short `description` field shown in the picker list is terse; the researched
one-sentence summaries capture each framework's core distinction (the axes
tension and payoff). Once focus moves from the picker to the form, users get no
confirmation of what they picked or why it's shaped that way — the research
investment in the docs never reaches the UI.

## Discovery notes

The summaries live only in markdown (`> **Hook:** rest of sentence…`), so they
must become app data; a `summary` field on FrameworkTemplate (src/types.ts:37)
alongside the existing `description` is one route. Docs should stay the source
of truth — Vitest runs in Node, so a unit test can read docs/frameworks/\*.md
and assert each template's summary matches its doc's blockquote, giving
objective validation and a drift guard. Doc filenames are kebab-case slugs of
template names and all 31 map 1:1. The summary format includes a bold hook
(`**Urgent vs. important:** …`) — the maker decides whether to keep that
emphasis or flatten to plain text. Scope is the create flow only: edited
frameworks (`editingFramework`) don't record their source template, so the edit
flow (SectionLabel "Framework") has nothing to show and is out of scope.

## Related work

- FEAT-002 — quadrant model template library with descriptions
- IMPRV-002 — responsive master-detail template picker
- IMPRV-005 — arrow-key navigation through the template list
- IMPRV-008 — extracted FrameworkBuilderContent from screen chrome
- IMPRV-010 — builder presented in the shared modal
- commit b84c1b0 — added the one-sentence summary line to all 31 framework docs
