import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { resolveIsDark, nextThemeMode } from '../logic/theme'
import { loadThemeMode, saveThemeMode } from '../storage'
import type { ThemeMode } from '../logic/theme'

const darkQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function subscribeToSystemTheme(callback: () => void) {
  darkQuery?.addEventListener('change', callback)
  return () => darkQuery?.removeEventListener('change', callback)
}

function getIsSystemDark() {
  return darkQuery?.matches ?? false
}

/**
 * The one owner of theme state, mounted once at the composition root (App).
 * Views render from its props; rules live in logic/theme, persistence in
 * storage.ts (RFCTR-010).
 */
export function useDarkMode() {
  const [mode, setMode] = useState<ThemeMode>(loadThemeMode)
  const isSystemDark = useSyncExternalStore(subscribeToSystemTheme, getIsSystemDark)
  const isDark = resolveIsDark(mode, isSystemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    saveThemeMode(mode)
  }, [mode])

  const cycleMode = useCallback(() => {
    setMode(nextThemeMode)
  }, [])

  return { isDark, mode, setMode, cycleMode }
}
