import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock decodeSharedPayload to return a never-resolving promise so we can
// observe state *before* the async decode completes.
vi.mock('../../sharing', () => ({
  encodeFramework: vi.fn(),
  decodeSharedPayload: vi.fn(() => new Promise(() => {})),
}))

// Use the real routing module so replacePath/getHashFromUrl actually
// touch window.location and window.history.
vi.mock('../../io', () => ({
  downloadJson: vi.fn(),
  pickJsonFile: vi.fn().mockResolvedValue(null),
}))

import { useFrameworkSharing } from '../../hooks/useFrameworkSharing'

function makeOptions() {
  return {
    getFramework: vi.fn().mockReturnValue(null),
    navigate: vi.fn(),
    addRaw: vi.fn(),
    replace: vi.fn(),
    addImport: vi.fn(),
  }
}

describe('useFrameworkSharing URL hash cleanup', () => {
  const originalHash = window.location.hash

  beforeEach(() => {
    // Seed the URL with a hash payload as if the user followed a share link.
    history.replaceState(null, '', `${window.location.pathname}#shared-payload-abc`)
  })

  afterEach(() => {
    history.replaceState(null, '', `${window.location.pathname}${originalHash}`)
  })

  it('clears window.location.hash synchronously when importFromHash starts, before decode resolves', () => {
    // Sanity: the hash is present before mounting the hook.
    expect(window.location.hash).toBe('#shared-payload-abc')

    const opts = makeOptions()
    renderHook(() => useFrameworkSharing(opts))

    // The hook's mount effect calls importFromHash(). Because decodeSharedPayload
    // returns a never-resolving promise, no .then/.catch handlers can run.
    // The hash must already be cleared by this point — otherwise a refresh
    // during the async decode window re-imports the same payload.
    expect(window.location.hash).toBe('')
  })
})
