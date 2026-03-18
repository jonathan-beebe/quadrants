import type { Framework } from '../types'

interface ConflictDialogProps {
  existing: Framework
  incoming: Framework
  onReplace: () => void
  onDuplicate: () => void
  onCancel: () => void
}

export default function ConflictDialog({
  existing,
  onReplace,
  onDuplicate,
  onCancel,
}: ConflictDialogProps) {
  return (
    <div className="flex items-center justify-center h-full p-10">
      <div className="max-w-[420px] text-center">
        <h2 className="text-lg font-semibold mb-2 text-text">
          Framework already exists
        </h2>
        <p className="text-sm text-text-secondary mb-5 leading-relaxed">
          A framework named <strong>&ldquo;{existing.name}&rdquo;</strong>{' '}
          already exists locally but differs from the shared version. What would
          you like to do?
        </p>
        <div className="flex gap-2 justify-center">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-secondary" onClick={onDuplicate}>
            Keep both
          </button>
          <button className="btn-primary" onClick={onReplace}>
            Replace local
          </button>
        </div>
      </div>
    </div>
  )
}
