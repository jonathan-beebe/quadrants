import { describe, it, expect, vi, afterEach } from 'vitest'
import { encodeFramework, decodeFramework } from '../sharing'
import type { Framework } from '../types'

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeFramework(overrides: Partial<Framework> = {}): Framework {
  return {
    id: 'test-id',
    name: 'Test Framework',
    axisX: 'X Axis',
    axisY: 'Y Axis',
    quadrants: [
      { label: 'Q1', color: '#fbbf24', items: [{ id: 'i1', text: 'Item 1', x: 10, y: 20, createdAt: 1000 }] },
      { label: 'Q2', color: '#60a5fa', items: [] },
      { label: 'Q3', color: '#34d399', items: [] },
      { label: 'Q4', color: '#f472b6', items: [] },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

/** Compress an arbitrary object into a share hash, bypassing encodeFramework's projection. */
async function encodeRawPayload(payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  const cs = new CompressionStream('deflate')
  const writer = cs.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const compressed = await new Response(cs.readable).arrayBuffer()
  const binary = String.fromCharCode(...new Uint8Array(compressed))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('encodeFramework / decodeFramework', () => {
  it('round-trips a framework through encode and decode', async () => {
    const fw = makeFramework()
    const encoded = await encodeFramework(fw)
    const decoded = await decodeFramework(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded!.name).toBe('Test Framework')
    expect(decoded!.axisX).toBe('X Axis')
    expect(decoded!.axisY).toBe('Y Axis')
    expect(decoded!.quadrants).toHaveLength(4)
    expect(decoded!.quadrants[0].label).toBe('Q1')
    expect(decoded!.quadrants[0].items[0].text).toBe('Item 1')
  })

  it('includes the framework id in the encoded payload', async () => {
    const fw = makeFramework({ id: 'my-uuid-123' })
    const encoded = await encodeFramework(fw)
    const decoded = await decodeFramework(encoded)

    expect(decoded!.id).toBe('my-uuid-123')
  })

  it('strips item-level and framework-level metadata (createdAt, updatedAt, item ids)', async () => {
    const fw = makeFramework()
    const encoded = await encodeFramework(fw)
    const decoded = await decodeFramework(encoded)

    expect(decoded).not.toHaveProperty('createdAt')
    expect(decoded).not.toHaveProperty('updatedAt')
    expect(decoded!.quadrants[0].items[0]).not.toHaveProperty('id')
    expect(decoded!.quadrants[0].items[0]).not.toHaveProperty('createdAt')
  })

  it('produces a URL-safe string (no +, /, or =)', async () => {
    const fw = makeFramework()
    const encoded = await encodeFramework(fw)

    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('rejects corrupt deflate data solely through the returned promise, with no orphaned rejection (BUG-011)', async () => {
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason)
    }
    // No @types/node in this project; the test runner still provides process.
    const proc = (
      globalThis as unknown as {
        process: {
          on(event: 'unhandledRejection', listener: (reason: unknown) => void): void
          off(event: 'unhandledRejection', listener: (reason: unknown) => void): void
        }
      }
    ).process
    proc.on('unhandledRejection', onUnhandled)
    try {
      // Valid base64url characters, but garbage deflate data.
      const fw = makeFramework()
      const encoded = await encodeFramework(fw)
      const corrupt = encoded.slice(0, 10) + encoded.slice(18)

      await expect(decodeFramework(corrupt)).rejects.toThrow()

      // Give any orphaned writer promise a chance to surface.
      await new Promise((r) => setTimeout(r, 20))
      expect(unhandled).toEqual([])
    } finally {
      proc.off('unhandledRejection', onUnhandled)
    }
  })

  it('returns null when the decoded payload fails validation', async () => {
    // Wiring-level check only: the validation rule matrix is unit-tested
    // directly in logic/sharePayload.test.ts.
    const hash = await encodeRawPayload({ notAFramework: true })
    expect(await decodeFramework(hash)).toBeNull()
  })

  it('handles frameworks with unicode text', async () => {
    const fw = makeFramework({
      name: 'Prüfung 测试 テスト',
    })
    const encoded = await encodeFramework(fw)
    const decoded = await decodeFramework(encoded)
    expect(decoded!.name).toBe('Prüfung 测试 テスト')
  })

  it('round-trips a framework too large for an unchunked argument spread (BUG-011)', async () => {
    // Incompressible (unique random) text keeps the compressed payload above
    // V8's spread argument limit (~125k args throws RangeError), so an
    // unchunked `String.fromCharCode(...bytes)` implementation fails this
    // test on the user-visible breakage itself — no spies on built-ins.
    function randText(chars: number): string {
      let s = ''
      while (s.length < chars) s += Math.random().toString(36).slice(2)
      return s.slice(0, chars)
    }
    const items = Array.from({ length: 400 }, (_, i) => ({
      id: `item-${i}`,
      text: randText(900),
      x: (i * 7) % 100,
      y: (i * 13) % 100,
      createdAt: 1000 + i,
    }))

    const fw: Framework = {
      id: 'large-id',
      name: 'Large Framework',
      axisX: 'X',
      axisY: 'Y',
      quadrants: [
        { label: 'Q1', color: '#fbbf24', items },
        { label: 'Q2', color: '#60a5fa', items: [] },
        { label: 'Q3', color: '#34d399', items: [] },
        { label: 'Q4', color: '#f472b6', items: [] },
      ],
      createdAt: 1000,
      updatedAt: 1000,
    }

    const encoded = await encodeFramework(fw)
    expect(encoded.length).toBeGreaterThan(0)

    const decoded = await decodeFramework(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded!.quadrants[0].items).toHaveLength(items.length)
    expect(decoded!.quadrants[0].items[0].text).toBe(items[0].text)
    expect(decoded!.quadrants[0].items[items.length - 1].text).toBe(items[items.length - 1].text)
  })

  it('encodeFramework rejects with a friendly error when CompressionStream is unsupported (BUG-026)', async () => {
    vi.stubGlobal('CompressionStream', undefined)
    const fw = makeFramework()
    await expect(encodeFramework(fw)).rejects.toThrow(/browser|support/i)
    await expect(encodeFramework(fw)).rejects.toBeInstanceOf(Error)
  })

  it('decodeFramework rejects with a friendly error when DecompressionStream is unsupported (BUG-026)', async () => {
    // First produce a valid hash with the real implementation.
    const fw = makeFramework()
    const encoded = await encodeFramework(fw)

    vi.stubGlobal('DecompressionStream', undefined)
    await expect(decodeFramework(encoded)).rejects.toThrow(/browser|support/i)
    await expect(decodeFramework(encoded)).rejects.toBeInstanceOf(Error)
  })
})
