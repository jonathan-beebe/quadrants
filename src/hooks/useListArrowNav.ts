import { useCallback } from 'react'

// Up/down arrow traversal over the buttons inside `ref`, for lists whose
// entries are ordinary buttons rather than a listbox. Focus only moves —
// activation stays with Enter/Space, so arrowing past an entry never applies
// it. Items are re-read on every key so a filtered list traverses just what
// it currently renders. A key pressed from outside the items (a filter input
// above them) enters the list at the near end.
export function useListArrowNav(ref: React.RefObject<HTMLElement | null>): (e: React.KeyboardEvent) => void {
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

      const items = ref.current?.querySelectorAll<HTMLElement>('button')
      if (!items?.length) return

      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      const currentIdx = Array.from(items).indexOf(e.target as HTMLElement)
      const nextIdx = currentIdx === -1 ? (step === 1 ? 0 : items.length - 1) : currentIdx + step
      items[(nextIdx + items.length) % items.length].focus()
    },
    [ref],
  )
}
