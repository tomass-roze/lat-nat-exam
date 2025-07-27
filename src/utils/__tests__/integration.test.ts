/**
 * @fileoverview Integration tests for Latvian text processing utilities
 *
 * Tests integration between text processing utilities and existing type system,
 * constants, and components. Validates that Issue #4 requirements are fully met.
 */

import { strict as assert } from 'node:assert'
import { test, describe } from 'node:test'

// Import all modules to test integration
import * as textProcessing from '../textProcessing'
import * as latvianLanguage from '../latvianLanguage'
import * as performance from '../performance'

// Import existing types and constants
import {
  NATIONAL_ANTHEM_TEXT,
  NATIONAL_ANTHEM_REFERENCE,
  SCORING_THRESHOLDS,
  EXAM_SECTIONS,
} from '@/types'

import type { CharacterDiff } from '@/types'

// ===== TYPE INTEGRATION TESTS =====

describe('Type System Integration', () => {
  test('compareAnthemText returns valid AnthemResult', () => {
    const result = textProcessing.compareAnthemText(NATIONAL_ANTHEM_TEXT)

    // Verify all required AnthemResult properties
    assert.ok(typeof result.passed === 'boolean')
    assert.ok(typeof result.accuracy === 'number')
    assert.ok(Array.isArray(result.characterDifferences))
    assert.ok(typeof result.submittedText === 'string')
    assert.ok(typeof result.referenceText === 'string')
    assert.ok(typeof result.totalCharacters === 'number')
    assert.ok(typeof result.correctCharacters === 'number')
    assert.ok(typeof result.analysis === 'object')

    // Verify analysis object structure
    const analysis = result.analysis
    assert.ok(Array.isArray(analysis.lineStats))
    assert.ok(Array.isArray(analysis.errorPatterns))
    assert.ok(typeof analysis.timing === 'object')
    assert.ok(typeof analysis.qualityMetrics === 'object')
  })

  test('generateCharacterDifferences returns valid CharacterDiff array', () => {
    const differences = textProcessing.generateCharacterDifferences(
      'abc',
      'aXc'
    )

    assert.ok(Array.isArray(differences))
    assert.strictEqual(differences.length, 1)

    const diff = differences[0]
    assert.ok(typeof diff.position === 'number')
    assert.ok(typeof diff.expected === 'string')
    assert.ok(typeof diff.actual === 'string')
    assert.ok(['missing', 'extra', 'incorrect', 'correct'].includes(diff.type))
    assert.ok(typeof diff.lineNumber === 'number')
    assert.ok(typeof diff.linePosition === 'number')
  })

  test('analyzeByLines returns valid AnthemLineStats array', () => {
    const stats = textProcessing.analyzeByLines('line1\nline2', 'line1\nline2')

    assert.ok(Array.isArray(stats))
    assert.strictEqual(stats.length, 2)

    stats.forEach((stat) => {
      assert.ok(typeof stat.lineNumber === 'number')
      assert.ok(typeof stat.accuracy === 'number')
      assert.ok(typeof stat.passed === 'boolean')
      assert.ok(typeof stat.errorCount === 'number')
      assert.ok(typeof stat.expected === 'string')
      assert.ok(typeof stat.submitted === 'string')
    })
  })

  test('detectErrorPatterns returns valid ErrorPattern array', () => {
    const differences: CharacterDiff[] = [
      {
        position: 0,
        expected: 'ā',
        actual: 'a',
        type: 'incorrect',
        lineNumber: 1,
        linePosition: 1,
      },
    ]

    const patterns = textProcessing.detectErrorPatterns(differences)

    assert.ok(Array.isArray(patterns))

    patterns.forEach((pattern) => {
      assert.ok(
        [
          'diacritic_missing',
          'case_error',
          'word_order',
          'spelling',
          'punctuation',
        ].includes(pattern.type)
      )
      assert.ok(typeof pattern.count === 'number')
      assert.ok(Array.isArray(pattern.examples))
      if (pattern.suggestion) {
        assert.ok(typeof pattern.suggestion === 'string')
      }
    })
  })
})

// ===== CONSTANTS INTEGRATION TESTS =====

