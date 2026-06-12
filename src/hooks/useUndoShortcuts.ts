import { useEffect } from 'react'

interface UndoShortcutOptions {
  enabled: boolean
  onUndo: () => void
  onRedo: () => void
}

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

/**
 * Global Cmd/Ctrl+Z (undo) and Cmd/Ctrl+Y or Cmd/Ctrl+Shift+Z (redo)
 * shortcuts. Events from text-editing targets are left alone so the
 * browser's native text undo keeps working (FEAT-003).
 */
export function useUndoShortcuts({ enabled, onUndo, onRedo }: UndoShortcutOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return
      if (isTextEditingTarget(e.target)) return

      const key = e.key.toLowerCase()
      if (key === 'z') {
        e.preventDefault()
        if (e.shiftKey) onRedo()
        else onUndo()
      } else if (key === 'y' && !e.shiftKey) {
        e.preventDefault()
        onRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onUndo, onRedo])
}
