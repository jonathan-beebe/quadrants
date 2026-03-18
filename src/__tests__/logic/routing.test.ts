import { describe, it, expect, beforeEach } from 'vitest'
import { getIdFromPath, getHashFromUrl, pushPath, replacePath } from '../../logic/routing'

const BASE = import.meta.env.BASE_URL ?? '/'

beforeEach(() => {
  window.history.replaceState(null, '', BASE)
  window.location.hash = ''
})

describe('getIdFromPath', () => {
  it('returns null for the base path', () => {
    window.history.replaceState(null, '', BASE)
    expect(getIdFromPath()).toBeNull()
  })

  it('returns the path segment as an id', () => {
    window.history.replaceState(null, '', `${BASE}my-framework-id`)
    expect(getIdFromPath()).toBe('my-framework-id')
  })
})

describe('getHashFromUrl', () => {
  it('returns empty string when no hash', () => {
    expect(getHashFromUrl()).toBe('')
  })

  it('returns the hash without the # prefix', () => {
    window.location.hash = '#abc123'
    expect(getHashFromUrl()).toBe('abc123')
  })
})

describe('pushPath', () => {
  it('pushes a framework path', () => {
    pushPath('fw-1')
    expect(window.location.pathname).toBe(`${BASE}fw-1`)
  })

  it('pushes base when id is null', () => {
    window.history.replaceState(null, '', `${BASE}something`)
    pushPath(null)
    expect(window.location.pathname).toBe(BASE)
  })

  it('does not push if already on the correct path', () => {
    window.history.replaceState(null, '', `${BASE}fw-1`)
    const before = window.history.length
    pushPath('fw-1')
    // History length should not increase
    expect(window.history.length).toBe(before)
  })
})

describe('replacePath', () => {
  it('replaces to a framework path', () => {
    replacePath('fw-1')
    expect(window.location.pathname).toBe(`${BASE}fw-1`)
  })

  it('replaces to base when id is null', () => {
    window.history.replaceState(null, '', `${BASE}something`)
    replacePath(null)
    expect(window.location.pathname).toBe(BASE)
  })
})