describe('Constants Integration', () => {
  test('textProcessing uses SCORING_THRESHOLDS correctly', () => {
    const perfectResult = textProcessing.compareAnthemText(NATIONAL_ANTHEM_TEXT)
    assert.strictEqual(perfectResult.passed, true)
    assert.ok(
      perfectResult.accuracy >= SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE
    )

    const poorResult = textProcessing.compareAnthemText('completely wrong text')
    assert.strictEqual(poorResult.passed, false)
    assert.ok(poorResult.accuracy < SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE)
  })

  test('textProcessing uses NATIONAL_ANTHEM_TEXT correctly', () => {
    const result = textProcessing.compareAnthemText(NATIONAL_ANTHEM_TEXT)
    assert.strictEqual(result.referenceText, NATIONAL_ANTHEM_TEXT)
    assert.strictEqual(result.totalCharacters, NATIONAL_ANTHEM_TEXT.length)
  })

  test('textProcessing handles NATIONAL_ANTHEM_REFERENCE array', () => {
    const joinedText = NATIONAL_ANTHEM_REFERENCE.join('\n')
    assert.strictEqual(joinedText, NATIONAL_ANTHEM_TEXT)

    const result = textProcessing.compareAnthemText(joinedText)
    assert.strictEqual(result.passed, true)
    assert.strictEqual(result.accuracy, 100)
  })

  test('performance thresholds align with requirements', () => {
    assert.strictEqual(
      performance.PERFORMANCE_THRESHOLDS.MAX_ANTHEM_PROCESSING_TIME,
      10
    )
    assert.ok(performance.PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE > 0)
    assert.ok(performance.PERFORMANCE_THRESHOLDS.MAX_CACHE_SIZE > 0)
  })
})

// ===== LATVIAN LANGUAGE INTEGRATION TESTS =====

describe('Latvian Language Integration', () => {
  test('latvianLanguage constants work with textProcessing', () => {
    const diacriticText = latvianLanguage.LATVIAN_ALPHABET.DIACRITICS.join('')
    const validation = latvianLanguage.validateLatvianText(diacriticText)

    assert.strictEqual(validation.isValid, true)
    assert.strictEqual(validation.invalidCharacters.length, 0)

    const confidence = latvianLanguage.getLatvianTextConfidence(diacriticText)
    assert.ok(confidence > 0.5)
  })

  test('input method handling works with national anthem', () => {
    // Convert anthem to alternative input method
    const anthemWithAlternatives = NATIONAL_ANTHEM_TEXT.replace(/ā/g, 'a:')
      .replace(/ē/g, 'e:')
      .replace(/ī/g, 'i:')
      .replace(/ū/g, 'u:')

    const processed = latvianLanguage.handleLatvianTypingVariations(
      anthemWithAlternatives
    )
    const result = textProcessing.compareAnthemText(processed)

    assert.strictEqual(result.passed, true)
    assert.ok(result.accuracy >= SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE)
  })

  test('diacritic handling integrates with text comparison', () => {
    const withoutDiacritics =
      latvianLanguage.removeLatvianDiacritics(NATIONAL_ANTHEM_TEXT)
    const result = textProcessing.compareAnthemText(withoutDiacritics)

    // Should detect missing diacritics as errors
    assert.ok(result.characterDifferences.length > 0)

    const diacriticErrors = result.analysis.errorPatterns.find(
      (p) => p.type === 'diacritic_missing'
    )
    assert.ok(diacriticErrors, 'Should detect missing diacritic patterns')
    assert.ok(diacriticErrors.count > 0)
  })
})

// ===== PERFORMANCE INTEGRATION TESTS =====

describe('Performance Integration', () => {
  test('optimized functions integrate with type system', () => {
    const submissions = [NATIONAL_ANTHEM_TEXT, 'different text']
    const results = performance.batchProcessTexts(
      submissions,
      NATIONAL_ANTHEM_TEXT
    )

    assert.strictEqual(results.length, 2)

    // Each result should be a valid AnthemResult
    results.forEach((result) => {
      assert.ok(typeof result.passed === 'boolean')
      assert.ok(typeof result.accuracy === 'number')
      assert.ok(Array.isArray(result.characterDifferences))
      assert.ok(typeof result.analysis === 'object')
    })
  })

  test('performance monitoring works with all text processing functions', () => {
    performance.clearPerformanceCaches()
    performance.performanceMonitor.clearMetrics()

    const startMeasurement = performance.performanceMonitor.startMeasurement()

    // Use various text processing functions
    textProcessing.normalizeLatvianText(NATIONAL_ANTHEM_TEXT)
    textProcessing.calculateAccuracy(NATIONAL_ANTHEM_TEXT, NATIONAL_ANTHEM_TEXT)
    textProcessing.compareAnthemText(NATIONAL_ANTHEM_TEXT)

    const metrics = startMeasurement()

    assert.ok(
      metrics.executionTime <
        performance.PERFORMANCE_THRESHOLDS.MAX_ANTHEM_PROCESSING_TIME
    )
    assert.ok(typeof metrics.memoryUsage === 'number')
    assert.ok(typeof metrics.withinThreshold === 'boolean')
  })

  test('caching improves performance without affecting results', () => {
    performance.clearPerformanceCaches()

    // First run (cache miss)
    const result1 = textProcessing.compareAnthemText(NATIONAL_ANTHEM_TEXT)

    // Second run (cache hit)
    const result2 = textProcessing.compareAnthemText(NATIONAL_ANTHEM_TEXT)

    // Results should be identical
    assert.strictEqual(result1.passed, result2.passed)
    assert.strictEqual(result1.accuracy, result2.accuracy)
    assert.strictEqual(
      result1.characterDifferences.length,
      result2.characterDifferences.length
    )
  })
})

