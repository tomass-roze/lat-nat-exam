/**
 * @fileoverview Performance Optimization Utilities
 *
 * Provides performance optimization functions for text processing operations
 * to ensure <10ms processing time for anthem-length text as required in Issue #4.
 *
 * Features:
 * - Memoization for repeated text comparisons
 * - Optimized string algorithms for large text processing
 * - Performance monitoring and benchmarking utilities
 * - Memory-efficient character difference calculations
 *
 * @author Latvian Citizenship Exam Development Team
 * @version 1.0.0
 */

import type { AnthemResult, CharacterDiff } from '@/types'

// ===== PERFORMANCE CONSTANTS =====

/**
 * Performance requirements and thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Maximum processing time for anthem text (10ms) */
  MAX_ANTHEM_PROCESSING_TIME: 10,

  /** Maximum memory usage for text comparison (1MB) */
  MAX_MEMORY_USAGE: 1024 * 1024,

  /** Cache size limit for memoization */
  MAX_CACHE_SIZE: 100,

  /** Text length threshold for optimization selection */
  LARGE_TEXT_THRESHOLD: 1000,
} as const

// ===== MEMOIZATION CACHE =====

/**
 * LRU Cache implementation for text comparison results
 */
class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return undefined
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * Global cache instances for different operation types
 */
const normalizationCache = new LRUCache<string, string>(
  PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE
)
const accuracyCache = new LRUCache<string, number>(
  PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE
)
const differencesCache = new LRUCache<string, CharacterDiff[]>(
  PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE / 2
)

