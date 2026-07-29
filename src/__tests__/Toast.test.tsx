import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Toast from '../components/Toast'

describe('Toast', () => {
  afterEach(cleanup)

  describe('presentation (DSGN-003)', () => {
    // The error toast and the update banner are the same component class wearing
    // different colors, so they resolve to one anchoring rule.
    it('is anchored exactly as the update banner is', () => {
      render(<Toast message="Something went wrong." onDismiss={vi.fn()} />)
      const toast = screen.getByRole('alert')

      expect(toast).toHaveClass('fixed', 'bottom-5', 'inset-x-3', 'mx-auto', 'z-[9999]', 'max-w-md')
      expect(toast).not.toHaveClass('left-1/2')
      expect(toast).not.toHaveClass('-translate-x-1/2')
    })

    it('keeps message and Dismiss on a single row', () => {
      render(<Toast message="Something went wrong." onDismiss={vi.fn()} />)

      expect(screen.getByRole('alert')).toHaveClass('flex', 'items-center')
      expect(screen.getByText('Something went wrong.')).toHaveClass('flex-1')
      expect(screen.getByRole('button', { name: 'Dismiss error' })).toHaveClass('shrink-0')
    })

    it('keeps the dismiss control at a 24x24 target (A11Y-017)', () => {
      render(<Toast message="Something went wrong." onDismiss={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Dismiss error' })).toHaveClass('w-6', 'h-6')
    })
  })
})
