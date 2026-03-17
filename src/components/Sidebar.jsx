import { useState, useRef, useEffect } from 'react'
import './Sidebar.css'

export default function Sidebar({
  frameworks,
  activeId,
  open,
  onToggle,
  onSelect,
  onNew,
  onDelete,
  onDuplicate,
  onExport,
  onImport,
}) {
  const [menuId, setMenuId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuId) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuId])

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Quadrants</span>
          </div>
          <button className="btn btn--icon" onClick={onToggle} title="Toggle sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>

        <div className="sidebar__actions">
          <button className="btn btn--primary sidebar__new-btn" onClick={onNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Framework
          </button>
          <button className="btn btn--ghost btn--sm" onClick={onImport} title="Import JSON">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import
          </button>
        </div>

        <div className="sidebar__list">
          {frameworks.length === 0 && (
            <div className="sidebar__empty">No frameworks yet</div>
          )}
          {frameworks.map((fw) => (
            <div
              key={fw.id}
              className={`sidebar__item ${activeId === fw.id ? 'sidebar__item--active' : ''}`}
              onClick={() => onSelect(fw.id)}
            >
              <div className="sidebar__item-content">
                <span className="sidebar__item-name">{fw.name}</span>
                <span className="sidebar__item-count">
                  {fw.quadrants.reduce((sum, q) => sum + q.items.length, 0)} items
                </span>
              </div>
              <button
                className="sidebar__item-menu"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuId(menuId === fw.id ? null : fw.id)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {menuId === fw.id && (
                <div className="sidebar__menu" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicate(fw)
                      setMenuId(null)
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onExport(fw)
                      setMenuId(null)
                    }}
                  >
                    Export JSON
                  </button>
                  <button
                    className="sidebar__menu-danger"
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
        <button className="sidebar__toggle" onClick={onToggle} title="Open sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      )}
    </>
  )
}
