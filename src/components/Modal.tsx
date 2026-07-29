import { useEffect, useId, useRef, type RefObject } from 'react'
import Button from './atoms/Button'
import { XIcon } from './Icons'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useIsMobile } from '../hooks/useIsMobile'

interface ModalProps {
  /** Shown in the title bar and used as the dialog's accessible name. */
  title: string
  /**
   * The control that opened the modal — focus returns to it when the modal
   * unmounts (A11Y-022). Declared by ref, read at cleanup time, so a host
   * that re-points it while the modal is open still gets focus back on its
   * current notion of the opener.
   */
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

  // Every exit path unmounts the modal, so the unmount cleanup is the one
  // place that covers them all (A11Y-022).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => openerRef?.current?.focus()
  }, [openerRef])

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
          isMobile
            ? 'w-full h-full'
            : `w-full ${maxWidthClassName} max-h-full rounded-2xl border border-border shadow-[0_8px_32px_rgb(0_0_0/0.18)]`
        }`}>
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <h2 id={titleId} className="text-base font-semibold text-text truncate">
            {title}
          </h2>
          <Button variant="icon" onClick={onClose} aria-label={`Close ${title}`}>
            <XIcon size={18} />
          </Button>
        </div>

        {/* Content — hosts arbitrary children and never scrolls itself; a
            child that can outgrow the modal owns its own scrolling. */}
        <div className="flex-1 min-h-0 flex flex-col px-4 py-4">{children}</div>
      </div>
    </div>
  )
}
