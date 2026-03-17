import { useState, useEffect, useCallback } from 'react'
import { loadFrameworks, saveFrameworks, createFramework } from './storage'
import Sidebar from './components/Sidebar'
import QuadrantCanvas from './components/QuadrantCanvas'
import FrameworkBuilder from './components/FrameworkBuilder'
import ReflectionMode from './components/ReflectionMode'
import './App.css'

export default function App() {
  const [frameworks, setFrameworks] = useState(() => loadFrameworks())
  const [activeId, setActiveId] = useState(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingFramework, setEditingFramework] = useState(null)
  const [reflectionMode, setReflectionMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
        {showBuilder ? (
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
