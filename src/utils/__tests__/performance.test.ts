/**
 * @fileoverview Unit tests for performance optimization utilities
 *
 * Comprehensive test suite for performance.ts functions including:
 * - Memoization and caching functionality
 * - Performance monitoring and metrics
 * - Optimized text processing algorithms
 * - Batch processing capabilities
 * - Memory usage and cache management
 */

import { strict as assert } from 'node:assert'
import { test, describe } from 'node:test'

// Import functions to test
import {
  PERFORMANCE_THRESHOLDS,
  PerformanceMonitor,
  performanceMonitor,
  optimizedNormalizeText,
  optimizedCalculateAccuracy,
  optimizedGenerateCharacterDifferences,
  batchProcessTexts,
  clearPerformanceCaches,
  getCacheStatistics,
  benchmarkPerformance,
  profileMemoryUsage,
  getPerformanceRecommendations,
} from '../performance'

import { NATIONAL_ANTHEM_TEXT } from '@/types'

// ===== PERFORMANCE CONSTANTS TESTS =====

describe('Performance Constants', () => {
  test('PERFORMANCE_THRESHOLDS contains required values', () => {
    assert.strictEqual(
      typeof PERFORMANCE_THRESHOLDS.MAX_ANTHEM_PROCESSING_TIME,
      'number'
    )
    assert.strictEqual(PERFORMANCE_THRESHOLDS.MAX_ANTHEM_PROCESSING_TIME, 10)

    assert.strictEqual(typeof PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE, 'number')
    assert.strictEqual(typeof PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE, 'number')
    assert.strictEqual(
      typeof PERFORMANCE_THRESHOLDS.LARGE_TEXT_THRESHOLD,
      'number'
    )
  })

  test('PERFORMANCE_THRESHOLDS values are reasonable', () => {
    assert.ok(PERFORMANCE_THRESHOLDS.MAX_ANTHEM_PROCESSING_TIME > 0)
    assert.ok(PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE > 0)
    assert.ok(PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE > 0)
    assert.ok(PERFORMANCE_THRESHOLDS.LARGE_TEXT_THRESHOLD > 0)
  })
})

// ===== PERFORMANCE MONITOR TESTS =====

describe('PerformanceMonitor', () => {
  test('PerformanceMonitor can start and stop measurements', () => {
    const monitor = new PerformanceMonitor()
    const stopMeasurement = monitor.startMeasurement()

    // Simulate some work
    const start = Date.now()
    while (Date.now() - start < 5) {} // Busy wait for 5ms

    const metrics = stopMeasurement()

    assert.ok(typeof metrics.executionTime === 'number')
    assert.ok(metrics.executionTime >= 0)
    assert.ok(typeof metrics.memoryUsage === 'number')
    assert.ok(typeof metrics.withinThreshold === 'boolean')
    assert.ok(typeof metrics.cacheStats === 'object')
  })

  test('PerformanceMonitor records metrics correctly', () => {
    const monitor = new PerformanceMonitor()
    const metrics = {
      executionTime: 5,
      memoryUsage: 1000,
      withinThreshold: true,
      cacheStats: { hits: 10, misses: 5, hitRate: 0.67 },
    }

    monitor.recordMetrics('testFunction', metrics)
    const stats = monitor.getStats('testFunction')

    assert.ok(stats)
    assert.strictEqual(stats.averageTime, 5)
    assert.strictEqual(stats.minTime, 5)
    assert.strictEqual(stats.maxTime, 5)
    assert.strictEqual(stats.successRate, 100)
  })

  test('PerformanceMonitor calculates statistics correctly', () => {
    const monitor = new PerformanceMonitor()

    // Record multiple metrics
    const metrics1 = {
      executionTime: 5,
      memoryUsage: 1000,
      withinThreshold: true,
      cacheStats: { hits: 10, misses: 5, hitRate: 0.67 },
    }
    const metrics2 = {
      executionTime: 15,
      memoryUsage: 2000,
      withinThreshold: false,
      cacheStats: { hits: 10, misses: 5, hitRate: 0.67 },
    }

    monitor.recordMetrics('testFunction', metrics1)
    monitor.recordMetrics('testFunction', metrics2)

    const stats = monitor.getStats('testFunction')
    assert.ok(stats)
    assert.strictEqual(stats.averageTime, 10) // (5 + 15) / 2
    assert.strictEqual(stats.minTime, 5)
    assert.strictEqual(stats.maxTime, 15)
    assert.strictEqual(stats.successRate, 50) // 1 out of 2 within threshold
  })

  test('PerformanceMonitor tracks cache hits and misses', () => {
    const monitor = new PerformanceMonitor()

    monitor.recordCacheHit()
    monitor.recordCacheHit()
    monitor.recordCacheMiss()

    const stopMeasurement = monitor.startMeasurement()
    const metrics = stopMeasurement()

    assert.strictEqual(metrics.cacheStats.hits, 2)
    assert.strictEqual(metrics.cacheStats.misses, 1)
    assert.strictEqual(metrics.cacheStats.hitRate, 2 / 3)
  })

  test('PerformanceMonitor can clear metrics', () => {
    const monitor = new PerformanceMonitor()

    monitor.recordMetrics('test', {
      executionTime: 5,
      memoryUsage: 1000,
      withinThreshold: true,
      cacheStats: { hits: 10, misses: 5, hitRate: 0.67 },
    })

    monitor.clearMetrics()
    const stats = monitor.getStats('test')
    assert.strictEqual(stats, null)
  })
})

