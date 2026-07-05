export const NAMED_ROUTES = ['design-system'] as const

const BASE = import.meta.env.BASE_URL ?? '/'

export function isNamedRoute(id: string | null): boolean {
  return NAMED_ROUTES.includes(id as (typeof NAMED_ROUTES)[number])
}

export function idFromPathname(pathname: string): string | null {
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.slice(1)
  return path || null
}

export function pathForId(id: string | null): string {
  return id ? `${BASE}${id}` : BASE
}
