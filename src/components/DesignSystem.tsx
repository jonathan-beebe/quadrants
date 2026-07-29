import { useState, useRef, useCallback, useSyncExternalStore } from 'react'
import type { ThemeMode } from '../logic/theme'
import { useOnScreenKeyboardSignals } from '../hooks/useExpectsOnScreenKeyboard'
import { expectsOnScreenKeyboard, decidingSignal } from '../logic/onScreenKeyboard'
import { colorPresets, defaultColors } from '../colors'
import { setQuadrantColor } from '../logic/items'
import ThemeToggleButton from './atoms/ThemeToggleButton'
import Badge from './atoms/Badge'
import PageTitle from './atoms/PageTitle'
import SectionLabel from './atoms/SectionLabel'
import Caption from './atoms/Caption'
import Button from './atoms/Button'
import ColorPicker from './ColorPicker'
import PopupMenu, { popupMenuTriggerProps } from './PopupMenu'
import ModalTitleBar from './ModalTitleBar'
import EditModal from './EditModal'
import Modal from './Modal'
import Toast from './Toast'
import { UpdateToastView } from './UpdateToast'
import CanvasPreview from './CanvasPreview'
import QuadrantGrid from './QuadrantGrid'
import MobileQuadrantGrid from './MobileQuadrantGrid'
import type { Framework } from '../types'
import {
  XIcon,
  PlusIcon,
  EditIcon,
  ShareIcon,
  MaximizeIcon,
  QuadrantGridIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  LinkIcon,
  SidebarIcon,
  ImportIcon,
  MoreVerticalIcon,
} from './Icons'

/* ── Layout helpers (local to design system) ── */

const layouts = {
  wrap: 'flex flex-wrap gap-4',
  stack: 'space-y-4',
  inline: 'flex items-center gap-4',
  row: 'flex gap-3',
} as const

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-semibold text-text mt-16 mb-6 pb-2 border-b border-border">{children}</h2>
}

function Subsection({
  title,
  layout,
  children,
}: {
  title: string
  layout?: keyof typeof layouts
  children?: React.ReactNode
}) {
  return (
    <div className="mb-10">
      <h3 className="text-lg font-medium text-text-secondary mb-4">{title}</h3>
      {children == null ? (
        <p className="text-sm text-text-tertiary italic">No components yet.</p>
      ) : layout ? (
        <div className={layouts[layout]}>{children}</div>
      ) : (
        children
      )}
    </div>
  )
}

function DemoRow({
  label,
  layout = 'row',
  children,
}: {
  label: string
  layout?: keyof typeof layouts
  children: React.ReactNode
}) {
  return (
    <div>
      <Caption className="block mb-1">{label}</Caption>
      <div className={layouts[layout]}>{children}</div>
    </div>
  )
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: color }} />
      <Caption>{label}</Caption>
    </div>
  )
}

function IconSwatch({ name, component: Icon }: { name: string; component: typeof XIcon }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-3 rounded-lg bg-surface border border-border text-text">
        {/* The gallery is the one place icons are semantic, not decorative:
            role="img" makes the aria-label reliable across SR/browser combos
            and replaces the discouraged aria-hidden="false" literal (A11Y-020). */}
        <Icon size={20} role="img" aria-hidden={undefined} aria-label={name} />
      </div>
      <Caption>{name}</Caption>
    </div>
  )
}

/* ── Demo data ── */

const demoFramework: Framework = {
  id: 'demo',
  name: 'Eisenhower Matrix',
  axisX: 'Urgency',
  axisY: 'Importance',
  quadrants: [
    {
      label: 'Do First',
      color: defaultColors[0],
      items: [
        { id: '1', text: 'Ship v2 release', x: 25, y: 20, createdAt: 0 },
        { id: '2', text: 'Fix auth bug', x: 55, y: 60, createdAt: 0 },
        { id: '3', text: 'Update deps', x: 15, y: 70, createdAt: 0 },
      ],
    },
    {
      label: 'Schedule',
      color: defaultColors[1],
      items: [
        { id: '4', text: 'Refactor DB layer', x: 30, y: 35, createdAt: 0 },
        { id: '5', text: 'Write API docs', x: 60, y: 15, createdAt: 0 },
      ],
    },
    {
      label: 'Delegate',
      color: defaultColors[2],
      items: [
        { id: '6', text: 'Design review', x: 40, y: 40, createdAt: 0 },
        { id: '7', text: 'QA sprint tasks', x: 10, y: 20, createdAt: 0 },
        { id: '8', text: 'Onboard new dev', x: 65, y: 70, createdAt: 0 },
      ],
    },
    {
      label: 'Eliminate',
      color: defaultColors[3],
      items: [{ id: '9', text: 'Legacy dashboard', x: 20, y: 30, createdAt: 0 }],
    },
  ],
  createdAt: 0,
  updatedAt: 0,
}

