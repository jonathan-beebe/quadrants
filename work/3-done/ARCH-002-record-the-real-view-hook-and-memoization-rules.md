---
id: ARCH-002
type: architecture
status: resolved
created: 2026-07-29
---

# ARCH-002: record the real view/hook and memoization rules

## Problem

`src/architecture.md:50-53` says views "never [import] an adapter or a hook that
owns state; state and effects reach them as props." Deliberate, consistent
practice differs: ten components import interaction hooks, several of which own
state or read live browser signals (`useIsMobile` widely; `useDragAndDrop` in
`QuadrantCanvas`, whose DOM refs only exist there; `useVisualViewportHeight` in
`EditModal`), while the domain- and adapter-owning hooks (`useFrameworks`,
`useFrameworkSharing`, `useRouting`, `useDarkMode`) are used only by `App`. The
written rule and the practiced rule disagree, so the doc cannot adjudicate the
next placement question — and this sweep had to reverse-engineer the real rule
from imports. Separately, the codebase's memoization stance — no `React.memo`,
callback stability only where a consumer structurally requires it — is applied
consistently but recorded nowhere.

## Goal

The architecture doc states the rules the codebase actually follows, precisely
enough to settle placement questions.

## Outcome

`src/architecture.md` distinguishes domain state and adapter effects (reach
views as props from the composition root) from ephemeral interaction and
browser-signal hooks (views may use directly), such that every current import in
`src/components/` is either legal under the stated rule or a recorded exception;
the memoization convention is recorded with its rationale; the layer table and
module diagram agree with the amended text.

## Why it matters

A layer rule whose letter contradicts practice trains readers to ignore the doc
— the opposite of what ARCH-001 built it for. Unrecorded conventions
(memoization) get relitigated in every review and are invisible to new
contributors and to future refactor sweeps like this one.

## Discovery notes

(advisory) The distinction agent-visible in practice: hooks App must own are
those touching domain state or adapters; hooks views may own are gesture,
viewport, and focus concerns whose refs live in the view's subtree
(`useDragAndDrop`'s quadrant refs are the clearest case). `DesignSystem.tsx`'s
comment warning against calling `useDarkMode` twice is the fork-risk rationale
worth capturing. RFCTR-021 (if accepted) is the enforcement sweep of the
memoization convention this ticket records.

## Related work

- ARCH-001 — the doc this amends
- RFCTR-008 — precedent for recording ownership rules with re-open triggers
- RFCTR-021 — companion sweep enforcing the memoization convention

## Working

- Re-validated by grepping hook imports: 11 component files import interaction
  hooks (`useFocusTrap`, `useClickOutside`, `useMenuKeyboardNav`, `useIsMobile`,
  `useListArrowNav`, `useExpectsOnScreenKeyboard`, `useDragAndDrop`,
  `useVisualViewportHeight`); the domain/adapter hooks (`useFrameworks`,
  `useFrameworkSharing`, `useRouting`, `useDarkMode`) appear only in `App.tsx`;
  no view imports an adapter; no `React.memo` anywhere. The one strict-rule
  violation left was `QuadrantCanvas`'s type-only `ShareResult` import.
- Amended the Views paragraph with the two-kind rule (App-owned domain/adapter
  hooks reach views as props; ephemeral interaction and browser-signal hooks are
  called directly), a placement test ("could two call sites ever disagree?"),
  and a type-only-import exemption covering `ShareResult`. The
  `DesignSystem.tsx` fork-risk comment is the recorded rationale.
- Layer table's Coordination row now points at that rule; the module diagram
  gained an interaction-hooks node and a labeled views→interaction edge; the
  cross-ring caption explains `hooks/` spans coordination and view rings.
- Recorded the memoization convention as an accepted decision (render
  unmemoized; `useCallback`/`useMemo` only where identity is structurally
  required; re-open on profiled jank) plus a `### Memoization` section with the
  removal test. RFCTR-021 cited as the enforcement sweep.
- Doc-only change: no new tests per the architecture type; full suite run before
  commit.
