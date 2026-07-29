import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import { encodeFramework, decodeSharedPayload, deliverShareUrl, type ShareOutcome } from '../sharing'
import { repairImportedFramework, exportFilename } from '../logic/framework'
import { resolveImportAction } from '../logic/shareImport'
import { getHashFromUrl, getShareUrl, replacePath } from '../routing'
import { downloadJson, pickJsonFile } from '../io'
import type { Framework } from '../types'

export interface Conflict {
  existing: Framework
  incoming: Framework
}

export interface ShareResult {
  url: string
  outcome: ShareOutcome
}

interface UseFrameworkSharingOptions {
  getFramework: (id: string | null) => Framework | null
  navigate: (id: string | null) => void
  addRaw: (fw: Framework) => void
  replace: (fw: Framework) => void
  addImport: (fw: Framework) => Framework
  /** Where focus lands when the conflict dialog is dismissed (A11Y-021). */
  mainRef: RefObject<HTMLElement | null>
}

export function useFrameworkSharing({
  getFramework,
  navigate,
  addRaw,
  replace,
  addImport,
  mainRef,
}: UseFrameworkSharingOptions) {
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(() => !!getHashFromUrl())
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showError = useCallback((message: string) => {
    if (errorTimer.current) clearTimeout(errorTimer.current)
    setError(message)
    errorTimer.current = setTimeout(() => setError(null), 5000)
  }, [])

  const clearError = useCallback(() => {
    if (errorTimer.current) clearTimeout(errorTimer.current)
    setError(null)
  }, [])

  const importFromHash = useCallback(() => {
    const hash = getHashFromUrl()
    if (!hash) return

    // Clear the hash fragment from the URL synchronously, before the async
    // decode begins. Otherwise a refresh during the decode window (or before
    // the deferred `replacePath` calls run) re-enters this code path on
    // remount and re-imports the same payload (BUG-020). This synchronous
    // clear is also the only re-entry guard we need: any same-mount re-entry
    // bails on `!hash`, and a later activation of the same link must import
    // again rather than be silently ignored (BUG-008).
    replacePath(null)

    setImporting(true)

    decodeSharedPayload(hash)
      .then((payload) => {
        if (!payload) {
          setImporting(false)
          return
        }

        const action = resolveImportAction(payload, getFramework(payload.id))

        // The dispatch below stays imperative: it owns the React state writes,
        // the deferred navigate/replace (to let `addRaw` commit first), and
        // the `setImporting(false)` lifecycle. The decision branches above
        // are entirely pure (see logic/shareImport.ts).
        switch (action.kind) {
          case 'add':
            addRaw(action.framework)
            setTimeout(() => {
              navigate(action.framework.id)
              replacePath(action.framework.id)
              setImporting(false)
            }, 0)
            return
          case 'navigate':
            setTimeout(() => {
              navigate(action.id)
              replacePath(action.id)
              setImporting(false)
            }, 0)
            return
          case 'conflict':
            setTimeout(() => {
              setConflict({ existing: action.existing, incoming: action.incoming })
              setImporting(false)
            }, 0)
            return
        }
      })
      .catch((err) => {
        console.error('Failed to decode shared framework from URL:', err)
        showError('The shared link could not be loaded. It may be invalid or corrupted.')
        replacePath(null)
        setImporting(false)
      })
  }, [getFramework, addRaw, navigate, showError])

  // This hook owns `conflict`, so it owns the focus move that follows
  // dismissing the dialog (the modal-surfaces rule, src/architecture.md).
  // Every exit navigates to the screen the choice produced, and the dialog is
  // raised by the URL rather than an opener control, so all three resolve to
  // one target: <main>, the post-navigation landing spot (BUG-014). Written as
  // a transition effect so it runs after the commit that unmounted the dialog,
  // and so any future dismissal path inherits it (A11Y-021).
  const hadConflictRef = useRef(false)
  useEffect(() => {
    const dismissed = !conflict && hadConflictRef.current
    hadConflictRef.current = !!conflict
    if (dismissed) mainRef.current?.focus()
  }, [conflict, mainRef])

  // Clear pending error auto-dismiss timer on unmount
  useEffect(() => {
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current)
    }
  }, [])

  // Load framework from URL hash on mount and on hash change
  useEffect(() => {
    importFromHash()
    window.addEventListener('hashchange', importFromHash)
    return () => window.removeEventListener('hashchange', importFromHash)
  }, [importFromHash])

  const handleConflictReplace = useCallback(() => {
    if (!conflict) return
    // Defensive freshness check (BUG-027): re-read the latest framework from
    // state before applying the replace. BUG-020's synchronous hash-clear
    // makes the original repro (refresh re-triggers the dialog with a stale
    // `existing`) unreachable in practice, and the conflict dialog blocks
    // the canvas so the user cannot normally edit while it is open. Even so,
    // looking up `getFramework(conflict.incoming.id)` here guards against the
    // local framework having been deleted out from under us (e.g. from a
    // future multi-tab/storage-event sync) — `replace` is a no-op on a
    // missing id, so we just navigate and dismiss in that case.
    const currentExisting = getFramework(conflict.incoming.id)
    if (currentExisting) {
      replace(conflict.incoming)
    }
    navigate(conflict.incoming.id)
    replacePath(conflict.incoming.id)
    setConflict(null)
  }, [conflict, getFramework, replace, navigate])

  const handleConflictDuplicate = useCallback(() => {
    if (!conflict) return
    const dup = addImport(conflict.incoming)
    navigate(dup.id)
    replacePath(dup.id)
    setConflict(null)
  }, [conflict, addImport, navigate])

  const handleConflictCancel = useCallback(() => {
    const existingId = conflict?.existing?.id ?? null
    navigate(existingId)
    replacePath(existingId)
    setConflict(null)
  }, [conflict, navigate])

  const share = useCallback(async (fw: Framework): Promise<ShareResult> => {
    const url = getShareUrl(await encodeFramework(fw))
    return { url, outcome: await deliverShareUrl(url) }
  }, [])

  const exportJson = useCallback((fw: Framework) => {
    downloadJson(exportFilename(fw.name), JSON.stringify(fw, null, 2))
  }, [])

  const importJson = useCallback(
    (onImported: (fw: Framework) => void) => {
      pickJsonFile()
        .then((text) => {
          if (text === null) return
          const raw = JSON.parse(text)
          const imported = repairImportedFramework(raw)
          if (imported) {
            onImported(imported)
          } else {
            showError('The file is not a valid framework. It must have a name and 4 quadrants.')
          }
        })
        .catch((err) => {
          console.error('Failed to import framework JSON:', err)
          showError('The file could not be read. Make sure it is valid JSON.')
        })
    },
    [showError],
  )

  return {
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
  }
}
