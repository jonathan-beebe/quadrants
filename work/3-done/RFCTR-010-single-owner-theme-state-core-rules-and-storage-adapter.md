---
id: RFCTR-010
type: refactor
status: resolved
created: 2026-07-28
---

# RFCTR-010: single-owner theme state with core rules and a storage adapter

## Problem

Theme state violates the layer rules recorded in src/architecture.md in three
ways.

1. **Adapter bypass.** `src/hooks/useDarkMode.ts` reads/writes localStorage
   directly — `STORAGE_KEY 'quadrants_theme_mode'` (line 5),
   `LEGACY_KEY 'quadrants_dark_mode'` (line 6), a legacy-key migration inside
   `getInitialMode()` (lines 19-32), and a save effect (lines 48-50). Adapters
   are "one module per external thing"; `src/storage.ts` is the localStorage
   adapter, so localStorage now has writers in two layers and theme persistence
   has no adapter at all.
2. **Pure rules inline in the shell.** `resolveIsDark(mode, isSystemDark)`
   (lines 34-37), the cycle order system→light→dark→system (lines 52-58), and
   the legacy migration mapping `'true'`→`'dark'` (line 26) are pure domain
   rules living in the hook, only testable through `renderHook` in the jsdom
   project (`src/__tests__/hooks/useDarkMode.test.ts`).
3. **Two live owners of one piece of state.**
   `src/components/DesignSystem.tsx:490` — a view — calls `useDarkMode()`
   itself, while `App.tsx:39` also calls it; `App.tsx:162` renders
   `<DesignSystem />` via early return without unmounting App, so both hook
   instances are mounted simultaneously, each owning an independent `mode` while
   both write `document.documentElement.classList` and the same localStorage
   key. Cycling the theme on the design system screen leaves App's instance
   stale: back in the main app the sidebar's ThemeToggleButton shows the wrong
   mode and the next cycle jumps from the stale value.

Views also import the `ThemeMode` type from the hook
(`src/components/Sidebar.tsx:11`,
`src/components/atoms/ThemeToggleButton.tsx:3`) rather than from a shared/core
location.

## Goal

Theme behavior factored like every other concern — pure rules in the core,
persistence behind an adapter, exactly one state owner — so the stale-toggle
symptom is structurally impossible.

## Outcome

1. The pure theme rules — dark/light resolution, the cycle order, the
   legacy-value migration mapping — and the `ThemeMode` type reside in the core
   (`src/logic/` or a pure shared module), directly unit-tested in the node
   "core" vitest project.
2. Theme persistence goes through an adapter module like other localStorage
   access; no module under `src/hooks/` touches localStorage
   (`git grep localStorage src/hooks/` returns no hits).
3. Theme state has exactly one mounted owner: DesignSystem receives theme state
   and callbacks as props (as Sidebar already does), no view imports a
   state-owning theme hook, and views get `ThemeMode` from its shared/core
   location.
4. Cycling the theme on the design system screen and returning to the main app
   shows the now-current mode on the sidebar's ThemeToggleButton, and the next
   cycle continues from it — protected by a test.
5. Observable theme behavior is otherwise unchanged: three-way cycle,
   system-following via prefers-color-scheme, persistence across reloads,
   legacy-key migration; full suite green, tsc clean.

## Why it matters

Users hit a real bug — the theme toggle shows the wrong mode and skips states
after visiting the design system — and it is unfixable point-wise because two
independent owners write the same DOM class and storage key, with correctness
resting on mount order. The factoring also violates all three recorded layer
rules (ARCH-001): a second localStorage writer outside the adapter ring, domain
rules untestable except through `renderHook` in the slower jsdom project, and a
view owning app state.

## Discovery notes

Advisory. The single owner most naturally stays at the composition root: App.tsx
already owns the hook and passes `themeMode`/`isDark`/`onCycleTheme` to Sidebar
(App.tsx:190-192); DesignSystem can take the same three props — it renders
ThemeToggleButton in three places (DesignSystem.tsx:505,566,589), at least some
as gallery demos, all of which can render from the same props. A theme adapter
beside storage.ts wrapping both keys (read, migrate, write) fits the "one module
per external thing" rule if kept as the same localStorage module or a sibling —
the pure migration mapping and value validation delegate to the core, matching
the `logic/routing.ts` vs `routing.ts` pure/effect naming precedent. The
`matchMedia('(prefers-color-scheme: dark)')` subscription is also an
external-thing concern; whether it moves behind an adapter or stays in the
hook's `useSyncExternalStore` wiring is the maker's call. Existing tests can
split: the pure-rule cases in useDarkMode.test.ts move nearly verbatim to
`src/__tests__/logic/`; the hook file keeps shell coverage; outcome 4 wants an
integration-style test cycling on the design system screen and asserting the
sidebar toggle after returning. This is a factoring correction, not a redesign —
do not change the cycle order, the resolved themes, or the migration semantics.

## Working

- New `logic/theme.ts` owns ThemeMode, `isThemeMode`, `resolveIsDark`,
  `nextThemeMode` (the settled cycle order), `migrateLegacyDarkFlag` — tested in
  the node core project.
- Theme persistence joined `storage.ts` (the localStorage adapter):
  `loadThemeMode` (validation + one-time legacy migration) and `saveThemeMode`.
  `git grep localStorage src/hooks/` is empty.
- `useDarkMode` is now a shell: state, matchMedia subscription, dark-class and
  save effects; `cycleMode` is `setMode(nextThemeMode)`. The maker call on
  matchMedia: it stays in the hook's `useSyncExternalStore` wiring — it is
  already a subscription adapter in shape, and a separate module would add
  indirection with one consumer.
- DesignSystem now takes `themeMode`/`isDark`/`onCycleTheme` props (as Sidebar
  does); App is the only `useDarkMode()` caller, so the two-owner stale toggle
  is structurally impossible. Views import ThemeMode from `logic/theme`.
- Red-first bug test in App.test.tsx: cycle on /design-system, popstate back,
  sidebar toggle must show the new mode and continue the cycle from it — failed
  against the old code at exactly the stale-owner point, passes now.
- Old hook tests split: rules → theme.test.ts, persistence/migration →
  storage.test.ts, hook file keeps shell wiring. Suite 518 green, tsc clean.

## Related work

- RFCTR-009 — inbox; same core-extraction pattern for useDragAndDrop
- RFCTR-006 — extract keyboard-size judgment into the core
- RFCTR-004 — window/history side effects out of logic/routing
- RFCTR-005 — adapter-ring precedent: split domain factories out of the storage
  adapter
- IMPRV-003 — extract pure framework validation from the storage shell
- RFCTR-002 — settled theme naming: `cycleMode` on the hook, `onCycleTheme` at
  component boundaries
- ARCH-001 — the layer rules
- commit f7f4b1d — introduced the three-way toggle and legacy migration
- commit 757284c — extracted ThemeToggleButton
- commit 502c5a6 — hook tests
