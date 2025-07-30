/**
 * @fileoverview Confirmation dialog for exam submission
 * 
 * NOTE: This component is no longer used in the main submission flow as of issue #48.
 * Direct submission is now implemented in SubmissionPanel.tsx with loading screen feedback.
 * This file is kept for potential future use or reference.
 *
 * Previously provided comprehensive submission confirmation with validation summary,
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
// import { FocusTrap } from '@/components/accessibility/FocusTrap' // Temporarily removed for debugging
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
import {
  debugLogger,
  logValidationStart,
  logValidationSuccess,
  logValidationError,
  logDialogOpen,
  logDialogClose,
  reportError,
} from '@/utils/debugUtils'

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

interface ValidationErrorState {
  hasError: boolean
  errorMessage: string
  retryAttempts: number
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
  const [validationError, setValidationError] = useState<ValidationErrorState>({
    hasError: false,
    errorMessage: '',
    retryAttempts: 0,
  })

  // Perform final validation when dialog opens
  useEffect(() => {
    debugLogger.debug('validation', 'Validation effect triggered', {
      open,
      hasValidationResult: !!validationResult,
      hasValidationError: validationError.hasError,
    })

    if (open && !validationResult && !validationError.hasError) {
      logDialogOpen('ConfirmationDialog')
      logValidationStart(testState, 'dialog-open')

      setIsValidating(true)
      setValidationError({
        hasError: false,
        errorMessage: '',
        retryAttempts: 0,
      })

      const performValidation = async () => {
        try {
          debugLogger.debug(
            'validation',
            'Starting validation with timeout protection'
          )

          // Add timeout to prevent hanging validation
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error('Validation timeout after 5 seconds')),
              5000
            )
          })

          const validationPromise = Promise.resolve(
            validateTestState(testState)
          )

          const result = await Promise.race([validationPromise, timeoutPromise])

          logValidationSuccess(result)
          setValidationResult(result)
          setValidationError({
            hasError: false,
            errorMessage: '',
            retryAttempts: 0,
          })

          debugLogger.info('validation', 'Validation completed successfully', {
            isSubmissionReady: result.isSubmissionReady,
            hasErrors: result.summary.errorCount > 0,
          })
        } catch (error) {
          const caughtError =
            error instanceof Error
              ? error
              : new Error('Unknown validation error')

          logValidationError(caughtError, testState)
          reportError(caughtError, 'ConfirmationDialog validation', {
            currentRetryAttempts: validationError.retryAttempts,
            testStateSize: {
              anthem: testState.anthemText.length,
              history: Object.keys(testState.historyAnswers).length,
              constitution: Object.keys(testState.constitutionAnswers).length,
            },
          })

          const errorMessage = caughtError.message

          setValidationError({
            hasError: true,
            errorMessage,
            retryAttempts: validationError.retryAttempts + 1,
          })

          debugLogger.warn(
            'validation',
            'Creating fallback validation result due to error'
          )
          // Create fallback validation result to prevent dialog from breaking
          setValidationResult(createFallbackValidationResult(testState))
        } finally {
          setIsValidating(false)
        }
      }

      performValidation()
    }
  }, [open, testState, validationResult, validationError.hasError])

  // Reset validation when dialog closes
  useEffect(() => {
    if (!open) {
      logDialogClose('ConfirmationDialog')
      debugLogger.debug(
        'validation',
        'Resetting validation state on dialog close'
      )
      setValidationResult(null)
      setValidationError({
        hasError: false,
        errorMessage: '',
        retryAttempts: 0,
      })
    }
  }, [open])

  // Create fallback validation result for error scenarios
  const createFallbackValidationResult = (
    testState: TestState
  ): ValidationResult => {
    const now = Date.now()

    // Basic validation checks that are unlikely to fail
    const anthemHasContent = Boolean(
      testState.anthemText && testState.anthemText.trim().length > 0
    )
    const historyCount = Object.keys(testState.historyAnswers).length
    const constitutionCount = Object.keys(testState.constitutionAnswers).length

    const hasMinimumContent =
      anthemHasContent &&
      historyCount >= SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS &&
      constitutionCount >= SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS

    return {
      isValid: hasMinimumContent,
      isSubmissionReady: hasMinimumContent,
      fieldResults: {
        anthemText: {
          field: 'anthemText',
          isValid: anthemHasContent,
          errors: anthemHasContent
            ? []
            : [
                {
                  code: 'REQUIRED_FIELD' as const,
                  message: 'Himnas teksts ir nepieciešams',
                  severity: 'error' as const,
                  field: 'anthemText',
                },
              ],
          warnings: [],
          info: [],
          validatedAt: now,
        },
        historyAnswers: {
          field: 'historyAnswers',
          isValid: historyCount >= SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS,
          errors:
            historyCount >= SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS
              ? []
              : [
                  {
                    code: 'REQUIRED_FIELD' as const,
                    message: `Nepieciešams atbildēt uz visiem ${SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS} vēstures jautājumiem`,
                    severity: 'error' as const,
                    field: 'historyAnswers',
                  },
                ],
          warnings: [],
          info: [],
          validatedAt: now,
        },
        constitutionAnswers: {
          field: 'constitutionAnswers',
          isValid:
            constitutionCount >=
            SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS,
          errors:
            constitutionCount >= SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS
              ? []
              : [
                  {
                    code: 'REQUIRED_FIELD' as const,
                    message: `Nepieciešams atbildēt uz visiem ${SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS} konstitūcijas jautājumiem`,
                    severity: 'error' as const,
                    field: 'constitutionAnswers',
                  },
                ],
          warnings: [],
          info: [],
          validatedAt: now,
        },
      },
      globalErrors: validationError.hasError
        ? [
            {
              code: 'MALFORMED_DATA' as const,
              message: `Validācijas kļūda: ${validationError.errorMessage}`,
              severity: 'error' as const,
              field: 'global',
            },
          ]
        : [],
      summary: {
        errorCount: hasMinimumContent ? 0 : 1,
        warningCount: validationError.hasError ? 1 : 0,
        infoCount: 0,
        errorsBySeverity: {
          error: hasMinimumContent ? 0 : 1,
          warning: validationError.hasError ? 1 : 0,
          info: 0,
        },
        completionPercentage: hasMinimumContent ? 100 : 50,
        criticalIssues: hasMinimumContent
          ? []
          : ['Eksāmens nav pilnībā aizpildīts'],
      },
      metadata: {
        startedAt: now,
        completedAt: now,
        duration: 0,
        appliedRules: ['fallback-validation'],
        validatorVersion: '1.0.0-fallback',
      },
    }
  }

  // Retry validation function
  const retryValidation = () => {
    debugLogger.info('validation', 'User initiated validation retry', {
      previousAttempts: validationError.retryAttempts,
    })

    setValidationResult(null)
    setValidationError({ hasError: false, errorMessage: '', retryAttempts: 0 })
  }

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

  // Enhanced submission check with fallback handling
  const canSubmit =
    validationResult?.isSubmissionReady &&
    !hasErrors &&
    !isValidating &&
    !validationError.hasError

  // Allow emergency submission if validation repeatedly fails but content exists
  const allowEmergencySubmit =
    validationError.retryAttempts >= 2 &&
    (validationResult?.summary.completionPercentage ?? 0) >= 100

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
    if (canSubmit || allowEmergencySubmit) {
      onSubmit()
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    debugLogger.debug('dialog', 'handleOpenChange called', {
      isOpen,
      currentOpen: open,
    })

    // Only close when explicitly setting to false
    if (!isOpen) {
      debugLogger.debug('dialog', 'Closing dialog via handleOpenChange')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="dialog-description"
      >
        {/* Temporarily removing FocusTrap to debug dialog issues */}
        <div>
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
            {/* Validation Error Alert */}
            {validationError.hasError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div>
                      <strong>Validācijas sistēmas kļūda:</strong>
                      <br />
                      {validationError.errorMessage}
                    </div>
                    <div className="flex gap-2">
                      {validationError.retryAttempts < 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={retryValidation}
                          disabled={isValidating}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Mēģināt vēlreiz
                        </Button>
                      )}
                      {allowEmergencySubmit && (
                        <div className="text-sm text-muted-foreground">
                          Eksāmens tiks iesniegt ar pamata validāciju.
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

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
                ) : allowEmergencySubmit ? (
                  <Alert className="border-orange-200 bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-100">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>
                        Eksāmens var tikt iesniegts ar pamata validāciju.
                      </strong>
                      <br />
                      Validācijas sistēma nav pilnībā pieejama, bet eksāmena
                      saturs ir pietiekams iesniegšanai.
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
              disabled={
                !(canSubmit || allowEmergencySubmit) ||
                isSubmitting ||
                isValidating
              }
              className="min-w-32"
              variant={
                allowEmergencySubmit && !canSubmit ? 'destructive' : 'default'
              }
              aria-describedby={
                !(canSubmit || allowEmergencySubmit)
                  ? 'submit-disabled-reason'
                  : undefined
              }
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Iesniedz...
                </>
              ) : allowEmergencySubmit && !canSubmit ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Iesniegt ar pamata validāciju
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Iesniegt eksāmenu
                </>
              )}
            </Button>
            {!(canSubmit || allowEmergencySubmit) && (
              <div id="submit-disabled-reason" className="sr-only">
                Eksāmens nav gatavs iesniegšanai. Novērsiet visas problēmas.
              </div>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
