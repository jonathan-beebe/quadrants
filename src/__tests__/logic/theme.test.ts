import { describe, it, expect } from 'vitest'
import { isThemeMode, resolveIsDark, nextThemeMode, migrateLegacyDarkFlag } from '../../logic/theme'

// RFCTR-010: the pure theme rules, extracted from useDarkMode.

describe('isThemeMode', () => {
  it.each(['light', 'dark', 'system'])('accepts %s', (value) => {
    expect(isThemeMode(value)).toBe(true)
  })

  it.each(['bogus', '', null, undefined, true])('rejects %s', (value) => {
    expect(isThemeMode(value)).toBe(false)
  })
})

describe('resolveIsDark', () => {
  it('follows the system preference in system mode', () => {
    expect(resolveIsDark('system', true)).toBe(true)
    expect(resolveIsDark('system', false)).toBe(false)
  })

  it('ignores the system preference in explicit modes', () => {
    expect(resolveIsDark('dark', false)).toBe(true)
    expect(resolveIsDark('light', true)).toBe(false)
  })
})

describe('nextThemeMode', () => {
  it('cycles system → light → dark → system', () => {
    expect(nextThemeMode('system')).toBe('light')
    expect(nextThemeMode('light')).toBe('dark')
    expect(nextThemeMode('dark')).toBe('system')
  })
})

describe('migrateLegacyDarkFlag', () => {
  it('maps legacy "true" to dark', () => {
    expect(migrateLegacyDarkFlag('true')).toBe('dark')
  })

  it('maps any other legacy value to light', () => {
    expect(migrateLegacyDarkFlag('false')).toBe('light')
    expect(migrateLegacyDarkFlag('garbage')).toBe('light')
  })
})
