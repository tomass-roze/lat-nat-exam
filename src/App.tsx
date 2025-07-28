import { useState, useRef, useEffect } from 'react'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ExamHeader } from '@/components/layout/ExamHeader'
import {
  ProgressIndicator,
  type SectionStatus,
} from '@/components/layout/ProgressIndicator'
import { BottomProgressBar } from '@/components/layout/BottomProgressBar'
import { AnthemSection } from '@/components/exam/AnthemSection'
import { HistorySection } from '@/components/exam/HistorySection'
import { ConstitutionSection } from '@/components/exam/ConstitutionSection'
import { SubmissionPanel } from '@/components/exam/SubmissionPanel'
import { ExamResults } from '@/components/exam/ExamResults'
import { ValidationProvider, useValidation } from '@/contexts/ValidationContext'
import {
  SessionProvider,
  useSession,
  useSessionStatus,
} from '@/contexts/SessionContext'
import { SessionRecoveryDialog } from '@/components/session/SessionRecoveryDialog'
import { SCORING_THRESHOLDS } from '@/types/constants'
import type { TestState } from '@/types/exam'
import type { TestResults } from '@/types/scoring'
import { loadExamQuestions, QuestionLoadingError } from '@/utils/questionLoader'
import { calculateTestResults } from '@/utils/scoring'
import { compareAnthemText } from '@/utils/textProcessing'

