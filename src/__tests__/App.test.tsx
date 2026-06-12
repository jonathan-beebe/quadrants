import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { encodeFramework } from '../sharing'
import { useIsMobile } from '../hooks/useIsMobile'
import type { Framework } from '../types'

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

beforeEach(() => {
  localStorage.clear()
  // Reset URL
  window.history.replaceState(null, '', '/')
  window.location.hash = ''
  vi.mocked(useIsMobile).mockReturnValue(false)
})

describe('App', () => {
  it('renders the empty state when no frameworks exist', () => {
    render(<App />)
    expect(screen.getByText('No framework selected')).toBeInTheDocument()
    expect(screen.getByText('Create Framework')).toBeInTheDocument()
  })

  it('shows sidebar with app title', () => {
    render(<App />)
    expect(screen.getByText('Quadrants')).toBeInTheDocument()
  })

  describe('sidebar state across the 768px breakpoint (BUG-012)', () => {
    // The floating "Open sidebar" button renders only while the sidebar is
    // closed, making it the observable closed-state marker.
    it('closes the drawer when crossing desktop → mobile, leaving main interactive', () => {
      const { rerender } = render(<App />)
      // Desktop default: sidebar open.
      expect(screen.queryByRole('button', { name: /open sidebar/i })).not.toBeInTheDocument()

      vi.mocked(useIsMobile).mockReturnValue(true)
      rerender(<App />)

      // No uninvited modal drawer: drawer closed, no backdrop, main not
      // inert, focus not stolen into the drawer.
      expect(screen.getAllByRole('button', { name: /open sidebar/i }).length).toBeGreaterThan(0)
      expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
      expect(screen.getByRole('main')).not.toHaveAttribute('inert')
      expect(document.activeElement).not.toBe(screen.getByRole('button', { name: /close sidebar/i, hidden: true }))
    })

    it('reopens the sidebar when crossing mobile → desktop, matching a fresh desktop load', () => {
      vi.mocked(useIsMobile).mockReturnValue(true)
      const { rerender } = render(<App />)
      // Mobile default: drawer closed.
      expect(screen.getAllByRole('button', { name: /open sidebar/i }).length).toBeGreaterThan(0)

      vi.mocked(useIsMobile).mockReturnValue(false)
      rerender(<App />)

      expect(screen.queryByRole('button', { name: /open sidebar/i })).not.toBeInTheDocument()
    })
  })

  it('opens the framework builder when "Create Framework" is clicked from empty state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('Create Framework'))
    expect(screen.getByText('Start from a template')).toBeInTheDocument()
  })

  it('creates a framework from a template and displays it', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Open builder
    await user.click(screen.getByText('Create Framework'))
    // Select a template
    await user.click(screen.getByRole('button', { name: /Start \/ Stop/ }))
    // Submit
    await user.click(screen.getByRole('button', { name: 'Create Framework' }))

    // Should now show the canvas with quadrant labels
    expect(screen.getByRole('heading', { name: 'Start / Stop / Continue / Change' })).toBeInTheDocument()
    expect(screen.getByText('Start')).toBeInTheDocument()
    expect(screen.getByText('Stop')).toBeInTheDocument()
    expect(screen.getByText('Continue')).toBeInTheDocument()
    expect(screen.getByText('Change')).toBeInTheDocument()
  })

  it('shows an error toast when persisting to localStorage fails (BUG-010)', async () => {
    const user = userEvent.setup()
    render(<App />)

    // No save-failure message while saves succeed.
    expect(screen.queryByText(/could not be saved/i)).not.toBeInTheDocument()

    // Storage starts failing (e.g. quota exceeded); the next edit must
    // surface a visible error instead of silently losing data.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await user.click(screen.getByText('Create Framework'))
    await user.click(screen.getByRole('button', { name: /Start \/ Stop/ }))
    await user.click(screen.getByRole('button', { name: 'Create Framework' }))

    expect(await screen.findByText(/could not be saved/i)).toBeInTheDocument()

    vi.restoreAllMocks()
  })

  it('persists frameworks to localStorage', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('Create Framework'))
    await user.click(screen.getByRole('button', { name: /Start \/ Stop/ }))
    await user.click(screen.getByRole('button', { name: 'Create Framework' }))

    const stored = JSON.parse(localStorage.getItem('quadrants_frameworks')!)
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Start / Stop / Continue / Change')
  })

  it('loads frameworks from localStorage on mount', () => {
    const framework = {
      id: 'stored-fw',
      name: 'Stored Framework',
      axisX: '',
      axisY: '',
      quadrants: [
        { label: 'A', color: '#fbbf24', items: [] },
        { label: 'B', color: '#60a5fa', items: [] },
        { label: 'C', color: '#34d399', items: [] },
        { label: 'D', color: '#f472b6', items: [] },
      ],
      createdAt: 1000,
      updatedAt: 1000,
    }
    localStorage.setItem('quadrants_frameworks', JSON.stringify([framework]))

    render(<App />)
    expect(screen.getByText('Stored Framework')).toBeInTheDocument()
  })

  it('redirects to home when URL points to a nonexistent framework', () => {
    window.history.replaceState(null, '', '/nonexistent-id')
    render(<App />)
    // Should show the empty state, not a broken view
    expect(screen.getByText('No framework selected')).toBeInTheDocument()
    // URL should be reset to base
    expect(window.location.pathname).toBe('/')
  })

  it('does not show the conflict dialog on the empty state', () => {
    render(<App />)
    // Real conflict-dialog assertions live in the hash import block (FEAT-001).
    expect(screen.queryByText('Framework already exists')).not.toBeInTheDocument()
  })

  describe('hash import', () => {
    const sharedFramework: Framework = {
      id: 'shared-fw',
      name: 'Shared Framework',
      axisX: 'Impact',
      axisY: 'Effort',
      quadrants: [
        { label: 'Quick Wins', color: '#fbbf24', items: [{ id: 'i1', text: 'Item A', x: 10, y: 20, createdAt: 1000 }] },
        { label: 'Big Bets', color: '#60a5fa', items: [] },
        { label: 'Fill Ins', color: '#34d399', items: [] },
        { label: 'Money Pit', color: '#f472b6', items: [] },
      ],
      createdAt: 1000,
      updatedAt: 1000,
    }

    it('imports a new framework from a URL hash', async () => {
      const hash = await encodeFramework(sharedFramework)
      window.location.hash = `#${hash}`

      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Framework' })).toBeInTheDocument()
      })
      expect(screen.getByText('Quick Wins')).toBeInTheDocument()
    })

    it('navigates to existing framework when hash matches', async () => {
      // Pre-populate localStorage with the same framework
      localStorage.setItem('quadrants_frameworks', JSON.stringify([sharedFramework]))
      const hash = await encodeFramework(sharedFramework)
      window.location.hash = `#${hash}`

      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Shared Framework' })).toBeInTheDocument()
      })
      // No conflict dialog should appear
      expect(screen.queryByText('Framework already exists')).not.toBeInTheDocument()
    })

    it('shows conflict dialog when hash has same ID but different content', async () => {
      // Pre-populate with a framework that has the same ID but different name
      const localFramework = {
        ...sharedFramework,
        name: 'My Local Version',
        quadrants: sharedFramework.quadrants.map((q, i) => ({
          ...q,
          label: `Local ${i + 1}`,
        })),
      }
      localStorage.setItem('quadrants_frameworks', JSON.stringify([localFramework]))

      const hash = await encodeFramework(sharedFramework)
      window.location.hash = `#${hash}`

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Framework already exists')).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Keep both' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Replace local' })).toBeInTheDocument()
    })

    // FEAT-001: end-to-end coverage for the three conflict-dialog resolutions.
    // The local framework setup is shared between the three actions, so it's
    // defined inline at the start of each test for readability.
    async function setupConflict() {
      const localFramework = {
        ...sharedFramework,
        name: 'My Local Version',
        quadrants: sharedFramework.quadrants.map((q, i) => ({ ...q, label: `Local ${i + 1}` })),
      }
      localStorage.setItem('quadrants_frameworks', JSON.stringify([localFramework]))
      const hash = await encodeFramework(sharedFramework)
      window.location.hash = `#${hash}`
      return { localFramework, hash }
    }

    it('Replace local swaps the stored framework for the incoming one (FEAT-001)', async () => {
      await setupConflict()
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => expect(screen.getByText('Framework already exists')).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: 'Replace local' }))

      await waitFor(() => expect(screen.queryByText('Framework already exists')).not.toBeInTheDocument())
      const stored = JSON.parse(localStorage.getItem('quadrants_frameworks')!)
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe('shared-fw')
      expect(stored[0].name).toBe('Shared Framework')
      // Active page heading reflects the replaced framework.
      expect(screen.getByRole('heading', { name: 'Shared Framework' })).toBeInTheDocument()
    })

    it('Keep both creates a duplicate alongside the local framework (FEAT-001)', async () => {
      await setupConflict()
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => expect(screen.getByText('Framework already exists')).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: 'Keep both' }))

      await waitFor(() => expect(screen.queryByText('Framework already exists')).not.toBeInTheDocument())
      const stored = JSON.parse(localStorage.getItem('quadrants_frameworks')!)
      expect(stored).toHaveLength(2)
      // Original local framework is untouched.
      const local = stored.find((fw: Framework) => fw.name === 'My Local Version')
      expect(local).toBeDefined()
      // A new framework was added with a different id.
      const duplicate = stored.find((fw: Framework) => fw.id !== 'shared-fw' && fw.name !== 'My Local Version')
      expect(duplicate).toBeDefined()
    })

    it('Cancel leaves the local framework untouched and clears the URL hash (FEAT-001)', async () => {
      const { localFramework } = await setupConflict()
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => expect(screen.getByText('Framework already exists')).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      await waitFor(() => expect(screen.queryByText('Framework already exists')).not.toBeInTheDocument())
      const stored = JSON.parse(localStorage.getItem('quadrants_frameworks')!)
      expect(stored).toHaveLength(1)
      expect(stored[0]).toEqual(localFramework)
      // Hash must be cleared so a refresh doesn't re-trigger the dialog (BUG-020 family).
      expect(window.location.hash).toBe('')
      // The local framework remains the active view.
      expect(screen.getByRole('heading', { name: 'My Local Version' })).toBeInTheDocument()
    })

    it('marks the skip-to-content link as inert while the conflict dialog is active', async () => {
      // BUG-016: when the ConflictDialog is shown, the skip-to-content link
      // must be inside an inert subtree so keyboard users cannot Tab to it.
      const localFramework = {
        ...sharedFramework,
        name: 'My Local Version',
        quadrants: sharedFramework.quadrants.map((q, i) => ({
          ...q,
          label: `Local ${i + 1}`,
        })),
      }
      localStorage.setItem('quadrants_frameworks', JSON.stringify([localFramework]))

      const hash = await encodeFramework(sharedFramework)
      window.location.hash = `#${hash}`

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Framework already exists')).toBeInTheDocument()
      })

      const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
      // The skip link should have an ancestor with the inert attribute applied
      // (React forwards `inert={true}` to the DOM as an empty `inert=""` attr).
      const inertAncestor = skipLink.closest('[inert]')
      expect(inertAncestor).not.toBeNull()
    })
  })
})
