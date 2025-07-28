/**
 * @fileoverview Reusable validation error display component
 *
 * Provides accessible, user-friendly display of validation errors with
 * proper ARIA labeling and clear visual hierarchy.
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'
import type { ValidationError } from '@/types/validation'
import type { ExamSection } from '@/types/constants'

interface ValidationErrorDisplayProps {
  /** Section being validated */
  section: ExamSection
  /** Validation errors to display */
  errors: ValidationError[]
  /** Whether to show errors immediately */
  showErrors: boolean
  /** Whether validation is in progress */
  isValidating?: boolean
  /** Additional CSS classes */
  className?: string
  /** Compact display mode */
  compact?: boolean
}

/**
 * Display validation errors in an accessible format
 */
export function ValidationErrorDisplay({
  section,
  errors,
  showErrors,
  isValidating = false,
  className = '',
  compact = false,
}: ValidationErrorDisplayProps) {
  // Don't render if no errors and not validating
  if (!showErrors && !isValidating) {
    return null
  }

  // Don't render if no errors to show
  if (!isValidating && errors.length === 0) {
    return null
  }

  // Section titles for display
  const sectionTitles = {
    anthem: 'Himnas sekcija',
    history: 'Vēstures sekcija',
    constitution: 'Konstitūcijas sekcija',
  } as const

  const sectionTitle =
    sectionTitles[section as keyof typeof sectionTitles] || section

  // Compact mode for inline display
  if (compact) {
    return (
      <div
        className={`${className}`}
        role="alert"
        aria-live="polite"
        aria-label={`${sectionTitle} validācijas rezultāti`}
      >
        {isValidating ? (
          <Badge variant="secondary" className="animate-pulse">
            <Info className="h-3 w-3 mr-1" />
            Validē...
          </Badge>
        ) : errors.length > 0 ? (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {errors.length} problēma{errors.length > 1 ? 's' : ''}
          </Badge>
        ) : (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Derīgs
          </Badge>
        )}
      </div>
    )
  }

  // Full error display
  return (
    <div
      className={`space-y-2 ${className}`}
      role="region"
      aria-labelledby={`${section}-validation-title`}
    >
      {isValidating && (
        <Alert>
          <Info className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            <span id={`${section}-validation-title`} className="font-medium">
              Notiek validācija...
            </span>
          </AlertDescription>
        </Alert>
      )}

      {showErrors && errors.length > 0 && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium" id={`${section}-validation-title`}>
                {sectionTitle} - {errors.length} problēma
                {errors.length > 1 ? 's' : ''}:
              </div>
              <ul
                className="space-y-1 text-sm"
                aria-labelledby={`${section}-validation-title`}
              >
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <div className="flex-1">
                      <span>{error.message}</span>
                      {error.suggestion && (
                        <div className="mt-1 text-xs text-muted-foreground bg-muted p-2 rounded">
                          <strong>Ieteikums:</strong> {error.suggestion}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {showErrors && errors.length === 0 && !isValidating && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-100">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">
              {sectionTitle} ir pareizi aizpildīta
            </span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * Inline validation status indicator for form fields
 */
export function ValidationFieldStatus({
  field,
  errors,
  isValidating,
  showErrors,
}: {
  section: ExamSection
  field: string
  errors: ValidationError[]
  isValidating: boolean
  showErrors: boolean
}) {
  const fieldErrors = errors.filter((error) => error.field === field)

  if (!showErrors && !isValidating) {
    return null
  }

  return (
    <div
      className="mt-1"
      role="status"
      aria-live="polite"
      aria-label={`${field} validācijas statuss`}
    >
      {isValidating ? (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Info className="h-3 w-3 animate-pulse" />
          <span>Validē...</span>
        </div>
      ) : fieldErrors.length > 0 ? (
        <div className="space-y-1">
          {fieldErrors.map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-1 text-sm text-destructive"
              role="alert"
            >
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          ))}
        </div>
      ) : showErrors ? (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span>Derīgs</span>
        </div>
      ) : null}
    </div>
  )
}
