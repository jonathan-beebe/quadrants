import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'quadrants_dark_mode'

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) return saved === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem(STORAGE_KEY, String(darkMode))
  }, [darkMode])

  const toggle = useCallback(() => {
    setDarkMode((d) => !d)
  }, [])

  return { darkMode, toggle }
}
