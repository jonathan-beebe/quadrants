interface EmptyStateProps {
  onNew: () => void
}

export default function EmptyState({ onNew }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary text-center p-10">
      <div className="text-text-tertiary mb-2">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-text">No framework selected</h2>
      <p className="text-sm max-w-[360px] mb-2">
        Create a new quadrant framework or select one from the sidebar to get
        started.
      </p>
      <button className="btn-primary" onClick={onNew}>
        Create Framework
      </button>
    </div>
  )
}
