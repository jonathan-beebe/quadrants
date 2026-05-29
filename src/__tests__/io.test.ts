import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { pickJsonFile } from '../io'

describe('pickJsonFile', () => {
  const originalCreateElement = document.createElement.bind(document)
  let createdInput: HTMLInputElement

  beforeEach(() => {
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'input') {
        createdInput = el as HTMLInputElement
        vi.spyOn(createdInput, 'click').mockImplementation(() => {})
      }
      return el
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves with file contents when a file is selected', async () => {
    const promise = pickJsonFile()

    const file = new File(['{"hello":"world"}'], 'test.json', {
      type: 'application/json',
    })
    Object.defineProperty(createdInput, 'files', {
      value: [file],
      configurable: true,
    })
    createdInput.dispatchEvent(new Event('change'))

    await expect(promise).resolves.toBe('{"hello":"world"}')
  })

  it('resolves with null when the user cancels the file picker', async () => {
    const promise = pickJsonFile()

    createdInput.dispatchEvent(new Event('cancel'))

    await expect(promise).resolves.toBeNull()
  })

  // BUG-001: older browsers (and some race conditions in modern ones) fire
  // a `change` event with no files instead of a `cancel`. That path must also
  // resolve to null so the caller does not surface a misleading read error.
  it('resolves with null when change fires with no files (BUG-001)', async () => {
    const promise = pickJsonFile()

    Object.defineProperty(createdInput, 'files', {
      value: [],
      configurable: true,
    })
    createdInput.dispatchEvent(new Event('change'))

    await expect(promise).resolves.toBeNull()
  })
})