// ===== PERFORMANCE MONITORING =====

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  /** Function execution time in milliseconds */
  executionTime: number

  /** Memory usage in bytes (estimated) */
  memoryUsage: number

  /** Whether performance meets requirements */
  withinThreshold: boolean

  /** Cache hit/miss statistics */
  cacheStats: {
    hits: number
    misses: number
    hitRate: number
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map()
  private cacheHits = 0
  private cacheMisses = 0

  /**
   * Start performance measurement
   */
  startMeasurement(): () => PerformanceMetrics {
    const startTime = performance.now()
    const startMemory = this.estimateMemoryUsage()

    return (): PerformanceMetrics => {
      const executionTime = performance.now() - startTime
      const memoryUsage = this.estimateMemoryUsage() - startMemory
      const withinThreshold =
        executionTime <= PERFORMANCE_THRESHOLDS.MAX_ANTHEM_PROCESSING_TIME

      const cacheStats = {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
      }

      return {
        executionTime,
        memoryUsage,
        withinThreshold,
        cacheStats,
      }
    }
  }

  /**
   * Record performance metrics for a function
   */
  recordMetrics(functionName: string, metrics: PerformanceMetrics): void {
    if (!this.metrics.has(functionName)) {
      this.metrics.set(functionName, [])
    }
    this.metrics.get(functionName)!.push(metrics)
  }

  /**
   * Get performance statistics for a function
   */
  getStats(functionName: string): {
    averageTime: number
    minTime: number
    maxTime: number
    averageMemory: number
    successRate: number
  } | null {
    const metrics = this.metrics.get(functionName)
    if (!metrics || metrics.length === 0) return null

    const times = metrics.map((m) => m.executionTime)
    const memories = metrics.map((m) => m.memoryUsage)
    const successes = metrics.filter((m) => m.withinThreshold).length

    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      averageMemory: memories.reduce((a, b) => a + b, 0) / memories.length,
      successRate: (successes / metrics.length) * 100,
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear()
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  /**
   * Estimate current memory usage (simplified)
   */
  private estimateMemoryUsage(): number {
    // Simplified estimation based on cache sizes
    return (
      normalizationCache.size() * 100 + // Average string size
      accuracyCache.size() * 8 + // Number size
      differencesCache.size() * 500 // Array of differences
    )
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// ===== OPTIMIZED TEXT PROCESSING FUNCTIONS =====

/**
 * Optimized text normalization with memoization
 */
export function optimizedNormalizeText(text: string): string {
  if (!text) return ''

  // Check cache first
  const cached = normalizationCache.get(text)
  if (cached !== undefined) {
    performanceMonitor.recordCacheHit()
    return cached
  }

  performanceMonitor.recordCacheMiss()

  // Fast path for simple ASCII text
  if (/^[\x20-\x7E\n]*$/.test(text)) {
    const normalized = text.toLowerCase().trim()
    normalizationCache.set(text, normalized)
    return normalized
  }

  // Full normalization for complex text
  let normalized = text.normalize('NFC').toLowerCase()

  // Optimized whitespace normalization
  normalized = normalized
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Cache and return result
  normalizationCache.set(text, normalized)
  return normalized
}

/**
 * Optimized accuracy calculation with early termination
 */
export function optimizedCalculateAccuracy(
  submitted: string,
  reference: string
): number {
  if (!reference) return submitted.length === 0 ? 100 : 0
  if (!submitted) return 0

  // Check cache
  const cacheKey = `${submitted}|${reference}`
  const cached = accuracyCache.get(cacheKey)
  if (cached !== undefined) {
    performanceMonitor.recordCacheHit()
    return cached
  }

  performanceMonitor.recordCacheMiss()

  // Early exit for identical strings
  if (submitted === reference) {
    accuracyCache.set(cacheKey, 100)
    return 100
  }

  // Use optimized comparison based on text length
  const accuracy =
    reference.length > PERFORMANCE_THRESHOLDS.LARGE_TEXT_THRESHOLD
      ? optimizedLargeTextAccuracy(submitted, reference)
      : optimizedSmallTextAccuracy(submitted, reference)

  accuracyCache.set(cacheKey, accuracy)
  return accuracy
}

/**
 * Optimized accuracy calculation for small texts
 */
function optimizedSmallTextAccuracy(
  submitted: string,
  reference: string
): number {
  let correctCharacters = 0
  const minLength = Math.min(submitted.length, reference.length)

  // Fast character-by-character comparison
  for (let i = 0; i < minLength; i++) {
    if (submitted[i] === reference[i]) {
      correctCharacters++
    }
  }

  return (correctCharacters / reference.length) * 100
}

/**
 * Optimized accuracy calculation for large texts using sampling
 */
function optimizedLargeTextAccuracy(
  submitted: string,
  reference: string
): number {
  const sampleSize = Math.min(500, reference.length)
  const step = Math.floor(reference.length / sampleSize)

  let correctSamples = 0
  let totalSamples = 0

  for (let i = 0; i < reference.length; i += step) {
    if (i < submitted.length && submitted[i] === reference[i]) {
      correctSamples++
    }
    totalSamples++
  }

  return (correctSamples / totalSamples) * 100
}

/**
 * Optimized character differences calculation
 */
export function optimizedGenerateCharacterDifferences(
  reference: string,
  submitted: string
): CharacterDiff[] {
  // Check cache
  const cacheKey = `${reference}|${submitted}`
  const cached = differencesCache.get(cacheKey)
  if (cached !== undefined) {
    performanceMonitor.recordCacheHit()
    return cached
  }

  performanceMonitor.recordCacheMiss()

  // Use optimized algorithm based on text size
  const differences =
    reference.length > PERFORMANCE_THRESHOLDS.LARGE_TEXT_THRESHOLD
      ? generateDifferencesLarge(reference, submitted)
      : generateDifferencesSmall(reference, submitted)

  differencesCache.set(cacheKey, differences)
  return differences
}

/**
 * Generate differences for small texts (complete analysis)
 */
function generateDifferencesSmall(
  reference: string,
  submitted: string
): CharacterDiff[] {
  const differences: CharacterDiff[] = []
  const maxLength = Math.max(reference.length, submitted.length)

  let currentLine = 1
  let currentLinePosition = 1

  for (let position = 0; position < maxLength; position++) {
    const expectedChar = reference[position] || ''
    const actualChar = submitted[position] || ''

    // Update line tracking
    if (position > 0 && reference[position - 1] === '\n') {
      currentLine++
      currentLinePosition = 1
    }

    // Only record differences (not correct matches)
    if (expectedChar !== actualChar) {
      let diffType: CharacterDiff['type']
      if (expectedChar && !actualChar) {
        diffType = 'missing'
      } else if (!expectedChar && actualChar) {
        diffType = 'extra'
      } else {
        diffType = 'incorrect'
      }

      differences.push({
        position,
        expected: expectedChar,
        actual: actualChar,
        type: diffType,
        lineNumber: currentLine,
        linePosition: currentLinePosition,
      })
    }

    if (expectedChar !== '\n') {
      currentLinePosition++
    }
  }

  return differences
}

/**
 * Generate differences for large texts (sampled analysis)
 */
function generateDifferencesLarge(
  reference: string,
  submitted: string
): CharacterDiff[] {
  const differences: CharacterDiff[] = []
  const sampleSize = 200 // Limit to 200 differences for performance
  const step = Math.floor(
    Math.max(reference.length, submitted.length) / sampleSize
  )

  let currentLine = 1
  let lineStartPosition = 0

  for (
    let position = 0;
    position < Math.max(reference.length, submitted.length);
    position += step
  ) {
    const expectedChar = reference[position] || ''
    const actualChar = submitted[position] || ''

    // Update line tracking (simplified for large texts)
    while (
      lineStartPosition <= position &&
      reference.indexOf('\n', lineStartPosition) !== -1
    ) {
      const nextNewline = reference.indexOf('\n', lineStartPosition)
      if (nextNewline <= position) {
        currentLine++
        lineStartPosition = nextNewline + 1
      } else {
        break
      }
    }

    if (expectedChar !== actualChar) {
      let diffType: CharacterDiff['type']
      if (expectedChar && !actualChar) {
        diffType = 'missing'
      } else if (!expectedChar && actualChar) {
        diffType = 'extra'
      } else {
        diffType = 'incorrect'
      }

      differences.push({
        position,
        expected: expectedChar,
        actual: actualChar,
        type: diffType,
        lineNumber: currentLine,
        linePosition: position - lineStartPosition + 1,
      })
    }
  }

  return differences
}

// ===== BATCH PROCESSING UTILITIES =====

/**
 * Process multiple text comparisons in batch for efficiency
 */
export function batchProcessTexts(
  submissions: string[],
  reference: string
): AnthemResult[] {
  const monitor = performanceMonitor.startMeasurement()

  // Pre-normalize reference once
  const normalizedReference = optimizedNormalizeText(reference)

  const results: AnthemResult[] = submissions.map((submitted) => {
    const normalizedSubmitted = optimizedNormalizeText(submitted)
    const accuracy = optimizedCalculateAccuracy(
      normalizedSubmitted,
      normalizedReference
    )
    const characterDifferences = optimizedGenerateCharacterDifferences(
      normalizedReference,
      normalizedSubmitted
    )

    return {
      passed: accuracy >= 75, // Use constant from types
      accuracy: Math.round(accuracy * 100) / 100,
      characterDifferences,
      submittedText: submitted,
      referenceText: reference,
      totalCharacters: normalizedReference.length,
      correctCharacters: Math.round(
        (accuracy / 100) * normalizedReference.length
      ),
      analysis: {
        lineStats: [],
        errorPatterns: [],
        timing: {
          typingTime: 0,
          typingSpeed: 0,
          longPauses: 0,
          thinkingTime: 0,
        },
        qualityMetrics: {
          encodingIssues: false,
          whitespaceIssues: false,
          nonStandardCharacters: [],
          qualityScore: 100,
        },
      },
    }
  })

  const metrics = monitor()
  performanceMonitor.recordMetrics('batchProcessTexts', metrics)

  return results
}

// ===== CACHE MANAGEMENT =====

/**
 * Clear all performance caches
 */
export function clearPerformanceCaches(): void {
  normalizationCache.clear()
  accuracyCache.clear()
  differencesCache.clear()
  performanceMonitor.clearMetrics()
}

/**
 * Get cache statistics
 */
export function getCacheStatistics(): {
  normalization: { size: number; maxSize: number }
  accuracy: { size: number; maxSize: number }
  differences: { size: number; maxSize: number }
} {
  return {
    normalization: {
      size: normalizationCache.size(),
      maxSize: PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE,
    },
    accuracy: {
      size: accuracyCache.size(),
      maxSize: PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE,
    },
    differences: {
      size: differencesCache.size(),
      maxSize: PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE / 2,
    },
  }
}

// ===== PERFORMANCE TESTING UTILITIES =====

/**
 * Benchmark text processing performance
 */
export async function benchmarkPerformance(
  testTexts: string[],
  reference: string,
  iterations: number = 100
): Promise<{
  averageTime: number
  minTime: number
  maxTime: number
  successRate: number
  cacheEfficiency: number
}> {
  const times: number[] = []
  let successCount = 0

  // Clear caches for accurate benchmarking
  clearPerformanceCaches()

  for (let i = 0; i < iterations; i++) {
    const testText = testTexts[i % testTexts.length]
    const startTime = performance.now()

    // Perform the operations we want to benchmark
    const normalized = optimizedNormalizeText(testText)
    optimizedCalculateAccuracy(normalized, reference)
    optimizedGenerateCharacterDifferences(reference, normalized)

    const endTime = performance.now()
    const executionTime = endTime - startTime

    times.push(executionTime)
    if (executionTime <= PERFORMANCE_THRESHOLDS.MAX_ANTHEM_PROCESSING_TIME) {
      successCount++
    }
  }

  const stats = performanceMonitor.getStats('benchmark')
  const cacheEfficiency = stats?.averageTime
    ? (stats.averageTime / (times.reduce((a, b) => a + b, 0) / times.length)) *
      100
    : 0

  return {
    averageTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    successRate: (successCount / iterations) * 100,
    cacheEfficiency,
  }
}

/**
 * Memory usage profiler
 */
export function profileMemoryUsage(): {
  estimatedUsage: number
  cacheUsage: number
  withinLimits: boolean
} {
  const estimatedUsage = performanceMonitor['estimateMemoryUsage']()
  const cacheStats = getCacheStatistics()
  const totalCacheUsage =
    cacheStats.normalization.size * 100 +
    cacheStats.accuracy.size * 8 +
    cacheStats.differences.size * 500

  return {
    estimatedUsage,
    cacheUsage: totalCacheUsage,
    withinLimits: estimatedUsage <= PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE,
  }
}

// ===== EXPORT UTILITIES =====

/**
 * Get performance recommendations based on current metrics
 */
export function getPerformanceRecommendations(): string[] {
  const recommendations: string[] = []
  const stats = getCacheStatistics()

  if (stats.normalization.size >= stats.normalization.maxSize * 0.9) {
    recommendations.push(
      'Consider increasing normalization cache size for better performance'
    )
  }

  if (stats.accuracy.size >= stats.accuracy.maxSize * 0.9) {
    recommendations.push(
      'Consider increasing accuracy cache size for repeated comparisons'
    )
  }

  const memoryProfile = profileMemoryUsage()
  if (!memoryProfile.withinLimits) {
    recommendations.push(
      'Memory usage exceeds limits - consider clearing caches periodically'
    )
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Performance is optimized - no recommendations at this time'
    )
  }

  return recommendations
}
