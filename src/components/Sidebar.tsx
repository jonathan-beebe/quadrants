import { useState, useRef, useEffect, useCallback } from 'react'
import { QuadrantGridIcon, SidebarIcon, PlusIcon, ImportIcon, MoreVerticalIcon } from './Icons'
import ThemeToggleButton from './atoms/ThemeToggleButton'
import Caption from './atoms/Caption'
import Button from './atoms/Button'
import { useClickOutside } from '../hooks/useClickOutside'
import { useMenuKeyboardNav } from '../hooks/useMenuKeyboardNav'
import { useIsMobile } from '../hooks/useIsMobile'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { Framework } from '../types'
import type { ThemeMode } from '../hooks/useDarkMode'

interface SidebarProps {
  frameworks: Framework[]
  activeId: string | null
  open: boolean
  themeMode: ThemeMode
  isDark: boolean
  onCycleTheme: () => void
  onToggle: () => void
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onDuplicate: (fw: Framework) => void
  onExport: (fw: Framework) => void
  onImport: () => void
}

export default function Sidebar({
  frameworks,
  activeId,
  open,
  themeMode,
  isDark,
  onCycleTheme,
  onToggle,
  onSelect,
  onNew,
  onDelete,
  onDuplicate,
  onExport,
  onImport,
}: SidebarProps) {
  const [openMenuFrameworkId, setOpenMenuFrameworkId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const isMobile = useIsMobile()
  const isModal = isMobile && open

  const closeMenu = useCallback(() => setOpenMenuFrameworkId(null), [])
  // menuTriggerRef is excluded so the trigger's own onClick toggle can close
  // the menu instead of racing the mousedown-close (BUG-005).
  useClickOutside(menuRef, closeMenu, !!openMenuFrameworkId, menuTriggerRef)

  // When the drawer becomes modal (mobile + open), move focus into it and
  // remember where focus came from so we can restore it on close.
  useEffect(() => {
    if (!isModal) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    return () => {
      previouslyFocusedRef.current?.focus?.()
      previouslyFocusedRef.current = null
    }
  }, [isModal])

  const handleAsideKeyDown = useFocusTrap(asideRef, isModal ? onToggle : undefined)

  // Focus first menu item when menu opens
  useEffect(() => {
    if (openMenuFrameworkId && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLElement>('[role="menuitem"]')
      first?.focus()
    }
  }, [openMenuFrameworkId])

  const handleMenuKeyDown = useMenuKeyboardNav(menuRef, closeMenu, menuTriggerRef)

  return (
    <>
      {open && isMobile && (
        <div
          data-testid="sidebar-backdrop"
          className="fixed inset-0 bg-black/30 z-[99]"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      <aside
        ref={asideRef}
        aria-label="Frameworks sidebar"
        aria-modal={isModal ? true : undefined}
        role={isModal ? 'dialog' : undefined}
        inert={!open ? true : undefined}
        onKeyDown={isModal ? handleAsideKeyDown : undefined}
        className={`fixed top-0 left-0 w-[280px] h-screen bg-surface border-r border-border flex flex-col z-[100] transition-transform duration-150 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 font-semibold text-[15px]">
            <QuadrantGridIcon size={20} />
            <span>Quadrants</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggleButton mode={themeMode} isDark={isDark} onCycleTheme={onCycleTheme} />
            <Button
              ref={closeButtonRef}
              variant="icon"
              onClick={onToggle}
              aria-label="Close sidebar"
              aria-expanded="true">
              <SidebarIcon size={18} />
            </Button>
          </div>
        </div>

        <div className="px-4 py-3 flex flex-col gap-1.5">
          <Button className="w-full justify-center" onClick={onNew}>
            <PlusIcon />
            New Framework
          </Button>
          <Button variant="ghost" size="sm" onClick={onImport} title="Import JSON">
            <ImportIcon size={14} />
            Import
          </Button>
        </div>

        <nav aria-label="Frameworks" className="flex-1 overflow-y-auto px-2 py-1">
          {frameworks.length === 0 && (
            <div role="status" className="py-6 px-4 text-center text-text-tertiary text-[13px]">
              No frameworks yet
            </div>
          )}
          <ul role="list" className="list-none m-0 p-0">
            {frameworks.map((fw) => (
              <li
                key={fw.id}
                className={`relative flex items-center rounded-lg transition-colors duration-150 group ${activeId === fw.id ? 'bg-accent-light' : 'hover:bg-bg'}`}>
                <button
                  className="flex-1 min-w-0 text-left py-2.5 px-3 bg-transparent"
                  aria-current={activeId === fw.id ? 'page' : undefined}
                  onClick={() => onSelect(fw.id)}>
                  <span className="block text-sm font-medium truncate">{fw.name}</span>
                  <Caption>{fw.quadrants.reduce((sum, q) => sum + q.items.length, 0)} items</Caption>
                </button>
                <button
                  ref={openMenuFrameworkId === fw.id ? menuTriggerRef : undefined}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(pointer:coarse)]:opacity-100 p-1 rounded text-text-secondary transition-opacity duration-150 hover:bg-border mr-1"
                  aria-label={`Actions for ${fw.name}`}
                  aria-haspopup="true"
                  aria-expanded={openMenuFrameworkId === fw.id}
                  onClick={() => setOpenMenuFrameworkId(openMenuFrameworkId === fw.id ? null : fw.id)}>
                  <MoreVerticalIcon />
                </button>
                {openMenuFrameworkId === fw.id && (
                  <div
                    className="absolute right-2 top-full bg-surface border border-border rounded-lg shadow-lg z-[200] min-w-[140px] p-1"
                    ref={menuRef}
                    role="menu"
                    aria-label={`Actions for ${fw.name}`}
                    onKeyDown={handleMenuKeyDown}>
                    <button
                      className="block w-full text-left px-3 py-2 text-[13px] rounded text-text hover:bg-bg"
                      role="menuitem"
                      onClick={() => {
                        onDuplicate(fw)
                        setOpenMenuFrameworkId(null)
                      }}>
                      Duplicate
                    </button>
                    <button
                      className="block w-full text-left px-3 py-2 text-[13px] rounded text-text hover:bg-bg"
                      role="menuitem"
                      onClick={() => {
                        onExport(fw)
                        setOpenMenuFrameworkId(null)
                      }}>
                      Export JSON
                    </button>
                    <button
                      className="block w-full text-left px-3 py-2 text-[13px] rounded text-danger hover:bg-red-50 dark:hover:bg-red-950"
                      role="menuitem"
                      onClick={() => {
                        onDelete(fw.id)
                        setOpenMenuFrameworkId(null)
                      }}>
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 py-3 border-t border-border">
          <Caption>Version: {__COMMIT_HASH__}</Caption>
        </div>
      </aside>

      {/* Desktop-only: on mobile every screen carries its own opener in its
          title row, so a floating copy would stack on top of it (BUG-013). */}
      {!open && !isMobile && (
        <button
          className="fixed top-4 left-4 z-50 p-2 bg-surface border border-border rounded-lg shadow text-text-secondary transition-all duration-150 hover:text-text hover:border-border-hover"
          onClick={onToggle}
          aria-label="Open sidebar"
          aria-expanded={false}>
          <SidebarIcon size={20} />
        </button>
      )}
    </>
  )
}
