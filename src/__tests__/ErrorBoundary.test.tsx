import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from '../components/ErrorBoundary'

// React reports caught render errors via console.error, and componentDidCatch
// logs again; the suite-wide trap in test-setup.ts would fail every test here,
// so use its documented opt-out.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function Bomb(): never {
  throw new Error('Kaboom')
}

// MAINT-009: the boundary is the app's crash-recovery mechanism — the default
// alert fallback, the Try-again reset, and the custom-fallback branch.
describe('ErrorBoundary', () => {
  it('shows the alert fallback with the thrown message when a child crashes', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    const alert = screen.getByRole('alert')
    expect(within(alert).getByText('Something went wrong')).toBeInTheDocument()
    expect(within(alert).getByText('Kaboom')).toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('restores the children when Try again follows a transient crash', async () => {
    const user = userEvent.setup()
    let shouldThrow = true
    function ThrowOnce() {
      if (shouldThrow) throw new Error('Transient crash')
      return <p>Recovered content</p>
    }

    render(
      <ErrorBoundary>
        <ThrowOnce />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('Recovered content')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders a custom fallback instead of the default alert', () => {
    render(
      <ErrorBoundary fallback={<p>Custom fallback content</p>}>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom fallback content')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
