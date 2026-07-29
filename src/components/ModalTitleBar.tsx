import Button from './atoms/Button'
import { XIcon } from './Icons'

interface ModalTitleBarProps {
  /** Shown in the bar and used as the surface's accessible name. */
  title: string
  /** The heading's id — the dialog points `aria-labelledby` at it. */
  titleId: string
  onClose: () => void
}

/**
 * The title bar every modal surface wears: the title, and a close button
 * labelled with what it closes. `shrink-0` is load-bearing — it is what keeps
 * the bar in place however tall the content beside it grows. Modal and
 * EditModal each carried a copy of this until RFCTR-020; the surfaces differ
 * in their frame (position, size, styling), not in their chrome.
 */
export default function ModalTitleBar({ title, titleId, onClose }: ModalTitleBarProps) {
  return (
    <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
      <h2 id={titleId} className="text-base font-semibold text-text truncate">
        {title}
      </h2>
      <Button variant="icon" onClick={onClose} aria-label={`Close ${title}`}>
        <XIcon size={18} />
      </Button>
    </div>
  )
}
