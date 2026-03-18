import { useState, useEffect, useCallback } from 'react'
import { loadFrameworks, saveFrameworks, createFramework } from '../storage'
import {
  updateFramework,
  deleteFramework,
  duplicateFramework,
  applyTemplateEdit,
  replaceFramework,
  duplicateAsImport,
} from '../logic/framework'
import type { Framework, FrameworkTemplate } from '../types'

export function useFrameworks() {
  const [frameworks, setFrameworks] = useState(() => loadFrameworks())

  useEffect(() => {
    saveFrameworks(frameworks)
  }, [frameworks])

  const activeFramework = useCallback(
    (id: string | null) => frameworks.find((f) => f.id === id) ?? null,
    [frameworks],
  )

  const create = useCallback((template: FrameworkTemplate): Framework => {
    const fw = createFramework(template)
    setFrameworks((prev) => [...prev, fw])
    return fw
  }, [])

  const update = useCallback((updated: Framework) => {
    setFrameworks((prev) => updateFramework(prev, updated))
  }, [])

  const remove = useCallback((id: string) => {
    setFrameworks((prev) => deleteFramework(prev, id))
  }, [])

  const duplicate = useCallback((fw: Framework): Framework => {
    const dup = duplicateFramework(fw)
    setFrameworks((prev) => [...prev, dup])
    return dup
  }, [])

  const editStructure = useCallback(
    (fw: Framework, template: FrameworkTemplate) => {
      const updated = applyTemplateEdit(fw, template)
      setFrameworks((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f)),
      )
    },
    [],
  )

  const replace = useCallback((incoming: Framework) => {
    setFrameworks((prev) => replaceFramework(prev, incoming))
  }, [])

  const addImport = useCallback((fw: Framework): Framework => {
    const dup = duplicateAsImport(fw)
    setFrameworks((prev) => [...prev, dup])
    return dup
  }, [])

  const addRaw = useCallback((fw: Framework) => {
    setFrameworks((prev) => [...prev, fw])
  }, [])

  return {
    frameworks,
    getFramework: activeFramework,
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