const emptyDemoFramework: Framework = {
  ...demoFramework,
  quadrants: demoFramework.quadrants.map((quadrant) => ({ ...quadrant, items: [] })),
}

const noop = () => {}

function DesktopGridDemo() {
  const [framework, setFramework] = useState(demoFramework)
  const quadrantRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])
  const canvasRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-bg h-[500px] flex flex-col">
      <QuadrantGrid
        framework={framework}
        drag={null}
        autoFocusId={null}
        quadrantRefs={quadrantRefs}
        canvasRefs={canvasRefs}
        onAddItem={noop}
        onDeleteItem={noop}
        onEditItem={noop}
        onColorChange={(idx, color) => setFramework((fw) => setQuadrantColor(fw, idx, color))}
        onMoveItem={noop}
        onReposition={noop}
        onDragStart={noop}
      />
    </div>
  )
}

/** Live matcher, for displaying the signals behind the verdict. */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/**
 * One signal: name, current value, whether emulation can fake it, and why it is
 * or is not used.
 *
 * Not a table row. The notes are full sentences, and four columns — one of them
 * prose — cannot fit a phone in portrait, which is the width this whole feature
 * is about. Stacking reflows at every size and keeps the long text readable.
 */
function SignalItem({
  signal,
  value,
  spoofable,
  note,
}: {
  signal: string
  value: boolean | null
  spoofable: boolean
  note: string
}) {
  return (
    <li className="py-2 border-b border-border last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <code className="font-mono text-[12px] text-text break-all">{signal}</code>
        <span className={`text-[12px] font-semibold ${value ? 'text-accent' : 'text-text-tertiary'}`}>
          {value === null ? 'unknown' : String(value)}
        </span>
        <span
          className={`text-[11px] px-1.5 py-0.5 rounded ${
            spoofable ? 'text-text-tertiary bg-bg' : 'text-accent bg-accent-light font-semibold'
          }`}>
          {spoofable ? 'spoofable' : 'ground truth'}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-text-tertiary">{note}</p>
    </li>
  )
}

/**
 * Both PopupMenu modes side by side: a trigger that toggles on click (the
 * Sidebar's actions menu, with a danger item), and one opened from the
 * keyboard (the Card's move menu), whose trigger a press must dismiss.
 */
