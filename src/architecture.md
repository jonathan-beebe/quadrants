# Architecture

The app is a single deployable — a client-only PWA — organized as a functional
core inside an imperative shell, with one-way data flow. This doc records the
system context, the layer rules, the module relationships, and the accepted
decisions (with the triggers that re-open them). If you are adding code and
wondering where it belongs, the answer is here.

## System context

What is the deployable, and what does it talk to? There is no backend: a static
host serves the built assets once, and from then on everything runs in the
browser. Each external box below is a browser facility wrapped by exactly one
adapter module, and user data leaves the device only through an explicit export
or share link.

```mermaid
flowchart TD
  user(["User<br/>organizes ideas on a two-axis canvas"])
  host["Static host<br/>GitHub Pages (Netlify-ready)"]
  subgraph browser ["Browser"]
    quadrants["Quadrants PWA<br/>client-only React SPA, offline-capable"]
    storage[("localStorage")]
    files["Device file system"]
    share["Share link<br/>URL fragment, no server round-trip"]
  end
  user -- "uses / installs" --> quadrants
  host -- "static assets + SW precache" --> quadrants
  quadrants -- "saves / loads Framework[] as JSON" --> storage
  quadrants -- "exports / imports framework JSON file" --> files
  quadrants -- "encodes / decodes SharedPayload<br/>(deflate + base64url)" --> share
```

