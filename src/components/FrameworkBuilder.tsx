import { useIsMobile } from '../hooks/useIsMobile'
import PageTitle from './atoms/PageTitle'
import Button from './atoms/Button'
import SidebarToggleButton from './atoms/SidebarToggleButton'
import FrameworkBuilderContent from './FrameworkBuilderContent'
import type { Framework, FrameworkTemplate } from '../types'

interface FrameworkBuilderProps {
  editingFramework: Framework | null
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onCreate: (template: FrameworkTemplate) => void
  onCancel: () => void
}

/**
 * The create/edit-framework screen: page chrome (title row, sidebar toggle,
 * page sizing) around the self-contained authoring UI
 * (FrameworkBuilderContent, IMPRV-008).
 */
export default function FrameworkBuilder({
  editingFramework,
  sidebarOpen,
  onToggleSidebar,
  onCreate,
  onCancel,
}: FrameworkBuilderProps) {
  const isMobile = useIsMobile()

  // Desktop create mode pins the page to the viewport so the template list
  // can scroll to the bottom edge (BUG-003); edit mode and mobile keep
  // normal document flow.
  const fullHeight = !editingFramework && !isMobile

  return (
    // Sized against <main>, not the viewport. These were `h-screen` /
    // `min-h-screen`, which on iOS is the large viewport — taller than the
    // shell, so locking the shell would have moved the toolbar-height scroll
    // into <main> rather than removing it (BUG-017). `min-h-full` keeps the
    // flow behavior this branch wants: fill <main>, and scroll it only when the
    // form genuinely outgrows it, as it can on a short phone.
    <div className={`flex justify-center px-6 py-10 ${fullHeight ? 'h-full' : 'min-h-full'}`}>
      <div className={`w-full max-w-[860px] ${fullHeight ? 'flex flex-col min-h-0' : ''}`}>
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isMobile && <SidebarToggleButton open={sidebarOpen} onToggle={onToggleSidebar} />}
            <PageTitle as="h2">{editingFramework ? 'Edit Framework' : 'Create Framework'}</PageTitle>
          </div>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <FrameworkBuilderContent editingFramework={editingFramework} onCreate={onCreate} onCancel={onCancel} />
      </div>
    </div>
  )
}
