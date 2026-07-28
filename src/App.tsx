import { useState, useCallback, useEffect } from 'react'
import { useFrameworks } from './hooks/useFrameworks'
import { useRouting } from './hooks/useRouting'
import { useDarkMode } from './hooks/useDarkMode'
import { useDrawerModality } from './hooks/useDrawerModality'
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
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingFramework, setEditingFramework] = useState<Framework | null>(null)

  // One owner for the drawer's open state and, on mobile, its modality — the
  // dialog semantics, the `inert` below, and every focus move that follows from
  // opening or closing it (RFCTR-008).
  const {
    isMobile,
    open: sidebarOpen,
    isModal: sidebarIsModal,
    toggle: toggleSidebar,
    dismissForNavigation: dismissDrawer,
    closeButtonRef: sidebarCloseButtonRef,
    mainRef,
  } = useDrawerModality()

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
    mainRef,
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

  if (activeId === 'design-system') {
    return <DesignSystem />
  }

  return (
    // h-svh, not h-screen: `vh` is the large viewport (chrome retracted), so a
    // `h-screen` shell is taller than the scrollport and the document itself
    // scrolls by the height of mobile Safari's toolbar — dragging the canvas
    // slid the page and walked the canvas bottom back under the chrome BUG-015
    // had just cleared it from (BUG-017). Everything below sizes against this
    // rather than restating a viewport of its own; <main> stays the one place
    // a screen taller than the shell is allowed to scroll.
    <div className="flex h-svh overflow-hidden">
      <div inert={conflict ? true : undefined}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-on-accent focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        {/* On mobile the drawer is modal and covers the screen its own actions
            navigate to, so every action that changes what <main> renders has to
            dismiss it (BUG-014). `dismissForNavigation` is the mobile-only
            close that also decides where focus lands. */}
        <Sidebar
          frameworks={frameworks}
          activeId={activeId}
          open={sidebarOpen}
          isModal={sidebarIsModal}
          closeButtonRef={sidebarCloseButtonRef}
          themeMode={mode}
          isDark={isDark}
          onCycleTheme={cycleMode}
          onToggle={toggleSidebar}
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
        inert={sidebarIsModal ? true : undefined}
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
            onToggleSidebar={toggleSidebar}
            onCreate={handleSaveEdit}
            onCancel={closeBuilder}
          />
        ) : activeFramework ? (
          <ErrorBoundary key={activeFramework.id}>
            <QuadrantCanvas
              framework={activeFramework}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={toggleSidebar}
              onUpdate={update}
              onEdit={() => openBuilderForEdit(activeFramework)}
              onShare={share}
            />
          </ErrorBoundary>
        ) : (
          <EmptyState sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} onNew={openBuilder} />
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
