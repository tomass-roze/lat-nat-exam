import { ExamSection } from './ExamSection'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Info, CheckCircle } from 'lucide-react'
import { SCORING_THRESHOLDS } from '@/types/constants'

// Mock history questions - in real app, these would come from the questions data
const mockHistoryQuestions = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  question: `Vēstures jautājums Nr. ${i + 1}. Kurš no šiem notikumiem bija svarīgs Latvijas vēsturē?`,
  options: [
    `Pirmā atbilde jautājumam ${i + 1}`,
    `Otrā atbilde jautājumam ${i + 1}`,
    `Trešā atbilde jautājumam ${i + 1}`,
  ],
  correctAnswer: 0,
}))

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
          {mockHistoryQuestions.map((question, index) => (
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
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-100">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Apsveicam!</strong> Jūs esat atbildējuši uz visiem
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
      </div>
    </ExamSection>
  )
}
