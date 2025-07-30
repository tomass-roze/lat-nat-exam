/**
 * @fileoverview Constitution Questions Database
 *
 * Contains all questions for the constitution section of the Latvian citizenship exam.
 * Questions are now loaded from the official JSON database to ensure accuracy
 * and consistency with the official exam materials.
 */

import type { Question } from '@/types/questions'
import { SCORING_THRESHOLDS } from '@/types/constants'
import { OFFICIAL_CONSTITUTION_QUESTIONS } from './questionDatabase'

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
 * Complete set of constitution questions for the Latvian citizenship exam
 * Loaded from the official JSON database
 */
export const CONSTITUTION_QUESTIONS: Question[] = OFFICIAL_CONSTITUTION_QUESTIONS

/**
 * Validate the constitution question pool meets exam requirements
 */
export function validateConstitutionQuestionPool(): ValidationResult {
  const errors: string[] = []
  const minRequired = SCORING_THRESHOLDS.MIN_CONSTITUTION_POOL_SIZE

  // Check minimum pool size
  if (CONSTITUTION_QUESTIONS.length < minRequired) {
    errors.push(
      `Insufficient constitution questions: ${CONSTITUTION_QUESTIONS.length} (minimum ${minRequired} required)`
    )
  }

  // Validate each question structure
  CONSTITUTION_QUESTIONS.forEach((question, index) => {
    const questionNum = index + 1

    if (!question.id || typeof question.id !== 'number') {
      errors.push(`Constitution question ${questionNum}: Invalid or missing ID`)
    }

    if (!question.question?.trim()) {
      errors.push(`Constitution question ${questionNum}: Missing question text`)
    }

    if (!Array.isArray(question.options) || question.options.length !== 3) {
      errors.push(`Constitution question ${questionNum}: Must have exactly 3 options`)
    }

    if (
      typeof question.correctAnswer !== 'number' ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 2
    ) {
      errors.push(`Constitution question ${questionNum}: Invalid correct answer index`)
    }

    if (question.category !== 'constitution') {
      errors.push(`Constitution question ${questionNum}: Invalid category '${question.category}'`)
    }

    // Check for empty or duplicate options
    if (question.options) {
      const uniqueOptions = new Set(question.options.map(opt => opt.trim().toLowerCase()))
      if (uniqueOptions.size !== 3) {
        errors.push(`Constitution question ${questionNum}: Duplicate or empty options`)
      }
    }
  })

  // Check for duplicate question IDs
  const questionIds = CONSTITUTION_QUESTIONS.map(q => q.id)
  const uniqueIds = new Set(questionIds)
  if (uniqueIds.size !== questionIds.length) {
    errors.push('Duplicate question IDs found in constitution questions')
  }

  return {
    isValid: errors.length === 0,
    errors,
    questionCount: CONSTITUTION_QUESTIONS.length,
    minRequired,
    category: 'constitution',
  }
}

/**
 * Get a random sample of constitution questions for testing/development
 */
export function getRandomConstitutionQuestions(count: number = 5): Question[] {
  const shuffled = [...CONSTITUTION_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, CONSTITUTION_QUESTIONS.length))
}

/**
 * Get constitution question by ID
 */
export function getConstitutionQuestionById(id: number): Question | undefined {
  return CONSTITUTION_QUESTIONS.find(q => q.id === id)
}

/**
 * Get constitution questions statistics
 */
export function getConstitutionQuestionStats() {
  const validation = validateConstitutionQuestionPool()
  
  return {
    total: CONSTITUTION_QUESTIONS.length,
    isValid: validation.isValid,
    errors: validation.errors,
    minRequired: validation.minRequired,
    categories: {
      constitution: CONSTITUTION_QUESTIONS.length,
    },
    difficultyDistribution: CONSTITUTION_QUESTIONS.reduce((acc, q) => {
      acc[q.difficulty || 'medium'] = (acc[q.difficulty || 'medium'] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }
}