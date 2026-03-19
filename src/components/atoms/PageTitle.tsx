import type { ElementType, ReactNode } from 'react'

interface PageTitleProps {
  as?: ElementType
  className?: string
  children: ReactNode
}

export default function PageTitle({ as: Tag = 'h1', className, children }: PageTitleProps) {
  return <Tag className={className ?? 'text-xl font-semibold text-text'}>{children}</Tag>
}
