import { XIcon } from './Icons'

interface ToastProps {
  message: string
  onDismiss: () => void
}

export default function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] max-w-md px-4 py-3 bg-danger text-on-danger rounded-lg shadow-lg text-sm flex items-center gap-3">
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
