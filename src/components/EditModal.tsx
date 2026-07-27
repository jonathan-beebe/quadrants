import { useLayoutEffect, useRef, useState } from 'react'
import Button from './atoms/Button'
import { XIcon } from './Icons'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useVisualViewportHeight } from '../hooks/useVisualViewportHeight'

interface EditModalProps {
  /** Shown in the top bar and used as the dialog's accessible name. */
  title: string
  /** Text the editor opens with. */
  value: string
  /** Label above the field. Also the field's accessible name. */
  fieldLabel?: string
  onSave: (text: string) => void
  onDelete: () => void
  onCancel: () => void
}

let nextId = 0

/**
 * A self-contained editing modal, sized never to exceed the height left over
 * once the on-screen keyboard is up.
 *
 * Top-aligned, which is the whole point rather than a style choice. Measured on
 * iOS under RSRCH-002: editing a field near the bottom of the viewport made iOS
 * pan the visual viewport 383px to rescue it, dragging everything else
 * off-screen under the user. The same field edited through a top-aligned
 * surface panned 0 — immediately and after settling. Keep the field at the top
 * and there is nothing to pan.
 *
 * Height is clamped to `--visual-viewport-height` (see useVisualViewportHeight)
 * because no CSS unit reports the keyboard: `svh` is static, and `dvh` on iOS
 * follows the browser toolbar instead.
 *
 * Its own controls live inside the modal and are never pinned to the bottom of
 * the screen. `position: fixed` stays anchored to the layout viewport, so
 * bottom-pinned controls are buried by the keyboard, not lifted above it —
 * measured at 403px below the visible area.
 */
export default function EditModal({ title, value, fieldLabel = 'Text', onSave, onDelete, onCancel }: EditModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState(value)
  const [ids] = useState(() => {
    const n = nextId++
    return { title: `edit-modal-title-${n}`, field: `edit-modal-field-${n}` }
  })

  useVisualViewportHeight(true)

  // useLayoutEffect, not useEffect: React flushes discrete-event updates
  // synchronously, so a layout effect still runs inside the tap that opened the
  // modal. A passive effect runs after paint, outside the gesture, and WebKit
  // raises the keyboard only for a focus() taken during gesture processing.
  // Confirmed on device under RSRCH-002 — Card.tsx:84 has the passive version.
  useLayoutEffect(() => {
    textareaRef.current?.focus()
    textareaRef.current?.select()
  }, [])

  const handleKeyDown = useFocusTrap(dialogRef, onCancel)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center p-3
        bg-black/25 dark:bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ids.title}
        onKeyDown={handleKeyDown}
        // The clamp is the contract: whatever the keyboard leaves visible, the
        // modal fits inside it. Falls back to svh where visualViewport is
        // absent, which is the no-keyboard case anyway.
        className="w-full max-w-[440px] flex flex-col min-h-0 rounded-2xl overflow-hidden
          max-h-[calc(var(--visual-viewport-height,100svh)-1.5rem)]
          border border-white/40 dark:border-white/10
          bg-white/85 dark:bg-gray-900/75 backdrop-blur-xl
          shadow-[0_8px_32px_rgb(0_0_0/0.18)]">
        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <h2 id={ids.title} className="text-base font-semibold text-text truncate">
            {title}
          </h2>
          <Button variant="icon" onClick={onCancel} aria-label={`Close ${title}`}>
            <XIcon size={18} />
          </Button>
        </div>

        {/* Content — the only part that scrolls, so the bars stay reachable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <label htmlFor={ids.field} className="block text-xs font-medium text-text-secondary mb-1.5">
            {fieldLabel}
          </label>
          <textarea
            ref={textareaRef}
            id={ids.field}
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full resize-none rounded-lg px-3 py-2 bg-surface text-text
              border border-border focus:border-accent
              text-base leading-relaxed"
          />
        </div>

        {/* Bottom row. Delete is deliberately separated from Save rather than
            sitting between Cancel and Save: a destructive action adjacent to
            the confirm action is a misclick away from data loss. */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-t border-border">
          <Button variant="danger" onClick={onDelete}>
            Delete
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onSave(draft)}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
