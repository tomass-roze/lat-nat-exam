/**
 * @fileoverview Validation types and error handling interfaces
 *
 * Defines comprehensive validation schemas, error handling, and form validation
 * types for the Latvian citizenship exam application.
 */

import type { ValidationErrorCode, ExamSection } from './constants'
import type { TestState } from './exam'

/**
 * Validation rule definition
 */
export interface ValidationRule<T = unknown> {
  /** Unique identifier for this rule */
  id: string

  /** Field or property this rule applies to */
  field: keyof T | string

  /** Validation function */
  validator: (value: unknown, context?: ValidationContext) => boolean

  /** Error message in Latvian */
  message: string

  /** Error code for programmatic handling */
  errorCode: ValidationErrorCode

  /** Rule severity level */
  severity: 'error' | 'warning' | 'info'

  /** Whether this rule is required for submission */
  required: boolean

  /** Dependencies on other fields */
  dependencies?: string[]
}

/**
 * Validation context for rules
 */
export interface ValidationContext {
  /** Current test state */
  testState?: TestState

  /** Current section being validated */
  currentSection?: ExamSection

  /** Additional context data */
  metadata?: Record<string, unknown>

  /** Validation timestamp */
  timestamp: number
}

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  /** Field that was validated */
  field: string

  /** Whether validation passed */
  isValid: boolean

  /** Validation errors for this field */
  errors: ValidationError[]

  /** Validation warnings for this field */
  warnings: ValidationWarning[]

  /** Additional validation info */
  info: ValidationInfo[]

  /** When validation was performed */
  validatedAt: number
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  /** Overall validation status */
  isValid: boolean

  /** Whether the data is ready for submission */
  isSubmissionReady: boolean

  /** Results by field */
  fieldResults: Record<string, FieldValidationResult>

  /** Global validation errors */
  globalErrors: ValidationError[]

  /** Summary of validation */
  summary: ValidationSummary

  /** Validation metadata */
  metadata: ValidationMetadata
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code */
  code: ValidationErrorCode

  /** Error message in Latvian */
  message: string

  /** Field where error occurred */
  field?: string

  /** Section where error occurred */
  section?: ExamSection

  /** Error severity */
  severity: 'error'

  /** Additional error details */
  details?: Record<string, unknown>

  /** Suggested fix */
  suggestion?: string
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning code */
  code: string

  /** Warning message in Latvian */
  message: string

  /** Field where warning occurred */
  field?: string

  /** Section where warning occurred */
  section?: ExamSection

  /** Warning severity */
  severity: 'warning'

  /** Whether warning can be ignored */
  dismissible: boolean
}

/**
 * Validation information
 */
export interface ValidationInfo {
  /** Info code */
  code: string

  /** Info message in Latvian */
  message: string

  /** Field related to this info */
  field?: string

  /** Info severity */
  severity: 'info'

  /** Whether this is a helpful tip */
  isHelpful: boolean
}

/**
 * Validation summary
 */
export interface ValidationSummary {
  /** Total number of errors */
  errorCount: number

  /** Total number of warnings */
  warningCount: number

  /** Total number of info messages */
  infoCount: number

  /** Errors by section */
  errorsBySeverity: {
    error: number
    warning: number
    info: number
  }

  /** Validation completion percentage */
  completionPercentage: number

  /** Critical issues that block submission */
  criticalIssues: string[]
}

/**
 * Validation metadata
 */
export interface ValidationMetadata {
  /** When validation started */
  startedAt: number

  /** When validation completed */
  completedAt: number

  /** Validation duration in milliseconds */
  duration: number

  /** Validation rules that were applied */
  appliedRules: string[]

  /** Validation engine version */
  validatorVersion: string
}

/**
 * Form validation schema
 */
export interface FormValidationSchema {
  /** Schema identifier */
  id: string

  /** Schema version */
  version: string

  /** Validation rules by field */
  rules: Record<string, ValidationRule[]>

  /** Global validation rules */
  globalRules: ValidationRule[]

  /** Field dependencies */
  dependencies: FieldDependency[]

  /** Custom validation functions */
  customValidators: Record<string, CustomValidator>
}

/**
 * Field dependency definition
 */
export interface FieldDependency {
  /** Source field */
  field: string

  /** Dependent fields */
  dependsOn: string[]

  /** Dependency type */
  type: 'required' | 'conditional' | 'exclusive'

  /** Condition for dependency */
  condition?: (values: Record<string, unknown>) => boolean
}

/**
 * Custom validator function
 */
export interface CustomValidator {
  /** Validator name */
  name: string

  /** Validation function */
  validate: (value: unknown, context: ValidationContext) => ValidationResult

  /** Async validation function */
  validateAsync?: (
    value: unknown,
    context: ValidationContext
  ) => Promise<ValidationResult>

