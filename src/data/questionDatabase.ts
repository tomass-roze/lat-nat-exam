/**
 * @fileoverview Official Question Database Loader
 * 
 * Loads the complete Latvian citizenship exam questions from the official JSON database.
 * Provides standardized data access for history and constitution questions with 
 * proper validation and type safety.
 */

import type { Question } from '@/types/questions'
import questionData from '../../latvian_citizenship_questions.json'

/**
 * Raw question data from JSON file
 */
interface RawQuestionData {
  nationalAnthem: string[]
  historyQuestions: Array<{
    id: number
    question: string
    options: [string, string, string]
    correctAnswer: number
  }>
  constitutionQuestions: Array<{
    id: number
    question: string
    options: [string, string, string]
    correctAnswer: number
  }>
}

/**
 * Type-safe access to the JSON data
 */
const rawData = questionData as RawQuestionData

/**
 * Official Latvian national anthem text from JSON database
 */
export const OFFICIAL_ANTHEM_TEXT = rawData.nationalAnthem

/**
 * Convert raw question data to typed Question objects
 */
function convertToQuestions(
  rawQuestions: RawQuestionData['historyQuestions'] | RawQuestionData['constitutionQuestions'],
  category: 'history' | 'constitution'
): Question[] {
  return rawQuestions.map(rawQuestion => ({
    id: rawQuestion.id,
    question: rawQuestion.question,
    options: rawQuestion.options,
    correctAnswer: rawQuestion.correctAnswer as 0 | 1 | 2,
    category,
    difficulty: 'medium' as const, // Default difficulty
  }))
}

/**
 * All history questions from the official database
 */
export const OFFICIAL_HISTORY_QUESTIONS: Question[] = convertToQuestions(
  rawData.historyQuestions,
  'history'
)

/**
 * All constitution questions from the official database  
 */
export const OFFICIAL_CONSTITUTION_QUESTIONS: Question[] = convertToQuestions(
  rawData.constitutionQuestions,
  'constitution'
)

/**
 * Validate that the loaded data meets minimum requirements
 */
export function validateOfficialDatabase(): {
  isValid: boolean
  errors: string[]
  stats: {
    anthemLines: number
    historyQuestions: number
    constitutionQuestions: number
  }
} {
  const errors: string[] = []
  
  // Validate anthem text
  if (!Array.isArray(rawData.nationalAnthem)) {
    errors.push('National anthem must be an array of strings')
  } else if (rawData.nationalAnthem.length !== 8) {
    errors.push(`National anthem must have exactly 8 lines, got ${rawData.nationalAnthem.length}`)
  }
  
  // Validate history questions
  if (!Array.isArray(rawData.historyQuestions)) {
    errors.push('History questions must be an array')
  } else {
    rawData.historyQuestions.forEach((q, index) => {
      if (typeof q.id !== 'number') {
        errors.push(`History question ${index + 1}: invalid ID`)
      }
      if (typeof q.question !== 'string' || !q.question.trim()) {
        errors.push(`History question ${index + 1}: invalid question text`)
      }
      if (!Array.isArray(q.options) || q.options.length !== 3) {
        errors.push(`History question ${index + 1}: must have exactly 3 options`)
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 2) {
        errors.push(`History question ${index + 1}: invalid correct answer`)
      }
    })
  }
  
  // Validate constitution questions
  if (!Array.isArray(rawData.constitutionQuestions)) {
    errors.push('Constitution questions must be an array')
  } else {
    rawData.constitutionQuestions.forEach((q, index) => {
      if (typeof q.id !== 'number') {
        errors.push(`Constitution question ${index + 1}: invalid ID`)
      }
      if (typeof q.question !== 'string' || !q.question.trim()) {
        errors.push(`Constitution question ${index + 1}: invalid question text`)
      }
      if (!Array.isArray(q.options) || q.options.length !== 3) {
        errors.push(`Constitution question ${index + 1}: must have exactly 3 options`)
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 2) {
        errors.push(`Constitution question ${index + 1}: invalid correct answer`)
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    stats: {
      anthemLines: rawData.nationalAnthem?.length || 0,
      historyQuestions: rawData.historyQuestions?.length || 0,
      constitutionQuestions: rawData.constitutionQuestions?.length || 0,
    }
  }
}

/**
 * Get database statistics for monitoring/debugging
 */
export function getDatabaseStats() {
  const validation = validateOfficialDatabase()
  
  return {
    ...validation.stats,
    isValid: validation.isValid,
    errors: validation.errors,
    lastLoaded: Date.now(),
  }
}