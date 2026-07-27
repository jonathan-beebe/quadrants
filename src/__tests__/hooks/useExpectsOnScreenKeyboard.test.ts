import { describe, it, expect, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useExpectsOnScreenKeyboard } from '../../hooks/useExpectsOnScreenKeyboard'

const realMatchMedia = window.matchMedia

/**
 * Answers media queries the way a given class of device would, so the hook can
 * be asked about real hardware rather than about a boolean.
 */
function simulateDevice(capabilities: Record<string, boolean>) {
  window.matchMedia = ((query: string) => {
    const matches = Object.entries(capabilities)
      .filter(([feature]) => query.includes(feature))
      .every(([, value]) => value)
    // A query naming no known feature cannot be satisfied by this stub.
    const known = Object.keys(capabilities).some((feature) => query.includes(feature))
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

afterEach(() => {
  window.matchMedia = realMatchMedia
})

describe('useExpectsOnScreenKeyboard', () => {
  it('expects a keyboard on a phone — coarse pointer, no hover', () => {
    simulateDevice({ 'pointer: coarse': true, 'hover: none': true })
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(true)
  })

  it('expects a keyboard on a tablet, which a width breakpoint would miss', () => {
    // A landscape tablet is well over 768px, so useIsMobile would say desktop.
    simulateDevice({ 'pointer: coarse': true, 'hover: none': true, 'max-width: 768px': false })
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

  it('does not expect one on a tablet with a keyboard case, which gains a trackpad', () => {
    simulateDevice({ 'pointer: coarse': false, 'hover: none': false })
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(false)
  })

  it('needs both signals — a hoverless coarse-less device does not qualify', () => {
    simulateDevice({ 'pointer: coarse': false, 'hover: none': true })
    expect(renderHook(() => useExpectsOnScreenKeyboard()).result.current).toBe(false)
  })
})
