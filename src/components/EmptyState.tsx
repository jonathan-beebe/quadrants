import { QuadrantGridIcon } from './Icons'
import { useIsMobile } from '../hooks/useIsMobile'
import Button from './atoms/Button'
import PageTitle from './atoms/PageTitle'
import SidebarToggleButton from './atoms/SidebarToggleButton'

interface EmptyStateProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onNew: () => void
}

export default function EmptyState({ sidebarOpen, onToggleSidebar, onNew }: EmptyStateProps) {
  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col h-full">
      {isMobile && (
        <div className="flex items-center shrink-0 px-3 py-2.5 border-b border-border">
          <SidebarToggleButton open={sidebarOpen} onToggle={onToggleSidebar} />
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-secondary text-center p-10">
        <div className="text-text-tertiary mb-2">
          <QuadrantGridIcon size={48} strokeWidth={1.5} />
        </div>
        <PageTitle className="text-lg font-semibold text-text">No framework selected</PageTitle>
        <p className="text-sm max-w-[360px] mb-2">
          Create a new quadrant framework or select one from the sidebar to get started.
        </p>
        <Button onClick={onNew}>Create Framework</Button>
      </div>
    </div>
  )
}
