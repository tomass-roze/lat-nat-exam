import { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ExamSectionProps {
  id: string
  title: string
  description?: string
  children: ReactNode
  status?: 'pending' | 'in-progress' | 'completed'
  progress?: {
    current: number
    total: number
    percentage: number
  }
  className?: string
}

export function ExamSection({
  id,
  title,
  description,
  children,
  status = 'pending',
  progress,
  className,
}: ExamSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-4', // Account for non-sticky header
        className
      )}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <Card
        className={cn(
          'transition-all duration-200',
          status === 'in-progress' && 'border-primary shadow-md'
        )}
      >
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle
                id={`${id}-title`}
                className="text-lg sm:text-xl md:text-2xl leading-tight"
              >
                {title}
              </CardTitle>
              {description && (
                <CardDescription
                  id={`${id}-description`}
                  className="mt-1 sm:mt-2 text-sm sm:text-base"
                >
                  {description}
                </CardDescription>
              )}
            </div>
            {progress && (
              <Badge
                variant="outline"
                className="text-xs flex-shrink-0 self-start sm:self-center"
                aria-label={`Progress: ${progress.current} no ${progress.total}, ${Math.round(progress.percentage)} procenti`}
              >
                {progress.current}/{progress.total} (
                {Math.round(progress.percentage)}%)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </section>
  )
}
