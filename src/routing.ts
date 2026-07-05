import { idFromPathname, pathForId } from './logic/routing'

export function getIdFromPath(): string | null {
  return idFromPathname(window.location.pathname)
}

export function getHashFromUrl(): string {
  return window.location.hash.slice(1)
}

export function pushPath(id: string | null): void {
  const target = pathForId(id)
  if (window.location.pathname !== target) {
    history.pushState(null, '', target)
  }
}

export function replacePath(id: string | null): void {
  history.replaceState(null, '', pathForId(id))
}
