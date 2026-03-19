import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const STORAGE_KEY = 'quadrants_theme_mode'
const LEGACY_KEY = 'quadrants_dark_mode'

// Reset localStorage and re-import the module fresh for each test
// so getInitialMode() reads the correct storage state.
async function importFresh() {
  vi.resetModules()
  return import('../../hooks/useDarkMode')
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('useDarkMode', () => {
  it('defaults to system mode when no stored value exists', async () => {
    const { useDarkMode } = await importFresh()
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.mode).toBe('system')
  })

  it('restores a previously saved mode from localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, 'dark')
    const { useDarkMode } = await importFresh()
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.mode).toBe('dark')
    expect(result.current.darkMode).toBe(true)
  })

  it('ignores invalid stored values and defaults to system', async () => {
    localStorage.setItem(STORAGE_KEY, 'bogus')
    const { useDarkMode } = await importFresh()
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.mode).toBe('system')
  })

  describe('legacy migration', () => {
    it('migrates legacy "true" to dark mode', async () => {
      localStorage.setItem(LEGACY_KEY, 'true')
      const { useDarkMode } = await importFresh()
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('dark')
      expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
      expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
    })

    it('migrates legacy "false" to light mode', async () => {
      localStorage.setItem(LEGACY_KEY, 'false')
      const { useDarkMode } = await importFresh()
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('light')
      expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
      expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
    })
  })

  describe('cycleMode', () => {
    it('cycles system → light → dark → system', async () => {
      const { useDarkMode } = await importFresh()
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')

      act(() => result.current.cycleMode())
      expect(result.current.mode).toBe('light')

      act(() => result.current.cycleMode())
      expect(result.current.mode).toBe('dark')

      act(() => result.current.cycleMode())
      expect(result.current.mode).toBe('system')
    })

    it('persists mode changes to localStorage', async () => {
      const { useDarkMode } = await importFresh()
      const { result } = renderHook(() => useDarkMode())

      act(() => result.current.cycleMode())
      expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
    })
  })

  describe('dark class on document', () => {
    it('adds dark class when mode is dark', async () => {
      localStorage.setItem(STORAGE_KEY, 'dark')
      const { useDarkMode } = await importFresh()
      renderHook(() => useDarkMode())
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('removes dark class when mode is light', async () => {
      document.documentElement.classList.add('dark')
      localStorage.setItem(STORAGE_KEY, 'light')
      const { useDarkMode } = await importFresh()
      renderHook(() => useDarkMode())
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('setMode', () => {
    it('allows setting mode directly', async () => {
      const { useDarkMode } = await importFresh()
      const { result } = renderHook(() => useDarkMode())

      act(() => result.current.setMode('dark'))
      expect(result.current.mode).toBe('dark')
      expect(result.current.darkMode).toBe(true)
    })
  })
})
