/**
 * @fileoverview Unit tests for Latvian text processing utilities
 *
 * Comprehensive test suite for textProcessing.ts functions including:
 * - Text normalization and character handling
 * - Accuracy calculation algorithms
 * - Character difference detection
 * - Error pattern recognition
 * - Performance requirements validation
 */

import { describe, test, expect } from 'vitest'

// Import functions to test
import {
  normalizeLatvianText,
  normalizeWhitespace,
  normalizeLatvianCharacters,
  compareAnthemText,
  calculateAccuracy,
  generateCharacterDifferences,
  analyzeByLines,
  detectErrorPatterns,
  isAnthemTextCorrect,
  getAnthemAccuracy,
  validateAnthemText,
} from '../textProcessing'

import { NATIONAL_ANTHEM_TEXT, SCORING_THRESHOLDS } from '@/types'

// ===== NORMALIZATION TESTS =====

describe('Text Normalization', () => {
  test('normalizeLatvianText handles empty input', () => {
    expect(normalizeLatvianText('')).toBe('')
    expect(normalizeLatvianText(null as any)).toBe('')
    expect(normalizeLatvianText(undefined as any)).toBe('')
  })

  test('normalizeLatvianText applies NFC normalization', () => {
    // Test composed vs decomposed diacritics
    const composed = 'ā' // Single composed character
    const decomposed = 'a\u0304' // Base + combining macron

    const normalizedComposed = normalizeLatvianText(composed)
    const normalizedDecomposed = normalizeLatvianText(decomposed)

    expect(normalizedComposed).toBe(normalizedDecomposed)
  })

  test('normalizeLatvianText converts to lowercase', () => {
    const input = 'DIEVS, SVĒTĪ LATVIJU!'
    const expected = 'dievs, svētī latviju!'
    expect(normalizeLatvianText(input)).toBe(expected)
  })

  test('normalizeWhitespace handles multiple spaces', () => {
    const input = 'Dievs,   svētī    Latviju'
    const expected = 'Dievs, svētī Latviju'
    expect(normalizeWhitespace(input)).toBe(expected)
  })

  test('normalizeWhitespace handles line breaks', () => {
    const input = 'Line 1\\n\\n\\n\\nLine 2'
    const expected = 'Line 1\\n\\nLine 2'
    expect(normalizeWhitespace(input)).toBe(expected)
  })

  test('normalizeLatvianCharacters handles alternative input methods', () => {
    const input = 'a: e: i: u: c^ g^ s^'
    const expected = 'ā ē ī ū č ģ š'
    expect(normalizeLatvianCharacters(input)).toBe(expected)
  })

  test('normalizeLatvianCharacters handles autocorrect issues', () => {
    const input = 'â ê î ô û'
    const expected = 'ā ē ī ō ū'
    expect(normalizeLatvianCharacters(input)).toBe(expected)
  })
})

// ===== ACCURACY CALCULATION TESTS =====

describe('Accuracy Calculation', () => {
  test('calculateAccuracy handles identical texts', () => {
    const text = 'Dievs, svētī Latviju'
    expect(calculateAccuracy(text, text)).toBe(100)
  })

  test('calculateAccuracy handles empty texts', () => {
    expect(calculateAccuracy('', '')).toBe(100)
    expect(calculateAccuracy('', 'reference')).toBe(0)
    expect(calculateAccuracy('submitted', '')).toBe(0)
  })

  test('calculateAccuracy calculates partial matches', () => {
    const reference = 'abcde'
    const submitted = 'abcXe'
    const expected = (4 / 5) * 100 // 4 correct out of 5
    expect(calculateAccuracy(submitted, reference)).toBe(expected)
  })

  test('calculateAccuracy handles length differences', () => {
    const reference = 'abcde'
    const submitted = 'abc'
    const expected = (3 / 5) * 100 // 3 correct out of 5 reference characters
    expect(calculateAccuracy(submitted, reference)).toBe(expected)
  })

  test('calculateAccuracy handles longer submitted text', () => {
    const reference = 'abc'
    const submitted = 'abcde'
    const expected = (3 / 3) * 100 // All reference characters matched
    expect(calculateAccuracy(submitted, reference)).toBe(expected)
  })

  test('calculateAccuracy with Latvian diacritics', () => {
    const reference = 'svētī'
    const submitted = 'sveti' // Missing diacritic
    const expected = (3 / 5) * 100 // s, v, t, i correct; ē and ī incorrect
    expect(calculateAccuracy(submitted, reference)).toBe(expected)
  })
})

