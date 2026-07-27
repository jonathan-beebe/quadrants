---
type: research
status: candidate
created: 2026-07-26
origin: BUG-015
---

# Candidate: the app has no shared answer for "how tall is the usable viewport"

Filed automatically while working BUG-015, per `work-start/types/bug.md`. Not an
allocated ticket — no id drawn, no journal entry. For the human to promote to
`1-inbox` (via `/work-scope`) or discard.

## Why this was filed

Three pieces of work now circle the same question from different sides:

- **BUG-003** (done) — the desktop template picker stopped short of the viewport
  bottom; fixed by pinning that screen to `h-screen`.
- **BUG-015** (this one) — the mobile canvas ran _past_ the visible viewport
  bottom because `h-screen` is `100vh`; fixed by moving that one screen to
  `h-svh`.
- **RSRCH-002** (open) — what the on-screen keyboard does to the same viewport,
  still unanswered.

Each was scoped and fixed as a local symptom. The recurrence is the signal.

## The smell

`h-screen` appears six times with no stated rule for which viewport any of them
means, and after BUG-015 the codebase is deliberately inconsistent:

- `QuadrantCanvas.tsx:166` — now `h-svh` (visible viewport).
- `App.tsx:177` — `h-screen`, the app shell wrapping everything.
- `Sidebar.tsx:99` — `h-screen`, the mobile drawer.
- `FrameworkBuilder.tsx:267` — `h-screen`, gated to desktop by BUG-003.
- `ErrorBoundary.tsx:32`, `DesignSystem.tsx:257` — `h-screen` / `min-h-screen`.

BUG-015's scope was fenced to the canvas chain by explicit decision, so the
others were left alone. That fence was right for the bug and leaves a real
inconsistency behind.

## What is actually still broken

> **Superseded by BUG-017 (done, 2026-07-27).** Both paragraphs below are kept
> as written; the second was wrong, and how it was wrong is the most useful
> thing in this file. Corrections follow.

`Sidebar.tsx:99` is the mobile drawer and is still `h-screen`, so its bottom
edge extends behind mobile Safari's toolbar exactly as the canvas did. Whatever
sits at the bottom of the drawer is subject to the same occlusion BUG-015 just
fixed for the canvas. This was not verified on device — it is inferred from the
same cause.

`App.tsx:177` is the shell. It is `overflow-hidden` and the canvas now sets the
visible bottom edge, so the consequence there is cosmetic at most (a strip of
page background behind the floating toolbar), not functional.

### Correction

The shell was not cosmetic. It was the next instance of the same bug, and it was
reported from a device eight days later with screenshots: the whole page
scrolled by the toolbar's height, sliding the canvas and putting its bottom edge
back under the chrome BUG-015 had just cleared. Fixed in BUG-017 by sizing the
shell to `svh` and having everything below defer to it.

Two reasoning errors are worth keeping, because both are easy to repeat:

- **`overflow-hidden` on the shell was read as "the page cannot scroll."** It
  clips the shell's own children. It says nothing about `html`, which is what
  scrolls when `body`'s content is taller than the scrollport. BUG-015's working
  notes carried the same premise ("the page is `overflow-hidden` and never
  scrolls, so mobile Safari keeps the toolbar expanded"), which is how the claim
  survived review twice.
- **The shell was judged by what it draws rather than by what it sizes.** It
  draws only background, hence "cosmetic". But it is an ancestor of every
  screen, so its height is the one every descendant resolves against — the
  widest-reaching measurement in the app.

The general lesson for the research question: a wrong viewport unit is not a
local error at the element that carries it. Its blast radius is everything below
it, and the cost of getting it wrong scales with how high in the tree it sits.
Any convention this research lands on should be strictest at the root.

BUG-017 also found that a fix at one level relocates the problem rather than
removing it unless the whole chain is reconciled — `FrameworkBuilder` and
`ErrorBoundary` each asserted the large viewport independently and would have
turned the document scroll into an internal one. That is direct evidence for
this file's premise: per-screen answers do not compose.

### What is still open after BUG-017

The inconsistency this file was filed about is closed in the sense that no
surface inside the shell claims the large viewport any more, and
`viewportLock.test.ts` now holds that line mechanically. What is _not_ settled
is the question itself: the invariant is enforced by a test rather than
expressed anywhere a developer would naturally look, and nothing states when a
surface should use `svh` versus defer to its container with `h-full` — BUG-017
made that call five times by hand. RSRCH-002's third viewport state (the
keyboard) is still unanswered and still likely to multiply the same problem.

## What research would settle

Whether the app should have one viewport-height convention — when a surface
means the large viewport, when it means the visible one, and where that decision
is expressed so it is not re-litigated per screen. Note this interacts with
RSRCH-002: the keyboard is a third viewport state, and answering it per screen
will multiply the same inconsistency. Sequencing the two may matter more than
either alone.

Also worth settling: whether `viewport-fit=cover` is ever wanted. BUG-015 found
the default `auto` already keeps content clear of the home indicator, so `cover`
would create work rather than solve it — but that reasoning currently lives only
in a resolved ticket's working notes.
