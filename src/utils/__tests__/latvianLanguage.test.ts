/**
 * @fileoverview Unit tests for Latvian language support utilities
 * 
 * Comprehensive test suite for latvianLanguage.ts functions including:
 * - Alphabet definitions and character validation
 * - Character mapping and conversion functions
 * - Input method handling and error correction
 * - Text validation and quality assessment
 */

import { strict as assert } from 'node:assert'
import { test, describe } from 'node:test'

// Import functions and constants to test
import {
  LATVIAN_ALPHABET,
  CASE_MAPPINGS,
  DIACRITIC_TO_BASE,
  BASE_TO_DIACRITIC,
  INPUT_METHOD_MAPPINGS,
  isLatvianLetter,
  isLatvianDiacritic,
  isLatvianBaseLetter,
  isLatvianVowel,
  isLatvianConsonant,
  validateLatvianText,
  handleLatvianTypingVariations,
  removeLatvianDiacritics,
  addLatvianDiacritics,
  getBaseLetter,
  getDiacriticLetter,
  countLatvianDiacritics,
  getInputVariations,
  getLatvianTextConfidence,
} from '../latvianLanguage'

// ===== ALPHABET DEFINITIONS TESTS =====

describe('Latvian Alphabet Definitions', () => {
  test('LATVIAN_ALPHABET contains correct vowels', () => {
    const expectedVowels = ['a', 'ā', 'e', 'ē', 'i', 'ī', 'o', 'u', 'ū']
    assert.deepStrictEqual([...LATVIAN_ALPHABET.VOWELS], expectedVowels)
  })

  test('LATVIAN_ALPHABET contains correct consonants', () => {
    const expectedConsonants = [
      'b', 'c', 'č', 'd', 'f', 'g', 'ģ', 'h', 'j', 'k', 'ķ', 
      'l', 'ļ', 'm', 'n', 'ņ', 'p', 'r', 's', 'š', 't', 'v', 'z', 'ž'
    ]
    assert.deepStrictEqual([...LATVIAN_ALPHABET.CONSONANTS], expectedConsonants)
  })

  test('LATVIAN_ALPHABET contains correct diacritics', () => {
    const expectedDiacritics = ['ā', 'č', 'ē', 'ģ', 'ī', 'ķ', 'ļ', 'ņ', 'š', 'ū', 'ž']
    assert.deepStrictEqual([...LATVIAN_ALPHABET.DIACRITICS], expectedDiacritics)
  })

  test('LATVIAN_ALPHABET contains correct base letters', () => {
    const expectedBaseLetters = ['a', 'c', 'e', 'g', 'i', 'k', 'l', 'n', 's', 'u', 'z']
    assert.deepStrictEqual([...LATVIAN_ALPHABET.BASE_LETTERS], expectedBaseLetters)
  })

  test('LATVIAN_ALPHABET ALL_LETTERS has 33 characters', () => {
    assert.strictEqual(LATVIAN_ALPHABET.ALL_LETTERS.length, 33)
  })

  test('LATVIAN_ALPHABET ALL_LETTERS contains all vowels and consonants', () => {
    const allLetters = [...LATVIAN_ALPHABET.ALL_LETTERS]
    
    LATVIAN_ALPHABET.VOWELS.forEach(vowel => {
      assert.ok(allLetters.includes(vowel), `Vowel ${vowel} should be in ALL_LETTERS`)
    })
    
    LATVIAN_ALPHABET.CONSONANTS.forEach(consonant => {
      assert.ok(allLetters.includes(consonant), `Consonant ${consonant} should be in ALL_LETTERS`)
    })
  })
})

// ===== CHARACTER MAPPING TESTS =====