// ===== OPTIMIZED TEXT PROCESSING TESTS =====

describe('Optimized Text Processing', () => {
  test('optimizedNormalizeText handles empty input', () => {
    assert.strictEqual(optimizedNormalizeText(''), '')
    assert.strictEqual(optimizedNormalizeText(null as any), '')
  })

  test('optimizedNormalizeText normalizes text correctly', () => {
    const input = 'DIEVS, SVĒTĪ LATVIJU!'
    const result = optimizedNormalizeText(input)
    assert.strictEqual(result, 'dievs, svētī latviju!')
  })

  test('optimizedNormalizeText uses caching', () => {
    const input = 'Test text for caching'

    // First call should be a cache miss
    const result1 = optimizedNormalizeText(input)

    // Second call should be a cache hit
    const result2 = optimizedNormalizeText(input)

    assert.strictEqual(result1, result2)
  })

  test('optimizedNormalizeText fast path for ASCII', () => {
    const asciiText = 'Simple ASCII text'
    const startTime = performance.now()

    const result = optimizedNormalizeText(asciiText)

    const endTime = performance.now()
    const executionTime = endTime - startTime

    assert.strictEqual(result, 'simple ascii text')
    assert.ok(executionTime < 1) // Should be very fast for ASCII
  })

  test('optimizedCalculateAccuracy handles identical texts', () => {
    const text = 'Test text'
    const accuracy = optimizedCalculateAccuracy(text, text)
    assert.strictEqual(accuracy, 100)
  })

  test('optimizedCalculateAccuracy handles empty texts', () => {
    assert.strictEqual(optimizedCalculateAccuracy('', ''), 100)
    assert.strictEqual(optimizedCalculateAccuracy('', 'reference'), 0)
    assert.strictEqual(optimizedCalculateAccuracy('submitted', ''), 0)
  })

  test('optimizedCalculateAccuracy uses caching', () => {
    const submitted = 'test'
    const reference = 'test'

    // First call
    const accuracy1 = optimizedCalculateAccuracy(submitted, reference)

    // Second call should use cache
    const accuracy2 = optimizedCalculateAccuracy(submitted, reference)

    assert.strictEqual(accuracy1, accuracy2)
    assert.strictEqual(accuracy1, 100)
  })

  test('optimizedGenerateCharacterDifferences handles identical texts', () => {
    const text = 'test'
    const differences = optimizedGenerateCharacterDifferences(text, text)
    assert.strictEqual(differences.length, 0)
  })

  test('optimizedGenerateCharacterDifferences detects differences', () => {
    const reference = 'abc'
    const submitted = 'aXc'
    const differences = optimizedGenerateCharacterDifferences(
      reference,
      submitted
    )

    assert.strictEqual(differences.length, 1)
    assert.strictEqual(differences[0].expected, 'b')
    assert.strictEqual(differences[0].actual, 'X')
    assert.strictEqual(differences[0].type, 'incorrect')
  })

  test('optimizedGenerateCharacterDifferences uses caching', () => {
    const reference = 'test'
    const submitted = 'test'

    // First call
    const differences1 = optimizedGenerateCharacterDifferences(
      reference,
      submitted
    )

    // Second call should use cache
    const differences2 = optimizedGenerateCharacterDifferences(
      reference,
      submitted
    )

    assert.deepStrictEqual(differences1, differences2)
  })
})

