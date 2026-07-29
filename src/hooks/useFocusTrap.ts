import { useCallback } from 'react'

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  onEscape?: () => void,
): (e: React.KeyboardEvent) => void {
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        // A nested dialog (e.g. a popover inside a modal) that already
        // consumed this Escape marked it defaultPrevented — one press
        // dismisses one surface, not the whole stack.
        if (e.defaultPrevented) return
        e.preventDefault()
        onEscape?.()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
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
    [ref, onEscape],
  )
}
