import { XIcon } from './Icons'

// Pinned to both edges with a gutter, then centered and capped by the toast's own
// max-width. A shrink-to-fit box at left:50% can only draw on the half of the
// viewport to its right, so at phone width it never reaches its cap (DSGN-003).
// Both toasts anchor by this rule — they are one component class wearing
// different colors.
export const TOAST_ANCHOR_CLASSES = 'fixed bottom-5 inset-x-3 mx-auto z-[9999]'

interface ToastProps {
  message: string
  onDismiss: () => void
}

export default function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      className={`${TOAST_ANCHOR_CLASSES} max-w-md px-4 py-3 bg-danger text-on-danger rounded-lg shadow-lg text-sm flex items-center gap-3`}>
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 w-6 h-6 grid place-items-center rounded hover:bg-white/20 dark:hover:bg-black/10 transition-colors duration-150"
        aria-label="Dismiss error">
        <XIcon size={14} />
      </button>
    </div>
  )
}