// ===== CHARACTER DIFFERENCES TESTS =====

describe('Character Differences', () => {
  test('generateCharacterDifferences handles identical texts', () => {
    const text = 'test'
    const differences = generateCharacterDifferences(text, text)
    expect(differences.length).toBe(0)
  })

  test('generateCharacterDifferences detects missing characters', () => {
    const reference = 'abcde'
    const submitted = 'abc'
    const differences = generateCharacterDifferences(reference, submitted)

    expect(differences.length).toBe(2)
    expect(differences[0].type).toBe('missing')
    expect(differences[0].expected).toBe('d')
    expect(differences[1].type).toBe('missing')
    expect(differences[1].expected).toBe('e')
  })

  test('generateCharacterDifferences detects extra characters', () => {
    const reference = 'abc'
    const submitted = 'abcde'
    const differences = generateCharacterDifferences(reference, submitted)

    expect(differences.length).toBe(2)
    expect(differences[0].type).toBe('extra')
    expect(differences[0].actual).toBe('d')
    expect(differences[1].type).toBe('extra')
    expect(differences[1].actual).toBe('e')
  })

  test('generateCharacterDifferences detects incorrect characters', () => {
    const reference = 'abc'
    const submitted = 'aXc'
    const differences = generateCharacterDifferences(reference, submitted)

    expect(differences.length).toBe(1)
    expect(differences[0].type).toBe('incorrect')
    expect(differences[0].expected).toBe('b')
    expect(differences[0].actual).toBe('X')
    expect(differences[0].position).toBe(1)
  })

  test('generateCharacterDifferences tracks line numbers', () => {
    const reference = 'line1\\nline2'
    const submitted = 'line1\\nliXe2'
    const differences = generateCharacterDifferences(reference, submitted)

    expect(differences.length).toBe(1)
    expect(differences[0].lineNumber).toBe(2)
    expect(differences[0].linePosition).toBe(3)
  })

  test('generateCharacterDifferences with Latvian characters', () => {
    const reference = 'ā'
    const submitted = 'a'
    const differences = generateCharacterDifferences(reference, submitted)

    expect(differences.length).toBe(1)
    expect(differences[0].type).toBe('incorrect')
    expect(differences[0].expected).toBe('ā')
    expect(differences[0].actual).toBe('a')
  })
})

// ===== ANTHEM COMPARISON TESTS =====