// ===== COMPONENT INTEGRATION TESTS =====

describe('Component Integration Readiness', () => {
  test('functions provide data compatible with LatvianTextTest component', () => {
    // Test data that would be used in the component
    const testTexts = [
      'Dievs, svētī Latviju!',
      'dievs sveti latviju', // Missing diacritics
      'DIEVS, SVĒTĪ LATVIJU!', // Different case
    ]

    testTexts.forEach((text) => {
      const validation = latvianLanguage.validateLatvianText(text)
      const confidence = latvianLanguage.getLatvianTextConfidence(text)
      const result = textProcessing.validateAnthemText(text)

      // All functions should return usable data
      assert.ok(typeof validation.isValid === 'boolean')
      assert.ok(Array.isArray(validation.invalidCharacters))
      assert.ok(Array.isArray(validation.suggestions))
      assert.ok(typeof confidence === 'number')
      assert.ok(typeof result === 'object')
    })
  })

  test('error patterns provide actionable feedback', () => {
    const textWithErrors =
      latvianLanguage.removeLatvianDiacritics(NATIONAL_ANTHEM_TEXT)
    const result = textProcessing.compareAnthemText(textWithErrors)

    // Should provide specific error patterns
    assert.ok(result.analysis.errorPatterns.length > 0)

    result.analysis.errorPatterns.forEach((pattern) => {
      assert.ok(pattern.examples.length > 0)
      assert.ok(pattern.count > 0)
      if (pattern.suggestion) {
        assert.ok(pattern.suggestion.length > 0)
      }
    })
  })

  test('line-by-line analysis provides detailed feedback', () => {
    const result = textProcessing.compareAnthemText(NATIONAL_ANTHEM_TEXT)

    assert.ok(result.analysis.lineStats.length > 0)

    result.analysis.lineStats.forEach((stat) => {
      assert.ok(stat.lineNumber > 0)
      assert.ok(stat.accuracy >= 0 && stat.accuracy <= 100)
      assert.ok(typeof stat.passed === 'boolean')
      assert.ok(stat.errorCount >= 0)
    })
  })
})

// ===== COMPREHENSIVE WORKFLOW TESTS =====

describe('Complete Workflow Integration', () => {
  test('handles complete user workflow from input to result', () => {
    // Simulate user input with various issues
    const userInput = `DIEVS, SVETI LATVIJU,
Mus' dargo teviju,
Sveti jel Latviju,
Ak, sveti jel to!

Kur latvju meitas zied,
Kur latvju deli dzied,
Laid mums tur laime diet,
Mus' Latvija!`

    // Step 1: Validate input
    const validation = latvianLanguage.validateLatvianText(userInput)
    assert.ok(typeof validation.isValid === 'boolean')

    // Step 2: Handle typing variations
    const processed = latvianLanguage.handleLatvianTypingVariations(userInput)

    // Step 3: Compare with reference
    const result = textProcessing.compareAnthemText(processed)

    // Should provide comprehensive analysis
    assert.ok(typeof result.passed === 'boolean')
    assert.ok(typeof result.accuracy === 'number')
    assert.ok(result.analysis.lineStats.length > 0)
    assert.ok(result.analysis.errorPatterns.length >= 0)

    // Should identify specific error patterns
    const diacriticErrors = result.analysis.errorPatterns.find(
      (p) => p.type === 'diacritic_missing'
    )
    assert.ok(diacriticErrors, 'Should detect missing diacritics')
  })

  test('performance meets requirements under realistic load', () => {
    // Simulate multiple users taking the exam
    const userInputs = Array(10).fill(NATIONAL_ANTHEM_TEXT)

    const startTime = globalThis.performance.now()
    const results = performance.batchProcessTexts(
      userInputs,
      NATIONAL_ANTHEM_TEXT
    )
    const endTime = globalThis.performance.now()

    const executionTime = endTime - startTime

    // Should handle multiple users efficiently
    assert.strictEqual(results.length, 10)
    assert.ok(executionTime < 100) // Should complete quickly

    results.forEach((result) => {
      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.accuracy, 100)
    })
  })

  test('integration with exam section configuration', () => {
    // Verify anthem section integration
    assert.strictEqual(EXAM_SECTIONS.ANTHEM, 'anthem')

    const result = textProcessing.compareAnthemText(NATIONAL_ANTHEM_TEXT)

    // Should align with exam configuration
    assert.ok(result.accuracy >= SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE)
    assert.ok(
      result.totalCharacters >= SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS
    )
  })
})

