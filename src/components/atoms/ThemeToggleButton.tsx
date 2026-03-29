import { SunIcon, MoonIcon } from '../Icons'
import Button from './Button'
import type { ThemeMode } from '../../hooks/useDarkMode'

interface ThemeToggleButtonProps {
  mode: ThemeMode
  darkMode: boolean
  onCycle: () => void
}

function getLabel(mode: ThemeMode, darkMode: boolean): string {
  if (mode === 'system') {
    return `Following system theme (${darkMode ? 'dark' : 'light'}), switch to light mode`
  }
  if (mode === 'light') return 'Using light theme, switch to dark mode'
  return 'Using dark theme, switch to system theme'
}

export default function ThemeToggleButton({ mode, darkMode, onCycle }: ThemeToggleButtonProps) {
  return (
    <Button variant="icon" onClick={onCycle} aria-label={getLabel(mode, darkMode)}>
      <span className="relative inline-flex items-center justify-center w-4 h-4">
        {darkMode ? <MoonIcon size={16} /> : <SunIcon size={16} />}
        {mode === 'system' && <SunIcon size={9} className="absolute -top-1 -right-1" strokeWidth={2.5} />}
      </span>
    </Button>
  )
}
