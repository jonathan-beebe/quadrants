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
  const payload = JSON.parse(json) as SharedPayload

  if (!payload.id || !payload.name || !Array.isArray(payload.quadrants) || payload.quadrants.length !== 4) {
    return null
  }

  return payload
}
