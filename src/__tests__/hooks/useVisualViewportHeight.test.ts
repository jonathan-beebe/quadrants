import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useVisualViewportHeight } from '../../hooks/useVisualViewportHeight'

const CSS_VAR = '--visual-viewport-height'

/** jsdom has no visualViewport, so stand one up we can drive. */
function stubViewport(height: number) {
  const listeners = new Set<() => void>()
  const viewport = {
    height,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }
  Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true })
  return {
    resizeTo(next: number) {
      viewport.height = next
      listeners.forEach((fn) => fn())
    },
    get listenerCount() {
      return listeners.size
    },
  }
}

function readVar() {
  return document.documentElement.style.getPropertyValue(CSS_VAR)
}

afterEach(() => {
  Reflect.deleteProperty(window, 'visualViewport')
  document.documentElement.style.removeProperty(CSS_VAR)
})

describe('useVisualViewportHeight', () => {
  it('publishes the visible height for CSS to size against', () => {
    stubViewport(365)
    renderHook(() => useVisualViewportHeight(true))
    expect(readVar()).toBe('365px')
  })

  it('republishes when the keyboard opens', () => {
    const viewport = stubViewport(660)
    renderHook(() => useVisualViewportHeight(true))
    expect(readVar()).toBe('660px')

    viewport.resizeTo(365)
    expect(readVar()).toBe('365px')
  })

  it('publishes nothing while inactive, so a closed editor leaves no trace', () => {
    stubViewport(365)
    renderHook(() => useVisualViewportHeight(false))
    expect(readVar()).toBe('')
  })

  it('clears the property and unsubscribes on unmount', () => {
    const viewport = stubViewport(365)
    const { unmount } = renderHook(() => useVisualViewportHeight(true))
    expect(viewport.listenerCount).toBe(1)

    unmount()

    expect(readVar()).toBe('')
    expect(viewport.listenerCount).toBe(0)
  })

  it('does nothing where visualViewport is unavailable', () => {
    // No stub — the CSS fallback handles this case.
    const spy = vi.spyOn(document.documentElement.style, 'setProperty')
    renderHook(() => useVisualViewportHeight(true))
    expect(spy).not.toHaveBeenCalledWith(CSS_VAR, expect.anything())
    spy.mockRestore()
  })
})
