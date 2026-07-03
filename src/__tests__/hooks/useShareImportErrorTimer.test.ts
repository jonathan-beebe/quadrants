import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Stub modules that useShareImport depends on
vi.mock('../../sharing', () => ({
  encodeFramework: vi.fn(),
  decodeSharedPayload: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../logic/routing', () => ({
  getHashFromUrl: vi.fn().mockReturnValue(null),
  replacePath: vi.fn(),
}))

vi.mock('../../io', () => ({
  downloadJson: vi.fn(),
  pickJsonFile: vi.fn().mockResolvedValue(null),
}))

import { useShareImport } from '../../hooks/useShareImport'

function makeOptions() {
  return {
    getFramework: vi.fn().mockReturnValue(null),
    navigate: vi.fn(),
    addRaw: vi.fn(),
    replace: vi.fn(),
    addImport: vi.fn(),
  }
}

describe('useShareImport error timer cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clears the pending error timer on unmount', async () => {
    const opts = makeOptions()
    const { result, unmount } = renderHook(() => useShareImport(opts))

    // Trigger an error by importing invalid JSON
    const { pickJsonFile } = await import('../../io')
    vi.mocked(pickJsonFile).mockResolvedValueOnce('{ "bad": true }')

    await act(async () => {
      result.current.importJson(vi.fn())
    })

    // Error should be set, and its 5-second auto-dismiss timer pending.
    expect(result.current.error).toBe('The file is not a valid framework. It must have a name and 4 quadrants.')
    expect(vi.getTimerCount()).toBeGreaterThan(0)

    unmount()

    // The unmount cleanup clears the pending timer — observable as an empty
    // fake-timer pool. Removing the cleanup leaves the 5s timer pending and
    // fails this assertion.
    expect(vi.getTimerCount()).toBe(0)
  })
})
