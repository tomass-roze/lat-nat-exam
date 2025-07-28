/**
 * @fileoverview Tests for form validation system
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  validateAnthemSection,
  validateHistorySection,
  validateConstitutionSection,
  validateTestState,
  createValidationError,
  isSectionValid,
  getSectionErrors,
} from '../validation'
import type { TestState } from '@/types/exam'
import { VALIDATION_ERRORS } from '@/types/constants'

describe('Validation System', () => {
  describe('validateAnthemSection', () => {
    it('should fail validation for empty text', () => {
      const result = validateAnthemSection('')
      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.errors.length, 1)
      assert.strictEqual(
        result.errors[0].code,
        VALIDATION_ERRORS.REQUIRED_FIELD
      )
    })

    it('should fail validation for text too short', () => {
      const result = validateAnthemSection('Short text')
      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.errors.length, 1)
      assert.strictEqual(
        result.errors[0].code,
        VALIDATION_ERRORS.INSUFFICIENT_LENGTH
      )
    })

    it('should pass validation for correct anthem text', () => {
      const correctAnthem = `Dievs, svētī Latviju,
Mūs' dārgo tēviju,
Svētī jel Latviju,
Ak, svētī jel to!

Kur latvju meitas zied,
Kur latvju dēli dzied,
Laid mums tur laimē diet,
Mūs' Latvijā!`

      const result = validateAnthemSection(correctAnthem)
      assert.strictEqual(result.isValid, true)
      assert.strictEqual(result.errors.length, 0)
    })
  })

  describe('validateHistorySection', () => {
    it('should fail validation for incomplete answers', () => {
      const answers = { 1: 0, 2: 1 } as Record<number, 0 | 1 | 2>
      const result = validateHistorySection(answers)
      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.errors.length, 1)
      assert.strictEqual(
        result.errors[0].code,
        VALIDATION_ERRORS.REQUIRED_FIELD
      )
    })

    it('should pass validation for complete answers', () => {
      const answers = {
        1: 0,
        2: 1,
        3: 2,
        4: 0,
        5: 1,
        6: 2,
        7: 0,
        8: 1,
        9: 2,
        10: 0,
      } as Record<number, 0 | 1 | 2>
      const result = validateHistorySection(answers)
      assert.strictEqual(result.isValid, true)
      assert.strictEqual(result.errors.length, 0)
    })
  })

  describe('validateConstitutionSection', () => {
    it('should fail validation for incomplete answers', () => {
      const answers = { 1: 0, 2: 1 } as Record<number, 0 | 1 | 2>
      const result = validateConstitutionSection(answers)
      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.errors.length, 1)
      assert.strictEqual(
        result.errors[0].code,
        VALIDATION_ERRORS.REQUIRED_FIELD
      )
    })

    it('should pass validation for complete answers', () => {
      const answers = {
        1: 0,
        2: 1,
        3: 2,
        4: 0,
        5: 1,
        6: 2,
        7: 0,
        8: 1,
      } as Record<number, 0 | 1 | 2>
      const result = validateConstitutionSection(answers)
      assert.strictEqual(result.isValid, true)
      assert.strictEqual(result.errors.length, 0)
    })
  })

  describe('validateTestState', () => {
    const createTestState = (
      overrides: Partial<TestState> = {}
    ): TestState => ({
      anthemText: '',
      historyAnswers: {},
      constitutionAnswers: {},
      startTime: Date.now(),
      lastSaved: Date.now(),
      isCompleted: false,
      currentSection: 'anthem',
      selectedQuestions: {
        history: [],
        constitution: [],
        selectionMetadata: {
          randomSeed: 123,
          selectedAt: Date.now(),
          selectedIds: { history: [], constitution: [] },
        },
      },
      metadata: {
        sessionId: 'test',
        timezone: 'UTC',
        attemptNumber: 1,
        darkMode: false,
      },
      ...overrides,
    })

    it('should fail validation for incomplete test state', () => {
      const testState = createTestState()
      const result = validateTestState(testState)
      assert.strictEqual(result.isValid, false)
      assert.strictEqual(result.isSubmissionReady, false)
      assert.ok(result.summary.errorCount > 0)
    })

    it('should pass validation for complete test state', () => {
      const correctAnthem = `Dievs, svētī Latviju,
Mūs' dārgo tēviju,
Svētī jel Latviju,
Ak, svētī jel to!

Kur latvju meitas zied,
Kur latvju dēli dzied,
Laid mums tur laimē diet,
Mūs' Latvijā!`

      const testState = createTestState({
        anthemText: correctAnthem,
        historyAnswers: {
          1: 0,
          2: 1,
          3: 2,
          4: 0,
          5: 1,
          6: 2,
          7: 0,
          8: 1,
          9: 2,
          10: 0,
        },
        constitutionAnswers: {
          1: 0,
          2: 1,
          3: 2,
          4: 0,
          5: 1,
          6: 2,
          7: 0,
          8: 1,
        },
      })

      const result = validateTestState(testState)
      assert.strictEqual(result.isValid, true)
      assert.strictEqual(result.isSubmissionReady, true)
      assert.strictEqual(result.summary.errorCount, 0)
    })
  })

  describe('Helper functions', () => {
    it('should create validation error correctly', () => {
      const error = createValidationError(
        VALIDATION_ERRORS.REQUIRED_FIELD,
        'Test message',
        'anthem',
        'anthemText',
        'Test suggestion'
      )

      assert.strictEqual(error.code, VALIDATION_ERRORS.REQUIRED_FIELD)
      assert.strictEqual(error.message, 'Test message')
      assert.strictEqual(error.section, 'anthem')
      assert.strictEqual(error.field, 'anthemText')
      assert.strictEqual(error.suggestion, 'Test suggestion')
      assert.strictEqual(error.severity, 'error')
    })

    it('should check section validity correctly', () => {
      const validResult = {
        fieldResults: {
          anthemText: { isValid: true },
          historyAnswers: { isValid: false },
          constitutionAnswers: { isValid: true },
        },
      } as any

      assert.strictEqual(isSectionValid(validResult, 'anthem'), true)
      assert.strictEqual(isSectionValid(validResult, 'history'), false)
      assert.strictEqual(isSectionValid(validResult, 'constitution'), true)
    })

    it('should get section errors correctly', () => {
      const testError = createValidationError(
        VALIDATION_ERRORS.REQUIRED_FIELD,
        'Test error'
      )

      const result = {
        fieldResults: {
          anthemText: { errors: [testError] },
          historyAnswers: { errors: [] },
          constitutionAnswers: { errors: [] },
        },
      } as any

      assert.strictEqual(getSectionErrors(result, 'anthem').length, 1)
      assert.strictEqual(getSectionErrors(result, 'history').length, 0)
      assert.strictEqual(getSectionErrors(result, 'constitution').length, 0)
    })
  })
})
