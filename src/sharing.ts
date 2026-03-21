import type { Framework, SharedPayload } from './types'

export async function encodeFramework(framework: Framework): Promise<string> {
  const payload: SharedPayload = {
    id: framework.id,
    name: framework.name,
    axisX: framework.axisX,
    axisY: framework.axisY,
    quadrants: framework.quadrants.map((q) => ({
      label: q.label,
      color: q.color,
      items: q.items.map((it) => ({ text: it.text, x: it.x, y: it.y })),
    })),
  }

  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)

  const cs = new CompressionStream('deflate')
  const writer = cs.writable.getWriter()
  writer.write(bytes)
  writer.close()

  const compressed = await new Response(cs.readable).arrayBuffer()

  const binary = String.fromCharCode(...new Uint8Array(compressed))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function isValidPayload(p: unknown): p is SharedPayload {
  if (typeof p !== 'object' || p === null) return false
  const obj = p as Record<string, unknown>
  if (typeof obj.id !== 'string' || !obj.id) return false
  if (typeof obj.name !== 'string' || !obj.name) return false
  if (!Array.isArray(obj.quadrants) || obj.quadrants.length !== 4) return false
  return obj.quadrants.every((q: unknown) => {
    if (typeof q !== 'object' || q === null) return false
    const quad = q as Record<string, unknown>
    if (typeof quad.label !== 'string') return false
    if (quad.items !== undefined && !Array.isArray(quad.items)) return false
    const items = (quad.items as unknown[] | undefined) ?? []
    return items.every((it: unknown) => {
      if (typeof it !== 'object' || it === null) return false
      const item = it as Record<string, unknown>
      return typeof item.text === 'string' && typeof item.x === 'number' && typeof item.y === 'number'
    })
  })
}

export async function decodeFramework(hash: string): Promise<SharedPayload | null> {
  const base64 = hash.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const compressed = Uint8Array.from(binary, (c) => c.charCodeAt(0))

  const ds = new DecompressionStream('deflate')
  const writer = ds.writable.getWriter()
  writer.write(compressed)
  writer.close()

  const decompressed = await new Response(ds.readable).arrayBuffer()
  const json = new TextDecoder().decode(decompressed)
  const payload = JSON.parse(json)

  if (!isValidPayload(payload)) return null

  return payload as SharedPayload
}
