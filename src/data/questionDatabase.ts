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
  rawQuestions:
    | RawQuestionData['historyQuestions']
    | RawQuestionData['constitutionQuestions'],
  category: 'history' | 'constitution'
): Question[] {
  return rawQuestions.map((rawQuestion) => ({
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
 * Enhanced validation result with additional metrics
 */
interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    anthemLines: number
    historyQuestions: number
    constitutionQuestions: number
    totalQuestions: number
    uniqueIds: number
    duplicateIds: number[]
    utf8Characters: {
      total: number
      byCharacter: Record<string, number>
    }
  }
  performance: {
    validationTimeMs: number
    memoryUsageMB: number
  }
}

/**
 * Latvian diacritical characters for UTF-8 validation
 */
const LATVIAN_DIACRITICS = [
  'ā',
  'ē',
  'ī',
  'ō',
  'ū',
  'ģ',
  'ķ',
  'ļ',
  'ņ',
  'š',
  'ž',
] as const

/**
 * Validate UTF-8 characters in text content
 */
function validateLatvianCharacters(text: string, context: string): string[] {
  const errors: string[] = []

  // Check for proper UTF-8 encoding
  try {
    const encoded = new TextEncoder().encode(text)
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded)
    if (decoded !== text) {
      errors.push(`${context}: UTF-8 encoding mismatch detected`)
    }
  } catch (e) {
    errors.push(`${context}: Invalid UTF-8 encoding`)
  }

  return errors
}

/**
 * Count Latvian diacritical characters in text
 */
function countLatvianCharacters(text: string): Record<string, number> {
  const counts: Record<string, number> = {}

  LATVIAN_DIACRITICS.forEach((char) => {
    const matches = text.match(new RegExp(char, 'g'))
    counts[char] = matches ? matches.length : 0
  })

  return counts
}

/**
 * Validate individual question with comprehensive checks
 */
function validateQuestion(
  question: any,
  index: number,
  category: 'history' | 'constitution'
): string[] {
  const errors: string[] = []
  const questionLabel = `${category} question ${index + 1} (ID: ${question.id})`

  // Basic structure validation
  if (typeof question.id !== 'number') {
    errors.push(`${questionLabel}: Invalid ID type (${typeof question.id})`)
  }

  if (typeof question.question !== 'string' || !question.question.trim()) {
    errors.push(`${questionLabel}: Invalid or empty question text`)
  } else {
    // UTF-8 validation for question text
    errors.push(...validateLatvianCharacters(question.question, questionLabel))

    // Question length validation
    if (question.question.length > 500) {
      errors.push(
        `${questionLabel}: Question text too long (${question.question.length} > 500 chars)`
      )
    }
  }

  // Options validation
  if (!Array.isArray(question.options)) {
    errors.push(`${questionLabel}: Options must be an array`)
  } else if (question.options.length !== 3) {
    errors.push(
      `${questionLabel}: Must have exactly 3 options, found ${question.options.length}`
    )
  } else {
    // Validate each option
    question.options.forEach((option: any, optIndex: number) => {
      if (typeof option !== 'string' || !option.trim()) {
        errors.push(
          `${questionLabel}, option ${optIndex + 1}: Invalid or empty option text`
        )
      } else {
        // UTF-8 validation for options
        errors.push(
          ...validateLatvianCharacters(
            option,
            `${questionLabel}, option ${optIndex + 1}`
          )
        )

        // Option length validation
        if (option.length > 200) {
          errors.push(
            `${questionLabel}, option ${optIndex + 1}: Option text too long (${option.length} > 200 chars)`
          )
        }
      }
    })

    // Check for duplicate options (case-insensitive)
    const normalizedOptions = question.options.map((opt: string) =>
      opt.trim().toLowerCase()
    )
    const uniqueOptions = new Set(normalizedOptions)
    if (uniqueOptions.size !== question.options.length) {
      errors.push(`${questionLabel}: Duplicate options detected`)
    }
  }

  // Correct answer validation
  if (
    typeof question.correctAnswer !== 'number' ||
    question.correctAnswer < 0 ||
    question.correctAnswer > 2
  ) {
    errors.push(
      `${questionLabel}: Invalid correct answer (${question.correctAnswer}), must be 0, 1, or 2`
    )
  }

  return errors
}

/**
 * Validate that the loaded data meets minimum requirements with comprehensive checks
 */
export function validateOfficialDatabase(): ValidationResult {
  const startTime = performance.now()
  const errors: string[] = []
  const warnings: string[] = []

  // Memory usage tracking
  const memoryBefore = process.memoryUsage().heapUsed

  // Validate anthem text
  if (!Array.isArray(rawData.nationalAnthem)) {
    errors.push('National anthem must be an array of strings')
  } else if (rawData.nationalAnthem.length !== 8) {
    errors.push(
      `National anthem must have exactly 8 lines, got ${rawData.nationalAnthem.length}`
    )
  } else {
    // Validate each anthem line
    rawData.nationalAnthem.forEach((line, index) => {
      if (typeof line !== 'string' || !line.trim()) {
        errors.push(`National anthem line ${index + 1}: Invalid or empty text`)
      } else {
        errors.push(
          ...validateLatvianCharacters(
            line,
            `National anthem line ${index + 1}`
          )
        )
      }
    })
  }

  // Validate history questions
  if (!Array.isArray(rawData.historyQuestions)) {
    errors.push('History questions must be an array')
  } else {
    rawData.historyQuestions.forEach((q, index) => {
      errors.push(...validateQuestion(q, index, 'history'))
    })
  }

  // Validate constitution questions
  if (!Array.isArray(rawData.constitutionQuestions)) {
    errors.push('Constitution questions must be an array')
  } else {
    rawData.constitutionQuestions.forEach((q, index) => {
      errors.push(...validateQuestion(q, index, 'constitution'))
    })
  }

  // Cross-pool validation: Check for duplicate IDs
  const historyIds = rawData.historyQuestions?.map((q) => q.id) || []
  const constitutionIds = rawData.constitutionQuestions?.map((q) => q.id) || []
  const allIds = [...historyIds, ...constitutionIds]
  const uniqueIds = new Set(allIds)

  const duplicateIds: number[] = []
  if (uniqueIds.size !== allIds.length) {
    // Find actual duplicates
    const seenIds = new Set<number>()
    allIds.forEach((id) => {
      if (seenIds.has(id)) {
        duplicateIds.push(id)
      } else {
        seenIds.add(id)
      }
    })

    errors.push(
      `Duplicate question IDs found across pools: ${[...new Set(duplicateIds)].sort((a, b) => a - b).join(', ')} ` +
        `(${allIds.length} total questions, ${uniqueIds.size} unique IDs)`
    )
  }

  // UTF-8 character analysis
  const allText = [
    ...(rawData.nationalAnthem || []),
    ...(rawData.historyQuestions || []).flatMap((q) => [
      q.question,
      ...q.options,
    ]),
    ...(rawData.constitutionQuestions || []).flatMap((q) => [
      q.question,
      ...q.options,
    ]),
  ].join(' ')

  const utf8Stats = countLatvianCharacters(allText)
  const totalUtf8Chars = Object.values(utf8Stats).reduce(
    (sum, count) => sum + count,
    0
  )

  // Performance metrics
  const endTime = performance.now()
  const memoryAfter = process.memoryUsage().heapUsed

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      anthemLines: rawData.nationalAnthem?.length || 0,
      historyQuestions: rawData.historyQuestions?.length || 0,
      constitutionQuestions: rawData.constitutionQuestions?.length || 0,
      totalQuestions:
        (rawData.historyQuestions?.length || 0) +
        (rawData.constitutionQuestions?.length || 0),
      uniqueIds: uniqueIds.size,
      duplicateIds,
      utf8Characters: {
        total: totalUtf8Chars,
        byCharacter: utf8Stats,
      },
    },
    performance: {
      validationTimeMs: Math.round((endTime - startTime) * 100) / 100,
      memoryUsageMB:
        Math.round(((memoryAfter - memoryBefore) / 1024 / 1024) * 100) / 100,
    },
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
    warnings: validation.warnings,
    performance: validation.performance,
    lastLoaded: Date.now(),
  }
}

