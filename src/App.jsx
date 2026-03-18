import { useState, useEffect, useCallback, useRef } from 'react'
import { loadFrameworks, saveFrameworks, createFramework } from './storage'
import { encodeFramework, decodeFramework } from './sharing'
import { defaultColors } from './colors'
import Sidebar from './components/Sidebar'
import QuadrantCanvas from './components/QuadrantCanvas'
import FrameworkBuilder from './components/FrameworkBuilder'
import ReflectionMode from './components/ReflectionMode'
import './App.css'

function getIdFromPath() {
  const path = window.location.pathname.slice(1)
  return path || null
}

function hydratePayload(payload, id) {
  return {
    id,
    name: payload.name,
    axisX: payload.axisX || '',
    axisY: payload.axisY || '',
    quadrants: payload.quadrants.map((q, i) => ({
      label: q.label,
      color: q.color || defaultColors[i],
      items: (q.items || []).map((it) => ({
        id: crypto.randomUUID(),
        text: it.text,
        x: it.x ?? 10,
        y: it.y ?? 10,
        createdAt: Date.now(),
      })),
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export default function App() {
  const [frameworks, setFrameworks] = useState(() => loadFrameworks())
  const [activeId, setActiveId] = useState(() => getIdFromPath())
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingFramework, setEditingFramework] = useState(null)
  const [reflectionMode, setReflectionMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [conflict, setConflict] = useState(null) // { existing, incoming }
  const hashLoaded = useRef(false)
  const skipPush = useRef(false)

  // Load framework from URL hash on mount
  useEffect(() => {
    if (hashLoaded.current) return
    hashLoaded.current = true

    const hash = window.location.hash.slice(1)
    if (!hash) return

    const pathId = getIdFromPath()

    decodeFramework(hash).then((payload) => {
      if (!payload) return

      const id = pathId || crypto.randomUUID()

      setFrameworks((prev) => {
        const existing = prev.find((f) => f.id === id)

        if (!existing) {
          // No conflict — create new
          const fw = hydratePayload(payload, id)
          setTimeout(() => {
            setActiveId(fw.id)
            history.replaceState(null, '', `/${fw.id}`)
          }, 0)
          return [...prev, fw]
        }

        // Same name and same item count — treat as same, just open it
        const sameStructure =
          existing.name === payload.name &&
          existing.quadrants.every(
            (q, i) =>
              q.label === payload.quadrants[i]?.label &&
              q.items.length === payload.quadrants[i]?.items?.length
          )

        if (sameStructure) {
          setTimeout(() => {
            setActiveId(id)
            history.replaceState(null, '', `/${id}`)
          }, 0)
          return prev
        }

        // Conflict — defer to user
        const incoming = hydratePayload(payload, id)
        setTimeout(() => setConflict({ existing, incoming }), 0)
        return prev
      })
    }).catch(() => {
      // Invalid hash, ignore
    })
  }, [])

  const handleConflictReplace = useCallback(() => {
    if (!conflict) return
    setFrameworks((prev) =>
      prev.map((f) => (f.id === conflict.incoming.id ? conflict.incoming : f))
    )
    setActiveId(conflict.incoming.id)
    history.replaceState(null, '', `/${conflict.incoming.id}`)
    setConflict(null)
  }, [conflict])

  const handleConflictDuplicate = useCallback(() => {
    if (!conflict) return
    const dup = {
      ...conflict.incoming,
      id: crypto.randomUUID(),
      name: `${conflict.incoming.name} (imported)`,
    }
    setFrameworks((prev) => [...prev, dup])
    setActiveId(dup.id)
    history.replaceState(null, '', `/${dup.id}`)
    setConflict(null)
  }, [conflict])

  const handleConflictCancel = useCallback(() => {
    setActiveId(conflict?.existing?.id || null)
    history.replaceState(null, '', conflict?.existing ? `/${conflict.existing.id}` : '/')
    setConflict(null)
  }, [conflict])

  // Sync URL when activeId changes
  useEffect(() => {
    if (skipPush.current) {
      skipPush.current = false
      return
    }
    const target = activeId ? `/${activeId}` : '/'
    if (window.location.pathname !== target) {
      history.pushState(null, '', target)
    }
  }, [activeId])

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      skipPush.current = true
      setActiveId(getIdFromPath())
      setShowBuilder(false)
      setEditingFramework(null)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    saveFrameworks(frameworks)
  }, [frameworks])

  const activeFramework = frameworks.find((f) => f.id === activeId) || null

  const handleCreate = useCallback((template) => {
    const fw = createFramework(template)
    setFrameworks((prev) => [...prev, fw])
    setActiveId(fw.id)
    setShowBuilder(false)
  }, [])

  const handleUpdate = useCallback((updated) => {
    setFrameworks((prev) =>
      prev.map((f) => (f.id === updated.id ? { ...updated, updatedAt: Date.now() } : f))
    )
  }, [])

  const handleDelete = useCallback(
    (id) => {
      setFrameworks((prev) => prev.filter((f) => f.id !== id))
      if (activeId === id) setActiveId(null)
    },
    [activeId]
  )

  const handleDuplicate = useCallback((fw) => {
    const dup = {
      ...JSON.parse(JSON.stringify(fw)),
      id: crypto.randomUUID(),
      name: `${fw.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setFrameworks((prev) => [...prev, dup])
    setActiveId(dup.id)
  }, [])

  const handleShare = useCallback(async (fw) => {
    const hash = await encodeFramework(fw)
    const url = `${window.location.origin}/${fw.id}#${hash}`
    await navigator.clipboard.writeText(url)
    return url
  }, [])

  const handleExport = useCallback((fw) => {
    const data = JSON.stringify(fw, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fw.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const fw = JSON.parse(ev.target.result)
          if (fw.name && fw.quadrants && fw.quadrants.length === 4) {
            const imported = {
              ...fw,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            setFrameworks((prev) => [...prev, imported])
            setActiveId(imported.id)
          }
        } catch {
          // Invalid JSON, ignore
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  const handleEditFramework = useCallback((fw) => {
    setEditingFramework(fw)
    setShowBuilder(true)
  }, [])

  const handleSaveEdit = useCallback((template) => {
    if (editingFramework) {
      const updated = {
        ...editingFramework,
        name: template.name,
        axisX: template.axisX || '',
        axisY: template.axisY || '',
        quadrants: editingFramework.quadrants.map((q, i) => ({
          ...q,
          label: template.quadrants[i],
        })),
        updatedAt: Date.now(),
      }
      setFrameworks((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      setEditingFramework(null)
      setShowBuilder(false)
    } else {
      handleCreate(template)
    }
  }, [editingFramework, handleCreate])

  if (reflectionMode && activeFramework) {
    return (
      <ReflectionMode
        framework={activeFramework}
        onUpdate={handleUpdate}
        onExit={() => setReflectionMode(false)}
      />
    )
  }

  return (
    <div className="app">
      <Sidebar
        frameworks={frameworks}
        activeId={activeId}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((s) => !s)}
        onSelect={setActiveId}
        onNew={() => {
          setEditingFramework(null)
          setShowBuilder(true)
        }}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onExport={handleExport}
        onImport={handleImport}
      />
      <main className={`main ${sidebarOpen ? '' : 'main--full'}`}>
        {conflict ? (
          <ConflictDialog
            existing={conflict.existing}
            incoming={conflict.incoming}
            onReplace={handleConflictReplace}
            onDuplicate={handleConflictDuplicate}
            onCancel={handleConflictCancel}
          />
        ) : showBuilder ? (
          <FrameworkBuilder
            editing={editingFramework}
            onCreate={handleSaveEdit}
            onCancel={() => {
              setShowBuilder(false)
              setEditingFramework(null)
            }}
          />
        ) : activeFramework ? (
          <QuadrantCanvas
            framework={activeFramework}
            onUpdate={handleUpdate}
            onReflect={() => setReflectionMode(true)}
            onEdit={() => handleEditFramework(activeFramework)}
            onShare={handleShare}
          />
        ) : (
          <EmptyState
            onNew={() => {
              setEditingFramework(null)
              setShowBuilder(true)
            }}
          />
        )}
      </main>
    </div>
  )
}

function ConflictDialog({ existing, incoming, onReplace, onDuplicate, onCancel }) {
  return (
    <div className="conflict">
      <div className="conflict__container">
        <h2>Framework already exists</h2>
        <p>
          A framework named <strong>"{existing.name}"</strong> already exists locally
          but differs from the shared version. What would you like to do?
        </p>
        <div className="conflict__actions">
          <button className="btn btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--secondary" onClick={onDuplicate}>
            Keep both
          </button>
          <button className="btn btn--primary" onClick={onReplace}>
            Replace local
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onNew }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>
      <h2>No framework selected</h2>
      <p>Create a new quadrant framework or select one from the sidebar to get started.</p>
      <button className="btn btn--primary" onClick={onNew}>
        Create Framework
      </button>
    </div>
  )
}
