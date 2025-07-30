/**
 * @fileoverview Question and answer data structures for the Latvian Citizenship Exam
 *
 * Defines interfaces for multiple-choice questions, question pools, and answer handling
 * with support for randomization and validation.
 */

import type { DifficultyLevel } from './constants'

/**
 * Represents a single multiple-choice question
 */
export interface Question {
  /** Unique identifier for the question */
  id: number

  /** The question text in Latvian */
  question: string

  /** Array of answer options (exactly 3 options) */
  options: [string, string, string]

  /** Index of the correct answer (0, 1, or 2) */
  correctAnswer: 0 | 1 | 2

  /** Question category - history or constitution */
  category: 'history' | 'constitution'

  /** Difficulty level (optional, for future enhancement) */
  difficulty?: DifficultyLevel

  /** Additional metadata (optional) */
  metadata?: QuestionMetadata
}

/**
 * Optional metadata for questions
 */
export interface QuestionMetadata {
  /** Source of the question (e.g., "Constitutional Law Article 15") */
  source?: string

  /** Tags for categorization */
  tags?: string[]

  /** Last updated timestamp */
  lastUpdated?: number

  /** Question author/reviewer */
  author?: string
}

/**
 * Complete question pool containing all available questions
 */
export interface QuestionPool {
  /** History questions (minimum 20 required) */
  history: Question[]

  /** Constitution questions (minimum 16 required) */
  constitution: Question[]

  /** Metadata about the question pool */
  metadata: QuestionPoolMetadata
}

/**
 * Metadata for the entire question pool
 */
export interface QuestionPoolMetadata {
  /** Version of the question set */
  version: string

  /** Last updated timestamp */
  lastUpdated: number

  /** Total number of questions */
  totalQuestions: number

  /** Questions by category count */
  categoryCounts: {
    history: number
    constitution: number
  }
}

/**
 * Selected questions for a specific exam session
 */
export interface SelectedQuestions {
  /** 10 randomly selected history questions */
  history: Question[]

  /** 8 randomly selected constitution questions */
  constitution: Question[]

  /** Selection metadata */
  selectionMetadata: SelectionMetadata
}

/**
 * Metadata about question selection
 */
export interface SelectionMetadata {
  /** Timestamp when questions were selected */
  selectedAt: number

  /** Random seed used for selection (for reproducibility) */
  randomSeed: number

  /** Question IDs for each category */
  selectedIds: {
    history: number[]
    constitution: number[]
  }
}

/**
 * User's answer to a specific question
 */
export interface QuestionAnswer {
  /** Question ID this answer belongs to */
  questionId: number

  /** Selected answer index (0, 1, or 2) */
  selectedAnswer: 0 | 1 | 2

  /** Whether this answer is correct */
  isCorrect: boolean

  /** Timestamp when answer was given */
  answeredAt: number

  /** Time taken to answer in milliseconds */
  timeToAnswer?: number
}

/**
 * Collection of answers for a question category
 */
export interface CategoryAnswers {
  /** Map of question ID to selected answer index */
  answers: Record<number, 0 | 1 | 2>

  /** Whether all questions in this category are answered */
  isComplete: boolean

  /** Number of questions answered */
  answeredCount: number

  /** Total questions in this category */
  totalQuestions: number
}

/**
 * Answer validation result
 */
export interface AnswerValidation {
  /** Whether the answer set is valid */
  isValid: boolean

  /** Validation errors if any */
  errors: AnswerValidationError[]

  /** Missing question IDs */
  missingAnswers: number[]
}

/**
 * Answer validation error
 */
export interface AnswerValidationError {
  /** Question ID with the error */
  questionId: number

  /** Error message */
  message: string

  /** Error code */
  code: 'MISSING_ANSWER' | 'INVALID_OPTION' | 'QUESTION_NOT_FOUND'
}

/**
 * Question randomization options
 */
export interface RandomizationOptions {
  /** Random seed for reproducible results */
  seed?: number

  /** Whether to shuffle answer options within questions */
  shuffleOptions: boolean

  /** Whether to shuffle question order */
  shuffleQuestions: boolean

  /** Difficulty distribution preferences */
  difficultyDistribution?: {
    easy: number
    medium: number
    hard: number
  }
}

/**
 * Question selection result
 */
export interface QuestionSelectionResult {
  /** Successfully selected questions */
  selectedQuestions: SelectedQuestions

  /** Any warnings during selection */
  warnings: string[]

  /** Selection was successful */
  success: boolean
}

/**
 * Type guard to check if an object is a valid Question
 */
export function isQuestion(obj: unknown): obj is Question {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Question).id === 'number' &&
    typeof (obj as Question).question === 'string' &&
    Array.isArray((obj as Question).options) &&
    (obj as Question).options.length === 3 &&
    typeof (obj as Question).correctAnswer === 'number' &&
    (obj as Question).correctAnswer >= 0 &&
    (obj as Question).correctAnswer <= 2 &&
    ((obj as Question).category === 'history' ||
      (obj as Question).category === 'constitution')
  )
}

