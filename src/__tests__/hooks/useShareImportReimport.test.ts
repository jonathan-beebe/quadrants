import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const validPayload = {
  id: 'fw-1',
  name: 'Shared',
  axisX: '',
  axisY: '',
  quadrants: [
    { label: 'Q1', color: '#fbbf24', items: [] },
    { label: 'Q2', color: '#60a5fa', items: [] },
    { label: 'Q3', color: '#34d399', items: [] },
    { label: 'Q4', color: '#f472b6', items: [] },
  ],
}

vi.mock('../../sharing', () => ({
  encodeFramework: vi.fn(),
  decodeSharedPayload: vi.fn(() => Promise.resolve(validPayload)),
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

describe('useShareImport same-link re-import (BUG-008)', () => {
  const originalHash = window.location.hash

  beforeEach(() => {
    history.replaceState(null, '', `${window.location.pathname}#same-share-hash`)
  })

  afterEach(() => {
    history.replaceState(null, '', `${window.location.pathname}${originalHash}`)
  })

  it('imports again when the identical share link is activated after the first import resolved', async () => {
    const opts = makeOptions()
    renderHook(() => useShareImport(opts))

    // First activation: let the decode promise and the deferred
    // navigate/replacePath timeout fully resolve.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })
    expect(opts.addRaw).toHaveBeenCalledTimes(1)

    // The user deletes the framework (getFramework still returns null) and
    // clicks the very same share link again in the same tab.
    await act(async () => {
      history.replaceState(null, '', `${window.location.pathname}#same-share-hash`)
      window.dispatchEvent(new Event('hashchange'))
      await new Promise((r) => setTimeout(r, 10))
    })

    // Second activation must import again, not silently no-op.
    expect(opts.addRaw).toHaveBeenCalledTimes(2)

    // And the hash must not linger in the URL.
    expect(window.location.hash).toBe('')
  })
})
