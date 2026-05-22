import { useEffect, useRef, useState, useCallback } from 'react'
import { encodeFramework, decodeFramework } from '../sharing'
import { hydratePayload, frameworksMatch, sanitizeImportedFramework } from '../logic/framework'
import { getHashFromUrl, replacePath } from '../logic/routing'
import { downloadJson, pickJsonFile } from '../io'
import type { Framework } from '../types'

export interface Conflict {
  existing: Framework
  incoming: Framework
}

interface UseShareImportOptions {
  getFramework: (id: string | null) => Framework | null
  navigate: (id: string | null) => void
  addRaw: (fw: Framework) => void
  replace: (fw: Framework) => void
  addImport: (fw: Framework) => Framework
}

export function useShareImport({ getFramework, navigate, addRaw, replace, addImport }: UseShareImportOptions) {
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(() => !!getHashFromUrl())
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHash = useRef<string | null>(null)

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
    if (!hash || hash === lastHash.current) return
    lastHash.current = hash

    // Clear the hash fragment from the URL synchronously, before the async
    // decode begins. Otherwise a refresh during the decode window (or before
    // the deferred `replacePath` calls run) re-enters this code path on
    // remount and re-imports the same payload (BUG-020).
    replacePath(null)

    setImporting(true)

    decodeFramework(hash)
      .then((payload) => {
        if (!payload) {
          setImporting(false)
          return
        }

        const id = payload.id
        const existing = getFramework(id)

        if (!existing) {
          const fw = hydratePayload(payload, id)
          addRaw(fw)
          setTimeout(() => {
            navigate(fw.id)
            replacePath(fw.id)
            setImporting(false)
          }, 0)
          return
        }

        if (frameworksMatch(existing, payload)) {
          setTimeout(() => {
            navigate(id)
            replacePath(id)
            setImporting(false)
          }, 0)
          return
        }

        const incoming = hydratePayload(payload, id)
        setTimeout(() => {
          setConflict({ existing, incoming })
          setImporting(false)
        }, 0)
      })
      .catch((err) => {
        console.error('Failed to decode shared framework from URL:', err)
        showError('The shared link could not be loaded. It may be invalid or corrupted.')
        replacePath(null)
        setImporting(false)
      })
  }, [getFramework, addRaw, navigate, showError])

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

  const share = useCallback(async (fw: Framework): Promise<string> => {
    const hash = await encodeFramework(fw)
    const base = import.meta.env.BASE_URL ?? '/'
    const url = `${window.location.origin}${base}#${hash}`
    // Feature-detect clipboard and swallow failures so the URL is always
    // returned. `navigator.clipboard` is undefined in insecure contexts and
    // `writeText` can reject (NotAllowedError) when the page is unfocused
    // or blocked by a permission policy. The caller falls back on the URL.
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        // Intentionally ignore — URL is still returned below (BUG-025).
      }
    }
    return url
  }, [])

  const exportJson = useCallback((fw: Framework) => {
    const filename = `${fw.name.replace(/\s+/g, '-').toLowerCase()}.json`
    downloadJson(filename, JSON.stringify(fw, null, 2))
  }, [])

  const importJson = useCallback(
    (onImported: (fw: Framework) => void) => {
      pickJsonFile()
        .then((text) => {
          if (text === null) return
          const raw = JSON.parse(text)
          const imported = sanitizeImportedFramework(raw)
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
