/**
 * @fileoverview Main TypeScript interfaces and types for Latvian Citizenship Exam
 * 
 * This file serves as the central export point for all TypeScript interfaces
 * and types used throughout the Latvian Citizenship Naturalization Exam web application.
 * 
 * The type system provides comprehensive coverage for:
 * - Question data structures and validation
 * - Exam state management and progress tracking  
 * - Results calculation and performance analytics
 * - Session persistence and recovery
 * - Form validation and error handling
 * - Constants and configuration values
 * 
 * All interfaces follow TypeScript best practices with strict typing,
 * comprehensive documentation, and runtime type guards where appropriate.
 * 
 * @author Latvian Citizenship Exam Development Team
 * @version 1.0.0
 * @since 2024
 */

// ===== CONSTANTS AND CONFIGURATION =====
export {
  // Scoring and configuration constants
  SCORING_THRESHOLDS,
  SESSION_CONFIG,
  EXAM_SECTIONS,
  DIFFICULTY_LEVELS,
  QUESTION_CONFIG,
  VALIDATION_ERRORS,
  NATIONAL_ANTHEM_REFERENCE,
  NATIONAL_ANTHEM_TEXT,
  
  // Type aliases for constants
  type ScoringThreshold,
  type SessionConfigType,
  type ExamSection,
  type DifficultyLevel,
  type ValidationErrorCode,
} from './constants'

// ===== QUESTION AND ANSWER INTERFACES =====
export {
  // Core question interfaces
  type Question,
  type QuestionMetadata,
  type QuestionPool,
  type QuestionPoolMetadata,
  type SelectedQuestions,
  type SelectionMetadata,
  
  // Answer interfaces
  type QuestionAnswer,
  type CategoryAnswers,
  type AnswerValidation,
  type AnswerValidationError,
  
  // Randomization and selection
  type RandomizationOptions,
  type QuestionSelectionResult,
  
  // Type guards
  isQuestion,
  isQuestionPool,
  
  // Utility types
  type QuestionIdsByCategory,
  type QuestionUpdate,
  type NewQuestion,
  type QuestionError,
} from './questions'

// ===== EXAM STATE AND MANAGEMENT =====
export {
  // Core exam state
  type TestState,
  type TestStateMetadata,
  type ExamProgress,
  type SectionProgress,
  
  // Exam context and navigation
  type ExamContext,
  type ExamNavigation,
  type ExamValidation,
  type ValidationError,
  type ExamPerformance,
  type PauseEvent,
  
  // Exam submission
  type ExamSubmission,
  
  // Type guards
  isValidTestState,
  isReadyForSubmission,
  
  // Utility types
  type TestStateUpdate,
  type AnswerUpdate,
  type SectionCompletionStatus,
  type SectionTimeTracking,
} from './exam'

// ===== SCORING AND RESULTS =====
export {
  // Main results interfaces
  type TestResults,
  type AnthemResult,
  type MultipleChoiceResult,
  type OverallResult,
  
  // Detailed analysis
  type CharacterDiff,
  type AnthemAnalysis,
  type AnthemLineStats,
  type ErrorPattern,
  type AnthemTiming,
  type TextQualityMetrics,
  
  // Answer results
  type AnswerResult,
  type MultipleChoiceAnalysis,
  
  // Analytics and performance
  type ResultAnalytics,
  type PerformanceTrends,
  type PerformanceBenchmarks,
  type ExamStatistics,
  
  // Score calculation utilities
  calculateAnthemAccuracy,
  calculateMultipleChoiceScore,
  isSectionPassed,
  
  // Type guards
  isValidTestResults,
  
  // Utility types
  type SectionScores,
  type SectionPassStatus,
  type PerformanceComparison,
  type ScoreRange,
} from './scoring'

