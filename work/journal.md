# Work Journal

## Next ticket numbers

- RSRCH: 3
- DSGN: 3
- ARCH: 2
- FEAT: 4
- IMPRV: 12
- MAINT: 10
- A11Y: 23
- RFCTR: 14
- BUG: 19

## Log

- 2026-07-28:21:24:51 — RFCTR-013 — done: editStructure delegates to
  replaceFramework; structuredClone unified in logic/framework
- 2026-07-28:21:23:36 — RFCTR-013 — started
- 2026-07-28:21:22:33 — RFCTR-012 — done: share-url and export-filename rules
  extracted to the core; illegal-character filenames fixed
- 2026-07-28:21:18:55 — RFCTR-012 — started
- 2026-07-28:21:17:34 — RFCTR-011 — done: path-id rules take the base
  explicitly; non-root base pinned with literal tests
- 2026-07-28:21:15:36 — RFCTR-011 — started
- 2026-07-28:21:14:33 — RFCTR-010 — done: theme rules in logic/theme,
  persistence in the storage adapter, App the single owner; stale design-system
  toggle fixed
- 2026-07-28:21:09:05 — RFCTR-010 — started
- 2026-07-28:21:07:35 — RFCTR-009 — done: drop-geometry rules moved to
  logic/items beside the canonical envelope; hook is a thin shell
- 2026-07-28:21:03:15 — RFCTR-009 — started
- 2026-07-28:21:02:17 — MAINT-009 — done: error boundary fallback, reset, and
  App-level crash recovery covered by tests
- 2026-07-28:20:58:54 — MAINT-009 — started
- 2026-07-28:20:57:52 — IMPRV-011 — done: template name + doc summary shown
  above Customize, drift-guarded against docs/frameworks
- 2026-07-28:20:46:50 — IMPRV-011 — started
- 2026-07-28:20:41:41 — BUG-018 — done: drag preview anchored in client space
  via container-relative positioning; drop path verified self-consistent under
  pinch zoom
- 2026-07-28:20:30:15 — BUG-018 — started
- 2026-07-28:20:27:58 — BUG-018 — defined: drag preview and drop ignore pinch
  zoom in zoomed cell view
- 2026-07-28:20:18:35 — IMPRV-011 — defined: show framework name and doc summary
  above the builder's Customize section
- 2026-07-28:20:14:02 — RFCTR-013 — defined: delegate editStructure to
  replaceFramework and unify deep-clone idiom
- 2026-07-28:20:10:03 — MAINT-009 — defined: test-cover error boundary crash
  recovery and reset flows
- 2026-07-28:20:08:08 — RFCTR-012 — defined: extract pure share-url and
  export-filename rules from useFrameworkSharing
- 2026-07-28:20:05:29 — RFCTR-011 — defined: parameterize core path-id rules by
  base and test non-root base
- 2026-07-28:20:03:09 — RFCTR-010 — defined: single-owner theme state with core
  rules and a storage adapter
- 2026-07-28:20:00:07 — RFCTR-009 — defined: extract drop-geometry rules from
  useDragAndDrop into the core
- 2026-07-28:19:01:45 — IMPRV-010 — done: builder presented in the shared Modal
  overlaying the screen — fixed title bar, full-screen mobile / centered 860px
  desktop, opener focus restore; nested-Escape bug fixed in useFocusTrap; old
  FrameworkBuilder screen deleted; verified in a real browser; suite green at
  486
- 2026-07-28:18:48:05 — IMPRV-010 — started
- 2026-07-28:18:45:20 — IMPRV-009 — done: shared Modal component generalized
  from EditModal's shell — fixed title bar with labeled close, content-owned
  scrolling, full-screen mobile / centered wide, A11Y-022 focus return; demoed
  in the design system; suite green at 482
- 2026-07-28:18:39:37 — IMPRV-009 — started
- 2026-07-28:18:37:20 — IMPRV-008 — done: FrameworkBuilderContent extracted —
  authoring UI is self-contained (data in, callbacks out), FrameworkBuilder is
  chrome only; existing builder tests passed unedited, suite green at 470
- 2026-07-28:18:32:47 — IMPRV-008 — started
- 2026-07-28:18:30:12 — IMPRV-010 — defined: present the framework builder in
  the shared modal
