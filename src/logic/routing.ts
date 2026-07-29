export const NAMED_ROUTES = ['design-system'] as const

export function isNamedRoute(id: string | null): boolean {
  return NAMED_ROUTES.includes(id as (typeof NAMED_ROUTES)[number])
}

// The base is an explicit argument (RFCTR-011): the adapter (src/routing.ts)
// owns the build-env BASE_URL read, keeping these rules env-free.

export function idFromPathname(pathname: string, base: string): string | null {
  const path = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.slice(1)
  return path || null
}

export function pathForId(id: string | null, base: string): string {
  return id ? `${base}${id}` : base
}