function PopupMenuDemo() {
  const [openMenu, setOpenMenu] = useState<'actions' | 'move' | null>(null)
  const [lastAction, setLastAction] = useState('nothing yet')
  const actionsTriggerRef = useRef<HTMLButtonElement>(null)
  const moveTriggerRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpenMenu(null), [])

  return (
    <div className={layouts.stack}>
      <DemoRow label="Toggling trigger — click to open and click again to dismiss (BUG-005)">
        <div className="relative">
          <Button
            ref={actionsTriggerRef}
            variant="secondary"
            size="sm"
            {...popupMenuTriggerProps('ds-actions-menu', openMenu === 'actions')}
            onClick={() => setOpenMenu(openMenu === 'actions' ? null : 'actions')}>
            Actions
          </Button>
          <PopupMenu
            id="ds-actions-menu"
            open={openMenu === 'actions'}
            onClose={close}
            triggerRef={actionsTriggerRef}
            triggerToggles
            label="Actions for the demo framework"
            items={[
              { label: 'Duplicate', onSelect: () => setLastAction('Duplicate') },
              { label: 'Export JSON', onSelect: () => setLastAction('Export JSON') },
              { label: 'Delete', onSelect: () => setLastAction('Delete'), variant: 'danger' },
            ]}
            className="right-0 mt-1"
          />
        </div>
      </DemoRow>

      <DemoRow label="Keyboard-opened trigger — focus it and press M; a press on it dismisses">
        <div className="relative">
          <Button
            ref={moveTriggerRef}
            variant="secondary"
            size="sm"
            {...popupMenuTriggerProps('ds-move-menu', openMenu === 'move')}
            onKeyDown={(e) => {
              if (e.key === 'm' || e.key === 'M') {
                e.preventDefault()
                setOpenMenu('move')
              }
            }}>
            Item text (press M)
          </Button>
          <PopupMenu
            id="ds-move-menu"
            open={openMenu === 'move'}
            onClose={close}
            triggerRef={moveTriggerRef}
            label="Move item to quadrant"
            items={['Urgent', 'Later', 'Delegate'].map((label) => ({
              label: `Move to ${label}`,
              onSelect: () => setLastAction(`Move to ${label}`),
            }))}
            className="left-0 mt-1"
          />
        </div>
      </DemoRow>

      <Caption>
        Last action: <code className="bg-bg px-1.5 py-0.5 rounded border border-border">{lastAction}</code>. Both menus
        share focus-on-open, arrow cycling, Escape/Tab dismissal with focus returned to the trigger, and the
        aria-haspopup/expanded/controls wiring.
      </Caption>
    </div>
  )
}