- 2026-07-28:18:30:12 — IMPRV-009 — defined: reusable modal component with fixed
  title bar in the design system
- 2026-07-28:18:30:12 — IMPRV-008 — defined: extract framework builder content
  from its screen chrome
- 2026-07-28:18:18:18 — DSGN-002 — reverted: owner kept the original icon set
  after reviewing the gradient identity and two merge explorations (reference
  copies in **local**/images/icons/001 and 002)
- 2026-07-28:16:32:26 — IMPRV-007 — done: card delete X renders only during
  inline editing, modal-routed devices delete via EditModal; pointerdown
  preventDefault guards the blur-commit race; suite green at 465 tests
- 2026-07-28:16:22:31 — IMPRV-007 — started
- 2026-07-28:16:21:40 — DSGN-002 — done: gradient-quadrant identity on
  favicon.svg, both PWA icons, and apple-touch-icon; bilinear 4-corner gradient
  with centered translucent cross, maskable-safe, verified at 512/192/96/48
- 2026-07-28:16:08:41 — DSGN-002 — started
- 2026-07-28:15:57:14 — IMPRV-007 — defined: show card delete X only during
  inline editing
- 2026-07-28:15:56:40 — DSGN-002 — defined: gradient quadrant app icon across
  all icon assets
- 2026-07-28:15:11:45 — IMPRV-006 — done: card taps and Add open the top-aligned
  EditModal wherever an on-screen keyboard is expected, items persist only on
  Save, and inline editing survives on physical-keyboard devices; covered by ten
  integration tests
- 2026-07-28:15:01:21 — IMPRV-006 — started
- 2026-07-28:14:40:55 — RSRCH-002 — done: closed as answered — top-aligned
  editor recommendation adopted, remaining device items dissolved by the pivot;
  implementation filed as IMPRV-006
- 2026-07-28:14:38:10 — IMPRV-006 — defined: route mobile item editing through
  the top-aligned EditModal
- 2026-07-28:12:26:34 — A11Y-022 — done: EditModal restores focus to a required
  openerRef on unmount; all exits covered by unit and demo-integration tests
- 2026-07-28:12:15:14 — A11Y-022 — started
- 2026-07-28:12:13:45 — A11Y-021 — done: dismissing the conflict dialog focuses
  `<main>`; the move is owned by useFrameworkSharing and all three exits are
  covered by tests
- 2026-07-28:12:02:48 — A11Y-021 — started
- 2026-07-28:08:46:23 — A11Y-022 — defined: edit modal strands focus on body
  when closed
- 2026-07-28:08:46:23 — A11Y-021 — defined: conflict dialog strands focus on
  body when dismissed
- 2026-07-28:08:15:40 — RFCTR-008 — done: the drawer's open state and both focus
  moves live in useDrawerModality; the effect-ordering contract is gone and the
  restore path is covered
- 2026-07-27:19:43:00 — RFCTR-008 — started
- 2026-07-27:19:40:07 — RFCTR-008 — defined: consolidate mobile drawer focus and
  modality under one owner
- 2026-07-27:16:39:59 — RSRCH-002 — real-device iOS spot-check: top-sheet A/B
  (pan stays 0) and probe section 3 both look good on hardware; simulator
  findings hold. No ticket edits or recommendation yet
- 2026-07-27:15:35:42 — BUG-017 — done: the app shell sizes to `svh` and every
  surface inside defers to it, so the document no longer scrolls; guarded by
  viewportLock.test.ts. Device verification still outstanding
- 2026-07-27:15:27:10 — BUG-017 — started
- 2026-07-27:15:22:33 — BUG-017 — rescoped to the whole app shell: the shell and
  canvas lock to the visible viewport, scrolling only where a surface asks for
  it
- 2026-07-27:15:19:07 — BUG-017 — defined: mobile canvas page scrolls because
  the app shell is sized to the large viewport
- 2026-07-27:11:28:03 — BUG-016 — done: form controls are floored at 16px under
  a coarse pointer, so focus no longer triggers the iOS layout-viewport zoom