describe('Character Mappings', () => {
  test('CASE_MAPPINGS correctly maps uppercase to lowercase', () => {
    assert.strictEqual(CASE_MAPPINGS.get('A'), 'a')
    assert.strictEqual(CASE_MAPPINGS.get('Ā'), 'ā')
    assert.strictEqual(CASE_MAPPINGS.get('Č'), 'č')
    assert.strictEqual(CASE_MAPPINGS.get('Ž'), 'ž')
  })

  test('DIACRITIC_TO_BASE maps correctly', () => {
    assert.strictEqual(DIACRITIC_TO_BASE.get('ā'), 'a')
    assert.strictEqual(DIACRITIC_TO_BASE.get('č'), 'c')
    assert.strictEqual(DIACRITIC_TO_BASE.get('ē'), 'e')
    assert.strictEqual(DIACRITIC_TO_BASE.get('ģ'), 'g')
    assert.strictEqual(DIACRITIC_TO_BASE.get('ū'), 'u')
    assert.strictEqual(DIACRITIC_TO_BASE.get('ž'), 'z')
  })

  test('BASE_TO_DIACRITIC maps correctly', () => {
    assert.strictEqual(BASE_TO_DIACRITIC.get('a'), 'ā')
    assert.strictEqual(BASE_TO_DIACRITIC.get('c'), 'č')
    assert.strictEqual(BASE_TO_DIACRITIC.get('e'), 'ē')
    assert.strictEqual(BASE_TO_DIACRITIC.get('g'), 'ģ')
    assert.strictEqual(BASE_TO_DIACRITIC.get('u'), 'ū')
    assert.strictEqual(BASE_TO_DIACRITIC.get('z'), 'ž')
  })

  test('uppercase and lowercase mappings are consistent', () => {
    assert.strictEqual(DIACRITIC_TO_BASE.get('Ā'), 'A')
    assert.strictEqual(BASE_TO_DIACRITIC.get('A'), 'Ā')
  })
})

// ===== INPUT METHOD MAPPINGS TESTS =====

describe('Input Method Mappings', () => {
  test('INPUT_METHOD_MAPPINGS handles colon notation', () => {
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('a:'), 'ā')
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('e:'), 'ē')
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('i:'), 'ī')
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('u:'), 'ū')
  })

  test('INPUT_METHOD_MAPPINGS handles caret notation', () => {
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('c^'), 'č')
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('g^'), 'ģ')
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('s^'), 'š')
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('z^'), 'ž')
  })

  test('INPUT_METHOD_MAPPINGS handles x-notation', () => {
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('ax'), 'ā')
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('cx'), 'č')
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('sx'), 'š')
  })

  test('INPUT_METHOD_MAPPINGS handles number notation', () => {
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('a1'), 'ā')
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('c1'), 'č')
    assert.strictEqual(INPUT_METHOD_MAPPINGS.get('s1'), 'š')
  })
})

// ===== CHARACTER VALIDATION TESTS =====

describe('Character Validation Functions', () => {
  test('isLatvianLetter correctly identifies Latvian letters', () => {
    // Valid Latvian letters
    assert.strictEqual(isLatvianLetter('a'), true)
    assert.strictEqual(isLatvianLetter('ā'), true)
    assert.strictEqual(isLatvianLetter('č'), true)
    assert.strictEqual(isLatvianLetter('ž'), true)
    assert.strictEqual(isLatvianLetter('A'), true)
    assert.strictEqual(isLatvianLetter('Ā'), true)
    
    // Invalid characters
    assert.strictEqual(isLatvianLetter('x'), false)
    assert.strictEqual(isLatvianLetter('1'), false)
    assert.strictEqual(isLatvianLetter(' '), false)
    assert.strictEqual(isLatvianLetter(''), false)
    assert.strictEqual(isLatvianLetter('ab'), false) // Multiple characters
  })

  test('isLatvianDiacritic correctly identifies diacritics', () => {
    // Diacritic letters
    assert.strictEqual(isLatvianDiacritic('ā'), true)
    assert.strictEqual(isLatvianDiacritic('č'), true)
    assert.strictEqual(isLatvianDiacritic('ē'), true)
    assert.strictEqual(isLatvianDiacritic('ž'), true)
    assert.strictEqual(isLatvianDiacritic('Ā'), true)
    
    // Non-diacritic letters
    assert.strictEqual(isLatvianDiacritic('a'), false)
    assert.strictEqual(isLatvianDiacritic('b'), false)
    assert.strictEqual(isLatvianDiacritic('z'), false)
  })

  test('isLatvianBaseLetter correctly identifies base letters', () => {
    // Base letters that have diacritic variants
    assert.strictEqual(isLatvianBaseLetter('a'), true)
    assert.strictEqual(isLatvianBaseLetter('c'), true)
    assert.strictEqual(isLatvianBaseLetter('e'), true)
    assert.strictEqual(isLatvianBaseLetter('z'), true)
    
    // Letters without diacritic variants
    assert.strictEqual(isLatvianBaseLetter('b'), false)
    assert.strictEqual(isLatvianBaseLetter('d'), false)
    
    // Diacritic letters themselves
    assert.strictEqual(isLatvianBaseLetter('ā'), false)
    assert.strictEqual(isLatvianBaseLetter('č'), false)
  })

  test('isLatvianVowel correctly identifies vowels', () => {
    // Vowels
    assert.strictEqual(isLatvianVowel('a'), true)
    assert.strictEqual(isLatvianVowel('ā'), true)
    assert.strictEqual(isLatvianVowel('e'), true)
    assert.strictEqual(isLatvianVowel('ē'), true)
    assert.strictEqual(isLatvianVowel('o'), true)
    assert.strictEqual(isLatvianVowel('u'), true)
    assert.strictEqual(isLatvianVowel('ū'), true)
    
    // Consonants
    assert.strictEqual(isLatvianVowel('b'), false)
    assert.strictEqual(isLatvianVowel('č'), false)
    assert.strictEqual(isLatvianVowel('z'), false)
  })

  test('isLatvianConsonant correctly identifies consonants', () => {
    // Consonants
    assert.strictEqual(isLatvianConsonant('b'), true)
    assert.strictEqual(isLatvianConsonant('c'), true)
    assert.strictEqual(isLatvianConsonant('č'), true)
    assert.strictEqual(isLatvianConsonant('ž'), true)
    
    // Vowels
    assert.strictEqual(isLatvianConsonant('a'), false)
    assert.strictEqual(isLatvianConsonant('ā'), false)
    assert.strictEqual(isLatvianConsonant('e'), false)
  })
})

