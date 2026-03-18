import { describe, it, expect } from 'vitest'
import { templates } from '../templates'

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

  it('includes the Urgent-Important Matrix with axes', () => {
    const matrix = templates.find((t) => t.name === 'Urgent-Important Matrix')
    expect(matrix).toBeDefined()
    expect(matrix!.axisX).toBe('Urgency')
    expect(matrix!.axisY).toBe('Importance')
  })
})
