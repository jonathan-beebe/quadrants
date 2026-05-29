import { QuadrantGridIcon } from './Icons'
import Button from './atoms/Button'
import PageTitle from './atoms/PageTitle'

interface EmptyStateProps {
  onNew: () => void
}

export default function EmptyState({ onNew }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary text-center p-10">
      <div className="text-text-tertiary mb-2">
        <QuadrantGridIcon size={48} strokeWidth={1.5} />
      </div>
      <PageTitle className="text-lg font-semibold text-text">No framework selected</PageTitle>
      <p className="text-sm max-w-[360px] mb-2">
        Create a new quadrant framework or select one from the sidebar to get started.
      </p>
      <Button onClick={onNew}>Create Framework</Button>
    </div>
  )
}
