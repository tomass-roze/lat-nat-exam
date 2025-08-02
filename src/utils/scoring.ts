/**
 * @fileoverview Scoring utilities for the Latvian Citizenship Exam
 *
 * Provides comprehensive scoring calculations for all exam sections,
 * generating detailed results with pass/fail determination and analytics.
 */

import type {
  TestResults,
  TestState,
  SelectedQuestions,
  AnthemResult,
  MultipleChoiceResult,
  OverallResult,
  ResultAnalytics,
  AnswerResult,
  MultipleChoiceAnalysis,
  PerformanceTrends,
  PerformanceBenchmarks,
  ExamStatistics,
} from '@/types'
import { SCORING_THRESHOLDS } from '@/types/constants'
import { compareAnthemText } from '@/utils/textProcessing'

/**
 * Calculate complete test results from exam state
 */
export function calculateTestResults(
  testState: TestState,
  selectedQuestions: SelectedQuestions
): TestResults {
  const startTime = performance.now()
  const { enabledSections } = testState

  // Calculate results only for enabled sections
  const anthem = enabledSections.anthem
    ? calculateAnthemResults(testState.anthemText)
    : undefined

  const history = enabledSections.history
    ? calculateHistoryResults(
        testState.historyAnswers,
        selectedQuestions.history
      )
    : undefined

  const constitution = enabledSections.constitution
    ? calculateConstitutionResults(
        testState.constitutionAnswers,
        selectedQuestions.constitution
      )
    : undefined

  // Calculate proportional overall result based on enabled sections
  const overall = calculateDynamicOverallResult(
    { anthem, history, constitution },
    testState
  )

  // Generate analytics for enabled sections only
  const analytics = generateDynamicResultAnalytics(
    { anthem, history, constitution },
    testState,
    startTime
  )

  return {
    anthem,
    history,
    constitution,
    overall,
    calculatedAt: Date.now(),
    analytics,
  }
}

/**
 * Calculate anthem section results using existing text processing
 */
export function calculateAnthemResults(anthemText: string): AnthemResult {
  return compareAnthemText(anthemText)
}

/**
 * Calculate history section results
 */
export function calculateHistoryResults(
  answers: Record<number, 0 | 1 | 2>,
  questions: any[]
): MultipleChoiceResult {
  const answerResults: AnswerResult[] = []
  let correctCount = 0

  // Process each answer
  for (const [questionIdStr, selectedAnswer] of Object.entries(answers)) {
    const questionId = parseInt(questionIdStr)
    const question = questions.find((q) => q.id === questionId)

    if (question) {
      const isCorrect = selectedAnswer === question.correctAnswer
      if (isCorrect) correctCount++

      answerResults.push({
        question,
        selectedAnswer,
        isCorrect,
        timeToAnswer: 30000, // Default 30s - would be enhanced with real timing
        correctAnswer: question.correctAnswer,
      })
    }
  }

  const total = SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS
  const percentage = Math.round((correctCount / total) * 100)
  const passed = correctCount >= SCORING_THRESHOLDS.HISTORY_PASS_COUNT

  // Generate analysis
  const analysis = generateMultipleChoiceAnalysis(answerResults)

  return {
    passed,
    correct: correctCount,
    total,
    percentage,
    answers: answerResults,
    analysis,
    passingScore: SCORING_THRESHOLDS.HISTORY_PASS_COUNT,
  }
}

/**
 * Calculate constitution section results
 */
export function calculateConstitutionResults(
  answers: Record<number, 0 | 1 | 2>,
  questions: any[]
): MultipleChoiceResult {
  const answerResults: AnswerResult[] = []
  let correctCount = 0

  // Process each answer
  for (const [questionIdStr, selectedAnswer] of Object.entries(answers)) {
    const questionId = parseInt(questionIdStr)
    const question = questions.find((q) => q.id === questionId)

    if (question) {
      const isCorrect = selectedAnswer === question.correctAnswer
      if (isCorrect) correctCount++

      answerResults.push({
        question,
        selectedAnswer,
        isCorrect,
        timeToAnswer: 30000, // Default 30s - would be enhanced with real timing
        correctAnswer: question.correctAnswer,
      })
    }
  }

  const total = SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS
  const percentage = Math.round((correctCount / total) * 100)
  const passed = correctCount >= SCORING_THRESHOLDS.CONSTITUTION_PASS_COUNT

  // Generate analysis
  const analysis = generateMultipleChoiceAnalysis(answerResults)

  return {
    passed,
    correct: correctCount,
    total,
    percentage,
    answers: answerResults,
    analysis,
    passingScore: SCORING_THRESHOLDS.CONSTITUTION_PASS_COUNT,
  }
}

/**
 * Calculate overall exam result
 */
export function calculateOverallResult(
  anthem: AnthemResult,
  history: MultipleChoiceResult,
  constitution: MultipleChoiceResult,
  testState: TestState
): OverallResult {
  const allSectionsPassed =
    anthem.passed && history.passed && constitution.passed
  const totalTime = Date.now() - testState.startTime

  // Calculate weighted overall score
  const overallScore = Math.round(
    (anthem.accuracy + history.percentage + constitution.percentage) / 3
  )

  return {
    passed: allSectionsPassed,
    overallScore,
    sectionResults: {
      anthem: anthem.passed,
      history: history.passed,
      constitution: constitution.passed,
    },
    totalTime,
    completedAt: Date.now(),
    certificateEligible: allSectionsPassed,
  }
}