/**
 * Type guard to check if an object is a valid QuestionPool
 */
export function isQuestionPool(obj: unknown): obj is QuestionPool {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Array.isArray((obj as QuestionPool).history) &&
    Array.isArray((obj as QuestionPool).constitution) &&
    (obj as QuestionPool).history.every(isQuestion) &&
    (obj as QuestionPool).constitution.every(isQuestion) &&
    typeof (obj as QuestionPool).metadata === 'object'
  )
}

/**
 * Utility type for question IDs by category
 */
export type QuestionIdsByCategory = {
  [K in 'history' | 'constitution']: number[]
}

/**
 * Utility type for partial question updates
 */
export type QuestionUpdate = Partial<
  Pick<
    Question,
    'question' | 'options' | 'correctAnswer' | 'difficulty' | 'metadata'
  >
>

/**
 * Utility type for creating new questions (without ID)
 */
export type NewQuestion = Omit<Question, 'id'>

/**
 * Enhanced database validation types
 */
export interface DatabaseValidationResult {
  isValid: boolean
  errors: DatabaseValidationError[]
  warnings: string[]
  stats: DatabaseStats
  performance: PerformanceMetrics
}

export interface DatabaseValidationError {
  category: 'structure' | 'content' | 'encoding' | 'duplicate' | 'format'
  severity: 'error' | 'warning'
  message: string
  context: string
  questionId?: number
  suggestions?: string[]
}

export interface DatabaseStats {
  anthemLines: number
  historyQuestions: number
  constitutionQuestions: number
  totalQuestions: number
  uniqueIds: number
  duplicateIds: number[]
  utf8Characters: {
    total: number
    byCharacter: Record<LatvianDiacritic, number>
    coverage: number
  }
}

export interface PerformanceMetrics {
  validationTimeMs: number
  memoryUsageMB: number
  questionsPerSecond?: number
  loadingTimeMs?: number
}

/**
 * Latvian diacritical characters as literal type
 */
export type LatvianDiacritic =
  | 'ā'
  | 'ē'
  | 'ī'
  | 'ō'
  | 'ū'
  | 'ģ'
  | 'ķ'
  | 'ļ'
  | 'ņ'
  | 'š'
  | 'ž'

/**
 * Enhanced raw question data with strict typing
 */
export interface RawQuestionData {
  nationalAnthem: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ]
  historyQuestions: readonly RawQuestion[]
  constitutionQuestions: readonly RawQuestion[]
}

export interface RawQuestion {
  readonly id: number
  readonly question: string
  readonly options: readonly [string, string, string]
  readonly correctAnswer: 0 | 1 | 2
}

/**
 * Validated question with enhanced type safety
 */
export interface ValidatedQuestion extends Omit<Question, 'options'> {
  readonly id: number
  readonly question: string
  readonly options: [string, string, string]
  readonly correctAnswer: 0 | 1 | 2
  readonly category: 'history' | 'constitution'
  readonly isValidated: true
  readonly validatedAt: number
  readonly utf8Valid: boolean
  readonly contentHash: string
}

/**
 * Question pool validation configuration
 */
export interface ValidationConfig {
  strictMode: boolean
  checkUtf8Encoding: boolean
  validateDuplicateIds: boolean
  checkContentLength: boolean
  maxQuestionLength: number
  maxOptionLength: number
  requiredFields: (keyof Question)[]
}

/**
 * Performance benchmark result
 */
export interface BenchmarkResult {
  averageLoadTimeMs: number
  minLoadTimeMs: number
  maxLoadTimeMs: number
  standardDeviation: number
  totalQuestions: number
  averageQuestionsPerSecond: number
  memoryUsageMB: number
  iterations: number
  reliability: 'excellent' | 'good' | 'poor'
}

/**
 * Cross-pool validation result
 */
export interface CrossPoolValidation {
  isValid: boolean
  duplicateIds: number[]
  totalIds: number
  uniqueIds: number
  details: string
  affectedCategories: ('history' | 'constitution')[]
}

/**
 * UTF-8 character validation result
 */
export interface Utf8ValidationResult {
  isValid: boolean
  encoding: 'utf-8' | 'invalid' | 'mixed'
  characters: {
    total: number
    latvian: number
    coverage: number
    distribution: Record<LatvianDiacritic, number>
  }
  issues: Utf8Issue[]
}

export interface Utf8Issue {
  type: 'encoding_error' | 'missing_character' | 'character_corruption'
  message: string
  context: string
  questionId?: number
  position?: number
}

/**
 * Enhanced type guards with better error reporting
 */
export interface TypeGuardResult<T> {
  isValid: boolean
  data?: T
  errors: TypeValidationError[]
}

export interface TypeValidationError {
  field: string
  expected: string
  actual: string
  message: string
}