- 2026-07-27:11:16:50 — BUG-016 — started
- 2026-07-27:11:15:39 — BUG-016 — defined: mobile inputs under 16px make iOS
  auto-zoom and clip the canvas
- 2026-07-27:09:21:29 — RFCTR-007 — done: EditModal ids come from useId, and the
  module-level counter is gone
- 2026-07-27:09:18:29 — RFCTR-007 — started
- 2026-07-27:09:17:14 — RFCTR-006 — done: keyboard-size judgment moved into the
  core as isKeyboardSized, hook left with observation only
- 2026-07-27:09:12:26 — RFCTR-006 — started
- 2026-07-27:09:10:58 — MAINT-008 — done: the open-with-text-selected test now
  types into the modal and asserts the text was replaced, not appended
- 2026-07-27:09:07:47 — MAINT-008 — started
- 2026-07-27:09:07:06 — MAINT-007 — done: reset now detaches the observation
  listeners, so no test inherits another test's viewport stub
- 2026-07-27:09:04:26 — MAINT-007 — started
- 2026-07-27:09:04:11 — MAINT-006 — done: matchMedia fake matches full query
  strings and fails loudly on an undeclared query or an unread declared signal
- 2026-07-27:08:58:23 — MAINT-006 — started
- 2026-07-27:08:49:47 — MAINT-008 — defined: edit-modal test asserts the
  open-selection it names
- 2026-07-27:08:48:01 — MAINT-007 — defined: reset detaches on-screen-keyboard
  observation listeners in tests
- 2026-07-27:08:45:50 — RFCTR-007 — defined:
  edit-modal-ids-from-useid-not-module-counter
- 2026-07-27:08:44:08 — MAINT-006 — defined: exact-match matchMedia fake so
  keyboard tests exercise the hook
- 2026-07-27:08:41:59 — RFCTR-006 — defined: extract keyboard-size judgment into
  onScreenKeyboard core
- 2026-07-26:19:04:11 — RSRCH-002 — BLOCKED on device access: desk half done and
  instrument built, but the Outcome demands real-hardware evidence and only the
  iOS Simulator is available, with no Android at all. Desk findings: the premise
  holds (BUG-015 moved `QuadrantCanvas` to `h-svh`, a _static_ unit, so the
  canvas cannot react to a keyboard even in principle) and the occlusion has two
  independent causes, not one — `MobileQuadrantGrid.tsx:56` is
  `overflow-hidden`, which disables the browser's own
  scroll-focused-field-into-view rescue, and `Card.tsx` destroys the focused
  textarea on every commit, so the per-edit open/close cycle is the component's
  own lifecycle rather than a platform limit. Narrowed item 2 to one falsifiable
  hypothesis: `Card.tsx:84` focuses from a passive `useEffect` (after paint,
  outside the gesture) where `useLayoutEffect` would stay inside it. Built
  `public/keyboard-probe.html` (`globIgnores`'d out of the SW precache) to make
  the device session execution rather than investigation. 397/397 green
- 2026-07-26:18:47:24 — RSRCH-002 — started
- 2026-07-26:18:46:17 — BUG-015 — done: `QuadrantCanvas` sized with `h-svh`
  instead of `h-screen`, lifting the zoomed cell's footer controls and the
  overview's bottom-row labels clear of mobile Safari's toolbar; `svh` over
  `dvh` to preserve 4996ae3's no-reflow guarantee. `viewport-fit=cover` proved
  unnecessary — the default `auto` already keeps content inside the safe area,
  so the anticipated inset work was dropped. No new test (CSS unit, no layout in
  jsdom, class-pinning ruled out); 397/397 green, human verified on the iOS
  simulator (commit bc63326). Filed a research candidate in `0-research` on the
  app having no shared viewport-height convention — third ticket circling it,
  and `Sidebar.tsx:99` is still `h-screen`
- 2026-07-26:18:36:18 — BUG-015 — started
- 2026-07-26:18:23:35 — BUG-015 — defined: mobile safari bottom toolbar occludes
  the quadrant canvas footer controls
- 2026-07-26:18:03:36 — BUG-014 — done: the four navigating drawer actions
  (select, New Framework, Import, Duplicate) now dismiss the mobile drawer and
  land focus on `<main>` (tabIndex -1) instead of stranding it on the detached
  opener; desktop untouched, 397/397 green (commit 31f7b08). Filed a research
  candidate in `0-research` on drawer focus ownership being split between App
  and Sidebar — sixth ticket on this surface
- 2026-07-26:17:58:41 — BUG-014 — started
- 2026-07-26:17:52:41 — RSRCH-002 — defined: hold the mobile keyboard open and
  keep the edit target above it
- 2026-07-26:17:46:41 — BUG-014 — defined: mobile drawer stays open over the
  screen its own actions navigate to
- 2026-07-26:17:42:27 — DSGN-001 — done: Y-axis input rotated -90deg into a rail
  down the grid's left edge (same element, absolutely positioned so it cannot
  widen the column); X axis offset to stay centred under the grid. Human
  confirmed visually, 390/390 green (commit 0f1c518)
