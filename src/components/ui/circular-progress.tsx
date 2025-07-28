import { cn } from '@/lib/utils'

export interface CircularProgressProps {
  value: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
  children?: React.ReactNode
}

const sizeMap = {
  sm: { dimension: 32, fontSize: 'text-xs' },
  md: { dimension: 48, fontSize: 'text-sm' },
  lg: { dimension: 64, fontSize: 'text-base' },
}

export function CircularProgress({
  value,
  size = 'md',
  strokeWidth,
  className,
  showPercentage = false,
  children,
}: CircularProgressProps) {
  const { dimension, fontSize } = sizeMap[size]
  const radius = dimension / 2 - (strokeWidth ?? 3)
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${Math.round(value)}%`}
    >
      <svg
        width={dimension}
        height={dimension}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth ?? 3}
          fill="none"
          className="text-muted-foreground/20"
        />
        {/* Progress circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth ?? 3}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-300 ease-in-out',
            value >= 100 ? 'text-green-500' : 'text-primary'
          )}
        />
      </svg>
      {(showPercentage || children) && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            fontSize,
            'font-medium text-foreground'
          )}
        >
          {children || `${Math.round(value)}%`}
        </div>
      )}
    </div>
  )
}