  /** Debounce delay for async validation */
  debounceDelay?: number
}

/**
 * Real-time validation configuration
 */
export interface RealTimeValidationConfig {
  /** Enable real-time validation */
  enabled: boolean

  /** Validation trigger events */
  triggers: ValidationTrigger[]

  /** Debounce delay in milliseconds */
  debounceDelay: number

  /** Whether to show errors immediately */
  showErrorsImmediately: boolean

  /** Whether to show warnings */
  showWarnings: boolean

  /** Whether to show helpful info */
  showInfo: boolean
}

/**
 * Validation trigger events
 */
export type ValidationTrigger =
  | 'onChange'
  | 'onBlur'
  | 'onFocus'
  | 'onSubmit'
  | 'onMount'
  | 'onTimer'

/**
 * Anthem text validation configuration
 */
export interface AnthemValidationConfig {
  /** Minimum text length */
  minLength: number

  /** Maximum text length */
  maxLength: number

  /** Required accuracy percentage */
  requiredAccuracy: number

  /** Whether to normalize whitespace */
  normalizeWhitespace: boolean

  /** Whether to ignore case differences */
  ignoreCase: boolean

  /** Whether to ignore diacritic differences */
  ignoreDiacritics: boolean

  /** Custom text comparison function */
  customComparator?: (submitted: string, reference: string) => number
}

/**
 * Multiple choice validation configuration
 */
export interface MultipleChoiceValidationConfig {
  /** Whether all questions must be answered */
  requireAllAnswers: boolean

  /** Minimum number of questions to answer */
  minAnswered?: number

  /** Whether to validate answer range */
  validateAnswerRange: boolean

  /** Whether to check for impossible answers */
  checkImpossibleAnswers: boolean
}

/**
 * Session validation configuration
 */
export interface SessionValidationConfig {
  /** Whether to validate session integrity */
  validateIntegrity: boolean

  /** Whether to check session expiry */
  checkExpiry: boolean

  /** Whether to validate schema version */
  validateSchema: boolean

  /** Whether to verify checksums */
  verifyChecksums: boolean
}

/**
 * Validation state manager
 */
export interface ValidationState {
  /** Current validation results */
  results: ValidationResult

  /** Whether validation is in progress */
  isValidating: boolean

  /** Last validation timestamp */
  lastValidated: number

  /** Validation configuration */
  config: RealTimeValidationConfig

  /** Validation history */
  history: ValidationHistoryEntry[]
}

/**
 * Validation history entry
 */
export interface ValidationHistoryEntry {
  /** When validation occurred */
  timestamp: number

  /** What triggered the validation */
  trigger: ValidationTrigger

  /** Validation results */
  result: ValidationResult

  /** Field that was validated (if specific) */
  field?: string
}

/**
 * Built-in validators for common use cases
 */
export interface BuiltInValidators {
  /** Required field validator */
  required: ValidationRule

  /** Minimum length validator */
  minLength: (length: number) => ValidationRule

  /** Maximum length validator */
  maxLength: (length: number) => ValidationRule

  /** Numeric range validator */
  range: (min: number, max: number) => ValidationRule

  /** Pattern matching validator */
  pattern: (regex: RegExp) => ValidationRule

  /** Custom function validator */
  custom: (fn: (value: unknown) => boolean, message: string) => ValidationRule
}

/**
 * Type guards for validation objects
 */

/**
 * Check if object is a validation error
 */
export function isValidationError(obj: unknown): obj is ValidationError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ValidationError).code === 'string' &&
    typeof (obj as ValidationError).message === 'string' &&
    (obj as ValidationError).severity === 'error'
  )
}

/**
 * Check if validation result indicates success
 */
export function isValidationSuccessful(result: ValidationResult): boolean {
  return result.isValid && result.summary.errorCount === 0
}

/**
 * Check if validation allows submission
 */
export function canSubmitWithValidation(result: ValidationResult): boolean {
  return result.isSubmissionReady && result.summary.criticalIssues.length === 0
}

/**
 * Utility types for validation
 */

/** Validation result by section */
export type SectionValidationResults = {
  [K in ExamSection]: ValidationResult
}

/** Field validation state */
export type FieldValidationState =
  | 'pending'
  | 'validating'
  | 'valid'
  | 'invalid'
  | 'warning'

/** Validation rule set */
export type ValidationRuleSet = Record<string, ValidationRule[]>

/** Error message localization */
export type ErrorMessageLocalization = Record<ValidationErrorCode, string>

/** Validation status summary */
export type ValidationStatusSummary = {
  hasErrors: boolean
  hasWarnings: boolean
  hasInfo: boolean
  isComplete: boolean
  canSubmit: boolean
}