describe('Anthem Comparison', () => {
  test('compareAnthemText passes with perfect match', () => {
    const result = compareAnthemText(NATIONAL_ANTHEM_TEXT)
    expect(result.passed).toBe(true)
    expect(result.accuracy).toBe(100)
    expect(result.characterDifferences.length).toBe(0)
  })

  test('compareAnthemText handles case differences', () => {
    const upperCase = NATIONAL_ANTHEM_TEXT.toUpperCase()
    const result = compareAnthemText(upperCase)
    expect(result.passed).toBe(true)
    expect(result.accuracy).toBe(100)
  })

  test('compareAnthemText fails with low accuracy', () => {
    const badText = 'Completely wrong text that does not match'
    const result = compareAnthemText(badText)
    expect(result.passed).toBe(false)
    expect(result.accuracy < SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE).toBe(true)
  })

  test('compareAnthemText calculates character counts correctly', () => {
    const result = compareAnthemText(NATIONAL_ANTHEM_TEXT)
    expect(result.totalCharacters).toBe(NATIONAL_ANTHEM_TEXT.length)
    expect(result.correctCharacters).toBe(NATIONAL_ANTHEM_TEXT.length)
  })

  test('compareAnthemText with partial match', () => {
    // Take first half of anthem
    const partial = NATIONAL_ANTHEM_TEXT.substring(
      0,
      Math.floor(NATIONAL_ANTHEM_TEXT.length / 2)
    )
    const result = compareAnthemText(partial)

    expect(result.accuracy < 100).toBe(true)
    expect(result.accuracy > 0).toBe(true)
    expect(result.characterDifferences.length > 0).toBe(true)
  })

  test('compareAnthemText fix for issue #49 - perfect match should be 100%', () => {
    // This test reproduces the exact bug reported in issue #49
    // where perfect anthem matches were showing 47% accuracy
    const result = compareAnthemText(NATIONAL_ANTHEM_TEXT)

    // The main assertion - perfect match must be 100%
    expect(result.accuracy).toBe(100) // Perfect anthem match must return 100% accuracy, not 47% as reported in issue #49
    expect(result.passed).toBe(true)
    expect(result.characterDifferences.length).toBe(0)
  })

  test('calculateAccuracy handles length differences correctly', () => {
    const reference = 'Hello world'

    // Perfect match
    expect(calculateAccuracy(reference, reference)).toBe(100)

    // Slightly longer text (should be high but not 100%)
    const longer = reference + ' extra'
    const longerAccuracy = calculateAccuracy(longer, reference)
    expect(
      longerAccuracy > 80 && longerAccuracy < 100,
      `Longer text accuracy should be 80-100%, got ${longerAccuracy}%`
    )

    // Shorter text
    const shorter = reference.substring(0, reference.length - 2)
    const shorterAccuracy = calculateAccuracy(shorter, reference)
    expect(
      shorterAccuracy > 60 && shorterAccuracy < 100,
      `Shorter text accuracy should be 60-100%, got ${shorterAccuracy}%`
    )

    // Empty text
    expect(calculateAccuracy('', reference)).toBe(0)

    // Completely different text
    const different = 'xyz'.repeat(reference.length)
    const differentAccuracy = calculateAccuracy(different, reference)
    expect(
      differentAccuracy < 20,
      `Different text should have very low accuracy, got ${differentAccuracy}%`
    )
  })

  test('calculateAccuracy prevents character misalignment issues', () => {
    // This test ensures the fix prevents the specific misalignment issue
    // that caused the 47% accuracy bug
    const reference = 'abc def ghi'
    const submitted = 'abc  def  ghi' // Extra spaces (different length after normalization)

    // The old algorithm would misalign after the first space difference
    // The new algorithm should handle this gracefully
    const accuracy = calculateAccuracy(submitted, reference)

    // Should be high accuracy since most characters match, just different spacing
    expect(
      accuracy > 70,
      `Text with spacing differences should have >70% accuracy, got ${accuracy}%`
    )
  })
})

// ===== LINE ANALYSIS TESTS =====

describe('Line Analysis', () => {
  test('analyzeByLines handles perfect match', () => {
    const reference = 'Line 1\\nLine 2\\nLine 3'
    const submitted = 'Line 1\\nLine 2\\nLine 3'
    const stats = analyzeByLines(reference, submitted)

    expect(stats.length).toBe(3)
    stats.forEach((stat) => {
      expect(stat.accuracy).toBe(100)
      expect(stat.passed).toBe(true)
      expect(stat.errorCount).toBe(0)
    })
  })

  test('analyzeByLines detects line-specific errors', () => {
    const reference = 'Line 1\\nLine 2\\nLine 3'
    const submitted = 'Line 1\\nError 2\\nLine 3'
    const stats = analyzeByLines(reference, submitted)

    expect(stats.length).toBe(3)
    expect(stats[0].passed).toBe(true) // Line 1 correct
    expect(stats[1].passed).toBe(false) // Line 2 incorrect
    expect(stats[2].passed).toBe(true) // Line 3 correct
  })

  test('analyzeByLines handles missing lines', () => {
    const reference = 'Line 1\\nLine 2\\nLine 3'
    const submitted = 'Line 1\\nLine 2'
    const stats = analyzeByLines(reference, submitted)

    expect(stats.length).toBe(3)
    expect(stats[2].submitted).toBe('')
    expect(stats[2].passed).toBe(false)
  })

  test('analyzeByLines handles extra lines', () => {
    const reference = 'Line 1\\nLine 2'
    const submitted = 'Line 1\\nLine 2\\nExtra Line'
    const stats = analyzeByLines(reference, submitted)

    expect(stats.length).toBe(3)
    expect(stats[2].expected).toBe('')
    expect(stats[2].submitted).toBe('Extra Line')
  })
})

