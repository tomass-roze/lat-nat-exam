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

import { strict as assert } from 'node:assert'
import { test, describe } from 'node:test'

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
    assert.strictEqual(normalizeLatvianText(''), '')
    assert.strictEqual(normalizeLatvianText(null as any), '')
    assert.strictEqual(normalizeLatvianText(undefined as any), '')
  })

  test('normalizeLatvianText applies NFC normalization', () => {
    // Test composed vs decomposed diacritics
    const composed = 'ā' // Single composed character
    const decomposed = 'a\u0304' // Base + combining macron
    
    const normalizedComposed = normalizeLatvianText(composed)
    const normalizedDecomposed = normalizeLatvianText(decomposed)
    
    assert.strictEqual(normalizedComposed, normalizedDecomposed)
  })

  test('normalizeLatvianText converts to lowercase', () => {
    const input = 'DIEVS, SVĒTĪ LATVIJU!'
    const expected = 'dievs, svētī latviju!'
    assert.strictEqual(normalizeLatvianText(input), expected)
  })

  test('normalizeWhitespace handles multiple spaces', () => {
    const input = 'Dievs,   svētī    Latviju'
    const expected = 'Dievs, svētī Latviju'
    assert.strictEqual(normalizeWhitespace(input), expected)
  })

  test('normalizeWhitespace handles line breaks', () => {
    const input = 'Line 1\\n\\n\\n\\nLine 2'
    const expected = 'Line 1\\n\\nLine 2'
    assert.strictEqual(normalizeWhitespace(input), expected)
  })

  test('normalizeLatvianCharacters handles alternative input methods', () => {
    const input = 'a: e: i: u: c^ g^ s^'
    const expected = 'ā ē ī ū č ģ š'
    assert.strictEqual(normalizeLatvianCharacters(input), expected)
  })

  test('normalizeLatvianCharacters handles autocorrect issues', () => {
    const input = 'â ê î ô û'
    const expected = 'ā ē ī ō ū'
    assert.strictEqual(normalizeLatvianCharacters(input), expected)
  })
})

// ===== ACCURACY CALCULATION TESTS =====

describe('Accuracy Calculation', () => {
  test('calculateAccuracy handles identical texts', () => {
    const text = 'Dievs, svētī Latviju'
    assert.strictEqual(calculateAccuracy(text, text), 100)
  })

  test('calculateAccuracy handles empty texts', () => {
    assert.strictEqual(calculateAccuracy('', ''), 100)
    assert.strictEqual(calculateAccuracy('', 'reference'), 0)
    assert.strictEqual(calculateAccuracy('submitted', ''), 0)
  })

  test('calculateAccuracy calculates partial matches', () => {
    const reference = 'abcde'
    const submitted = 'abcXe'
    const expected = (4 / 5) * 100 // 4 correct out of 5
    assert.strictEqual(calculateAccuracy(submitted, reference), expected)
  })

  test('calculateAccuracy handles length differences', () => {
    const reference = 'abcde'
    const submitted = 'abc'
    const expected = (3 / 5) * 100 // 3 correct out of 5 reference characters
    assert.strictEqual(calculateAccuracy(submitted, reference), expected)
  })

  test('calculateAccuracy handles longer submitted text', () => {
    const reference = 'abc'
    const submitted = 'abcde'
    const expected = (3 / 3) * 100 // All reference characters matched
    assert.strictEqual(calculateAccuracy(submitted, reference), expected)
  })

  test('calculateAccuracy with Latvian diacritics', () => {
    const reference = 'svētī'
    const submitted = 'sveti' // Missing diacritic
    const expected = (3 / 5) * 100 // s, v, t, i correct; ē and ī incorrect
    assert.strictEqual(calculateAccuracy(submitted, reference), expected)
  })
})

// ===== CHARACTER DIFFERENCES TESTS =====

describe('Character Differences', () => {
  test('generateCharacterDifferences handles identical texts', () => {
    const text = 'test'
    const differences = generateCharacterDifferences(text, text)
    assert.strictEqual(differences.length, 0)
  })

  test('generateCharacterDifferences detects missing characters', () => {
    const reference = 'abcde'
    const submitted = 'abc'
    const differences = generateCharacterDifferences(reference, submitted)
    
    assert.strictEqual(differences.length, 2)
    assert.strictEqual(differences[0].type, 'missing')
    assert.strictEqual(differences[0].expected, 'd')
    assert.strictEqual(differences[1].type, 'missing')
    assert.strictEqual(differences[1].expected, 'e')
  })

  test('generateCharacterDifferences detects extra characters', () => {
    const reference = 'abc'
    const submitted = 'abcde'
    const differences = generateCharacterDifferences(reference, submitted)
    
    assert.strictEqual(differences.length, 2)
    assert.strictEqual(differences[0].type, 'extra')
    assert.strictEqual(differences[0].actual, 'd')
    assert.strictEqual(differences[1].type, 'extra')
    assert.strictEqual(differences[1].actual, 'e')
  })

  test('generateCharacterDifferences detects incorrect characters', () => {
    const reference = 'abc'
    const submitted = 'aXc'
    const differences = generateCharacterDifferences(reference, submitted)
    
    assert.strictEqual(differences.length, 1)
    assert.strictEqual(differences[0].type, 'incorrect')
    assert.strictEqual(differences[0].expected, 'b')
    assert.strictEqual(differences[0].actual, 'X')
    assert.strictEqual(differences[0].position, 1)
  })

  test('generateCharacterDifferences tracks line numbers', () => {
    const reference = 'line1\\nline2'
    const submitted = 'line1\\nliXe2'
    const differences = generateCharacterDifferences(reference, submitted)
    
    assert.strictEqual(differences.length, 1)
    assert.strictEqual(differences[0].lineNumber, 2)
    assert.strictEqual(differences[0].linePosition, 3)
  })

  test('generateCharacterDifferences with Latvian characters', () => {
    const reference = 'ā'
    const submitted = 'a'
    const differences = generateCharacterDifferences(reference, submitted)
    
    assert.strictEqual(differences.length, 1)
    assert.strictEqual(differences[0].type, 'incorrect')
    assert.strictEqual(differences[0].expected, 'ā')
    assert.strictEqual(differences[0].actual, 'a')
  })
})

