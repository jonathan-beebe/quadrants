---
type: research
status: promoted
created: 2026-07-26
origin: BUG-014
promoted: RFCTR-008
---

# Candidate: mobile drawer focus ownership is split across App and Sidebar

Filed automatically while working BUG-014, per `work-start/types/bug.md`. Not an
allocated ticket — no id drawn, no journal entry. For the human to promote to
`1-inbox` (via `/work-scope`) or discard.

> **Promoted 2026-07-27 to RFCTR-008**, resolved 2026-07-28 (now in
> `work/3-done/`). The findings and recommendation below are the scope packet it
> was written from; the two out-of-scope focus-restore defects noted there
> (`ConflictDialog`, `EditModal`) are filed as A11Y-021 and A11Y-022.

## Why this was filed

BUG-014 is the sixth ticket on the mobile sidebar drawer: BUG-005, A11Y-004,
A11Y-005, A11Y-016, BUG-012, BUG-013. That recurrence is the signal; the
specific smell found while fixing it is below.

## The smell

Responsibility for the drawer's focus and modality is split across two
components with no stated contract between them:

- `Sidebar.tsx` owns the modal semantics — `role="dialog"`, `aria-modal`, the
  focus trap, Escape-to-close, focus-on-open, and restore-focus-on-close
  (`Sidebar.tsx:51,58-70`, from A11Y-005).
- `App.tsx` owns the state the modality is derived from (`sidebarOpen`), the
  `inert` on `<main>`, the render-time breakpoint re-sync (BUG-012), and now the
  post-navigation focus landing (BUG-014).

The two now actively compete. BUG-014's fix works because App's effect runs
after Sidebar's cleanup — parent effects commit after child effects — so App's
`mainRef.focus()` overwrites Sidebar's restore of a node the navigation had
already detached. That ordering is load-bearing and invisible; it survives only
as a code comment. BUG-012 hit the same class of problem from the other side and
was solved by moving work _out_ of effects into render.

## What research would answer

1. Whether the drawer's modality — open state, focus trap, focus restoration,
   `inert` on the background — should be owned by one component or hook instead
   of split across two, and what that would cost.
2. Whether a single owner would have prevented any of the six prior tickets, or
   whether they were independent defects that merely share a surface.
3. Whether the project already has a pattern to reuse here — `useFocusTrap` is
   shared with `ConflictDialog`, so there may be a general modal-surface
   contract worth naming rather than a sidebar-specific fix.

## What it would contribute

Either a decision to consolidate ownership (with follow-up tickets), or a
recorded decision to accept the split with the effect-ordering contract written
down somewhere more durable than a comment. Both outcomes end the pattern of
discovering the ordering rule afresh each time this surface is touched.

---

## Findings (researched 2026-07-27)

### The recurrence premise is weaker than filed — 2 of 7, not 6 of 6

The tickets above share a **file**, not a **concern**. Read individually:

| Ticket   | Actually about                                                                                   | Ownership split?     |
| -------- | ------------------------------------------------------------------------------------------------ | -------------------- |
| BUG-005  | `mousedown`-vs-`click` race in `useClickOutside`; hit FrameworkBuilder identically               | No                   |
| A11Y-004 | `opacity-0` hover reveal on a per-row trigger                                                    | No                   |
| A11Y-005 | Introduced the modal behavior                                                                    | Origin, not a defect |
| A11Y-016 | FrameworkBuilder's template picker — not the sidebar at all                                      | No                   |
| BUG-012  | App owns `sidebarOpen`; Sidebar derives `isModal` from it plus its own `useIsMobile()`           | **Yes**              |
| BUG-013  | Placement of the floating opener button                                                          | No                   |
| BUG-014  | Nobody owned "the drawer's purpose is spent"; the fix then collided with Sidebar's focus restore | **Yes**              |

Only BUG-012 and BUG-014 are ownership-split defects. They are, however, the two
most recent, and they are the two that produced the invisible contract.

### The single owner cannot be Sidebar

Two of the four responsibilities target nodes `Sidebar` does not render: `inert`
goes on `<main>` (`App.tsx:225`) and the post-navigation focus landing targets
`<main>` as well. `sidebarOpen` additionally drives the desktop layout margin
(`App.tsx:226`) and reaches three screens as a prop. The state cannot move down.
The single owner has to be `App`, or a hook `App` calls.

