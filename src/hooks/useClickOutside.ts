import { useEffect } from 'react'

/**
 * Calls onClose when a pointer press lands outside `ref`. Pass the menu's
 * trigger as `excludeRef` when it lives outside `ref`: the trigger's own
 * onClick toggle must handle the close, otherwise the mousedown-close /
 * click-reopen race makes the trigger unable to dismiss its menu (BUG-005).
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  active: boolean,
  excludeRef?: React.RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!active) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (excludeRef?.current?.contains(target)) return
      if (ref.current && !ref.current.contains(target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ref, onClose, active, excludeRef])
}