The external boxes map one-to-one onto the adapter layer below: `storage.ts`,
`io.ts`, `sharing.ts` + `routing.ts` (a share link is the routing adapter's URL
plus the sharing adapter's payload codec).

## Layers

Four layers, from inside out. Dependencies point inward, only inward: a module
may import from its own layer or any layer further in, never further out.

| Layer            | Where                                                             | May contain                                                                                                                                                                                                          | May import from |
| ---------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| **Core**         | `src/logic/`                                                      | Pure functions and types only — domain logic, state transitions. No `window`, no DOM, no storage, no network.                                                                                                        | core            |
| **Adapters**     | `src/storage.ts`, `src/io.ts`, `src/sharing.ts`, `src/routing.ts` | Side effects, one module per external thing (localStorage, file download/pick, CompressionStream + clipboard payload codec, window.location + history).                                                              | core            |
| **Coordination** | `src/hooks/`                                                      | Thin orchestration: wire React state to core transitions and adapter effects. Delegates only — an `if` about the domain belongs in the core. `hooks/` also houses the view-ring interaction hooks — see Views below. | adapters, core  |
| **Entry**        | `src/main.tsx`, `src/App.tsx`                                     | The composition root: constructs everything, wires it together.                                                                                                                                                      | everything      |

Views (`src/components/`) render from state and raise events through callbacks —
rendering is I/O, so they sit at the shell alongside the adapters. They may
import the pure core (e.g. `createItem` from `logic/items`) but never an
adapter. Which hooks a view may call follows from what the hook holds
(ARCH-002):

- **Domain state and adapter effects** — `useFrameworks`, `useFrameworkSharing`,
  `useRouting`, `useDarkMode` — are called once, by `App`, and reach views as
  props. Each owns state with exactly one owner or wires an adapter, so a second
  call site would fork live state — the trap the `DesignSystem.tsx` comment
  records for `useDarkMode`.
- **Ephemeral interaction and browser signals** — gesture, focus, keyboard,
  viewport, and media-query hooks (`useIsMobile`, `useDragAndDrop`,
  `useFocusTrap`, `useClickOutside`, `useMenuKeyboardNav`, `useListArrowNav`,
  `useExpectsOnScreenKeyboard`, `useVisualViewportHeight`) — views call these
  directly. They hold nothing another component could want: state is
  per-instance and dies with the caller, refs live in the calling view's subtree
  (`useDragAndDrop`'s quadrant refs only exist inside `QuadrantCanvas`), and a
  browser signal reads the same for every caller.

The placement test for a new hook: if two call sites could ever disagree — it
holds domain data, writes through an adapter, or its state must be
single-instance — `App` owns it and views receive props. If every caller
correctly sees the same thing (a browser signal) or deliberately its own thing
(a local gesture), views may call it. Type-only imports are exempt from all of
this — types are erased at build and carry no state or effects (`QuadrantCanvas`
imports `ShareResult` from `useFrameworkSharing`).

`src/types.ts`, `src/colors.ts`, and `src/templates.ts` are pure shared modules;
they sit with the core ring and anything may import them.

### Module relationships

Which layer imports which — every arrow points inward:

```mermaid
flowchart TD
  subgraph entry ["Entry — composition root"]
    main["main.tsx"] --> App["App.tsx"]
  end
  subgraph coordination ["Coordination — hooks/"]
    useFrameworks["useFrameworks"]
    useFrameworkSharing["useFrameworkSharing"]
    useRouting["useRouting"]
    interaction["interaction & browser-signal hooks<br/>useIsMobile · useDragAndDrop · useFocusTrap · …"]
  end
  subgraph views ["Views — components/"]
    components["Sidebar · QuadrantCanvas · FrameworkBuilder · …"]
  end
  subgraph adapters ["Adapters — one per external thing"]
    storage["storage.ts → localStorage"]
    io["io.ts → file download / pick"]
    sharing["sharing.ts → CompressionStream + base64url"]
    routing["routing.ts → window.location + history"]
  end
  subgraph core ["Core — logic/, pure"]
    logic["framework · items · history · shareImport · sharePayload · routing"]
  end
  App -- "state + callbacks as props" --> views
  App --> coordination
  coordination --> adapters
  coordination --> core
  views -- "ephemeral interaction<br/>(view-ring hooks)" --> interaction
  views -- "pure construction/transforms" --> core
  adapters -- "validation, path↔id rules" --> core
```

A pure rule and its side-effecting counterpart may share a name across rings —
`logic/routing.ts` owns the pathname↔id mapping, `routing.ts` applies it to
`window.location` — the adapter delegates to the core, never the reverse.
`hooks/` spans rings the same way: the state-owning hooks are coordination,
while the interaction and browser-signal hooks belong to the view ring — the
folder says what the code is (a hook), the ring says who may call it (ARCH-002).

### One-way data flow

Every data mutation travels one loop; nothing writes state from the side:

```mermaid
flowchart LR
  event["user event<br/>(views)"] -- "callback up" --> apply["useFrameworks.apply<br/>(single dispatch)"]
  apply -- "pure transition<br/>(logic/)" --> commit["commit into<br/>History of Framework[]"]
  commit -- "new present" --> render["React re-render<br/>(views)"]
  commit -- "save effect" --> save["saveFrameworks<br/>(storage adapter)"]
  render -. "next interaction" .-> event
```

Undo/redo are history navigations (`logic/history.ts`) over the same loop — they
move `present` and re-enter at the render step; the save effect persists
whatever `present` becomes.

## Accepted decisions

| Decision                                                                                                                                     | Decided    | Re-open when                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Layer-first folders** (`logic/`, `hooks/`, `components/`, adapters at `src/` root) rather than feature-first.                              | 2026-07-05 | The app grows a second feature domain, or a feature's files stop changing together — then reorganize by feature first, layer second.                                                                                                                         |
| **Ambient `Date.now` / `crypto.randomUUID` / `Math.random` in the core** — no injected clock/id (RSRCH-001).                                 | RSRCH-001  | A real flaky test traced to time/randomness; a need to run the core outside vitest; or sync/CRDT-style features where deterministic replay becomes a product requirement.                                                                                    |
| **A modal surface's focus is owned by one hook above it**, not split to match the DOM (RFCTR-008).                                           | RFCTR-008  | A third surface needs to inert something outside itself, or `ConflictDialog` and `EditModal` grow focus restore and all three turn out alike — then extract a shared modal-surface contract instead of repeating this one.                                   |
| **Render unmemoized** — no `React.memo`; `useCallback` / `useMemo` only where a consumer structurally requires a stable identity (ARCH-002). | 2026-07-29 | Profiling on a real device traces jank to re-renders — then memoize that measured path, not broadly.                                                                                                                                                         |
| **The shell states the safe-area inset**; `position: fixed` surfaces restate it themselves (IMPRV-013).                                      | IMPRV-013  | The fixed-surface list outgrows what `safeArea.test.ts` can keep honest — then give the shell a containing block so fixed descendants inherit its padding box, and weigh that against what a containing block does to the canvas coordinate space (BUG-018). |

### Modal surfaces

A modal surface's modality usually spans two DOM regions: the surface itself
(dialog semantics, focus trap, Escape) and the background it covers (`inert`,
and the focus target once the surface closes). Those regions belong to different
components, so splitting ownership to match the DOM leaves no one holding the
whole behavior — and because both halves write `document.activeElement`,
correctness ends up resting on React's effect-commit order rather than on
anything stated.

The rule: **whatever owns the open state owns every focus move that follows from
it.** Closing resolves to exactly one focus target, chosen from why the surface
closed. `useDrawerModality` is the worked example — `Sidebar` renders the drawer
and derives nothing about its own modality.

`useFocusTrap` deliberately stays narrower than this: it is Tab cycling and
Escape for any container, with no opinion about focus-on-open, restore, or the
background. The four surfaces using it (`Sidebar`, `ConflictDialog`,
`EditModal`, `FrameworkBuilder`'s template picker) hand-roll the rest, each
resolving close-focus per the rule above:

- `ConflictDialog` — dismissal focus is owned by `useFrameworkSharing`, which
  owns its open state: every exit navigates and there is no opener control, so
  all three exits resolve to `<main>` (A11Y-021).
- `EditModal` — the parent owning `open` declares the return target via the
  required `openerRef` prop; the modal focuses it on unmount, covering every
  exit through one mechanism. The target must be declared, not captured from
  `document.activeElement`, because the touch path opens the modal without ever
  focusing the trigger (pointerDown + preventDefault, RSRCH-002) (A11Y-022).

### Safe-area insets

The app ships as a `standalone` PWA, so a home-screen launch hands the web view
the entire display — rounded corners and home-indicator strip included. Two
halves make the safe area readable and only work together: `index.html` opts the
layout viewport in with `viewport-fit=cover`, and surfaces pad by
`env(safe-area-inset-*)`. The meta alone pushes content further into the unsafe
region; the padding alone is a no-op, because `env()` resolves to 0 without it.

The shell (`App.tsx`) states the inset, the same way it states the viewport
height — one owner, and every surface in flow below inherits it. That is why the
mobile canvas is no longer edge-to-edge: the inset bands are shell background,
and the alternative was naming the inset again at every surface pinned to an
edge.

`position: fixed` is the exception the physics forces, not a lapse. A fixed box
is positioned against the viewport, so it escapes the shell's padding box no
matter what the shell declares, and has to take the inset on its own offsets:
the toasts, the drawer and its opener, the skip link, and the fullscreen mobile
dialog. `safeArea.test.ts` enumerates them — it fails on any edge-pinned fixed
surface that declares no inset, so a new one cannot quietly forget. Full-bleed
backdrops are exempt by design: a scrim that stopped at the safe area would
leave a live strip of app showing through it.

`index.html`'s viewport line is the risky edit, and not only for this. BUG-016
holds the standing decision against `user-scalable=no` / `maximum-scale=1` there
on WCAG 1.4.4 grounds, so the same test asserts their absence alongside
`viewport-fit=cover` — the two changes touch one line and the guard keeps them
from trading off against each other.

### Memoization

Components render unmemoized: there is no `React.memo` in the codebase, and
`useCallback` / `useMemo` are never used for render performance. The app's state
is a handful of frameworks with tens of items, so re-rendering a subtree costs
less than the stale-closure bugs and reading overhead memoization would buy it.

`useCallback` is reserved for consumers that structurally require a stable
identity — a handler subscribed by an effect (`useClickOutside` and
`useMenuKeyboardNav` re-subscribe whenever the handler changes) or a value in a
dependency array whose effect must not re-fire every render. The test: if
removing the wrapper would change behavior (an effect re-subscribes or
re-fires), it stays; if it would only change render counts, it goes. RFCTR-021
sweeps out the speculative call sites this rule forbids.
