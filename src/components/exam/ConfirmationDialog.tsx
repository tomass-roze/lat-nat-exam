/**
 * @fileoverview Confirmation dialog for exam submission
 *
 * Provides comprehensive submission confirmation with validation summary,
 * section completion status, and final submission prevention checks.
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FocusTrap } from '@/components/accessibility/FocusTrap'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  HelpCircle,
  Users,
  BookOpen,
  Send,
  X,
} from 'lucide-react'
import type { TestState } from '@/types/exam'
import type { ValidationResult } from '@/types/validation'
import { SCORING_THRESHOLDS } from '@/types/constants'
import {
  validateTestState,
  getValidationStatusMessage,
} from '@/utils/validation'
import { compareAnthemText } from '@/utils/textProcessing'

interface ConfirmationDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Close dialog callback */
  onClose: () => void
  /** Submit exam callback */
  onSubmit: () => void
  /** Current test state */
  testState: TestState
  /** Whether submission is in progress */
  isSubmitting?: boolean
}

interface SectionSummary {
  id: string
  title: string
  icon: React.ReactNode
  status: 'completed' | 'incomplete' | 'error'
  details: string
  progress: number
  errors: string[]
}

export function ConfirmationDialog({
  open,
  onClose,
  onSubmit,
  testState,
  isSubmitting = false,
}: ConfirmationDialogProps) {
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Perform final validation when dialog opens
  useEffect(() => {
    if (open && !validationResult) {
      setIsValidating(true)
      try {
        const result = validateTestState(testState)
        setValidationResult(result)
      } catch (error) {
        console.error('Final validation failed:', error)
      } finally {
        setIsValidating(false)
      }
    }
  }, [open, testState, validationResult])

  // Reset validation when dialog closes
  useEffect(() => {
    if (!open) {
      setValidationResult(null)
    }
  }, [open])

  // Calculate section summaries
  const getSectionSummaries = (): SectionSummary[] => {
    const summaries: SectionSummary[] = []

    // Anthem section
    const anthemErrors = validationResult?.fieldResults.anthemText?.errors || []
    let anthemProgress = 0
    let anthemStatus: 'completed' | 'incomplete' | 'error' = 'incomplete'
    let anthemDetails = 'Nav pabeigts'

    if (
      testState.anthemText.length >= SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS
    ) {
      try {
        const anthemResult = compareAnthemText(testState.anthemText)
        anthemProgress = anthemResult.accuracy

        if (anthemResult.passed) {
          anthemStatus = 'completed'
          anthemDetails = `${anthemResult.accuracy.toFixed(1)}% precizitāte - Nokārtots`
        } else {
          anthemStatus = 'error'
          anthemDetails = `${anthemResult.accuracy.toFixed(1)}% precizitāte - Nepieciešams ${SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE}%`
        }
      } catch {
        anthemStatus = 'error'
        anthemDetails = 'Neizdevās analizēt tekstu'
      }
    } else {
      anthemDetails = `${testState.anthemText.length}/${SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS} simboli`
    }

    summaries.push({
      id: 'anthem',
      title: 'Valsts himna',
      icon: <FileText className="h-4 w-4" />,
      status: anthemStatus,
      details: anthemDetails,
      progress: anthemProgress,
      errors: anthemErrors.map((e) => e.message),
    })

    // History section
    const historyAnswered = Object.keys(testState.historyAnswers).length
    const historyTotal = SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS
    const historyProgress = (historyAnswered / historyTotal) * 100
    const historyErrors =
      validationResult?.fieldResults.historyAnswers?.errors || []

    summaries.push({
      id: 'history',
      title: 'Vēstures jautājumi',
      icon: <BookOpen className="h-4 w-4" />,
      status: historyAnswered === historyTotal ? 'completed' : 'incomplete',
      details: `${historyAnswered}/${historyTotal} jautājumi atbildēti`,
      progress: historyProgress,
      errors: historyErrors.map((e) => e.message),
    })

    // Constitution section
    const constitutionAnswered = Object.keys(
      testState.constitutionAnswers
    ).length
    const constitutionTotal = SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS
    const constitutionProgress =
      (constitutionAnswered / constitutionTotal) * 100
    const constitutionErrors =
      validationResult?.fieldResults.constitutionAnswers?.errors || []

    summaries.push({
      id: 'constitution',
      title: 'Konstitūcijas jautājumi',
      icon: <Users className="h-4 w-4" />,
      status:
        constitutionAnswered === constitutionTotal ? 'completed' : 'incomplete',
      details: `${constitutionAnswered}/${constitutionTotal} jautājumi atbildēti`,
      progress: constitutionProgress,
      errors: constitutionErrors.map((e) => e.message),
    })

    return summaries
  }

  const sectionSummaries = getSectionSummaries()
  const overallProgress =
    sectionSummaries.reduce((sum, section) => sum + section.progress, 0) / 3
  const hasErrors = sectionSummaries.some(
    (section) => section.status === 'error' || section.errors.length > 0
  )
  const canSubmit =
    validationResult?.isSubmissionReady && !hasErrors && !isValidating

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Pabeigts</Badge>
        )
      case 'error':
        return <Badge variant="destructive">Kļūda</Badge>
      default:
        return <Badge variant="outline">Nav pabeigts</Badge>
    }
  }

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="dialog-description"
      >
        <FocusTrap
          active={open}
          onDeactivate={onClose}
          focusTrapOptions={{
            initialFocus: '[data-focus-first]',
            escapeDeactivates: true,
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Eksāmena iesniegšana
            </DialogTitle>
            <DialogDescription id="dialog-description">
              Pārbaudiet savu progresu un apstipriniet eksāmena iesniegšanu. Pēc
              iesniegšanas nevarēsiet veikt izmaiņas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Kopējais progress</h4>
                <span className="text-sm text-muted-foreground">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />

              {validationResult && (
                <p className="text-sm text-muted-foreground">
                  {getValidationStatusMessage(validationResult)}
                </p>
              )}
            </div>

            {/* Section Status */}
            <div className="space-y-4">
              <h4 className="font-medium">Sekciju statuss</h4>

              {isValidating ? (
                <div className="flex items-center gap-2 p-4 rounded-lg border">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Veic galīgo validāciju...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {sectionSummaries.map((section) => (
                    <div
                      key={section.id}
                      className="p-4 rounded-lg border space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(section.status)}
                          {section.icon}
                          <span className="font-medium">{section.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(section.status)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {section.details}
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round(section.progress)}%
                          </span>
                        </div>
                        <Progress value={section.progress} className="h-2" />
                      </div>

                      {/* Section errors */}
                      {section.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <ul className="space-y-1">
                              {section.errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Global validation errors */}
            {validationResult?.globalErrors &&
              validationResult.globalErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Globālas kļūdas:</strong>
                    <ul className="mt-2 space-y-1">
                      {validationResult.globalErrors.map((error, index) => (
                        <li key={index}>• {error.message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

            {/* Submission status */}
            {!isValidating && (
              <>
                {canSubmit ? (
                  <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-100">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Eksāmens ir gatavs iesniegšanai!</strong>
                      <br />
                      Visas sekcijas ir pareizi aizpildītas un atbilst prasībām.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Eksāmens nav gatavs iesniegšanai.</strong>
                      <br />
                      Lūdzu, novērsiet visas problēmas pirms eksāmena
                      iesniegšanas.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Important notice */}
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Svarīga informācija:</strong>
                <br />
                Pēc eksāmena iesniegšanas nevarēsiet veikt izmaiņas atbildēs.
                Lūdzu, rūpīgi pārbaudiet visas atbildes pirms iesniegšanas.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              data-focus-first
            >
              <X className="h-4 w-4 mr-2" />
              Atcelt
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting || isValidating}
              className="min-w-32"
              aria-describedby={
                !canSubmit ? 'submit-disabled-reason' : undefined
              }
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
            {!canSubmit && (
              <div id="submit-disabled-reason" className="sr-only">
                Eksāmens nav gatavs iesniegšanai. Novērsiet visas problēmas.
              </div>
            )}
          </DialogFooter>
        </FocusTrap>
      </DialogContent>
    </Dialog>
  )
}