- 2026-07-26:17:38:52 — DSGN-001 — started: human settled the open design
  question — keep the existing Y-axis input element, rotate it in place
- 2026-07-26:17:33:37 — IMPRV-005 — done: ArrowUp/ArrowDown walk the template
  list across category groups, wrap at both ends, and enter from the filter
  input; focus-only, Enter/Space still applies, 386/386 green (commit 5015e3c)
- 2026-07-26:17:28:10 — IMPRV-005 — started
- 2026-07-26:17:27:27 — DSGN-001 — blocked: left in 1-inbox, not started.
  `work-start/types/design.md` is still "TO BE DEFINED — owner: human", so the
  deliverable (proposal for review vs. implemented UI) and the definition of
  done for design tickets are undefined. Needs a human call.
- 2026-07-26:17:25:30 — BUG-013 — done: floating sidebar opener is now
  desktop-only; builder and empty state carry their own in-flow trigger via a
  new SidebarToggleButton atom, 379/379 green (commit e10894f)
- 2026-07-26:17:16:57 — BUG-013 — started
- 2026-07-26:17:09:35 — DSGN-001 — defined: y-axis affordance reads as vertical
  left-edge axis on builder
- 2026-07-26:17:08:05 — IMPRV-005 — defined: arrow-key navigation through
  template list on create screen
- 2026-07-26:17:06:36 — BUG-013 — defined: mobile floating sidebar opener
  misaligned and overlaps title

- 2026-07-05:09:26:04 — ARCH-001 — done: wrote src/architecture.md (layer rules,
  module + data-flow Mermaid diagrams, recorded decisions with re-open triggers)
  and pointed CLAUDE.md at it (commit 9665676)
- 2026-07-05:09:23:12 — ARCH-001 — started
- 2026-07-05:09:22:54 — RFCTR-005 — done: moved createFramework/createItem from
  storage.ts into logic/framework.ts and logic/items.ts; components no longer
  import storage, 374/374 green (commit 5afea5f)
- 2026-07-05:09:20:17 — RFCTR-005 — started
- 2026-07-05:09:19:54 — RFCTR-004 — done: split logic/routing into pure core
  rules + src/routing.ts adapter; core now I/O-free, 374/374 green (commit
  5e6826f)
- 2026-07-05:09:16:49 — RFCTR-004 — started
- 2026-07-05:09:12:11 — ARCH-001 — defined: write diagrammed architecture doc
  with layer rules and recorded decisions
- 2026-07-05:09:12:10 — RFCTR-005 — defined: split domain factories out of the
  storage adapter
- 2026-07-05:09:12:09 — RFCTR-004 — defined: move window/history side effects
  out of logic/routing into an adapter
- 2026-07-03:16:24:18 — RFCTR-003 — done: swept residual noise names — inlined
  handleDragStart\_ wrapper, pickerRef, json/storedJson, useFrameworkSharing
  (file + 5 test files renamed), frameworkFromPayload; rename-only, 366/366
  green (commit 0a7f2ca)
- 2026-07-03:16:20:46 — RFCTR-003 — started
- 2026-07-03:16:19:34 — RFCTR-002 — done: unified vocabulary — isValid\* guards,
  filterValidFrameworks/repairImportedFramework, openBuilderForEdit,
  onCycleTheme prop; rename-only, 366/366 green (commit 18bd7b0)
