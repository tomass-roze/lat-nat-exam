import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  overallProgress: number
  className?: string
}

export function ProgressIndicator({
  sections,
  overallProgress,
  className,
}: ProgressIndicatorProps) {
  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">
            Kopējais progress
          </h3>
          <span className="text-sm text-muted-foreground">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Section Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className={cn(
              'p-4 rounded-lg border',
              section.isActive && 'border-primary bg-primary/5',
              section.isCompleted &&
                'border-green-500 bg-green-50 dark:bg-green-950',
              !section.isActive && !section.isCompleted && 'border-border'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {section.isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : section.isActive ? (
                <Clock className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <h4 className="text-sm font-medium">{section.title}</h4>
            </div>

            <div className="space-y-2">
              <Progress value={section.progress} className="h-1.5" />
              <div className="flex items-center justify-between">
                <Badge
                  variant={section.isCompleted ? 'default' : 'outline'}
                  className={cn(
                    'text-xs',
                    section.isCompleted && 'bg-green-500 hover:bg-green-600'
                  )}
                >
                  {section.itemsCompleted}/{section.totalItems}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round(section.progress)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
