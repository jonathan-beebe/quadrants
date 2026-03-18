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
import ErrorBoundary from './components/ErrorBoundary'
import type { Framework, FrameworkTemplate } from './types'

export default function App() {
  const frameworkStore = useFrameworks()
  const { activeId, navigate } = useRouting()
  const { darkMode, toggle: toggleDark } = useDarkMode()
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingFramework, setEditingFramework] = useState<Framework | null>(null)
  const [reflectionMode, setReflectionMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const {
    conflict,
    handleConflictReplace,
    handleConflictDuplicate,
    handleConflictCancel,
    share,
    exportJson,
    importJson,
  } = useShareImport({
    getFramework: frameworkStore.getFramework,
    navigate,
    addRaw: frameworkStore.addRaw,
    replace: frameworkStore.replace,
    addImport: frameworkStore.addImport,
  })

  const activeFramework = frameworkStore.getFramework(activeId)

  const handleCreate = useCallback(
    (template: FrameworkTemplate) => {
      const fw = frameworkStore.create(template)
      navigate(fw.id)
      setShowBuilder(false)
    },
    [frameworkStore.create, navigate],
  )

  const handleDelete = useCallback(
    (id: string) => {
      frameworkStore.remove(id)
      if (activeId === id) navigate(null)
    },
    [frameworkStore.remove, activeId, navigate],
  )

  const handleDuplicate = useCallback(
    (fw: Framework) => {
      const dup = frameworkStore.duplicate(fw)
      navigate(dup.id)
    },
    [frameworkStore.duplicate, navigate],
  )

  const handleImport = useCallback(() => {
    importJson((fw: Framework) => {
      frameworkStore.addRaw(fw)
      navigate(fw.id)
    })
  }, [importJson, frameworkStore.addRaw, navigate])

  const handleSaveEdit = useCallback(
    (template: FrameworkTemplate) => {
      if (editingFramework) {
        frameworkStore.editStructure(editingFramework, template)
        setEditingFramework(null)
        setShowBuilder(false)
      } else {
        handleCreate(template)
      }
    },
    [editingFramework, frameworkStore.editStructure, handleCreate],
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

  if (reflectionMode && activeFramework) {
    return (
      <ReflectionMode
        framework={activeFramework}
        onUpdate={frameworkStore.update}
        onExit={() => setReflectionMode(false)}
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        frameworks={frameworkStore.frameworks}
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
      <main
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
              onUpdate={frameworkStore.update}
              onReflect={() => setReflectionMode(true)}
              onEdit={() => openEditor(activeFramework)}
              onShare={share}
            />
          </ErrorBoundary>
        ) : (
          <EmptyState onNew={openBuilder} />
        )}
      </main>
    </div>
  )
}
