import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FrameworkBuilderContent from '../components/FrameworkBuilderContent'
import { useIsMobile } from '../hooks/useIsMobile'

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

const defaultProps = {
  editingFramework: null,
  onCreate: vi.fn(),
  onCancel: vi.fn(),
}

const editingFramework = {
  id: 'fw-1',
  name: 'My Framework',
  axisX: 'Horizontal',
  axisY: 'Vertical',
  quadrants: [
    { label: 'Alpha', color: '#fbbf24', items: [] },
    { label: 'Beta', color: '#60a5fa', items: [] },
    { label: 'Gamma', color: '#34d399', items: [] },
    { label: 'Delta', color: '#f472b6', items: [] },
  ],
  createdAt: 1000,
  updatedAt: 1000,
}

// IMPRV-008: the authoring UI is self-contained — data in, callbacks out —
// so any host (the builder screen today, a modal later) can present it.
describe('FrameworkBuilderContent', () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false)
  })

  it('renders the template picker and the form from data-in props alone', () => {
    render(<FrameworkBuilderContent {...defaultProps} />)

    expect(screen.getByRole('button', { name: /Eisenhower Matrix/ })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox', { name: /Quadrant \d label/ })).toHaveLength(4)
  })

  it('renders no screen chrome — no page heading, no sidebar toggle', () => {
    render(<FrameworkBuilderContent {...defaultProps} />)

    expect(screen.queryByRole('heading', { name: /create framework/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /open sidebar/i })).not.toBeInTheDocument()
  })

  it('reports a submission through onCreate', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<FrameworkBuilderContent {...defaultProps} onCreate={onCreate} />)

    await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))
    await user.click(screen.getByRole('button', { name: 'Create Framework' }))

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Eisenhower Matrix' }))
  })

  it('reports its form Cancel through onCancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<FrameworkBuilderContent {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('pre-fills from an editing target and hides the picker', () => {
    render(<FrameworkBuilderContent {...defaultProps} editingFramework={editingFramework} />)

    expect(screen.getByDisplayValue('My Framework')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Eisenhower Matrix/ })).not.toBeInTheDocument()
  })

  // IMPRV-011: the builder teaches at the moment of choice — picking a
  // template surfaces the framework's name and its doc summary above the
  // Customize section.
  describe('template summary', () => {
    it('shows the selected template’s name and summary above Customize', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderContent {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))

      expect(screen.getByRole('heading', { name: 'Eisenhower Matrix' })).toBeInTheDocument()
      const summary = screen.getByText(/untangles what presses for attention now/)
      const customize = screen.getByRole('heading', { name: 'Customize' })
      expect(summary.compareDocumentPosition(customize) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('shows no summary with Blank / Custom selected', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderContent {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))
      await user.click(screen.getByRole('button', { name: /Blank \/ Custom/ }))

      expect(screen.queryByRole('heading', { name: 'Eisenhower Matrix' })).not.toBeInTheDocument()
      expect(screen.queryByText(/untangles what presses/)).not.toBeInTheDocument()
    })

    it('shows the summary in the mobile layout too', async () => {
      vi.mocked(useIsMobile).mockReturnValue(true)
      const user = userEvent.setup()
      render(<FrameworkBuilderContent {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /Choose a template/ }))
      await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))

      expect(screen.getByRole('heading', { name: 'Eisenhower Matrix' })).toBeInTheDocument()
      expect(screen.getByText(/untangles what presses for attention now/)).toBeInTheDocument()
    })
  })
})
