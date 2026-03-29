import { useState, useRef, useEffect, useCallback } from 'react'
import { QuadrantGridIcon, SidebarIcon, PlusIcon, ImportIcon, MoreVerticalIcon } from './Icons'
import ThemeToggleButton from './atoms/ThemeToggleButton'
import Caption from './atoms/Caption'
import Button from './atoms/Button'
import { useClickOutside } from '../hooks/useClickOutside'
import { useMenuKeyboardNav } from '../hooks/useMenuKeyboardNav'
import type { Framework } from '../types'
import type { ThemeMode } from '../hooks/useDarkMode'

interface SidebarProps {
  frameworks: Framework[]
  activeId: string | null
  open: boolean
  themeMode: ThemeMode
  darkMode: boolean
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
  darkMode,
  onCycleTheme,
  onToggle,
  onSelect,
  onNew,
  onDelete,
  onDuplicate,
  onExport,
  onImport,
}: SidebarProps) {
  const [menuId, setMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => setMenuId(null), [])
  useClickOutside(menuRef, closeMenu, !!menuId)

  // Focus first menu item when menu opens
  useEffect(() => {
    if (menuId && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLElement>('[role="menuitem"]')
      first?.focus()
    }
  }, [menuId])

  const handleMenuKeyDown = useMenuKeyboardNav(menuRef, closeMenu, menuTriggerRef)

  return (
    <>
      <aside
        aria-label="Frameworks sidebar"
        inert={!open ? true : undefined}
        className={`fixed top-0 left-0 w-[280px] h-screen bg-surface border-r border-border flex flex-col z-[100] transition-transform duration-150 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 font-semibold text-[15px]">
            <QuadrantGridIcon size={20} />
            <span>Quadrants</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggleButton mode={themeMode} darkMode={darkMode} onCycle={onCycleTheme} />
            <Button variant="icon" onClick={onToggle} aria-label="Close sidebar" aria-expanded="true">
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
                  ref={menuId === fw.id ? menuTriggerRef : undefined}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-text-secondary transition-opacity duration-150 hover:bg-border mr-1"
                  aria-label={`Actions for ${fw.name}`}
                  aria-haspopup="true"
                  aria-expanded={menuId === fw.id}
                  onClick={() => setMenuId(menuId === fw.id ? null : fw.id)}>
                  <MoreVerticalIcon />
                </button>
                {menuId === fw.id && (
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
                        setMenuId(null)
                      }}>
                      Duplicate
                    </button>
                    <button
                      className="block w-full text-left px-3 py-2 text-[13px] rounded text-text hover:bg-bg"
                      role="menuitem"
                      onClick={() => {
                        onExport(fw)
                        setMenuId(null)
                      }}>
                      Export JSON
                    </button>
                    <button
                      className="block w-full text-left px-3 py-2 text-[13px] rounded text-danger hover:bg-red-50 dark:hover:bg-red-950"
                      role="menuitem"
                      onClick={() => {
                        onDelete(fw.id)
                        setMenuId(null)
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

      {!open && (
        <button
          className="hidden min-[769px]:block fixed top-4 left-4 z-50 p-2 bg-surface border border-border rounded-lg shadow text-text-secondary transition-all duration-150 hover:text-text hover:border-border-hover"
          onClick={onToggle}
          aria-label="Open sidebar"
          aria-expanded={false}>
          <SidebarIcon size={20} />
        </button>
      )}
    </>
  )
}
