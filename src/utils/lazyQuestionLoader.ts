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
 * Create minimal fallback questions for production safety
 */
function createLazyFallbackQuestions(): SelectedQuestions {
  const fallbackHistory: Question[] = Array.from({ length: 20 }, (_, i) => ({
    id: i + 3000, // Use high IDs to avoid conflicts with main questions
    question: `Vēstures jautājums ${i + 1} (avarijas režīms)`,
    options: ['Variants A', 'Variants B', 'Variants C'],
    correctAnswer: 0 as 0 | 1 | 2,
    category: 'history' as const,
    difficulty: 'medium' as const,
    timeEstimate: 30,
    lastUpdated: Date.now(),
  }))

  const fallbackConstitution: Question[] = Array.from({ length: 16 }, (_, i) => ({
    id: i + 4000, // Use high IDs to avoid conflicts
    question: `Konstitūcijas jautājums ${i + 1} (avarijas režīms)`,
    options: ['Variants A', 'Variants B', 'Variants C'],
    correctAnswer: 0 as 0 | 1 | 2,
    category: 'constitution' as const,
    difficulty: 'medium' as const,
    timeEstimate: 30,
    lastUpdated: Date.now(),
  }))

  return {
    history: fallbackHistory,
    constitution: fallbackConstitution,
    selectionMetadata: {
      selectedAt: Date.now(),
      randomSeed: Date.now(),
      selectedIds: {
        history: fallbackHistory.map((q) => q.id),
        constitution: fallbackConstitution.map((q) => q.id),
      },
    },
  }
}

/**
 * Load and randomize exam questions with optimal performance and production safety
 */
export async function loadExamQuestionsLazy(): Promise<SelectedQuestions> {
  try {
    // Add timeout protection for dynamic imports
    const loadTimeout = 10000 // 10 seconds timeout
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Question loading timeout')), loadTimeout)
    })

    // Load questions in parallel with timeout protection
    const [historyQuestions, constitutionQuestions] = await Promise.race([
      Promise.all([
        loadHistoryQuestions(),
        loadConstitutionQuestions(),
      ]),
      timeoutPromise
    ])

    // Validate loaded questions exist and have proper structure
    if (!Array.isArray(historyQuestions) || historyQuestions.length === 0) {
      throw new Error('History questions failed to load or are empty')
    }
    
    if (!Array.isArray(constitutionQuestions) || constitutionQuestions.length === 0) {
      throw new Error('Constitution questions failed to load or are empty')
    }

    // Use efficient randomization with bounds checking
    const historyCount = Math.min(20, historyQuestions.length)
    const constitutionCount = Math.min(16, constitutionQuestions.length)
    
    const selectedHistory = selectRandomQuestions(historyQuestions, historyCount)
    const selectedConstitution = selectRandomQuestions(constitutionQuestions, constitutionCount)

    // Final validation of selected questions
    if (selectedHistory.length !== historyCount || selectedConstitution.length !== constitutionCount) {
      throw new Error('Question selection failed - insufficient questions selected')
    }

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
    console.error('Lazy question loading failed, using fallback:', error)
    
    // Return fallback questions instead of throwing to prevent app crash
    return createLazyFallbackQuestions()
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
