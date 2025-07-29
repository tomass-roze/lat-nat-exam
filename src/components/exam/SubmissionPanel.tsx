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
import { CheckCircle, AlertTriangle, Clock, Send, Info, X } from 'lucide-react'
import { SCORING_THRESHOLDS } from '@/types/constants'
import { ConfirmationDialog } from './ConfirmationDialog'
import { useValidationStatus } from '@/contexts/ValidationContext'
// compareAnthemText import removed - accuracy validation moved to final results only
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

  const validationStatus = useValidationStatus()

  // Get detailed validation status for each section
  const getDetailedValidationStatus = () => {
    const { anthemText, historyAnswers, constitutionAnswers } = testState

    // Anthem validation - simplified line-based check for submission
    const anthemIssues: string[] = []
    let anthemAccuracy = 0

    if (!anthemText || anthemText.trim().length === 0) {
      anthemIssues.push('Himnas teksts nav ievadīts')
    } else {
      // Check if all 8 lines have content (at least one letter each)
      // Filter out empty lines to handle the extra newline after 4th line
      const lines = anthemText.split('\n').filter(line => line.trim() !== '')
      const requiredLines = 8
      let emptyLineCount = 0

      // Count how many of the 8 expected lines are missing or empty
      for (let i = 0; i < requiredLines; i++) {
        const line = lines[i] || ''
        if (!/[a-zA-ZāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/.test(line)) {
          emptyLineCount++
        }
      }

      if (emptyLineCount > 0) {
        anthemIssues.push(
          `${emptyLineCount} rinda${emptyLineCount > 1 ? 's' : ''} nav aizpildīta${emptyLineCount > 1 ? 's' : ''}`
        )
      }
      // Accuracy validation removed - will be checked only in final results
    }

    // History validation
    const historyIssues: string[] = []
    const historyCount = Object.keys(historyAnswers).length
    if (historyCount < SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS) {
      historyIssues.push(
        `Trūkst ${SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS - historyCount} atbilžu`
      )
    } else {
      // Check for invalid answers
      const invalidAnswers = Object.entries(historyAnswers).filter(
        ([, answer]) => ![0, 1, 2].includes(answer)
      )
      if (invalidAnswers.length > 0) {
        historyIssues.push(`${invalidAnswers.length} nepareizas atbildes`)
      }
    }

    // Constitution validation
    const constitutionIssues: string[] = []
    const constitutionCount = Object.keys(constitutionAnswers).length
    if (constitutionCount < SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS) {
      constitutionIssues.push(
        `Trūkst ${SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS - constitutionCount} atbilžu`
      )
    } else {
      // Check for invalid answers
      const invalidAnswers = Object.entries(constitutionAnswers).filter(
        ([, answer]) => ![0, 1, 2].includes(answer)
      )
      if (invalidAnswers.length > 0) {
        constitutionIssues.push(`${invalidAnswers.length} nepareizas atbildes`)
      }
    }

    return {
      anthem: { issues: anthemIssues, accuracy: anthemAccuracy },
      history: { issues: historyIssues },
      constitution: { issues: constitutionIssues },
      isValid:
        anthemIssues.length === 0 &&
        historyIssues.length === 0 &&
        constitutionIssues.length === 0,
    }
  }

  const detailedStatus = getDetailedValidationStatus()

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

  // Updated section status based on detailed validation
  const getSectionStatus = (hasIssues: boolean, hasProgress: boolean) => {
    if (!hasIssues) return 'completed'
    if (hasProgress) return 'in-progress'
    return 'pending'
  }

  const anthemStatus = getSectionStatus(
    detailedStatus.anthem.issues.length > 0,
    anthemProgress > 0
  )
  const historyStatus = getSectionStatus(
    detailedStatus.history.issues.length > 0,
    historyAnswered > 0
  )
  const constitutionStatus = getSectionStatus(
    detailedStatus.constitution.issues.length > 0,
    constitutionAnswered > 0
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in-progress':
        return <Clock className="h-4 w-4 text-primary" />
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
      default:
        return <Badge variant="outline">Nav sākts</Badge>
    }
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

        {/* Detailed Validation Status */}
        {!detailedStatus.isValid ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Eksāmens nav gatavs iesniegšanai.</strong>
              <br />
              Lūdzu, novērsiet šādas problēmas:
              {/* Anthem issues */}
              {detailedStatus.anthem.issues.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 font-medium">
                    <X className="h-3 w-3 text-red-500" />
                    Valsts himna:
                  </div>
                  <ul className="ml-5 mt-1 text-sm space-y-1">
                    {detailedStatus.anthem.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* History issues */}
              {detailedStatus.history.issues.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 font-medium">
                    <X className="h-3 w-3 text-red-500" />
                    Vēstures jautājumi:
                  </div>
                  <ul className="ml-5 mt-1 text-sm space-y-1">
                    {detailedStatus.history.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Constitution issues */}
              {detailedStatus.constitution.issues.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 font-medium">
                    <X className="h-3 w-3 text-red-500" />
                    Konstitūcijas jautājumi:
                  </div>
                  <ul className="ml-5 mt-1 text-sm space-y-1">
                    {detailedStatus.constitution.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-100">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Eksāmens ir gatavs iesniegšanai!</strong>
              <br />
              Visas sekcijas ir pabeigtas. Precizitāte tiks novērtēta rezultātos.
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
              !detailedStatus.isValid ||
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
