import { useEffect, useRef } from 'react'
import Button from './atoms/Button'
import { useFocusTrap } from '../hooks/useFocusTrap'
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstButtonRef = useRef<HTMLButtonElement>(null)

  // Focus first action on mount
  useEffect(() => {
    firstButtonRef.current?.focus()
  }, [])

  const handleKeyDown = useFocusTrap(dialogRef, onCancel)

  return (
    <div className="flex items-center justify-center h-full p-10">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
        aria-describedby="conflict-dialog-desc"
        className="max-w-[420px] text-center"
        onKeyDown={handleKeyDown}
      >
        <h2 id="conflict-dialog-title" className="text-lg font-semibold mb-2 text-text">
          Framework already exists
        </h2>
        <p id="conflict-dialog-desc" className="text-sm text-text-secondary mb-5 leading-relaxed">
          A framework named <strong>&ldquo;{existing.name}&rdquo;</strong>{' '}
          already exists locally but differs from the shared version. What would
          you like to do?
        </p>
        <div className="flex gap-2 justify-center">
          <Button ref={firstButtonRef} variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onDuplicate}>
            Keep both
          </Button>
          <Button onClick={onReplace}>
            Replace local
          </Button>
        </div>
      </div>
    </div>
  )
}
