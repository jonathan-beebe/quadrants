/**
 * Signals bearing on whether this environment raises an on-screen keyboard.
 * Gathered by the shell; weighed here.
 */
export interface OnScreenKeyboardSignals {
  /** `(pointer: coarse)` — the primary pointer is touch. */
  coarsePointer: boolean
  /** `(hover: none)` — no hover capability. */
  noHover: boolean
  /**
   * `navigator.userAgentData.mobile`, or null where the API does not exist —
   * Safari and Firefox implement no User-Agent Client Hints, so null means
   * "unknown", never "no".
   */
  uaMobile: boolean | null
  /**
   * Whether a keyboard has actually been seen shrinking the visual viewport.
   * Null until an editable field has been focused and the outcome observed.
   */
  observed: boolean | null
}

/**
 * Whether to expect an on-screen keyboard, in precedence order.
 *
 * The ordering is the whole design. Every readable signal is spoofable —
 * Chrome DevTools device emulation overrides pointer, hover, touch points and
 * the user agent precisely so pages believe they are mobile, and it succeeds.
 * What it does not do is raise a keyboard, so it never shrinks the visual
 * viewport. Observation is therefore the only signal that cannot be faked, and
 * it outranks everything.
 *
 * 1. `observed` — ground truth, once available.
 * 2. `uaMobile === false` — Chromium stating it is not a mobile browser. This
 *    catches DevTools' responsive mode, which applies touch emulation while
 *    leaving the user agent on its desktop default. Only trusted in the
 *    negative, and only where the API exists.
 * 3. The media-query pair — the best guess available before any interaction.
 *
 * Rule 3 alone is what shipped first, and it is wrong in exactly one common
 * case: a developer with the device toolbar open. Rule 2 fixes that case up
 * front; rule 1 fixes every case, one interaction late.
 */
export function expectsOnScreenKeyboard(signals: OnScreenKeyboardSignals): boolean {
  if (signals.observed !== null) return signals.observed
  if (signals.uaMobile === false) return false
  return signals.coarsePointer && signals.noHover
}

/** Which rule decided the verdict. For display; the design system shows it. */
export function decidingSignal(signals: OnScreenKeyboardSignals): 'observed' | 'user-agent' | 'media-query' {
  if (signals.observed !== null) return 'observed'
  if (signals.uaMobile === false) return 'user-agent'
  return 'media-query'
}
