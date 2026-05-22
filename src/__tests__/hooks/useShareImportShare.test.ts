import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Stub modules that useShareImport depends on so `share` runs in isolation.
vi.mock('../../sharing', () => ({
  encodeFramework: vi.fn().mockResolvedValue('encoded-hash-payload'),
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
import type { Framework } from '../../types'

function makeOptions() {
  return {
    getFramework: vi.fn().mockReturnValue(null),
    navigate: vi.fn(),
    addRaw: vi.fn(),
    replace: vi.fn(),
    addImport: vi.fn(),
  }
}

function makeFramework(): Framework {
  return {
    id: 'fw-1',
    name: 'Test',
    axisX: 'x',
    axisY: 'y',
    quadrants: [
      { label: 'A', color: '#aaaaaa', items: [] },
      { label: 'B', color: '#bbbbbb', items: [] },
      { label: 'C', color: '#cccccc', items: [] },
      { label: 'D', color: '#dddddd', items: [] },
    ],
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('useShareImport share clipboard feature detection (BUG-025)', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard)
    } else {
      // jsdom may not define it -- delete to restore "absent" state
      // @ts-expect-error -- test-only cleanup
      delete (navigator as Navigator).clipboard
    }
  })

  it('returns the share URL even when navigator.clipboard is undefined', async () => {
    // Simulate insecure context / older browser where clipboard is absent.
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useShareImport(makeOptions()))

    const url = await result.current.share(makeFramework())

    expect(typeof url).toBe('string')
    expect(url.length).toBeGreaterThan(0)
    expect(url).toContain('#encoded-hash-payload')
  })

  it('returns the share URL even when clipboard.writeText rejects', async () => {
    // Simulate a focused-tab/permission-policy rejection.
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const { result } = renderHook(() => useShareImport(makeOptions()))

    const url = await result.current.share(makeFramework())

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(typeof url).toBe('string')
    expect(url.length).toBeGreaterThan(0)
    expect(url).toContain('#encoded-hash-payload')
  })

  it('still writes to the clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const { result } = renderHook(() => useShareImport(makeOptions()))

    const url = await result.current.share(makeFramework())

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith(url)
  })
})