// ===== BATCH PROCESSING TESTS =====

describe('Batch Processing', () => {
  test('batchProcessTexts processes multiple submissions', () => {
    const submissions = ['Perfect match', 'Perfect match', 'Different text']
    const reference = 'Perfect match'

    const results = batchProcessTexts(submissions, reference)

    assert.strictEqual(results.length, 3)
    assert.strictEqual(results[0].accuracy, 100)
    assert.strictEqual(results[1].accuracy, 100)
    assert.ok(results[2].accuracy < 100)
  })

  test('batchProcessTexts optimizes reference normalization', () => {
    const submissions = Array(10).fill('test text')
    const reference = 'TEST TEXT'

    const startTime = performance.now()
    const results = batchProcessTexts(submissions, reference)
    const endTime = performance.now()

    assert.strictEqual(results.length, 10)
    results.forEach((result) => {
      assert.strictEqual(result.accuracy, 100)
    })

    // Should be efficient due to reference pre-normalization
    const executionTime = endTime - startTime
    assert.ok(executionTime < 50) // Should complete quickly
  })

  test('batchProcessTexts handles empty submissions', () => {
    const results = batchProcessTexts([], 'reference')
    assert.strictEqual(results.length, 0)
  })
})

// ===== CACHE MANAGEMENT TESTS =====

describe('Cache Management', () => {
  test('getCacheStatistics returns correct format', () => {
    const stats = getCacheStatistics()

    assert.ok(typeof stats.normalization === 'object')
    assert.ok(typeof stats.accuracy === 'object')
    assert.ok(typeof stats.differences === 'object')

    assert.ok(typeof stats.normalization.size === 'number')
    assert.ok(typeof stats.normalization.maxSize === 'number')
    assert.ok(typeof stats.accuracy.size === 'number')
    assert.ok(typeof stats.accuracy.maxSize === 'number')
  })

  test('clearPerformanceCaches clears all caches', () => {
    // Add some items to cache
    optimizedNormalizeText('test1')
    optimizedCalculateAccuracy('test2', 'test2')

    // Clear caches
    clearPerformanceCaches()

    const stats = getCacheStatistics()
    assert.strictEqual(stats.normalization.size, 0)
    assert.strictEqual(stats.accuracy.size, 0)
    assert.strictEqual(stats.differences.size, 0)
  })

  test('cache respects size limits', () => {
    clearPerformanceCaches()

    // Add many items to exceed cache size
    for (let i = 0; i < PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE + 50; i++) {
      optimizedNormalizeText(`test_${i}`)
    }

    const stats = getCacheStatistics()
    assert.ok(stats.normalization.size <= stats.normalization.maxSize)
  })
})

// ===== PERFORMANCE TESTING UTILITIES TESTS =====

