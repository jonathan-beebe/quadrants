import { useEffect, type RefObject } from 'react'

/**
 * Returns focus to `openerRef` when the calling component unmounts.
 *
 * Every exit from a modal surface — a save, a cancel, the close X, Escape —
 * unmounts it, so the unmount cleanup is the one place that covers them all
 * (A11Y-022). The target is read at cleanup time rather than captured on
 * mount, so a host that re-points the ref while the surface is open (a list
 * re-rendering behind it) still gets focus back on its current notion of the
 * opener.
 *
 * The opener is declared by the parent rather than captured from
 * `document.activeElement`, because the touch path opens a surface from
 * pointerDown with preventDefault and the opener never holds focus (RSRCH-002).
 */
export function useRestoreFocusOnUnmount(openerRef?: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    // exhaustive-deps assumes a ref names a node the calling component
    // rendered; this one names the opener, which outlives it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => openerRef?.current?.focus()
  }, [openerRef])
}
