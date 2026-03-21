import { useCallback } from 'react'

export function useMenuKeyboardNav(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  restoreFocusRef?: React.RefObject<HTMLElement | null>,
): (e: React.KeyboardEvent) => void {
  return useCallback(
    (e: React.KeyboardEvent) => {
      const items = ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"], [role="option"]')
      if (!items?.length) return

      const currentIdx = Array.from(items).indexOf(e.target as HTMLElement)

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        items[(currentIdx + 1) % items.length].focus()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        items[(currentIdx - 1 + items.length) % items.length].focus()
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault()
        onClose()
        restoreFocusRef?.current?.focus()
      }
    },
    [ref, onClose, restoreFocusRef],
  )
}
