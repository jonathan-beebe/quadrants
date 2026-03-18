import { useState, useEffect, useRef, useCallback } from 'react'
import { getIdFromPath, pushPath } from '../logic/routing'

export function useRouting() {
  const [activeId, setActiveId] = useState<string | null>(() => getIdFromPath())
  const skipPush = useRef(false)

  useEffect(() => {
    if (skipPush.current) {
      skipPush.current = false
      return
    }
    pushPath(activeId)
  }, [activeId])

  useEffect(() => {
    const handlePopState = () => {
      skipPush.current = true
      setActiveId(getIdFromPath())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((id: string | null) => {
    setActiveId(id)
  }, [])

  return { activeId, navigate }
}
