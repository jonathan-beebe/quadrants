import { useState, useCallback } from 'react'
import { useFrameworks } from './hooks/useFrameworks'
import { useRouting } from './hooks/useRouting'
import { useDarkMode } from './hooks/useDarkMode'
import { useShareImport } from './hooks/useShareImport'
import Sidebar from './components/Sidebar'
import QuadrantCanvas from './components/QuadrantCanvas'
import FrameworkBuilder from './components/FrameworkBuilder'
import ReflectionMode from './components/ReflectionMode'
import ConflictDialog from './components/ConflictDialog'
import EmptyState from './components/EmptyState'
import Toast from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import DesignSystem from './components/DesignSystem'
import type { Framework, FrameworkTemplate } from './types'

export default function App() {
  const {
    frameworks,
    getFramework,
    create,
    update,
    remove,
    duplicate,
    editStructure,
    replace,
    addImport,
    addRaw,
  } = useFrameworks()
  const { activeId, navigate } = useRouting()
  const { darkMode, toggle: toggleDark } = useDarkMode()
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingFramework, setEditingFramework] = useState<Framework | null>(null)
  const [reflectionMode, setReflectionMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const {
    conflict,
    error,
    clearError,
    handleConflictReplace,
    handleConflictDuplicate,
    handleConflictCancel,
    share,
    exportJson,
    importJson,
  } = useShareImport({
    getFramework,
    navigate,
    addRaw,
    replace,
    addImport,
  })

  const activeFramework = getFramework(activeId)

  const handleCreate = useCallback(
    (template: FrameworkTemplate) => {
      const fw = create(template)
      navigate(fw.id)
      setShowBuilder(false)
    },
    [create, navigate],
  )

  const handleDelete = useCallback(
    (id: string) => {
      remove(id)
      if (activeId === id) navigate(null)
    },
    [remove, activeId, navigate],
  )

  const handleDuplicate = useCallback(
    (fw: Framework) => {
      const dup = duplicate(fw)
      navigate(dup.id)
    },
    [duplicate, navigate],
  )

  const handleImport = useCallback(() => {
    importJson((fw: Framework) => {
      addRaw(fw)
      navigate(fw.id)
    })
  }, [importJson, addRaw, navigate])

  const handleSaveEdit = useCallback(
    (template: FrameworkTemplate) => {
      if (editingFramework) {
        editStructure(editingFramework, template)
        setEditingFramework(null)
        setShowBuilder(false)
      } else {
        handleCreate(template)
      }
    },
    [editingFramework, editStructure, handleCreate],
  )

  const openBuilder = useCallback(() => {
    setEditingFramework(null)
    setShowBuilder(true)
  }, [])

  const openEditor = useCallback((fw: Framework) => {
    setEditingFramework(fw)
    setShowBuilder(true)
  }, [])

  const closeBuilder = useCallback(() => {
    setShowBuilder(false)
    setEditingFramework(null)
  }, [])

  if (activeId === 'design-system') {
    return <DesignSystem />
  }

  if (reflectionMode && activeFramework) {
    return (
      <ReflectionMode
        framework={activeFramework}
        onUpdate={update}
        onExit={() => setReflectionMode(false)}
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <div inert={conflict ? true : undefined}>
        <Sidebar
          frameworks={frameworks}
          activeId={activeId}
          open={sidebarOpen}
          darkMode={darkMode}
          onToggleDark={toggleDark}
          onToggle={() => setSidebarOpen((s) => !s)}
          onSelect={navigate}
          onNew={openBuilder}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onExport={exportJson}
          onImport={handleImport}
        />
      </div>
      <main
        id="main-content"
        className={`flex-1 overflow-y-auto transition-[margin-left] duration-150 ease-in-out ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}
      >
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
            onCancel={closeBuilder}
          />
        ) : activeFramework ? (
          <ErrorBoundary key={activeFramework.id}>
            <QuadrantCanvas
              framework={activeFramework}
              sidebarOpen={sidebarOpen}
              onUpdate={update}
              onReflect={() => setReflectionMode(true)}
              onEdit={() => openEditor(activeFramework)}
              onShare={share}
            />
          </ErrorBoundary>
        ) : (
          <EmptyState onNew={openBuilder} />
        )}
      </main>
      {error && <Toast message={error} onDismiss={clearError} />}
    </div>
  )
}
