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
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-muted text-muted-foreground'
      case 'in-progress':
        return 'bg-primary hover:bg-primary/90 text-primary-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Pabeigts'
      case 'in-progress':
        return 'Aktīvs'
      default:
        return 'Gaida'
    }
  }

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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle id={`${id}-title`} className="text-xl md:text-2xl">
                {title}
              </CardTitle>
              {description && (
                <CardDescription id={`${id}-description`} className="mt-2">
                  {description}
                </CardDescription>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                className={getStatusColor()}
                aria-label={`Sekcijas statuss: ${getStatusText()}`}
              >
                {getStatusText()}
              </Badge>
              {progress && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  aria-label={`Progress: ${progress.current} no ${progress.total}, ${Math.round(progress.percentage)} procenti`}
                >
                  {progress.current}/{progress.total} (
                  {Math.round(progress.percentage)}%)
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  )
}
