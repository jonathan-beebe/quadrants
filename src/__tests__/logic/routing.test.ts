import { describe, it, expect, beforeEach } from 'vitest'
import { getIdFromPath, getHashFromUrl, pushPath, replacePath } from '../../logic/routing'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  window.location.hash = ''
})

describe('getIdFromPath', () => {
  it('returns null for the root path', () => {
    window.history.replaceState(null, '', '/')
    expect(getIdFromPath()).toBeNull()
  })

  it('returns the path segment as an id', () => {
    window.history.replaceState(null, '', '/my-framework-id')
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
    expect(window.location.pathname).toBe('/fw-1')
  })

  it('pushes root when id is null', () => {
    window.history.replaceState(null, '', '/something')
    pushPath(null)
    expect(window.location.pathname).toBe('/')
  })

  it('does not push if already on the correct path', () => {
    window.history.replaceState(null, '', '/fw-1')
    const before = window.history.length
    pushPath('fw-1')
    // History length should not increase
    expect(window.history.length).toBe(before)
  })
})

describe('replacePath', () => {
  it('replaces to a framework path', () => {
    replacePath('fw-1')
    expect(window.location.pathname).toBe('/fw-1')
  })

  it('replaces to root when id is null', () => {
    window.history.replaceState(null, '', '/something')
    replacePath(null)
    expect(window.location.pathname).toBe('/')
  })
})