- 2026-07-03:16:17:03 — RFCTR-002 — started
- 2026-07-03:16:16:02 — RFCTR-001 — done: renamed 8 dishonest symbols
  (clientToQuadrantPercent, decodeSharedPayload, isDark family,
  displayButtonRef, getFramework, frameworkMatchesPayload, editingFramework,
  openMenuFrameworkId); rename-only, 366/366 green (commit fec62c5)
- 2026-07-03:16:10:16 — RFCTR-001 — started
- 2026-07-03:16:03:24 — RFCTR-003 — defined: sweep residual noise names —
  underscore wrapper, bare ref, data params, hook name, hydrate
- 2026-07-03:16:03:23 — RFCTR-002 — defined: unify split vocabulary — validation
  prefix, sanitize verbs, builder/editor, theme-cycle callback
- 2026-07-03:16:03:22 — RFCTR-001 — defined: rename dishonest symbols that
  assert wrong types or operands
- 2026-06-12:08:12:12 — FEAT-003 — done: pure History<T> snapshot core in
  logic/history.ts; all 8 useFrameworks mutations route through one commit
  dispatch point; Cmd/Ctrl+Z / Y / Shift+Z shortcuts desktop-only, native text
  undo preserved (commit f5817f4)
- 2026-06-12:08:04:48 — FEAT-003 — started
- 2026-06-12:07:08:17 — FEAT-003 — defined: undo-redo history for all data
  mutations via keyboard shortcuts
- 2026-06-12:01:04:15 — RSRCH-001 — done: recommendation recorded in ticket —
  keep ambient Date.now/randomUUID/Math.random; vitest fakes give exactness on
  demand; re-open on flake, non-vitest runtime, or replay requirements; no
  follow-up tickets
- 2026-06-12:01:03:30 — RSRCH-001 — started

- 2026-06-12:01:03:01 — MAINT-003 — done: 4 App-level flows covered (popstate
  back, delete-active, duplicate, edit structure); also fixed hash-reset test
  pollution that leaked popstate across tests (commit d8de845)
- 2026-06-12:00:56:22 — MAINT-003 — started

- 2026-06-12:00:55:46 — MAINT-004 — done: 5 weak tests now behavioral or
  removed; mutation-verified the kept ones can fail (commit ce96ea1)
- 2026-06-12:00:50:12 — MAINT-004 — started

- 2026-06-12:00:48:56 — MAINT-005 — done: onDrop now fires outside the updater,
  exactly once under StrictMode (test proved 2x before) (commit 0fae107)
- 2026-06-12:00:46:12 — MAINT-005 — started

- 2026-06-12:00:45:01 — A11Y-020 — done: gallery icons role=img + label, no
  aria-hidden=false literal; DesignSystem gallery test added (commit 758ca61)
- 2026-06-12:00:42:18 — A11Y-020 — started

- 2026-06-12:00:41:40 — A11Y-019 — done: zoomed off-screen sections inert;
  overview labels device-neutral ("select to edit") (commit a69d0d8)
- 2026-06-12:00:38:21 — A11Y-019 — started

- 2026-06-12:00:37:39 — A11Y-016 — done: trigger haspopup=dialog matches panel
  role; aria-modal added; click-outside dismiss restores trigger focus (commit
  8447f00)
- 2026-06-12:00:33:38 — A11Y-016 — started

- 2026-06-12:00:32:56 — A11Y-015 — done: conditional aria-haspopup/expanded/
  controls on the card item button; 3-state tests added (commit ff17b1a)
- 2026-06-12:00:29:27 — A11Y-015 — started

- 2026-06-12:00:29:02 — A11Y-014 — done: outline-none dropped; global
  focus-visible accent outline now reaches the card button (commit b5312c8)
- 2026-06-12:00:27:17 — A11Y-014 — started

- 2026-06-12:00:26:43 — A11Y-013 — done: picker popup is a dialog (listbox +
  labeled input); Tab reaches the custom input; Escape restores trigger focus;
  useMenuKeyboardNav left menu-only (commit 7459c20)
- 2026-06-12:00:23:12 — A11Y-013 — started

- 2026-06-12:00:22:27 — A11Y-018 — done: global ::placeholder rule with
  text-tertiary + opacity 1; token contrast test extended (commit 7f2339c)