### The pattern is real but wider than the drawer

Four `aria-modal` surfaces now: `Sidebar.tsx:95`, `ConflictDialog.tsx:30`,
`EditModal.tsx:67`, `FrameworkBuilder.tsx:308`. `useFocusTrap` covers exactly
two of six modal responsibilities — Tab cycling and Escape. Focus-on-open,
focus-restore-on-close, backdrop, and background-`inert` are hand-rolled at
every site, and **ConflictDialog and EditModal omit focus restore entirely**.
`EditModal` is the newest surface in the codebase and still omits it, so the
pattern is propagating, not settling.

### Focus restore is untested — neither this file nor BUG-014 caught it

`Sidebar.test.tsx:208` asserts focus-on-open; `App.test.tsx:230` asserts the
post-navigation landing. Nothing asserts that a plain Escape/backdrop dismiss
returns focus to the opener. One side of the race the load-bearing comment
arbitrates has no test at all: if Sidebar's restore silently broke, the suite
stays green.

## Recommendation

**Consolidate the drawer under `App` via a `useDrawerModality` hook. Do not
build a general modal primitive yet.**

The reason is not the split itself — it is that correctness currently rests on
React committing child effects before parent effects, documented in one comment,
untested on one side. One owner removes that: "where does focus go when the
drawer closes" becomes a single decision made from data (was this close a
navigation, or a plain dismiss?) rather than a race resolved by commit order.
The ordering comment stops being load-bearing because there is no second party.

1. **Write the missing test first** — focus-restore-on-plain-dismiss, against
   current code, where it should pass. Without it the refactor is unfenced on
   exactly the behavior it changes.
2. **Extract `useDrawerModality` into `src/hooks/`** — owns `sidebarOpen`, the
   BUG-012 breakpoint re-sync, `isModal`, the `inert` decision for `<main>`,
   focus-on-open, and the single focus-on-close decision. `Sidebar` becomes
   presentational (`open`, `isModal`, `onKeyDown`). Layer-legal: `src/hooks/` is
   Coordination per `architecture.md:47`, alongside `useFocusTrap`,
   `useClickOutside`, `useIsMobile`. About 15 existing behavioral tests already
   pin the outcomes (4 from A11Y-005, 2 from BUG-012, 7 from BUG-014).
3. **Record the decision in `src/architecture.md`** — the drawer's modality is
   owned by `App` through the hook; re-open when a third surface needs to inert
   something outside itself. `CLAUDE.md` names that file as where decisions live
   and it currently says nothing about modality, which is why the ordering rule
   was rediscovered each time.

Moves 2 and 3 are the same complaint from opposite ends: move 2 turns a comment
into structure so there is nothing left to narrate; move 3 turns knowledge that
never reached a comment into prose. If the change is not worth spending, moves 1
and 3 alone capture most of the value at a fraction of the cost — but note that
both prior defects are already fixed, so the whole recommendation buys no
user-visible improvement, only the removal of a fragile invisible contract.

### File separately, not as part of this

`ConflictDialog` and `EditModal` do not restore focus on close (WCAG 2.4.3).
Defects on their own merits; they should not wait on a refactor. `EditModal`'s
is latent — only `DesignSystem` renders it today — but RSRCH-002 will wire it
into the mobile edit path.

### Explicitly not recommended

A general `useModalSurface`. The four surfaces differ in ways a shared hook
would have to parameterize away: the drawer inerts a sibling, `ConflictDialog`
is inerted by a wrapper `div` (`App.tsx:185`), `EditModal` inerts nothing, the
picker is a click-outside popover. Simplicity-first: name the contract in prose
and revisit when a third surface needs background-`inert`, or when the two focus
restores above land and turn out identical.

### Corrections to this file

- "BUG-014 is the sixth ticket" — six priors are listed, so it is the seventh.
- `Sidebar.tsx:51,58-70` does not contain `role="dialog"`/`aria-modal`; those
  are at `Sidebar.tsx:95-96`. Filing imprecision, not drift.
- `useFocusTrap` is described as shared with `ConflictDialog`; it now has four
  consumers (`ConflictDialog`, `Sidebar`, `FrameworkBuilder`, `EditModal`).
