import { useSyncExternalStore } from 'react'
import { expectsOnScreenKeyboard, decidingSignal, type OnScreenKeyboardSignals } from '../logic/onScreenKeyboard'

/**
 * Devices whose primary pointer is coarse and that cannot hover: phones and
 * tablets. Deliberately not a width breakpoint — `useIsMobile` asks
 * `(max-width: 768px)`, which is the right question for layout and the wrong
 * one here, since a landscape tablet clears 768px and still has nothing but an
 * on-screen keyboard.
 *
 * Both halves earn their place. `pointer: coarse` alone would catch a
 * touchscreen laptop, except such a laptop reports its *primary* pointer as
 * fine and so drops out — which `any-pointer: coarse` would not have managed.
 * `hover: none` alone would catch kiosk and TV inputs.
 */
const COARSE_POINTER = '(pointer: coarse)'
const NO_HOVER = '(hover: none)'

/**
 * A keyboard has to take at least this much of the viewport to count. Measured
 * on iOS under RSRCH-002 at 295-311px; the Safari toolbar, the main source of
 * false positives, moves 108px.
 */
const KEYBOARD_MIN_PX = 120

/** How long to wait after focusing a field before concluding no keyboard came. */
const SETTLE_MS = 1200

interface UserAgentData {
  mobile?: boolean
}

function readUaMobile(): boolean | null {
  const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData
  return typeof data?.mobile === 'boolean' ? data.mobile : null
}

/* ── Observation: the one signal emulation cannot fake ──────────────────── */

let observed: boolean | null = null
let installed = false
let pendingTimer: ReturnType<typeof setTimeout> | null = null
const subscribers = new Set<() => void>()

function notify() {
  for (const fn of subscribers) fn()
}

function record(value: boolean) {
  if (observed === value) return
  observed = value
  notify()
}

function keyboardHeight(viewport: VisualViewport): number {
  // clientHeight, not innerHeight: on iOS innerHeight is the dynamic viewport
  // and swings with the browser toolbar while the keyboard does nothing.
  return document.documentElement.clientHeight - viewport.height
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLTextAreaElement) return !target.readOnly && !target.disabled
  if (target instanceof HTMLInputElement) return !target.readOnly && !target.disabled
  return target.isContentEditable
}

/**
 * Watches what actually happens when an editable field takes focus. A real
 * on-screen keyboard shrinks the visual viewport; DevTools device emulation
 * never does, however thoroughly it spoofs the readable signals.
 *
 * Recording a negative is as useful as recording a positive: an iPad with a
 * keyboard case attached genuinely has no on-screen keyboard, and should edit
 * in place. Either verdict self-corrects, because the next focus observes
 * again.
 *
 * Held in memory rather than persisted. The first interaction is decided by
 * prediction and every one after it by evidence, which is enough — persisting
 * would only add ways for a stale verdict to outlive the device it came from.
 */
function install() {
  if (installed) return
  installed = true
  const viewport = window.visualViewport
  if (!viewport) return

  const onResize = () => {
    if (keyboardHeight(viewport) >= KEYBOARD_MIN_PX) {
      if (pendingTimer) {
        clearTimeout(pendingTimer)
        pendingTimer = null
      }
      record(true)
    }
  }

  const onFocusIn = (event: FocusEvent) => {
    if (!isEditable(event.target)) return
    if (keyboardHeight(viewport) >= KEYBOARD_MIN_PX) {
      record(true)
      return
    }
    if (pendingTimer) clearTimeout(pendingTimer)
    pendingTimer = setTimeout(() => {
      pendingTimer = null
      record(keyboardHeight(viewport) >= KEYBOARD_MIN_PX)
    }, SETTLE_MS)
  }

  viewport.addEventListener('resize', onResize)
  document.addEventListener('focusin', onFocusIn)
}

function subscribe(callback: () => void): () => void {
  install()
  const mediaQueries = [window.matchMedia(COARSE_POINTER), window.matchMedia(NO_HOVER)]
  for (const mql of mediaQueries) mql.addEventListener('change', callback)
  subscribers.add(callback)
  return () => {
    for (const mql of mediaQueries) mql.removeEventListener('change', callback)
    subscribers.delete(callback)
  }
}

/**
 * Cached because useSyncExternalStore compares snapshots by identity and would
 * loop forever on a fresh object each call.
 */
let snapshot: OnScreenKeyboardSignals = {
  coarsePointer: false,
  noHover: false,
  uaMobile: null,
  observed: null,
}

function getSnapshot(): OnScreenKeyboardSignals {
  const next: OnScreenKeyboardSignals = {
    coarsePointer: window.matchMedia(COARSE_POINTER).matches,
    noHover: window.matchMedia(NO_HOVER).matches,
    uaMobile: readUaMobile(),
    observed,
  }
  const unchanged =
    next.coarsePointer === snapshot.coarsePointer &&
    next.noHover === snapshot.noHover &&
    next.uaMobile === snapshot.uaMobile &&
    next.observed === snapshot.observed
  if (!unchanged) snapshot = next
  return snapshot
}

function getServerSnapshot(): OnScreenKeyboardSignals {
  return snapshot
}

/** Every signal behind the verdict, for the design system to display. */
export function useOnScreenKeyboardSignals(): OnScreenKeyboardSignals {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useExpectsOnScreenKeyboard(): boolean {
  return expectsOnScreenKeyboard(useOnScreenKeyboardSignals())
}

export { decidingSignal }

/**
 * Test-only. The observation is module state by design — it describes the
 * device, not any component — so tests must be able to clear it.
 */
export function resetOnScreenKeyboardObservation() {
  observed = null
  installed = false
  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = null
  snapshot = { coarsePointer: false, noHover: false, uaMobile: null, observed: null }
}