- 2026-06-12:00:20:26 — A11Y-018 — started

- 2026-06-12:00:20:00 — A11Y-017 — done: both toast dismiss buttons now 24x24
  via the w-6 h-6 grid pattern (commit 10c18c1)
- 2026-06-12:00:18:27 — A11Y-017 — started

- 2026-06-12:00:18:00 — A11Y-012 — done: on-danger token mirrors on-accent;
  Toast text + dismiss icon pass AA both themes (commit 630c3e2)
- 2026-06-12:00:14:21 — A11Y-012 — started

- 2026-06-12:00:13:43 — A11Y-011 — done: on-accent token + re-picked accent
  fills; token-level contrast test guards ≥4.5:1 both themes (commit 1cd8c4f)
- 2026-06-12:00:07:25 — A11Y-011 — started

- 2026-06-12:00:06:58 — BUG-010 — done: save failures surface via Toast from
  useFrameworks.saveError; auto-clears on next successful save (commit 7a9317f)
- 2026-06-12:00:02:25 — BUG-010 — started

- 2026-06-12:00:02:03 — BUG-012 — done: sidebar open state re-syncs on
  breakpoint crossings via render-time derived state (effect-based sync still
  stole focus for one commit — documented in ticket) (commit 2227a5d)
- 2026-06-11:23:54:17 — BUG-012 — started

