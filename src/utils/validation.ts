/**
 * @fileoverview Comprehensive form validation utilities for the Latvian citizenship exam
 *
 * Implements the validation interfaces from types/validation.ts with concrete validation
 * logic for all exam sections and comprehensive error handling.
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationInfo,
  FieldValidationResult,
  ValidationSummary,
  AnthemValidationConfig,
  MultipleChoiceValidationConfig,
  SectionValidationResults,
} from '@/types/validation'
import type { TestState, ExamContext } from '@/types/exam'
import type { ExamSection, ValidationErrorCode } from '@/types/constants'
import { SCORING_THRESHOLDS, VALIDATION_ERRORS } from '@/types/constants'
import { compareAnthemText } from '@/utils/textProcessing'

/**
 * Default validation configuration for anthem section
 */
export const DEFAULT_ANTHEM_CONFIG: AnthemValidationConfig = {
  minLength: SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS,
  maxLength: 2000,
  requiredAccuracy: SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE,
  normalizeWhitespace: true,
  ignoreCase: false,
  ignoreDiacritics: false,
}

/**
 * Default validation configuration for multiple choice sections
 */
export const DEFAULT_MULTIPLE_CHOICE_CONFIG: MultipleChoiceValidationConfig = {
  requireAllAnswers: true,
  validateAnswerRange: true,
  checkImpossibleAnswers: true,
}

/**
 * Validation error messages in Latvian
 */
export const VALIDATION_MESSAGES: Record<ValidationErrorCode, string> = {
  REQUIRED_FIELD: 'Šis lauks ir obligāts',
  INVALID_FORMAT: 'Nepareizs formāts',
  OUT_OF_RANGE: 'Vērtība ārpus pieļaujamā diapazona',
  INSUFFICIENT_LENGTH: 'Teksts ir pārāk īss',
  INVALID_ANSWER: 'Nepareiza atbilde',
  SESSION_EXPIRED: 'Sesija ir beigusies',
  MALFORMED_DATA: 'Bojāti dati',
}

/**
 * Create a validation error object
 */
export function createValidationError(
  code: ValidationErrorCode,
  message: string,
  section?: ExamSection,
  field?: string,
  suggestion?: string
): ValidationError {
  return {
    code,
    message,
    section,
    field,
    severity: 'error',
    suggestion,
  }
}

/**
 * Create a field validation result
 */
export function createFieldValidationResult(
  field: string,
  isValid: boolean,
  errors: ValidationError[] = [],
  warnings: ValidationWarning[] = [],
  info: ValidationInfo[] = []
): FieldValidationResult {
  return {
    field,
    isValid,
    errors,
    warnings,
    info,
    validatedAt: Date.now(),
  }
}

/**
 * Validate anthem text section - simplified line-based validation
 */
