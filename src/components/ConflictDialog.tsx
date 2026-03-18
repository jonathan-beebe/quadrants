import { useEffect, useRef, useCallback } from 'react'
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

  // Trap focus within the dialog
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onCancel],
  )

  return (
    <div className="flex items-center justify-center h-full p-10">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
        className="max-w-[420px] text-center"
        onKeyDown={handleKeyDown}
      >
        <h2 id="conflict-dialog-title" className="text-lg font-semibold mb-2 text-text">
          Framework already exists
        </h2>
        <p className="text-sm text-text-secondary mb-5 leading-relaxed">
          A framework named <strong>&ldquo;{existing.name}&rdquo;</strong>{' '}
          already exists locally but differs from the shared version. What would
          you like to do?
        </p>
        <div className="flex gap-2 justify-center">
          <button ref={firstButtonRef} className="btn-secondary" onClick={onCancel}>
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