- 2026-06-11:23:53:43 — BUG-003 — done: desktop create mode pinned to viewport;
  list scrolls to bottom edge; mobile/edit unchanged; pixel result needs a quick
  visual check (jsdom can't assert layout) (commit a79492f)
- 2026-06-11:23:51:12 — BUG-003 — started

- 2026-06-11:23:49:57 — BUG-005 — done: useClickOutside gains excludeRef;
  Sidebar Actions menu and mobile template dropdown triggers now toggle closed
  (commit fbb06f2)
- 2026-06-11:23:44:12 — BUG-005 — started

- 2026-06-11:23:42:59 — BUG-009 — done: autoFocusId consumed on the new item's
  first commit/delete; grid remounts no longer re-open edit mode (commit
  8414b50)
- 2026-06-11:23:39:19 — BUG-009 — started

- 2026-06-11:23:38:39 — BUG-004 — done: Escape on a never-committed placeholder
  item now deletes it; re-edit cancel unchanged (commit 80df323)
- 2026-06-11:23:33:35 — BUG-004 — started

- 2026-06-11:23:33:20 — BUG-008 — done: lastHash guard removed; synchronous
  hash-clear is the sole re-entry guard; re-activating the same link imports
  again (commit 538b7a0)
- 2026-06-11:23:27:25 — BUG-008 — started

- 2026-06-11:23:26:54 — BUG-011 — done: writer write/close rejections now
  observed (swallow handlers; readable side still delivers the error); corrupt
  deflate regression test added (commit 16c98f6)
- 2026-06-11:23:21:37 — BUG-011 — started (note: Blob.stream() alternative
  rejected — unsupported in jsdom)

- 2026-06-11:23:21:00 — BUG-007 — done: shared clampPosition [0,95] in
  logic/items.ts; frameworksMatch compares clamped-vs-clamped; drag keeps
  narrower visual range by design (commit a8ed56b)
- 2026-06-11:23:14:12 — BUG-007 — started

- 2026-06-11:23:12:53 — BUG-006 — done: import boundaries validate #rrggbb via
  shared isValidHexColor; QuadrantGrid/CornerGradient/ColorPicker hardened
  against legacy bad data (commit b6842fe)
- 2026-06-11:23:03:25 — BUG-006 — started

- 2026-06-11:23:02:46 — IMPRV-004 — done: toSharedPayload + isValidPayload
  extracted to src/logic/sharePayload.ts with direct unit tests; sharing.ts is
  codec-only (commit 9ee98dc)

- 2026-06-11:22:58:12 — IMPRV-004 — started

- 2026-06-11:22:57:27 — IMPRV-003 — done: extracted pure
  sanitizeStoredFrameworks into src/logic/; loadFrameworks delegates; deep
  validation kills the Sidebar render-crash class (commit 6ac1bff)

- 2026-06-11:22:52:45 — IMPRV-003 — started (drain order: IMPRV-003,004 →
  BUG-006,007,011,008 → BUG-004,009,005,003,012,010 →
  A11Y-011,012,017,018,013,014,015,016,019,020 → MAINT-005,004,003 → RSRCH-001;
  extractions first so sharing/storage bug fixes land on the new structure)
- 2026-06-11:22:46:31 — BUG-012 — defined: sidebar open state not re-synced
  across 768px breakpoint causes spontaneous modal overlay and focus steal
- 2026-06-11:22:45:47 — BUG-011 — defined: orphaned writer promises in sharing
  codec cause unhandled rejections on corrupt share links
- 2026-06-11:22:45:30 — A11Y-020 — defined: design-system icon gallery svgs
  named without image role
- 2026-06-11:22:45:27 — MAINT-005 — defined: move onDrop side effect out of
  setDrag updater in useDragAndDrop
- 2026-06-11:22:43:08 — A11Y-019 — defined: hide off-screen quadrants from AT
  when zoomed and de-pointer overview labels
- 2026-06-11:22:43:04 — RSRCH-001 — defined: deterministic functional core via
  injected time and id generation
- 2026-06-11:22:40:27 — A11Y-018 — defined: form placeholder text fails AA
  contrast in both themes
- 2026-06-11:22:38:26 — A11Y-017 — defined: toast dismiss buttons fail 24px
  target-size floor
- 2026-06-11:22:36:32 — A11Y-016 — defined: mobile template picker trigger
  announces listbox but opens dialog
- 2026-06-11:22:34:20 — A11Y-015 — defined: card move-menu trigger missing popup
  semantics
- 2026-06-11:22:32:13 — A11Y-014 — defined: card item button missing visible
  focus indicator
- 2026-06-11:22:30:26 — BUG-010 — defined: silent localStorage save failure
  loses data with no user feedback
- 2026-06-11:22:30:19 — A11Y-013 — defined: color picker custom input
  unreachable by keyboard
- 2026-06-11:22:29:21 — BUG-009 — defined: stale autoFocusId re-opens edit mode
  on grid remount
- 2026-06-11:22:29:05 — BUG-008 — defined: lastHash guard blocks re-importing
  same share link in session
- 2026-06-11:22:28:47 — BUG-007 — defined: inconsistent position clamps shift
  shared items and trigger false import conflicts
- 2026-06-11:22:28:21 — MAINT-004 — defined: make no-signal and
  implementation-pinning tests assert observable behavior or remove them
- 2026-06-11:22:27:57 — A11Y-012 — defined: error toast danger-surface text
  fails AA contrast in both themes
- 2026-06-11:22:27:48 — BUG-006 — defined: imported quadrant colors not
  validated as #rrggbb break rendering
- 2026-06-11:22:27:21 — BUG-005 — defined: menu trigger cannot dismiss its own
  open menu
- 2026-06-11:22:27:08 — IMPRV-003 — bug-scope of corrupt-localStorage app brick
  found it duplicates IMPRV-003; enriched its discovery notes with crash repro
  and severity instead of filing a parallel BUG ticket
- 2026-06-11:22:26:18 — BUG-004 — defined: escape on new item leaves persisted
  placeholder card
- 2026-06-11:22:26:03 — MAINT-003 — defined: test: cover history navigation
  (popstate) and framework lifecycle flows at App level
- 2026-06-11:22:25:28 — A11Y-011 — defined: accent-surface text fails AA
  contrast in both themes
- 2026-06-11:22:23:46 — IMPRV-004 — defined: extract pure share payload
  projection and validation from sharing codec shell
- 2026-06-11:22:21:35 — IMPRV-003 — defined: extract pure framework validation
  from storage shell and align divergent validators
- 2026-06-10:12:34:13 — BUG-003 — defined: desktop picker list extends to bottom
  of viewport
- 2026-06-10:12:17:22 — IMPRV-002 — done: responsive master-detail template
  picker with preview near the top; categories + filter; mobile dropdown
- 2026-06-10:12:08:42 — IMPRV-002 — started
- 2026-06-10:12:06:47 — IMPRV-002 — defined: redesign template picker as
  responsive master-detail with preview near the top
- 2026-06-10:11:44:21 — MAINT-002 — done: removed Reflection Mode feature
  (component, overlay branch, button, tests, design-system subsection)
- 2026-06-10:11:39:40 — MAINT-002 — started
- 2026-06-10:11:37:34 — FEAT-002 — done: expanded template library to 23
  quadrant models with descriptions
- 2026-06-10:11:28:46 — FEAT-002 — started
- 2026-06-10:11:25:27 — FEAT-002 — defined: quadrant model template library with
  descriptions
- 2026-06-10:11:21:36 — MAINT-002 — defined: remove reflection mode feature
- 2026-05-29:17:45:23 — MAINT-001 — done: integration tests for quadrant
  drag-and-drop drop resolution
- 2026-05-29:17:42:19 — IMPRV-001 — done: extract resolveImportAction pure
  function from useShareImport
- 2026-05-29:17:40:02 — FEAT-001 — done: integration tests for conflict dialog
  Replace / Keep both / Cancel
- 2026-05-29:17:38:13 — BUG-002 — done: share returns outcome; fall back to
  navigator.share when clipboard fails
- 2026-05-29:17:03:15 — BUG-001 — done: file picker change-no-files resolves
  null instead of rejecting
- 2026-05-29:17:01:22 — A11Y-010 — done: arrow-key reposition for focused cards
- 2026-05-29:16:55:45 — A11Y-009 — done: bump ColorPicker custom input to 24px
  high
- 2026-05-29:16:54:29 — A11Y-008 — done: enlarge quadrant-header Add Item hit
  area to 24x24
- 2026-05-29:16:53:15 — A11Y-007 — done: switch UpdateToast to role=status
- 2026-05-29:16:51:44 — A11Y-006 — done: promote EmptyState heading to h1
- 2026-05-29:16:50:18 — A11Y-005 — done: mobile sidebar drawer focus trap and
  Escape to close
- 2026-05-29:16:46:46 — A11Y-004 — done: reveal Sidebar actions trigger on touch
- 2026-05-29:16:45:34 — A11Y-003 — done: enlarge Card delete hit area to 24x24
  and reveal on touch
- 2026-05-29:16:35:45 — A11Y-002 — done: expand ColorPicker trigger hit area to
  24x24
- 2026-05-29:16:33:03 — A11Y-001 — done: inert non-focused canvases in
  MobileQuadrantGrid
- 2026-05-29:14:00:46 — MAINT-001 — defined: test: cover quadrant drag-and-drop
  drop-resolution integration
- 2026-05-29:14:00:25 — IMPRV-001 — defined: extract share-import decision into
  pure resolveImportAction
- 2026-05-29:13:58:48 — FEAT-001 — defined: test: cover share-import conflict
  dialog Replace, Keep both, and Cancel actions
- 2026-05-29:13:41:02 — BUG-002 — defined: share button reports "Link copied!"
  even when clipboard write skipped or failed
- 2026-05-29:13:40:11 — BUG-001 — defined: file picker cancel via
  onchange-no-file shows misleading read error
- 2026-05-29:13:28:30 — A11Y-010 — defined: keyboard-reposition items within
  quadrant
- 2026-05-29:13:27:39 — A11Y-009 — defined: color picker custom input fails
  target size
- 2026-05-29:13:27:52 — A11Y-005 — defined: mobile sidebar drawer focus and
  escape behavior
- 2026-05-29:13:25:47 — A11Y-008 — defined: quadrant header add-item button
  fails target size
- 2026-05-29:13:27:00 — A11Y-007 — defined: UpdateToast conflicting role and
  aria-live
- 2026-05-29:13:26:37 — A11Y-006 — defined: EmptyState page missing h1
- 2026-05-29:13:26:27 — A11Y-004 — defined: sidebar actions trigger invisible on
  touch
- 2026-05-29:13:26:05 — A11Y-003 — defined: card delete button: target size and
  touch visibility
- 2026-05-29:13:25:40 — A11Y-002 — defined: color picker small trigger fails
  target size
- 2026-05-29:13:25:35 — A11Y-001 — defined: mobile quadrant section nested
  interactive descendants
