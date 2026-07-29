import { describe, it, expect } from 'vitest'
import { isNamedRoute, idFromPathname, pathForId } from '../../logic/routing'

// RFCTR-011: the path↔id rules take the base explicitly, so the production
// subpath base is testable here with hard-coded literals — no env reads.

describe('isNamedRoute', () => {
  it('recognizes the design-system route', () => {
    expect(isNamedRoute('design-system')).toBe(true)
  })

  it('rejects framework ids and null', () => {
    expect(isNamedRoute('my-framework-id')).toBe(false)
    expect(isNamedRoute(null)).toBe(false)
  })
})

describe('under the root base "/"', () => {
  it('returns null for the base path', () => {
    expect(idFromPathname('/', '/')).toBeNull()
  })

  it('returns the path segment as an id', () => {
    expect(idFromPathname('/my-framework-id', '/')).toBe('my-framework-id')
  })

  it('builds the path for a framework id', () => {
    expect(pathForId('fw-1', '/')).toBe('/fw-1')
  })

  it('returns the base path for null', () => {
    expect(pathForId(null, '/')).toBe('/')
  })

  it('round-trips with idFromPathname', () => {
    expect(idFromPathname(pathForId('fw-1', '/'), '/')).toBe('fw-1')
    expect(idFromPathname(pathForId(null, '/'), '/')).toBeNull()
  })
})

describe('under a non-root base "/quadrants/" (the GitHub Pages deploy)', () => {
  it('strips the base prefix from a deep link', () => {
    expect(idFromPathname('/quadrants/my-framework-id', '/quadrants/')).toBe('my-framework-id')
  })

  it('returns null for the base-only pathname', () => {
    expect(idFromPathname('/quadrants/', '/quadrants/')).toBeNull()
  })

  it('falls back to stripping the leading slash for a pathname outside the base', () => {
    expect(idFromPathname('/other', '/quadrants/')).toBe('other')
  })

  it('builds the path for a framework id under the base', () => {
    expect(pathForId('fw-1', '/quadrants/')).toBe('/quadrants/fw-1')
  })

  it('returns the base path for null', () => {
    expect(pathForId(null, '/quadrants/')).toBe('/quadrants/')
  })

  it('round-trips with idFromPathname', () => {
    expect(idFromPathname(pathForId('fw-1', '/quadrants/'), '/quadrants/')).toBe('fw-1')
    expect(idFromPathname(pathForId(null, '/quadrants/'), '/quadrants/')).toBeNull()
  })
})
