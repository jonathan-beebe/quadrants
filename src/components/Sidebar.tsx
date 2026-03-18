import { useState, useRef, useEffect } from 'react'
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Quadrants</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn-icon text-text-secondary"
              onClick={onToggleDark}
              title="Toggle dark mode"
            >
              {darkMode ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <button
              className="btn-icon text-text-secondary"
              onClick={onToggle}
              title="Toggle sidebar"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 py-3 flex flex-col gap-1.5">
          <button className="btn-primary w-full justify-center" onClick={onNew}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Framework
          </button>
          <button
            className="btn-ghost btn-sm"
            onClick={onImport}
            title="Import JSON"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      )}
    </>
  )
}
