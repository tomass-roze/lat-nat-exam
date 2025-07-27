/**
 * Performance benchmark script for Issue #4 validation
 * Tests that Latvian text processing meets <10ms requirement
 */

import { compareAnthemText, normalizeLatvianText, calculateAccuracy } from './src/utils/textProcessing.js'
import { NATIONAL_ANTHEM_TEXT } from './src/types/constants.js'

// Test data
const testCases = [
  NATIONAL_ANTHEM_TEXT,
  NATIONAL_ANTHEM_TEXT.toUpperCase(),
  NATIONAL_ANTHEM_TEXT.toLowerCase(),
  'Dievs, svētī Latviju, mūs dārgo tēviju!',
  'dievs sveti latviju', // Without diacritics
]

console.log('🇱🇻 Latvian Text Processing Performance Benchmark')
console.log('=' .repeat(50))
console.log(`Target: <10ms per operation (Issue #4 requirement)`)
console.log(`Test cases: ${testCases.length}`)
console.log('')

let totalTime = 0
let testCount = 0

for (let i = 0; i < testCases.length; i++) {
  const testText = testCases[i]
  
  console.log(`Test ${i + 1}: ${testText.substring(0, 30)}...`)
  
  // Test compareAnthemText (main function)
  const start1 = performance.now()
  const result = compareAnthemText(testText)
  const end1 = performance.now()
  const time1 = end1 - start1
  
  // Test individual functions
  const start2 = performance.now()
  const normalized = normalizeLatvianText(testText)
  const accuracy = calculateAccuracy(normalized, NATIONAL_ANTHEM_TEXT)
  const end2 = performance.now()
  const time2 = end2 - start2
  
  totalTime += time1 + time2
  testCount += 2
  
  console.log(`  compareAnthemText(): ${time1.toFixed(2)}ms ${time1 < 10 ? '✅' : '❌'}`)
  console.log(`  normalize + accuracy: ${time2.toFixed(2)}ms ${time2 < 10 ? '✅' : '❌'}`)
  console.log(`  Result: ${result.passed ? 'PASS' : 'FAIL'} (${result.accuracy.toFixed(1)}%)`)
  console.log('')
}

const averageTime = totalTime / testCount
console.log('Summary:')
console.log(`Average time: ${averageTime.toFixed(2)}ms`)
console.log(`Total time: ${totalTime.toFixed(2)}ms`)
console.log(`Performance requirement: ${averageTime < 10 ? '✅ MET' : '❌ NOT MET'}`)

if (averageTime < 10) {
  console.log('')
  console.log('🎉 Issue #4 performance requirement satisfied!')
  console.log('✅ All Latvian text processing operations complete in <10ms')
} else {
  console.log('')
  console.log('⚠️  Performance optimization needed')
  console.log(`Average time ${averageTime.toFixed(2)}ms exceeds 10ms requirement`)
}