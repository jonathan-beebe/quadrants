import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useExpectsOnScreenKeyboard,
  useOnScreenKeyboardSignals,
  resetOnScreenKeyboardObservation,
} from '../../hooks/useExpectsOnScreenKeyboard'

const realMatchMedia = window.matchMedia

let declared: Record<string, boolean> | null = null
let consulted = new Set<string>()

/**
 * Answers media queries the way a given class of device would, so the hook can
 * be asked about real hardware rather than about a boolean.
 *
 * Capabilities are keyed by the full query string and matched exactly, and the
 * story and the hook are held to each other in both directions: a query the
 * story does not declare throws here, and a declared signal the hook never
 * reads fails the test in `afterEach`. Either way a device story cannot quietly
 * claim a distinction the hook does not draw.
 */
function simulateDevice(capabilities: Record<string, boolean>) {
  declared = capabilities
  consulted = new Set()
  window.matchMedia = ((query: string) => {
    consulted.add(query)
    if (!(query in capabilities)) {
      throw new Error(
        `The hook asked "${query}", which this device story does not answer. ` +
          `Declared: ${Object.keys(capabilities).join(', ') || '(none)'}.`,
      )
    }
    return {
      matches: capabilities[query],
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

function expectEveryDeclaredSignalWasRead() {
  if (!declared) return
  const inert = Object.keys(declared).filter((query) => !consulted.has(query))
  declared = null
  if (inert.length > 0) {
    throw new Error(
      `This device story declares ${inert.join(', ')}, which the hook never asked about. ` +
        `An unread signal cannot distinguish anything — drop it, or the story overstates its coverage.`,
    )
  }
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
  expectEveryDeclaredSignalWasRead()
})

describe('useExpectsOnScreenKeyboard', () => {
  it('expects a keyboard on a phone — coarse pointer, no hover', () => {
    simulateDevice({ '(pointer: coarse)': true, '(hover: none)': true })
    simulateUserAgentData(true)
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(true)
  })

  it('expects a keyboard on a landscape tablet, wider than a phone breakpoint', () => {
    // A landscape tablet clears 768px, which is why the hook asks about pointer
    // and hover instead of width. It issues no width query at all, so the story
    // answers only the two it does issue.
    simulateDevice({ '(pointer: coarse)': true, '(hover: none)': true })
    simulateUserAgentData(null)
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(true)
  })

  it('does not expect one on a desktop with a mouse', () => {
    simulateDevice({ '(pointer: coarse)': false, '(hover: none)': false })
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(false)
  })

  it('does not expect one on a touchscreen laptop — it has a real keyboard', () => {
    // Such a laptop is coarse to `any-pointer`, but the hook asks about the
    // *primary* pointer — the trackpad — so it reads false. That the two differ
    // here is the hook's choice of query, not something this fake simulates:
    // `any-pointer` is never asked, so the story cannot answer it, and the
    // laptop presents to the hook exactly as the desktop above does.
    simulateDevice({ '(pointer: coarse)': false, '(hover: none)': false })
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(false)
  })

  it('sees through DevTools responsive mode before any interaction', () => {
    // Touch emulation is on, so the media queries lie; the user agent was left
    // on its desktop default, which gives it away.
    simulateDevice({ '(pointer: coarse)': true, '(hover: none)': true })
    simulateUserAgentData(false)
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(false)
  })

  it('reports the keyboard once one is seen shrinking the viewport', () => {
    simulateDevice({ '(pointer: coarse)': false, '(hover: none)': false })
    const viewport = stubViewport(660)
    const { result } = renderHook(() => useExpectsOnScreenKeyboard())
    expect(result.current).toBe(false)

    viewport.shrinkTo(365) // 295px of keyboard, as measured on device

    expect(result.current).toBe(true)
  })

  it('ignores a browser-toolbar-sized change, which is not a keyboard', () => {
    simulateDevice({ '(pointer: coarse)': false, '(hover: none)': false })
    const viewport = stubViewport(768)
    const { result } = renderHook(() => useOnScreenKeyboardSignals())

    viewport.shrinkTo(660) // the 108px Safari toolbar retract

    expect(result.current.observed).toBeNull()
  })

  it('concludes there is no keyboard when focusing a field raises nothing', () => {
    vi.useFakeTimers()
    // Every readable signal says phone — a fully emulated device.
    simulateDevice({ '(pointer: coarse)': true, '(hover: none)': true })
    simulateUserAgentData(true)
    stubViewport(660)
    const { result } = renderHook(() => useExpectsOnScreenKeyboard())
    expect(result.current).toBe(true)

    focusEditable()
    act(() => vi.advanceTimersByTime(2000))

    expect(result.current).toBe(false)
  })

  it('stops observing once reset, so no test inherits another test viewport', () => {
    vi.useFakeTimers()
    simulateDevice({ '(pointer: coarse)': false, '(hover: none)': false })
    stubViewport(660)
    renderHook(() => useOnScreenKeyboardSignals())

    // Stand where `afterEach` stands: reset, then let the next test's focus
    // arrive. Only a listener that outlived the reset can answer it, and it
    // would answer from the viewport stub this test is about to throw away.
    resetOnScreenKeyboardObservation()
    focusEditable()
    act(() => vi.advanceTimersByTime(2000))

    expect(renderHook(() => useOnScreenKeyboardSignals()).result.current.observed).toBeNull()
  })

  it('does not conclude anything from focusing a read-only trigger field', () => {
    vi.useFakeTimers()
    simulateDevice({ '(pointer: coarse)': true, '(hover: none)': true })
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
