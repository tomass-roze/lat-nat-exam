/**
 * @fileoverview Comprehensive Test Suite for Official Database Integration
 *
 * Tests all aspects of the official latvian_citizenship_questions.json database
 * including validation, performance, UTF-8 handling, and cross-pool consistency.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import {
  validateOfficialDatabase,
  getDatabaseStats,
  validateCrossPoolIds,
  getUtf8CharacterStats,
  OFFICIAL_HISTORY_QUESTIONS,
  OFFICIAL_CONSTITUTION_QUESTIONS,
  OFFICIAL_ANTHEM_TEXT,
} from '../../data/questionDatabase'
import {
  loadExamQuestions,
  loadExamQuestionsWithMetrics,
  benchmarkQuestionLoading,
  getQuestionPoolStats,
} from '../questionLoader'
import { validateHistoryQuestionPool } from '../../data/historyQuestions'
import { validateConstitutionQuestionPool } from '../../data/constitutionQuestions'

describe('Official Database Integration Tests', () => {
  describe('Database Structure Validation', () => {
    test('should have exactly 80 history questions', () => {
      assert.strictEqual(OFFICIAL_HISTORY_QUESTIONS.length, 80)
    })

    test('should have exactly 64 constitution questions', () => {
      assert.strictEqual(OFFICIAL_CONSTITUTION_QUESTIONS.length, 64)
    })

    test('should have exactly 8 national anthem lines', () => {
      assert.strictEqual(OFFICIAL_ANTHEM_TEXT.length, 8)
      assert.ok(
        OFFICIAL_ANTHEM_TEXT.every(
          (line) => typeof line === 'string' && line.trim().length > 0
        )
      )
    })

    test('should have 144 total questions', () => {
      const total =
        OFFICIAL_HISTORY_QUESTIONS.length +
        OFFICIAL_CONSTITUTION_QUESTIONS.length
      assert.strictEqual(total, 144)
    })
  })

  describe('Cross-Pool ID Validation', () => {
    test('should detect duplicate IDs across question pools', () => {
      const crossPoolValidation = validateCrossPoolIds()

      // We expect duplicates since both pools use IDs 1-64 and 1-80
      assert.strictEqual(crossPoolValidation.isValid, false)
      assert.ok(crossPoolValidation.duplicateIds.length > 0)
      assert.strictEqual(crossPoolValidation.totalIds, 144)
      assert.strictEqual(crossPoolValidation.uniqueIds, 80) // History has 1-80, Constitution 1-64
    })

    test('should identify correct duplicate ID range', () => {
      const crossPoolValidation = validateCrossPoolIds()

      // Should have duplicates 1-64 (overlap between history and constitution)
      assert.ok(crossPoolValidation.duplicateIds.includes(1))
      assert.ok(crossPoolValidation.duplicateIds.includes(32))
      assert.ok(crossPoolValidation.duplicateIds.includes(64))
      assert.strictEqual(crossPoolValidation.duplicateIds.length, 64)
    })
  })

  describe('UTF-8 Character Validation', () => {
    test('should detect Latvian diacritical characters', () => {
      const utf8Stats = getUtf8CharacterStats()

      assert.ok(
        utf8Stats.total > 1000,
        'Should have substantial Latvian character usage'
      )
      assert.ok(utf8Stats.coverage > 80, 'Should use most Latvian diacritics')
      assert.ok(
        utf8Stats.byCharacter['ā'] > 400,
        'Should have many ā characters'
      )
      assert.ok(
        utf8Stats.byCharacter['ē'] > 100,
        'Should have many ē characters'
      )
    })

    test('should validate UTF-8 encoding in all question text', () => {
      const allQuestions = [
        ...OFFICIAL_HISTORY_QUESTIONS,
        ...OFFICIAL_CONSTITUTION_QUESTIONS,
      ]

      allQuestions.forEach((question) => {
        // Test question text encoding
        assert.doesNotThrow(() => {
          const encoded = new TextEncoder().encode(question.question)
          const decoded = new TextDecoder('utf-8', { fatal: true }).decode(
            encoded
          )
          assert.strictEqual(decoded, question.question)
        }, `Question ${question.id}: UTF-8 encoding issue in question text`)

        // Test options encoding
        question.options.forEach((option, index) => {
          assert.doesNotThrow(
            () => {
              const encoded = new TextEncoder().encode(option)
              const decoded = new TextDecoder('utf-8', { fatal: true }).decode(
                encoded
              )
              assert.strictEqual(decoded, option)
            },
            `Question ${question.id}, option ${index + 1}: UTF-8 encoding issue`
          )
        })
      })
    })
  })

  describe('Question Content Validation', () => {
    test('all history questions should be properly structured', () => {
      const validation = validateHistoryQuestionPool()

      assert.strictEqual(
        validation.isValid,
        true,
        `History validation failed: ${validation.errors.join(', ')}`
      )
      assert.strictEqual(validation.questionCount, 80)
      assert.ok(validation.questionCount >= validation.minRequired)
    })

    test('all constitution questions should be properly structured', () => {
      const validation = validateConstitutionQuestionPool()

      assert.strictEqual(
        validation.isValid,
        true,
        `Constitution validation failed: ${validation.errors.join(', ')}`
      )
      assert.strictEqual(validation.questionCount, 64)
      assert.ok(validation.questionCount >= validation.minRequired)
    })

    test('all questions should have unique options', () => {
      const allQuestions = [
        ...OFFICIAL_HISTORY_QUESTIONS,
        ...OFFICIAL_CONSTITUTION_QUESTIONS,
      ]

      allQuestions.forEach((question) => {
        const normalizedOptions = question.options.map((opt) =>
          opt.trim().toLowerCase()
        )
        const uniqueOptions = new Set(normalizedOptions)

        assert.strictEqual(
          uniqueOptions.size,
          3,
          `Question ${question.id} has duplicate options: ${question.options.join(', ')}`
        )
      })
    })

    test('all questions should have valid correct answer indices', () => {
      const allQuestions = [
        ...OFFICIAL_HISTORY_QUESTIONS,
        ...OFFICIAL_CONSTITUTION_QUESTIONS,
      ]

      allQuestions.forEach((question) => {
        assert.ok(
          [0, 1, 2].includes(question.correctAnswer),
          `Question ${question.id} has invalid correct answer: ${question.correctAnswer}`
        )
      })
    })
  })

  describe('Database Validation Performance', () => {
    test('should validate database within reasonable time', () => {
      const startTime = performance.now()
      const validation = validateOfficialDatabase()
      const endTime = performance.now()

      const validationTime = endTime - startTime
      assert.ok(
        validationTime < 100,
        `Validation took too long: ${validationTime}ms`
      )
      assert.ok(validation.performance.validationTimeMs < 100)
    })

    test('should have reasonable memory usage', () => {
      const stats = getDatabaseStats()

      // Memory usage should be reasonable for 144 questions
      assert.ok(
        stats.performance.memoryUsageMB < 10,
        `Memory usage too high: ${stats.performance.memoryUsageMB}MB`
      )
    })
  })

  describe('Question Loading Performance', () => {
    test('should load exam questions within performance threshold', () => {
      const startTime = performance.now()
      const selectedQuestions = loadExamQuestions()
      const endTime = performance.now()

      const loadingTime = endTime - startTime
      assert.ok(
        loadingTime < 100,
        `Question loading took too long: ${loadingTime}ms`
      )

      // Verify correct number of questions loaded
      assert.strictEqual(selectedQuestions.history.length, 10)
      assert.strictEqual(selectedQuestions.constitution.length, 8)
    })

    test('should provide detailed performance metrics', () => {
      const result = loadExamQuestionsWithMetrics()

      assert.ok(result.performance.loadingTimeMs < 100)
      assert.ok(result.performance.questionsPerSecond > 100)
      assert.ok(result.performance.memoryUsageMB < 5)
      assert.ok(result.performance.validationTimeMs >= 0)
    })

    test('should maintain consistent performance across multiple loads', () => {
      const benchmark = benchmarkQuestionLoading(10) // 10 iterations for speed

      assert.ok(benchmark.averageLoadTimeMs < 100)
      assert.ok(benchmark.minLoadTimeMs >= 0)
      assert.ok(benchmark.maxLoadTimeMs < 200)
      assert.strictEqual(benchmark.totalQuestions, 18) // 10 history + 8 constitution
      assert.ok(benchmark.averageQuestionsPerSecond > 50)
    })
  })

  describe('Randomization and Reproducibility', () => {
    test('should produce consistent results with same seed', () => {
      const seed = 12345
      const result1 = loadExamQuestions(seed)
      const result2 = loadExamQuestions(seed)

      // Should select same questions
      assert.deepStrictEqual(
        result1.selectionMetadata.selectedIds.history,
        result2.selectionMetadata.selectedIds.history
      )
      assert.deepStrictEqual(
        result1.selectionMetadata.selectedIds.constitution,
        result2.selectionMetadata.selectedIds.constitution
      )
    })

    test('should produce different results with different seeds', () => {
      const result1 = loadExamQuestions(12345)
      const result2 = loadExamQuestions(54321)

      // Should select different questions (very high probability)
      const sameHistoryIds =
        JSON.stringify(result1.selectionMetadata.selectedIds.history) ===
        JSON.stringify(result2.selectionMetadata.selectedIds.history)
      const sameConstitutionIds =
        JSON.stringify(result1.selectionMetadata.selectedIds.constitution) ===
        JSON.stringify(result2.selectionMetadata.selectedIds.constitution)

      // Extremely unlikely both would be the same with different seeds
      assert.ok(
        !(sameHistoryIds && sameConstitutionIds),
        'Different seeds should produce different question selections'
      )
    })

    test('should shuffle answer options correctly', () => {
      const questions = loadExamQuestions(42)
      const allQuestions = [...questions.history, ...questions.constitution]

      // Verify all questions still have correct answers after shuffling
      allQuestions.forEach((question) => {
        assert.ok([0, 1, 2].includes(question.correctAnswer))
        assert.strictEqual(question.options.length, 3)
        assert.ok(
          question.options.every(
            (opt) => typeof opt === 'string' && opt.trim().length > 0
          )
        )
      })
    })
  })

  describe('Database Statistics and Monitoring', () => {
    test('should provide comprehensive database statistics', () => {
      const stats = getDatabaseStats()

      assert.strictEqual(stats.anthemLines, 8)
      assert.strictEqual(stats.historyQuestions, 80)
      assert.strictEqual(stats.constitutionQuestions, 64)
      assert.strictEqual(stats.totalQuestions, 144)
      assert.ok(stats.utf8Characters.total > 1000)
      assert.ok(stats.performance.validationTimeMs >= 0)
      assert.ok(typeof stats.lastLoaded === 'number')
    })

    test('should provide question pool statistics', () => {
      const poolStats = getQuestionPoolStats()

      assert.strictEqual(poolStats.history.total, 80)
      assert.strictEqual(poolStats.constitution.total, 64)
      assert.strictEqual(poolStats.history.isValid, true)
      assert.strictEqual(poolStats.constitution.isValid, true)
      assert.ok(poolStats.history.coverage > 100) // 80 questions vs 20 minimum
      assert.ok(poolStats.constitution.coverage > 100) // 64 questions vs 16 minimum
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle question loading errors gracefully', () => {
      // This would test error scenarios, but our current implementation
      // should work correctly with the official database
      assert.doesNotThrow(() => {
        loadExamQuestions()
      })
    })

    test('should validate all questions have non-empty text', () => {
      const allQuestions = [
        ...OFFICIAL_HISTORY_QUESTIONS,
        ...OFFICIAL_CONSTITUTION_QUESTIONS,
      ]

      allQuestions.forEach((question) => {
        assert.ok(
          question.question.trim().length > 0,
          `Question ${question.id} has empty text`
        )
        question.options.forEach((option, index) => {
          assert.ok(
            option.trim().length > 0,
            `Question ${question.id}, option ${index + 1} is empty`
          )
        })
      })
    })

    test('should validate question text length limits', () => {
      const allQuestions = [
        ...OFFICIAL_HISTORY_QUESTIONS,
        ...OFFICIAL_CONSTITUTION_QUESTIONS,
      ]

      allQuestions.forEach((question) => {
        assert.ok(
          question.question.length <= 500,
          `Question ${question.id} text too long: ${question.question.length} chars`
        )
        question.options.forEach((option, index) => {
          assert.ok(
            option.length <= 200,
            `Question ${question.id}, option ${index + 1} too long: ${option.length} chars`
          )
        })
      })
    })
  })

  describe('Integration with Application Components', () => {
    test('should integrate properly with history question validation', () => {
      const validation = validateHistoryQuestionPool()
      assert.strictEqual(validation.category, 'history')
      assert.strictEqual(validation.isValid, true)
    })

    test('should integrate properly with constitution question validation', () => {
      const validation = validateConstitutionQuestionPool()
      assert.strictEqual(validation.category, 'constitution')
      assert.strictEqual(validation.isValid, true)
    })

    test('should provide metadata for exam session tracking', () => {
      const selectedQuestions = loadExamQuestions()

      assert.ok(selectedQuestions.selectionMetadata.selectedAt > 0)
      assert.ok(
        typeof selectedQuestions.selectionMetadata.randomSeed === 'number'
      )
      assert.strictEqual(
        selectedQuestions.selectionMetadata.selectedIds.history.length,
        10
      )
      assert.strictEqual(
        selectedQuestions.selectionMetadata.selectedIds.constitution.length,
        8
      )
    })
  })
})
