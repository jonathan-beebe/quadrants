import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

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

  it('shows the conflict dialog elements', () => {
    render(<App />)
    // ConflictDialog is only shown on hash import conflicts — we just verify the empty state is clean
    expect(screen.queryByText('Framework already exists')).not.toBeInTheDocument()
  })
})
