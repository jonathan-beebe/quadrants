---
id: IMPRV-012
type: improvement
status: open
created: 2026-07-29
---

# IMPRV-012: tabular figures for all numbers via one base rule

## Problem

The project convention (CLAUDE.md) says all numbers render with tabular figures,
but enforcement is per-site and already has gaps: `Badge` applies `tabular-nums`
(`src/components/atoms/Badge.tsx:10`), while the sidebar's item counts
(`src/components/Sidebar.tsx:144`, via `Caption`) and the version line
(`Sidebar.tsx:197`) render proportional figures. Nothing makes the next numeric
surface comply — the convention holds only when someone remembers a utility
class.

## Goal

Every number in the app renders tabular by default, with no per-site opt-in to
forget.

## Outcome

All numeric UI — badge counts, sidebar item counts, the version hash, the
design-system gallery's numerics — renders with tabular figures without
per-component classes, and a numeric surface added tomorrow complies with zero
effort. Visual diff elsewhere is nil (letterforms unchanged; only digit advance
widths align).

## Why it matters

Mixed figure styles misalign the very counts the convention exists to align —
the sidebar list is the visible case today. A stated convention that fails by
default (forgotten class) rather than holding by default is a recurring-defect
generator; one categorical rule deletes the category.

## Discovery notes

(advisory) A base-layer `font-variant-numeric` rule in `src/index.css` is one
candidate mechanism — the system font stack supports tabular figures. If a
global rule lands, `Badge`'s per-site class becomes redundant and can go.

## Related work

- CLAUDE.md — records the tabular-numbers convention