/**
 * Calculate overall result for dynamic sections (partial tests)
 */
export function calculateDynamicOverallResult(
  results: {
    anthem?: AnthemResult
    history?: MultipleChoiceResult
    constitution?: MultipleChoiceResult
  },
  testState: TestState
): OverallResult {
  const { enabledSections, testConfiguration } = testState
  const enabledResults: Array<{ passed: boolean; score: number }> = []

  // Collect results from enabled sections only
  if (results.anthem && enabledSections.anthem) {
    enabledResults.push({
      passed: results.anthem.passed,
      score: results.anthem.accuracy,
    })
  }
  if (results.history && enabledSections.history) {
    enabledResults.push({
      passed: results.history.passed,
      score: results.history.percentage,
    })
  }
  if (results.constitution && enabledSections.constitution) {
    enabledResults.push({
      passed: results.constitution.passed,
      score: results.constitution.percentage,
    })
  }

  // Calculate if all enabled sections passed
  const allEnabledSectionsPassed = enabledResults.every(
    (result) => result.passed
  )

  // Calculate weighted overall score based on enabled sections
  const overallScore =
    enabledResults.length > 0
      ? Math.round(
          enabledResults.reduce((sum, result) => sum + result.score, 0) /
            enabledResults.length
        )
      : 0

  const totalTime = Date.now() - testState.startTime

  return {
    passed: allEnabledSectionsPassed,
    overallScore,
    sectionResults: {
      anthem: results.anthem?.passed ?? false,
      history: results.history?.passed ?? false,
      constitution: results.constitution?.passed ?? false,
    },
    totalTime,
    completedAt: Date.now(),
    certificateEligible: testConfiguration.isPartialTest
      ? false // Partial tests don't qualify for certificate
      : allEnabledSectionsPassed,
    partialTestInfo: testConfiguration.isPartialTest
      ? {
          completedSections: testConfiguration.sectionNames,
          totalSections: testConfiguration.totalSections,
          remainingSections: ['anthem', 'history', 'constitution'].filter(
            (section) => !testConfiguration.sectionNames.includes(section)
          ),
        }
      : undefined,
  }
}

/**
 * Generate analysis for multiple choice sections
 */
function generateMultipleChoiceAnalysis(
  answers: AnswerResult[]
): MultipleChoiceAnalysis {
  if (answers.length === 0) {
    return {
      averageTimePerQuestion: 0,
      firstTryCorrect: 0,
      answerDistribution: { option0: 0, option1: 0, option2: 0 },
      timingStats: {
        fastest: {} as AnswerResult,
        slowest: {} as AnswerResult,
        median: 0,
      },
    }
  }

  // Calculate timing statistics
  const times = answers.map((a) => a.timeToAnswer).sort((a, b) => a - b)
  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
  const medianTime = times[Math.floor(times.length / 2)]

  // Find fastest and slowest answers
  const fastest = answers.reduce((min, answer) =>
    answer.timeToAnswer < min.timeToAnswer ? answer : min
  )
  const slowest = answers.reduce((max, answer) =>
    answer.timeToAnswer > max.timeToAnswer ? answer : max
  )

  // Calculate answer distribution
  const distribution = { option0: 0, option1: 0, option2: 0 }
  answers.forEach((answer) => {
    if (answer.selectedAnswer === 0) distribution.option0++
    else if (answer.selectedAnswer === 1) distribution.option1++
    else if (answer.selectedAnswer === 2) distribution.option2++
  })

  // Count first-try correct answers (assuming all are first try for now)
  const firstTryCorrect = answers.filter((a) => a.isCorrect).length

  return {
    averageTimePerQuestion: averageTime,
    firstTryCorrect,
    answerDistribution: distribution,
    timingStats: {
      fastest,
      slowest,
      median: medianTime,
    },
  }
}

/**
 * Generate analytics for dynamic section results (partial tests)
 */
function generateDynamicResultAnalytics(
  results: {
    anthem?: AnthemResult
    history?: MultipleChoiceResult
    constitution?: MultipleChoiceResult
  },
  testState: TestState,
  calculationStartTime: number
): ResultAnalytics {
  // Generate recommendations based on available results
  const recommendations = generateDynamicRecommendations(results, testState)
  const strengths = identifyDynamicStrengths(results)
  const trends = analyzePerformanceTrends() // This can remain the same
  const benchmarks = generateDynamicBenchmarks(results, testState)
  const statistics = calculateExamStatistics(testState, calculationStartTime)

  return {
    trends,
    benchmarks,
    recommendations,
    strengths,
    statistics,
  }
}

/**
 * Generate recommendations for partial test results
 */
