import { SidebarIcon } from '../Icons'
import Button from './Button'

interface SidebarToggleButtonProps {
  open: boolean
  onToggle: () => void
}

// The in-flow opener each screen places in its own title row. The shell's
// floating opener (Sidebar) covers desktop, where no screen reserves a slot.
export default function SidebarToggleButton({ open, onToggle }: SidebarToggleButtonProps) {
  return (
    <Button variant="icon" onClick={onToggle} aria-label="Open sidebar" aria-expanded={open}>
      <SidebarIcon size={18} />
    </Button>
  )
}
