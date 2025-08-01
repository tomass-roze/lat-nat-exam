/**
 * @fileoverview Lazy Question Loading Utilities
 *
 * Optimized question loading system that loads questions on-demand
 * to improve initial bundle size and startup performance.
 */

import type { Question, SelectedQuestions } from '@/types'

// Cache for loaded questions
const questionCache = new Map<string, any>()

/**
 * Lazy load history questions with caching
 */
export async function loadHistoryQuestions(): Promise<Question[]> {
  const cacheKey = 'history-questions'

  if (questionCache.has(cacheKey)) {
    return questionCache.get(cacheKey)
  }

  try {
    // Dynamic import to split the question data into separate chunks
    const { HISTORY_QUESTIONS } = await import('@/data/historyQuestions')
    questionCache.set(cacheKey, HISTORY_QUESTIONS)
    return HISTORY_QUESTIONS
  } catch (error) {
    console.error('Failed to load history questions:', error)
    throw new Error('Neizdevās ielādēt vēstures jautājumus')
  }
}

/**
 * Lazy load constitution questions with caching
 */
export async function loadConstitutionQuestions(): Promise<Question[]> {
  const cacheKey = 'constitution-questions'

  if (questionCache.has(cacheKey)) {
    return questionCache.get(cacheKey)
  }

  try {
    // Dynamic import to split the question data into separate chunks
    const { CONSTITUTION_QUESTIONS } = await import(
      '@/data/constitutionQuestions'
    )
    questionCache.set(cacheKey, CONSTITUTION_QUESTIONS)
    return CONSTITUTION_QUESTIONS
  } catch (error) {
    console.error('Failed to load constitution questions:', error)
    throw new Error('Neizdevās ielādēt konstitūcijas jautājumus')
  }
}

/**
 * Efficient question randomization using pre-computed indices
 * This approach is more memory efficient than shuffling entire arrays
 */
export function generateRandomIndices(
  totalCount: number,
  selectedCount: number
): number[] {
  if (selectedCount > totalCount) {
    throw new Error('Cannot select more questions than available')
  }

  const indices = new Set<number>()

  // Use reservoir sampling for better performance with large datasets
  while (indices.size < selectedCount) {
    const randomIndex = Math.floor(Math.random() * totalCount)
    indices.add(randomIndex)
  }

  return Array.from(indices).sort((a, b) => a - b)
}

/**
 * Select random questions efficiently using pre-computed indices
 */
export function selectRandomQuestions<T>(questions: T[], count: number): T[] {
  const randomIndices = generateRandomIndices(questions.length, count)
  return randomIndices.map((index) => questions[index])
}

/**
 * Load and randomize exam questions with optimal performance
 */
export async function loadExamQuestionsLazy(): Promise<SelectedQuestions> {
  try {
    // Load questions in parallel for better performance
    const [historyQuestions, constitutionQuestions] = await Promise.all([
      loadHistoryQuestions(),
      loadConstitutionQuestions(),
    ])

    // Use efficient randomization
    const selectedHistory = selectRandomQuestions(historyQuestions, 20)
    const selectedConstitution = selectRandomQuestions(
      constitutionQuestions,
      16
    )

    return {
      history: selectedHistory,
      constitution: selectedConstitution,
      selectionMetadata: {
        selectedAt: Date.now(),
        randomSeed: Date.now(),
        selectedIds: {
          history: selectedHistory.map((q) => q.id),
          constitution: selectedConstitution.map((q) => q.id),
        },
      },
    }
  } catch (error) {
    console.error('Failed to load exam questions:', error)
    throw new Error('Neizdevās ielādēt eksāmena jautājumus')
  }
}

/**
 * Preload questions for better user experience
 * Can be called during idle time to warm up the cache
 */
export async function preloadQuestions(): Promise<void> {
  try {
    // Use requestIdleCallback if available for non-blocking preload
    const preload = async () => {
      await Promise.all([loadHistoryQuestions(), loadConstitutionQuestions()])
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => preload())
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(preload, 100)
    }
  } catch (error) {
    // Silently fail preloading - it's an optimization, not critical
    console.warn('Question preloading failed:', error)
  }
}

/**
 * Clear question cache to free memory
 */
export function clearQuestionCache(): void {
  questionCache.clear()
}

/**
 * Get cache statistics for monitoring
 */
export function getQuestionCacheStats(): {
  size: number
  keys: string[]
} {
  return {
    size: questionCache.size,
    keys: Array.from(questionCache.keys()),
  }
}
