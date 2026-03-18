import { useState, useRef, useEffect } from 'react'
import {
  QuadrantGridIcon,
  SunIcon,
  MoonIcon,
  SidebarIcon,
  PlusIcon,
  ImportIcon,
  MoreVerticalIcon,
} from './Icons'
import type { Framework } from '../types'

interface SidebarProps {
  frameworks: Framework[]
  activeId: string | null
  open: boolean
  darkMode: boolean
  onToggleDark: () => void
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
  darkMode,
  onToggleDark,
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

  useEffect(() => {
    if (!menuId) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuId])

  return (
    <>
      <aside
        className={`fixed top-0 left-0 w-[280px] h-screen bg-surface border-r border-border flex flex-col z-[100] transition-transform duration-150 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 font-semibold text-[15px]">
            <QuadrantGridIcon size={20} />
            <span>Quadrants</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn-icon text-text-secondary"
              onClick={onToggleDark}
              title="Toggle dark mode"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              className="btn-icon text-text-secondary"
              onClick={onToggle}
              title="Toggle sidebar"
            >
              <SidebarIcon size={18} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 flex flex-col gap-1.5">
          <button className="btn-primary w-full justify-center" onClick={onNew}>
            <PlusIcon />
            New Framework
          </button>
          <button
            className="btn-ghost btn-sm"
            onClick={onImport}
            title="Import JSON"
          >
            <ImportIcon size={14} />
            Import
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {frameworks.length === 0 && (
            <div className="py-6 px-4 text-center text-text-tertiary text-[13px]">
              No frameworks yet
            </div>
          )}
          {frameworks.map((fw) => (
            <div
              key={fw.id}
              className={`relative flex items-center py-2.5 px-3 rounded-lg cursor-pointer transition-colors duration-150 group ${activeId === fw.id ? 'bg-accent-light' : 'hover:bg-bg'}`}
              onClick={() => onSelect(fw.id)}
            >
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate">
                  {fw.name}
                </span>
                <span className="text-xs text-text-tertiary">
                  {fw.quadrants.reduce((sum, q) => sum + q.items.length, 0)}{' '}
                  items
                </span>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-secondary transition-opacity duration-150 hover:bg-border"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuId(menuId === fw.id ? null : fw.id)
                }}
              >
                <MoreVerticalIcon />
              </button>
              {menuId === fw.id && (
                <div
                  className="absolute right-2 top-full bg-surface border border-border rounded-lg shadow-lg z-[200] min-w-[140px] p-1"
                  ref={menuRef}
                >
                  <button
                    className="block w-full text-left px-3 py-2 text-[13px] rounded text-text hover:bg-bg"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicate(fw)
                      setMenuId(null)
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    className="block w-full text-left px-3 py-2 text-[13px] rounded text-text hover:bg-bg"
                    onClick={(e) => {
                      e.stopPropagation()
                      onExport(fw)
                      setMenuId(null)
                    }}
                  >
                    Export JSON
                  </button>
                  <button
                    className="block w-full text-left px-3 py-2 text-[13px] rounded text-danger hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(fw.id)
                      setMenuId(null)
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {!open && (
        <button
          className="fixed top-4 left-4 z-50 p-2 bg-surface border border-border rounded-lg shadow text-text-secondary transition-all duration-150 hover:text-text hover:border-border-hover"
          onClick={onToggle}
          title="Open sidebar"
        >
          <SidebarIcon size={20} />
        </button>
      )}
    </>
  )
}