/**
 * Enhanced question validation function
 */
export function validateQuestion(obj: unknown): TypeGuardResult<Question> {
  const errors: TypeValidationError[] = []

  if (typeof obj !== 'object' || obj === null) {
    errors.push({
      field: 'root',
      expected: 'object',
      actual: typeof obj,
      message: 'Question must be an object',
    })
    return { isValid: false, errors }
  }

  const q = obj as any

  // ID validation
  if (typeof q.id !== 'number') {
    errors.push({
      field: 'id',
      expected: 'number',
      actual: typeof q.id,
      message: 'Question ID must be a number',
    })
  }

  // Question text validation
  if (typeof q.question !== 'string' || !q.question.trim()) {
    errors.push({
      field: 'question',
      expected: 'non-empty string',
      actual: typeof q.question,
      message: 'Question text must be a non-empty string',
    })
  }

  // Options validation
  if (!Array.isArray(q.options)) {
    errors.push({
      field: 'options',
      expected: 'array',
      actual: typeof q.options,
      message: 'Options must be an array',
    })
  } else if (q.options.length !== 3) {
    errors.push({
      field: 'options',
      expected: 'array of length 3',
      actual: `array of length ${q.options.length}`,
      message: 'Options must contain exactly 3 items',
    })
  }

  // Correct answer validation
  if (
    typeof q.correctAnswer !== 'number' ||
    ![0, 1, 2].includes(q.correctAnswer)
  ) {
    errors.push({
      field: 'correctAnswer',
      expected: '0, 1, or 2',
      actual: String(q.correctAnswer),
      message: 'Correct answer must be 0, 1, or 2',
    })
  }

  // Category validation
  if (!['history', 'constitution'].includes(q.category)) {
    errors.push({
      field: 'category',
      expected: 'history or constitution',
      actual: String(q.category),
      message: 'Category must be either history or constitution',
    })
  }

  const isValid = errors.length === 0
  return {
    isValid,
    data: isValid ? (q as Question) : undefined,
    errors,
  }
}

/**
 * Enhanced question pool validation
 */
export function validateQuestionPool(
  obj: unknown
): TypeGuardResult<QuestionPool> {
  const errors: TypeValidationError[] = []

  if (typeof obj !== 'object' || obj === null) {
    errors.push({
      field: 'root',
      expected: 'object',
      actual: typeof obj,
      message: 'Question pool must be an object',
    })
    return { isValid: false, errors }
  }

  const pool = obj as any

  // History questions validation
  if (!Array.isArray(pool.history)) {
    errors.push({
      field: 'history',
      expected: 'array',
      actual: typeof pool.history,
      message: 'History questions must be an array',
    })
  } else {
    pool.history.forEach((q: unknown, index: number) => {
      const validation = validateQuestion(q)
      if (!validation.isValid) {
        errors.push({
          field: `history[${index}]`,
          expected: 'valid Question object',
          actual: 'invalid Question',
          message: `History question ${index + 1} is invalid: ${validation.errors.map((e) => e.message).join(', ')}`,
        })
      }
    })
  }

  // Constitution questions validation
  if (!Array.isArray(pool.constitution)) {
    errors.push({
      field: 'constitution',
      expected: 'array',
      actual: typeof pool.constitution,
      message: 'Constitution questions must be an array',
    })
  } else {
    pool.constitution.forEach((q: unknown, index: number) => {
      const validation = validateQuestion(q)
      if (!validation.isValid) {
        errors.push({
          field: `constitution[${index}]`,
          expected: 'valid Question object',
          actual: 'invalid Question',
          message: `Constitution question ${index + 1} is invalid: ${validation.errors.map((e) => e.message).join(', ')}`,
        })
      }
    })
  }

  // Metadata validation
  if (typeof pool.metadata !== 'object' || pool.metadata === null) {
    errors.push({
      field: 'metadata',
      expected: 'object',
      actual: typeof pool.metadata,
      message: 'Question pool metadata must be an object',
    })
  }

  const isValid = errors.length === 0
  return {
    isValid,
    data: isValid ? (pool as QuestionPool) : undefined,
    errors,
  }
}

/**
 * Union type for all question-related error types
 */
export type QuestionError =
  | AnswerValidationError
  | DatabaseValidationError
  | TypeValidationError
  | Utf8Issue
  | {
      type:
        | 'SELECTION_ERROR'
        | 'RANDOMIZATION_ERROR'
        | 'VALIDATION_ERROR'
        | 'PERFORMANCE_ERROR'
      message: string
      details?: Record<string, unknown>
      timestamp?: number
    }

/**
 * Comprehensive validation result for the entire system
 */
export interface SystemValidationResult {
  database: DatabaseValidationResult
  crossPool: CrossPoolValidation
  utf8: Utf8ValidationResult
  performance: BenchmarkResult
  overall: {
    isValid: boolean
    score: number // 0-100
    recommendations: string[]
  }
}
