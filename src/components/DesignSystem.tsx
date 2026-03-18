import { useDarkMode } from '../hooks/useDarkMode'
import ThemeToggleButton from './atoms/ThemeToggleButton'

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

export default function DesignSystem() {
  const { darkMode, toggle: toggleDark } = useDarkMode()

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-text">Design System</h1>
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
        <SectionHeading>Atoms</SectionHeading>
        <Subsection title="Colors" />
        <Subsection title="Typography" />
        <Subsection title="Icons" />
        <Subsection title="Buttons" />

        <SectionHeading>Components</SectionHeading>
        <Subsection title="Card" />
        <Subsection title="Color Picker" />
        <Subsection title="Toast" />
        <Subsection title="Dialog" />

        <SectionHeading>Layouts</SectionHeading>
        <Subsection title="Sidebar" />
        <Subsection title="Quadrant Canvas" />
        <Subsection title="Reflection Mode" />
      </main>
    </div>
  )
}
