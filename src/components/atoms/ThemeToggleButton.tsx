import { SunIcon, MoonIcon } from '../Icons'

interface ThemeToggleButtonProps {
  darkMode: boolean
  onToggle: () => void
}

export default function ThemeToggleButton({
  darkMode,
  onToggle,
}: ThemeToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="btn-icon text-text-secondary"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
