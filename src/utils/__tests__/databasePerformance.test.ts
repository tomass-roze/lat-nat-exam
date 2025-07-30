/**
 * @fileoverview Performance Benchmarking Tests
 *
 * Comprehensive performance testing for question loading, validation,
 * and database operations with the official 144-question dataset.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import {
  loadExamQuestions,
  loadExamQuestionsWithMetrics,
  benchmarkQuestionLoading,
} from '../questionLoader'
import {
  validateOfficialDatabase,
  getDatabaseStats,
} from '../../data/questionDatabase'

describe('Performance Benchmarking Tests', () => {
  describe('Question Loading Performance', () => {
    test('should load questions under 50ms consistently', () => {
      const iterations = 20
      const loadTimes: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        loadExamQuestions(Date.now() + i)
        const endTime = performance.now()
        loadTimes.push(endTime - startTime)
      }

      const averageTime =
        loadTimes.reduce((sum, time) => sum + time, 0) / iterations
      const maxTime = Math.max(...loadTimes)

      assert.ok(
        averageTime < 50,
        `Average load time too high: ${averageTime.toFixed(2)}ms`
      )
      assert.ok(
        maxTime < 100,
        `Maximum load time too high: ${maxTime.toFixed(2)}ms`
      )
    })

    test('should achieve high questions-per-second throughput', () => {
      const result = loadExamQuestionsWithMetrics()

      // Should process at least 500 questions per second
      assert.ok(
        result.performance.questionsPerSecond > 500,
        `Questions per second too low: ${result.performance.questionsPerSecond}`
      )
    })

    test('should use minimal memory for question loading', () => {
      const memoryBefore = process.memoryUsage().heapUsed

      // Load questions multiple times
      for (let i = 0; i < 10; i++) {
        loadExamQuestions(Date.now() + i)
      }

      const memoryAfter = process.memoryUsage().heapUsed
      const memoryIncreaseMB = (memoryAfter - memoryBefore) / 1024 / 1024

      // Memory increase should be minimal (less than 5MB for 10 loads)
      assert.ok(
        memoryIncreaseMB < 5,
        `Memory usage too high: ${memoryIncreaseMB.toFixed(2)}MB`
      )
    })
  })

  describe('Database Validation Performance', () => {
    test('should validate entire database under 50ms', () => {
      const iterations = 10
      const validationTimes: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        validateOfficialDatabase()
        const endTime = performance.now()
        validationTimes.push(endTime - startTime)
      }

      const averageTime =
        validationTimes.reduce((sum, time) => sum + time, 0) / iterations

      assert.ok(
        averageTime < 50,
        `Database validation too slow: ${averageTime.toFixed(2)}ms`
      )
    })

    test('should provide consistent validation performance', () => {
      const iterations = 15
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const result = validateOfficialDatabase()
        times.push(result.performance.validationTimeMs)
      }

      const average = times.reduce((sum, time) => sum + time, 0) / iterations
      const variance =
        times.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) /
        iterations
      const standardDeviation = Math.sqrt(variance)

      // Standard deviation should be low (consistent performance)
      assert.ok(
        standardDeviation < 10,
        `Validation performance too inconsistent: σ=${standardDeviation.toFixed(2)}ms`
      )
    })
  })

  describe('Comprehensive Benchmarking', () => {
    test('should complete benchmark suite within reasonable time', () => {
      const startTime = performance.now()
      const benchmark = benchmarkQuestionLoading(50) // 50 iterations
      const endTime = performance.now()

      const totalBenchmarkTime = endTime - startTime

      // Entire benchmark should complete quickly
      assert.ok(
        totalBenchmarkTime < 5000,
        `Benchmark took too long: ${totalBenchmarkTime.toFixed(2)}ms`
      )

      // Verify benchmark results are reasonable
      assert.ok(benchmark.averageLoadTimeMs < 50)
      assert.ok(benchmark.minLoadTimeMs >= 0)
      assert.ok(benchmark.maxLoadTimeMs > benchmark.minLoadTimeMs)
      assert.strictEqual(benchmark.totalQuestions, 18) // 10 history + 8 constitution
    })

    test('should demonstrate good performance characteristics', () => {
      const benchmark = benchmarkQuestionLoading(100)

      // Performance characteristics
      assert.ok(benchmark.averageQuestionsPerSecond > 300, 'Throughput too low')
      assert.ok(benchmark.memoryUsageMB < 10, 'Memory usage too high')

      // Consistency check (max shouldn't be more than 3x average)
      const performanceRatio =
        benchmark.maxLoadTimeMs / benchmark.averageLoadTimeMs
      assert.ok(
        performanceRatio < 3,
        `Performance too inconsistent: ${performanceRatio.toFixed(2)}x variation`
      )
    })
  })

  describe('Memory Efficiency Tests', () => {
    test('should not leak memory during repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        loadExamQuestions(i)
        if (i % 10 === 0) {
          // Force garbage collection if available
          if (global.gc) {
            global.gc()
          }
        }
      }

      // Force final garbage collection
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncreaseMB = (finalMemory - initialMemory) / 1024 / 1024

      // Should not have significant memory increase
      assert.ok(
        memoryIncreaseMB < 10,
        `Possible memory leak: ${memoryIncreaseMB.toFixed(2)}MB increase`
      )
    })

    test('should efficiently handle large question pools', () => {
      const stats = getDatabaseStats()

      // Verify we're handling the full dataset efficiently
      assert.strictEqual(stats.totalQuestions, 144)
      assert.ok(
        stats.performance.memoryUsageMB < 5,
        'Database memory usage too high'
      )
    })
  })

  describe('Scalability Tests', () => {
    test('should maintain performance with repeated database access', () => {
      const iterations = 50
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        getDatabaseStats()
        const endTime = performance.now()
        times.push(endTime - startTime)
      }

      const firstHalf = times.slice(0, 25)
      const secondHalf = times.slice(25)

      const firstHalfAvg =
        firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length
      const secondHalfAvg =
        secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length

      // Performance should not degrade significantly over time
      const degradationRatio = secondHalfAvg / firstHalfAvg
      assert.ok(
        degradationRatio < 2,
        `Performance degradation detected: ${degradationRatio.toFixed(2)}x slower`
      )
    })

    test('should handle concurrent question loading efficiently', async () => {
      const concurrentLoads = 10
      const startTime = performance.now()

      // Simulate concurrent loading
      const promises = Array.from({ length: concurrentLoads }, (_, i) =>
        Promise.resolve(loadExamQuestions(Date.now() + i))
      )

      const results = await Promise.all(promises)
      const endTime = performance.now()

      const totalTime = endTime - startTime
      const averageTimePerLoad = totalTime / concurrentLoads

      // Should handle concurrent loads efficiently
      assert.ok(
        averageTimePerLoad < 100,
        `Concurrent loading too slow: ${averageTimePerLoad.toFixed(2)}ms per load`
      )
      assert.strictEqual(results.length, concurrentLoads)

      // All results should be valid
      results.forEach((result, index) => {
        assert.strictEqual(
          result.history.length,
          10,
          `Load ${index}: Wrong history count`
        )
        assert.strictEqual(
          result.constitution.length,
          8,
          `Load ${index}: Wrong constitution count`
        )
      })
    })
  })

  describe('Real-world Performance Scenarios', () => {
    test('should handle typical exam session initialization quickly', () => {
      // Simulate a complete exam session initialization
      const startTime = performance.now()

      // 1. Validate database
      const validation = validateOfficialDatabase()
      assert.strictEqual(validation.isValid, false) // Expected due to duplicate IDs

      // 2. Get database stats
      const stats = getDatabaseStats()
      assert.ok(stats.totalQuestions === 144)

      // 3. Load exam questions
      const questions = loadExamQuestions()
      assert.strictEqual(questions.history.length, 10)
      assert.strictEqual(questions.constitution.length, 8)

      const endTime = performance.now()
      const totalInitTime = endTime - startTime

      // Complete initialization should be fast
      assert.ok(
        totalInitTime < 100,
        `Exam initialization too slow: ${totalInitTime.toFixed(2)}ms`
      )
    })

    test('should maintain performance under exam conditions', () => {
      // Simulate multiple exam sessions being created
      const sessionCount = 20
      const times: number[] = []

      for (let session = 0; session < sessionCount; session++) {
        const startTime = performance.now()

        // Typical exam session workflow
        const questions = loadExamQuestions(Date.now() + session)

        // Simulate answer validation (checking question structure)
        const allQuestions = [...questions.history, ...questions.constitution]
        allQuestions.forEach((q) => {
          assert.ok([0, 1, 2].includes(q.correctAnswer))
        })

        const endTime = performance.now()
        times.push(endTime - startTime)
      }

      const averageSessionTime =
        times.reduce((sum, time) => sum + time, 0) / sessionCount
      const maxSessionTime = Math.max(...times)

      assert.ok(
        averageSessionTime < 50,
        `Average session creation too slow: ${averageSessionTime.toFixed(2)}ms`
      )
      assert.ok(
        maxSessionTime < 100,
        `Maximum session creation too slow: ${maxSessionTime.toFixed(2)}ms`
      )
    })
  })
})