// ===== ANTHEM COMPARISON TESTS =====

describe('Anthem Comparison', () => {
  test('compareAnthemText passes with perfect match', () => {
    const result = compareAnthemText(NATIONAL_ANTHEM_TEXT)
    assert.strictEqual(result.passed, true)
    assert.strictEqual(result.accuracy, 100)
    assert.strictEqual(result.characterDifferences.length, 0)
  })

  test('compareAnthemText handles case differences', () => {
    const upperCase = NATIONAL_ANTHEM_TEXT.toUpperCase()
    const result = compareAnthemText(upperCase)
    assert.strictEqual(result.passed, true)
    assert.strictEqual(result.accuracy, 100)
  })

  test('compareAnthemText fails with low accuracy', () => {
    const badText = 'Completely wrong text that does not match'
    const result = compareAnthemText(badText)
    assert.strictEqual(result.passed, false)
    assert.ok(result.accuracy < SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE)
  })

  test('compareAnthemText calculates character counts correctly', () => {
    const result = compareAnthemText(NATIONAL_ANTHEM_TEXT)
    assert.strictEqual(result.totalCharacters, NATIONAL_ANTHEM_TEXT.length)
    assert.strictEqual(result.correctCharacters, NATIONAL_ANTHEM_TEXT.length)
  })

  test('compareAnthemText with partial match', () => {
    // Take first half of anthem
    const partial = NATIONAL_ANTHEM_TEXT.substring(0, Math.floor(NATIONAL_ANTHEM_TEXT.length / 2))
    const result = compareAnthemText(partial)
    
    assert.ok(result.accuracy < 100)
    assert.ok(result.accuracy > 0)
    assert.ok(result.characterDifferences.length > 0)
  })
})

// ===== LINE ANALYSIS TESTS =====

describe('Line Analysis', () => {
  test('analyzeByLines handles perfect match', () => {
    const reference = 'Line 1\\nLine 2\\nLine 3'
    const submitted = 'Line 1\\nLine 2\\nLine 3'
    const stats = analyzeByLines(reference, submitted)
    
    assert.strictEqual(stats.length, 3)
    stats.forEach(stat => {
      assert.strictEqual(stat.accuracy, 100)
      assert.strictEqual(stat.passed, true)
      assert.strictEqual(stat.errorCount, 0)
    })
  })

  test('analyzeByLines detects line-specific errors', () => {
    const reference = 'Line 1\\nLine 2\\nLine 3'
    const submitted = 'Line 1\\nError 2\\nLine 3'
    const stats = analyzeByLines(reference, submitted)
    
    assert.strictEqual(stats.length, 3)
    assert.strictEqual(stats[0].passed, true) // Line 1 correct
    assert.strictEqual(stats[1].passed, false) // Line 2 incorrect
    assert.strictEqual(stats[2].passed, true) // Line 3 correct
  })

  test('analyzeByLines handles missing lines', () => {
    const reference = 'Line 1\\nLine 2\\nLine 3'
    const submitted = 'Line 1\\nLine 2'
    const stats = analyzeByLines(reference, submitted)
    
    assert.strictEqual(stats.length, 3)
    assert.strictEqual(stats[2].submitted, '')
    assert.strictEqual(stats[2].passed, false)
  })

  test('analyzeByLines handles extra lines', () => {
    const reference = 'Line 1\\nLine 2'
    const submitted = 'Line 1\\nLine 2\\nExtra Line'
    const stats = analyzeByLines(reference, submitted)
    
    assert.strictEqual(stats.length, 3)
    assert.strictEqual(stats[2].expected, '')
    assert.strictEqual(stats[2].submitted, 'Extra Line')
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
    const diacriticPattern = patterns.find(p => p.type === 'diacritic_missing')
    
    assert.ok(diacriticPattern)
    assert.strictEqual(diacriticPattern.count, 2)
    assert.ok(diacriticPattern.examples.includes('a → ā'))
    assert.ok(diacriticPattern.examples.includes('e → ē'))
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
    const casePattern = patterns.find(p => p.type === 'case_error')
    
    assert.ok(casePattern)
    assert.strictEqual(casePattern.count, 1)
    assert.ok(casePattern.examples.includes('A → a'))
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
    const punctuationPattern = patterns.find(p => p.type === 'punctuation')
    
    assert.ok(punctuationPattern)
    assert.strictEqual(punctuationPattern.count, 1)
    assert.ok(punctuationPattern.examples.includes('. → ,'))
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
    const diacriticPattern = patterns.find(p => p.type === 'diacritic_missing')
    
    assert.ok(diacriticPattern)
    assert.ok(diacriticPattern.suggestion)
    assert.ok(diacriticPattern.suggestion.includes('diakritisk'))
  })
})

