import { useState, useEffect, useCallback, useRef } from 'react'
import { loadFrameworks, saveFrameworks, createFramework } from './storage'
import { encodeFramework, decodeFramework } from './sharing'
import { defaultColors } from './colors'
import Sidebar from './components/Sidebar'
import QuadrantCanvas from './components/QuadrantCanvas'
import FrameworkBuilder from './components/FrameworkBuilder'
import ReflectionMode from './components/ReflectionMode'

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
  const [conflict, setConflict] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quadrants_dark_mode')
      if (saved !== null) return saved === 'true'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const hashLoaded = useRef(false)
  const skipPush = useRef(false)

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('quadrants_dark_mode', darkMode)
  }, [darkMode])

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
          const fw = hydratePayload(payload, id)
          setTimeout(() => {
            setActiveId(fw.id)
            history.replaceState(null, '', `/${fw.id}`)
          }, 0)
          return [...prev, fw]
        }

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

        const incoming = hydratePayload(payload, id)
        setTimeout(() => setConflict({ existing, incoming }), 0)
        return prev
      })
    }).catch(() => {})
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
        } catch {}
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        frameworks={frameworks}
        activeId={activeId}
        open={sidebarOpen}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
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
      <main className={`flex-1 overflow-y-auto transition-[margin-left] duration-150 ease-in-out ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
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
            sidebarOpen={sidebarOpen}
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

function ConflictDialog({ existing, onReplace, onDuplicate, onCancel }) {
  return (
    <div className="flex items-center justify-center h-full p-10">
      <div className="max-w-[420px] text-center">
        <h2 className="text-lg font-semibold mb-2 text-text">Framework already exists</h2>
        <p className="text-sm text-text-secondary mb-5 leading-relaxed">
          A framework named <strong>"{existing.name}"</strong> already exists locally
          but differs from the shared version. What would you like to do?
        </p>
        <div className="flex gap-2 justify-center">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-secondary" onClick={onDuplicate}>Keep both</button>
          <button className="btn-primary" onClick={onReplace}>Replace local</button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary text-center p-10">
      <div className="text-text-tertiary mb-2">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-text">No framework selected</h2>
      <p className="text-sm max-w-[360px] mb-2">Create a new quadrant framework or select one from the sidebar to get started.</p>
      <button className="btn-primary" onClick={onNew}>Create Framework</button>
    </div>
  )
}
