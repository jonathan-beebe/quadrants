import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Stub modules that useFrameworkSharing depends on so `share` runs in isolation.
vi.mock('../../sharing', () => ({
  encodeFramework: vi.fn().mockResolvedValue('encoded-hash-payload'),
  decodeSharedPayload: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../routing', () => ({
  getHashFromUrl: vi.fn().mockReturnValue(null),
  replacePath: vi.fn(),
}))

vi.mock('../../io', () => ({
  downloadJson: vi.fn(),
  pickJsonFile: vi.fn().mockResolvedValue(null),
}))

import { useFrameworkSharing } from '../../hooks/useFrameworkSharing'
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

describe('useFrameworkSharing share clipboard feature detection (BUG-025)', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share')

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard)
    } else {
      // jsdom may not define it -- delete to restore "absent" state
      // @ts-expect-error -- test-only cleanup
      delete (navigator as Navigator).clipboard
    }
    if (originalShare) {
      Object.defineProperty(navigator, 'share', originalShare)
    } else {
      // @ts-expect-error -- test-only cleanup
      delete (navigator as Navigator).share
    }
  })

  it('reports outcome=copied and writes to the clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const { result } = renderHook(() => useFrameworkSharing(makeOptions()))

    const out = await result.current.share(makeFramework())

    expect(out.outcome).toBe('copied')
    expect(out.url).toContain('#encoded-hash-payload')
    expect(writeText).toHaveBeenCalledWith(out.url)
  })

  // BUG-002: clipboard absent (insecure context, sandbox) must NOT report copied.
  it('falls back to navigator.share when clipboard is undefined (BUG-002)', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })

    const { result } = renderHook(() => useFrameworkSharing(makeOptions()))

    const out = await result.current.share(makeFramework())

    expect(out.outcome).toBe('shared')
    expect(share).toHaveBeenCalledWith({ url: out.url })
  })

  // BUG-002: clipboard rejection must NOT report copied; navigator.share is tried.
  it('falls back to navigator.share when clipboard.writeText rejects (BUG-002)', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })

    const { result } = renderHook(() => useFrameworkSharing(makeOptions()))

    const out = await result.current.share(makeFramework())

    expect(out.outcome).toBe('shared')
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(share).toHaveBeenCalledTimes(1)
  })

  // BUG-002: user cancelling the native share sheet is not an error.
  it('reports outcome=cancelled when the user aborts navigator.share', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    const abort = new DOMException('aborted', 'AbortError')
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(abort),
    })

    const { result } = renderHook(() => useFrameworkSharing(makeOptions()))

    const out = await result.current.share(makeFramework())

    expect(out.outcome).toBe('cancelled')
  })

  // BUG-002: when nothing can deliver the URL, the outcome is 'failed'.
  it('reports outcome=failed when both clipboard and share are unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    // @ts-expect-error -- test-only cleanup
    delete (navigator as Navigator).share

    const { result } = renderHook(() => useFrameworkSharing(makeOptions()))

    const out = await result.current.share(makeFramework())

    expect(out.outcome).toBe('failed')
    expect(out.url).toContain('#encoded-hash-payload')
  })
})