// ===== CONVENIENCE FUNCTION TESTS =====

describe('Convenience Functions', () => {
  test('isAnthemTextCorrect returns boolean', () => {
    assert.strictEqual(isAnthemTextCorrect(NATIONAL_ANTHEM_TEXT), true)
    assert.strictEqual(isAnthemTextCorrect('wrong text'), false)
  })

  test('getAnthemAccuracy returns number', () => {
    const accuracy = getAnthemAccuracy(NATIONAL_ANTHEM_TEXT)
    assert.strictEqual(typeof accuracy, 'number')
    assert.strictEqual(accuracy, 100)
  })

  test('validateAnthemText returns complete result', () => {
    const result = validateAnthemText(NATIONAL_ANTHEM_TEXT)
    assert.ok(typeof result === 'object')
    assert.ok('passed' in result)
    assert.ok('accuracy' in result)
    assert.ok('characterDifferences' in result)
    assert.ok('analysis' in result)
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
    assert.ok(executionTime < 10, `Processing took ${executionTime}ms, should be under 10ms`)
  })

  test('large text batch processing performance', () => {
    const startTime = performance.now()
    
    // Process multiple texts
    const texts = Array(10).fill(NATIONAL_ANTHEM_TEXT)
    texts.forEach(text => {
      normalizeLatvianText(text)
      calculateAccuracy(text, NATIONAL_ANTHEM_TEXT)
    })
    
    const endTime = performance.now()
    const executionTime = endTime - startTime
    
    // Batch processing should scale reasonably
    assert.ok(executionTime < 100, `Batch processing took ${executionTime}ms, should be under 100ms`)
  })
})

// ===== EDGE CASES TESTS =====

describe('Edge Cases', () => {
  test('handles unicode edge cases', () => {
    const unicodeText = '𝕃𝕒𝕥𝕧𝕚𝕒' // Mathematical script letters
    const result = normalizeLatvianText(unicodeText)
    assert.ok(typeof result === 'string')
  })

  test('handles extremely long text', () => {
    const longText = 'a'.repeat(10000)
    const result = normalizeLatvianText(longText)
    assert.strictEqual(result.length, 10000)
  })

  test('handles mixed scripts', () => {
    const mixedText = 'Latvija Россия English 中文'
    const result = normalizeLatvianText(mixedText)
    assert.ok(typeof result === 'string')
  })

  test('handles special whitespace characters', () => {
    const specialWhitespace = 'text\\u00A0\\u2000\\u2001\\u2002text' // Various Unicode spaces
    const result = normalizeWhitespace(specialWhitespace)
    assert.ok(result.includes(' '))
  })

  test('handles combining characters', () => {
    const combining = 'a\\u0304e\\u0304i\\u0304' // Base letters + combining macrons
    const normalized = normalizeLatvianText(combining)
    assert.ok(normalized.includes('ā') || normalized.includes('ē') || normalized.includes('ī'))
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
    assert.strictEqual(result.passed, true)
    assert.ok(result.accuracy >= SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE)
    
    // Should have comprehensive analysis
    assert.ok(result.analysis)
    assert.ok(result.analysis.lineStats.length > 0)
    assert.ok(Array.isArray(result.analysis.errorPatterns))
    
    // Should track all required metrics
    assert.ok(typeof result.totalCharacters === 'number')
    assert.ok(typeof result.correctCharacters === 'number')
    assert.ok(result.submittedText === userInput)
    assert.ok(result.referenceText === NATIONAL_ANTHEM_TEXT)
  })

  test('complete anthem comparison with errors', () => {
    const userInputWithErrors = `Dievs, sveti Latviju,
Mus dargo teviju,
Sveti jel Latviju,
Ak, sveti jel to!`

    const result = compareAnthemText(userInputWithErrors)
    
    // Should detect the missing diacritics
    assert.ok(result.characterDifferences.length > 0)
    
    // Should identify diacritic missing patterns
    const diacriticErrors = result.analysis.errorPatterns.find(p => p.type === 'diacritic_missing')
    assert.ok(diacriticErrors)
    assert.ok(diacriticErrors.count > 0)
    
    // Should still provide accurate line-by-line analysis
    assert.ok(result.analysis.lineStats.length > 0)
    result.analysis.lineStats.forEach(stat => {
      assert.ok(typeof stat.accuracy === 'number')
      assert.ok(typeof stat.passed === 'boolean')
    })
  })
})