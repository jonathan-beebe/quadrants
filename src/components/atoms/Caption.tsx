import type { ReactNode } from 'react'

interface CaptionProps {
  children: ReactNode
  className?: string
}

export default function Caption({ children, className = '' }: CaptionProps) {
  return (
    <span className={`text-xs text-text-tertiary ${className}`.trim()}>
      {children}
    </span>
  )
}
