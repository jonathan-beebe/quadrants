import type { ReactNode } from 'react'

interface SectionLabelProps {
  children: ReactNode
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return <h3 className="text-sm font-medium text-text-secondary mb-3">{children}</h3>
}
