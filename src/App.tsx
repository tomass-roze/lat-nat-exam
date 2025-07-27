import { useState, useRef } from 'react'
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
import { SCORING_THRESHOLDS } from '@/types/constants'

function App() {
  // Exam state
  const [anthemText, setAnthemText] = useState('')
  const [historyAnswers, setHistoryAnswers] = useState<
    Record<number, 0 | 1 | 2>
  >({})
  const [constitutionAnswers, setConstitutionAnswers] = useState<
    Record<number, 0 | 1 | 2>
  >({})

  // Refs for smooth scrolling
  const historyRef = useRef<HTMLDivElement>(null)
  const constitutionRef = useRef<HTMLDivElement>(null)

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

  // Check if ready for submission
  const isReadyForSubmission =
    anthemProgress >= SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE &&
    Object.keys(historyAnswers).length ===
      SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS &&
    Object.keys(constitutionAnswers).length ===
      SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS

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

      <main className="space-y-12 py-8">
        {/* Anthem Section */}
        <AnthemSection
          value={anthemText}
          onChange={setAnthemText}
          onNext={scrollToHistory}
        />

        {/* History Section */}
        <div ref={historyRef}>
          <HistorySection
            answers={historyAnswers}
            onChange={handleHistoryAnswer}
            onNext={scrollToConstitution}
          />
        </div>

        {/* Constitution Section */}
        <div ref={constitutionRef}>
          <ConstitutionSection
            answers={constitutionAnswers}
            onChange={handleConstitutionAnswer}
          />
        </div>

        {/* Submission Panel */}
        <SubmissionPanel
          anthemProgress={anthemProgress}
          historyAnswered={Object.keys(historyAnswers).length}
          constitutionAnswered={Object.keys(constitutionAnswers).length}
          isReadyForSubmission={isReadyForSubmission}
          onSubmit={handleSubmit}
        />
      </main>
    </MainLayout>
  )
}

export default App