// ===== TEXT VALIDATION TESTS =====

describe('Text Validation', () => {
  test('validateLatvianText accepts empty text', () => {
    const result = validateLatvianText('')
    assert.strictEqual(result.isValid, true)
    assert.strictEqual(result.invalidCharacters.length, 0)
    assert.strictEqual(result.suggestions.length, 0)
  })

  test('validateLatvianText accepts valid Latvian text', () => {
    const validText = 'Dievs, svētī Latviju!'
    const result = validateLatvianText(validText)
    assert.strictEqual(result.isValid, true)
    assert.strictEqual(result.invalidCharacters.length, 0)
  })

  test('validateLatvianText detects invalid characters', () => {
    const invalidText = 'Hello Latvija x123'
    const result = validateLatvianText(invalidText)
    assert.strictEqual(result.isValid, false)
    assert.ok(result.invalidCharacters.includes('H'))
    assert.ok(result.invalidCharacters.includes('x'))
    assert.ok(result.invalidCharacters.includes('1'))
  })

  test('validateLatvianText provides suggestions for common errors', () => {
    const textWithErrors = 'âêî' // Common autocorrect substitutions
    const result = validateLatvianText(textWithErrors)
    assert.strictEqual(result.isValid, false)
    assert.ok(result.suggestions.length > 0)
    assert.ok(result.suggestions.some(s => s.includes('â') && s.includes('ā')))
  })

  test('validateLatvianText ignores whitespace and punctuation', () => {
    const textWithPunctuation = 'Latvija! Jā, tā ir mūsu zeme... (2024)'
    const result = validateLatvianText(textWithPunctuation)
    // Should only flag '2024' and 'H' from 'Hello' as invalid
    assert.ok(result.invalidCharacters.includes('2'))
    assert.ok(result.invalidCharacters.includes('0'))
    assert.ok(result.invalidCharacters.includes('4'))
  })
})

// ===== TEXT PROCESSING FUNCTIONS TESTS =====

