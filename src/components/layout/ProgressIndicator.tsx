import { Badge } from '@/components/ui/badge'
import { CircularProgress } from '@/components/ui/circular-progress'
import { CheckCircle, Circle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SectionStatus {
  id: string
  title: string
  progress: number
  isCompleted: boolean
  isActive: boolean
  itemsCompleted: number
  totalItems: number
}

interface ProgressIndicatorProps {
  sections: SectionStatus[]
  className?: string
}

export function ProgressIndicator({
  sections,
  className,
}: ProgressIndicatorProps) {
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
        'flex items-center justify-center gap-4 sm:gap-6 flex-wrap px-2',
        className
      )}
    >
      {sections.map((section) => (
        <div
          key={section.id}
          className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0"
          role="status"
          aria-label={`${section.title}: ${Math.round(section.progress)}% pabeigts`}
        >
          <CircularProgress
            value={section.progress}
            size="sm"
            className="flex-shrink-0"
          />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {getSectionIcon(section)}
              <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                {section.title}
              </span>
            </div>
            <Badge
              variant={section.isCompleted ? 'default' : 'outline'}
              className={cn(
                'text-xs self-start flex-shrink-0',
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
  )
}
