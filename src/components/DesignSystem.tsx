import { useState, useRef } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import { colorPresets, defaultColors } from '../colors'
import ThemeToggleButton from './atoms/ThemeToggleButton'
import Badge from './atoms/Badge'
import PageTitle from './atoms/PageTitle'
import SectionLabel from './atoms/SectionLabel'
import Caption from './atoms/Caption'
import Button from './atoms/Button'
import ColorPicker from './ColorPicker'
import Toast from './Toast'
import { UpdateToastView } from './UpdateToast'
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
        <Icon size={20} aria-hidden={false} aria-label={name} />
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
        onColorChange={(idx, color) => {
          setFramework((fw) => ({
            ...fw,
            quadrants: fw.quadrants.map((q, i) => (i === idx ? { ...q, color } : q)),
          }))
        }}
        onMoveItem={noop}
        onDragStart={noop}
      />
    </div>
  )
}

function MobileGridDemo() {
  const [framework, setFramework] = useState(demoFramework)
  const quadrantRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])
  const canvasRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])

  return (
    <div
      className="border border-border rounded-xl overflow-hidden bg-bg flex flex-col"
      style={{ width: 375, height: 667 }}>
      <MobileQuadrantGrid
        framework={framework}
        drag={null}
        autoFocusId={null}
        quadrantRefs={quadrantRefs}
        canvasRefs={canvasRefs}
        onAddItem={noop}
        onDeleteItem={noop}
        onEditItem={noop}
        onColorChange={(idx, color) => {
          setFramework((fw) => ({
            ...fw,
            quadrants: fw.quadrants.map((q, i) => (i === idx ? { ...q, color } : q)),
          }))
        }}
        onMoveItem={noop}
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

export default function DesignSystem() {
  const { darkMode, mode, cycleMode } = useDarkMode()
  const [pickerColor, setPickerColor] = useState('#60a5fa')
  const [showToast, setShowToast] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PageTitle>Design System</PageTitle>
          <a
            href={import.meta.env.BASE_URL ?? '/'}
            className="text-sm text-accent hover:text-accent-hover transition-colors">
            Back to app
          </a>
        </div>
        <ThemeToggleButton mode={mode} darkMode={darkMode} onCycle={cycleMode} />
      </header>

      <main className="max-w-4xl mx-auto px-8 py-8">
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
            <ThemeToggleButton mode={mode} darkMode={darkMode} onCycle={cycleMode} />
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
          <ThemeToggleButton mode={mode} darkMode={darkMode} onCycle={cycleMode} />
          <Caption>Current: {mode}</Caption>
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

        <Subsection title="Reflection Mode" />
      </main>

      {showToast && (
        <Toast message="Something went wrong — this is a demo toast." onDismiss={() => setShowToast(false)} />
      )}
    </div>
  )
}
