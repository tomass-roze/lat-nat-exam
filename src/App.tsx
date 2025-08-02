import { useState, useRef, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
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
import { SubmissionLoadingScreen } from '@/components/exam/SubmissionLoadingScreen'

// Lazy load heavy components that are not immediately needed
const ExamResults = lazy(() => import('@/components/exam/ExamResults'))
const LandingPage = lazy(() => import('@/pages/LandingPage'))
import { ValidationProvider, useValidation } from '@/contexts/ValidationContext'
import {
  SessionProvider,
  useSession,
  useSessionStatus,
} from '@/contexts/SessionContext'
import { SessionRecoveryDialog } from '@/components/session/SessionRecoveryDialog'
import {
  ErrorBoundary,
  SectionErrorBoundary,
  useErrorHandler,
} from '@/components/ui/ErrorBoundary'
import { NetworkWarningBanner } from '@/components/ui/NetworkStatusIndicator'
import { CompatibilityWarning } from '@/components/ui/CompatibilityWarning'
import {
  initializeBrowserCompatibility,
  isBrowserCompatible,
} from '@/utils/browserCompatibility'
import { SCORING_THRESHOLDS } from '@/types/constants'
import type { ExamSection } from '@/types/constants'
import type { TestState } from '@/types/exam'
import type { TestResults } from '@/types/scoring'
import { loadExamQuestions, QuestionLoadingError } from '@/utils/questionLoader'
import { calculateTestResults } from '@/utils/scoring'
import { logRuntimeError } from '@/utils/errorLogger'
// compareAnthemText import removed - only used during final results calculation

function ExamContent() {
  // Error handling
  useErrorHandler('ExamContent')

  // Router hooks
  const location = useLocation()
  const navigate = useNavigate()

  // Get section selection from navigation state
  const { selectedSections = ['anthem', 'history', 'constitution'], isPartialTest = false } = location.state || {}

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

  // Browser compatibility state
  const [isCompatibleBrowser, setIsCompatibleBrowser] = useState<
    boolean | null
  >(null)

  // App initialization state
  const [isAppFullyInitialized, setIsAppFullyInitialized] = useState(false)

  // Results state
  const [examResults, setExamResults] = useState<TestResults | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [isCalculatingResults, setIsCalculatingResults] = useState(false)

  // Refs for smooth scrolling
  const historyRef = useRef<HTMLDivElement>(null)
  const constitutionRef = useRef<HTMLDivElement>(null)

  // Keyboard navigation
  useKeyboardNavigation({
    enableSectionNavigation: true,
    enableGlobalShortcuts: true,
  })

  // Initialize browser compatibility check
  useEffect(() => {
    try {
      // Initialize browser compatibility detection
      initializeBrowserCompatibility()

      // Check if browser is compatible
      const compatible = isBrowserCompatible()
      setIsCompatibleBrowser(compatible)

      // Log compatibility result
      if (!compatible) {
        console.warn('Browser compatibility issues detected')
      } else {
        console.log('Browser compatibility check passed')
      }
    } catch (error) {
      console.error('Browser compatibility check failed:', error)
      // Assume compatible if check fails to avoid blocking users
      setIsCompatibleBrowser(true)
    }
  }, [])

  // Initialize session or load existing one
  useEffect(() => {
    const initializeOrLoadSession = async () => {
      try {
        // Try to load existing session first
        const sessionLoaded = await loadSession()

        if (!sessionLoaded) {
          // Load questions for new session
          const questions = loadExamQuestions()

          // Create initial test state with enabled sections
          const enabledSections = {
            anthem: selectedSections.includes('anthem'),
            history: selectedSections.includes('history'),
            constitution: selectedSections.includes('constitution'),
          }

          const initialTestState: TestState = {
            anthemText: '',
            historyAnswers: {},
            constitutionAnswers: {},
            startTime: Date.now(),
            lastSaved: 0,
            isCompleted: false,
            currentSection: selectedSections[0] as ExamSection || 'anthem',
            selectedQuestions: questions,
            enabledSections,
            selectedSectionIds: selectedSections,
            testConfiguration: {
              totalSections: selectedSections.length,
              sectionNames: selectedSections,
              isPartialTest: isPartialTest,
            },
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

    // Only initialize session if browser compatibility check is complete
    if (!isInitialized && isCompatibleBrowser !== null) {
      initializeOrLoadSession()
    }
  }, [isInitialized, isCompatibleBrowser, loadSession, initializeSession])

  // Mark app as fully initialized once session and compatibility are ready
  useEffect(() => {
    if (
      isInitialized &&
      isCompatibleBrowser !== null &&
      !questionLoadingError &&
      !isAppFullyInitialized
    ) {
      // Add a small delay to ensure all components have mounted
      const timer = setTimeout(() => {
        setIsAppFullyInitialized(true)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [
    isInitialized,
    isCompatibleBrowser,
    questionLoadingError,
    isAppFullyInitialized,
  ])

  // Show recovery dialog when there are errors
  useEffect(() => {
    if (lastError && recovery && !showRecoveryDialog) {
      setShowRecoveryDialog(true)
    }
  }, [lastError, recovery, showRecoveryDialog])

  // Trigger validation when test state changes - DISABLED for blind test approach
  // Real-time validation removed to maintain blind test principles
  // Validation will only happen at submission time
  // useEffect(() => {
  //   if (isInitialized && !questionLoadingError) {
  //     validateAll(sessionState.testState, 'onChange')
  //   }
  // }, [sessionState.testState, validateAll, isInitialized, questionLoadingError])

  // Get current data from session state
  const { testState, selectedQuestions } = sessionState
  const { anthemText, historyAnswers, constitutionAnswers } = testState

  // Calculate progress - simplified line-based approach
  const getAnthemProgress = () => {
    if (!anthemText || anthemText.trim().length === 0) {
      return 0
    }

    // Count completed lines (lines with at least one letter)
    // Filter out empty lines to handle the extra newline after 4th line
    const lines = anthemText.split('\n').filter((line) => line.trim() !== '')
    const completedLines = lines.filter((line) =>
      /[a-zA-ZāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/.test(line)
    ).length

    return (completedLines / 8) * 100
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

  // Helper function to check if anthem meets validation requirements - simplified line-based
  const isAnthemValid = () => {
    if (!anthemText || anthemText.trim().length === 0) return false

    // Check if all 8 lines have content (at least one letter each)
    // Filter out empty lines to handle the extra newline after 4th line
    const lines = anthemText.split('\n').filter((line) => line.trim() !== '')
    const completedLines = lines.filter((line) =>
      /[a-zA-ZāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/.test(line)
    ).length

    return completedLines === 8
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
      itemsCompleted: anthemText
        ? anthemText
            .split('\n')
            .filter((line) => line.trim() !== '')
            .filter((line) => /[a-zA-ZāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/.test(line))
            .length
        : 0,
      totalItems: 8,
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
    setIsCalculatingResults(true)
    try {
      // Minimum loading time for better UX (prevent flash)
      const startTime = Date.now()
      const minLoadingTime = 200

      // Validate at submission time only
      try {
        validateAll(sessionState.testState, 'onSubmit')
      } catch (validationError) {
        console.error('Validation failed:', validationError)
        alert(
          'Eksāmens nav gatavs iesniegšanai. Lūdzu, pārbaudiet visas sekcijas un novērsiet kļūdas.'
        )
        return
      }

      // Calculate exam results (this includes accuracy validation for anthem)
      let results
      try {
        results = calculateTestResults(testState, selectedQuestions)
        setExamResults(results)
      } catch (calculationError) {
        console.error('Results calculation failed:', calculationError)
        alert(
          'Neizdevās aprēķināt eksāmena rezultātus. Lūdzu, mēģinājiet vēlreiz vai sazinieties ar atbalstu.'
        )
        return
      }

      // Mark as completed and save session
      try {
        updateTestState({ isCompleted: true })
        await saveSession()
      } catch (saveError) {
        console.error('Session save failed:', saveError)
        // Still show results even if save fails, but warn user
        console.warn(
          'Results calculated but session save failed. Results will still be displayed.'
        )
      }

      // Ensure minimum loading time for smooth UX
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < minLoadingTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minLoadingTime - elapsedTime)
        )
      }

      setShowResults(true)
    } catch (error) {
      console.error('Unexpected error during submission:', error)
      alert(
        'Radās neparedzēta kļūda. Lūdzu, mēģinājiet vēlreiz vai pārlādējiet lapu.'
      )
    } finally {
      setIsCalculatingResults(false)
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

  // Show loading state while compatibility check or session is initializing
  if (isCompatibleBrowser === null || (!isInitialized && isCompatibleBrowser)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>
              {isCompatibleBrowser === null
                ? 'Pārbauda pārlūkprogrammas saderību...'
                : 'Ielādē eksāmena sesiju...'}
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Show incompatible browser message
  if (isCompatibleBrowser === false) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h1 className="text-xl font-semibold text-red-800 mb-4">
                Pārlūkprogramma nav atbalstīta
              </h1>
              <p className="text-red-700 mb-4">
                Jūsu pārlūkprogramma nav pilnībā saderīga ar šo eksāmena
                aplikāciju. Lai nodrošinātu labāko pieredzi un izvairītos no
                tehniskām problēmām, lūdzu, izmantojiet vienu no šīm
                pārlūkprogrammām:
              </p>
              <ul className="text-left text-red-700 mb-6 space-y-1">
                <li>• Google Chrome 88 vai jaunāka versija</li>
                <li>• Mozilla Firefox 85 vai jaunāka versija</li>
                <li>• Safari 14 vai jaunāka versija</li>
                <li>• Microsoft Edge 88 vai jaunāka versija</li>
              </ul>
              <div className="space-y-3">
                <button
                  onClick={() => setIsCompatibleBrowser(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg mr-3"
                >
                  Turpināt tik un tā (nav ieteicams)
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Pārlādēt lapu
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Show results view if exam is completed
  if (showResults && examResults) {
    return (
      <MainLayout>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Ielādē rezultātus...</p>
              </div>
            </div>
          }
        >
          <ExamResults results={examResults} onRetakeExam={handleRetakeExam} />
        </Suspense>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <ExamHeader>
        {/* Back to Selection Button */}
        <div className="flex items-center justify-between w-full mb-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Atpakaļ uz sadaļu izvēli
          </button>
          {isPartialTest && (
            <span className="text-sm text-muted-foreground">
              Daļējs eksāmens ({selectedSections.length} no 3)
            </span>
          )}
        </div>
        <ProgressIndicator sections={sections} className="w-full" />
      </ExamHeader>

      <SessionRecoveryDialog
        open={showRecoveryDialog}
        error={lastError}
        recovery={recovery}
        onRecover={handleSessionRecover}
        onDismiss={handleRecoveryDialogDismiss}
      />

      {/* Network Status Warning */}
      <NetworkWarningBanner isAppInitialized={isAppFullyInitialized} />

      {/* Browser Compatibility Warning */}
      <CompatibilityWarning autoShow={true} />

      <div className="space-y-8 sm:space-y-12 py-4 sm:py-8 mobile-bottom-safe">
        {/* Conditionally render sections based on enabledSections */}
        {testState.enabledSections.anthem && (
          <section id="anthem-section" aria-labelledby="anthem-title">
            <SectionErrorBoundary
              sectionName="Himna"
              isCritical={true}
              isInitializing={!isAppFullyInitialized}
            >
              <AnthemSection
                value={anthemText}
                onChange={handleAnthemChange}
                onNext={scrollToHistory}
              />
            </SectionErrorBoundary>
          </section>
        )}

        {testState.enabledSections.history && (
          <section
            id="history-section"
            aria-labelledby="history-title"
            ref={historyRef}
          >
            <SectionErrorBoundary
              sectionName="Vēsture"
              isCritical={true}
              isInitializing={!isAppFullyInitialized}
            >
              <HistorySection
                answers={historyAnswers}
                onChange={handleHistoryAnswer}
                onNext={scrollToConstitution}
                questions={selectedQuestions?.history || []}
              />
            </SectionErrorBoundary>
          </section>
        )}

        {testState.enabledSections.constitution && (
          <section
            id="constitution-section"
            aria-labelledby="constitution-title"
            ref={constitutionRef}
          >
            <SectionErrorBoundary
              sectionName="Konstitūcija"
              isCritical={true}
              isInitializing={!isAppFullyInitialized}
            >
              <ConstitutionSection
                answers={constitutionAnswers}
                onChange={handleConstitutionAnswer}
                questions={selectedQuestions?.constitution || []}
                error={questionLoadingError || undefined}
              />
            </SectionErrorBoundary>
          </section>
        )}

        {/* Submission Panel */}
        <section id="submission-section" aria-labelledby="submission-title">
          <SectionErrorBoundary
            sectionName="Iesniegšana"
            isCritical={true}
            isInitializing={!isAppFullyInitialized}
          >
            <SubmissionPanel
              anthemProgress={anthemProgress}
              historyAnswered={Object.keys(historyAnswers).length}
              constitutionAnswered={Object.keys(constitutionAnswers).length}
              testState={testState}
              onSubmit={handleSubmit}
            />
          </SectionErrorBoundary>
        </section>
      </div>

      {/* Bottom Progress Bar */}
      <BottomProgressBar
        sections={sections}
        overallProgress={overallProgress}
      />

      {/* Submission Loading Screen */}
      <SubmissionLoadingScreen isVisible={isCalculatingResults} />
    </MainLayout>
  )
}

function App() {
  return (
    <ErrorBoundary
      componentName="App"
      isCritical={true}
      enableAutoRecovery={false}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <SessionProvider
        autoSaveInterval={30000} // 30 seconds
        onSessionExpiry={() => {
          console.log('Session expired')
          alert('Jūsu eksāmena sesija ir beigusies. Lūdzu, sāciet no jauna.')
        }}
        onStorageError={(error) => {
          console.error('Storage error:', error)
          logRuntimeError(
            new Error(`Storage error: ${error.message}`),
            'SessionProvider',
            'App'
          )
        }}
      >
        <ErrorBoundary
          componentName="ValidationProvider"
          isCritical={false}
          enableAutoRecovery={true}
        >
          <ValidationProvider>
            <Routes>
              <Route path="/" element={
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Ielādē sadaļu izvēli...</p>
                    </div>
                  </div>
                }>
                  <LandingPage />
                </Suspense>
              } />
              <Route path="/test" element={
                <ErrorBoundary
                  componentName="ExamContent"
                  isCritical={true}
                  enableAutoRecovery={false}
                >
                  <ExamContent />
                </ErrorBoundary>
              } />
              <Route path="/results" element={
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Ielādē rezultātus...</p>
                    </div>
                  </div>
                }>
                  <ExamResults results={undefined} onRetakeExam={() => {}} />
                </Suspense>
              } />
            </Routes>
          </ValidationProvider>
        </ErrorBoundary>
      </SessionProvider>
    </ErrorBoundary>
  )
}

export default App
