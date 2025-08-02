import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ExamHeaderProps {
  title?: string
  subtitle?: string
  partialTestIndicator?: ReactNode
  children?: ReactNode
  className?: string
}

export function ExamHeader({
  title = 'Latvijas Pilsonības Naturalizācijas Eksāmens',
  subtitle = 'Prakses eksāmens pilsonības iegūšanai',
  partialTestIndicator,
  children,
  className,
}: ExamHeaderProps) {
  return (
    <header role="banner" className={className}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-2 max-w-2xl mx-auto">
            {subtitle}
          </p>
          {partialTestIndicator && (
            <div className="mb-4">{partialTestIndicator}</div>
          )}
          {children && (
            <div
              className="flex justify-center overflow-x-auto pb-2"
              role="region"
              aria-label="Eksāmena progress"
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
