import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import DesignSystem from '../components/DesignSystem'

describe('DesignSystem icon gallery (A11Y-020)', () => {
  it('names every gallery svg through an image role, with no half-exposed svgs', () => {
    const { container } = render(<DesignSystem themeMode="system" isDark={false} onCycleTheme={() => {}} />)

    const svgs = Array.from(container.querySelectorAll('svg'))
    expect(svgs.length).toBeGreaterThan(0)

    // No svg may carry an accessible-name attribute AT can ignore (a label
    // without an image role), and the discouraged aria-hidden="false"
    // literal must not appear anywhere.
    for (const svg of svgs) {
      expect(svg.getAttribute('aria-hidden')).not.toBe('false')
      if (svg.hasAttribute('aria-label')) {
        expect(svg.getAttribute('role')).toBe('img')
        expect(svg.getAttribute('aria-label')).toBeTruthy()
        expect(svg.getAttribute('aria-hidden')).toBeNull()
      }
    }

    // The gallery itself exposes named image-role icons.
    const named = svgs.filter((svg) => svg.getAttribute('role') === 'img')
    expect(named.length).toBeGreaterThan(0)
  })
})
