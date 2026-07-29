// Pure theme rules (RFCTR-010). Reading/writing storage and the DOM class
// live in the shell: storage.ts persists, useDarkMode owns the state.

export type ThemeMode = 'light' | 'dark' | 'system'

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveIsDark(mode: ThemeMode, isSystemDark: boolean): boolean {
  if (mode === 'system') return isSystemDark
  return mode === 'dark'
}

export function nextThemeMode(mode: ThemeMode): ThemeMode {
  if (mode === 'system') return 'light'
  if (mode === 'light') return 'dark'
  return 'system'
}

// The legacy key stored the boolean dark flag as a string.
export function migrateLegacyDarkFlag(legacy: string): ThemeMode {
  return legacy === 'true' ? 'dark' : 'light'
}