// ===== ISSUE #4 REQUIREMENTS VALIDATION =====

describe('Issue #4 Requirements Compliance', () => {
  test('UTF-8 compliance for Latvian diacritics', () => {
    const allDiacritics = latvianLanguage.LATVIAN_ALPHABET.DIACRITICS.join('')

    // Should handle all Latvian diacritics correctly
    const normalized = textProcessing.normalizeLatvianText(allDiacritics)
    assert.ok(normalized.length > 0)

    // Should maintain UTF-8 integrity
    const encoded = new TextEncoder().encode(allDiacritics)
    const decoded = new TextDecoder().decode(encoded)
    assert.strictEqual(decoded, allDiacritics)
  })

  test('character-by-character comparison accuracy', () => {
    const reference = 'āčēģīķļņšūž'
    const submitted = 'acegiklnsuz' // Without diacritics

    const differences = textProcessing.generateCharacterDifferences(
      reference,
      submitted
    )

    // Should detect each diacritic difference
    assert.strictEqual(differences.length, 11) // One for each diacritic
    differences.forEach((diff) => {
      assert.strictEqual(diff.type, 'incorrect')
      assert.ok(latvianLanguage.isLatvianDiacritic(diff.expected))
      assert.ok(latvianLanguage.isLatvianBaseLetter(diff.actual))
    })
  })

  test('75% accuracy threshold implementation', () => {
    assert.strictEqual(SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE, 75)

    // Test around the threshold
    const reference = 'abcdefghij' // 10 characters
    const submitted75 = 'abcdefghXX' // 8 correct = 80%
    const submitted70 = 'abcdefgXXX' // 7 correct = 70%

    const result75 = textProcessing.compareAnthemText(submitted75, reference)
    const result70 = textProcessing.compareAnthemText(submitted70, reference)

    assert.strictEqual(result75.passed, true) // 80% > 75%
    assert.strictEqual(result70.passed, false) // 70% < 75%
  })

  test('case-insensitive comparison', () => {
    const lowercase = NATIONAL_ANTHEM_TEXT.toLowerCase()
    const uppercase = NATIONAL_ANTHEM_TEXT.toUpperCase()
    const mixed = NATIONAL_ANTHEM_TEXT

    const result1 = textProcessing.compareAnthemText(lowercase)
    const result2 = textProcessing.compareAnthemText(uppercase)
    const result3 = textProcessing.compareAnthemText(mixed)

    // All should pass regardless of case
    assert.strictEqual(result1.passed, true)
    assert.strictEqual(result2.passed, true)
    assert.strictEqual(result3.passed, true)

    // All should have 100% accuracy
    assert.strictEqual(result1.accuracy, 100)
    assert.strictEqual(result2.accuracy, 100)
    assert.strictEqual(result3.accuracy, 100)
  })

  test('detailed difference reporting with positions', () => {
    const reference = 'line1\nline2'
    const submitted = 'line1\nliXe2'

    const differences = textProcessing.generateCharacterDifferences(
      reference,
      submitted
    )

    assert.strictEqual(differences.length, 1)

    const diff = differences[0]
    assert.strictEqual(diff.lineNumber, 2)
    assert.strictEqual(diff.linePosition, 3)
    assert.strictEqual(diff.expected, 'n')
    assert.strictEqual(diff.actual, 'X')
    assert.strictEqual(diff.type, 'incorrect')
  })

  test('performance requirement <10ms for anthem-length text', () => {
    const startTime = globalThis.performance.now()

    const result = textProcessing.compareAnthemText(NATIONAL_ANTHEM_TEXT)

    const endTime = globalThis.performance.now()
    const executionTime = endTime - startTime

    // Must complete in under 10ms
    assert.ok(
      executionTime < 10,
      `Processing took ${executionTime}ms, requirement is <10ms`
    )

    // Should still produce correct results
    assert.strictEqual(result.passed, true)
    assert.strictEqual(result.accuracy, 100)
  })
})