export function validateAnthemSection(
  anthemText: string,
  _config: AnthemValidationConfig = DEFAULT_ANTHEM_CONFIG
): FieldValidationResult {
  const errors: ValidationError[] = []
  const field = 'anthemText'

  // Split into lines and check each one
  const lines = anthemText.split('\n')
  const requiredLines = 8

  // Check each line has at least one letter
  for (let i = 0; i < requiredLines; i++) {
    const line = lines[i] || ''
    if (!/[a-zA-ZāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/.test(line)) {
      errors.push(
        createValidationError(
          VALIDATION_ERRORS.REQUIRED_FIELD,
          `${i + 1}. rinda ir tukša vai nesatur burtus`,
          'anthem',
          field,
          'Lūdzu, ierakstiet himnas tekstu šajā rindā'
        )
      )
    }
  }

  return createFieldValidationResult(field, errors.length === 0, errors)
}

/**
 * Validate anthem text for submission - performs accuracy check
 */
export function validateAnthemForSubmission(
  anthemText: string
): ValidationResult {
  const errors: ValidationError[] = []
  const field = 'anthemText'

  // First check basic line completion
  const basicValidation = validateAnthemSection(anthemText)
  if (!basicValidation.isValid) {
    return {
      isValid: false,
      isSubmissionReady: false,
      fieldResults: { [field]: basicValidation },
      globalErrors: [],
      summary: {
        errorCount: basicValidation.errors.length,
        warningCount: 0,
        infoCount: 0,
        errorsBySeverity: {
          error: basicValidation.errors.length,
          warning: 0,
          info: 0,
        },
        completionPercentage: 0,
        criticalIssues: basicValidation.errors.map((e) => e.message),
      },
      metadata: {
        startedAt: Date.now(),
        completedAt: Date.now(),
        duration: 0,
        appliedRules: ['anthem-submission-validation'],
        validatorVersion: '1.0.0',
      },
    }
  }

  // Then check accuracy against reference text
  try {
    const anthemResult = compareAnthemText(anthemText)
    if (anthemResult.accuracy < SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE) {
      errors.push(
        createValidationError(
          VALIDATION_ERRORS.INSUFFICIENT_LENGTH,
          `Himnas precizitāte (${anthemResult.accuracy.toFixed(1)}%) ir zemāka par nepieciešamo (${SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE}%)`,
          'anthem',
          field,
          'Lūdzu, pārbaudiet un uzlabojiet himnas tekstu'
        )
      )
    }
  } catch (error) {
    errors.push(
      createValidationError(
        VALIDATION_ERRORS.MALFORMED_DATA,
        'Neizdevās analizēt himnas tekstu',
        'anthem',
        field,
        'Lūdzu, pārbaudiet teksta pareizību'
      )
    )
  }

  const fieldResult = createFieldValidationResult(
    field,
    errors.length === 0,
    errors
  )
  const isValid = errors.length === 0

  return {
    isValid,
    isSubmissionReady: isValid,
    fieldResults: { [field]: fieldResult },
    globalErrors: [],
    summary: {
      errorCount: errors.length,
      warningCount: 0,
      infoCount: 0,
      errorsBySeverity: { error: errors.length, warning: 0, info: 0 },
      completionPercentage: isValid ? 100 : 0,
      criticalIssues: errors.map((e) => e.message),
    },
    metadata: {
      startedAt: Date.now(),
      completedAt: Date.now(),
      duration: 0,
      appliedRules: ['anthem-submission-validation'],
      validatorVersion: '1.0.0',
    },
  }
}

/**
 * Validate history section answers
 */
export function validateHistorySection(
  answers: Record<number, 0 | 1 | 2>,
  config: MultipleChoiceValidationConfig = DEFAULT_MULTIPLE_CHOICE_CONFIG
): FieldValidationResult {
  const errors: ValidationError[] = []
  const field = 'historyAnswers'
  const totalQuestions = SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS

  // Check if all questions are answered
  const answeredCount = Object.keys(answers).length

  if (config.requireAllAnswers && answeredCount < totalQuestions) {
    const missingCount = totalQuestions - answeredCount
    errors.push(
      createValidationError(
        VALIDATION_ERRORS.REQUIRED_FIELD,
        `Lūdzu atbildiet uz visiem vēstures jautājumiem. Trūkst ${missingCount} atbilžu`,
        'history',
        field,
        `Atbildēts uz ${answeredCount} no ${totalQuestions} jautājumiem`
      )
    )
    return createFieldValidationResult(field, false, errors)
  }

  // Validate answer range
  if (config.validateAnswerRange) {
    for (const [questionId, answer] of Object.entries(answers)) {
      if (![0, 1, 2].includes(answer)) {
        errors.push(
          createValidationError(
            VALIDATION_ERRORS.INVALID_ANSWER,
            `Nepareiza atbilde jautājumam ${questionId}`,
            'history',
            field,
            'Atbilde drīkst būt tikai 0, 1 vai 2'
          )
        )
      }
    }
  }

  const isValid = errors.length === 0
  return createFieldValidationResult(field, isValid, errors)
}

/**
 * Validate constitution section answers
 */
export function validateConstitutionSection(
  answers: Record<number, 0 | 1 | 2>,
  config: MultipleChoiceValidationConfig = DEFAULT_MULTIPLE_CHOICE_CONFIG
): FieldValidationResult {
  const errors: ValidationError[] = []
  const field = 'constitutionAnswers'
  const totalQuestions = SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS

  // Check if all questions are answered
  const answeredCount = Object.keys(answers).length

  if (config.requireAllAnswers && answeredCount < totalQuestions) {
    const missingCount = totalQuestions - answeredCount
    errors.push(
      createValidationError(
        VALIDATION_ERRORS.REQUIRED_FIELD,
        `Lūdzu atbildiet uz visiem konstitūcijas jautājumiem. Trūkst ${missingCount} atbilžu`,
        'constitution',
        field,
        `Atbildēts uz ${answeredCount} no ${totalQuestions} jautājumiem`
      )
    )
    return createFieldValidationResult(field, false, errors)
  }

  // Validate answer range
  if (config.validateAnswerRange) {
    for (const [questionId, answer] of Object.entries(answers)) {
      if (![0, 1, 2].includes(answer)) {
        errors.push(
          createValidationError(
            VALIDATION_ERRORS.INVALID_ANSWER,
            `Nepareiza atbilde jautājumam ${questionId}`,
            'constitution',
            field,
            'Atbilde drīkst būt tikai 0, 1 vai 2'
          )
        )
      }
    }
  }

  const isValid = errors.length === 0
  return createFieldValidationResult(field, isValid, errors)
}

/**
 * Create validation summary from field results
 */
export function createValidationSummary(
  fieldResults: Record<string, FieldValidationResult>
): ValidationSummary {
  let errorCount = 0
  let warningCount = 0
  let infoCount = 0
  const criticalIssues: string[] = []

  for (const result of Object.values(fieldResults)) {
    errorCount += result.errors.length
    warningCount += result.warnings.length
    infoCount += result.info.length

    // Add critical issues that block submission
    result.errors.forEach((error) => {
      if (error.severity === 'error') {
        criticalIssues.push(error.message)
      }
    })
  }

  const totalFields = Object.keys(fieldResults).length
  const validFields = Object.values(fieldResults).filter(
    (r) => r.isValid
  ).length
  const completionPercentage =
    totalFields > 0 ? (validFields / totalFields) * 100 : 0

  return {
    errorCount,
    warningCount,
    infoCount,
    errorsBySeverity: {
      error: errorCount,
      warning: warningCount,
      info: infoCount,
    },
    completionPercentage,
    criticalIssues,
  }
}

/**
 * Validate complete test state
 */
export function validateTestState(testState: TestState): ValidationResult {
  const startTime = Date.now()
  const fieldResults: Record<string, FieldValidationResult> = {}

  // Validate anthem section
  const anthemResult = validateAnthemSection(testState.anthemText)
  fieldResults.anthemText = anthemResult

  // Validate history section
  const historyResult = validateHistorySection(testState.historyAnswers)
  fieldResults.historyAnswers = historyResult

  // Validate constitution section
  const constitutionResult = validateConstitutionSection(
    testState.constitutionAnswers
  )
  fieldResults.constitutionAnswers = constitutionResult

  // Create summary
  const summary = createValidationSummary(fieldResults)

  // Determine if valid for submission
  const isValid = Object.values(fieldResults).every((result) => result.isValid)
  const isSubmissionReady = isValid && summary.criticalIssues.length === 0

  const endTime = Date.now()

  return {
    isValid,
    isSubmissionReady,
    fieldResults,
    globalErrors: [],
    summary,
    metadata: {
      startedAt: startTime,
      completedAt: endTime,
      duration: endTime - startTime,
      appliedRules: [
        'anthem-validation',
        'history-validation',
        'constitution-validation',
      ],
      validatorVersion: '1.0.0',
    },
  }
}

/**
 * Validate exam context with additional business logic
 */
export function validateExamContext(context: ExamContext): ValidationResult {
  const baseResult = validateTestState(context.testState)
  const globalErrors: ValidationError[] = [...baseResult.globalErrors]

  // Additional business logic validation

  // Check session integrity
  if (context.testState.startTime <= 0) {
    globalErrors.push(
      createValidationError(
        VALIDATION_ERRORS.SESSION_EXPIRED,
        'Sesijas dati ir bojāti',
        undefined,
        undefined,
        'Lūdzu, sāciet eksāmenu no jauna'
      )
    )
  }

  // Check if exam is already completed
  if (context.testState.isCompleted) {
    globalErrors.push(
      createValidationError(
        VALIDATION_ERRORS.MALFORMED_DATA,
        'Eksāmens jau ir pabeigts',
        undefined,
        undefined,
        'Nevar modificēt pabeigtu eksāmenu'
      )
    )
  }

  const hasGlobalErrors = globalErrors.length > 0
  const isValid = baseResult.isValid && !hasGlobalErrors
  const isSubmissionReady = baseResult.isSubmissionReady && !hasGlobalErrors

  return {
    ...baseResult,
    isValid,
    isSubmissionReady,
    globalErrors,
    summary: {
      ...baseResult.summary,
      errorCount: baseResult.summary.errorCount + globalErrors.length,
      criticalIssues: [
        ...baseResult.summary.criticalIssues,
        ...globalErrors.map((error) => error.message),
      ],
    },
  }
}

/**
 * Get validation results by section
 */
export function getValidationBySection(
  result: ValidationResult
): SectionValidationResults {
  const baseResult = {
    isValid: result.isValid,
    isSubmissionReady: result.isSubmissionReady,
    globalErrors: result.globalErrors,
    summary: result.summary,
    metadata: result.metadata,
  }

  return {
    anthem: {
      ...baseResult,
      fieldResults: {
        anthemText:
          result.fieldResults.anthemText ||
          createFieldValidationResult('anthemText', false),
      },
    },
    history: {
      ...baseResult,
      fieldResults: {
        historyAnswers:
          result.fieldResults.historyAnswers ||
          createFieldValidationResult('historyAnswers', false),
      },
    },
    constitution: {
      ...baseResult,
      fieldResults: {
        constitutionAnswers:
          result.fieldResults.constitutionAnswers ||
          createFieldValidationResult('constitutionAnswers', false),
      },
    },
    results: result, // Full result for the results section
  }
}

/**
 * Get user-friendly validation status message
 */
export function getValidationStatusMessage(result: ValidationResult): string {
  if (result.isSubmissionReady) {
    return 'Eksāmens ir gatavs iesniegšanai'
  }

  if (result.summary.criticalIssues.length > 0) {
    return `Nepieciešams novērst ${result.summary.criticalIssues.length} problēmu pirms iesniegšanas`
  }

  const completionPercentage = Math.round(result.summary.completionPercentage)
  return `Eksāmens ir ${completionPercentage}% pabeigts`
}

/**
 * Check if a specific section is valid
 */
export function isSectionValid(
  result: ValidationResult,
  section: ExamSection
): boolean {
  switch (section) {
    case 'anthem':
      return result.fieldResults.anthemText?.isValid || false
    case 'history':
      return result.fieldResults.historyAnswers?.isValid || false
    case 'constitution':
      return result.fieldResults.constitutionAnswers?.isValid || false
    default:
      return false
  }
}

/**
 * Get section-specific validation errors
 */
export function getSectionErrors(
  result: ValidationResult,
  section: ExamSection
): ValidationError[] {
  switch (section) {
    case 'anthem':
      return result.fieldResults.anthemText?.errors || []
    case 'history':
      return result.fieldResults.historyAnswers?.errors || []
    case 'constitution':
      return result.fieldResults.constitutionAnswers?.errors || []
    default:
      return []
  }
}
