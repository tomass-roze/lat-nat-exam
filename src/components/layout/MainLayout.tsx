import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SkipNavigation } from './SkipNavigation'

interface MainLayoutProps {
  children: ReactNode
  className?: string
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <SkipNavigation />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <main id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
