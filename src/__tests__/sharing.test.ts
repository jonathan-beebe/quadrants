import { describe, it, expect, vi } from 'vitest'
import { encodeFramework, decodeFramework } from '../sharing'
import type { Framework } from '../types'

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

  it('returns null for invalid payload structure', async () => {
    const invalid = { notAFramework: true }
    const json = JSON.stringify(invalid)
    const bytes = new TextEncoder().encode(json)

    const cs = new CompressionStream('deflate')
    const writer = cs.writable.getWriter()
    writer.write(bytes)
    writer.close()
    const compressed = await new Response(cs.readable).arrayBuffer()
    const binary = String.fromCharCode(...new Uint8Array(compressed))
    const hash = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const result = await decodeFramework(hash)
    expect(result).toBeNull()
  })

  it('handles frameworks with unicode text', async () => {
    const fw = makeFramework({
      name: 'Prüfung 测试 テスト',
    })
    const encoded = await encodeFramework(fw)
    const decoded = await decodeFramework(encoded)
    expect(decoded!.name).toBe('Prüfung 测试 テスト')
  })

  it('encodes large frameworks in chunks no larger than 8192 bytes (BUG-011)', async () => {
    // Build a framework whose compressed byte payload exceeds 8192 bytes.
    // Using unique random-ish text per item to keep deflate from compressing
    // everything down to a tiny payload.
    const items = Array.from({ length: 400 }, (_, i) => ({
      id: `item-${i}`,
      text: `item-${i}-` + Math.random().toString(36).repeat(20) + '-' + i.toString(36).repeat(30),
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

    const spy = vi.spyOn(String, 'fromCharCode')
    try {
      const encoded = await encodeFramework(fw)

      // Sanity: encode actually produced output and used fromCharCode.
      expect(encoded.length).toBeGreaterThan(0)
      expect(spy).toHaveBeenCalled()

      // Every call to fromCharCode must stay within the safe chunk size of 8192.
      // The current (buggy) implementation passes the whole Uint8Array via spread
      // in a single call, which for this payload is well over 8192 args.
      const maxArgs = spy.mock.calls.reduce((max, args) => Math.max(max, args.length), 0)
      expect(maxArgs).toBeLessThanOrEqual(8192)

      // And round-trip must still work.
      const decoded = await decodeFramework(encoded)
      expect(decoded).not.toBeNull()
      expect(decoded!.quadrants[0].items).toHaveLength(items.length)
      expect(decoded!.quadrants[0].items[0].text).toBe(items[0].text)
      expect(decoded!.quadrants[0].items[items.length - 1].text).toBe(items[items.length - 1].text)
    } finally {
      spy.mockRestore()
    }
  })

  it('returns null for payload missing an id', async () => {
    const payload = {
      name: 'No ID',
      axisX: 'X',
      axisY: 'Y',
      quadrants: [
        { label: 'Q1', color: '#fbbf24', items: [] },
        { label: 'Q2', color: '#60a5fa', items: [] },
        { label: 'Q3', color: '#34d399', items: [] },
        { label: 'Q4', color: '#f472b6', items: [] },
      ],
    }
    const json = JSON.stringify(payload)
    const bytes = new TextEncoder().encode(json)

    const cs = new CompressionStream('deflate')
    const writer = cs.writable.getWriter()
    writer.write(bytes)
    writer.close()
    const compressed = await new Response(cs.readable).arrayBuffer()
    const binary = String.fromCharCode(...new Uint8Array(compressed))
    const hash = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const result = await decodeFramework(hash)
    expect(result).toBeNull()
  })
})
