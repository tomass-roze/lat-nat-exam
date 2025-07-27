/**
 * @fileoverview Latvian Language Support Utilities
 *
 * Provides comprehensive support for Latvian language processing including
 * character definitions, alphabet management, and language-specific text operations.
 *
 * Features:
 * - Complete Latvian alphabet with diacritics
 * - Character equivalence mappings for input variations
 * - Language-specific validation and normalization
 * - Support for alternative input methods and keyboard layouts
 *
 * @author Latvian Citizenship Exam Development Team
 * @version 1.0.0
 */

// ===== LATVIAN ALPHABET DEFINITIONS =====

/**
 * Complete Latvian alphabet organized by character type
 *
 * The Latvian alphabet consists of 33 letters including 11 with diacritics.
 * This comprehensive definition supports all official Latvian characters.
 */
export const LATVIAN_ALPHABET = {
  /** Latvian vowels including diacritics */
  VOWELS: ['a', 'ā', 'e', 'ē', 'i', 'ī', 'o', 'u', 'ū'] as const,

  /** Latvian consonants including diacritics */
  CONSONANTS: [
    'b',
    'c',
    'č',
    'd',
    'f',
    'g',
    'ģ',
    'h',
    'j',
    'k',
    'ķ',
    'l',
    'ļ',
    'm',
    'n',
    'ņ',
    'p',
    'r',
    's',
    'š',
    't',
    'v',
    'z',
    'ž',
  ] as const,

  /** All Latvian letters with diacritics */
  DIACRITICS: ['ā', 'č', 'ē', 'ģ', 'ī', 'ķ', 'ļ', 'ņ', 'š', 'ū', 'ž'] as const,

  /** Base letters that have diacritic variants */
  BASE_LETTERS: [
    'a',
    'c',
    'e',
    'g',
    'i',
    'k',
    'l',
    'n',
    's',
    'u',
    'z',
  ] as const,

  /** Complete alphabet in order */
  ALL_LETTERS: [
    'a',
    'ā',
    'b',
    'c',
    'č',
    'd',
    'e',
    'ē',
    'f',
    'g',
    'ģ',
    'h',
    'i',
    'ī',
    'j',
    'k',
    'ķ',
    'l',
    'ļ',
    'm',
    'n',
    'ņ',
    'o',
    'p',
    'r',
    's',
    'š',
    't',
    'u',
    'ū',
    'v',
    'z',
    'ž',
  ] as const,
} as const

/**
 * Character equivalence mappings for case conversion
 * Maps uppercase Latvian letters to their lowercase equivalents
 */
export const CASE_MAPPINGS = new Map([
  // Standard Latin letters
  ['A', 'a'],
  ['B', 'b'],
  ['C', 'c'],
  ['D', 'd'],
  ['E', 'e'],
  ['F', 'f'],
  ['G', 'g'],
  ['H', 'h'],
  ['I', 'i'],
  ['J', 'j'],
  ['K', 'k'],
  ['L', 'l'],
  ['M', 'm'],
  ['N', 'n'],
  ['O', 'o'],
  ['P', 'p'],
  ['R', 'r'],
  ['S', 's'],
  ['T', 't'],
  ['U', 'u'],
  ['V', 'v'],
  ['Z', 'z'],

  // Latvian diacritics
  ['Ā', 'ā'],
  ['Č', 'č'],
  ['Ē', 'ē'],
  ['Ģ', 'ģ'],
  ['Ī', 'ī'],
  ['Ķ', 'ķ'],
  ['Ļ', 'ļ'],
  ['Ņ', 'ņ'],
  ['Š', 'š'],
  ['Ū', 'ū'],
  ['Ž', 'ž'],
])

/**
 * Diacritic to base letter mappings
 * Maps each diacritic character to its base letter equivalent
 */
