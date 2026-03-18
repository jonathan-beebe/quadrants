import { useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import { colorPresets } from '../colors'
import ThemeToggleButton from './atoms/ThemeToggleButton'
import Badge from './atoms/Badge'
import PageTitle from './atoms/PageTitle'
import SectionLabel from './atoms/SectionLabel'
import Caption from './atoms/Caption'
import Button from './atoms/Button'
import ColorPicker from './ColorPicker'
import Toast from './Toast'
import {
  XIcon,
  PlusIcon,
  EditIcon,
  ShareIcon,
  MaximizeIcon,
  QuadrantGridIcon,
  SunIcon,
  MoonIcon,
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
  return (
    <h2 className="text-2xl font-semibold text-text mt-16 mb-6 pb-2 border-b border-border">
      {children}
    </h2>
  )
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
      <div
        className="w-10 h-10 rounded-lg border border-border"
        style={{ backgroundColor: color }}
      />
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
  { name: 'SidebarIcon', component: SidebarIcon },
  { name: 'ImportIcon', component: ImportIcon },
  { name: 'MoreVerticalIcon', component: MoreVerticalIcon },
]

/* ── Page ── */

export default function DesignSystem() {
  const { darkMode, toggle: toggleDark } = useDarkMode()
  const [pickerColor, setPickerColor] = useState('#60a5fa')
  const [showToast, setShowToast] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PageTitle>Design System</PageTitle>
          <a
            href={import.meta.env.BASE_URL ?? '/'}
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            Back to app
          </a>
        </div>
        <ThemeToggleButton darkMode={darkMode} onToggle={toggleDark} />
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
            <Button variant="secondary" size="sm">Small Secondary</Button>
          </DemoRow>
          <DemoRow label="Ghost">
            <Button variant="ghost">Edit</Button>
            <Button variant="ghost" size="sm">Small Ghost</Button>
          </DemoRow>
          <DemoRow label="Icon">
            <Button variant="icon" aria-label="Add"><PlusIcon size={18} /></Button>
            <Button variant="icon" aria-label="Edit"><EditIcon size={18} /></Button>
            <ThemeToggleButton darkMode={darkMode} onToggle={toggleDark} />
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
          <ThemeToggleButton darkMode={darkMode} onToggle={toggleDark} />
          <Caption>Current: {darkMode ? 'Dark' : 'Light'}</Caption>
        </Subsection>

        <Subsection title="Toast" layout="inline">
          <Button variant="secondary" size="sm" onClick={() => setShowToast(true)}>
            Show Toast
          </Button>
          <Caption>
            Renders a fixed-position error alert at bottom of screen.
          </Caption>
        </Subsection>

        <Subsection title="Card" />
        <Subsection title="Dialog" />

        {/* ── Layouts ── */}
        <SectionHeading>Layouts</SectionHeading>
        <Subsection title="Sidebar" />
        <Subsection title="Quadrant Canvas" />
        <Subsection title="Reflection Mode" />
      </main>

      {showToast && (
        <Toast
          message="Something went wrong — this is a demo toast."
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
