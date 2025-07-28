import { useState, useEffect } from 'react'
import { ExamSection } from './ExamSection'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { SCORING_THRESHOLDS } from '@/types/constants'
import {
  loadHistoryQuestions,
  QuestionLoadingError,
} from '@/utils/questionLoader'
import type { Question } from '@/types/questions'

interface HistorySectionProps {
  answers: Record<number, 0 | 1 | 2>
  onChange: (questionId: number, answer: 0 | 1 | 2) => void
  onNext?: () => void
}

export function HistorySection({
  answers,
  onChange,
  onNext,
}: HistorySectionProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load history questions on component mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)

        // Load questions with a consistent seed for this session
        // Use a seed based on current date to ensure same questions during the day
        const today = new Date().toDateString()
        const sessionSeed = today
          .split('')
          .reduce((acc, char) => acc + char.charCodeAt(0), 0)

        const result = loadHistoryQuestions(sessionSeed)
        setQuestions(result.questions)
      } catch (error) {
        console.error('Failed to load history questions:', error)
        if (error instanceof QuestionLoadingError) {
          setLoadError(error.message)
        } else {
          setLoadError(
            'Radās kļūda, ielādējot vēstures jautājumus. Lūdzu, atjaunojiet lapu.'
          )
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [])
  const getProgress = () => {
    const answered = Object.keys(answers).length
    const total = SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS
    const percentage = (answered / total) * 100

    return {
      current: answered,
      total,
      percentage,
    }
  }

  const progress = getProgress()
  const isCompleted =
    progress.current === SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS

  const status = isCompleted
    ? 'completed'
    : progress.current > 0
      ? 'in-progress'
      : 'pending'

  // Show loading state
  if (isLoading) {
    return (
      <ExamSection
        id="history"
        title="Vēstures jautājumi"
        description="Ielādē jautājumus..."
        status="pending"
        progress={{ current: 0, total: 10, percentage: 0 }}
      >
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            Ielādē vēstures jautājumus...
          </span>
        </div>
      </ExamSection>
    )
  }

  // Show error state
  if (loadError) {
    return (
      <ExamSection
        id="history"
        title="Vēstures jautājumi"
        description="Radās kļūda, ielādējot jautājumus"
        status="pending"
        progress={{ current: 0, total: 10, percentage: 0 }}
      >
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Kļūda:</strong> {loadError}
          </AlertDescription>
        </Alert>
      </ExamSection>
    )
  }

  return (
    <ExamSection
      id="history"
      title="Vēstures jautājumi"
      description={`Atbildiet uz ${SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS} jautājumiem par Latvijas vēsturi. Nepieciešams pareizi atbildēt uz vismaz ${SCORING_THRESHOLDS.HISTORY_PASS_COUNT} jautājumiem.`}
      status={status}
      progress={progress}
    >
      <div className="space-y-6">
        <Alert role="region" aria-labelledby="history-instructions-title">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span id="history-instructions-title" className="sr-only">
              Vēstures jautājumu instrukcijas
            </span>
            Izlasiet katru jautājumu uzmanīgi un izvēlieties pareizo atbildi.
            Jums ir jāatbild uz visiem{' '}
            {SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS} jautājumiem, lai
            nokārtotu eksāmenu.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className="transition-all duration-200 hover:shadow-sm"
            >
              <CardContent className="p-6">
                <fieldset className="space-y-4">
                  <legend className="font-medium text-lg">
                    {index + 1}. {question.question}
                  </legend>

                  <RadioGroup
                    value={answers[question.id]?.toString()}
                    onValueChange={(value) =>
                      onChange(question.id, parseInt(value) as 0 | 1 | 2)
                    }
                    className="space-y-3"
                    aria-describedby={`q${question.id}-description`}
                    aria-required="true"
                  >
                    <div id={`q${question.id}-description`} className="sr-only">
                      Izvēlieties vienu atbildi no piedāvātajām opcijām
                    </div>
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center space-x-3"
                      >
                        <RadioGroupItem
                          value={optionIndex.toString()}
                          id={`q${question.id}-${optionIndex}`}
                          className="mt-0.5"
                          aria-describedby={`q${question.id}-${optionIndex}-label`}
                        />
                        <Label
                          id={`q${question.id}-${optionIndex}-label`}
                          htmlFor={`q${question.id}-${optionIndex}`}
                          className="text-sm leading-relaxed cursor-pointer flex-1"
                        >
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </fieldset>
              </CardContent>
            </Card>
          ))}
        </div>

        {isCompleted && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-100">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Sekcija pabeigta!</strong> Jūs esat atbildējuši uz visiem
              vēstures jautājumiem. Varat pāriet uz nākamo sekciju.
            </AlertDescription>
          </Alert>
        )}

        {isCompleted && onNext && (
          <div className="flex justify-end">
            <Button onClick={onNext}>
              Turpināt uz konstitūcijas jautājumiem
            </Button>
          </div>
        )}

        {/* Progress summary for better user feedback */}
        {progress.current > 0 && !isCompleted && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Progress: {progress.current} no {progress.total} jautājumiem
              atbildēti
            </AlertDescription>
          </Alert>
        )}
      </div>
    </ExamSection>
  )
}
