import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from '../components/Sidebar'
import type { Framework } from '../types'

function makeFramework(overrides: Partial<Framework> = {}): Framework {
  return {
    id: 'fw-1',
    name: 'Test Framework',
    axisX: '',
    axisY: '',
    quadrants: [
      { label: 'Q1', color: '#fbbf24', items: [{ id: 'i1', text: 'Item', x: 10, y: 10, createdAt: 1000 }] },
      { label: 'Q2', color: '#60a5fa', items: [] },
      { label: 'Q3', color: '#34d399', items: [] },
      { label: 'Q4', color: '#f472b6', items: [] },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

const defaultProps = {
  frameworks: [] as Framework[],
  activeId: null as string | null,
  open: true,
  themeMode: 'system' as const,
  darkMode: false,
  onCycleTheme: vi.fn(),
  onToggle: vi.fn(),
  onSelect: vi.fn(),
  onNew: vi.fn(),
  onDelete: vi.fn(),
  onDuplicate: vi.fn(),
  onExport: vi.fn(),
  onImport: vi.fn(),
}

describe('Sidebar', () => {
  it('renders the app title', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText('Quadrants')).toBeInTheDocument()
  })

  it('shows empty state when no frameworks exist', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText('No frameworks yet')).toBeInTheDocument()
  })

  it('lists frameworks with their names and item counts', () => {
    const fw = makeFramework()
    render(<Sidebar {...defaultProps} frameworks={[fw]} />)
    expect(screen.getByText('Test Framework')).toBeInTheDocument()
    expect(screen.getByText('1 items')).toBeInTheDocument()
  })

  it('calls onSelect when a framework is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const fw = makeFramework()
    render(<Sidebar {...defaultProps} frameworks={[fw]} onSelect={onSelect} />)
    await user.click(screen.getByText('Test Framework'))
    expect(onSelect).toHaveBeenCalledWith('fw-1')
  })

  it('calls onNew when "New Framework" button is clicked', async () => {
    const user = userEvent.setup()
    const onNew = vi.fn()
    render(<Sidebar {...defaultProps} onNew={onNew} />)
    await user.click(screen.getByText('New Framework'))
    expect(onNew).toHaveBeenCalledOnce()
  })

  it('calls onImport when Import button is clicked', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn()
    render(<Sidebar {...defaultProps} onImport={onImport} />)
    await user.click(screen.getByText('Import'))
    expect(onImport).toHaveBeenCalledOnce()
  })

  it('calls onCycleTheme when theme button is clicked', async () => {
    const user = userEvent.setup()
    const onCycleTheme = vi.fn()
    render(<Sidebar {...defaultProps} onCycleTheme={onCycleTheme} />)
    await user.click(screen.getByRole('button', { name: /following system theme/i }))
    expect(onCycleTheme).toHaveBeenCalledOnce()
  })

  it('calls onToggle when sidebar toggle button is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<Sidebar {...defaultProps} onToggle={onToggle} />)
    await user.click(screen.getByRole('button', { name: /close sidebar/i }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('shows an open sidebar button when closed', () => {
    render(<Sidebar {...defaultProps} open={false} />)
    expect(screen.getByRole('button', { name: /open sidebar/i })).toBeInTheDocument()
  })

  it('highlights the active framework', () => {
    const fw = makeFramework()
    const { container } = render(<Sidebar {...defaultProps} frameworks={[fw]} activeId="fw-1" />)
    const activeItem = container.querySelector('.bg-accent-light')
    expect(activeItem).toBeInTheDocument()
  })

  it('shows context menu with Duplicate, Export, Delete actions', async () => {
    const user = userEvent.setup()
    const fw = makeFramework()
    const onDuplicate = vi.fn()
    const onExport = vi.fn()
    const onDelete = vi.fn()
    render(
      <Sidebar {...defaultProps} frameworks={[fw]} onDuplicate={onDuplicate} onExport={onExport} onDelete={onDelete} />,
    )

    // Open context menu via the actions button
    const menuButton = screen.getByRole('button', { name: /actions for test framework/i })
    await user.click(menuButton)

    // Verify menu items appear
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Export JSON' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()

    // Click Duplicate
    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }))
    expect(onDuplicate).toHaveBeenCalledWith(fw)
  })

  it('communicates expanded state on sidebar toggle', () => {
    render(<Sidebar {...defaultProps} open={true} />)
    const toggle = screen.getByRole('button', { name: /close sidebar/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('communicates expanded state on context menu trigger', async () => {
    const user = userEvent.setup()
    const fw = makeFramework()
    render(<Sidebar {...defaultProps} frameworks={[fw]} />)

    const menuButton = screen.getByRole('button', { name: /actions for test framework/i })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  })
})