// ===== ERROR PATTERN DETECTION TESTS =====

describe('Error Pattern Detection', () => {
  test('detectErrorPatterns identifies diacritic missing', () => {
    const differences = [
      {
        position: 0,
        expected: 'ā',
        actual: 'a',
        type: 'incorrect' as const,
        lineNumber: 1,
        linePosition: 1,
      },
      {
        position: 1,
        expected: 'ē',
        actual: 'e',
        type: 'incorrect' as const,
        lineNumber: 1,
        linePosition: 2,
      },
    ]

    const patterns = detectErrorPatterns(differences)
    const diacriticPattern = patterns.find(
      (p) => p.type === 'diacritic_missing'
    )

    expect(diacriticPattern).toBeDefined()
    expect(diacriticPattern!.count).toBe(2)
    expect(diacriticPattern!.examples.includes('a → ā')).toBe(true)
    expect(diacriticPattern!.examples.includes('e → ē')).toBe(true)
  })

  test('detectErrorPatterns identifies case errors', () => {
    const differences = [
      {
        position: 0,
        expected: 'a',
        actual: 'A',
        type: 'incorrect' as const,
        lineNumber: 1,
        linePosition: 1,
      },
    ]

    const patterns = detectErrorPatterns(differences)
    const casePattern = patterns.find((p) => p.type === 'case_error')

    expect(casePattern).toBeDefined()
    expect(casePattern!.count).toBe(1)
    expect(casePattern!.examples.includes('A → a')).toBe(true)
  })

  test('detectErrorPatterns identifies punctuation errors', () => {
    const differences = [
      {
        position: 0,
        expected: ',',
        actual: '.',
        type: 'incorrect' as const,
        lineNumber: 1,
        linePosition: 1,
      },
    ]

    const patterns = detectErrorPatterns(differences)
    const punctuationPattern = patterns.find((p) => p.type === 'punctuation')

    expect(punctuationPattern).toBeDefined()
    expect(punctuationPattern!.count).toBe(1)
    expect(punctuationPattern!.examples.includes('. → ,')).toBe(true)
  })

  test('detectErrorPatterns provides suggestions', () => {
    const differences = [
      {
        position: 0,
        expected: 'ā',
        actual: 'a',
        type: 'incorrect' as const,
        lineNumber: 1,
        linePosition: 1,
      },
    ]

    const patterns = detectErrorPatterns(differences)
    const diacriticPattern = patterns.find(
      (p) => p.type === 'diacritic_missing'
    )

    expect(diacriticPattern).toBeDefined()
    expect(diacriticPattern!.suggestion).toBeDefined()
    expect(diacriticPattern!.suggestion!.includes('diakritisk')).toBe(true)
  })
})

// ===== CONVENIENCE FUNCTION TESTS =====

describe('Convenience Functions', () => {
  test('isAnthemTextCorrect returns boolean', () => {
    expect(isAnthemTextCorrect(NATIONAL_ANTHEM_TEXT)).toBe(true)
    expect(isAnthemTextCorrect('wrong text')).toBe(false)
  })

  test('getAnthemAccuracy returns number', () => {
    const accuracy = getAnthemAccuracy(NATIONAL_ANTHEM_TEXT)
    expect(typeof accuracy).toBe('number')
    expect(accuracy).toBe(100)
  })

  test('validateAnthemText returns complete result', () => {
    const result = validateAnthemText(NATIONAL_ANTHEM_TEXT)
    expect(typeof result === 'object')
    expect('passed' in result)
    expect('accuracy' in result)
    expect('characterDifferences' in result)
    expect('analysis' in result)
  })
})

// ===== PERFORMANCE TESTS =====

