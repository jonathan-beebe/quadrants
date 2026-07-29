import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// vitest resolves test runs from the project root. Comments come out so a
// rule's selector is always preceded by a block or statement boundary.
const css = readFileSync('src/index.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** Every app source file — the test suite itself is not a numeric surface. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(path)
    return /\.tsx?$/.test(entry.name) ? [path] : []
  })
}

describe('tabular figures — IMPRV-012', () => {
  it('declares tabular figures once, document-wide, so every number inherits them', () => {
    expect(css).toMatch(/(?:^|[{};])\s*(?:html|body)\s*\{[^}]*font-variant-numeric:\s*tabular-nums/)
  })

  it('leaves no per-site opt-in class that a new numeric surface could forget', () => {
    const optIns = sourceFiles('src').filter((file) => /\btabular-nums\b/.test(readFileSync(file, 'utf8')))
    expect(optIns).toEqual([])
  })
})
