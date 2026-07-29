import { filterValidFrameworks } from './logic/framework'
import { isThemeMode, migrateLegacyDarkFlag } from './logic/theme'
import type { Framework } from './types'
import type { ThemeMode } from './logic/theme'

const STORAGE_KEY = 'quadrants_frameworks'
const THEME_KEY = 'quadrants_theme_mode'
const LEGACY_THEME_KEY = 'quadrants_dark_mode'

export function loadFrameworks(): Framework[] {
  try {
    const storedJson = localStorage.getItem(STORAGE_KEY)
    if (!storedJson) return []
    return filterValidFrameworks(JSON.parse(storedJson))
  } catch {
    return []
  }
}

export function saveFrameworks(frameworks: Framework[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(frameworks))
    return true
  } catch (e) {
    console.error('Failed to save frameworks to localStorage:', e)
    return false
  }
}

// Theme persistence (RFCTR-010), including the one-time migration off the
// legacy boolean key. The mapping itself is a core rule (logic/theme.ts);
// this adapter owns the keys and the read/write.
export function loadThemeMode(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY)
  if (isThemeMode(saved)) return saved
  const legacy = localStorage.getItem(LEGACY_THEME_KEY)
  if (legacy !== null) {
    const migrated = migrateLegacyDarkFlag(legacy)
    localStorage.setItem(THEME_KEY, migrated)
    localStorage.removeItem(LEGACY_THEME_KEY)
    return migrated
  }
  return 'system'
}

export function saveThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_KEY, mode)
}
