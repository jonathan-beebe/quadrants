import { createRef } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from '../components/Sidebar'
import { useIsMobile } from '../hooks/useIsMobile'
import type { Framework } from '../types'

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

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
  // Modality is owned by useDrawerModality and arrives as a prop (RFCTR-008);
  // the modal cases below opt in explicitly.
  isModal: false,
  closeButtonRef: createRef<HTMLButtonElement>(),
  themeMode: 'system' as const,
  isDark: false,
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
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false)
  })

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

  it('previews each framework’s canvas in its row (FEAT-004)', () => {
    const { container } = render(
      <Sidebar
        {...defaultProps}
        frameworks={[makeFramework(), makeFramework({ id: 'fw-2', name: 'Second Framework' })]}
      />,
    )
    expect(container.querySelectorAll('canvas')).toHaveLength(2)
  })

  it('keeps the preview out of the accessibility tree (FEAT-004)', () => {
    const { container } = render(<Sidebar {...defaultProps} frameworks={[makeFramework()]} />)
    // The row already names the framework and counts its items; the preview
    // restates that visually and must announce nothing.
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
    // Anchored: "Actions for Test Framework" is the row's other button.
    expect(screen.getByRole('button', { name: /^test framework/i })).toBeInTheDocument()
  })

  it('selects the framework when its preview is clicked (FEAT-004)', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const { container } = render(<Sidebar {...defaultProps} frameworks={[makeFramework()]} onSelect={onSelect} />)
    await user.click(container.querySelector('canvas')!)
    expect(onSelect).toHaveBeenCalledWith('fw-1')
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

  it('open sidebar button is visible when closed rather than hidden by a utility class (BUG-009)', () => {
    render(<Sidebar {...defaultProps} open={false} />)
    const openButton = screen.getByRole('button', { name: /open sidebar/i })
    expect(openButton.className).not.toMatch(/(^|\s)hidden(\s|$)/)
  })

  it('omits the floating opener on mobile, where each screen carries its own (BUG-013)', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    render(<Sidebar {...defaultProps} open={false} />)
    // Reopening from every mobile screen is covered in App.test.tsx; a copy
    // here would stack on top of the screen's own trigger.
    expect(screen.queryByRole('button', { name: /open sidebar/i })).not.toBeInTheDocument()
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

  it('closes the open Actions menu when its own trigger is clicked again (BUG-005)', async () => {
    const user = userEvent.setup()
    render(<Sidebar {...defaultProps} frameworks={[makeFramework()]} />)

    const menuButton = screen.getByRole('button', { name: /actions for test framework/i })
    await user.click(menuButton)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    // Clicking the trigger again must close the menu — and keep it closed.
    await user.click(menuButton)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('communicates expanded state on sidebar toggle', () => {
    render(<Sidebar {...defaultProps} open={true} />)
    const toggle = screen.getByRole('button', { name: /close sidebar/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders a backdrop on mobile when open that closes the sidebar on click (BUG-015)', async () => {
    const user = userEvent.setup()
    vi.mocked(useIsMobile).mockReturnValue(true)
    const onToggle = vi.fn()
    render(<Sidebar {...defaultProps} open={true} isModal={true} onToggle={onToggle} />)

    const backdrop = screen.getByTestId('sidebar-backdrop')
    expect(backdrop).toBeInTheDocument()
    expect(backdrop).toHaveAttribute('aria-hidden', 'true')

    await user.click(backdrop)
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('does not render a backdrop on desktop (BUG-015)', () => {
    vi.mocked(useIsMobile).mockReturnValue(false)
    render(<Sidebar {...defaultProps} open={true} />)
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })

  it('does not render a backdrop when closed on mobile (BUG-015)', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    render(<Sidebar {...defaultProps} open={false} />)
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })

  // Focus-on-open is asserted in App.test.tsx: it is one half of the single
  // focus decision useDrawerModality owns, and testing it here would only
  // re-test a ref this component now receives (RFCTR-008).

  it('exposes the open mobile drawer as a modal dialog (A11Y-005)', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    render(<Sidebar {...defaultProps} open={true} isModal={true} />)
    const dialog = screen.getByRole('dialog', { name: /frameworks sidebar/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('closes the mobile drawer when Escape is pressed (A11Y-005)', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    const onToggle = vi.fn()
    render(<Sidebar {...defaultProps} open={true} isModal={true} onToggle={onToggle} />)
    const dialog = screen.getByRole('dialog', { name: /frameworks sidebar/i })
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('does not trap focus or behave as a dialog on desktop (A11Y-005)', () => {
    vi.mocked(useIsMobile).mockReturnValue(false)
    render(<Sidebar {...defaultProps} open={true} />)
    expect(screen.queryByRole('dialog', { name: /frameworks sidebar/i })).not.toBeInTheDocument()
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

  it('points the context menu trigger at the menu it opens (RFCTR-019)', async () => {
    const user = userEvent.setup()
    const fw = makeFramework()
    render(<Sidebar {...defaultProps} frameworks={[fw]} />)

    const menuButton = screen.getByRole('button', { name: /actions for test framework/i })
    expect(menuButton).toHaveAttribute('aria-haspopup', 'menu')
    expect(menuButton).not.toHaveAttribute('aria-controls')

    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-controls', screen.getByRole('menu').id)
  })
})