export const DIACRITIC_TO_BASE = new Map([
  ['ā', 'a'],
  ['č', 'c'],
  ['ē', 'e'],
  ['ģ', 'g'],
  ['ī', 'i'],
  ['ķ', 'k'],
  ['ļ', 'l'],
  ['ņ', 'n'],
  ['š', 's'],
  ['ū', 'u'],
  ['ž', 'z'],
  // Uppercase variants
  ['Ā', 'A'],
  ['Č', 'C'],
  ['Ē', 'E'],
  ['Ģ', 'G'],
  ['Ī', 'I'],
  ['Ķ', 'K'],
  ['Ļ', 'L'],
  ['Ņ', 'N'],
  ['Š', 'S'],
  ['Ū', 'U'],
  ['Ž', 'Z'],
])

/**
 * Base letter to diacritic mappings
 * Maps base letters to their diacritic equivalents
 */
export const BASE_TO_DIACRITIC = new Map([
  ['a', 'ā'],
  ['c', 'č'],
  ['e', 'ē'],
  ['g', 'ģ'],
  ['i', 'ī'],
  ['k', 'ķ'],
  ['l', 'ļ'],
  ['n', 'ņ'],
  ['s', 'š'],
  ['u', 'ū'],
  ['z', 'ž'],
  // Uppercase variants
  ['A', 'Ā'],
  ['C', 'Č'],
  ['E', 'Ē'],
  ['G', 'Ģ'],
  ['I', 'Ī'],
  ['K', 'Ķ'],
  ['L', 'Ļ'],
  ['N', 'Ņ'],
  ['S', 'Š'],
  ['U', 'Ū'],
  ['Z', 'Ž'],
])

// ===== INPUT METHOD SUPPORT =====

/**
 * Alternative input method mappings
 * Supports various ways users might input Latvian diacritics
 */
export const INPUT_METHOD_MAPPINGS = new Map([
  // Colon notation (common alternative input)
  ['a:', 'ā'],
  ['e:', 'ē'],
  ['i:', 'ī'],
  ['u:', 'ū'],
  ['A:', 'Ā'],
  ['E:', 'Ē'],
  ['I:', 'Ī'],
  ['U:', 'Ū'],

  // Caret notation for consonants
  ['c^', 'č'],
  ['g^', 'ģ'],
  ['k^', 'ķ'],
  ['l^', 'ļ'],
  ['n^', 'ņ'],
  ['s^', 'š'],
  ['z^', 'ž'],
  ['C^', 'Č'],
  ['G^', 'Ģ'],
  ['K^', 'Ķ'],
  ['L^', 'Ļ'],
  ['N^', 'Ņ'],
  ['S^', 'Š'],
  ['Z^', 'Ž'],

  // X-notation alternative
  ['ax', 'ā'],
  ['ex', 'ē'],
  ['ix', 'ī'],
  ['ux', 'ū'],
  ['cx', 'č'],
  ['gx', 'ģ'],
  ['kx', 'ķ'],
  ['lx', 'ļ'],
  ['nx', 'ņ'],
  ['sx', 'š'],
  ['zx', 'ž'],

  // Number notation (rare but possible)
  ['a1', 'ā'],
  ['e1', 'ē'],
  ['i1', 'ī'],
  ['u1', 'ū'],
  ['c1', 'č'],
  ['g1', 'ģ'],
  ['k1', 'ķ'],
  ['l1', 'ļ'],
  ['n1', 'ņ'],
  ['s1', 'š'],
  ['z1', 'ž'],
])

/**
 * Common autocorrect and encoding error mappings
 * Handles typical issues from different input systems
 */
export const ERROR_CORRECTION_MAPPINGS = new Map([
  // Windows-1257 (Baltic) encoding issues
  ['Ā', 'ā'],
  ['Č', 'č'],
  ['Ē', 'ē'],
  ['Ģ', 'ģ'],
  ['Ī', 'ī'],
  ['Ķ', 'ķ'],
  ['Ļ', 'ļ'],
  ['Ņ', 'ņ'],
  ['Š', 'š'],
  ['Ū', 'ū'],
  ['Ž', 'ž'],

  // ISO Latin-4 issues
  ['Ăl', 'ā'],
  ['Ęl', 'ē'],
  ['Įl', 'ī'],
  ['Ųl', 'ū'],

  // Common autocorrect substitutions
  ['â', 'ā'],
  ['ê', 'ē'],
  ['î', 'ī'],
  ['ô', 'ō'],
  ['û', 'ū'],
  ['ć', 'č'],
  ['ś', 'š'],
  ['ź', 'ž'],
  ['ñ', 'ņ'],

  // Accented character confusion
  ['à', 'ā'],
  ['á', 'ā'],
  ['è', 'ē'],
  ['é', 'ē'],
  ['ì', 'ī'],
  ['í', 'ī'],
  ['ù', 'ū'],
  ['ú', 'ū'],

  // Germanic influence corrections
  ['ä', 'ā'],
  ['ö', 'ē'],
  ['ü', 'ū'],
  ['ß', 'š'],
])

