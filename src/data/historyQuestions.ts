/**
 * @fileoverview History Questions Database
 *
 * Contains all questions for the history section of the Latvian citizenship exam.
 * Questions are now loaded from the official JSON database to ensure accuracy
 * and consistency with the official exam materials.
 */

import type { Question } from '@/types/questions'
import { SCORING_THRESHOLDS } from '@/types/constants'
import { OFFICIAL_HISTORY_QUESTIONS } from './questionDatabase'

/**
 * Validation result for question pools
 */
interface ValidationResult {
  isValid: boolean
  errors: string[]
  questionCount: number
  minRequired: number
  category: string
}

/**
 * Complete set of history questions for the Latvian citizenship exam
 * Loaded from the official JSON database
 */
export const HISTORY_QUESTIONS: Question[] = OFFICIAL_HISTORY_QUESTIONS

/**
 * Validate the history question pool meets exam requirements
 */
export function validateHistoryQuestionPool(): ValidationResult {
  const errors: string[] = []
  const minRequired = SCORING_THRESHOLDS.MIN_HISTORY_POOL_SIZE

  // Check minimum pool size
  if (HISTORY_QUESTIONS.length < minRequired) {
    errors.push(
      `Insufficient history questions: ${HISTORY_QUESTIONS.length} (minimum ${minRequired} required)`
    )
  }

  // Validate each question structure
  HISTORY_QUESTIONS.forEach((question, index) => {
    const questionNum = index + 1

    if (!question.id || typeof question.id !== 'number') {
      errors.push(`History question ${questionNum}: Invalid or missing ID`)
    }

    if (!question.question?.trim()) {
      errors.push(`History question ${questionNum}: Missing question text`)
    }

    if (!Array.isArray(question.options) || question.options.length !== 3) {
      errors.push(
        `History question ${questionNum}: Must have exactly 3 options`
      )
    }

    if (
      typeof question.correctAnswer !== 'number' ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 2
    ) {
      errors.push(
        `History question ${questionNum}: Invalid correct answer index`
      )
    }

    if (question.category !== 'history') {
      errors.push(
        `History question ${questionNum}: Invalid category '${question.category}'`
      )
    }

    // Check for empty or duplicate options
    if (question.options) {
      const uniqueOptions = new Set(
        question.options.map((opt) => opt.trim().toLowerCase())
      )
      if (uniqueOptions.size !== 3) {
        errors.push(
          `History question ${questionNum}: Duplicate or empty options`
        )
      }
    }
  })

  // Check for duplicate question IDs
  const questionIds = HISTORY_QUESTIONS.map((q) => q.id)
  const uniqueIds = new Set(questionIds)
  if (uniqueIds.size !== questionIds.length) {
    errors.push('Duplicate question IDs found in history questions')
  }

  return {
    isValid: errors.length === 0,
    errors,
    questionCount: HISTORY_QUESTIONS.length,
    minRequired,
    category: 'history',
  }
}

/**
 * Get a random sample of history questions for testing/development
 */
export function getRandomHistoryQuestions(count: number = 5): Question[] {
  const shuffled = [...HISTORY_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, HISTORY_QUESTIONS.length))
}

/**
 * Get history question by ID
 */
export function getHistoryQuestionById(id: number): Question | undefined {
  return HISTORY_QUESTIONS.find((q) => q.id === id)
}

/**
 * Get history questions statistics
 */
export function getHistoryQuestionStats() {
  const validation = validateHistoryQuestionPool()

  return {
    total: HISTORY_QUESTIONS.length,
    isValid: validation.isValid,
    errors: validation.errors,
    minRequired: validation.minRequired,
    categories: {
      history: HISTORY_QUESTIONS.length,
    },
    difficultyDistribution: HISTORY_QUESTIONS.reduce(
      (acc, q) => {
        acc[q.difficulty || 'medium'] = (acc[q.difficulty || 'medium'] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ),
  }
}