describe('Text Processing Functions', () => {
  test('handleLatvianTypingVariations processes input methods', () => {
    const input = 'a: e: i: u: c^ g^ s^ z^'
    const expected = 'ā ē ī ū č ģ š ž'
    const result = handleLatvianTypingVariations(input)
    assert.strictEqual(result, expected)
  })

  test('handleLatvianTypingVariations handles error corrections', () => {
    const input = 'â ê î ô û'
    const expected = 'ā ē ī ō ū'
    const result = handleLatvianTypingVariations(input)
    assert.strictEqual(result, expected)
  })

  test('handleLatvianTypingVariations handles empty input', () => {
    assert.strictEqual(handleLatvianTypingVariations(''), '')
    assert.strictEqual(handleLatvianTypingVariations(null as any), '')
  })

  test('removeLatvianDiacritics removes all diacritics', () => {
    const input = 'āčēģīķļņšūž'
    const expected = 'acegiklnsuz'
    const result = removeLatvianDiacritics(input)
    assert.strictEqual(result, expected)
  })

  test('removeLatvianDiacritics preserves non-diacritic characters', () => {
    const input = 'Latvija 123!'
    const result = removeLatvianDiacritics(input)
    assert.strictEqual(result, input) // Should be unchanged
  })

  test('removeLatvianDiacritics handles mixed case', () => {
    const input = 'ĀčĒģ'
    const expected = 'AcEg'
    const result = removeLatvianDiacritics(input)
    assert.strictEqual(result, expected)
  })

  test('addLatvianDiacritics adds diacritics to vowels', () => {
    const input = 'aeiou'
    const result = addLatvianDiacritics(input)
    // Should add diacritics to vowels
    assert.ok(result.includes('ā'))
    assert.ok(result.includes('ē'))
    assert.ok(result.includes('ī'))
    assert.ok(result.includes('ū'))
  })

  test('getBaseLetter returns base letter', () => {
    assert.strictEqual(getBaseLetter('ā'), 'a')
    assert.strictEqual(getBaseLetter('č'), 'c')
    assert.strictEqual(getBaseLetter('a'), 'a') // Already base letter
    assert.strictEqual(getBaseLetter(''), '') // Empty input
  })

  test('getDiacriticLetter returns diacritic version', () => {
    assert.strictEqual(getDiacriticLetter('a'), 'ā')
    assert.strictEqual(getDiacriticLetter('c'), 'č')
    assert.strictEqual(getDiacriticLetter('ā'), 'ā') // Already diacritic
    assert.strictEqual(getDiacriticLetter('b'), 'b') // No diacritic version
  })
})

// ===== COUNTING AND ANALYSIS TESTS =====

describe('Counting and Analysis Functions', () => {
  test('countLatvianDiacritics counts correctly', () => {
    const text = 'āčēģīķļņšūž'
    const result = countLatvianDiacritics(text)
    
    assert.strictEqual(result.total, 11)
    assert.strictEqual(result.byCharacter['ā'], 1)
    assert.strictEqual(result.byCharacter['č'], 1)
    assert.strictEqual(result.byCharacter['ž'], 1)
  })

  test('countLatvianDiacritics handles repeated characters', () => {
    const text = 'āāā čč'
    const result = countLatvianDiacritics(text)
    
    assert.strictEqual(result.total, 5)
    assert.strictEqual(result.byCharacter['ā'], 3)
    assert.strictEqual(result.byCharacter['č'], 2)
  })

  test('countLatvianDiacritics ignores non-diacritics', () => {
    const text = 'abc āāā def'
    const result = countLatvianDiacritics(text)
    
    assert.strictEqual(result.total, 3)
    assert.strictEqual(result.byCharacter['ā'], 3)
    assert.strictEqual(Object.keys(result.byCharacter).length, 1)
  })

  test('getInputVariations returns all variations', () => {
    const variations = getInputVariations('ā')
    
    assert.ok(variations.includes('ā')) // Original
    assert.ok(variations.includes('Ā')) // Uppercase
    assert.ok(variations.includes('a:')) // Colon notation
    assert.ok(variations.includes('ax')) // X notation
    
    // Should remove duplicates
    const uniqueVariations = [...new Set(variations)]
    assert.strictEqual(variations.length, uniqueVariations.length)
  })

  test('getLatvianTextConfidence assesses text confidence', () => {
    // Pure Latvian text
    const latvianText = 'Dievs, svētī Latviju, mūs dārgo tēviju!'
    const latvianConfidence = getLatvianTextConfidence(latvianText)
    assert.ok(latvianConfidence > 0.8)
    
    // Mixed text
    const mixedText = 'Hello Latvija x123'
    const mixedConfidence = getLatvianTextConfidence(mixedText)
    assert.ok(mixedConfidence < 0.8)
    
    // Short text
    const shortText = 'abc'
    const shortConfidence = getLatvianTextConfidence(shortText)
    assert.strictEqual(shortConfidence, 0)
  })

  test('getLatvianTextConfidence boosts for diacritics', () => {
    const withoutDiacritics = 'Dievs sveti Latviju'
    const withDiacritics = 'Dievs, svētī Latviju'
    
    const confidenceWithout = getLatvianTextConfidence(withoutDiacritics)
    const confidenceWith = getLatvianTextConfidence(withDiacritics)
    
    assert.ok(confidenceWith > confidenceWithout)
  })
})

