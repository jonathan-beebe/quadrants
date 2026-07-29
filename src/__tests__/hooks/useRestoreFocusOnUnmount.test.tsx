import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRef, useState, type RefObject } from 'react'
import { useRestoreFocusOnUnmount } from '../../hooks/useRestoreFocusOnUnmount'

function Surface({ openerRef }: { openerRef?: RefObject<HTMLElement | null> }) {
  useRestoreFocusOnUnmount(openerRef)
  return <button autoFocus>Inside the surface</button>
}

/** A surface that can be closed, with two candidate openers to return to. */
function Host({ target = 'first' }: { target?: 'first' | 'second' }) {
  const [open, setOpen] = useState(true)
  const first = useRef<HTMLButtonElement>(null)
  const second = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  // Refs attach after the first render, so this settles on the re-render —
  // which is also how a test re-points it while the surface is still open.
  openerRef.current = target === 'first' ? first.current : second.current

  return (
    <div>
      <button ref={first}>First opener</button>
      <button ref={second}>Second opener</button>
      <button onClick={() => setOpen(false)}>Close</button>
      {open && <Surface openerRef={openerRef} />}
    </div>
  )
}

// A11Y-022, extracted in RFCTR-020: every exit from a modal surface unmounts
// it, so unmount is the one cleanup that covers them all.
describe('useRestoreFocusOnUnmount', () => {
  it('returns focus to the opener when the surface unmounts', () => {
    const { rerender } = render(<Host />)
    expect(screen.getByRole('button', { name: 'Inside the surface' })).toHaveFocus()
    rerender(<Host />)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('button', { name: 'First opener' })).toHaveFocus()
  })

  it('reads the ref at cleanup time, so a host that re-points it mid-life is honoured', () => {
    const { rerender } = render(<Host />)
    // The host re-points the opener while the surface is still open — a list
    // re-rendering behind an open modal is the real case.
    rerender(<Host target="second" />)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('button', { name: 'Second opener' })).toHaveFocus()
  })

  it('does nothing when there is no opener to return to', () => {
    const { unmount } = render(<Surface />)
    expect(() => unmount()).not.toThrow()
  })
})
