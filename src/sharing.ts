import { isValidPayload, toSharedPayload } from './logic/sharePayload'
import type { Framework, SharedPayload } from './types'

function assertCompressionSupport(): void {
  if (
    typeof (globalThis as { CompressionStream?: unknown }).CompressionStream === 'undefined' ||
    typeof (globalThis as { DecompressionStream?: unknown }).DecompressionStream === 'undefined'
  ) {
    throw new Error('Your browser does not support sharing. Please update to a newer version.')
  }
}

export async function encodeFramework(framework: Framework): Promise<string> {
  assertCompressionSupport()
  const json = JSON.stringify(toSharedPayload(framework))
  const bytes = new TextEncoder().encode(json)

  const cs = new CompressionStream('deflate')
  const writer = cs.writable.getWriter()
  writer.write(bytes)
  writer.close()

  const compressed = await new Response(cs.readable).arrayBuffer()

  const compressedBytes = new Uint8Array(compressed)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < compressedBytes.length; i += chunkSize) {
    binary += String.fromCharCode(...compressedBytes.subarray(i, i + chunkSize))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function decodeFramework(hash: string): Promise<SharedPayload | null> {
  assertCompressionSupport()
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
