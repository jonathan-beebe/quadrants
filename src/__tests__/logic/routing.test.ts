import { describe, it, expect } from 'vitest'
import { isNamedRoute, idFromPathname, pathForId } from '../../logic/routing'

const BASE = import.meta.env.BASE_URL ?? '/'

describe('isNamedRoute', () => {
  it('recognizes the design-system route', () => {
    expect(isNamedRoute('design-system')).toBe(true)
  })

  it('rejects framework ids and null', () => {
    expect(isNamedRoute('my-framework-id')).toBe(false)
    expect(isNamedRoute(null)).toBe(false)
  })
})

describe('idFromPathname', () => {
  it('returns null for the base path', () => {
    expect(idFromPathname(BASE)).toBeNull()
  })

  it('returns the path segment as an id', () => {
    expect(idFromPathname(`${BASE}my-framework-id`)).toBe('my-framework-id')
  })

  it('falls back to stripping the leading slash when the pathname is outside the base', () => {
    expect(idFromPathname('/other')).toBe('other')
  })
})

describe('pathForId', () => {
  it('builds the path for a framework id', () => {
    expect(pathForId('fw-1')).toBe(`${BASE}fw-1`)
  })

  it('returns the base path for null', () => {
    expect(pathForId(null)).toBe(BASE)
  })

  it('round-trips with idFromPathname', () => {
    expect(idFromPathname(pathForId('fw-1'))).toBe('fw-1')
    expect(idFromPathname(pathForId(null))).toBeNull()
  })
})
