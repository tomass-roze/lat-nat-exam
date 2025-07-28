import { ExamSection } from './ExamSection'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Info, CheckCircle } from 'lucide-react'
import { SCORING_THRESHOLDS } from '@/types/constants'

// Mock constitution questions - in real app, these would come from the questions data
const mockConstitutionQuestions = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  question: `Konstitūcijas jautājums Nr. ${i + 1}. Kurš no šiem apgalvojumiem ir pareizs par Latvijas Satversmi?`,
  options: [
    `Pirmā atbilde par Satversmi ${i + 1}`,
    `Otrā atbilde par Satversmi ${i + 1}`,
    `Trešā atbilde par Satversmi ${i + 1}`,
  ],
  correctAnswer: 0,
}))

interface ConstitutionSectionProps {
  answers: Record<number, 0 | 1 | 2>
  onChange: (questionId: number, answer: 0 | 1 | 2) => void
  onComplete?: () => void
}

export function ConstitutionSection({
  answers,
  onChange,
  onComplete,
}: ConstitutionSectionProps) {
  const getProgress = () => {
    const answered = Object.keys(answers).length
    const total = SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS
    const percentage = (answered / total) * 100

    return {
      current: answered,
      total,
      percentage,
    }
  }

  const progress = getProgress()
  const isCompleted =
    progress.current === SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS
  const status = isCompleted
    ? 'completed'
    : progress.current > 0
      ? 'in-progress'
      : 'pending'

  return (
    <ExamSection
      id="constitution"
      title="Konstitūcijas jautājumi"
      description={`Atbildiet uz ${SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS} jautājumiem par Latvijas Satversmi. Nepieciešams pareizi atbildēt uz vismaz ${SCORING_THRESHOLDS.CONSTITUTION_PASS_COUNT} jautājumiem.`}
      status={status}
      progress={progress}
    >
      <div className="space-y-6">
        <Alert role="region" aria-labelledby="constitution-instructions-title">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span id="constitution-instructions-title" className="sr-only">
              Konstitūcijas jautājumu instrukcijas
            </span>
            Izlasiet katru jautājumu uzmanīgi un izvēlieties pareizo atbildi.
            Jums ir jāatbild uz visiem{' '}
            {SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS} jautājumiem, lai
            pabeigtu eksāmenu.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {mockConstitutionQuestions.map((question, index) => (
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
                    aria-describedby={`const-q${question.id}-description`}
                    aria-required="true"
                  >
                    <div
                      id={`const-q${question.id}-description`}
                      className="sr-only"
                    >
                      Izvēlieties vienu atbildi no piedāvātajām opcijām
                    </div>
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center space-x-3"
                      >
                        <RadioGroupItem
                          value={optionIndex.toString()}
                          id={`const-q${question.id}-${optionIndex}`}
                          className="mt-0.5"
                          aria-describedby={`const-q${question.id}-${optionIndex}-label`}
                        />
                        <Label
                          id={`const-q${question.id}-${optionIndex}-label`}
                          htmlFor={`const-q${question.id}-${optionIndex}`}
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
              konstitūcijas jautājumiem. Tagad varat iesniegt savu eksāmenu.
            </AlertDescription>
          </Alert>
        )}

        {isCompleted && onComplete && (
          <div className="flex justify-end">
            <Button onClick={onComplete} size="lg">
              Pabeigt eksāmenu
            </Button>
          </div>
        )}
      </div>
    </ExamSection>
  )
}
