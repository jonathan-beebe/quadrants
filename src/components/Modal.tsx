import { useEffect, useId, useRef, type RefObject } from 'react'
import ModalTitleBar from './ModalTitleBar'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useIsMobile } from '../hooks/useIsMobile'
import { useRestoreFocusOnUnmount } from '../hooks/useRestoreFocusOnUnmount'

interface ModalProps {
  /** Shown in the title bar and used as the dialog's accessible name. */
  title: string
  openerRef?: RefObject<HTMLElement | null>
  onClose: () => void
  /** Tailwind max-width utility for the centered presentation. */
  maxWidthClassName?: string
  children: React.ReactNode
}

/**
 * The shared modal chrome (IMPRV-009): a title bar with the title and a close
 * button, above a content area that hosts arbitrary children. The content area
 * never scrolls itself — a child that can outgrow the modal owns its own
 * scrolling — which is what keeps the title bar in place at any content
 * length. Full screen on mobile, centered on wide screens.
 */
export default function Modal({ title, openerRef, onClose, maxWidthClassName = 'max-w-xl', children }: ModalProps) {
  const isMobile = useIsMobile()
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // A dialog must take focus when it opens, but only as a fallback: a child
  // that autofocuses (a form's first field) has already claimed it by the
  // time this effect runs, and keeps it.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.contains(document.activeElement)) dialog.focus()
  }, [])

  useRestoreFocusOnUnmount(openerRef)

  const handleKeyDown = useFocusTrap(dialogRef, onClose)

  return (
    <div
      className={`fixed inset-0 z-[200] flex bg-black/25 dark:bg-black/50 backdrop-blur-sm ${
        isMobile ? '' : 'items-center justify-center p-6'
      }`}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`flex flex-col min-h-0 bg-surface outline-none ${
          // The fullscreen mobile dialog fills a `fixed` backdrop, so it escapes
          // the shell's padding box too. Padded rather than inset so its surface
          // still reaches the physical edge (IMPRV-013).
          isMobile
            ? 'w-full h-full pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]'
            : `w-full ${maxWidthClassName} max-h-full rounded-2xl border border-border shadow-[0_8px_32px_rgb(0_0_0/0.18)]`
        }`}>
        <ModalTitleBar title={title} titleId={titleId} onClose={onClose} />

        {/* Content — hosts arbitrary children and never scrolls itself; a
            child that can outgrow the modal owns its own scrolling. */}
        <div className="flex-1 min-h-0 flex flex-col px-4 py-4">{children}</div>
      </div>
    </div>
  )
}