function ModalDemo() {
  const [open, setOpen] = useState(false)
  const openerRef = useRef<HTMLButtonElement>(null)

  return (
    <div className={layouts.inline}>
      <Button ref={openerRef} variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Open Modal
      </Button>
      <Caption>
        Full screen on mobile, centered on wide screens. The title bar stays put — the content area never scrolls
        itself, so a child that outgrows the modal owns its own scrolling.
      </Caption>
      {open && (
        <Modal title="Modal demo" openerRef={openerRef} onClose={() => setOpen(false)}>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i} className="text-sm text-text-secondary">
                Scrolling content block {i + 1} — this list owns the scroll; the title bar above it does not move.
              </p>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

function EditModalDemo() {
  const [text, setText] = useState('Ship v2 release')
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  // The trigger field never holds focus when the modal opens (pointerDown +
  // preventDefault below), so the modal is told where focus returns by ref
  // rather than left to read document.activeElement (A11Y-022).
  const inputRef = useRef<HTMLInputElement>(null)

  const signals = useOnScreenKeyboardSignals()
  const expectsKeyboard = expectsOnScreenKeyboard(signals)
  const deciding = decidingSignal(signals)
  // Shown to explain the verdict, not to compute it.
  const anyCoarse = useMediaQuery('(any-pointer: coarse)')
  const narrow = useMediaQuery('(max-width: 768px)')

  // Preview is the design system's own escape hatch: without it the modal is
  // unreviewable on the desktop where it is being designed.
  const useModal = expectsKeyboard || preview

  return (
    <div className="space-y-4">
      <div>
        <Caption className="block mb-1.5">Detection — useExpectsOnScreenKeyboard()</Caption>
        <div className="rounded-xl border border-border bg-surface p-3">
          <ul className="list-none">
            <SignalItem
              signal="observed keyboard"
              value={signals.observed}
              spoofable={false}
              note="did the visual viewport actually shrink when a field was focused? Device emulation never raises a keyboard, so it can never fake this. Unknown until the first edit."
            />
            <SignalItem
              signal="userAgentData.mobile"
              value={signals.uaMobile}
              spoofable
              note="trusted only when false, and only where it exists — Safari and Firefox report unknown. Catches DevTools responsive mode, which emulates touch but leaves the user agent on its desktop default."
            />
            <SignalItem
              signal="(pointer: coarse)"
              value={signals.coarsePointer}
              spoofable
              note="primary pointer is touch"
            />
            <SignalItem signal="(hover: none)" value={signals.noHover} spoofable note="no hover capability" />
            <SignalItem
              signal="(any-pointer: coarse)"
              value={anyCoarse}
              spoofable
              note="not used — true on touchscreen laptops, which have real keyboards"
            />
            <SignalItem
              signal="(max-width: 768px)"
              value={narrow}
              spoofable
              note="not used — useIsMobile's layout question; a landscape tablet exceeds it"
            />
          </ul>
          <p className="mt-3 pt-3 border-t border-border text-sm">
            <span className="text-text-secondary">Verdict: </span>
            <span className={`font-semibold ${expectsKeyboard ? 'text-accent' : 'text-text'}`}>
              {expectsKeyboard
                ? 'on-screen keyboard expected — edit through the modal'
                : 'physical keyboard — edit in place'}
            </span>
            <span className="text-text-tertiary"> — decided by {deciding}</span>
          </p>
          <Caption className="block mt-2">
            Signals are weighed in precedence order, top to bottom. Everything a page can read is spoofable, because
            making pages believe they are mobile is what device emulation is for. Only the first row survives it — so
            with the device toolbar open, the first edit follows the prediction and every one after it follows the
            evidence.
          </Caption>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} className="w-4 h-4" />
        Preview the modal on this device (overrides the verdict)
      </label>

      <div>
        <label htmlFor="edit-modal-demo-input" className="block text-xs font-medium text-text-secondary mb-1.5">
          {useModal ? 'Item text — tap to edit' : 'Item text — edit in place'}
        </label>
        <input
          ref={inputRef}
          id="edit-modal-demo-input"
          type="text"
          value={text}
          // The branch under demonstration: on a device with an on-screen
          // keyboard the field is a trigger, everywhere else it is a field.
          readOnly={useModal}
          // Popup semantics only when the field actually opens one, and named
          // as a dialog rather than left to be guessed (A11Y-016).
          aria-haspopup={useModal ? 'dialog' : undefined}
          aria-expanded={useModal ? open : undefined}
          onChange={(e) => setText(e.target.value)}
          // pointerDown, not click, and preventDefault so the input never takes
          // focus itself: the modal must open and claim focus inside the same
          // gesture or iOS will not raise the keyboard (RSRCH-002).
          onPointerDown={
            useModal
              ? (e) => {
                  e.preventDefault()
                  setOpen(true)
                }
              : undefined
          }
          onKeyDown={
            useModal
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setOpen(true)
                  }
                }
              : undefined
          }
          className={`w-full max-w-[440px] rounded-lg px-3 py-2 bg-surface text-text border border-border ${
            useModal ? 'cursor-pointer' : ''
          }`}
        />
      </div>

      <Caption>
        Save applies the edit to the field above. Cancel and the close X discard it. Delete closes and reports the
        action it would have taken.
      </Caption>

      {open && useModal && (
        <EditModal
          title="Edit item"
          value={text}
          fieldLabel="Item text"
          openerRef={inputRef}
          onSave={(next) => {
            setText(next)
            setOpen(false)
          }}
          onDelete={() => {
            setOpen(false)
            window.alert('Delete: the item would have been deleted here.')
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}

function MobileGridDemo() {
  const [framework, setFramework] = useState(demoFramework)
  const quadrantRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])
  const canvasRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])

  return (
    // 375x667 is the iPhone SE, the smallest screen the grid supports — but as
    // a ceiling, not a floor: a fixed 375 outgrows the page gutters on any
    // narrower phone and scrolls the whole design system sideways.
    <div
      className="border border-border rounded-xl overflow-hidden bg-bg flex flex-col w-full"
      style={{ maxWidth: 375, height: 667 }}>
      <MobileQuadrantGrid
        framework={framework}
        drag={null}
        autoFocusId={null}
        quadrantRefs={quadrantRefs}
        canvasRefs={canvasRefs}
        onAddItem={noop}
        onDeleteItem={noop}
        onEditItem={noop}
        onColorChange={(idx, color) => setFramework((fw) => setQuadrantColor(fw, idx, color))}
        onMoveItem={noop}
        onReposition={noop}
        onDragStart={noop}
      />
    </div>
  )
}

/* ── Data ── */

const themeColors = [
  { var: 'var(--color-surface)', label: 'Surface' },
  { var: 'var(--color-bg)', label: 'Background' },
  { var: 'var(--color-border)', label: 'Border' },
  { var: 'var(--color-border-hover)', label: 'Border Hover' },
  { var: 'var(--color-text)', label: 'Text' },
  { var: 'var(--color-text-secondary)', label: 'Text 2nd' },
  { var: 'var(--color-text-tertiary)', label: 'Text 3rd' },
  { var: 'var(--color-accent)', label: 'Accent' },
  { var: 'var(--color-accent-hover)', label: 'Accent Hover' },
  { var: 'var(--color-accent-light)', label: 'Accent Light' },
  { var: 'var(--color-danger)', label: 'Danger' },
  { var: 'var(--color-danger-hover)', label: 'Danger Hover' },
]

const iconEntries = [
  { name: 'XIcon', component: XIcon },
  { name: 'PlusIcon', component: PlusIcon },
  { name: 'EditIcon', component: EditIcon },
  { name: 'ShareIcon', component: ShareIcon },
  { name: 'MaximizeIcon', component: MaximizeIcon },
  { name: 'QuadrantGridIcon', component: QuadrantGridIcon },
  { name: 'SunIcon', component: SunIcon },
  { name: 'MoonIcon', component: MoonIcon },
  { name: 'MonitorIcon', component: MonitorIcon },
  { name: 'LinkIcon', component: LinkIcon },
  { name: 'SidebarIcon', component: SidebarIcon },
  { name: 'ImportIcon', component: ImportIcon },
  { name: 'MoreVerticalIcon', component: MoreVerticalIcon },
]

/* ── Page ── */

interface DesignSystemProps {
  themeMode: ThemeMode
  isDark: boolean
  onCycleTheme: () => void
}

// Theme state arrives as props from the app's single owner (RFCTR-010) — a
// second useDarkMode() here would fork the mode from App's live instance.
export default function DesignSystem({ themeMode, isDark, onCycleTheme }: DesignSystemProps) {
  const [pickerColor, setPickerColor] = useState('#60a5fa')
  const [showToast, setShowToast] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-4">
          <PageTitle>Design System</PageTitle>
          <a
            href={import.meta.env.BASE_URL ?? '/'}
            className="text-sm text-accent hover:text-accent-hover transition-colors">
            Back to app
          </a>
        </div>
        <ThemeToggleButton mode={themeMode} isDark={isDark} onCycleTheme={onCycleTheme} />
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {/* ── Atoms ── */}
        <SectionHeading>Atoms</SectionHeading>

        <Subsection title="Colors — Theme" layout="wrap">
          {themeColors.map((c) => (
            <Swatch key={c.label} color={c.var} label={c.label} />
          ))}
        </Subsection>

        <Subsection title="Colors — Presets" layout="wrap">
          {colorPresets.map((c) => (
            <Swatch key={c.hex} color={c.hex} label={c.name} />
          ))}
        </Subsection>

        <Subsection title="Typography" layout="stack">
          <DemoRow label="PageTitle — page/view titles">
            <PageTitle>The quick brown fox</PageTitle>
          </DemoRow>
          <DemoRow label="SectionLabel — form section headings">
            <SectionLabel>The quick brown fox</SectionLabel>
          </DemoRow>
          <DemoRow label="Caption — tertiary descriptive text">
            <Caption>The quick brown fox jumps over the lazy dog.</Caption>
          </DemoRow>
        </Subsection>

        <Subsection title="Icons" layout="wrap">
          {iconEntries.map((entry) => (
            <IconSwatch key={entry.name} {...entry} />
          ))}
        </Subsection>

        <Subsection title="Buttons" layout="stack">
          <DemoRow label="Primary">
            <Button>Create Framework</Button>
            <Button size="sm">Small Primary</Button>
          </DemoRow>
          <DemoRow label="Secondary">
            <Button variant="secondary">Cancel</Button>
            <Button variant="secondary" size="sm">
              Small Secondary
            </Button>
          </DemoRow>
          <DemoRow label="Ghost">
            <Button variant="ghost">Edit</Button>
            <Button variant="ghost" size="sm">
              Small Ghost
            </Button>
          </DemoRow>
          <DemoRow label="Icon">
            <Button variant="icon" aria-label="Add">
              <PlusIcon size={18} />
            </Button>
            <Button variant="icon" aria-label="Edit">
              <EditIcon size={18} />
            </Button>
            <ThemeToggleButton mode={themeMode} isDark={isDark} onCycleTheme={onCycleTheme} />
          </DemoRow>
        </Subsection>

        <Subsection title="Badge" layout="inline">
          <Caption>Count:</Caption>
          <Badge count={0} />
          <Badge count={3} />
          <Badge count={12} />
          <Badge count={99} />
        </Subsection>

        {/* ── Components ── */}
        <SectionHeading>Components</SectionHeading>

        <Subsection title="Color Picker" layout="inline">
          <ColorPicker color={pickerColor} onChange={setPickerColor} />
          <Caption>
            Selected: <code className="bg-bg px-1.5 py-0.5 rounded border border-border">{pickerColor}</code>
          </Caption>
        </Subsection>

        <Subsection title="Theme Toggle" layout="inline">
          <ThemeToggleButton mode={themeMode} isDark={isDark} onCycleTheme={onCycleTheme} />
          <Caption>Current: {themeMode}</Caption>
        </Subsection>

        <Subsection title="Toast" layout="stack">
          <DemoRow label="Error Toast" layout="inline">
            <Button variant="secondary" size="sm" onClick={() => setShowToast(true)}>
              Show Toast
            </Button>
            <Caption>Renders a fixed-position error alert at bottom of screen.</Caption>
          </DemoRow>
          <DemoRow label="Update Toast (inline preview)">
            <UpdateToastView onReload={() => {}} onDismiss={() => {}} />
          </DemoRow>
        </Subsection>

        <Subsection title="Card" />

        <Subsection title="Canvas Preview — how the sidebar illustrates a framework" layout="stack">
          <DemoRow label="One 128px bitmap, at sidebar size and enlarged: quadrant colors, quadrant lines, a pill per item">
            <CanvasPreview framework={demoFramework} className="w-11 h-11" />
            <CanvasPreview framework={demoFramework} className="w-32 h-32" />
          </DemoRow>
          <DemoRow label="A framework with no items — gradient and quadrant lines alone">
            <CanvasPreview framework={emptyDemoFramework} className="w-11 h-11" />
            <CanvasPreview framework={emptyDemoFramework} className="w-32 h-32" />
          </DemoRow>
        </Subsection>

        <Subsection title="Popup Menu — shared by the card's move menu and the sidebar's actions menu">
          <PopupMenuDemo />
        </Subsection>

        <Subsection title="Modal Title Bar — the chrome Modal and EditModal both wear" layout="stack">
          <DemoRow label="Ordinary title">
            <div className="w-full max-w-md rounded-xl border border-border bg-surface overflow-hidden">
              <ModalTitleBar title="Edit item" titleId="ds-title-bar" onClose={noop} />
            </div>
          </DemoRow>
          <DemoRow label="Long title — truncates rather than pushing the close button out of reach">
            <div className="w-full max-w-md rounded-xl border border-border bg-surface overflow-hidden">
              <ModalTitleBar
                title="A title long enough to run past the width of any modal this app renders"
                titleId="ds-title-bar-long"
                onClose={noop}
              />
            </div>
          </DemoRow>
        </Subsection>

        <Subsection title="Modal — shared chrome with a fixed title bar" layout="stack">
          <ModalDemo />
        </Subsection>

        <Subsection title="Edit Modal — gated on on-screen-keyboard detection" layout="stack">
          <EditModalDemo />
        </Subsection>

        <Subsection title="Dialog" />

        {/* ── Layouts ── */}
        <SectionHeading>Layouts</SectionHeading>
        <Subsection title="Sidebar" />

        <Subsection title="Quadrant Grid — Desktop">
          <DesktopGridDemo />
        </Subsection>

        <Subsection title="Quadrant Grid — Mobile">
          <MobileGridDemo />
        </Subsection>
      </main>

      {showToast && (
        <Toast message="Something went wrong — this is a demo toast." onDismiss={() => setShowToast(false)} />
      )}
    </div>
  )
}
