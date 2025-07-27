/**
 * @fileoverview Core exam interfaces for test state management and progress tracking
 * 
 * Defines the main interfaces for managing exam state, progress, and user interaction
 * during the Latvian citizenship naturalization exam.
 */

import type { ExamSection } from './constants'
import type { SelectedQuestions } from './questions'

/**
 * Complete state of an active exam session
 */
export interface TestState {
  /** User's entered national anthem text */
  anthemText: string
  
  /** User's answers to history questions (questionId -> selectedAnswer) */
  historyAnswers: Record<number, 0 | 1 | 2>
  
  /** User's answers to constitution questions (questionId -> selectedAnswer) */
  constitutionAnswers: Record<number, 0 | 1 | 2>
  
  /** Timestamp when the exam was started */
  startTime: number
  
  /** Timestamp of the last auto-save */
  lastSaved: number
  
  /** Whether the exam has been completed and submitted */
  isCompleted: boolean
  
  /** Current active section of the exam */
  currentSection: ExamSection
  
  /** Questions selected for this exam session */
  selectedQuestions: SelectedQuestions
  
  /** Additional state metadata */
  metadata: TestStateMetadata
}

/**
 * Metadata associated with test state
 */
export interface TestStateMetadata {
  /** Unique session identifier */
  sessionId: string
  
  /** Browser/client timezone */
  timezone: string
  
  /** User agent information */
  userAgent?: string
  
  /** Screen resolution when exam started */
  screenResolution?: {
    width: number
    height: number
  }
  
  /** Exam attempt number (for retakes) */
  attemptNumber: number
  
  /** Whether dark mode was enabled */
  darkMode: boolean
}

/**
 * Progress tracking for exam completion
 */
export interface ExamProgress {
  /** Anthem section completion status */
  anthem: SectionProgress
  
  /** History section completion status */
  history: SectionProgress
  
  /** Constitution section completion status */
  constitution: SectionProgress
  
  /** Overall progress percentage (0-100) */
  overallProgress: number
  
  /** Estimated time remaining in minutes */
  estimatedTimeRemaining?: number
}

/**
 * Progress for an individual exam section
 */
export interface SectionProgress {
  /** Whether this section is completed */
  isCompleted: boolean
  
  /** Progress percentage for this section (0-100) */
  progressPercentage: number
  
  /** Number of items completed */
  itemsCompleted: number
  
  /** Total number of items in this section */
  totalItems: number
  
  /** Time spent on this section in milliseconds */
  timeSpent: number
  
  /** Whether this section is currently active */
  isActive: boolean
}

/**
 * Current exam context and navigation state
 */
export interface ExamContext {
  /** Current test state */
  testState: TestState
  
  /** Current progress */
  progress: ExamProgress
  
  /** Navigation state */
  navigation: ExamNavigation
  
  /** Validation state */
  validation: ExamValidation
  
  /** Performance metrics */
  performance: ExamPerformance
}

/**
 * Navigation state for the exam interface
 */
export interface ExamNavigation {
  /** Current section being viewed */
  currentSection: ExamSection
  
  /** Whether user can navigate to next section */
  canNavigateNext: boolean
  
  /** Whether user can navigate to previous section */
  canNavigatePrevious: boolean
  
  /** Available sections for navigation */
  availableSections: ExamSection[]
  
  /** Section completion requirements met */
  completionRequirements: Record<ExamSection, boolean>
}

/**
 * Real-time validation state
 */
export interface ExamValidation {
  /** Whether current state is valid for submission */
  isValidForSubmission: boolean
  
  /** Validation errors by section */
  sectionErrors: Record<ExamSection, ValidationError[]>
  
  /** Global validation errors */
  globalErrors: ValidationError[]
  
  /** Last validation timestamp */
  lastValidated: number
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: string
  
  /** Human-readable error message in Latvian */
  message: string
  
  /** Section where error occurred */
  section: ExamSection
  
  /** Specific field if applicable */
  field?: string
  
  /** Error severity level */
  severity: 'error' | 'warning' | 'info'
}

/**
 * Performance tracking metrics
 */
export interface ExamPerformance {
  /** Total time spent on exam in milliseconds */
  totalTimeSpent: number
  
  /** Time spent per section */
  sectionTimes: Record<ExamSection, number>
  
  /** Number of times user switched sections */
  sectionSwitches: number
  
  /** Typing speed for anthem section (characters per minute) */
  typingSpeed?: number
  
  /** Number of answer changes */
  answerChanges: number
  
  /** Pause/resume events */
  pauseEvents: PauseEvent[]
}

/**
 * Pause event tracking
 */
export interface PauseEvent {
  /** When the pause started */
  pausedAt: number
  
  /** When the user resumed (undefined if still paused) */
  resumedAt?: number
  
  /** Reason for pause if known */
  reason?: 'user_action' | 'window_blur' | 'page_hidden' | 'network_issue'
}

/**
 * Exam submission preparation
 */
export interface ExamSubmission {
  /** Final test state at submission */
  finalState: TestState
  
  /** Submission timestamp */
  submittedAt: number
  
  /** Pre-submission validation results */
  validationResults: ExamValidation
  
  /** User confirmation of submission */
  userConfirmed: boolean
  
  /** Submission attempt number */
  attemptNumber: number
}

/**
 * Type guards for exam state validation
 */

/**
 * Check if test state is valid and complete
 */
export function isValidTestState(state: unknown): state is TestState {
  return (
    typeof state === 'object' &&
    state !== null &&
    typeof (state as TestState).anthemText === 'string' &&
    typeof (state as TestState).historyAnswers === 'object' &&
    typeof (state as TestState).constitutionAnswers === 'object' &&
    typeof (state as TestState).startTime === 'number' &&
    typeof (state as TestState).isCompleted === 'boolean'
  )
}

/**
 * Check if exam is ready for submission
 */
export function isReadyForSubmission(context: ExamContext): boolean {
  const { testState, validation } = context
  
  // Must have anthem text with minimum length
  if (testState.anthemText.length < 100) return false
  
  // Must have all history questions answered
  const historyCount = Object.keys(testState.historyAnswers).length
  if (historyCount < 10) return false
  
  // Must have all constitution questions answered
  const constitutionCount = Object.keys(testState.constitutionAnswers).length
  if (constitutionCount < 8) return false
  
  // Must pass validation
  return validation.isValidForSubmission
}

/**
 * Utility types for test state management
 */

/** Partial test state for updates */
export type TestStateUpdate = Partial<Pick<TestState, 'anthemText' | 'currentSection' | 'isCompleted'>>

/** Answer update for multiple choice sections */
export type AnswerUpdate = {
  section: 'history' | 'constitution'
  questionId: number
  answer: 0 | 1 | 2
}

/** Section completion status */
export type SectionCompletionStatus = {
  [K in ExamSection]: boolean
}

/** Time tracking by section */
export type SectionTimeTracking = {
  [K in ExamSection]: number
}