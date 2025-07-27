/**
 * @fileoverview Latvian Text Processing Utilities
 * 
 * Provides comprehensive text processing functions for evaluating Latvian national anthem
 * submissions with Unicode-compliant comparison, normalization, and detailed analysis.
 * 
 * Features:
 * - Character-by-character comparison with 75% accuracy threshold
 * - Case-insensitive and diacritic-aware text normalization
 * - Detailed difference reporting with line/column tracking
 * - Performance-optimized algorithms for real-time processing
 * - Complete support for Latvian diacritics (ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž)
 * 
 * @author Latvian Citizenship Exam Development Team
 * @version 1.0.0
 */

import type {
  AnthemResult,
  CharacterDiff,
  AnthemAnalysis,
  AnthemLineStats,
  ErrorPattern,
  AnthemTiming,
  TextQualityMetrics,
} from '@/types'

import {
  SCORING_THRESHOLDS,
  NATIONAL_ANTHEM_TEXT,
} from '@/types'

// ===== CORE TEXT PROCESSING FUNCTIONS =====

/**
 * Normalize Latvian text for accurate comparison
 * 
 * Performs comprehensive text normalization including:
 * - Unicode NFC normalization for consistent character representation
 * - Case conversion to lowercase for case-insensitive comparison
 * - Whitespace normalization while preserving text structure
 * - Diacritic standardization for Latvian characters
 * 
 * @param text - Input text to normalize
 * @returns Normalized text ready for comparison
 * 
 * @example
 * ```typescript
 * const normalized = normalizeLatvianText("DIEVS, SVĒTĪ LATVIJU!");
 * console.log(normalized); // "dievs, svētī latviju!"
 * ```
 */
export function normalizeLatvianText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Step 1: Unicode NFC normalization
  let normalized = text.normalize('NFC')

  // Step 2: Convert to lowercase for case-insensitive comparison
  normalized = normalized.toLowerCase()

  // Step 3: Normalize whitespace while preserving structure
  normalized = normalizeWhitespace(normalized)

  // Step 4: Handle Latvian-specific character variations
  normalized = normalizeLatvianCharacters(normalized)

  return normalized
}

/**
 * Normalize whitespace in text while preserving line structure
 * 
 * @param text - Input text with potentially irregular whitespace
 * @returns Text with normalized whitespace
 */
export function normalizeWhitespace(text: string): string {
  return text
    // Replace multiple consecutive spaces with single space
    .replace(/[ \t]+/g, ' ')
    // Replace multiple consecutive line breaks with single line break
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading and trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Trim overall leading and trailing whitespace
    .trim()
}

/**
 * Normalize Latvian characters to handle typing variations
 * 
 * @param text - Input text with potentially non-standard Latvian characters
 * @returns Text with standardized Latvian character representation
 */
export function normalizeLatvianCharacters(text: string): string {
  // Handle common typing variations and autocorrect issues
  const characterMap = new Map([
    // Common autocorrect substitutions
    ['â', 'ā'], ['ê', 'ē'], ['î', 'ī'], ['ô', 'ō'], ['û', 'ū'],
    // Alternative input method variations
    ['a:', 'ā'], ['e:', 'ē'], ['i:', 'ī'], ['u:', 'ū'],
    ['c^', 'č'], ['g^', 'ģ'], ['k^', 'ķ'], ['l^', 'ļ'], 
    ['n^', 'ņ'], ['s^', 'š'], ['z^', 'ž'],
    // Windows Baltic encoding variations
    ['à', 'ā'], ['è', 'ē'], ['ì', 'ī'], ['ù', 'ū'],
  ])

  let normalized = text
  for (const [variant, standard] of characterMap) {
    normalized = normalized.replace(new RegExp(variant, 'g'), standard)
  }

  return normalized
}

// ===== TEXT COMPARISON FUNCTIONS =====

/**
 * Compare submitted text against the official Latvian national anthem
 * 
 * Performs comprehensive analysis including accuracy calculation,
 * character-by-character difference detection, and detailed feedback.
 * 
 * @param submittedText - User's submitted anthem text
 * @param referenceText - Official anthem text (optional, uses default if not provided)
 * @returns Complete anthem analysis results
 * 
 * @example
 * ```typescript
 * const result = compareAnthemText(userInput);
 * if (result.passed) {
 *   console.log(`Passed with ${result.accuracy}% accuracy`);
 * }
 * ```
 */
