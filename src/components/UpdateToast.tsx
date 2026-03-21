import { useRegisterSW } from 'virtual:pwa-register/react'
import { XIcon } from './Icons'

interface UpdateToastViewProps {
  className?: string
  onReload: () => void
  onDismiss: () => void
}

export function UpdateToastView({ className = '', onReload, onDismiss }: UpdateToastViewProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`max-w-md px-4 py-3 bg-surface border border-border rounded-lg shadow-lg text-sm flex items-center gap-3 ${className}`}
    >
      <span className="flex-1 text-text">A new version is available.</span>
      <button
        onClick={onReload}
        className="shrink-0 px-3 py-1 bg-accent text-white rounded font-medium hover:bg-accent/90 transition-colors duration-150"
      >
        Reload
      </button>
      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded text-text-secondary hover:bg-text-secondary/20 transition-colors duration-150"
        aria-label="Dismiss update notification"
      >
        <XIcon size={14} />
      </button>
    </div>
  )
}

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return
      setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS)
    },
  })

  if (!needRefresh) return null

  return (
    <UpdateToastView
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999]"
      onReload={() => updateServiceWorker(true)}
      onDismiss={() => setNeedRefresh(false)}
    />
  )
}
