import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '../../hooks/useDarkMode'

const STORAGE_KEY = 'quadrants_theme_mode'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

// Shell coverage only (RFCTR-010): the cycle order, resolution, and migration
// rules are tested in logic/theme.test.ts, persistence in storage.test.ts.
// Here: the hook wires storage → state → document and back.
describe('useDarkMode', () => {
  it('defaults to system mode when nothing is stored', () => {
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.mode).toBe('system')
  })

  it('initializes from the persisted mode', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('persists mode changes', () => {
    const { result } = renderHook(() => useDarkMode())

    act(() => result.current.cycleMode())
    expect(result.current.mode).toBe('light')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  describe('dark class on document', () => {
    it('adds the dark class when the resolved theme is dark', () => {
      localStorage.setItem(STORAGE_KEY, 'dark')
      renderHook(() => useDarkMode())
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('removes the dark class when the resolved theme is light', () => {
      document.documentElement.classList.add('dark')
      localStorage.setItem(STORAGE_KEY, 'light')
      renderHook(() => useDarkMode())
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('allows setting the mode directly', () => {
    const { result } = renderHook(() => useDarkMode())

    act(() => result.current.setMode('dark'))
    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })
})
