import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Stub modules that useShareImport depends on
vi.mock('../../sharing', () => ({
  encodeFramework: vi.fn(),
  decodeFramework: vi.fn().mockResolvedValue(null),
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

    // Error should be set
    expect(result.current.error).toBe('The file is not a valid framework. It must have a name and 4 quadrants.')

    // Spy on clearTimeout before unmount
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    unmount()

    // The cleanup effect should call clearTimeout for the pending 5-second timer
    expect(clearTimeoutSpy).toHaveBeenCalled()

    clearTimeoutSpy.mockRestore()
  })
})
