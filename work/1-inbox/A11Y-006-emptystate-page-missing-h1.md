---
id: A11Y-006
type: a11y
status: open
created: 2026-05-29
---

# A11Y-006: EmptyState page missing h1

## Problem

When no framework is selected and `src/components/EmptyState.tsx` is rendered,
the page has no `<h1>`. EmptyState's "No framework selected" is an `<h2>` (line
14), and the sidebar's "Quadrants" brand is a `<span>`
(`src/components/Sidebar.tsx:78`). Heading hierarchy on the page therefore
starts at h2 with nothing above it for screen reader heading navigation.

## Outcome

When the EmptyState is the main view, the page exposes an `<h1>` as the
document's top-level heading (visible or visually-hidden), and the existing "No
framework selected" heading becomes secondary to it.

## Why it matters

WCAG 1.3.1 Info and Relationships (Level A) and WCAG 2.4.6 Headings and Labels
(Level AA). Skipping h1 leaves AT users without a top-level landmark and
disrupts screen reader heading navigation in a single-page app where the
EmptyState is a real, addressable view.

## Discovery notes

`PageTitle` (`src/components/atoms/PageTitle.tsx`) defaults to `h1` and is used
as the framework title in `QuadrantCanvas`. When no framework is active, there
is no equivalent.

## Recommendation

Either promote "No framework selected" to h1 (use `<PageTitle>` instead of
`<h2>` in EmptyState and re-style as needed), or add a visually-hidden `<h1>` to
the app shell (e.g. the app's name "Quadrants") that is always present. The
first option keeps a single h1 per view.
