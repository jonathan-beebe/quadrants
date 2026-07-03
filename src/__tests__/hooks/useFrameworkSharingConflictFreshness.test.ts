import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock sharing so decodeSharedPayload resolves with our crafted payload.
vi.mock('../../sharing', () => ({
  encodeFramework: vi.fn(),
  decodeSharedPayload: vi.fn(),
}))

vi.mock('../../logic/routing', () => ({
  getHashFromUrl: vi.fn(),
  replacePath: vi.fn(),
}))

vi.mock('../../io', () => ({
  downloadJson: vi.fn(),
  pickJsonFile: vi.fn().mockResolvedValue(null),
}))

import { useFrameworkSharing } from '../../hooks/useFrameworkSharing'
import { decodeSharedPayload } from '../../sharing'
import { getHashFromUrl } from '../../logic/routing'
import type { Framework, SharedPayload } from '../../types'

function makeExisting(): Framework {
  return {
    id: 'fw-1',
    name: 'Local Name',
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

function makePayload(): SharedPayload {
  return {
    id: 'fw-1',
    name: 'Imported Name',
    axisX: 'x',
    axisY: 'y',
    quadrants: [
      { label: 'A', color: '#aaaaaa', items: [] },
      { label: 'B', color: '#bbbbbb', items: [] },
      { label: 'C', color: '#cccccc', items: [] },
      { label: 'D', color: '#dddddd', items: [] },
    ],
  }
}

describe('useFrameworkSharing conflict replace freshness (BUG-027)', () => {
  beforeEach(() => {
    vi.mocked(getHashFromUrl).mockReturnValue('payload-hash')
    vi.mocked(decodeSharedPayload).mockResolvedValue(makePayload())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('re-reads the current existing framework via getFramework when applying the conflict replace', async () => {
    const existing = makeExisting()
    const getFramework = vi.fn().mockReturnValue(existing)
    const replace = vi.fn()
    const navigate = vi.fn()
    const addRaw = vi.fn()
    const addImport = vi.fn()

    const { result } = renderHook(() => useFrameworkSharing({ getFramework, navigate, addRaw, replace, addImport }))

    // Wait for decodeSharedPayload promise and the queued setTimeout(0) that
    // surfaces the conflict to flush.
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(result.current.conflict).not.toBeNull()

    // Baseline: the initial decode path read getFramework once.
    const callsBeforeReplace = getFramework.mock.calls.length

    act(() => {
      result.current.handleConflictReplace()
    })

    // The fix: handleConflictReplace must consult the latest framework state
    // via getFramework(conflict.incoming.id) before applying the replace, so
    // any local edits made while the dialog was open are considered.
    expect(getFramework.mock.calls.length).toBeGreaterThan(callsBeforeReplace)
    expect(getFramework).toHaveBeenLastCalledWith('fw-1')
    expect(replace).toHaveBeenCalledTimes(1)
  })
})