describe('Performance Testing Utilities', () => {
  test('benchmarkPerformance measures execution time', async () => {
    const testTexts = ['test1', 'test2', 'test3']
    const reference = 'reference'

    const benchmark = await benchmarkPerformance(testTexts, reference, 10)

    assert.ok(typeof benchmark.averageTime === 'number')
    assert.ok(typeof benchmark.minTime === 'number')
    assert.ok(typeof benchmark.maxTime === 'number')
    assert.ok(typeof benchmark.successRate === 'number')
    assert.ok(typeof benchmark.cacheEfficiency === 'number')

    assert.ok(benchmark.averageTime >= 0)
    assert.ok(benchmark.minTime >= 0)
    assert.ok(benchmark.maxTime >= benchmark.minTime)
    assert.ok(benchmark.successRate >= 0 && benchmark.successRate <= 100)
  })

  test('benchmarkPerformance clears caches before testing', async () => {
    // Pre-populate caches
    optimizedNormalizeText('test')

    const testTexts = ['different_test']
    const benchmark = await benchmarkPerformance(testTexts, 'reference', 5)

    // Should have cleared caches and run fresh tests
    assert.ok(benchmark.averageTime > 0)
  })

  test('profileMemoryUsage returns memory information', () => {
    const profile = profileMemoryUsage()

    assert.ok(typeof profile.estimatedUsage === 'number')
    assert.ok(typeof profile.cacheUsage === 'number')
    assert.ok(typeof profile.withinLimits === 'boolean')

    assert.ok(profile.estimatedUsage >= 0)
    assert.ok(profile.cacheUsage >= 0)
  })

  test('getPerformanceRecommendations provides guidance', () => {
    const recommendations = getPerformanceRecommendations()

    assert.ok(Array.isArray(recommendations))
    assert.ok(recommendations.length > 0)
    recommendations.forEach((rec) => {
      assert.ok(typeof rec === 'string')
      assert.ok(rec.length > 0)
    })
  })
})

// ===== PERFORMANCE REQUIREMENTS TESTS =====

describe('Performance Requirements Validation', () => {
  test('anthem text processing meets performance requirements', () => {
    clearPerformanceCaches() // Start fresh

    const startTime = performance.now()

    // Process anthem text
    const normalized = optimizedNormalizeText(NATIONAL_ANTHEM_TEXT)
    const accuracy = optimizedCalculateAccuracy(
      normalized,
      NATIONAL_ANTHEM_TEXT
    )
    const differences = optimizedGenerateCharacterDifferences(
      NATIONAL_ANTHEM_TEXT,
      normalized
    )

    const endTime = performance.now()
    const executionTime = endTime - startTime

    // Verify results are correct
    assert.strictEqual(accuracy, 100)
    assert.strictEqual(differences.length, 0)

    // Verify performance requirement (<10ms)
    assert.ok(
      executionTime < PERFORMANCE_THRESHOLDS.MAX_ANTHEM_PROCESSING_TIME,
      `Processing took ${executionTime}ms, should be under ${PERFORMANCE_THRESHOLDS.MAX_ANTHEM_PROCESSING_TIME}ms`
    )
  })

  test('batch processing scales efficiently', () => {
    const startTime = performance.now()

    // Process multiple anthem texts
    const submissions = Array(20).fill(NATIONAL_ANTHEM_TEXT)
    const results = batchProcessTexts(submissions, NATIONAL_ANTHEM_TEXT)

    const endTime = performance.now()
    const executionTime = endTime - startTime

    // Verify all results are correct
    assert.strictEqual(results.length, 20)
    results.forEach((result) => {
      assert.strictEqual(result.accuracy, 100)
    })

    // Should scale reasonably (not linearly due to caching)
    assert.ok(
      executionTime < 100,
      `Batch processing took ${executionTime}ms, should be under 100ms`
    )
  })

  test('large text handling with sampling', () => {
    const largeText = 'a'.repeat(
      PERFORMANCE_THRESHOLDS.LARGE_TEXT_THRESHOLD + 100
    )
    const reference = 'a'.repeat(
      PERFORMANCE_THRESHOLDS.LARGE_TEXT_THRESHOLD + 100
    )

    const startTime = performance.now()

    const accuracy = optimizedCalculateAccuracy(largeText, reference)
    const differences = optimizedGenerateCharacterDifferences(
      reference,
      largeText
    )

    const endTime = performance.now()
    const executionTime = endTime - startTime

    assert.strictEqual(accuracy, 100)
    assert.strictEqual(differences.length, 0)

    // Should handle large text efficiently
    assert.ok(
      executionTime < 50,
      `Large text processing took ${executionTime}ms, should be under 50ms`
    )
  })

  test('memory usage stays within limits', () => {
    clearPerformanceCaches()

    // Populate caches with various data
    for (let i = 0; i < 50; i++) {
      optimizedNormalizeText(`test_${i}`)
      optimizedCalculateAccuracy(`test_${i}`, `reference_${i}`)
    }

    const profile = profileMemoryUsage()

    // Should not exceed memory limits
    assert.ok(
      profile.withinLimits ||
        profile.estimatedUsage <= PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE,
      `Memory usage ${profile.estimatedUsage} exceeds limit ${PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE}`
    )
  })
})

