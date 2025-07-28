import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ExamHeaderProps {
  title?: string
  subtitle?: string
  children?: ReactNode
  className?: string
}

export function ExamHeader({
  title = 'Latvijas Pilsonības Naturalizācijas Eksāmens',
  subtitle = 'Prakses eksāmens pilsonības iegūšanai',
  children,
  className,
}: ExamHeaderProps) {
  return (
    <header
      role="banner"
      className={cn(
        'sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border',
        className
      )}
    >
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {title}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-4">
            {subtitle}
          </p>
          {children && (
            <div
              className="flex justify-center"
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
