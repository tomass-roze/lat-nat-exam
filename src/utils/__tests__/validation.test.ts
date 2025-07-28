/**
 * @fileoverview Tests for form validation system
 */

import { describe, it, expect } from 'vitest'
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
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe(VALIDATION_ERRORS.REQUIRED_FIELD)
    })

    it('should fail validation for text too short', () => {
      const result = validateAnthemSection('Short text')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe(VALIDATION_ERRORS.INSUFFICIENT_LENGTH)
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
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateHistorySection', () => {
    it('should fail validation for incomplete answers', () => {
      const answers = { 1: 0, 2: 1 } as Record<number, 0 | 1 | 2>
      const result = validateHistorySection(answers)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe(VALIDATION_ERRORS.REQUIRED_FIELD)
    })

    it('should pass validation for complete answers', () => {
      const answers = {
        1: 0, 2: 1, 3: 2, 4: 0, 5: 1,
        6: 2, 7: 0, 8: 1, 9: 2, 10: 0
      } as Record<number, 0 | 1 | 2>
      const result = validateHistorySection(answers)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateConstitutionSection', () => {
    it('should fail validation for incomplete answers', () => {
      const answers = { 1: 0, 2: 1 } as Record<number, 0 | 1 | 2>
      const result = validateConstitutionSection(answers)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe(VALIDATION_ERRORS.REQUIRED_FIELD)
    })

    it('should pass validation for complete answers', () => {
      const answers = {
        1: 0, 2: 1, 3: 2, 4: 0,
        5: 1, 6: 2, 7: 0, 8: 1
      } as Record<number, 0 | 1 | 2>
      const result = validateConstitutionSection(answers)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateTestState', () => {
    const createTestState = (overrides: Partial<TestState> = {}): TestState => ({
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
          selectedIds: { history: [], constitution: [] }
        }
      },
      metadata: {
        sessionId: 'test',
        timezone: 'UTC',
        attemptNumber: 1,
        darkMode: false
      },
      ...overrides
    })

    it('should fail validation for incomplete test state', () => {
      const testState = createTestState()
      const result = validateTestState(testState)
      expect(result.isValid).toBe(false)
      expect(result.isSubmissionReady).toBe(false)
      expect(result.summary.errorCount).toBeGreaterThan(0)
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
          1: 0, 2: 1, 3: 2, 4: 0, 5: 1,
          6: 2, 7: 0, 8: 1, 9: 2, 10: 0
        },
        constitutionAnswers: {
          1: 0, 2: 1, 3: 2, 4: 0,
          5: 1, 6: 2, 7: 0, 8: 1
        }
      })

      const result = validateTestState(testState)
      expect(result.isValid).toBe(true)
      expect(result.isSubmissionReady).toBe(true)
      expect(result.summary.errorCount).toBe(0)
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

      expect(error.code).toBe(VALIDATION_ERRORS.REQUIRED_FIELD)
      expect(error.message).toBe('Test message')
      expect(error.section).toBe('anthem')
      expect(error.field).toBe('anthemText')
      expect(error.suggestion).toBe('Test suggestion')
      expect(error.severity).toBe('error')
    })

    it('should check section validity correctly', () => {
      const validResult = {
        fieldResults: {
          anthemText: { isValid: true } as any,
          historyAnswers: { isValid: false } as any,
          constitutionAnswers: { isValid: true } as any
        }
      } as any

      expect(isSectionValid(validResult, 'anthem')).toBe(true)
      expect(isSectionValid(validResult, 'history')).toBe(false)
      expect(isSectionValid(validResult, 'constitution')).toBe(true)
    })

    it('should get section errors correctly', () => {
      const testError = createValidationError(
        VALIDATION_ERRORS.REQUIRED_FIELD,
        'Test error'
      )

      const result = {
        fieldResults: {
          anthemText: { errors: [testError] } as any,
          historyAnswers: { errors: [] } as any,
          constitutionAnswers: { errors: [] } as any
        }
      } as any

      expect(getSectionErrors(result, 'anthem')).toHaveLength(1)
      expect(getSectionErrors(result, 'history')).toHaveLength(0)
      expect(getSectionErrors(result, 'constitution')).toHaveLength(0)
    })
  })
})