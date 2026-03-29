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
})
