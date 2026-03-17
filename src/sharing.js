// Encode a framework into a URL-safe hash string
export async function encodeFramework(framework) {
  // Strip metadata that isn't needed for sharing
  const payload = {
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

  // Compress with deflate
  const cs = new CompressionStream('deflate')
  const writer = cs.writable.getWriter()
  writer.write(bytes)
  writer.close()

  const compressed = await new Response(cs.readable).arrayBuffer()

  // Base64url encode
  const binary = String.fromCharCode(...new Uint8Array(compressed))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Decode a hash string back into a framework-like object
export async function decodeFramework(hash) {
  // Base64url decode
  const base64 = hash.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const compressed = Uint8Array.from(binary, (c) => c.charCodeAt(0))

  // Decompress
  const ds = new DecompressionStream('deflate')
  const writer = ds.writable.getWriter()
  writer.write(compressed)
  writer.close()

  const decompressed = await new Response(ds.readable).arrayBuffer()
  const json = new TextDecoder().decode(decompressed)
  const payload = JSON.parse(json)

  // Validate basic structure
  if (!payload.name || !Array.isArray(payload.quadrants) || payload.quadrants.length !== 4) {
    return null
  }

  return payload
}
