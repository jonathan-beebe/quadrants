import { describe, it, expect } from 'vitest'
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

  it('strips metadata fields (id, createdAt, updatedAt) during encoding', async () => {
    const fw = makeFramework()
    const encoded = await encodeFramework(fw)
    const decoded = await decodeFramework(encoded)

    expect(decoded).not.toHaveProperty('id')
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
})
