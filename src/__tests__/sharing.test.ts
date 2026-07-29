import { describe, it, expect, vi, afterEach } from 'vitest'
import { encodeFramework, decodeSharedPayload, deliverShareUrl } from '../sharing'
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

describe('encodeFramework / decodeSharedPayload', () => {
  it('round-trips a framework through encode and decode', async () => {
    const fw = makeFramework()
    const encoded = await encodeFramework(fw)
    const decoded = await decodeSharedPayload(encoded)

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
    const decoded = await decodeSharedPayload(encoded)

    expect(decoded!.id).toBe('my-uuid-123')
  })

  it('strips item-level and framework-level metadata (createdAt, updatedAt, item ids)', async () => {
    const fw = makeFramework()
    const encoded = await encodeFramework(fw)
    const decoded = await decodeSharedPayload(encoded)

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

      await expect(decodeSharedPayload(corrupt)).rejects.toThrow()

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
    expect(await decodeSharedPayload(hash)).toBeNull()
  })

  it('handles frameworks with unicode text', async () => {
    const fw = makeFramework({
      name: 'Prüfung 测试 テスト',
    })
    const encoded = await encodeFramework(fw)
    const decoded = await decodeSharedPayload(encoded)
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

    const decoded = await decodeSharedPayload(encoded)
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

  it('decodeSharedPayload rejects with a friendly error when DecompressionStream is unsupported (BUG-026)', async () => {
    // First produce a valid hash with the real implementation.
    const fw = makeFramework()
    const encoded = await encodeFramework(fw)

    vi.stubGlobal('DecompressionStream', undefined)
    await expect(decodeSharedPayload(encoded)).rejects.toThrow(/browser|support/i)
    await expect(decodeSharedPayload(encoded)).rejects.toBeInstanceOf(Error)
  })
})

// The delivery cascade moved here from useFrameworkSharing (RFCTR-014); these
// tests carry the BUG-002 outcome semantics with it. Stubbing the raw
// navigator globals is right at this boundary — the adapter is the one module
// allowed to touch them.
describe('deliverShareUrl (RFCTR-014)', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
  const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share')

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard)
    } else {
      // jsdom may not define it -- delete to restore "absent" state
      // @ts-expect-error -- test-only cleanup
      delete (navigator as Navigator).clipboard
    }
    if (originalShare) {
      Object.defineProperty(navigator, 'share', originalShare)
    } else {
      // @ts-expect-error -- test-only cleanup
      delete (navigator as Navigator).share
    }
  })

  it('reports copied and writes to the clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    expect(await deliverShareUrl('https://app.example/#hash')).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://app.example/#hash')
  })

  // BUG-002: clipboard absent (insecure context, sandbox) must NOT report copied.
  it('falls back to navigator.share when clipboard is undefined (BUG-002)', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })

    expect(await deliverShareUrl('https://app.example/#hash')).toBe('shared')
    expect(share).toHaveBeenCalledWith({ url: 'https://app.example/#hash' })
  })

  // BUG-002: clipboard rejection must NOT report copied; navigator.share is tried.
  it('falls back to navigator.share when clipboard.writeText rejects (BUG-002)', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })

    expect(await deliverShareUrl('https://app.example/#hash')).toBe('shared')
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(share).toHaveBeenCalledTimes(1)
  })

  // BUG-002: user cancelling the native share sheet is not an error.
  it('reports cancelled when the user aborts navigator.share', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    const abort = new DOMException('aborted', 'AbortError')
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(abort),
    })

    expect(await deliverShareUrl('https://app.example/#hash')).toBe('cancelled')
  })

  // BUG-002: when nothing can deliver the URL, the outcome is 'failed'.
  it('reports failed when both clipboard and share are unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    // @ts-expect-error -- test-only cleanup
    delete (navigator as Navigator).share

    expect(await deliverShareUrl('https://app.example/#hash')).toBe('failed')
  })
})
