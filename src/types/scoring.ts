/**
 * @fileoverview Scoring and results interfaces for the Latvian Citizenship Exam
 * 
 * Defines comprehensive interfaces for exam results, scoring calculations,
 * and performance analysis across all three exam sections.
 */

import type { ExamSection } from './constants'
import type { Question } from './questions'

/**
 * Complete exam results for all sections
 */
export interface TestResults {
  /** National anthem section results */
  anthem: AnthemResult
  
  /** History questions section results */
  history: MultipleChoiceResult
  
  /** Constitution questions section results */
  constitution: MultipleChoiceResult
  
  /** Overall exam result */
  overall: OverallResult
  
  /** When results were calculated */
  calculatedAt: number
  
  /** Performance analytics */
  analytics: ResultAnalytics
}

/**
 * Results for the national anthem section
 */
export interface AnthemResult {
  /** Whether the anthem section was passed (≥75% accuracy) */
  passed: boolean
  
  /** Accuracy percentage (0-100) */
  accuracy: number
  
  /** Character-by-character differences from reference text */
  characterDifferences: CharacterDiff[]
  
  /** User's submitted text */
  submittedText: string
  
  /** Reference text used for comparison */
  referenceText: string
  
  /** Total characters in reference text */
  totalCharacters: number
  
  /** Number of correct characters */
  correctCharacters: number
  
  /** Detailed analysis of the submission */
  analysis: AnthemAnalysis
}

/**
 * Character difference information for anthem analysis
 */
export interface CharacterDiff {
  /** Position in the text */
  position: number
  
  /** Expected character */
  expected: string
  
  /** User's actual character */
  actual: string
  
  /** Type of difference */
  type: 'missing' | 'extra' | 'incorrect' | 'correct'
  
  /** Line number where difference occurs */
  lineNumber: number
  
  /** Character position within the line */
  linePosition: number
}

/**
 * Detailed analysis of anthem submission
 */
export interface AnthemAnalysis {
  /** Statistics by line */
  lineStats: AnthemLineStats[]
  
  /** Common error patterns detected */
  errorPatterns: ErrorPattern[]
  
  /** Timing information */
  timing: AnthemTiming
  
  /** Text quality metrics */
  qualityMetrics: TextQualityMetrics
}

/**
 * Statistics for individual anthem lines
 */
export interface AnthemLineStats {
  /** Line number (1-based) */
  lineNumber: number
  
  /** Accuracy for this line (0-100) */
  accuracy: number
  
  /** Whether this line passed individually */
  passed: boolean
  
  /** Number of errors in this line */
  errorCount: number
  
  /** Expected line text */
  expected: string
  
  /** User's submitted line text */
  submitted: string
}

/**
 * Error pattern detection
 */
export interface ErrorPattern {
  /** Type of error pattern */
  type: 'diacritic_missing' | 'case_error' | 'word_order' | 'spelling' | 'punctuation'
  
  /** Number of occurrences */
  count: number
  
  /** Specific examples */
  examples: string[]
  
  /** Suggested improvement */
  suggestion?: string
}

/**
 * Timing information for anthem section
 */
export interface AnthemTiming {
  /** Time spent typing (milliseconds) */
  typingTime: number
  
  /** Estimated typing speed (characters per minute) */
  typingSpeed: number
  
  /** Number of pauses longer than 5 seconds */
  longPauses: number
  
  /** Time between starting and first character */
  thinkingTime: number
}

/**
 * Text quality metrics
 */
export interface TextQualityMetrics {
  /** Character encoding issues detected */
  encodingIssues: boolean
  
  /** Excessive whitespace detected */
  whitespaceIssues: boolean
  
  /** Non-standard characters detected */
  nonStandardCharacters: string[]
  
  /** Overall text quality score (0-100) */
  qualityScore: number
}

/**
 * Results for multiple choice sections (history/constitution)
 */
export interface MultipleChoiceResult {
  /** Whether this section was passed */
  passed: boolean
  
  /** Number of correct answers */
  correct: number
  
  /** Total number of questions */
  total: number
  
  /** Percentage score (0-100) */
  percentage: number
  
  /** Detailed answer results */
  answers: AnswerResult[]
  
  /** Section-specific analysis */
  analysis: MultipleChoiceAnalysis
  
  /** Required score to pass */
  passingScore: number
}

/**
 * Result for individual question answer
 */
export interface AnswerResult {
  /** Question that was answered */
  question: Question
  
  /** User's selected answer (0, 1, or 2) */
  selectedAnswer: 0 | 1 | 2
  
  /** Whether the answer was correct */
  isCorrect: boolean
  
