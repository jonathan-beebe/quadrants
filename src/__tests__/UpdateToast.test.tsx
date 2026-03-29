import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

// Track the onRegistered callback so we can invoke it after render
let capturedOnRegistered: ((reg: unknown) => void) | undefined

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (opts: { onRegistered?: (reg: unknown) => void }) => {
    capturedOnRegistered = opts.onRegistered
    return {
      needRefresh: [false, vi.fn()],
      updateServiceWorker: vi.fn(),
    }
  },
}))

// Import after mock is set up
import UpdateToast from '../components/UpdateToast'

describe('UpdateToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    capturedOnRegistered = undefined
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('clears the update-check interval on unmount', () => {
    const fakeRegistration = { update: vi.fn() }

    const { unmount } = render(<UpdateToast />)

    // Simulate the service worker registration callback
    capturedOnRegistered?.(fakeRegistration)

    // Advance time to confirm the interval is active
    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(fakeRegistration.update).toHaveBeenCalledTimes(1)

    // Unmount and advance again — no additional calls should happen
    unmount()
    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(fakeRegistration.update).toHaveBeenCalledTimes(1)
  })

  it('does not leak intervals across multiple mount/unmount cycles', () => {
    const fakeRegistration = { update: vi.fn() }

    // Mount and unmount 3 times
    for (let i = 0; i < 3; i++) {
      const { unmount } = render(<UpdateToast />)
      capturedOnRegistered?.(fakeRegistration)
      unmount()
    }

    // After all unmounts, advancing time should trigger zero calls
    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(fakeRegistration.update).toHaveBeenCalledTimes(0)
  })
})
