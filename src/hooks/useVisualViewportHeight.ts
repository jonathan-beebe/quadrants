import { useEffect } from 'react'

const CSS_VAR = '--visual-viewport-height'

/**
 * Publishes the height actually visible to the user — the visual viewport,
 * which the on-screen keyboard shrinks — as a CSS custom property on the
 * document root, for CSS to size against.
 *
 * No CSS unit reports this. Measured on iOS under RSRCH-002: with the keyboard
 * up, `documentElement.clientHeight` and `100svh` both stayed at 660 while only
 * 365 remained visible, and `100dvh` tracked the Safari toolbar rather than the
 * keyboard. `visualViewport` is the only signal that moves, and on iOS it is
 * the only one there is.
 *
 * Written straight to the DOM rather than held in React state on purpose.
 * BUG-012 came from reacting to viewport changes with state; a re-render here
 * would remount editors mid-edit and disturb the inert/pan model A11Y-019
 * depends on. Nothing subscribes to this — CSS consumes it.
 */
export function useVisualViewportHeight(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const viewport = window.visualViewport
    if (!viewport) return

    const publish = () => {
      document.documentElement.style.setProperty(CSS_VAR, `${Math.round(viewport.height)}px`)
    }

    publish()
    viewport.addEventListener('resize', publish)
    return () => {
      viewport.removeEventListener('resize', publish)
      document.documentElement.style.removeProperty(CSS_VAR)
    }
  }, [active])
}
