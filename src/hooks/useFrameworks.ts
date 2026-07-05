import { useState, useEffect, useCallback } from 'react'
import { loadFrameworks, saveFrameworks } from '../storage'
import {
  createFramework,
  updateFramework,
  deleteFramework,
  duplicateFramework,
  applyTemplateEdit,
  replaceFramework,
  duplicateAsImport,
} from '../logic/framework'
import { initHistory, commit, undo as undoHistory, redo as redoHistory } from '../logic/history'
import type { Framework, FrameworkTemplate } from '../types'

export function useFrameworks() {
  const [history, setHistory] = useState(() => initHistory(loadFrameworks()))
  const [saveError, setSaveError] = useState<string | null>(null)
  const frameworks = history.present

  useEffect(() => {
    const saved = saveFrameworks(frameworks)
    // Surface failures (e.g. quota exceeded) instead of silently losing
    // data; clear the message once a later save succeeds (BUG-010).
    setSaveError(saved ? null : 'Your changes could not be saved. Free up storage space and try again.')
  }, [frameworks])

  const clearSaveError = useCallback(() => setSaveError(null), [])

  const getFramework = useCallback((id: string | null) => frameworks.find((f) => f.id === id) ?? null, [frameworks])

  // Single dispatch point: every data mutation funnels through here so each
  // one becomes an undoable history entry (FEAT-003).
  const apply = useCallback((updater: (prev: Framework[]) => Framework[]) => {
    setHistory((h) => commit(h, updater(h.present)))
  }, [])

  const undo = useCallback(() => setHistory(undoHistory), [])

  const redo = useCallback(() => setHistory(redoHistory), [])

  const create = useCallback(
    (template: FrameworkTemplate): Framework => {
      const fw = createFramework(template)
      apply((prev) => [...prev, fw])
      return fw
    },
    [apply],
  )

  const update = useCallback(
    (updated: Framework) => {
      apply((prev) => updateFramework(prev, updated))
    },
    [apply],
  )

  const remove = useCallback(
    (id: string) => {
      apply((prev) => deleteFramework(prev, id))
    },
    [apply],
  )

  const duplicate = useCallback(
    (fw: Framework): Framework => {
      const dup = duplicateFramework(fw)
      apply((prev) => [...prev, dup])
      return dup
    },
    [apply],
  )

  const editStructure = useCallback(
    (fw: Framework, template: FrameworkTemplate) => {
      const updated = applyTemplateEdit(fw, template)
      apply((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
    },
    [apply],
  )

  const replace = useCallback(
    (incoming: Framework) => {
      apply((prev) => replaceFramework(prev, incoming))
    },
    [apply],
  )

  const addImport = useCallback(
    (fw: Framework): Framework => {
      const dup = duplicateAsImport(fw)
      apply((prev) => [...prev, dup])
      return dup
    },
    [apply],
  )

  const addRaw = useCallback(
    (fw: Framework) => {
      apply((prev) => [...prev, fw])
    },
    [apply],
  )

  return {
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
  }
}
