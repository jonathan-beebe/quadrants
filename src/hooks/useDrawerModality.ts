import { useCallback, useEffect, useRef, useState } from 'react'
import { useIsMobile } from './useIsMobile'

/**
 * Single owner of the sidebar drawer's open state and, on mobile, its modality.
 *
 * The drawer's modality spans two DOM regions — the drawer itself and the
 * `<main>` it covers — so no one component can own it: `<main>` carries the
 * `inert` and is the focus target after a drawer action navigates, while the
 * drawer carries the dialog semantics. Ownership split to match the DOM leaves
 * two components writing focus, and which write survives comes down to effect
 * commit order — load-bearing and invisible (BUG-014).
 *
 * So there is exactly one writer here. Closing the drawer resolves to one focus
 * target, chosen from why it closed rather than from who runs last: `<main>`
 * when a drawer action navigated (the opener it would otherwise restore has
 * been unmounted by that navigation), the opener otherwise.
 */
export function useDrawerModality() {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(!isMobile)

  // Re-sync when the viewport crosses the 768px breakpoint: entering mobile
  // must not leave the (modal) drawer open uninvited — it would steal focus and
  // make <main> inert — and entering desktop restores the fresh-load default of
  // an open sidebar (BUG-012). Adjusted during render (the derived-state
  // pattern) rather than in an effect, so no commit ever shows the modal drawer
  // and the focus effect below never fires.
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile)
  if (prevIsMobile !== isMobile) {
    setPrevIsMobile(isMobile)
    setOpen(!isMobile)
  }

  const isModal = isMobile && open

  /** Attach to the drawer's close button — where focus lands on open. */
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  /** Attach to `<main>` — where focus lands when a drawer action navigates. */
  const mainRef = useRef<HTMLElement>(null)

  const openerRef = useRef<HTMLElement | null>(null)
  const closedByNavigationRef = useRef(false)
  const wasModalRef = useRef(false)

  const toggle = useCallback(() => {
    // The opener is captured here rather than in the effect below because by
    // the time the effect runs the commit has already put `inert` on <main>,
    // and inerting the subtree containing the focused element blurs it — so
    // document.activeElement is `<body>` by then, not the opener.
    if (!open) openerRef.current = document.activeElement as HTMLElement | null
    setOpen(!open)
  }, [open])

  const dismissForNavigation = useCallback(() => {
    if (!isMobile) return
    closedByNavigationRef.current = true
    setOpen(false)
  }, [isMobile])

  // Written as a transition rather than an effect cleanup so the close branch
  // reads both targets at the moment it runs — and so it does not fire on
  // unmount, where there is nothing left to focus.
  useEffect(() => {
    const opened = isModal && !wasModalRef.current
    const closed = !isModal && wasModalRef.current
    wasModalRef.current = isModal

    if (opened) closeButtonRef.current?.focus()
    if (!closed) return

    // Runs after the commit that closed the drawer, so `inert` is already off
    // <main> and both targets are focusable again.
    if (closedByNavigationRef.current) mainRef.current?.focus()
    else openerRef.current?.focus?.()
    closedByNavigationRef.current = false
    openerRef.current = null
  }, [isModal])

  return { isMobile, open, isModal, toggle, dismissForNavigation, closeButtonRef, mainRef }
}
