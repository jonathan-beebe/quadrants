import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// RFCTR-014: share delivery lives in the sharing adapter and the URL in the
// routing adapter, so every dependency of `share` mocks as a module — the
// hook under test is pure orchestration.
vi.mock('../../sharing', () => ({
  encodeFramework: vi.fn().mockResolvedValue('encoded-hash-payload'),
  decodeSharedPayload: vi.fn().mockResolvedValue(null),
  deliverShareUrl: vi.fn().mockResolvedValue('copied'),
}))

vi.mock('../../routing', () => ({
  getHashFromUrl: vi.fn().mockReturnValue(null),
  getShareUrl: vi.fn((hash: string) => `https://app.example/base/#${hash}`),
  replacePath: vi.fn(),
}))

vi.mock('../../io', () => ({
  downloadJson: vi.fn(),
  pickJsonFile: vi.fn().mockResolvedValue(null),
}))

import { useFrameworkSharing } from '../../hooks/useFrameworkSharing'
import { encodeFramework, deliverShareUrl, type ShareOutcome } from '../../sharing'
import { getShareUrl } from '../../routing'
import type { Framework } from '../../types'

function makeOptions() {
  return {
    getFramework: vi.fn().mockReturnValue(null),
    navigate: vi.fn(),
    addRaw: vi.fn(),
    replace: vi.fn(),
    addImport: vi.fn(),
    mainRef: { current: null },
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

describe('useFrameworkSharing share orchestration (RFCTR-014)', () => {
  beforeEach(() => {
    vi.mocked(deliverShareUrl).mockResolvedValue('copied')
  })

  it('encodes the framework, composes the URL via routing, and delivers it via sharing', async () => {
    const fw = makeFramework()
    const { result } = renderHook(() => useFrameworkSharing(makeOptions()))

    const out = await result.current.share(fw)

    expect(encodeFramework).toHaveBeenCalledWith(fw)
    expect(getShareUrl).toHaveBeenCalledWith('encoded-hash-payload')
    expect(deliverShareUrl).toHaveBeenCalledWith('https://app.example/base/#encoded-hash-payload')
    expect(out.url).toBe('https://app.example/base/#encoded-hash-payload')
  })

  // BUG-002 semantics: whatever the adapter resolves is the outcome the hook
  // reports — copied, shared, cancelled, and failed pass through unchanged.
  it.each(['copied', 'shared', 'cancelled', 'failed'] as ShareOutcome[])(
    'reports outcome=%s as the adapter resolves it',
    async (outcome) => {
      vi.mocked(deliverShareUrl).mockResolvedValue(outcome)
      const { result } = renderHook(() => useFrameworkSharing(makeOptions()))

      const out = await result.current.share(makeFramework())

      expect(out.outcome).toBe(outcome)
    },
  )
})
