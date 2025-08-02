import { Progress } from '@/components/ui/progress'
import { CircularProgress } from '@/components/ui/circular-progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SectionStatus } from './ProgressIndicator'

interface BottomProgressBarProps {
  sections: SectionStatus[]
  overallProgress: number
  enabledSections?: {
    anthem: boolean
    history: boolean
    constitution: boolean
  }
  className?: string
}

export function BottomProgressBar({
  sections,
  overallProgress,
  enabledSections,
  className,
}: BottomProgressBarProps) {
  // Filter sections if enabledSections is provided
  const filteredSections = enabledSections
    ? sections.filter((section) => {
        const sectionId = section.id as keyof typeof enabledSections
        return enabledSections[sectionId]
      })
    : sections

  const getSectionIcon = (section: SectionStatus) => {
    if (section.isCompleted) {
      return <CheckCircle className="h-3 w-3 text-green-500" />
    }
    if (section.isActive) {
      return <Clock className="h-3 w-3 text-primary" />
    }
    return <Circle className="h-3 w-3 text-muted-foreground" />
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border safe-area-inset-bottom',
        className
      )}
      role="region"
      aria-label="Eksāmena progress"
    >
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 max-w-6xl">
        {/* Overall Progress */}
        <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
          <span className="text-xs sm:text-sm font-medium text-foreground min-w-fit">
            Kopējais progress
          </span>
          <Progress
            value={overallProgress}
            className="h-1.5 sm:h-2 flex-1"
            aria-label={`Kopējais progress: ${Math.round(overallProgress)} procenti`}
          />
          <span className="text-xs sm:text-sm text-muted-foreground min-w-fit text-right">
            {Math.round(overallProgress)}%
          </span>
        </div>

        {/* Section Progress */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap overflow-x-auto pb-2 sm:pb-0">
          {filteredSections.map((section) => (
            <div
              key={section.id}
              className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink-0"
              role="status"
              aria-label={`${section.title}: ${Math.round(section.progress)}% pabeigts`}
            >
              <CircularProgress
                value={section.progress}
                size="sm"
                className="flex-shrink-0"
              />
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {getSectionIcon(section)}
                <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                  {section.title}
                </span>
                <Badge
                  variant={section.isCompleted ? 'default' : 'outline'}
                  className={cn(
                    'text-xs flex-shrink-0',
                    section.isCompleted &&
                      'bg-green-500 hover:bg-green-600 text-white'
                  )}
                >
                  {section.itemsCompleted}/{section.totalItems}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
