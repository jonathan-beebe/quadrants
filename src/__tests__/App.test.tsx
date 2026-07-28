import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  // Reset URL. replaceState also clears any hash — assigning
  // window.location.hash would navigate and fire an async popstate that
  // leaks into the next test (it consumes useRouting's skipPush guard).
  window.history.replaceState(null, '', '/')
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

  describe('mobile sidebar trigger placement (BUG-013)', () => {
    function storeFramework() {
      localStorage.setItem(
        'quadrants_frameworks',
        JSON.stringify([
          {
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
          },
        ]),
      )
    }

    // On mobile each screen owns its trigger inside <main>, so the trigger
    // flows with that screen's title row instead of floating over it. The
    // shell's floating opener would sit outside <main>.
    function soleTrigger() {
      const triggers = screen.getAllByRole('button', { name: /open sidebar/i })
      expect(triggers).toHaveLength(1)
      expect(screen.getByRole('main')).toContainElement(triggers[0])
      return triggers[0]
    }

    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(true)
    })

    it('shows one in-flow trigger on the empty state', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(soleTrigger())
      expect(screen.getByRole('dialog', { name: /frameworks sidebar/i })).toBeInTheDocument()
    })

    it('shows one in-flow trigger on the framework canvas', () => {
      storeFramework()
      window.history.replaceState(null, '', '/stored-fw')
      render(<App />)

      const trigger = soleTrigger()
      // Sits in the same row as the framework title, not stacked over it.
      expect(trigger.parentElement).toContainElement(screen.getByRole('heading', { name: 'Stored Framework' }))
    })

    it('shows one in-flow trigger on the framework builder', async () => {
      const user = userEvent.setup()
      render(<App />)
      await user.click(screen.getByRole('button', { name: 'Create Framework' }))

      const trigger = soleTrigger()
      expect(trigger.parentElement).toContainElement(screen.getByRole('heading', { name: 'Create Framework' }))

      await user.click(trigger)
      expect(screen.getByRole('dialog', { name: /frameworks sidebar/i })).toBeInTheDocument()
    })

    it('keeps the floating opener outside the screen content on desktop', async () => {
      const user = userEvent.setup()
      vi.mocked(useIsMobile).mockReturnValue(false)
      render(<App />)
      await user.click(screen.getByRole('button', { name: /close sidebar/i }))

      const triggers = screen.getAllByRole('button', { name: /open sidebar/i })
      expect(triggers).toHaveLength(1)
      expect(screen.getByRole('main')).not.toContainElement(triggers[0])
    })
  })

  describe('mobile drawer dismissal on navigation (BUG-014)', () => {
    function storeFrameworks() {
      const quadrants = [
        { label: 'A', color: '#fbbf24', items: [] },
        { label: 'B', color: '#60a5fa', items: [] },
        { label: 'C', color: '#34d399', items: [] },
        { label: 'D', color: '#f472b6', items: [] },
      ]
      localStorage.setItem(
        'quadrants_frameworks',
        JSON.stringify([
          { id: 'fw-one', name: 'First Framework', axisX: '', axisY: '', quadrants, createdAt: 1000, updatedAt: 1000 },
          { id: 'fw-two', name: 'Second Framework', axisX: '', axisY: '', quadrants, createdAt: 2000, updatedAt: 2000 },
        ]),
      )
    }

    /** Open the drawer from the screen's own in-flow trigger (BUG-013). */
    async function openDrawer(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: /open sidebar/i }))
      return screen.getByRole('dialog', { name: /frameworks sidebar/i })
    }

    /** The drawer is dismissed and the screen behind it is usable again. */
    function expectDrawerDismissed() {
      expect(screen.queryByRole('dialog', { name: /frameworks sidebar/i })).not.toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
      expect(screen.getByRole('main')).not.toHaveAttribute('inert')
    }

    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(true)
    })

    it('dismisses the drawer when a framework is selected', async () => {
      const user = userEvent.setup()
      storeFrameworks()
      window.history.replaceState(null, '', '/fw-one')
      render(<App />)

      const drawer = await openDrawer(user)
      await user.click(within(drawer).getByRole('button', { name: /^Second Framework/ }))

      expectDrawerDismissed()
      expect(screen.getByRole('heading', { name: 'Second Framework' })).toBeInTheDocument()
    })

    it('dismisses the drawer when "New Framework" is chosen', async () => {
      const user = userEvent.setup()
      storeFrameworks()
      window.history.replaceState(null, '', '/fw-one')
      render(<App />)

      const drawer = await openDrawer(user)
      await user.click(within(drawer).getByRole('button', { name: /new framework/i }))

      expectDrawerDismissed()
      expect(screen.getByRole('heading', { name: 'Create Framework' })).toBeInTheDocument()
    })

    it('dismisses the drawer when a framework is duplicated from its actions menu', async () => {
      const user = userEvent.setup()
      storeFrameworks()
      window.history.replaceState(null, '', '/fw-one')
      render(<App />)

      const drawer = await openDrawer(user)
      await user.click(within(drawer).getByRole('button', { name: /actions for second framework/i }))
      await user.click(within(drawer).getByRole('menuitem', { name: /duplicate/i }))

      expectDrawerDismissed()
    })

    it('dismisses the drawer when Import is chosen', async () => {
      const user = userEvent.setup()
      storeFrameworks()
      window.history.replaceState(null, '', '/fw-one')
      render(<App />)

      const drawer = await openDrawer(user)
      await user.click(within(drawer).getByRole('button', { name: /import/i }))

      expectDrawerDismissed()
    })

    it('lands focus on the revealed screen rather than stranding it on the dismissed drawer', async () => {
      const user = userEvent.setup()
      storeFrameworks()
      window.history.replaceState(null, '', '/fw-one')
      render(<App />)

      const drawer = await openDrawer(user)
      await user.click(within(drawer).getByRole('button', { name: /^Second Framework/ }))

      // Not stranded on <body> (where refocusing the now-detached opener that
      // opened the drawer would leave it), and not inside the drawer.
      const main = screen.getByRole('main')
      expect(document.activeElement).not.toBe(document.body)
      expect(main).toContainElement(document.activeElement as HTMLElement)
    })

    it('leaves the desktop sidebar open when a framework is selected', async () => {
      const user = userEvent.setup()
      vi.mocked(useIsMobile).mockReturnValue(false)
      storeFrameworks()
      window.history.replaceState(null, '', '/fw-one')
      render(<App />)

      await user.click(screen.getByRole('button', { name: /^Second Framework/ }))

      // The floating opener renders only while the sidebar is closed.
      expect(screen.queryByRole('button', { name: /open sidebar/i })).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Second Framework' })).toBeInTheDocument()
    })

    it('leaves the desktop sidebar open when "New Framework" is chosen', async () => {
      const user = userEvent.setup()
      vi.mocked(useIsMobile).mockReturnValue(false)
      storeFrameworks()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /new framework/i }))

      expect(screen.queryByRole('button', { name: /open sidebar/i })).not.toBeInTheDocument()
    })
  })

  describe('mobile drawer focus on open and on a dismissal that does not navigate (A11Y-005)', () => {
    // The counterpart to BUG-014's landing above: when the drawer closes
    // without changing what <main> renders, the opener is still mounted and is
    // where focus belongs. Both paths are one decision (useDrawerModality), so
    // they are tested as a pair — the restore half was previously unguarded.
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(true)
    })

    it('moves focus into the drawer when it opens', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /open sidebar/i }))

      expect(screen.getByRole('button', { name: /close sidebar/i })).toHaveFocus()
    })

    it('returns focus to the opener when the drawer is closed with Escape', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /open sidebar/i }))
      fireEvent.keyDown(screen.getByRole('dialog', { name: /frameworks sidebar/i }), { key: 'Escape' })

      expect(screen.queryByRole('dialog', { name: /frameworks sidebar/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /open sidebar/i })).toHaveFocus()
    })

    it('returns focus to the opener when the drawer is closed from its own close button', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /open sidebar/i }))
      await user.click(screen.getByRole('button', { name: /close sidebar/i }))

      expect(screen.getByRole('button', { name: /open sidebar/i })).toHaveFocus()
    })

    it('returns focus to the opener when the drawer is dismissed by its backdrop', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /open sidebar/i }))
      // fireEvent, not userEvent: a full click would additionally apply the
      // browser's own click-target focus default (jsdom: body), which is
      // pointer behavior rather than anything the dismissal path decides
      // (A11Y-016 established the same distinction).
      fireEvent.click(screen.getByTestId('sidebar-backdrop'))

      expect(screen.getByRole('button', { name: /open sidebar/i })).toHaveFocus()
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

  describe('history navigation and framework lifecycle (MAINT-003)', () => {
    function storedFramework(id: string, name: string, labels: [string, string, string, string]) {
      return {
        id,
        name,
        axisX: '',
        axisY: '',
        quadrants: labels.map((label, i) => ({
          label,
          color: ['#fbbf24', '#60a5fa', '#34d399', '#f472b6'][i],
          items: [],
        })),
        createdAt: 1000,
        updatedAt: 1000,
      }
    }

    beforeEach(() => {
      localStorage.setItem(
        'quadrants_frameworks',
        JSON.stringify([
          storedFramework('fw-a', 'Framework Alpha', ['A1', 'A2', 'A3', 'A4']),
          storedFramework('fw-b', 'Framework Beta', ['B1', 'B2', 'B3', 'B4']),
        ]),
      )
    })

    it('returns to the previous framework on popstate without a duplicate history push', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /Framework Alpha.*items/ }))
      expect(screen.getByRole('heading', { name: 'Framework Alpha' })).toBeInTheDocument()
      expect(window.location.pathname).toBe('/fw-a')

      await user.click(screen.getByRole('button', { name: /Framework Beta.*items/ }))
      expect(screen.getByRole('heading', { name: 'Framework Beta' })).toBeInTheDocument()
      expect(window.location.pathname).toBe('/fw-b')

      // Simulate the browser Back button: the URL is rewound to the previous
      // entry and popstate fires (history.back() is a no-op in jsdom).
      const pushSpy = vi.spyOn(window.history, 'pushState')
      window.history.replaceState(null, '', '/fw-a')
      await waitFor(() => {
        window.dispatchEvent(new PopStateEvent('popstate'))
        expect(screen.getByRole('heading', { name: 'Framework Alpha' })).toBeInTheDocument()
      })

      // The skipPush guard: handling popstate must not push a new entry.
      expect(pushSpy).not.toHaveBeenCalled()
      pushSpy.mockRestore()
    })

    it('returns to the empty state with a cleared URL when the active framework is deleted', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /Framework Alpha.*items/ }))
      expect(window.location.pathname).toBe('/fw-a')

      await user.click(screen.getByRole('button', { name: /actions for framework alpha/i }))
      await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

      expect(screen.getByText('No framework selected')).toBeInTheDocument()
      expect(window.location.pathname).toBe('/')
    })

    it('shows the duplicate as the active framework after duplicating', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /actions for framework alpha/i }))
      await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }))

      expect(screen.getByRole('heading', { name: 'Framework Alpha (copy)' })).toBeInTheDocument()
      expect(window.location.pathname).not.toBe('/')
      expect(window.location.pathname).not.toBe('/fw-a')
    })

    it('updates canvas labels after editing the structure through the builder', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: /Framework Alpha.*items/ }))
      await user.click(screen.getByRole('button', { name: 'Edit' }))

      const quadrantInput = screen.getByRole('textbox', { name: /quadrant 1 label/i })
      await user.clear(quadrantInput)
      await user.type(quadrantInput, 'Renamed Quadrant')
      await user.click(screen.getByRole('button', { name: 'Save Changes' }))

      expect(screen.getByRole('heading', { name: 'Framework Alpha' })).toBeInTheDocument()
      expect(screen.getByText('Renamed Quadrant')).toBeInTheDocument()
      expect(screen.queryByText('A1')).not.toBeInTheDocument()
    })
  })

  describe('undo/redo keyboard shortcuts (FEAT-003)', () => {
    beforeEach(() => {
      localStorage.setItem(
        'quadrants_frameworks',
        JSON.stringify([
          {
            id: 'fw-undo',
            name: 'Undo Framework',
            axisX: '',
            axisY: '',
            quadrants: [
              {
                label: 'Q1',
                color: '#fbbf24',
                items: [
                  { id: 'i1', text: 'Task A', x: 10, y: 10, createdAt: 1000 },
                  { id: 'i2', text: 'Task B', x: 30, y: 30, createdAt: 1000 },
                ],
              },
              { label: 'Q2', color: '#60a5fa', items: [] },
              { label: 'Q3', color: '#34d399', items: [] },
              { label: 'Q4', color: '#f472b6', items: [] },
            ],
            createdAt: 1000,
            updatedAt: 1000,
          },
        ]),
      )
    })

    async function openFramework(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: /Undo Framework.*items/ }))
      expect(screen.getByRole('heading', { name: 'Undo Framework' })).toBeInTheDocument()
    }

    it('undoes an item deletion with Ctrl+Z and redoes it with Ctrl+Y', async () => {
      const user = userEvent.setup()
      render(<App />)
      await openFramework(user)

      await user.click(screen.getByRole('button', { name: /delete item: task a/i }))
      expect(screen.queryByText('Task A')).not.toBeInTheDocument()

      fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true })
      expect(screen.getByText('Task A')).toBeInTheDocument()

      fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true })
      expect(screen.queryByText('Task A')).not.toBeInTheDocument()
    })

    it('redoes with Cmd+Shift+Z', async () => {
      const user = userEvent.setup()
      render(<App />)
      await openFramework(user)

      await user.click(screen.getByRole('button', { name: /delete item: task a/i }))
      fireEvent.keyDown(document.body, { key: 'z', metaKey: true })
      expect(screen.getByText('Task A')).toBeInTheDocument()

      fireEvent.keyDown(document.body, { key: 'Z', metaKey: true, shiftKey: true })
      expect(screen.queryByText('Task A')).not.toBeInTheDocument()
    })

    it('discards the redo branch when a new action follows an undo', async () => {
      const user = userEvent.setup()
      render(<App />)
      await openFramework(user)

      await user.click(screen.getByRole('button', { name: /delete item: task a/i }))
      fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true })
      expect(screen.getByText('Task A')).toBeInTheDocument()

      // A new action after undo: the re-delete of Task A is no longer redoable.
      await user.click(screen.getByRole('button', { name: /delete item: task b/i }))

      fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true })
      expect(screen.getByText('Task A')).toBeInTheDocument()
      expect(screen.queryByText('Task B')).not.toBeInTheDocument()
    })

    it('persists the undone state to localStorage', async () => {
      const user = userEvent.setup()
      render(<App />)
      await openFramework(user)

      await user.click(screen.getByRole('button', { name: /delete item: task a/i }))
      fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true })

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem('quadrants_frameworks')!)
        expect(stored[0].quadrants[0].items.map((it: { text: string }) => it.text)).toContain('Task A')
      })
    })

    it('restores a deleted framework on undo', async () => {
      const user = userEvent.setup()
      render(<App />)
      await openFramework(user)

      await user.click(screen.getByRole('button', { name: /actions for undo framework/i }))
      await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
      expect(screen.getByText('No framework selected')).toBeInTheDocument()

      fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true })
      expect(screen.getByRole('button', { name: /Undo Framework.*items/ })).toBeInTheDocument()
    })

    it('does not hijack undo while focus is in a text-editing field', async () => {
      const user = userEvent.setup()
      render(<App />)
      await openFramework(user)

      await user.click(screen.getByRole('button', { name: /delete item: task b/i }))
      expect(screen.queryByText('Task B')).not.toBeInTheDocument()

      // Open the item editor; Cmd/Ctrl+Z must stay native text undo here.
      await user.click(screen.getByRole('button', { name: /edit item: task a/i }))
      const textarea = await screen.findByRole('textbox')
      fireEvent.keyDown(textarea, { key: 'z', ctrlKey: true })

      expect(screen.queryByText('Task B')).not.toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('ignores the shortcuts on mobile', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<App />)
      await openFramework(user)

      await user.click(screen.getByRole('button', { name: /delete item: task a/i }))
      expect(screen.queryByText('Task A')).not.toBeInTheDocument()

      vi.mocked(useIsMobile).mockReturnValue(true)
      rerender(<App />)

      fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true })
      expect(screen.queryByText('Task A')).not.toBeInTheDocument()
    })
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

    // A11Y-021: dismissing the conflict dialog must not strand focus on
    // <body>. All three exits navigate to the screen the choice produced and
    // the dialog has no opener control to restore to (it is raised by the URL),
    // so focus lands on <main> — the post-navigation landing spot (BUG-014).
    it('Replace local moves focus to main when the dialog closes (A11Y-021)', async () => {
      await setupConflict()
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => expect(screen.getByText('Framework already exists')).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: 'Replace local' }))

      await waitFor(() => expect(screen.queryByText('Framework already exists')).not.toBeInTheDocument())
      expect(screen.getByRole('main')).toHaveFocus()
    })

    it('Keep both moves focus to main when the dialog closes (A11Y-021)', async () => {
      await setupConflict()
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => expect(screen.getByText('Framework already exists')).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: 'Keep both' }))

      await waitFor(() => expect(screen.queryByText('Framework already exists')).not.toBeInTheDocument())
      expect(screen.getByRole('main')).toHaveFocus()
    })

    it('Cancel moves focus to main when the dialog closes (A11Y-021)', async () => {
      await setupConflict()
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => expect(screen.getByText('Framework already exists')).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      await waitFor(() => expect(screen.queryByText('Framework already exists')).not.toBeInTheDocument())
      expect(screen.getByRole('main')).toHaveFocus()
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
