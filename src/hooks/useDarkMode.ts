import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'quadrants_theme_mode'
const LEGACY_KEY = 'quadrants_dark_mode'

const darkQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function subscribeToSystemTheme(callback: () => void) {
  darkQuery?.addEventListener('change', callback)
  return () => darkQuery?.removeEventListener('change', callback)
}

function getIsSystemDark() {
  return darkQuery?.matches ?? false
}

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  // Migrate from legacy boolean key
  const legacy = localStorage.getItem(LEGACY_KEY)
  if (legacy !== null) {
    const migrated: ThemeMode = legacy === 'true' ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, migrated)
    localStorage.removeItem(LEGACY_KEY)
    return migrated
  }
  return 'system'
}

function resolveIsDark(mode: ThemeMode, isSystemDark: boolean): boolean {
  if (mode === 'system') return isSystemDark
  return mode === 'dark'
}

export function useDarkMode() {
  const [mode, setMode] = useState(getInitialMode)
  const isSystemDark = useSyncExternalStore(subscribeToSystemTheme, getIsSystemDark)
  const isDark = resolveIsDark(mode, isSystemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  const cycleMode = useCallback(() => {
    setMode((m) => {
      if (m === 'system') return 'light'
      if (m === 'light') return 'dark'
      return 'system'
    })
  }, [])

  return { isDark, mode, setMode, cycleMode }
}
