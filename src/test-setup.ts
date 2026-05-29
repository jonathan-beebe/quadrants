import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'

if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react')

  // Polyfill matchMedia for jsdom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })

  // With `isolate: false`, Testing Library's auto-cleanup only registers against
  // the first file in a worker. Re-registering here restores per-test DOM reset.
  afterEach(() => {
    cleanup()
  })
}

// Fail any test that emits console.error — catches React act() regressions,
// unhandled promise warnings, and deprecations at the source. Tests that need
// to assert on console.error can opt out via vi.spyOn(console, 'error').
const originalConsoleError = console.error
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    const message = args
      .map((a) => (a instanceof Error ? a.message : typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ')
    if (message.startsWith('Not implemented:')) return
    originalConsoleError(...args)
    throw new Error(`console.error called during test: ${message}`)
  }
})
afterEach(() => {
  console.error = originalConsoleError
})

// Buffer non-error console output per-test; only flush on failure.
// Keeps green runs quiet while preserving context for debugging red ones.
const QUIET_METHODS = ['log', 'info', 'warn', 'debug'] as const
type QuietMethod = (typeof QUIET_METHODS)[number]
const originalQuiet = {} as Record<QuietMethod, (...args: unknown[]) => void>
let consoleBuffer: Array<{ method: QuietMethod; args: unknown[] }> = []

beforeEach(() => {
  consoleBuffer = []
  for (const method of QUIET_METHODS) {
    originalQuiet[method] = console[method]
    console[method] = (...args: unknown[]) => {
      consoleBuffer.push({ method, args })
    }
  }
})
afterEach((ctx) => {
  for (const method of QUIET_METHODS) {
    console[method] = originalQuiet[method]
  }
  if (ctx.task.result?.state === 'fail') {
    for (const { method, args } of consoleBuffer) {
      originalQuiet[method](...args)
    }
  }
  consoleBuffer = []
})
