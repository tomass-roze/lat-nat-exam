import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
  className?: string
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">{children}</div>
    </div>
  )
}