export function compareAnthemText(
  submittedText: string,
  referenceText: string = NATIONAL_ANTHEM_TEXT
): AnthemResult {
  // Normalize both texts for comparison
  const normalizedSubmitted = normalizeLatvianText(submittedText)
  const normalizedReference = normalizeLatvianText(referenceText)

  // Calculate basic metrics
  const accuracy = calculateAccuracy(normalizedSubmitted, normalizedReference)
  const passed = accuracy >= SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE

  // Generate detailed character differences
  const characterDifferences = generateCharacterDifferences(
    normalizedReference,
    normalizedSubmitted
  )

  // Perform detailed analysis
  const analysis = analyzeAnthemSubmission(
    normalizedReference,
    normalizedSubmitted,
    characterDifferences
  )

  // Calculate character counts
  const totalCharacters = normalizedReference.length
  const correctCharacters = Math.round((accuracy / 100) * totalCharacters)

  return {
    passed,
    accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
    characterDifferences,
    submittedText,
    referenceText,
    totalCharacters,
    correctCharacters,
    analysis,
  }
}

/**
 * Calculate accuracy percentage between two texts
 * 
 * Uses character-by-character comparison with normalized inputs.
 * Handles different text lengths gracefully.
 * 
 * @param submitted - Normalized submitted text
 * @param reference - Normalized reference text
 * @returns Accuracy percentage (0-100)
 */
export function calculateAccuracy(submitted: string, reference: string): number {
  if (!reference || reference.length === 0) {
    return submitted.length === 0 ? 100 : 0
  }

  if (!submitted || submitted.length === 0) {
    return 0
  }

  let correctCharacters = 0
  const maxLength = Math.max(submitted.length, reference.length)

  // Compare character by character
  for (let i = 0; i < maxLength; i++) {
    const submittedChar = submitted[i] || ''
    const referenceChar = reference[i] || ''

    if (submittedChar === referenceChar) {
      correctCharacters++
    }
  }

  // Calculate accuracy as percentage of correct characters
  // Use reference length as the denominator for consistent scoring
  return (correctCharacters / reference.length) * 100
}

/**
 * Generate detailed character-by-character differences
 * 
 * @param reference - Normalized reference text
 * @param submitted - Normalized submitted text
 * @returns Array of character differences with position tracking
 */
