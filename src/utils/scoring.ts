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

  // Calculate results for each section
  const anthem = calculateAnthemResults(testState.anthemText)
  const history = calculateHistoryResults(
    testState.historyAnswers,
    selectedQuestions.history
  )
  const constitution = calculateConstitutionResults(
    testState.constitutionAnswers,
    selectedQuestions.constitution
  )

  // Calculate overall result
  const overall = calculateOverallResult(
    anthem,
    history,
    constitution,
    testState
  )

  // Generate analytics
  const analytics = generateResultAnalytics(
    anthem,
    history,
    constitution,
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
 * Generate comprehensive result analytics
 */
function generateResultAnalytics(
  anthem: AnthemResult,
  history: MultipleChoiceResult,
  constitution: MultipleChoiceResult,
  testState: TestState,
  calculationStartTime: number
): ResultAnalytics {
  const recommendations = generateRecommendations(anthem, history, constitution)
  const strengths = identifyStrengths(anthem, history, constitution)
  const trends = analyzePerformanceTrends()
  const benchmarks = generateBenchmarks(anthem, history, constitution)
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
 * Generate personalized recommendations based on performance
 */
function generateRecommendations(
  anthem: AnthemResult,
  history: MultipleChoiceResult,
  constitution: MultipleChoiceResult
): string[] {
  const recommendations: string[] = []

  // Anthem recommendations
  if (!anthem.passed) {
    if (anthem.accuracy < 50) {
      recommendations.push(
        'Izstudējiet Latvijas himnas tekstu un vingrinājieties to rakstīt no galvas'
      )
    } else {
      recommendations.push(
        'Pievērsiet uzmanību diakritiskajām zīmēm un pareizrakstībai himnā'
      )
    }
  }

  // History recommendations
  if (!history.passed) {
    const failedQuestions = history.answers.filter((a) => !a.isCorrect)
    if (failedQuestions.length > 0) {
      recommendations.push(
        `Studējiet Latvijas vēsturi - ${failedQuestions.length} jautājumi bija nepareizi atbildēti`
      )
    }
  }

  // Constitution recommendations
  if (!constitution.passed) {
    const failedQuestions = constitution.answers.filter((a) => !a.isCorrect)
    if (failedQuestions.length > 0) {
      recommendations.push(
        `Studējiet Latvijas Konstitūciju - ${failedQuestions.length} jautājumi bija nepareizi atbildēti`
      )
    }
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push(
      'Lieliski! Turpinājiet uzturēt savas zināšanas par Latviju'
    )
  }

  return recommendations
}

/**
 * Identify user's strengths
 */
function identifyStrengths(
  anthem: AnthemResult,
  history: MultipleChoiceResult,
  constitution: MultipleChoiceResult
): string[] {
  const strengths: string[] = []

  if (anthem.passed) {
    if (anthem.accuracy >= 95) {
      strengths.push('Izcila himnas zināšana ar augstu precizitāti')
    } else {
      strengths.push('Laba himnas teksta zināšana')
    }
  }

  if (history.passed) {
    if (history.percentage >= 90) {
      strengths.push('Dziļas zināšanas Latvijas vēsturē')
    } else {
      strengths.push('Labas zināšanas Latvijas vēsturē')
    }
  }

  if (constitution.passed) {
    if (constitution.percentage >= 90) {
      strengths.push('Izcila Latvijas Konstitūcijas zināšana')
    } else {
      strengths.push('Laba Latvijas Konstitūcijas zināšana')
    }
  }

  return strengths
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
 * Generate performance benchmarks
 */
function generateBenchmarks(
  anthem: AnthemResult,
  history: MultipleChoiceResult,
  constitution: MultipleChoiceResult
): PerformanceBenchmarks {
  // Simplified benchmarking - would use real statistical data in production
  const averageAnthem = 80
  const averageHistory = 75
  const averageConstitution = 70

  return {
    percentileRanking: 50, // Default to median
    comparedToAverage: {
      anthem: anthem.accuracy >= averageAnthem ? 'above' : 'below',
      history: history.percentage >= averageHistory ? 'above' : 'below',
      constitution:
        constitution.percentage >= averageConstitution ? 'above' : 'below',
      timing: 'average',
    },
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
  const sections = [
    {
      name: 'Himna',
      passed: results.anthem.passed,
      score: results.anthem.accuracy,
    },
    {
      name: 'Vēsture',
      passed: results.history.passed,
      score: results.history.percentage,
    },
    {
      name: 'Konstitūcija',
      passed: results.constitution.passed,
      score: results.constitution.percentage,
    },
  ]

  const passed = sections.filter((s) => s.passed).length

  return {
    passed,
    total: sections.length,
    sections,
  }
}