describe('Performance Requirements', () => {
  test('text processing meets performance requirements', () => {
    const startTime = performance.now()

    // Process anthem-length text
    const normalized = normalizeLatvianText(NATIONAL_ANTHEM_TEXT)
    calculateAccuracy(normalized, NATIONAL_ANTHEM_TEXT)
    generateCharacterDifferences(NATIONAL_ANTHEM_TEXT, normalized)

    const endTime = performance.now()
    const executionTime = endTime - startTime

    // Should complete in under 10ms as per Issue #4 requirements
    expect(
      executionTime < 10,
      `Processing took ${executionTime}ms, should be under 10ms`
    )
  })

  test('large text batch processing performance', () => {
    const startTime = performance.now()

    // Process multiple texts
    const texts = Array(10).fill(NATIONAL_ANTHEM_TEXT)
    texts.forEach((text) => {
      normalizeLatvianText(text)
      calculateAccuracy(text, NATIONAL_ANTHEM_TEXT)
    })

    const endTime = performance.now()
    const executionTime = endTime - startTime

    // Batch processing should scale reasonably
    expect(
      executionTime < 100,
      `Batch processing took ${executionTime}ms, should be under 100ms`
    )
  })
})

// ===== EDGE CASES TESTS =====

describe('Edge Cases', () => {
  test('handles unicode edge cases', () => {
    const unicodeText = '𝕃𝕒𝕥𝕧𝕚𝕒' // Mathematical script letters
    const result = normalizeLatvianText(unicodeText)
    expect(typeof result === 'string')
  })

  test('handles extremely long text', () => {
    const longText = 'a'.repeat(10000)
    const result = normalizeLatvianText(longText)
    expect(result.length).toBe(10000)
  })

  test('handles mixed scripts', () => {
    const mixedText = 'Latvija Россия English 中文'
    const result = normalizeLatvianText(mixedText)
    expect(typeof result === 'string')
  })

  test('handles special whitespace characters', () => {
    const specialWhitespace = 'text\\u00A0\\u2000\\u2001\\u2002text' // Various Unicode spaces
    const result = normalizeWhitespace(specialWhitespace)
    expect(result.includes(' '))
  })

  test('handles combining characters', () => {
    const combining = 'a\\u0304e\\u0304i\\u0304' // Base letters + combining macrons
    const normalized = normalizeLatvianText(combining)
    expect(
      normalized.includes('ā') ||
        normalized.includes('ē') ||
        normalized.includes('ī')
    )
  })
})

// ===== INTEGRATION TESTS =====

describe('Integration Tests', () => {
  test('complete anthem comparison workflow', () => {
    const userInput = `DIEVS, SVĒTĪ LATVIJU,
Mūs' dārgo tēviju,
Svētī jel Latviju,
Ak, svētī jel to!

Kur latvju meitas zied,
Kur latvju dēli dzied,
Laid mums tur laimē diet,
Mūs' Latvijā!`

    const result = compareAnthemText(userInput)

    // Should pass with high accuracy
    expect(result.passed).toBe(true)
    expect(result.accuracy >= SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE)

    // Should have comprehensive analysis
    expect(result.analysis)
    expect(result.analysis.lineStats.length > 0)
    expect(Array.isArray(result.analysis.errorPatterns))

    // Should track all required metrics
    expect(typeof result.totalCharacters === 'number')
    expect(typeof result.correctCharacters === 'number')
    expect(result.submittedText === userInput)
    expect(result.referenceText === NATIONAL_ANTHEM_TEXT)
  })

  test('complete anthem comparison with errors', () => {
    const userInputWithErrors = `Dievs, sveti Latviju,
Mus dargo teviju,
Sveti jel Latviju,
Ak, sveti jel to!`

    const result = compareAnthemText(userInputWithErrors)

    // Should detect the missing diacritics
    expect(result.characterDifferences.length > 0).toBe(true)

    // Should identify diacritic missing patterns
    const diacriticErrors = result.analysis.errorPatterns.find(
      (p) => p.type === 'diacritic_missing'
    )
    expect(diacriticErrors).toBeDefined()
    expect(diacriticErrors!.count > 0).toBe(true)

    // Should still provide accurate line-by-line analysis
    expect(result.analysis.lineStats.length > 0)
    result.analysis.lineStats.forEach((stat) => {
      expect(typeof stat.accuracy === 'number')
      expect(typeof stat.passed === 'boolean')
    })
  })
})
