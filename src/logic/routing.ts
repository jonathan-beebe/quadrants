export function getIdFromPath(): string | null {
  const path = window.location.pathname.slice(1)
  return path || null
}

export function getHashFromUrl(): string {
  return window.location.hash.slice(1)
}

export function pushPath(id: string | null): void {
  const target = id ? `/${id}` : '/'
  if (window.location.pathname !== target) {
    history.pushState(null, '', target)
  }
}

export function replacePath(id: string | null): void {
  const target = id ? `/${id}` : '/'
  history.replaceState(null, '', target)
}
