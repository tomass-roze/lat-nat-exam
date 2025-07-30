/**
 * @fileoverview Type-safe constants for the Latvian Citizenship Naturalization Exam
 *
 * This file contains all scoring thresholds, configuration values, and other constants
 * used throughout the exam application, defined as const assertions for maximum type safety.
 */

/**
 * Scoring thresholds for each examination section
 * Based on official Latvian citizenship exam requirements
 */
export const SCORING_THRESHOLDS = {
  /** National anthem accuracy threshold (75%) */
  ANTHEM_PASS_PERCENTAGE: 75,

  /** History questions - passing score (7 out of 10) */
  HISTORY_PASS_COUNT: 7,

  /** History questions - total count */
  HISTORY_TOTAL_QUESTIONS: 10,

  /** Constitution questions - passing score (5 out of 8) */
  CONSTITUTION_PASS_COUNT: 5,

  /** Constitution questions - total count */
  CONSTITUTION_TOTAL_QUESTIONS: 8,

  /** Minimum question pool sizes */
  MIN_HISTORY_POOL_SIZE: 20,
  MIN_CONSTITUTION_POOL_SIZE: 16,

  /** National anthem minimum character count for validation */
  ANTHEM_MIN_CHARACTERS: 100,
} as const

/**
 * Session management configuration
 */
export const SESSION_CONFIG = {
  /** Auto-save interval in milliseconds (30 seconds) */
  AUTO_SAVE_INTERVAL: 30000,

  /** Session duration in milliseconds (2 hours) */
  SESSION_DURATION: 2 * 60 * 60 * 1000,

  /** SessionStorage key for test state */
  STORAGE_KEY: 'latvian-citizenship-exam-state',

  /** Current schema version for migration support */
  SCHEMA_VERSION: '1.0.0',
} as const

/**
 * Exam section identifiers
 */
export const EXAM_SECTIONS = {
  ANTHEM: 'anthem',
  HISTORY: 'history',
  CONSTITUTION: 'constitution',
  RESULTS: 'results',
} as const

/**
 * Question difficulty levels
 */
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const

/**
 * Answer option limits for multiple choice questions
 */
export const QUESTION_CONFIG = {
  /** Number of answer options per question */
  OPTIONS_PER_QUESTION: 3,

  /** Maximum question text length */
  MAX_QUESTION_LENGTH: 500,

  /** Maximum option text length */
  MAX_OPTION_LENGTH: 200,
} as const

/**
 * Validation error codes
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  INSUFFICIENT_LENGTH: 'INSUFFICIENT_LENGTH',
  INVALID_ANSWER: 'INVALID_ANSWER',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  MALFORMED_DATA: 'MALFORMED_DATA',
} as const

/**
 * Type aliases for the constant values
 */
export type ScoringThreshold = typeof SCORING_THRESHOLDS
export type SessionConfigType = typeof SESSION_CONFIG
export type ExamSection = (typeof EXAM_SECTIONS)[keyof typeof EXAM_SECTIONS]
export type DifficultyLevel =
  (typeof DIFFICULTY_LEVELS)[keyof typeof DIFFICULTY_LEVELS]
export type ValidationErrorCode =
  (typeof VALIDATION_ERRORS)[keyof typeof VALIDATION_ERRORS]

/**
 * Official Latvian national anthem text (8 lines)
 * Used as reference for anthem accuracy checking
 * Updated from official JSON database
 */
export const NATIONAL_ANTHEM_REFERENCE = [
  'Dievs, svētī Latviju,',
  "Mūs' dārgo tēviju,",
  'Svētī jel Latviju,',
  'Ak, svētī jel to!',
  'Kur latvju meitas zied,',
  'Kur latvju dēli dzied,',
  'Laid mums tur laimē diet,',
  "Mūs' Latvijā!",
] as const

/**
 * Anthem reference as single string for comparison
 */
export const NATIONAL_ANTHEM_TEXT = NATIONAL_ANTHEM_REFERENCE.join('\n')