function ExamContent() {
  // Session and validation contexts
  const {
    state: sessionState,
    initializeSession,
    loadSession,
    updateTestState,
    saveSession,
    clearSession,
    recoverSession,
  } = useSession()

  const { isInitialized, lastError, recovery } = useSessionStatus()

  const { validateAll } = useValidation()

  // Question loading state
  const [questionLoadingError, setQuestionLoadingError] = useState<
    string | null
  >(null)
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)

  // Results state
  const [examResults, setExamResults] = useState<TestResults | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Refs for smooth scrolling
  const historyRef = useRef<HTMLDivElement>(null)
  const constitutionRef = useRef<HTMLDivElement>(null)

  // Keyboard navigation
  useKeyboardNavigation({
    enableSectionNavigation: true,
    enableGlobalShortcuts: true,
  })

  // Initialize session or load existing one
  useEffect(() => {
    const initializeOrLoadSession = async () => {
      try {
        // Try to load existing session first
        const sessionLoaded = await loadSession()

        if (!sessionLoaded) {
          // Load questions for new session
          const questions = loadExamQuestions()

          // Create initial test state
          const initialTestState: TestState = {
            anthemText: '',
            historyAnswers: {},
            constitutionAnswers: {},
            startTime: Date.now(),
            lastSaved: 0,
            isCompleted: false,
            currentSection: 'anthem',
            selectedQuestions: questions,
            metadata: {
              sessionId: `session-${Date.now()}`,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              attemptNumber: 1,
              darkMode: false,
            },
          }

          // Initialize new session
          initializeSession(initialTestState, questions)
        }
      } catch (error) {
        if (error instanceof QuestionLoadingError) {
          setQuestionLoadingError(error.message)
        } else {
          setQuestionLoadingError('Nezināma kļūda ielādējot jautājumus')
        }
        console.error('Session initialization failed:', error)
      }
    }

    if (!isInitialized) {
      initializeOrLoadSession()
    }
  }, [isInitialized, loadSession, initializeSession])

  // Show recovery dialog when there are errors
  useEffect(() => {
    if (lastError && recovery && !showRecoveryDialog) {
      setShowRecoveryDialog(true)
    }
  }, [lastError, recovery, showRecoveryDialog])

  // Trigger validation when test state changes
  useEffect(() => {
    if (isInitialized && !questionLoadingError) {
      validateAll(sessionState.testState, 'onChange')
    }
  }, [sessionState.testState, validateAll, isInitialized, questionLoadingError])

  // Get current data from session state
  const { testState, selectedQuestions } = sessionState
  const { anthemText, historyAnswers, constitutionAnswers } = testState

  // Calculate progress
  const getAnthemProgress = () => {
    // Return 0 if no text entered
    if (!anthemText || anthemText.trim().length === 0) {
      return 0
    }

    // Check minimum length first
    const minLength = SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS
    if (anthemText.length < minLength) {
      // Show character progress up to minimum requirement
      return Math.min((anthemText.length / minLength) * 50, 50)
    }

    // For text meeting minimum length, check actual accuracy
    try {
      const anthemResult = compareAnthemText(anthemText)
      const passThreshold = SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE

      // Progress starts at 50% once minimum length is met, then accuracy determines final percentage
      const accuracyProgress = (anthemResult.accuracy / passThreshold) * 50
      return Math.min(50 + accuracyProgress, 100)
    } catch (error) {
      console.error('Error calculating anthem accuracy:', error)
      // Fall back to character-based progress if accuracy calculation fails
      return Math.min((anthemText.length / minLength) * 100, 100)
    }
  }

  const getHistoryProgress = () => {
    const answered = Object.keys(historyAnswers).length
    return (answered / SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS) * 100
  }

  const getConstitutionProgress = () => {
    const answered = Object.keys(constitutionAnswers).length
    return (answered / SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS) * 100
  }

  const anthemProgress = getAnthemProgress()
  const historyProgress = getHistoryProgress()
  const constitutionProgress = getConstitutionProgress()
  const overallProgress =
    (anthemProgress + historyProgress + constitutionProgress) / 3

  // Helper function to check if anthem meets validation requirements
  const isAnthemValid = () => {
    if (!anthemText || anthemText.trim().length === 0) return false
    if (anthemText.length < SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS)
      return false

    try {
      const anthemResult = compareAnthemText(anthemText)
      return anthemResult.accuracy >= SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE
    } catch {
      return false
    }
  }

  // Helper function to check if history answers are valid
  const isHistoryValid = () => {
    const answerCount = Object.keys(historyAnswers).length
    if (answerCount !== SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS) return false

    // Check that all answers are valid (0, 1, or 2)
    return Object.values(historyAnswers).every((answer) =>
      [0, 1, 2].includes(answer)
    )
  }

  // Helper function to check if constitution answers are valid
  const isConstitutionValid = () => {
    const answerCount = Object.keys(constitutionAnswers).length
    if (answerCount !== SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS)
      return false

    // Check that all answers are valid (0, 1, or 2)
    return Object.values(constitutionAnswers).every((answer) =>
      [0, 1, 2].includes(answer)
    )
  }

  // Section statuses based on actual validation
  const sections: SectionStatus[] = [
    {
      id: 'anthem',
      title: 'Valsts himna',
      progress: anthemProgress,
      isCompleted: isAnthemValid(),
      isActive: anthemProgress > 0 && !isAnthemValid(),
      itemsCompleted: anthemText.length,
      totalItems: SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS,
    },
    {
      id: 'history',
      title: 'Vēstures jautājumi',
      progress: historyProgress,
      isCompleted: isHistoryValid(),
      isActive: Object.keys(historyAnswers).length > 0 && !isHistoryValid(),
      itemsCompleted: Object.keys(historyAnswers).length,
      totalItems: SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS,
    },
    {
      id: 'constitution',
      title: 'Konstitūcijas jautājumi',
      progress: constitutionProgress,
      isCompleted: isConstitutionValid(),
      isActive:
        Object.keys(constitutionAnswers).length > 0 && !isConstitutionValid(),
      itemsCompleted: Object.keys(constitutionAnswers).length,
      totalItems: SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS,
    },
  ]

  // Event handlers with session updates
  const handleAnthemChange = (text: string) => {
    updateTestState({ anthemText: text })
  }

  const handleHistoryAnswer = (questionId: number, answer: 0 | 1 | 2) => {
    const newAnswers = { ...historyAnswers, [questionId]: answer }
    updateTestState({ historyAnswers: newAnswers })
  }

  const handleConstitutionAnswer = (questionId: number, answer: 0 | 1 | 2) => {
    const newAnswers = { ...constitutionAnswers, [questionId]: answer }
    updateTestState({ constitutionAnswers: newAnswers })
  }

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToConstitution = () => {
    constitutionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    try {
      // Calculate exam results
      const results = calculateTestResults(testState, selectedQuestions)
      setExamResults(results)

      // Mark as completed and show results
      updateTestState({ isCompleted: true })
      await saveSession()
      setShowResults(true)
    } catch (error) {
      console.error('Error calculating results:', error)
      alert('Kļūda aprēķinot rezultātus. Lūdzu, mēģinājiet vēlreiz.')
    }
  }

  const handleRecoveryDialogDismiss = () => {
    setShowRecoveryDialog(false)
  }

  const handleSessionRecover = (optionId: string) => {
    recoverSession(optionId)
    setShowRecoveryDialog(false)
  }

  const handleRetakeExam = () => {
    // Reset all state
    setExamResults(null)
    setShowResults(false)
    setQuestionLoadingError(null)
    clearSession()

    // The useEffect will automatically reinitialize a new session
  }

  // Show loading state while session is initializing
  if (!isInitialized) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Ielādē eksāmena sesiju...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Show results view if exam is completed
  if (showResults && examResults) {
    return (
      <MainLayout>
        <ExamResults results={examResults} onRetakeExam={handleRetakeExam} />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <ExamHeader>
        <ProgressIndicator sections={sections} className="w-full" />
      </ExamHeader>

      <SessionRecoveryDialog
        open={showRecoveryDialog}
        error={lastError}
        recovery={recovery}
        onRecover={handleSessionRecover}
        onDismiss={handleRecoveryDialogDismiss}
      />

      <div className="space-y-12 py-8 pb-32">
        {/* Anthem Section */}
        <section id="anthem-section" aria-labelledby="anthem-title">
          <AnthemSection
            value={anthemText}
            onChange={handleAnthemChange}
            onNext={scrollToHistory}
          />
        </section>

        {/* History Section */}
        <section
          id="history-section"
          aria-labelledby="history-title"
          ref={historyRef}
        >
          <HistorySection
            answers={historyAnswers}
            onChange={handleHistoryAnswer}
            onNext={scrollToConstitution}
          />
        </section>

        {/* Constitution Section */}
        <section
          id="constitution-section"
          aria-labelledby="constitution-title"
          ref={constitutionRef}
        >
          <ConstitutionSection
            answers={constitutionAnswers}
            onChange={handleConstitutionAnswer}
            questions={selectedQuestions?.constitution || []}
            error={questionLoadingError || undefined}
          />
        </section>

        {/* Submission Panel */}
        <section id="submission-section" aria-labelledby="submission-title">
          <SubmissionPanel
            anthemProgress={anthemProgress}
            historyAnswered={Object.keys(historyAnswers).length}
            constitutionAnswered={Object.keys(constitutionAnswers).length}
            testState={testState}
            onSubmit={handleSubmit}
          />
        </section>
      </div>

      {/* Bottom Progress Bar */}
      <BottomProgressBar
        sections={sections}
        overallProgress={overallProgress}
      />
    </MainLayout>
  )
}

function App() {
  return (
    <SessionProvider
      autoSaveInterval={30000} // 30 seconds
      onSessionExpiry={() => {
        console.log('Session expired')
        alert('Jūsu eksāmena sesija ir beigusies. Lūdzu, sāciet no jauna.')
      }}
      onStorageError={(error) => {
        console.error('Storage error:', error)
        // Could show a toast notification here
      }}
    >
      <ValidationProvider>
        <ExamContent />
      </ValidationProvider>
    </SessionProvider>
  )
}

export default App