export function generateCharacterDifferences(
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

    // Track line numbers and positions
    if (position > 0 && reference[position - 1] === '\n') {
      currentLine++
      currentLinePosition = 1
    }

    // Determine difference type
    let diffType: CharacterDiff['type']
    if (expectedChar === actualChar) {
      diffType = 'correct'
    } else if (expectedChar && !actualChar) {
      diffType = 'missing'
    } else if (!expectedChar && actualChar) {
      diffType = 'extra'
    } else {
      diffType = 'incorrect'
    }

    // Only record non-correct differences for analysis
    if (diffType !== 'correct') {
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

// ===== DETAILED ANALYSIS FUNCTIONS =====

/**
 * Perform comprehensive analysis of anthem submission
 * 
 * @param reference - Normalized reference text
 * @param submitted - Normalized submitted text
 * @param differences - Character differences array
 * @returns Detailed anthem analysis
 */
export function analyzeAnthemSubmission(
  reference: string,
  submitted: string,
  differences: CharacterDiff[]
): AnthemAnalysis {
  const lineStats = analyzeByLines(reference, submitted)
  const errorPatterns = detectErrorPatterns(differences)
  const timing = calculateTypingMetrics(submitted)
  const qualityMetrics = assessTextQuality(submitted)

  return {
    lineStats,
    errorPatterns,
    timing,
    qualityMetrics,
  }
}

/**
 * Analyze text submission line by line
 * 
 * @param reference - Reference text
 * @param submitted - Submitted text
 * @returns Statistics for each line
 */
export function analyzeByLines(reference: string, submitted: string): AnthemLineStats[] {
  const referenceLines = reference.split('\n')
  const submittedLines = submitted.split('\n')
  const maxLines = Math.max(referenceLines.length, submittedLines.length)

  const lineStats: AnthemLineStats[] = []

  for (let lineNumber = 1; lineNumber <= maxLines; lineNumber++) {
    const expectedLine = referenceLines[lineNumber - 1] || ''
    const submittedLine = submittedLines[lineNumber - 1] || ''

    const lineAccuracy = calculateAccuracy(submittedLine, expectedLine)
    const linePassed = lineAccuracy >= SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE
    const errorCount = generateCharacterDifferences(expectedLine, submittedLine).length

    lineStats.push({
      lineNumber,
      accuracy: Math.round(lineAccuracy * 100) / 100,
      passed: linePassed,
      errorCount,
      expected: expectedLine,
      submitted: submittedLine,
    })
  }

  return lineStats
}

/**
 * Detect common error patterns in text differences
 * 
 * @param differences - Array of character differences
 * @returns Detected error patterns with suggestions
 */
export function detectErrorPatterns(differences: CharacterDiff[]): ErrorPattern[] {
  const patterns: Map<ErrorPattern['type'], Set<string>> = new Map([
    ['diacritic_missing', new Set()],
    ['case_error', new Set()],
    ['spelling', new Set()],
    ['punctuation', new Set()],
    ['word_order', new Set()],
  ])

  for (const diff of differences) {
    const { expected, actual, type } = diff

    if (type === 'incorrect') {
      // Check for missing diacritics
      if (isLatvianDiacritic(expected) && isLatvianBaseLetter(actual)) {
        patterns.get('diacritic_missing')?.add(`${actual} → ${expected}`)
      }
      // Check for case errors
      else if (expected.toLowerCase() === actual.toLowerCase()) {
        patterns.get('case_error')?.add(`${actual} → ${expected}`)
      }
      // Check for punctuation errors
      else if (isPunctuation(expected) || isPunctuation(actual)) {
        patterns.get('punctuation')?.add(`${actual} → ${expected}`)
      }
      // General spelling errors
      else {
        patterns.get('spelling')?.add(`${actual} → ${expected}`)
      }
    }
  }

  const errorPatterns: ErrorPattern[] = []
  for (const [type, examples] of patterns) {
    if (examples.size > 0) {
      errorPatterns.push({
        type,
        count: examples.size,
        examples: Array.from(examples).slice(0, 5), // Limit to 5 examples
        suggestion: getErrorSuggestion(type),
      })
    }
  }

  return errorPatterns
}

/**
 * Calculate typing metrics for performance analysis
 * 
 * @param text - Submitted text
 * @returns Typing performance metrics
 */
export function calculateTypingMetrics(text: string): AnthemTiming {
  // For now, return default values - this would be enhanced with actual timing data
  const typingTime = 60000 // 1 minute default
  const typingSpeed = Math.round((text.length / typingTime) * 60000) // Characters per minute

  return {
    typingTime,
    typingSpeed,
    longPauses: 0,
    thinkingTime: 5000, // 5 seconds default
  }
}

/**
 * Assess text quality and detect potential issues
 * 
 * @param text - Text to assess
 * @returns Quality metrics and issue detection
 */
export function assessTextQuality(text: string): TextQualityMetrics {
  const encodingIssues = !/^[\u0000-\u007F\u0100-\u017F\u1E00-\u1EFF\s]*$/.test(text)
  const whitespaceIssues = /\s{3,}|\t/.test(text)
  const nonStandardCharacters = Array.from(text.match(/[^\p{L}\p{N}\p{P}\p{Z}]/gu) || [])

  // Calculate overall quality score
  let qualityScore = 100
  if (encodingIssues) qualityScore -= 20
  if (whitespaceIssues) qualityScore -= 10
  if (nonStandardCharacters.length > 0) qualityScore -= nonStandardCharacters.length * 5

  return {
    encodingIssues,
    whitespaceIssues,
    nonStandardCharacters,
    qualityScore: Math.max(0, qualityScore),
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Check if character is a Latvian diacritic
 */
function isLatvianDiacritic(char: string): boolean {
  return ['ā', 'č', 'ē', 'ģ', 'ī', 'ķ', 'ļ', 'ņ', 'š', 'ū', 'ž'].includes(char.toLowerCase())
}

/**
 * Check if character is a Latvian base letter (non-diacritic)
 */
function isLatvianBaseLetter(char: string): boolean {
  return ['a', 'c', 'e', 'g', 'i', 'k', 'l', 'n', 's', 'u', 'z'].includes(char.toLowerCase())
}

/**
 * Check if character is punctuation
 */
function isPunctuation(char: string): boolean {
  return /[.,!?;:'"()-]/.test(char)
}

/**
 * Get suggestion text for error pattern
 */
function getErrorSuggestion(errorType: ErrorPattern['type']): string {
  const suggestions = {
    diacritic_missing: 'Pievienojiet trūkstošās diakritiskās zīmes',
    case_error: 'Pārbaudiet lielo un mazo burtu lietojumu',
    spelling: 'Pārbaudiet pareizrakstību',
    punctuation: 'Pārbaudiet interpunkcijas zīmes',
    word_order: 'Pārbaudiet vārdu secību',
  }
  return suggestions[errorType] || 'Pārbaudiet teksta pareizību'
}

// ===== MAIN EXPORT FUNCTIONS =====

/**
 * Quick anthem comparison function for basic usage
 * 
 * @param submittedText - User's submitted text
 * @returns Simple boolean result indicating pass/fail
 */
export function isAnthemTextCorrect(submittedText: string): boolean {
  const result = compareAnthemText(submittedText)
  return result.passed
}

/**
 * Get accuracy percentage for submitted anthem text
 * 
 * @param submittedText - User's submitted text
 * @returns Accuracy percentage (0-100)
 */
export function getAnthemAccuracy(submittedText: string): number {
  const result = compareAnthemText(submittedText)
  return result.accuracy
}

/**
 * Validate anthem text and provide detailed feedback
 * 
 * @param submittedText - User's submitted text
 * @returns Complete validation result with suggestions
 */
export function validateAnthemText(submittedText: string): AnthemResult {
  return compareAnthemText(submittedText)
}