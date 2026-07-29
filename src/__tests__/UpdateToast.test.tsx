import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// Track the onRegistered callback so we can invoke it after render
let capturedOnRegistered: ((reg: unknown) => void) | undefined

// Mutable so a test can mount the banner itself, not just the registration side effects
let needRefresh = false

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (opts: { onRegistered?: (reg: unknown) => void }) => {
    capturedOnRegistered = opts.onRegistered
    return {
      needRefresh: [needRefresh, vi.fn()],
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
    needRefresh = false
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

  describe('presentation (DSGN-003)', () => {
    beforeEach(() => {
      needRefresh = true
    })

    it('lays out in the width available to it rather than a half-viewport slot', () => {
      render(<UpdateToast />)
      const banner = screen.getByRole('status')

      // Anchored to both edges with a gutter, so the box has a real width to lay
      // out in at any viewport.
      expect(banner).toHaveClass('fixed', 'bottom-5', 'inset-x-3', 'mx-auto', 'z-[9999]')

      // The defect: a shrink-to-fit fixed box at left:50% can only ever draw on
      // the half of the viewport to its right.
      expect(banner).not.toHaveClass('left-1/2')
      expect(banner).not.toHaveClass('-translate-x-1/2')
    })

    it('caps its reading measure on wide viewports', () => {
      render(<UpdateToast />)

      expect(screen.getByRole('status')).toHaveClass('max-w-md')
    })

    it('keeps message, Reload, and Dismiss on a single row', () => {
      render(<UpdateToast />)
      const banner = screen.getByRole('status')

      expect(banner).toHaveClass('flex', 'items-center')
      expect(screen.getByText('A new version is available.')).toHaveClass('flex-1')
      expect(screen.getByRole('button', { name: 'Reload' })).toHaveClass('shrink-0')
      expect(screen.getByRole('button', { name: 'Dismiss update notification' })).toHaveClass('shrink-0')
    })

    it('keeps announcing once as a polite status (A11Y-007)', () => {
      render(<UpdateToast />)

      const banner = screen.getByRole('status')
      expect(banner).not.toHaveAttribute('aria-live')
      expect(banner).not.toHaveAttribute('role', 'alert')
    })

    it('keeps the dismiss control at a 24x24 target (A11Y-017)', () => {
      render(<UpdateToast />)

      expect(screen.getByRole('button', { name: 'Dismiss update notification' })).toHaveClass('w-6', 'h-6')
    })
  })
})
