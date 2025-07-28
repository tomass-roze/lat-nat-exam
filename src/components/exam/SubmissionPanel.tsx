import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, Clock, Send, Info } from 'lucide-react'
import { SCORING_THRESHOLDS } from '@/types/constants'
import { ConfirmationDialog } from './ConfirmationDialog'
import {
  useValidation,
  useValidationStatus,
} from '@/contexts/ValidationContext'
import type { TestState } from '@/types/exam'

interface SubmissionPanelProps {
  anthemProgress: number
  historyAnswered: number
  constitutionAnswered: number
  testState: TestState
  onSubmit: () => void
  className?: string
}

export function SubmissionPanel({
  anthemProgress,
  historyAnswered,
  constitutionAnswered,
  testState,
  onSubmit,
  className,
}: SubmissionPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const { getSectionErrors } = useValidation()
  const validationStatus = useValidationStatus()

  const handleSubmitClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setIsSubmitting(false)
      setShowConfirmDialog(false)
    }
  }

  const getSectionStatus = (
    current: number,
    required: number,
    section: 'anthem' | 'history' | 'constitution',
    type: 'count' | 'percentage' = 'count'
  ) => {
    // Check for validation errors first
    const sectionErrors = getSectionErrors(section)
    if (sectionErrors.length > 0) {
      return 'error'
    }

    if (type === 'percentage') {
      return current >= required
        ? 'completed'
        : current > 0
          ? 'in-progress'
          : 'pending'
    }
    return current >= required
      ? 'completed'
      : current > 0
        ? 'in-progress'
        : 'pending'
  }

  const anthemStatus = getSectionStatus(
    anthemProgress,
    SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE,
    'anthem',
    'percentage'
  )
  const historyStatus = getSectionStatus(
    historyAnswered,
    SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS,
    'history'
  )
  const constitutionStatus = getSectionStatus(
    constitutionAnswered,
    SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS,
    'constitution'
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in-progress':
        return <Clock className="h-4 w-4 text-primary" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Pabeigts</Badge>
        )
      case 'in-progress':
        return <Badge>Daļēji</Badge>
      case 'error':
        return <Badge variant="destructive">Kļūda</Badge>
      default:
        return <Badge variant="outline">Nav sākts</Badge>
    }
  }

  // Get detailed section errors for display
  const getSectionErrorDetails = (
    section: 'anthem' | 'history' | 'constitution'
  ) => {
    const errors = getSectionErrors(section)
    return errors.map((error) => error.message)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Eksāmena iesniedzana
        </CardTitle>
        <CardDescription>
          Pārbaudiet savu progresu un iesniedziet eksāmenu, kad esat pabeiguši
          visas sekcijas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="space-y-4">
          <h4 className="font-medium">Sekciju statuss</h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {getStatusIcon(anthemStatus)}
                <span className="font-medium">Valsts himna</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {Math.round(anthemProgress)}%
                </span>
                {getStatusBadge(anthemStatus)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {getStatusIcon(historyStatus)}
                <span className="font-medium">Vēstures jautājumi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {historyAnswered}/{SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS}
                </span>
                {getStatusBadge(historyStatus)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {getStatusIcon(constitutionStatus)}
                <span className="font-medium">Konstitūcijas jautājumi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {constitutionAnswered}/
                  {SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS}
                </span>
                {getStatusBadge(constitutionStatus)}
              </div>
            </div>
          </div>
        </div>

        {/* Section Error Details */}
        {validationStatus.showErrors && validationStatus.errorCount > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-destructive">
              Problēmas, kas jānovērš:
            </h4>

            {getSectionErrorDetails('anthem').length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Himnas sekcija:</strong>
                  <ul className="mt-1 space-y-1">
                    {getSectionErrorDetails('anthem').map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {getSectionErrorDetails('history').length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Vēstures sekcija:</strong>
                  <ul className="mt-1 space-y-1">
                    {getSectionErrorDetails('history').map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {getSectionErrorDetails('constitution').length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Konstitūcijas sekcija:</strong>
                  <ul className="mt-1 space-y-1">
                    {getSectionErrorDetails('constitution').map(
                      (error, index) => (
                        <li key={index}>• {error}</li>
                      )
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Submission Status */}
        {!validationStatus.isSubmissionReady ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Eksāmens nav gatavs iesniegšanai.</strong>
              <br />
              {validationStatus.errorCount > 0 ? (
                <>
                  Nepieciešams novērst {validationStatus.errorCount} problēmu
                  pirms iesniegšanas.
                  {!validationStatus.showErrors && (
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal underline"
                      onClick={() => validationStatus.setShowErrors?.(true)}
                    >
                      Rādīt detaļas
                    </Button>
                  )}
                </>
              ) : (
                'Lūdzu, pabeidziet visas sekcijas pirms eksāmena iesniegšanas.'
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-100">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Eksāmens ir gatavs iesniegšanai!</strong>
              <br />
              Visas sekcijas ir pareizi aizpildītas un atbilst prasībām.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Status Info */}
        {validationStatus.isValidating && (
          <Alert>
            <Clock className="h-4 w-4 animate-spin" />
            <AlertDescription>Notiek formas validācija...</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitClick}
            disabled={
              !validationStatus.isSubmissionReady ||
              isSubmitting ||
              validationStatus.isValidating
            }
            size="lg"
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Iesniedz...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Iesniegt eksāmenu
              </>
            )}
          </Button>
        </div>

        {/* Important Notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Svarīga informācija:</strong> Pēc eksāmena iesniegšanas jūs
            nevarēsiet veikt izmaiņas atbildēs. Lūdzu, rūpīgi pārbaudiet visas
            atbildes pirms iesniegšanas.
          </AlertDescription>
        </Alert>
      </CardContent>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onSubmit={handleConfirmSubmit}
        testState={testState}
        isSubmitting={isSubmitting}
      />
    </Card>
  )
}