// ===== EDGE CASES TESTS =====

describe('Edge Cases', () => {
  test('functions handle null and undefined inputs', () => {
    assert.strictEqual(isLatvianLetter(null as any), false)
    assert.strictEqual(isLatvianLetter(undefined as any), false)
    assert.strictEqual(handleLatvianTypingVariations(null as any), '')
    assert.strictEqual(removeLatvianDiacritics(null as any), '')
    assert.strictEqual(getBaseLetter(null as any), '')
  })

  test('functions handle empty string inputs', () => {
    assert.strictEqual(isLatvianLetter(''), false)
    assert.strictEqual(handleLatvianTypingVariations(''), '')
    assert.strictEqual(removeLatvianDiacritics(''), '')
    assert.strictEqual(getBaseLetter(''), '')
    
    const validation = validateLatvianText('')
    assert.strictEqual(validation.isValid, true)
  })

  test('functions handle very long strings', () => {
    const longString = 'ā'.repeat(10000)
    const result = removeLatvianDiacritics(longString)
    assert.strictEqual(result.length, 10000)
    assert.strictEqual(result, 'a'.repeat(10000))
  })

  test('functions handle unicode edge cases', () => {
    const unicodeText = '𝕃𝕒𝕥𝕧𝕚𝕒' // Mathematical script
    const validation = validateLatvianText(unicodeText)
    assert.strictEqual(validation.isValid, false)
    assert.ok(validation.invalidCharacters.length > 0)
  })

  test('case mapping consistency', () => {
    // Test that all uppercase letters have lowercase mappings
    LATVIAN_ALPHABET.ALL_LETTERS.forEach(letter => {
      const upper = letter.toUpperCase()
      const lower = letter.toLowerCase()
      
      if (upper !== lower) {
        assert.ok(CASE_MAPPINGS.has(upper), `Missing case mapping for ${upper}`)
        assert.strictEqual(CASE_MAPPINGS.get(upper), lower)
      }
    })
  })
})

// ===== PERFORMANCE TESTS =====

describe('Performance', () => {
  test('character validation is fast', () => {
    const startTime = performance.now()
    
    // Test many character validations
    for (let i = 0; i < 1000; i++) {
      isLatvianLetter('ā')
      isLatvianDiacritic('ā')
      isLatvianVowel('ā')
    }
    
    const endTime = performance.now()
    const executionTime = endTime - startTime
    
    assert.ok(executionTime < 10, `Character validation took ${executionTime}ms, should be under 10ms`)
  })

  test('text processing is fast', () => {
    const startTime = performance.now()
    const longText = 'Dievs, svētī Latviju, mūs dārgo tēviju! '.repeat(100)
    
    handleLatvianTypingVariations(longText)
    removeLatvianDiacritics(longText)
    validateLatvianText(longText)
    
    const endTime = performance.now()
    const executionTime = endTime - startTime
    
    assert.ok(executionTime < 50, `Text processing took ${executionTime}ms, should be under 50ms`)
  })
})

// ===== INTEGRATION TESTS =====

describe('Integration with Text Processing', () => {
  test('works with national anthem text', () => {
    const anthemText = `Dievs, svētī Latviju,
Mūs' dārgo tēviju,
Svētī jel Latviju,
Ak, svētī jel to!`

    // Should validate as valid Latvian text
    const validation = validateLatvianText(anthemText)
    assert.strictEqual(validation.isValid, true)
    
    // Should have high confidence
    const confidence = getLatvianTextConfidence(anthemText)
    assert.ok(confidence > 0.9)
    
    // Should count diacritics correctly
    const diacriticCount = countLatvianDiacritics(anthemText)
    assert.ok(diacriticCount.total > 0)
    assert.ok(diacriticCount.byCharacter['ā'] > 0)
    assert.ok(diacriticCount.byCharacter['ē'] > 0)
    assert.ok(diacriticCount.byCharacter['ī'] > 0)
  })

  test('handles common user input errors', () => {
    const userInput = 'a: e: i: u: c^ s^ z^' // Alternative input method
    const processed = handleLatvianTypingVariations(userInput)
    
    // Should convert to proper diacritics
    assert.ok(processed.includes('ā'))
    assert.ok(processed.includes('ē'))
    assert.ok(processed.includes('ī'))
    assert.ok(processed.includes('č'))
    assert.ok(processed.includes('š'))
    assert.ok(processed.includes('ž'))
  })
})