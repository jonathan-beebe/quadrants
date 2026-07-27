import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useExpectsOnScreenKeyboard,
  useOnScreenKeyboardSignals,
  resetOnScreenKeyboardObservation,
} from '../../hooks/useExpectsOnScreenKeyboard'

const realMatchMedia = window.matchMedia

/**
 * Answers media queries the way a given class of device would, so the hook can
 * be asked about real hardware rather than about a boolean.
 */
function simulateDevice(capabilities: Record<string, boolean>) {
  window.matchMedia = ((query: string) => {
    const known = Object.keys(capabilities).some((feature) => query.includes(feature))
    const matches = Object.entries(capabilities)
      .filter(([feature]) => query.includes(feature))
      .every(([, value]) => value)
    return {
      matches: known && matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } satisfies MediaQueryList
  }) as typeof window.matchMedia
}

function simulateUserAgentData(mobile: boolean | null) {
  if (mobile === null) {
    Reflect.deleteProperty(navigator, 'userAgentData')
    return
  }
  Object.defineProperty(navigator, 'userAgentData', { value: { mobile }, configurable: true })
}

/** A visual viewport we can shrink on demand, as a keyboard would. */
function stubViewport(height: number) {
  const listeners = new Set<() => void>()
  const viewport = {
    height,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }
  Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true })
  Object.defineProperty(document.documentElement, 'clientHeight', { value: 660, configurable: true })
  return {
    shrinkTo(next: number) {
      viewport.height = next
      act(() => listeners.forEach((fn) => fn()))
    },
  }
}

function focusEditable() {
  const input = document.createElement('input')
  document.body.appendChild(input)
  act(() => input.focus())
  return input
}

afterEach(() => {
  window.matchMedia = realMatchMedia
  Reflect.deleteProperty(navigator, 'userAgentData')
  Reflect.deleteProperty(window, 'visualViewport')
  resetOnScreenKeyboardObservation()
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('useExpectsOnScreenKeyboard', () => {
  it('expects a keyboard on a phone — coarse pointer, no hover', () => {
    simulateDevice({ 'pointer: coarse': true, 'hover: none': true })
    simulateUserAgentData(true)
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(true)
  })

  it('expects a keyboard on a tablet, which a width breakpoint would miss', () => {
    simulateDevice({ 'pointer: coarse': true, 'hover: none': true, 'max-width: 768px': false })
    simulateUserAgentData(null)
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(true)
  })

  it('does not expect one on a desktop with a mouse', () => {
    simulateDevice({ 'pointer: coarse': false, 'hover: none': false })
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(false)
  })

  it('does not expect one on a touchscreen laptop — it has a real keyboard', () => {
    // The distinguishing signal: `any-pointer` is coarse, but the *primary*
    // pointer is the trackpad, so `pointer: coarse` is false.
    simulateDevice({ 'pointer: coarse': false, 'hover: none': false, 'any-pointer: coarse': true })
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(false)
  })

  it('sees through DevTools responsive mode before any interaction', () => {
    // Touch emulation is on, so the media queries lie; the user agent was left
    // on its desktop default, which gives it away.
    simulateDevice({ 'pointer: coarse': true, 'hover: none': true })
    simulateUserAgentData(false)
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(false)
  })

  it('reports the keyboard once one is seen shrinking the viewport', () => {
    simulateDevice({ 'pointer: coarse': false, 'hover: none': false })
    const viewport = stubViewport(660)
    const { result } = renderHook(() => useExpectsOnScreenKeyboard())
    expect(result.current).toBe(false)

    viewport.shrinkTo(365) // 295px of keyboard, as measured on device

    expect(result.current).toBe(true)
  })

  it('ignores a browser-toolbar-sized change, which is not a keyboard', () => {
    simulateDevice({ 'pointer: coarse': false, 'hover: none': false })
    const viewport = stubViewport(768)
    const { result } = renderHook(() => useOnScreenKeyboardSignals())

    viewport.shrinkTo(660) // the 108px Safari toolbar retract

    expect(result.current.observed).toBeNull()
  })

  it('concludes there is no keyboard when focusing a field raises nothing', () => {
    vi.useFakeTimers()
    // Every readable signal says phone — a fully emulated device.
    simulateDevice({ 'pointer: coarse': true, 'hover: none': true })
    simulateUserAgentData(true)
    stubViewport(660)
    const { result } = renderHook(() => useExpectsOnScreenKeyboard())
    expect(result.current).toBe(true)

    focusEditable()
    act(() => vi.advanceTimersByTime(2000))

    expect(result.current).toBe(false)
  })

  it('does not conclude anything from focusing a read-only trigger field', () => {
    vi.useFakeTimers()
    simulateDevice({ 'pointer: coarse': true, 'hover: none': true })
    stubViewport(660)
    const { result } = renderHook(() => useOnScreenKeyboardSignals())

    const trigger = document.createElement('input')
    trigger.readOnly = true
    document.body.appendChild(trigger)
    act(() => trigger.focus())
    act(() => vi.advanceTimersByTime(2000))

    expect(result.current.observed).toBeNull()
  })
})