// ===== SESSION MANAGEMENT =====
export {
  // Core session interfaces
  type SessionData,
  type SessionMetadata,
  type BrowserInfo,
  type SessionConfig,
  type SessionMigration,
  
  // Session operations
  type SessionPersistenceResult,
  type SessionError,
  type SessionErrorCode,
  
  // Session recovery
  type SessionRecovery,
  type SessionRecoveryOption,
  type SessionRecoveryPreview,
  
  // Auto-save functionality
  type AutoSaveConfig,
  type AutoSaveStatus,
  
  // Session synchronization
  type SessionSync,
  type SessionConflict,
  type StorageQuota,
  
  // Type guards
  isValidSessionData,
  isSessionExpired,
  isSessionCorrupted,
  
  // Utility types
  type SessionOperation,
  type SessionStatus,
  type StorageBackend,
  type SerializationFormat,
  type SessionUpdate,
  type SessionCleanupOptions,
} from './session'

// ===== VALIDATION AND ERROR HANDLING =====
export {
  // Core validation interfaces
  type ValidationRule,
  type ValidationContext,
  type FieldValidationResult,
  type ValidationResult,
  
  // Error and warning types
  type ValidationError as FormValidationError,
  type ValidationWarning,
  type ValidationInfo,
  type ValidationSummary,
  type ValidationMetadata,
  
  // Form validation schema
  type FormValidationSchema,
  type FieldDependency,
  type CustomValidator,
  
  // Real-time validation
  type RealTimeValidationConfig,
  type ValidationTrigger,
  
  // Section-specific validation
  type AnthemValidationConfig,
  type MultipleChoiceValidationConfig,
  type SessionValidationConfig,
  
  // Validation state management
  type ValidationState,
  type ValidationHistoryEntry,
  type BuiltInValidators,
  
  // Type guards
  isValidationError,
  isValidationSuccessful,
  canSubmitWithValidation,
  
  // Utility types
  type SectionValidationResults,
  type FieldValidationState,
  type ValidationRuleSet,
  type ErrorMessageLocalization,
  type ValidationStatusSummary,
} from './validation'

// ===== UTILITY AND HELPER TYPES =====

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

/**
 * Generic pagination interface
 */
export interface Pagination {
  page: number
  limit: number
  total: number
  hasNext: boolean
  hasPrevious: boolean
}

/**
 * Generic sort configuration
 */
export interface SortConfig<T = string> {
  field: T
  direction: 'asc' | 'desc'
}

/**
 * Generic filter configuration
 */
export interface FilterConfig<T = unknown> {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in'
  value: T
}

/**
 * Application state status
 */
export type AppStatus = 'loading' | 'ready' | 'error' | 'offline'

/**
 * Generic loading state
 */
export interface LoadingState {
  isLoading: boolean
  error?: string
  progress?: number
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto'
  primaryColor: string
  fontSize: 'small' | 'medium' | 'large'
  highContrast: boolean
}

/**
 * Accessibility preferences
 */
export interface AccessibilityConfig {
  screenReader: boolean
  keyboardNavigation: boolean
  reducedMotion: boolean
  highContrast: boolean
  fontSize: number
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: ThemeConfig
  accessibility: AccessibilityConfig
  language: string
  autoSave: boolean
  notifications: boolean
}

// ===== VERSION AND COMPATIBILITY =====

/**
 * Type system version information
 */
export const TYPE_SYSTEM_VERSION = '1.0.0'

/**
 * Compatible schema versions
 */
export const COMPATIBLE_VERSIONS = ['1.0.0'] as const

/**
 * Type for compatible version strings
 */
export type CompatibleVersion = typeof COMPATIBLE_VERSIONS[number]

/**
 * Migration information for version compatibility
 */
export interface TypeSystemMigration {
  fromVersion: string
  toVersion: string
  migrationFunction: (data: unknown) => unknown
  breaking: boolean
}

// ===== COMPLETE TYPE SYSTEM EXPORT =====

/**
 * All TypeScript interfaces and types are now exported above.
 * This completes the comprehensive type system for the Latvian
 * Citizenship Naturalization Exam web application.
 */