/**
 * @fileoverview Question Loading and Randomization Utilities
 *
 * Provides functions for loading, selecting, and randomizing questions for the
 * Latvian citizenship exam. Handles both history and constitution question pools
 * with proper randomization and validation.
 *
 * Now includes lazy loading support for improved performance.
 */

import type {
  Question,
  SelectedQuestions,
  SelectionMetadata,
} from '@/types/questions'
import {
  CONSTITUTION_QUESTIONS,
  validateConstitutionQuestionPool,
} from '@/data/constitutionQuestions'
import {
  HISTORY_QUESTIONS,
  validateHistoryQuestionPool,
} from '@/data/historyQuestions'
import { SCORING_THRESHOLDS } from '@/types/constants'
import {
  loadExamQuestionsLazy,
  preloadQuestions,
} from '@/utils/lazyQuestionLoader'

/**
 * Error thrown when question loading fails
 */
export class QuestionLoadingError extends Error {
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'QuestionLoadingError'
  }
}

/**
 * Seeded random number generator for reproducible randomization
 * Uses a simple Linear Congruential Generator (LCG) algorithm
 */
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min
  }
}

/**
 * Shuffle an array using Fisher-Yates algorithm with seeded randomization
 */
function shuffleArray<T>(array: T[], random: SeededRandom): T[] {
  const shuffled = [...array]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = random.nextInt(0, i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

/**
 * Shuffle answer options within a question while maintaining correct answer tracking
 */
function shuffleQuestionOptions(
  question: Question,
  random: SeededRandom
): Question {
  const originalOptions = [...question.options]
  const indices = [0, 1, 2]
  const shuffledIndices = shuffleArray(indices, random)

  // Create new options array in shuffled order
  const shuffledOptions: [string, string, string] = [
    originalOptions[shuffledIndices[0]],
    originalOptions[shuffledIndices[1]],
    originalOptions[shuffledIndices[2]],
  ]

  // Find where the original correct answer ended up
  const newCorrectAnswer = shuffledIndices.indexOf(question.correctAnswer) as
    | 0
    | 1
    | 2

  return {
    ...question,
    options: shuffledOptions,
    correctAnswer: newCorrectAnswer,
  }
}

/**
 * Validate question pool before selection
 */
function validateQuestionPool(
  questions: Question[],
  category: 'constitution' | 'history',
  minSize: number
): void {
  if (!Array.isArray(questions)) {
    throw new QuestionLoadingError(`Invalid question pool: not an array`)
  }

  if (questions.length < minSize) {
    throw new QuestionLoadingError(
      `Insufficient ${category} questions: ${questions.length} (minimum ${minSize} required)`
    )
  }

  // Validate each question
  questions.forEach((question, index) => {
    if (!question.id || typeof question.id !== 'number') {
      throw new QuestionLoadingError(
        `Question ${index + 1}: Invalid or missing ID`
      )
    }

    if (!question.question?.trim()) {
      throw new QuestionLoadingError(
        `Question ${index + 1}: Missing question text`
      )
    }

    if (!Array.isArray(question.options) || question.options.length !== 3) {
      throw new QuestionLoadingError(
        `Question ${index + 1}: Must have exactly 3 options`
      )
    }

    if (
      typeof question.correctAnswer !== 'number' ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 2
    ) {
      throw new QuestionLoadingError(
        `Question ${index + 1}: Invalid correct answer index`
      )
    }

    if (question.category !== category) {
      throw new QuestionLoadingError(
        `Question ${index + 1}: Expected category '${category}', got '${question.category}'`
      )
    }
  })
}

/**
 * Select random questions from a pool
 */
function selectRandomQuestions(
  questions: Question[],
  count: number,
  random: SeededRandom
): Question[] {
  if (questions.length < count) {
    throw new QuestionLoadingError(
      `Cannot select ${count} questions from pool of ${questions.length}`
    )
  }

  // Shuffle the entire pool and take the first 'count' questions
  const shuffledQuestions = shuffleArray(questions, random)
  return shuffledQuestions.slice(0, count)
}

/**
 * Load and select constitution questions for an exam session
 */
export function loadConstitutionQuestions(randomSeed?: number): {
  questions: Question[]
  selectionMetadata: Partial<SelectionMetadata>
} {
  // Validate question pool first
  const validation = validateConstitutionQuestionPool()
  if (!validation.isValid) {
    throw new QuestionLoadingError(
      `Constitution question pool validation failed: ${validation.errors.join(', ')}`
    )
  }

  // Additional runtime validation
  validateQuestionPool(
    CONSTITUTION_QUESTIONS,
    'constitution',
    SCORING_THRESHOLDS.MIN_CONSTITUTION_POOL_SIZE
  )

  // Use provided seed or generate one
  const seed = randomSeed ?? Date.now()
  const random = new SeededRandom(seed)

  // Select random questions
  const selectedQuestions = selectRandomQuestions(
    CONSTITUTION_QUESTIONS,
    SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS,
    random
  )

  // Shuffle answer options for each selected question
  const questionsWithShuffledOptions = selectedQuestions.map((question) =>
    shuffleQuestionOptions(question, random)
  )

  // Create selection metadata
  const selectionMetadata: Partial<SelectionMetadata> = {
    selectedAt: Date.now(),
    randomSeed: seed,
    selectedIds: {
      history: [],
      constitution: questionsWithShuffledOptions.map((q) => q.id),
    },
  }

  return {
    questions: questionsWithShuffledOptions,
    selectionMetadata,
  }
}

/**
 * Load and select history questions for an exam session
 */
export function loadHistoryQuestions(randomSeed?: number): {
  questions: Question[]
  selectionMetadata: Partial<SelectionMetadata>
} {
  // Validate question pool first
  const validation = validateHistoryQuestionPool()
  if (!validation.isValid) {
    throw new QuestionLoadingError(
      `History question pool validation failed: ${validation.errors.join(', ')}`
    )
  }

  // Additional runtime validation
  validateQuestionPool(
    HISTORY_QUESTIONS,
    'history',
    SCORING_THRESHOLDS.MIN_HISTORY_POOL_SIZE
  )

  // Use provided seed or generate one
  const seed = randomSeed ?? Date.now()
  const random = new SeededRandom(seed)

  // Select random questions
  const selectedQuestions = selectRandomQuestions(
    HISTORY_QUESTIONS,
    SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS,
    random
  )

  // Shuffle answer options for each selected question
  const questionsWithShuffledOptions = selectedQuestions.map((question) =>
    shuffleQuestionOptions(question, random)
  )

  // Create selection metadata
  const selectionMetadata: Partial<SelectionMetadata> = {
    selectedAt: Date.now(),
    randomSeed: seed,
    selectedIds: {
      history: questionsWithShuffledOptions.map((q) => q.id),
      constitution: [],
    },
  }

  return {
    questions: questionsWithShuffledOptions,
    selectionMetadata,
  }
}

/**
 * Load all questions for an exam session
 */
export function loadExamQuestions(randomSeed?: number): SelectedQuestions {
  const seed = randomSeed ?? Date.now()

  try {
    // Load constitution questions
    const constitutionResult = loadConstitutionQuestions(seed)

    // Load history questions (placeholder)
    const historyResult = loadHistoryQuestions(seed + 1) // Different seed for history

    // Combine selection metadata
    const combinedMetadata: SelectionMetadata = {
      selectedAt: Date.now(),
      randomSeed: seed,
      selectedIds: {
        history: historyResult.selectionMetadata.selectedIds?.history || [],
        constitution:
          constitutionResult.selectionMetadata.selectedIds?.constitution || [],
      },
    }

    return {
      history: historyResult.questions,
      constitution: constitutionResult.questions,
      selectionMetadata: combinedMetadata,
    }
  } catch (error) {
    if (error instanceof QuestionLoadingError) {
      throw error
    }

    throw new QuestionLoadingError(
      `Failed to load exam questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Load exam questions with lazy loading for performance optimization
 * This is the preferred method for production use
 */
export async function loadExamQuestionsAsync(
  randomSeed?: number
): Promise<SelectedQuestions> {
  try {
    // Use lazy loading for better performance
    const lazyResult = await loadExamQuestionsLazy()

    // Add selection metadata for compatibility
    const metadata: SelectionMetadata = {
      selectedAt: Date.now(),
      randomSeed: randomSeed ?? Date.now(),
      selectedIds: {
        history: lazyResult.history.map((q) => q.id),
        constitution: lazyResult.constitution.map((q) => q.id),
      },
    }

    return {
      ...lazyResult,
      selectionMetadata: metadata,
    }
  } catch (error) {
    // Fallback to synchronous loading if lazy loading fails
    console.warn(
      'Lazy loading failed, falling back to synchronous loading:',
      error
    )
    return loadExamQuestions(randomSeed)
  }
}

/**
 * Preload questions for better user experience
 * Call this during application startup
 */
export function initializeQuestionPreloading(): void {
  preloadQuestions()
}

/**
 * Validate selected questions meet exam requirements
 */
export function validateSelectedQuestions(
  selectedQuestions: SelectedQuestions
): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check constitution questions
  if (
    selectedQuestions.constitution.length !==
    SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS
  ) {
    errors.push(
      `Constitution questions: expected ${SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS}, got ${selectedQuestions.constitution.length}`
    )
  }

  // Check history questions (when implemented)
  if (
    selectedQuestions.history.length !==
      SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS &&
    selectedQuestions.history.length !== 0
  ) {
    // Allow 0 for placeholder
    errors.push(
      `History questions: expected ${SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS}, got ${selectedQuestions.history.length}`
    )
  }

  // Validate question structure
  const allQuestions = [
    ...selectedQuestions.constitution,
    ...selectedQuestions.history,
  ]
  allQuestions.forEach((question, index) => {
    if (!question.id || typeof question.id !== 'number') {
      errors.push(`Question ${index + 1}: Invalid or missing ID`)
    }

    if (!question.question?.trim()) {
      errors.push(`Question ${index + 1}: Missing question text`)
    }

    if (!Array.isArray(question.options) || question.options.length !== 3) {
      errors.push(`Question ${index + 1}: Must have exactly 3 options`)
    }

    if (
      typeof question.correctAnswer !== 'number' ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 2
    ) {
      errors.push(`Question ${index + 1}: Invalid correct answer index`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  loadingTimeMs: number
  memoryUsageMB: number
  questionsPerSecond: number
  seedGenerationTimeMs: number
  validationTimeMs: number
  shufflingTimeMs: number
}

/**
 * Enhanced question loading with performance monitoring
 */
export function loadExamQuestionsWithMetrics(randomSeed?: number): {
  questions: SelectedQuestions
  performance: PerformanceMetrics
} {
  const startTime = performance.now()
  const memoryBefore = process.memoryUsage().heapUsed

  // Seed generation timing
  const seedStart = performance.now()
  const seed = randomSeed ?? Date.now()
  const seedTime = performance.now() - seedStart

  // Validation timing
  const validationStart = performance.now()
  const constitutionValidation = validateConstitutionQuestionPool()
  const historyValidation = validateHistoryQuestionPool()
  const validationTime = performance.now() - validationStart

  if (!constitutionValidation.isValid || !historyValidation.isValid) {
    throw new QuestionLoadingError(
      `Question pool validation failed: ${[
        ...constitutionValidation.errors,
        ...historyValidation.errors,
      ].join(', ')}`
    )
  }

  // Question loading timing
  const loadingStart = performance.now()

  try {
    // Load with performance-optimized approach
    const constitutionResult = loadConstitutionQuestions(seed)
    const historyResult = loadHistoryQuestions(seed + 1)

    const combinedMetadata: SelectionMetadata = {
      selectedAt: Date.now(),
      randomSeed: seed,
      selectedIds: {
        history: historyResult.selectionMetadata.selectedIds?.history || [],
        constitution:
          constitutionResult.selectionMetadata.selectedIds?.constitution || [],
      },
    }

    const questions: SelectedQuestions = {
      history: historyResult.questions,
      constitution: constitutionResult.questions,
      selectionMetadata: combinedMetadata,
    }

    const loadingTime = performance.now() - loadingStart

    // Calculate performance metrics
    const totalTime = performance.now() - startTime
    const memoryAfter = process.memoryUsage().heapUsed
    const totalQuestions =
      questions.history.length + questions.constitution.length

    const performanceMetrics: PerformanceMetrics = {
      loadingTimeMs: Math.round(totalTime * 100) / 100,
      memoryUsageMB:
        Math.round(((memoryAfter - memoryBefore) / 1024 / 1024) * 100) / 100,
      questionsPerSecond:
        Math.round((totalQuestions / (totalTime / 1000)) * 100) / 100,
      seedGenerationTimeMs: Math.round(seedTime * 100) / 100,
      validationTimeMs: Math.round(validationTime * 100) / 100,
      shufflingTimeMs: Math.round(loadingTime * 100) / 100,
    }

    return {
      questions,
      performance: performanceMetrics,
    }
  } catch (error) {
    if (error instanceof QuestionLoadingError) {
      throw error
    }

    throw new QuestionLoadingError(
      `Failed to load exam questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Benchmark question loading performance
 */
export function benchmarkQuestionLoading(iterations: number = 100): {
  averageLoadTimeMs: number
  minLoadTimeMs: number
  maxLoadTimeMs: number
  totalQuestions: number
  averageQuestionsPerSecond: number
  memoryUsageMB: number
} {
  const loadTimes: number[] = []
  let totalQuestions = 0
  const memoryBefore = process.memoryUsage().heapUsed

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()
    const result = loadExamQuestions(Date.now() + i)
    const loadTime = performance.now() - startTime

    loadTimes.push(loadTime)
    totalQuestions = result.history.length + result.constitution.length
  }

  const memoryAfter = process.memoryUsage().heapUsed
  const averageLoadTime =
    loadTimes.reduce((sum, time) => sum + time, 0) / iterations

  return {
    averageLoadTimeMs: Math.round(averageLoadTime * 100) / 100,
    minLoadTimeMs: Math.round(Math.min(...loadTimes) * 100) / 100,
    maxLoadTimeMs: Math.round(Math.max(...loadTimes) * 100) / 100,
    totalQuestions,
    averageQuestionsPerSecond:
      Math.round((totalQuestions / (averageLoadTime / 1000)) * 100) / 100,
    memoryUsageMB:
      Math.round(((memoryAfter - memoryBefore) / 1024 / 1024) * 100) / 100,
  }
}

/**
 * Get question statistics for debugging/monitoring with enhanced metrics
 */
export function getQuestionPoolStats(): {
  constitution: {
    total: number
    minRequired: number
    isValid: boolean
    coverage: number
  }
  history: {
    total: number
    minRequired: number
    isValid: boolean
    coverage: number
  }
  performance: {
    poolSizeRatio: number
    expectedLoadTimeMs: number
    memoryFootprintMB: number
  }
} {
  const constitutionValidation = validateConstitutionQuestionPool()
  const historyValidation = validateHistoryQuestionPool()

  // Calculate coverage ratios
  const constitutionCoverage = Math.round(
    (CONSTITUTION_QUESTIONS.length /
      SCORING_THRESHOLDS.MIN_CONSTITUTION_POOL_SIZE) *
      100
  )
  const historyCoverage = Math.round(
    (HISTORY_QUESTIONS.length / SCORING_THRESHOLDS.MIN_HISTORY_POOL_SIZE) * 100
  )

  // Estimate performance metrics
  const totalQuestions =
    CONSTITUTION_QUESTIONS.length + HISTORY_QUESTIONS.length
  const poolSizeRatio =
    totalQuestions /
    (SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS +
      SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS)

  // Rough estimation based on question pool size (empirically derived)
  const expectedLoadTimeMs = Math.round((totalQuestions * 0.1 + 5) * 100) / 100
  const memoryFootprintMB = Math.round(totalQuestions * 0.002 * 100) / 100

  return {
    constitution: {
      total: CONSTITUTION_QUESTIONS.length,
      minRequired: SCORING_THRESHOLDS.MIN_CONSTITUTION_POOL_SIZE,
      isValid: constitutionValidation.isValid,
      coverage: constitutionCoverage,
    },
    history: {
      total: HISTORY_QUESTIONS.length,
      minRequired: SCORING_THRESHOLDS.MIN_HISTORY_POOL_SIZE,
      isValid: historyValidation.isValid,
      coverage: historyCoverage,
    },
    performance: {
      poolSizeRatio: Math.round(poolSizeRatio * 100) / 100,
      expectedLoadTimeMs,
      memoryFootprintMB,
    },
  }
}
