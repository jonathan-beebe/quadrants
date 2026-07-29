import { SunIcon, MoonIcon } from '../Icons'
import Button from './Button'
import type { ThemeMode } from '../../logic/theme'

interface ThemeToggleButtonProps {
  mode: ThemeMode
  isDark: boolean
  onCycleTheme: () => void
}

function getLabel(mode: ThemeMode, isDark: boolean): string {
  if (mode === 'system') {
    return `Following system theme (${isDark ? 'dark' : 'light'}), switch to light mode`
  }
  if (mode === 'light') return 'Using light theme, switch to dark mode'
  return 'Using dark theme, switch to system theme'
}

export default function ThemeToggleButton({ mode, isDark, onCycleTheme }: ThemeToggleButtonProps) {
  return (
    <Button variant="icon" onClick={onCycleTheme} aria-label={getLabel(mode, isDark)}>
      <span className="relative inline-flex items-center justify-center w-4 h-4">
        {isDark ? <MoonIcon size={16} /> : <SunIcon size={16} />}
        {mode === 'system' && <SunIcon size={9} className="absolute -top-1 -right-1" strokeWidth={2.5} />}
      </span>
    </Button>
  )
}
