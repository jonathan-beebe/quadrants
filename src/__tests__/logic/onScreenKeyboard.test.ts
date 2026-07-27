import { describe, it, expect } from 'vitest'
import { expectsOnScreenKeyboard, decidingSignal, type OnScreenKeyboardSignals } from '../../logic/onScreenKeyboard'

/** A phone as the readable signals describe it, before anything is observed. */
const phone: OnScreenKeyboardSignals = {
  coarsePointer: true,
  noHover: true,
  uaMobile: true,
  observed: null,
}

const desktop: OnScreenKeyboardSignals = {
  coarsePointer: false,
  noHover: false,
  uaMobile: false,
  observed: null,
}

/** Chrome with the device toolbar open: touch emulated, user agent untouched. */
const emulatedResponsiveMode: OnScreenKeyboardSignals = {
  coarsePointer: true,
  noHover: true,
  uaMobile: false,
  observed: null,
}

/** iOS Safari, which implements no User-Agent Client Hints. */
const iosSafari: OnScreenKeyboardSignals = {
  coarsePointer: true,
  noHover: true,
  uaMobile: null,
  observed: null,
}

describe('expectsOnScreenKeyboard', () => {
  it('expects a keyboard on a phone', () => {
    expect(expectsOnScreenKeyboard(phone)).toBe(true)
  })

  it('does not expect one on a desktop', () => {
    expect(expectsOnScreenKeyboard(desktop)).toBe(false)
  })

  it('sees through DevTools responsive mode, which emulates touch but not the user agent', () => {
    expect(expectsOnScreenKeyboard(emulatedResponsiveMode)).toBe(false)
    expect(decidingSignal(emulatedResponsiveMode)).toBe('user-agent')
  })

  it('still expects one on iOS Safari, where userAgentData does not exist', () => {
    // The absence of the API means unknown, never "not mobile" — reading it as
    // a negative would disable the modal on the platform that needs it most.
    expect(expectsOnScreenKeyboard(iosSafari)).toBe(true)
    expect(decidingSignal(iosSafari)).toBe('media-query')
  })

  it('lets an observed keyboard override a user agent that denies being mobile', () => {
    // Full device emulation spoofs userAgentData too. Observation does not care.
    const fullyEmulatedButReal = { ...emulatedResponsiveMode, observed: true }
    expect(expectsOnScreenKeyboard(fullyEmulatedButReal)).toBe(true)
    expect(decidingSignal(fullyEmulatedButReal)).toBe('observed')
  })

  it('lets an observed absence override every signal claiming mobile', () => {
    // A fully emulated phone in DevTools: every readable signal says mobile,
    // but no keyboard ever appears.
    const emulatedPhone = { ...phone, observed: false }
    expect(expectsOnScreenKeyboard(emulatedPhone)).toBe(false)
    expect(decidingSignal(emulatedPhone)).toBe('observed')
  })

  it('treats an observed absence on a real tablet with a keyboard case as correct', () => {
    expect(expectsOnScreenKeyboard({ ...iosSafari, observed: false })).toBe(false)
  })
})
