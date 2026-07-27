import { useSyncExternalStore } from 'react'

/**
 * Devices whose primary pointer is coarse and that cannot hover: phones and
 * tablets. These are the devices that raise an on-screen keyboard when a field
 * takes focus, and so the ones that need editing lifted away from the canvas
 * (RSRCH-002).
 *
 * Deliberately not a width breakpoint. `useIsMobile` asks `(max-width: 768px)`,
 * which is the right question for layout and the wrong one here — a tablet in
 * landscape is well over 768px and still has nothing but an on-screen keyboard.
 *
 * The two conditions together are what make this hold up:
 *
 * - `pointer: coarse` alone would catch a touchscreen laptop, which has a real
 *   keyboard. It reports its *primary* pointer as fine, so it is excluded —
 *   which `any-pointer: coarse` would not have done.
 * - `hover: none` alone would be true of some kiosk and TV inputs.
 *
 * An iPad with a keyboard case gains a trackpad, so it reports `hover: hover`
 * and `pointer: fine` and correctly drops out.
 *
 * This is a prediction, not a measurement — hence "expects". The only proof an
 * on-screen keyboard is actually up is the visual viewport shrinking, and that
 * arrives too late: the editing affordance has to be chosen before the field is
 * focused.
 */
const ON_SCREEN_KEYBOARD_QUERY = '(pointer: coarse) and (hover: none)'

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(ON_SCREEN_KEYBOARD_QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot(): boolean {
  return window.matchMedia(ON_SCREEN_KEYBOARD_QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

export function useExpectsOnScreenKeyboard(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
