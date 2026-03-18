export const NAMED_ROUTES = ['design-system'] as const

export function getIdFromPath(): string | null {
  const path = window.location.pathname.slice(1)
  return path || null
}

export function isNamedRoute(id: string | null): boolean {
  return NAMED_ROUTES.includes(id as (typeof NAMED_ROUTES)[number])
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
