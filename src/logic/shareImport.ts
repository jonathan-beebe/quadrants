import { hydratePayload, frameworkMatchesPayload } from './framework'
import type { Framework, SharedPayload } from '../types'

export type ImportAction =
  | { kind: 'add'; framework: Framework }
  | { kind: 'navigate'; id: string }
  | { kind: 'conflict'; existing: Framework; incoming: Framework }

export function resolveImportAction(payload: SharedPayload, existing: Framework | null): ImportAction {
  if (!existing) {
    return { kind: 'add', framework: hydratePayload(payload, payload.id) }
  }
  if (frameworkMatchesPayload(existing, payload)) {
    return { kind: 'navigate', id: payload.id }
  }
  return { kind: 'conflict', existing, incoming: hydratePayload(payload, payload.id) }
}