/**
 * Validate cross-pool duplicate IDs specifically
 */
export function validateCrossPoolIds(): {
  isValid: boolean
  duplicateIds: number[]
  totalIds: number
  uniqueIds: number
  details: string
} {
  const historyIds = rawData.historyQuestions?.map((q) => q.id) || []
  const constitutionIds = rawData.constitutionQuestions?.map((q) => q.id) || []
  const allIds = [...historyIds, ...constitutionIds]
  const uniqueIds = new Set(allIds)

  const duplicateIds: number[] = []
  const seenIds = new Set<number>()

  allIds.forEach((id) => {
    if (seenIds.has(id)) {
      duplicateIds.push(id)
    } else {
      seenIds.add(id)
    }
  })

  const uniqueDuplicates = [...new Set(duplicateIds)].sort((a, b) => a - b)

  return {
    isValid: duplicateIds.length === 0,
    duplicateIds: uniqueDuplicates,
    totalIds: allIds.length,
    uniqueIds: uniqueIds.size,
    details:
      uniqueDuplicates.length > 0
        ? `IDs ${uniqueDuplicates.join(', ')} appear in both history and constitution pools`
        : 'No duplicate IDs found across question pools',
  }
}

/**
 * Get UTF-8 character statistics for Latvian language validation
 */
export function getUtf8CharacterStats(): {
  total: number
  byCharacter: Record<string, number>
  distribution: string
  coverage: number
} {
  const allText = [
    ...(rawData.nationalAnthem || []),
    ...(rawData.historyQuestions || []).flatMap((q) => [
      q.question,
      ...q.options,
    ]),
    ...(rawData.constitutionQuestions || []).flatMap((q) => [
      q.question,
      ...q.options,
    ]),
  ].join(' ')

  const utf8Stats = countLatvianCharacters(allText)
  const total = Object.values(utf8Stats).reduce((sum, count) => sum + count, 0)

  // Calculate coverage (how many different Latvian characters are used)
  const usedChars = Object.values(utf8Stats).filter((count) => count > 0).length
  const coverage = Math.round((usedChars / LATVIAN_DIACRITICS.length) * 100)

  // Create distribution string
  const distribution = LATVIAN_DIACRITICS.map(
    (char) => `${char}:${utf8Stats[char]}`
  ).join(', ')

  return {
    total,
    byCharacter: utf8Stats,
    distribution,
    coverage,
  }
}
