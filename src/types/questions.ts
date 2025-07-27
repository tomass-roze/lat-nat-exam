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
    ((obj as Question).category === 'history' || (obj as Question).category === 'constitution')
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
export type QuestionUpdate = Partial<Pick<Question, 'question' | 'options' | 'correctAnswer' | 'difficulty' | 'metadata'>>

/**
 * Utility type for creating new questions (without ID)
 */
export type NewQuestion = Omit<Question, 'id'>

/**
 * Union type for all question-related error types
 */
export type QuestionError = AnswerValidationError | {
  type: 'SELECTION_ERROR' | 'RANDOMIZATION_ERROR' | 'VALIDATION_ERROR'
  message: string
  details?: Record<string, unknown>
}