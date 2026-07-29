import { useEffect, useRef } from 'react'
import { useClickOutside } from '../hooks/useClickOutside'
import { useMenuKeyboardNav } from '../hooks/useMenuKeyboardNav'

export interface PopupMenuItem {
  label: string
  onSelect: () => void
  /** `danger` marks a destructive action apart from the ordinary ones. */
  variant?: 'default' | 'danger'
}

interface PopupMenuProps {
  /** Ties the menu to its trigger's `aria-controls`; must be unique per menu. */
  id: string
  open: boolean
  onClose: () => void
  /**
   * The control that opens this menu. Focus returns here when the menu closes
   * from the keyboard.
   */
  triggerRef: React.RefObject<HTMLElement | null>
  /**
   * Set when the trigger's own click toggles the menu. The outside-click
   * handler must then leave the trigger alone, or its mousedown closes the
   * menu just before the click reopens it and the trigger can never dismiss
   * what it opened (BUG-005). Leave unset when the menu opens some other way
   * (Card opens on M): there, a press on the trigger is an ordinary outside
   * click and should dismiss.
   */
  triggerToggles?: boolean
  /** Names the menu for assistive tech. */
  label: string
  items: PopupMenuItem[]
  /** Placement relative to the positioned ancestor, e.g. `left-0 mt-1`. */
  className?: string
}

/**
 * The ARIA a control carries when it opens a PopupMenu. Spread onto the
 * trigger so the two halves of the relationship cannot drift apart. A trigger
 * whose primary activation opens something else may override `aria-haspopup`
 * after the spread (Card's edit dialog wins the claim over its move menu).
 */
export function popupMenuTriggerProps(menuId: string, open: boolean) {
  return {
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
    // Only while the menu exists: aria-controls must point at a real element.
    'aria-controls': open ? menuId : undefined,
  }
}

const ITEM_CLASSES = 'block w-full text-left px-3 py-2 text-[13px] rounded'

/**
 * A popup menu: the container, its items, and the behavior that makes it a
 * menu — outside-click dismissal, arrow/Escape/Tab handling, focus-on-open,
 * and the ARIA linking it to its trigger. Card's move menu and Sidebar's
 * actions menu both render through this (RFCTR-019); only placement and the
 * items themselves differ.
 */
export default function PopupMenu({
  id,
  open,
  onClose,
  triggerRef,
  triggerToggles,
  label,
  items,
  className = '',
}: PopupMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  // An empty menu is not a menu: nothing to focus and nothing to choose.
  const isOpen = open && items.length > 0

  useClickOutside(menuRef, onClose, isOpen, triggerToggles ? triggerRef : undefined)
  const handleKeyDown = useMenuKeyboardNav(menuRef, onClose, triggerRef)

  // Focus the first item when the menu opens, so the keyboard lands inside it.
  useEffect(() => {
    if (!isOpen) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      id={id}
      role="menu"
      aria-label={label}
      className={`absolute top-full bg-surface border border-border rounded-lg shadow-lg z-[200] min-w-[140px] p-1 ${className}`}
      onKeyDown={handleKeyDown}>
      {items.map((item, i) => (
        <button
          key={i}
          role="menuitem"
          className={`${ITEM_CLASSES} ${
            item.variant === 'danger' ? 'text-danger hover:bg-red-50 dark:hover:bg-red-950' : 'text-text hover:bg-bg'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            item.onSelect()
            onClose()
          }}>
          {item.label}
        </button>
      ))}
    </div>
  )
}
