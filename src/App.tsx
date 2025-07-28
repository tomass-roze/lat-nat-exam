import { useState, useRef, useEffect } from 'react'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ExamHeader } from '@/components/layout/ExamHeader'
import {
  ProgressIndicator,
  type SectionStatus,
} from '@/components/layout/ProgressIndicator'
import { AnthemSection } from '@/components/exam/AnthemSection'
import { HistorySection } from '@/components/exam/HistorySection'
import { ConstitutionSection } from '@/components/exam/ConstitutionSection'
import { SubmissionPanel } from '@/components/exam/SubmissionPanel'
import { ValidationProvider, useValidation } from '@/contexts/ValidationContext'
import { SCORING_THRESHOLDS } from '@/types/constants'
import type { TestState } from '@/types/exam'
import type { SelectedQuestions } from '@/types/questions'
import { loadExamQuestions, QuestionLoadingError } from '@/utils/questionLoader'

function ExamContent() {
  // Exam state
  const [anthemText, setAnthemText] = useState('')
  const [historyAnswers, setHistoryAnswers] = useState<
    Record<number, 0 | 1 | 2>
  >({})
  const [constitutionAnswers, setConstitutionAnswers] = useState<
    Record<number, 0 | 1 | 2>
  >({})

  // Question loading state
  const [selectedQuestions, setSelectedQuestions] =
    useState<SelectedQuestions | null>(null)
  const [questionLoadingError, setQuestionLoadingError] = useState<
    string | null
  >(null)

  // Refs for smooth scrolling
  const historyRef = useRef<HTMLDivElement>(null)
  const constitutionRef = useRef<HTMLDivElement>(null)

  // Validation context
  const { validateAll } = useValidation()

  // Keyboard navigation
  useKeyboardNavigation({
    enableSectionNavigation: true,
    enableGlobalShortcuts: true,
  })

  // Load questions on component mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionLoadingError(null)
        const questions = loadExamQuestions()
        setSelectedQuestions(questions)
      } catch (error) {
        if (error instanceof QuestionLoadingError) {
          setQuestionLoadingError(error.message)
        } else {
          setQuestionLoadingError('Nezināma kļūda ielādējot jautājumus')
        }
        console.error('Question loading failed:', error)
      }
    }

    loadQuestions()
  }, [])

  // Create test state for validation
  const testState: TestState = {
    anthemText,
    historyAnswers,
    constitutionAnswers,
    startTime: Date.now(), // In a real app, this would be set when exam starts
    lastSaved: Date.now(),
    isCompleted: false,
    currentSection: 'anthem', // This would be dynamic in a real app
    selectedQuestions: selectedQuestions || {
      history: [],
      constitution: [],
      selectionMetadata: {
        randomSeed: Date.now(),
        selectedAt: Date.now(),
        selectedIds: {
          history: [],
          constitution: [],
        },
      },
    },
    metadata: {
      sessionId: 'demo-session',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      attemptNumber: 1,
      darkMode: false,
    },
  }

  // Trigger validation when test state changes
  useEffect(() => {
    validateAll(testState, 'onChange')
  }, [anthemText, historyAnswers, constitutionAnswers, validateAll])

  // Calculate progress
  const getAnthemProgress = () => {
    const minLength = SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS
    return Math.min((anthemText.length / minLength) * 100, 100)
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

  // Section statuses
  const sections: SectionStatus[] = [
    {
      id: 'anthem',
      title: 'Valsts himna',
      progress: anthemProgress,
      isCompleted: anthemProgress >= SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE,
      isActive:
        anthemProgress > 0 &&
        anthemProgress < SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE,
      itemsCompleted: anthemText.length,
      totalItems: SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS,
    },
    {
      id: 'history',
      title: 'Vēstures jautājumi',
      progress: historyProgress,
      isCompleted:
        Object.keys(historyAnswers).length ===
        SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS,
      isActive:
        Object.keys(historyAnswers).length > 0 &&
        Object.keys(historyAnswers).length <
          SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS,
      itemsCompleted: Object.keys(historyAnswers).length,
      totalItems: SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS,
    },
    {
      id: 'constitution',
      title: 'Konstitūcijas jautājumi',
      progress: constitutionProgress,
      isCompleted:
        Object.keys(constitutionAnswers).length ===
        SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS,
      isActive:
        Object.keys(constitutionAnswers).length > 0 &&
        Object.keys(constitutionAnswers).length <
          SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS,
      itemsCompleted: Object.keys(constitutionAnswers).length,
      totalItems: SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS,
    },
  ]

  // Legacy submission check (now handled by validation context)
  // const isReadyForSubmission = ...

  // Event handlers
  const handleHistoryAnswer = (questionId: number, answer: 0 | 1 | 2) => {
    setHistoryAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleConstitutionAnswer = (questionId: number, answer: 0 | 1 | 2) => {
    setConstitutionAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToConstitution = () => {
    constitutionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = () => {
    // In a real app, this would submit to a backend
    alert('Eksāmens iesniegts! (Šī ir demo versija)')
  }

  return (
    <MainLayout>
      <ExamHeader>
        <ProgressIndicator
          sections={sections}
          overallProgress={overallProgress}
          className="mt-4"
        />
      </ExamHeader>

      <div className="space-y-12 py-8">
        {/* Anthem Section */}
        <section id="anthem-section" aria-labelledby="anthem-title">
          <AnthemSection
            value={anthemText}
            onChange={setAnthemText}
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
    </MainLayout>
  )
}

function App() {
  return (
    <ValidationProvider>
      <ExamContent />
    </ValidationProvider>
  )
}

export default App
