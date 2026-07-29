import type { RefObject } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import Modal from './Modal'
import FrameworkBuilderContent from './FrameworkBuilderContent'
import type { Framework, FrameworkTemplate } from '../types'

interface FrameworkBuilderModalProps {
  editingFramework: Framework | null
  /** The control that opened the builder — focus returns to it on close. */
  openerRef?: RefObject<HTMLElement | null>
  onCreate: (template: FrameworkTemplate) => void
  onCancel: () => void
}

/**
 * The framework builder presented in the shared Modal (IMPRV-010): the title
 * bar stays put while the authoring content scrolls beneath it.
 */
export default function FrameworkBuilderModal({
  editingFramework,
  openerRef,
  onCreate,
  onCancel,
}: FrameworkBuilderModalProps) {
  const isMobile = useIsMobile()

  // Desktop create mode pins the content to the modal's height so the
  // template list scrolls to the content area's bottom edge — BUG-003's
  // constraint, re-anchored from <main> to the modal. Edit mode and mobile
  // scroll the whole form instead; the Modal contract makes this wrapper,
  // not the modal, the scroll owner.
  const fullHeight = !editingFramework && !isMobile

  return (
    <Modal
      title={editingFramework ? 'Edit Framework' : 'Create Framework'}
      openerRef={openerRef}
      onClose={onCancel}
      maxWidthClassName="max-w-[860px]">
      <div className={fullHeight ? 'flex-1 min-h-0 flex flex-col' : 'flex-1 min-h-0 overflow-y-auto'}>
        <FrameworkBuilderContent editingFramework={editingFramework} onCreate={onCreate} onCancel={onCancel} />
      </div>
    </Modal>
  )
}