// ===== VALIDATION FUNCTIONS =====

/**
 * Check if a character is a valid Latvian letter
 *
 * @param char - Character to validate
 * @returns True if character is in Latvian alphabet
 */
export function isLatvianLetter(char: string): boolean {
  if (!char || char.length !== 1) return false

  const lowerChar = char.toLowerCase()
  return LATVIAN_ALPHABET.ALL_LETTERS.includes(lowerChar as any)
}

/**
 * Check if a character is a Latvian diacritic
 *
 * @param char - Character to check
 * @returns True if character has diacritic marks
 */
export function isLatvianDiacritic(char: string): boolean {
  if (!char || char.length !== 1) return false

  const lowerChar = char.toLowerCase()
  return LATVIAN_ALPHABET.DIACRITICS.includes(lowerChar as any)
}

/**
 * Check if a character is a Latvian base letter (without diacritics)
 *
 * @param char - Character to check
 * @returns True if character is a base letter that can have diacritics
 */
export function isLatvianBaseLetter(char: string): boolean {
  if (!char || char.length !== 1) return false

  const lowerChar = char.toLowerCase()
  return LATVIAN_ALPHABET.BASE_LETTERS.includes(lowerChar as any)
}

/**
 * Check if a character is a Latvian vowel
 *
 * @param char - Character to check
 * @returns True if character is a Latvian vowel
 */
export function isLatvianVowel(char: string): boolean {
  if (!char || char.length !== 1) return false

  const lowerChar = char.toLowerCase()
  return LATVIAN_ALPHABET.VOWELS.includes(lowerChar as any)
}

/**
 * Check if a character is a Latvian consonant
 *
 * @param char - Character to check
 * @returns True if character is a Latvian consonant
 */
export function isLatvianConsonant(char: string): boolean {
  if (!char || char.length !== 1) return false

  const lowerChar = char.toLowerCase()
  return LATVIAN_ALPHABET.CONSONANTS.includes(lowerChar as any)
}

// ===== TEXT PROCESSING FUNCTIONS =====

/**
 * Validate if text contains only valid Latvian characters and basic punctuation
 *
 * @param text - Text to validate
 * @returns Validation result with details
 */
