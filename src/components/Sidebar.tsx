import { useState, useRef, useCallback } from 'react'
import { QuadrantGridIcon, SidebarIcon, PlusIcon, ImportIcon, MoreVerticalIcon } from './Icons'
import ThemeToggleButton from './atoms/ThemeToggleButton'
import Caption from './atoms/Caption'
import Button from './atoms/Button'
import PopupMenu, { popupMenuTriggerProps } from './PopupMenu'
import { useIsMobile } from '../hooks/useIsMobile'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { itemCount } from '../logic/framework'
import type { Framework } from '../types'
import type { ThemeMode } from '../logic/theme'

const actionsMenuId = (frameworkId: string) => `actions-menu-${frameworkId}`

interface SidebarProps {
  frameworks: Framework[]
  activeId: string | null
  open: boolean
  /** Whether the drawer is currently a modal surface. Owned by `useDrawerModality`. */
  isModal: boolean
  /** Focus lands here when the modal drawer opens. Owned by `useDrawerModality`. */
  closeButtonRef: React.RefObject<HTMLButtonElement | null>
  themeMode: ThemeMode
  isDark: boolean
  onCycleTheme: () => void
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
  isModal,
  closeButtonRef,
  themeMode,
  isDark,
  onCycleTheme,
  onToggle,
  onSelect,
  onNew,
  onDelete,
  onDuplicate,
  onExport,
  onImport,
}: SidebarProps) {
  const [openMenuFrameworkId, setOpenMenuFrameworkId] = useState<string | null>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  // Only for the floating opener below, which is a desktop layout affordance.
  // Modality is not derived here — it arrives as `isModal` from the one owner
  // (`useDrawerModality`), so this component and `App` cannot disagree about it
  // (BUG-012).
  const isMobile = useIsMobile()

  // Stable identity: PopupMenu subscribes this through useClickOutside.
  const closeMenu = useCallback(() => setOpenMenuFrameworkId(null), [])

  const handleAsideKeyDown = useFocusTrap(asideRef, isModal ? onToggle : undefined)

  return (
    <>
      {isModal && (
        <div
          data-testid="sidebar-backdrop"
          className="fixed inset-0 bg-black/30 z-[99]"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      <aside
        ref={asideRef}
        aria-label="Frameworks sidebar"
        aria-modal={isModal ? true : undefined}
        role={isModal ? 'dialog' : undefined}
        inert={!open ? true : undefined}
        onKeyDown={isModal ? handleAsideKeyDown : undefined}
        // h-svh, not h-screen: the drawer is `fixed`, so it adds nothing to the
        // document's scroll height, but a large-viewport height still runs its
        // bottom edge behind mobile Safari's toolbar and takes the last entry
        // of the scrolling nav below with it (BUG-017).
        // Padded, not offset: the drawer's own surface should still reach the
        // physical edge, so the inset moves its contents in rather than the box
        // (IMPRV-013). It is `fixed`, so the shell's padding cannot reach it.
        className={`fixed top-0 left-0 w-[280px] h-svh pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] bg-surface border-r border-border flex flex-col z-[100] transition-transform duration-150 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 font-semibold text-[15px]">
            <QuadrantGridIcon size={20} />
            <span>Quadrants</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggleButton mode={themeMode} isDark={isDark} onCycleTheme={onCycleTheme} />
            <Button
              ref={closeButtonRef}
              variant="icon"
              onClick={onToggle}
              aria-label="Close sidebar"
              aria-expanded="true">
              <SidebarIcon size={18} />
            </Button>
          </div>
        </div>

        <div className="px-4 py-3 flex flex-col gap-1.5">
          <Button className="w-full justify-center" onClick={onNew}>
            <PlusIcon />
            New Framework
          </Button>
          <Button variant="ghost" size="sm" onClick={onImport} title="Import JSON">
            <ImportIcon size={14} />
            Import
          </Button>
        </div>

        <nav aria-label="Frameworks" className="flex-1 overflow-y-auto px-2 py-1">
          {frameworks.length === 0 && (
            <div role="status" className="py-6 px-4 text-center text-text-tertiary text-[13px]">
              No frameworks yet
            </div>
          )}
          <ul role="list" className="list-none m-0 p-0">
            {frameworks.map((fw) => (
              <li
                key={fw.id}
                className={`relative flex items-center rounded-lg transition-colors duration-150 group ${activeId === fw.id ? 'bg-accent-light' : 'hover:bg-bg'}`}>
                <button
                  className="flex-1 min-w-0 text-left py-2.5 px-3 bg-transparent"
                  aria-current={activeId === fw.id ? 'page' : undefined}
                  onClick={() => onSelect(fw.id)}>
                  <span className="block text-sm font-medium truncate">{fw.name}</span>
                  <Caption>{itemCount(fw)} items</Caption>
                </button>
                <button
                  ref={openMenuFrameworkId === fw.id ? menuTriggerRef : undefined}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(pointer:coarse)]:opacity-100 p-1 rounded text-text-secondary transition-opacity duration-150 hover:bg-border mr-1"
                  aria-label={`Actions for ${fw.name}`}
                  {...popupMenuTriggerProps(actionsMenuId(fw.id), openMenuFrameworkId === fw.id)}
                  onClick={() => setOpenMenuFrameworkId(openMenuFrameworkId === fw.id ? null : fw.id)}>
                  <MoreVerticalIcon />
                </button>
                {/* triggerToggles: the button above toggles on click, so the
                    outside-click handler must leave it alone (BUG-005). */}
                <PopupMenu
                  id={actionsMenuId(fw.id)}
                  open={openMenuFrameworkId === fw.id}
                  onClose={closeMenu}
                  triggerRef={menuTriggerRef}
                  triggerToggles
                  label={`Actions for ${fw.name}`}
                  items={[
                    { label: 'Duplicate', onSelect: () => onDuplicate(fw) },
                    { label: 'Export JSON', onSelect: () => onExport(fw) },
                    { label: 'Delete', onSelect: () => onDelete(fw.id), variant: 'danger' },
                  ]}
                  className="right-2"
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 py-3 border-t border-border">
          <Caption>Version: {__COMMIT_HASH__}</Caption>
        </div>
      </aside>

      {/* Desktop-only: on mobile every screen carries its own opener in its
          title row, so a floating copy would stack on top of it (BUG-013). */}
      {!open && !isMobile && (
        <button
          className="fixed top-[calc(1rem_+_env(safe-area-inset-top))] left-[calc(1rem_+_env(safe-area-inset-left))] z-50 p-2 bg-surface border border-border rounded-lg shadow text-text-secondary transition-all duration-150 hover:text-text hover:border-border-hover"
          onClick={onToggle}
          aria-label="Open sidebar"
          aria-expanded={false}>
          <SidebarIcon size={20} />
        </button>
      )}
    </>
  )
}
