import type { ElementType, ReactNode } from 'react'

interface PageTitleProps {
  as?: ElementType
  children: ReactNode
}

export default function PageTitle({ as: Tag = 'h1', children }: PageTitleProps) {
  return <Tag className="text-xl font-semibold text-text">{children}</Tag>
}