export function validateLatvianText(text: string): {
  isValid: boolean
  invalidCharacters: string[]
  suggestions: string[]
} {
  if (!text) {
    return { isValid: true, invalidCharacters: [], suggestions: [] }
  }

  const invalidCharacters: string[] = []
  const suggestions: string[] = []

  // Check each character
  for (const char of text) {
    // Skip whitespace and common punctuation
    if (/[\s.,!?;:'"()\-–—]/.test(char)) continue

    // Check if valid Latvian character
    if (!isLatvianLetter(char)) {
      invalidCharacters.push(char)

      // Suggest corrections for common errors
      const suggestion = ERROR_CORRECTION_MAPPINGS.get(char)
      if (suggestion) {
        suggestions.push(`Replace "${char}" with "${suggestion}"`)
      }
    }
  }

  return {
    isValid: invalidCharacters.length === 0,
    invalidCharacters: [...new Set(invalidCharacters)], // Remove duplicates
    suggestions: [...new Set(suggestions)], // Remove duplicates
  }
}

/**
 * Handle common Latvian typing variations and input methods
 *
 * @param text - Input text with potential alternative notation
 * @returns Text with standardized Latvian characters
 */
export function handleLatvianTypingVariations(text: string): string {
  if (!text) return ''

  let processed = text

  // Apply input method mappings
  for (const [input, output] of INPUT_METHOD_MAPPINGS) {
    processed = processed.replace(new RegExp(escapeRegExp(input), 'g'), output)
  }

  // Apply error corrections
  for (const [error, correction] of ERROR_CORRECTION_MAPPINGS) {
    processed = processed.replace(
      new RegExp(escapeRegExp(error), 'g'),
      correction
    )
  }

  return processed
}

/**
 * Convert text to use base letters only (remove diacritics)
 *
 * @param text - Text with potential diacritics
 * @returns Text with diacritics converted to base letters
 */
export function removeLatvianDiacritics(text: string): string {
  if (!text) return ''

  let result = ''
  for (const char of text) {
    const baseChar = DIACRITIC_TO_BASE.get(char)
    result += baseChar || char
  }

  return result
}

/**
 * Add diacritics to base letters where appropriate
 * Note: This is a simple mapping and may not always be contextually correct
 *
 * @param text - Text with base letters
 * @returns Text with potential diacritics added
 */
export function addLatvianDiacritics(text: string): string {
  if (!text) return ''

  let result = ''
  for (const char of text) {
    const diacriticChar = BASE_TO_DIACRITIC.get(char)
    // Only auto-add diacritics for vowels in this simple implementation
    if (diacriticChar && isLatvianVowel(diacriticChar)) {
      result += diacriticChar
    } else {
      result += char
    }
  }

  return result
}

/**
 * Get the base letter for a given character
 *
 * @param char - Character (potentially with diacritics)
 * @returns Base letter without diacritics
 */
export function getBaseLetter(char: string): string {
  if (!char) return ''
  return DIACRITIC_TO_BASE.get(char) || char
}

/**
 * Get the diacritic version of a base letter
 *
 * @param char - Base letter
 * @returns Diacritic version if available, otherwise original character
 */
export function getDiacriticLetter(char: string): string {
  if (!char) return ''
  return BASE_TO_DIACRITIC.get(char) || char
}

/**
 * Count diacritics in text
 *
 * @param text - Text to analyze
 * @returns Object with diacritic counts
 */
export function countLatvianDiacritics(text: string): {
  total: number
  byCharacter: Record<string, number>
} {
  const counts: Record<string, number> = {}
  let total = 0

  for (const char of text) {
    if (isLatvianDiacritic(char)) {
      counts[char] = (counts[char] || 0) + 1
      total++
    }
  }

  return { total, byCharacter: counts }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Escape special regex characters
 *
 * @param string - String to escape
 * @returns Escaped string safe for regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Get all possible input variations for a Latvian character
 *
 * @param char - Latvian character
 * @returns Array of possible input variations
 */
export function getInputVariations(char: string): string[] {
  const variations: string[] = [char]

  // Add case variations
  variations.push(char.toUpperCase(), char.toLowerCase())

  // Add alternative input methods
  for (const [input, output] of INPUT_METHOD_MAPPINGS) {
    if (output === char) {
      variations.push(input)
    }
  }

  // Add error variations
  for (const [error, correction] of ERROR_CORRECTION_MAPPINGS) {
    if (correction === char) {
      variations.push(error)
    }
  }

  return [...new Set(variations)] // Remove duplicates
}

/**
 * Check if text appears to be in Latvian based on character frequency
 *
 * @param text - Text to analyze
 * @returns Confidence score (0-1) that text is Latvian
 */
export function getLatvianTextConfidence(text: string): number {
  if (!text || text.length < 10) return 0

  const totalChars = text.replace(/\s/g, '').length
  if (totalChars === 0) return 0

  let latvianChars = 0
  let diacriticChars = 0

  for (const char of text) {
    if (isLatvianLetter(char)) {
      latvianChars++
      if (isLatvianDiacritic(char)) {
        diacriticChars++
      }
    }
  }

  // Base confidence from Latvian character ratio
  const baseConfidence = latvianChars / totalChars

  // Boost confidence if diacritics are present (typical of Latvian)
  const diacriticBoost = Math.min(0.2, (diacriticChars / totalChars) * 2)

  return Math.min(1, baseConfidence + diacriticBoost)
}
