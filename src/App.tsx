import { useState, useRef, useCallback, useEffect } from 'react'
import { useFrameworks } from './hooks/useFrameworks'
import { useRouting } from './hooks/useRouting'
import { useDarkMode } from './hooks/useDarkMode'
import { useIsMobile } from './hooks/useIsMobile'
import { useFrameworkSharing } from './hooks/useFrameworkSharing'
import { useUndoShortcuts } from './hooks/useUndoShortcuts'
import { isNamedRoute } from './logic/routing'
import { replacePath } from './routing'
import Sidebar from './components/Sidebar'
import QuadrantCanvas from './components/QuadrantCanvas'
import FrameworkBuilder from './components/FrameworkBuilder'
import ConflictDialog from './components/ConflictDialog'
import EmptyState from './components/EmptyState'
import Toast from './components/Toast'
import UpdateToast from './components/UpdateToast'
import ErrorBoundary from './components/ErrorBoundary'
import DesignSystem from './components/DesignSystem'
import type { Framework, FrameworkTemplate } from './types'

export default function App() {
  const {
    frameworks,
    getFramework,
    saveError,
    clearSaveError,
    undo,
    redo,
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
  const { isDark, mode, cycleMode } = useDarkMode()
  const isMobile = useIsMobile()
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingFramework, setEditingFramework] = useState<Framework | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  // Re-sync when the viewport crosses the 768px breakpoint: entering mobile
  // must not leave the (modal) drawer open uninvited — it would steal focus
  // and make <main> inert — and entering desktop restores the fresh-load
  // default of an open sidebar (BUG-012). Adjusted during render (the
  // derived-state pattern) rather than in an effect, so no commit ever shows
  // the modal drawer and its focus effect never fires.
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile)
  if (prevIsMobile !== isMobile) {
    setPrevIsMobile(isMobile)
    setSidebarOpen(!isMobile)
  }

  const {
    conflict,
    error,
    importing,
    clearError,
    handleConflictReplace,
    handleConflictDuplicate,
    handleConflictCancel,
    share,
    exportJson,
    importJson,
  } = useFrameworkSharing({
    getFramework,
    navigate,
    addRaw,
    replace,
    addImport,
  })

  // Undo/redo is keyboard-only and large-screen-only for now (FEAT-003).
  useUndoShortcuts({ enabled: !isMobile, onUndo: undo, onRedo: redo })

  const activeFramework = getFramework(activeId)

  // Redirect to home if the URL points to a framework that doesn't exist
  useEffect(() => {
    if (importing) return
    if (activeId && !activeFramework && !isNamedRoute(activeId)) {
      navigate(null)
      replacePath(null)
    }
  }, [activeId, activeFramework, importing, navigate])

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

  const openBuilderForEdit = useCallback((fw: Framework) => {
    setEditingFramework(fw)
    setShowBuilder(true)
  }, [])

  const closeBuilder = useCallback(() => {
    setShowBuilder(false)
    setEditingFramework(null)
  }, [])

  // On mobile the drawer is modal: it covers the screen its own actions
  // navigate to, and <main> is inert behind it. Any drawer action that changes
  // what <main> renders therefore has to dismiss it (BUG-014). Focus is handed
  // to <main> in an effect rather than here, because <main> is still inert
  // until this state change commits.
  const [focusMainAfterDismiss, setFocusMainAfterDismiss] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  const dismissDrawer = useCallback(() => {
    if (!isMobile) return
    setSidebarOpen(false)
    setFocusMainAfterDismiss(true)
  }, [isMobile])

  useEffect(() => {
    if (!focusMainAfterDismiss) return
    setFocusMainAfterDismiss(false)
    // Runs after Sidebar's restore-focus cleanup (child effects first), so it
    // wins over A11Y-005 refocusing the opener the navigation just unmounted.
    mainRef.current?.focus()
  }, [focusMainAfterDismiss])

  if (activeId === 'design-system') {
    return <DesignSystem />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div inert={conflict ? true : undefined}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-on-accent focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <Sidebar
          frameworks={frameworks}
          activeId={activeId}
          open={sidebarOpen}
          themeMode={mode}
          isDark={isDark}
          onCycleTheme={cycleMode}
          onToggle={() => setSidebarOpen((s) => !s)}
          onSelect={(id) => {
            navigate(id)
            dismissDrawer()
          }}
          onNew={() => {
            openBuilder()
            dismissDrawer()
          }}
          onDelete={handleDelete}
          onDuplicate={(fw) => {
            handleDuplicate(fw)
            dismissDrawer()
          }}
          onExport={exportJson}
          onImport={() => {
            handleImport()
            dismissDrawer()
          }}
        />
      </div>
      <main
        id="main-content"
        ref={mainRef}
        // Programmatically focusable only: the landing spot after a drawer
        // navigation, and the skip link's target.
        tabIndex={-1}
        inert={isMobile && sidebarOpen ? true : undefined}
        className={`flex-1 overflow-y-auto transition-[margin-left] duration-150 ease-in-out ${!isMobile && sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
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
            editingFramework={editingFramework}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((s) => !s)}
            onCreate={handleSaveEdit}
            onCancel={closeBuilder}
          />
        ) : activeFramework ? (
          <ErrorBoundary key={activeFramework.id}>
            <QuadrantCanvas
              framework={activeFramework}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((s) => !s)}
              onUpdate={update}
              onEdit={() => openBuilderForEdit(activeFramework)}
              onShare={share}
            />
          </ErrorBoundary>
        ) : (
          <EmptyState sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((s) => !s)} onNew={openBuilder} />
        )}
      </main>
      {error ? (
        <Toast message={error} onDismiss={clearError} />
      ) : (
        saveError && <Toast message={saveError} onDismiss={clearSaveError} />
      )}
      <UpdateToast />
    </div>
  )
}