function generateDynamicRecommendations(
  results: {
    anthem?: AnthemResult
    history?: MultipleChoiceResult
    constitution?: MultipleChoiceResult
  },
  testState: TestState
): string[] {
  const recommendations: string[] = []
  const { testConfiguration, enabledSections } = testState

  // Section-specific recommendations
  if (results.anthem && enabledSections.anthem) {
    if (results.anthem.accuracy < 75) {
      recommendations.push('Vairāk prakticoties himnas teksta rakstīšanā')
    }
  }

  if (results.history && enabledSections.history) {
    if (results.history.correct < 7) {
      recommendations.push('Papildus izpētīt Latvijas vēsturi')
    }
  }

  if (results.constitution && enabledSections.constitution) {
    if (results.constitution.correct < 5) {
      recommendations.push('Dziļāk izpētīt Latvijas Republikas Satversmi')
    }
  }

  // Partial test specific recommendations
  if (testConfiguration.isPartialTest) {
    const remainingSections = ['anthem', 'history', 'constitution'].filter(
      (section) => !testConfiguration.sectionNames.includes(section)
    )

    if (remainingSections.length > 0) {
      const sectionNames = remainingSections
        .map((section) => {
          switch (section) {
            case 'anthem':
              return 'himnas'
            case 'history':
              return 'vēstures'
            case 'constitution':
              return 'konstitūcijas'
            default:
              return section
          }
        })
        .join(', ')

      recommendations.push(`Papildus prakticēt ${sectionNames} sadaļu`)
    }
  }

  return recommendations
}

/**
 * Identify strengths in partial test results
 */
function identifyDynamicStrengths(results: {
  anthem?: AnthemResult
  history?: MultipleChoiceResult
  constitution?: MultipleChoiceResult
}): string[] {
  const strengths: string[] = []

  if (results.anthem?.passed) {
    strengths.push('Laba himnas teksta prasme')
  }

  if (results.history?.passed) {
    strengths.push('Labas vēstures zināšanas')
  }

  if (results.constitution?.passed) {
    strengths.push('Labas konstitūcijas zināšanas')
  }

  return strengths
}

/**
 * Generate benchmarks for partial test results
 */
function generateDynamicBenchmarks(
  results: {
    anthem?: AnthemResult
    history?: MultipleChoiceResult
    constitution?: MultipleChoiceResult
  },
  testState: TestState
): PerformanceBenchmarks {
  const { enabledSections } = testState

  return {
    percentileRanking: 50, // Default to median
    comparedToAverage: {
      anthem:
        results.anthem && enabledSections.anthem
          ? results.anthem.accuracy > 75
            ? 'above'
            : results.anthem.accuracy < 60
              ? 'below'
              : 'average'
          : 'average',
      history:
        results.history && enabledSections.history
          ? results.history.percentage > 70
            ? 'above'
            : results.history.percentage < 50
              ? 'below'
              : 'average'
          : 'average',
      constitution:
        results.constitution && enabledSections.constitution
          ? results.constitution.percentage > 70
            ? 'above'
            : results.constitution.percentage < 50
              ? 'below'
              : 'average'
          : 'average',
      timing: 'average', // Default to average for now
    },
  }
}


/**
 * Analyze performance trends (simplified for now)
 */
function analyzePerformanceTrends(): PerformanceTrends {
  // For now, return stable trends - would be enhanced with historical data
  return {
    accuracyTrend: 'stable',
    speedTrend: 'stable',
    confidenceTrend: 'stable',
  }
}


/**
 * Calculate detailed exam statistics
 */
function calculateExamStatistics(
  testState: TestState,
  calculationStartTime: number
): ExamStatistics {
  const totalTime = Date.now() - testState.startTime

  return {
    totalCharactersTyped: testState.anthemText.length,
    totalQuestionsAnswered:
      Object.keys(testState.historyAnswers).length +
      Object.keys(testState.constitutionAnswers).length,
    answerChanges: 0, // Would be tracked with real state management
    timeDistribution: {
      anthem: totalTime * 0.4, // Estimated 40% of time on anthem
      history: totalTime * 0.3, // 30% on history
      constitution: totalTime * 0.3, // 30% on constitution
      results: Date.now() - calculationStartTime,
    },
    errorStats: {
      totalErrors: 0, // Would be calculated from validation history
      errorsByType: {},
      mostCommonError: 'Nav kļūdu',
    },
  }
}

/**
 * Quick utility to check if exam is passing
 */
export function isExamPassing(results: TestResults): boolean {
  return results.overall.passed
}

/**
 * Get section pass status summary
 */
export function getSectionPassSummary(results: TestResults): {
  passed: number
  total: number
  sections: Array<{ name: string; passed: boolean; score: number }>
} {
  const sections = []

  if (results.anthem) {
    sections.push({
      name: 'Himna',
      passed: results.anthem.passed,
      score: results.anthem.accuracy,
    })
  }

  if (results.history) {
    sections.push({
      name: 'Vēsture',
      passed: results.history.passed,
      score: results.history.percentage,
    })
  }

  if (results.constitution) {
    sections.push({
      name: 'Konstitūcija',
      passed: results.constitution.passed,
      score: results.constitution.percentage,
    })
  }

  const passed = sections.filter((s) => s.passed).length

  return {
    passed,
    total: sections.length,
    sections,
  }
}
