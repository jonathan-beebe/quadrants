import { composeShareUrl } from './logic/sharePayload'
import { idFromPathname, pathForId } from './logic/routing'

// The one owner of the deploy base for routing (RFCTR-011).
const BASE = import.meta.env.BASE_URL ?? '/'

export function getIdFromPath(): string | null {
  return idFromPathname(window.location.pathname, BASE)
}

export function getHashFromUrl(): string {
  return window.location.hash.slice(1)
}

// A share link is this adapter's URL — origin plus deploy base — around the
// sharing adapter's encoded payload (RFCTR-014); the composition rule itself
// is core (RFCTR-012).
export function getShareUrl(hash: string): string {
  return composeShareUrl(window.location.origin, BASE, hash)
}

export function pushPath(id: string | null): void {
  const target = pathForId(id, BASE)
  if (window.location.pathname !== target) {
    history.pushState(null, '', target)
  }
}

export function replacePath(id: string | null): void {
  history.replaceState(null, '', pathForId(id, BASE))
}
