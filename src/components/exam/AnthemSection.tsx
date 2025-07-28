import { useState, useCallback, useEffect } from 'react'
import { ExamSection } from './ExamSection'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Info, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import {
  NATIONAL_ANTHEM_TEXT,
  SCORING_THRESHOLDS,
  type AnthemResult,
  type ErrorPattern,
  type AnthemLineStats,
} from '@/types'
import { compareAnthemText } from '@/utils/textProcessing'
import {
  ValidationErrorDisplay,
  ValidationFieldStatus,
} from './ValidationErrorDisplay'
import { useSectionValidation } from '@/contexts/ValidationContext'

interface AnthemSectionProps {
  value: string
  onChange: (value: string) => void
  onNext?: () => void
}

export function AnthemSection({ value, onChange, onNext }: AnthemSectionProps) {
  const [showReference, setShowReference] = useState(false)
  const [anthemResult, setAnthemResult] = useState<AnthemResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Validation context for real-time feedback
  const sectionValidation = useSectionValidation('anthem')

  // Debounced validation function
  const validateText = useCallback((text: string) => {
    if (!text.trim()) {
      setAnthemResult(null)
      setIsValidating(false)
      return
    }

    setIsValidating(true)

    // Debounce the validation to prevent performance issues
    const timeoutId = setTimeout(() => {
      try {
        const result = compareAnthemText(text)
        setAnthemResult(result)
      } catch (error) {
        console.error('Error validating anthem text:', error)
        setAnthemResult(null)
      } finally {
        setIsValidating(false)
      }
    }, 300) // 300ms debounce delay

    return () => clearTimeout(timeoutId)
  }, [])

  // Effect to trigger validation when text changes
  useEffect(() => {
    const cleanup = validateText(value)
    return cleanup
  }, [value, validateText])

  const getProgress = () => {
    // If we have a validation result, use actual accuracy
    if (anthemResult) {
      return {
        current: anthemResult.correctCharacters,
        total: anthemResult.totalCharacters,
        percentage: anthemResult.accuracy,
        accuracy: anthemResult.accuracy,
        passed: anthemResult.passed,
      }
    }

    // Fallback to character count for initial state
    const minLength = SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS
    const currentLength = value.length
    const percentage = Math.min((currentLength / minLength) * 100, 100)

    return {
      current: currentLength,
      total: minLength,
      percentage,
      accuracy: null,
      passed: false,
    }
  }

  const progress = getProgress()
  const isCompleted = anthemResult?.passed || false
  const status = isCompleted
    ? 'completed'
    : value.length > 0
      ? 'in-progress'
      : 'pending'

  return (
    <ExamSection
      id="anthem"
      title="Valsts himna"
      description="Ierakstiet Latvijas valsts himnas tekstu. Nepieciešams sasniegt vismaz 75% precizitāti."
      status={status}
      progress={progress}
    >
      <div className="space-y-6">
        <Alert
          id="anthem-instructions"
          role="region"
          aria-labelledby="anthem-instructions-title"
        >
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span id="anthem-instructions-title" className="sr-only">
              Himnas instrukcijas
            </span>
            Ierakstiet pilnu Latvijas valsts himnas tekstu. Sistēma pārbaudīs
            jūsu ievadīto tekstu un aprēķinās precizitāti. Nepieciešams sasniegt
            vismaz 75% precizitāti, lai nokārtotu šo sekciju.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="anthem-text" className="text-base font-medium">
            Himnas teksts
          </Label>
          <Textarea
            id="anthem-text"
            placeholder="Sāciet rakstīt himnas tekstu šeit..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            className={`font-serif text-base leading-relaxed resize-none ${
              sectionValidation.showErrors &&
              sectionValidation.errors.length > 0
                ? 'border-destructive focus:border-destructive'
                : sectionValidation.showErrors && sectionValidation.isValid
                  ? 'border-green-500 focus:border-green-500'
                  : ''
            }`}
            aria-describedby="anthem-feedback anthem-instructions anthem-validation"
            aria-label="Latvijas valsts himnas teksta ievades lauks"
            aria-required="true"
            aria-invalid={
              sectionValidation.showErrors && !sectionValidation.isValid
                ? 'true'
                : 'false'
            }
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{value.length} simboli</span>
            <span>
              Nepieciešams: {SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS}+ simboli
            </span>
          </div>

          {/* Real-time validation feedback */}
          <ValidationFieldStatus
            section="anthem"
            field="anthemText"
            errors={sectionValidation.errors}
            isValidating={sectionValidation.isValidating}
            showErrors={sectionValidation.showErrors}
          />
        </div>

        {/* Real-time Accuracy Feedback */}
        {(anthemResult || isValidating) && (
          <div
            id="anthem-feedback"
            className="space-y-4"
            role="status"
            aria-live="polite"
            aria-label="Himnas precizitātes atgriezeniskā saite"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">
                  Precizitātes analīze
                </Label>
                {isValidating && (
                  <Badge variant="secondary">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Analizē...
                  </Badge>
                )}
                {anthemResult && (
                  <Badge
                    variant={anthemResult.passed ? 'default' : 'destructive'}
                    className={anthemResult.passed ? 'bg-green-600' : ''}
                  >
                    {anthemResult.accuracy.toFixed(1)}% precizitāte
                  </Badge>
                )}
              </div>

              {anthemResult && (
                <>
                  <Progress
                    value={anthemResult.accuracy}
                    className="w-full"
                    aria-label={`Himnas precizitāte: ${anthemResult.accuracy.toFixed(1)} procenti`}
                  />

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Pareizi: {anthemResult.correctCharacters}/
                      {anthemResult.totalCharacters}
                    </span>
                    <span>
                      Nepieciešams: {SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE}%
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Error Pattern Feedback */}
            {anthemResult?.analysis?.errorPatterns &&
              anthemResult.analysis.errorPatterns.length > 0 && (
                <Alert role="region" aria-labelledby="error-patterns-title">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong id="error-patterns-title">
                      Atrasti uzlabojumi:
                    </strong>
                    <ul className="mt-2 space-y-1">
                      {anthemResult.analysis.errorPatterns
                        .slice(0, 3)
                        .map((pattern: ErrorPattern, index: number) => (
                          <li key={index} className="text-sm">
                            • {pattern.suggestion} ({pattern.count} gadījumi)
                          </li>
                        ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

            {/* Line-by-line Analysis */}
            {anthemResult?.analysis?.lineStats &&
              anthemResult.analysis.lineStats.length > 0 && (
                <div
                  className="space-y-2"
                  role="region"
                  aria-labelledby="line-analysis-title"
                >
                  <Label
                    id="line-analysis-title"
                    className="text-sm font-medium"
                  >
                    Rindas analīze
                  </Label>
                  <div className="grid gap-2" role="list">
                    {anthemResult.analysis.lineStats.map(
                      (lineStat: AnthemLineStats, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded text-sm"
                          role="listitem"
                          aria-label={`Rinda ${lineStat.lineNumber}: ${lineStat.accuracy.toFixed(0)}% precizitāte, ${lineStat.passed ? 'nokārtota' : 'nenokārtota'}`}
                        >
                          <span>Rinda {lineStat.lineNumber}</span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                lineStat.passed ? 'default' : 'secondary'
                              }
                              className={
                                lineStat.passed
                                  ? 'bg-green-600'
                                  : 'bg-orange-500'
                              }
                            >
                              {lineStat.accuracy.toFixed(0)}%
                            </Badge>
                            {lineStat.passed && (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Comprehensive validation feedback */}
        <ValidationErrorDisplay
          section="anthem"
          errors={sectionValidation.errors}
          showErrors={sectionValidation.showErrors}
          isValidating={sectionValidation.isValidating}
          className="mt-4"
        />

        {isCompleted && sectionValidation.isValid && (
          <Alert
            className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-100"
            role="alert"
            aria-live="assertive"
            aria-labelledby="completion-message"
          >
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong id="completion-message">Apsveicam!</strong> Jūs esat
              nokārtojuši himnas sekciju. Varat pāriet uz nākamo sekciju.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setShowReference(!showReference)}
            className="flex-1"
          >
            {showReference ? 'Paslēpt' : 'Rādīt'} etalona tekstu
          </Button>
          {isCompleted && sectionValidation.isValid && onNext && (
            <Button onClick={onNext} className="flex-1">
              Turpināt uz vēstures jautājumiem
            </Button>
          )}
        </div>

        {showReference && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Etalona teksts (tikai atsaucei):</strong>
              <pre className="mt-2 font-serif text-sm whitespace-pre-wrap leading-relaxed">
                {NATIONAL_ANTHEM_TEXT}
              </pre>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </ExamSection>
  )
}
