import { ExamSection } from './ExamSection'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Info,
  CheckCircle,
  AlertTriangle,
  Circle,
  CheckCircle2,
} from 'lucide-react'
import { SCORING_THRESHOLDS } from '@/types/constants'
import type { Question } from '@/types/questions'

interface ConstitutionSectionProps {
  answers: Record<number, 0 | 1 | 2>
  onChange: (questionId: number, answer: 0 | 1 | 2) => void
  onComplete?: () => void
  questions?: Question[]
  error?: string
}

export function ConstitutionSection({
  answers,
  onChange,
  onComplete,
  questions = [],
  error,
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

  // Show error state if there's an error loading questions
  if (error) {
    return (
      <ExamSection
        id="constitution"
        title="Konstitūcijas jautājumi"
        description="Kļūda ielādējot jautājumus"
        status="pending"
        progress={{
          current: 0,
          total: SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS,
          percentage: 0,
        }}
      >
        <Alert variant="destructive" role="alert">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Kļūda ielādējot konstitūcijas jautājumus:</strong> {error}
            <br />
            Lūdzu, pārlādējiet lapu vai sazinieties ar atbalsta dienestu.
          </AlertDescription>
        </Alert>
      </ExamSection>
    )
  }

  // Show loading state if questions haven't loaded yet
  if (questions.length === 0) {
    return (
      <ExamSection
        id="constitution"
        title="Konstitūcijas jautājumi"
        description="Ielādē jautājumus..."
        status="pending"
        progress={{
          current: 0,
          total: SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS,
          percentage: 0,
        }}
      >
        <Alert role="status" aria-live="polite">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Ielādē konstitūcijas jautājumus. Lūdzu, uzgaidiet...
          </AlertDescription>
        </Alert>
      </ExamSection>
    )
  }

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

        {/* Enhanced Progress Section */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-medium">
                Progress
              </Badge>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {progress.current} no {progress.total} jautājumiem
              </span>
            </div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {Math.round(progress.percentage)}%
            </div>
          </div>
          <Progress value={progress.percentage} className="h-2" />
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>
                Nepieciešams: {SCORING_THRESHOLDS.CONSTITUTION_PASS_COUNT}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3" />
              <span>
                Kopā: {SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {questions.map((question, index) => {
            const isAnswered = answers[question.id] !== undefined
            const selectedAnswer = answers[question.id]

            return (
              <Card
                key={question.id}
                id={`constitution-question-${question.id}`}
                className={`scroll-mt-24 transition-all duration-300 hover:shadow-md border-2 ${
                  isAnswered
                    ? 'border-slate-300 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                <CardContent className="p-6">
                  <fieldset className="space-y-4">
                    <legend className="flex items-center gap-3 font-medium text-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                            isAnswered
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span>{index + 1}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {isAnswered ? 'Atbildēts' : 'Gaida atbildi'}
                        </Badge>
                      </div>
                      <span className="flex-1">{question.question}</span>
                    </legend>

                    <RadioGroup
                      value={answers[question.id]?.toString()}
                      onValueChange={(value) =>
                        onChange(question.id, parseInt(value) as 0 | 1 | 2)
                      }
                      className="space-y-3 mt-4"
                      aria-describedby={`const-q${question.id}-description`}
                      aria-required="true"
                    >
                      <div
                        id={`const-q${question.id}-description`}
                        className="sr-only"
                      >
                        Izvēlieties vienu atbildi no piedāvātajām opcijām
                      </div>
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selectedAnswer === optionIndex

                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/50'
                            }`}
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
                              className={`text-sm leading-relaxed cursor-pointer flex-1 transition-colors ${
                                isSelected ? 'font-medium text-primary' : ''
                              }`}
                            >
                              <span
                                className={`inline-block font-semibold mr-2 ${
                                  isSelected ? 'text-primary' : 'text-slate-500'
                                }`}
                              >
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              {option}
                            </Label>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  </fieldset>
                </CardContent>
              </Card>
            )
          })}
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
