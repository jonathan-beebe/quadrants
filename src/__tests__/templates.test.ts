import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { templates } from '../templates'
import { colorPresets } from '../colors'
import { TEMPLATE_CATEGORIES } from '../types'

const paletteHexes = new Set(colorPresets.map((c) => c.hex))

const docsDir = join(process.cwd(), 'docs/frameworks')

const slugOf = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** The one-sentence summary: the first blockquote of a doc, flattened to plain text. */
const docSummaryOf = (markdown: string) => {
  const lines = markdown.split('\n')
  const start = lines.findIndex((line) => line.startsWith('>'))
  const quote: string[] = []
  for (let i = start; i >= 0 && i < lines.length && lines[i].startsWith('>'); i++) {
    quote.push(lines[i].replace(/^>\s?/, ''))
  }
  return quote.join(' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
}

describe('templates', () => {
  it('provides at least one template', () => {
    expect(templates.length).toBeGreaterThan(0)
  })

  it('each template has required fields', () => {
    for (const template of templates) {
      expect(template.name).toBeTruthy()
      expect(typeof template.axisX).toBe('string')
      expect(typeof template.axisY).toBe('string')
      expect(template.quadrants).toHaveLength(4)
    }
  })

  it('each template has 4 non-empty quadrant labels', () => {
    for (const template of templates) {
      for (const label of template.quadrants) {
        expect(label).toBeTruthy()
      }
    }
  })

  it('each template has a one-line description', () => {
    for (const template of templates) {
      expect(template.description?.trim()).toBeTruthy()
    }
  })

  it('each template defines 4 colors drawn from the palette', () => {
    for (const template of templates) {
      expect(template.colors, `${template.name} is missing colors`).toBeDefined()
      expect(template.colors).toHaveLength(4)
      for (const hex of template.colors!) {
        expect(paletteHexes, `${template.name}: ${hex} not in palette`).toContain(hex)
      }
    }
  })

  it('no two templates render with an identical color set', () => {
    const seen = new Map<string, string>()
    for (const template of templates) {
      const key = template.colors!.join(',')
      const clash = seen.get(key)
      expect(clash, `${template.name} shares a color set with ${clash}`).toBeUndefined()
      seen.set(key, template.name)
    }
  })

  it('assigns every template to a known category', () => {
    const known = new Set<string>(TEMPLATE_CATEGORIES)
    for (const template of templates) {
      expect(template.category, `${template.name} is missing a category`).toBeDefined()
      expect(known, `${template.name}: ${template.category} is not a known category`).toContain(template.category)
    }
  })

  it('includes the Eisenhower Matrix with axes', () => {
    const matrix = templates.find((t) => t.name === 'Eisenhower Matrix')
    expect(matrix).toBeDefined()
    expect(matrix!.axisX).toBe('Urgency')
    expect(matrix!.axisY).toBe('Importance')
  })

  it('retrofits real axes onto SWOT Analysis', () => {
    const swot = templates.find((t) => t.name === 'SWOT Analysis')
    expect(swot).toBeDefined()
    expect(swot!.axisX).toBeTruthy()
    expect(swot!.axisY).toBeTruthy()
  })

  // IMPRV-011: docs/frameworks/*.md stay the source of truth for summaries;
  // these guard against drift between the docs and the in-app data.
  it('carries each doc’s one-sentence summary, verbatim (minus markup)', () => {
    for (const template of templates) {
      const doc = readFileSync(join(docsDir, `${slugOf(template.name)}.md`), 'utf8')
      const expected = docSummaryOf(doc)
      expect(expected, `${slugOf(template.name)}.md has no summary blockquote`).toBeTruthy()
      expect(template.summary, `${template.name}: summary drifted from its doc`).toBe(expected)
    }
  })

  it('maps every framework doc to a template', () => {
    const slugs = new Set(templates.map((t) => slugOf(t.name)))
    const docs = readdirSync(docsDir).filter((f) => f.endsWith('.md'))
    expect(docs.length).toBe(templates.length)
    for (const doc of docs) {
      expect(slugs, `no template matches doc ${doc}`).toContain(doc.replace(/\.md$/, ''))
    }
  })

  it('ships the full researched library plus the original presets', () => {
    const names = templates.map((t) => t.name)
    const expected = [
      'Eisenhower Matrix',
      'Impact / Effort',
      'One-Way / Two-Way Doors',
      'Risk Matrix',
      'Growth–Share Matrix',
      'Ansoff Matrix',
      'Vision × Execution',
      'Power × Interest',
      'Knowns & Unknowns',
      'Certainty × Agreement',
      'Skill × Will',
      'Johari Window',
      'Competence Ladder',
      'Passion × Proficiency',
      'Mood Meter',
      'Thayer Mood Model',
      'Affect Grid',
      'Positive × Negative Affect',
      'Dual Continuum of Mental Health',
      'Energy Quadrants',
      'Zones of Regulation',
      'Attachment Styles',
      'OK Corral',
      'Importance × Satisfaction',
      'Worry Matrix',
      'How–Now–Wow',
      'Start / Stop / Continue / Change',
      'Keep / Problem / Try / Question',
      'Love / Loathe / Learn / Leave',
      'SWOT Analysis',
      'CRR — Cooperative Reciprocal Relationships',
    ]
    for (const name of expected) {
      expect(names, `missing template: ${name}`).toContain(name)
    }
    expect(templates).toHaveLength(expected.length)
  })
})
