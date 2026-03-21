import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { encodeFramework } from '../sharing'
import type { Framework } from '../types'

beforeEach(() => {
  localStorage.clear()
  // Reset URL
  window.history.replaceState(null, '', '/')
  window.location.hash = ''
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

  it('shows the conflict dialog elements', () => {
    render(<App />)
    // ConflictDialog is only shown on hash import conflicts — we just verify the empty state is clean
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
  })
})
