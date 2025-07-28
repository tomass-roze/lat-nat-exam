/**
 * @fileoverview History Questions Test Suite
 *
 * Basic tests for history question pool validation and loading functionality.
 */

import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  HISTORY_QUESTIONS,
  validateHistoryQuestionPool,
} from '@/data/historyQuestions'
import { loadHistoryQuestions } from '@/utils/questionLoader'
import { SCORING_THRESHOLDS } from '@/types/constants'

describe('History Questions Validation', () => {
  it('should have at least 20 questions', () => {
    assert.ok(
      HISTORY_QUESTIONS.length >= 20,
      `Expected at least 20 questions, got ${HISTORY_QUESTIONS.length}`
    )
  })

  it('should validate question pool structure', () => {
    const validation = validateHistoryQuestionPool()
    assert.ok(
      validation.isValid,
      `Validation failed: ${validation.errors.join(', ')}`
    )
    assert.equal(validation.errors.length, 0)
  })

  it('should have unique question IDs', () => {
    const ids = HISTORY_QUESTIONS.map((q) => q.id)
    const uniqueIds = new Set(ids)
    assert.equal(uniqueIds.size, ids.length, 'Question IDs should be unique')
  })

  it('should have valid question structure', () => {
    HISTORY_QUESTIONS.forEach((question, index) => {
      assert.equal(
        question.category,
        'history',
        `Question ${index + 1} should have history category`
      )
      assert.equal(
        question.options.length,
        3,
        `Question ${index + 1} should have exactly 3 options`
      )
      assert.ok(
        question.correctAnswer >= 0 && question.correctAnswer <= 2,
        `Question ${index + 1} should have valid correct answer index`
      )
      assert.ok(
        question.question.trim().length > 0,
        `Question ${index + 1} should have non-empty question text`
      )

      question.options.forEach((option, optIndex) => {
        assert.ok(
          option.trim().length > 0,
          `Question ${index + 1}, option ${optIndex + 1} should not be empty`
        )
      })
    })
  })
})

describe('History Question Loading', () => {
  it('should load exactly 10 questions', () => {
    const result = loadHistoryQuestions()
    assert.equal(
      result.questions.length,
      SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS
    )
  })

  it('should return valid question structure', () => {
    const result = loadHistoryQuestions()

    result.questions.forEach((question, index) => {
      assert.ok(
        typeof question.id === 'number',
        `Question ${index + 1} should have numeric ID`
      )
      assert.ok(
        typeof question.question === 'string',
        `Question ${index + 1} should have string question`
      )
      assert.ok(
        Array.isArray(question.options),
        `Question ${index + 1} should have options array`
      )
      assert.equal(
        question.options.length,
        3,
        `Question ${index + 1} should have 3 options`
      )
      assert.equal(
        question.category,
        'history',
        `Question ${index + 1} should have history category`
      )
      assert.ok(
        question.correctAnswer >= 0 && question.correctAnswer <= 2,
        `Question ${index + 1} should have valid correct answer`
      )
    })
  })

  it('should include selection metadata', () => {
    const result = loadHistoryQuestions()

    assert.ok(result.selectionMetadata, 'Should include selection metadata')
    assert.ok(
      typeof result.selectionMetadata.selectedAt === 'number',
      'Should include selectedAt timestamp'
    )
    assert.ok(
      typeof result.selectionMetadata.randomSeed === 'number',
      'Should include random seed'
    )
    assert.ok(
      Array.isArray(result.selectionMetadata.selectedIds?.history),
      'Should include selected history IDs'
    )
    assert.equal(
      result.selectionMetadata.selectedIds?.history?.length,
      10,
      'Should have 10 selected IDs'
    )
  })

  it('should use provided random seed consistently', () => {
    const seed = 12345
    const result1 = loadHistoryQuestions(seed)
    const result2 = loadHistoryQuestions(seed)

    const ids1 = result1.questions.map((q) => q.id)
    const ids2 = result2.questions.map((q) => q.id)

    assert.deepEqual(
      ids1,
      ids2,
      'Same seed should produce same questions in same order'
    )
    assert.equal(
      result1.selectionMetadata.randomSeed,
      result2.selectionMetadata.randomSeed
    )
  })

  it('should maintain question integrity after randomization', () => {
    const result = loadHistoryQuestions()

    result.questions.forEach((question) => {
      // Find original question
      const original = HISTORY_QUESTIONS.find((q) => q.id === question.id)
      assert.ok(
        original,
        `Original question with ID ${question.id} should exist`
      )

      // Question text should be unchanged
      assert.equal(
        question.question,
        original!.question,
        'Question text should be unchanged'
      )

      // All original options should be present (might be reordered)
      const sortedOriginal = [...original!.options].sort()
      const sortedCurrent = [...question.options].sort()
      assert.deepEqual(
        sortedCurrent,
        sortedOriginal,
        'All options should be present'
      )

      // The correct answer should point to the right option text
      const selectedAnswerText = question.options[question.correctAnswer]
      const originalCorrectText = original!.options[original!.correctAnswer]
      assert.equal(
        selectedAnswerText,
        originalCorrectText,
        'Correct answer should point to right option'
      )
    })
  })
})
