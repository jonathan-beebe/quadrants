import { useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import { colorPresets } from '../colors'
import ThemeToggleButton from './atoms/ThemeToggleButton'
import Badge from './atoms/Badge'
import PageTitle from './atoms/PageTitle'
import SectionLabel from './atoms/SectionLabel'
import Caption from './atoms/Caption'
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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold text-text mt-16 mb-6 pb-2 border-b border-border">
      {children}
    </h2>
  )
}

function Subsection({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-10">
      <h3 className="text-lg font-medium text-text-secondary mb-4">{title}</h3>
      {children ?? (
        <p className="text-sm text-text-tertiary italic">No components yet.</p>
      )}
    </div>
  )
}

function DemoRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Caption className="block mb-1">{label}</Caption>
      {children}
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
            href="/"
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

        <Subsection title="Colors — Theme">
          <div className="flex flex-wrap gap-4">
            {themeColors.map((c) => (
              <Swatch key={c.label} color={c.var} label={c.label} />
            ))}
          </div>
        </Subsection>

        <Subsection title="Colors — Presets">
          <div className="flex flex-wrap gap-4">
            {colorPresets.map((c) => (
              <Swatch key={c.hex} color={c.hex} label={c.name} />
            ))}
          </div>
        </Subsection>

        <Subsection title="Typography">
          <div className="space-y-4">
            <DemoRow label="PageTitle — page/view titles">
              <PageTitle>The quick brown fox</PageTitle>
            </DemoRow>
            <DemoRow label="SectionLabel — form section headings">
              <SectionLabel>The quick brown fox</SectionLabel>
            </DemoRow>
            <DemoRow label="Caption — tertiary descriptive text">
              <Caption>The quick brown fox jumps over the lazy dog.</Caption>
            </DemoRow>
          </div>
        </Subsection>

        <Subsection title="Icons">
          <div className="flex flex-wrap gap-6">
            {iconEntries.map(({ name, component: Icon }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-lg bg-surface border border-border text-text">
                  <Icon size={20} aria-hidden={false} aria-label={name} />
                </div>
                <Caption>{name}</Caption>
              </div>
            ))}
          </div>
        </Subsection>

        <Subsection title="Buttons">
          <div className="space-y-6">
            <DemoRow label="Primary">
              <div className="flex gap-3">
                <button className="btn-primary">Create Framework</button>
                <button className="btn-primary btn-sm">Small Primary</button>
              </div>
            </DemoRow>
            <DemoRow label="Secondary">
              <div className="flex gap-3">
                <button className="btn-secondary">Cancel</button>
                <button className="btn-secondary btn-sm">Small Secondary</button>
              </div>
            </DemoRow>
            <DemoRow label="Ghost">
              <div className="flex gap-3">
                <button className="btn-ghost">Edit</button>
                <button className="btn-ghost btn-sm">Small Ghost</button>
              </div>
            </DemoRow>
            <DemoRow label="Icon">
              <div className="flex gap-3">
                <button className="btn-icon text-text-secondary"><PlusIcon size={18} /></button>
                <button className="btn-icon text-text-secondary"><EditIcon size={18} /></button>
                <ThemeToggleButton darkMode={darkMode} onToggle={toggleDark} />
              </div>
            </DemoRow>
          </div>
        </Subsection>

        <Subsection title="Badge">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Caption>Count:</Caption>
              <Badge count={0} />
              <Badge count={3} />
              <Badge count={12} />
              <Badge count={99} />
            </div>
            <div className="flex items-center gap-2">
              <Caption>With label:</Caption>
              <Badge count={5} label="5 items in quadrant" />
            </div>
          </div>
        </Subsection>

        {/* ── Components ── */}
        <SectionHeading>Components</SectionHeading>

        <Subsection title="Color Picker">
          <div className="flex items-center gap-4">
            <ColorPicker color={pickerColor} onChange={setPickerColor} />
            <Caption>
              Selected: <code className="bg-bg px-1.5 py-0.5 rounded border border-border">{pickerColor}</code>
            </Caption>
          </div>
        </Subsection>

        <Subsection title="Theme Toggle">
          <div className="flex items-center gap-4">
            <ThemeToggleButton darkMode={darkMode} onToggle={toggleDark} />
            <Caption>Current: {darkMode ? 'Dark' : 'Light'}</Caption>
          </div>
        </Subsection>

        <Subsection title="Toast">
          <div className="flex items-center gap-4">
            <button
              className="btn-secondary btn-sm"
              onClick={() => setShowToast(true)}
            >
              Show Toast
            </button>
            <Caption>
              Renders a fixed-position error alert at bottom of screen.
            </Caption>
          </div>
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