  /** Time taken to answer (milliseconds) */
  timeToAnswer: number
  
  /** Correct answer index */
  correctAnswer: 0 | 1 | 2
  
  /** Answer confidence (if tracked) */
  confidence?: number
}

/**
 * Analysis for multiple choice section performance
 */
export interface MultipleChoiceAnalysis {
  /** Average time per question (milliseconds) */
  averageTimePerQuestion: number
  
  /** Questions answered correctly on first try */
  firstTryCorrect: number
  
  /** Distribution of answer choices */
  answerDistribution: {
    option0: number
    option1: number
    option2: number
  }
  
  /** Performance by difficulty level */
  difficultyPerformance?: {
    easy: { correct: number; total: number }
    medium: { correct: number; total: number }
    hard: { correct: number; total: number }
  }
  
  /** Fastest and slowest questions */
  timingStats: {
    fastest: AnswerResult
    slowest: AnswerResult
    median: number
  }
}

/**
 * Overall exam result summary
 */
export interface OverallResult {
  /** Whether the entire exam was passed */
  passed: boolean
  
  /** Overall score percentage */
  overallScore: number
  
  /** Pass/fail status by section */
  sectionResults: {
    anthem: boolean
    history: boolean
    constitution: boolean
  }
  
  /** Total exam time (milliseconds) */
  totalTime: number
  
  /** Exam completion timestamp */
  completedAt: number
  
  /** Certificate eligibility status */
  certificateEligible: boolean
}

/**
 * Comprehensive analytics for exam performance
 */
export interface ResultAnalytics {
  /** Performance trends */
  trends: PerformanceTrends
  
  /** Comparison with average performance */
  benchmarks: PerformanceBenchmarks
  
  /** Areas for improvement */
  recommendations: string[]
  
  /** Strengths identified */
  strengths: string[]
  
  /** Detailed statistics */
  statistics: ExamStatistics
}

/**
 * Performance trends during the exam
 */
export interface PerformanceTrends {
  /** Accuracy trend over time */
  accuracyTrend: 'improving' | 'declining' | 'stable'
  
  /** Speed trend over time */
  speedTrend: 'improving' | 'declining' | 'stable'
  
  /** Confidence trend (if available) */
  confidenceTrend?: 'improving' | 'declining' | 'stable'
}

/**
 * Performance benchmarks and comparisons
 */
export interface PerformanceBenchmarks {
  /** Percentile ranking (0-100) */
  percentileRanking: number
  
  /** Above/below average indicators */
  comparedToAverage: {
    anthem: 'above' | 'below' | 'average'
    history: 'above' | 'below' | 'average'
    constitution: 'above' | 'below' | 'average'
    timing: 'above' | 'below' | 'average'
  }
}

/**
 * Detailed exam statistics
 */
export interface ExamStatistics {
  /** Total characters typed */
  totalCharactersTyped: number
  
  /** Total questions answered */
  totalQuestionsAnswered: number
  
  /** Number of answer changes */
  answerChanges: number
  
  /** Time distribution by section */
  timeDistribution: Record<ExamSection, number>
  
  /** Error statistics */
  errorStats: {
    totalErrors: number
    errorsByType: Record<string, number>
    mostCommonError: string
  }
}

/**
 * Score calculation utilities
 */

/**
 * Calculate anthem accuracy percentage
 */
export function calculateAnthemAccuracy(_submitted: string, _reference: string): number {
  // Implementation would go here - this is just the type definition
  return 0
}

/**
 * Calculate multiple choice percentage
 */
export function calculateMultipleChoiceScore(correct: number, total: number): number {
  return Math.round((correct / total) * 100)
}

/**
 * Determine if exam section passed
 */
export function isSectionPassed(_section: ExamSection, _score: number): boolean {
  // Implementation would use SCORING_THRESHOLDS from constants
  return false
}

/**
 * Type guards for result validation
 */

/**
 * Check if object is valid TestResults
 */
export function isValidTestResults(obj: unknown): obj is TestResults {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as TestResults).anthem === 'object' &&
    typeof (obj as TestResults).history === 'object' &&
    typeof (obj as TestResults).constitution === 'object' &&
    typeof (obj as TestResults).overall === 'object'
  )
}

/**
 * Utility types for score calculations
 */

/** Score summary by section */
export type SectionScores = {
  [K in ExamSection]: number
}

/** Pass/fail status by section */
export type SectionPassStatus = {
  [K in ExamSection]: boolean
}

/** Performance comparison result */
export type PerformanceComparison = 'better' | 'worse' | 'same'

/** Score range definition */
export type ScoreRange = {
  min: number
  max: number
  label: string
}