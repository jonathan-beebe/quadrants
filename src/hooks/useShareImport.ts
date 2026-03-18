import { useEffect, useRef, useState, useCallback } from 'react'
import { encodeFramework, decodeFramework } from '../sharing'
import { hydratePayload, frameworksMatch } from '../logic/framework'
import { getIdFromPath, getHashFromUrl, replacePath } from '../logic/routing'
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

export function useShareImport({
  getFramework,
  navigate,
  addRaw,
  replace,
  addImport,
}: UseShareImportOptions) {
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const [error, setError] = useState<string | null>(null)
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hashLoaded = useRef(false)

  const showError = useCallback((message: string) => {
    if (errorTimer.current) clearTimeout(errorTimer.current)
    setError(message)
    errorTimer.current = setTimeout(() => setError(null), 5000)
  }, [])

  const clearError = useCallback(() => {
    if (errorTimer.current) clearTimeout(errorTimer.current)
    setError(null)
  }, [])

  // Load framework from URL hash on mount
  useEffect(() => {
    if (hashLoaded.current) return
    hashLoaded.current = true

    const hash = getHashFromUrl()
    if (!hash) return

    const pathId = getIdFromPath()

    decodeFramework(hash)
      .then((payload) => {
        if (!payload) return

        const id = pathId || crypto.randomUUID()
        const existing = getFramework(id)

        if (!existing) {
          const fw = hydratePayload(payload, id)
          addRaw(fw)
          setTimeout(() => {
            navigate(fw.id)
            replacePath(fw.id)
          }, 0)
          return
        }

        if (frameworksMatch(existing, payload)) {
          setTimeout(() => {
            navigate(id)
            replacePath(id)
          }, 0)
          return
        }

        const incoming = hydratePayload(payload, id)
        setTimeout(() => setConflict({ existing, incoming }), 0)
      })
      .catch((err) => {
        console.error('Failed to decode shared framework from URL:', err)
        showError('The shared link could not be loaded. It may be invalid or corrupted.')
        replacePath(null)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConflictReplace = useCallback(() => {
    if (!conflict) return
    replace(conflict.incoming)
    navigate(conflict.incoming.id)
    replacePath(conflict.incoming.id)
    setConflict(null)
  }, [conflict, replace, navigate])

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
    const url = `${window.location.origin}${base}${fw.id}#${hash}`
    await navigator.clipboard.writeText(url)
    return url
  }, [])

  const exportJson = useCallback((fw: Framework) => {
    const data = JSON.stringify(fw, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fw.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const importJson = useCallback(
    (onImported: (fw: Framework) => void) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
          try {
            const fw = JSON.parse(ev.target?.result as string)
            if (fw.name && fw.quadrants && fw.quadrants.length === 4) {
              const imported: Framework = {
                ...fw,
                id: crypto.randomUUID(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
              }
              onImported(imported)
            } else {
              showError('The file is not a valid framework. It must have a name and 4 quadrants.')
            }
          } catch (err) {
            console.error('Failed to import framework JSON:', err)
            showError('The file could not be read. Make sure it is valid JSON.')
          }
        }
        reader.readAsText(file)
      }
      input.click()
    },
    [showError],
  )

  return {
    conflict,
    error,
    clearError,
    handleConflictReplace,
    handleConflictDuplicate,
    handleConflictCancel,
    share,
    exportJson,
    importJson,
  }
}