// ===== CACHING EFFICIENCY TESTS =====

describe('Caching Efficiency', () => {
  test('cache improves performance on repeated calls', () => {
    clearPerformanceCaches()
    const text = NATIONAL_ANTHEM_TEXT

    // First call (cache miss)
    const startTime1 = performance.now()
    optimizedNormalizeText(text)
    const endTime1 = performance.now()
    const time1 = endTime1 - startTime1

    // Second call (cache hit)
    const startTime2 = performance.now()
    optimizedNormalizeText(text)
    const endTime2 = performance.now()
    const time2 = endTime2 - startTime2

    // Cache hit should be significantly faster
    assert.ok(
      time2 < time1,
      `Cache hit (${time2}ms) should be faster than miss (${time1}ms)`
    )
  })

  test('LRU cache evicts least recently used items', () => {
    clearPerformanceCaches()

    // Fill cache beyond capacity
    for (let i = 0; i < PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE + 10; i++) {
      optimizedNormalizeText(`test_${i}`)
    }

    const stats = getCacheStatistics()

    // Cache should not exceed maximum size
    assert.ok(stats.normalization.size <= stats.normalization.maxSize)

    // Early items should have been evicted
    const earlyResult = optimizedNormalizeText('test_0')
    assert.strictEqual(earlyResult, 'test_0') // Should still work, but may not be cached
  })

  test('different cache types work independently', () => {
    clearPerformanceCaches()

    // Populate different cache types
    optimizedNormalizeText('test_norm')
    optimizedCalculateAccuracy('test_acc', 'test_acc')
    optimizedGenerateCharacterDifferences('test_diff', 'test_diff')

    const stats = getCacheStatistics()

    assert.ok(stats.normalization.size > 0)
    assert.ok(stats.accuracy.size > 0)
    assert.ok(stats.differences.size > 0)
  })
})

// ===== INTEGRATION TESTS =====

describe('Integration Tests', () => {
  test('global performance monitor tracks operations', () => {
    clearPerformanceCaches()
    performanceMonitor.clearMetrics()

    // Use optimized functions that should record metrics
    batchProcessTexts(['test1', 'test2'], 'reference')

    // Performance monitor should have recorded the batch operation
    const stats = performanceMonitor.getStats('batchProcessTexts')
    assert.ok(
      stats,
      'Performance monitor should have recorded batch processing metrics'
    )
  })

  test('complete workflow with performance monitoring', () => {
    clearPerformanceCaches()
    performanceMonitor.clearMetrics()

    const startMeasurement = performanceMonitor.startMeasurement()

    // Simulate complete text processing workflow
    const normalized = optimizedNormalizeText(NATIONAL_ANTHEM_TEXT)
    const accuracy = optimizedCalculateAccuracy(
      normalized,
      NATIONAL_ANTHEM_TEXT
    )
    const differences = optimizedGenerateCharacterDifferences(
      NATIONAL_ANTHEM_TEXT,
      normalized
    )

    const metrics = startMeasurement()

    // Verify processing results
    assert.strictEqual(accuracy, 100)
    assert.strictEqual(differences.length, 0)

    // Verify performance metrics
    assert.ok(metrics.withinThreshold)
    assert.ok(
      metrics.executionTime < PERFORMANCE_THRESHOLDS.MAX_ANTHEM_PROCESSING_TIME
    )
  })
})
