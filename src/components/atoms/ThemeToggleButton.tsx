import { SunIcon, MoonIcon } from '../Icons'
import Button from './Button'

interface ThemeToggleButtonProps {
  darkMode: boolean
  onToggle: () => void
}

export default function ThemeToggleButton({
  darkMode,
  onToggle,
}: ThemeToggleButtonProps) {
  return (
    <Button
      variant="icon"
      onClick={onToggle}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
