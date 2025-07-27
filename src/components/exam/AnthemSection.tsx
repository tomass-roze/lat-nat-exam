import { useState } from 'react'
import { ExamSection } from './ExamSection'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Info, CheckCircle } from 'lucide-react'
import { NATIONAL_ANTHEM_TEXT, SCORING_THRESHOLDS } from '@/types/constants'

interface AnthemSectionProps {
  value: string
  onChange: (value: string) => void
  onNext?: () => void
}

export function AnthemSection({ value, onChange, onNext }: AnthemSectionProps) {
  const [showReference, setShowReference] = useState(false)

  const getProgress = () => {
    const minLength = SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS
    const currentLength = value.length
    const percentage = Math.min((currentLength / minLength) * 100, 100)

    return {
      current: currentLength,
      total: minLength,
      percentage,
    }
  }

  const progress = getProgress()
  const isCompleted = progress.percentage >= 75 // Based on SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE
  const status = isCompleted
    ? 'completed'
    : value.length > 0
      ? 'in-progress'
      : 'pending'

  return (
    <ExamSection
      id="anthem"
      title="Valsts himna"
      description="Ierakstiet Latvijas valsts himnas tekstu. Nepieciešams sasniegt vismaz 75% precizitāti."
      status={status}
      progress={progress}
    >
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Ierakstiet pilnu Latvijas valsts himnas tekstu. Sistēma pārbaudīs
            jūsu ievadīto tekstu un aprēķinās precizitāti. Nepieciešams sasniegt
            vismaz 75% precizitāti, lai nokārtotu šo sekciju.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="anthem-text" className="text-base font-medium">
            Himnas teksts
          </Label>
          <Textarea
            id="anthem-text"
            placeholder="Sāciet rakstīt himnas tekstu šeit..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            className="font-serif text-base leading-relaxed resize-none"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{value.length} simboli</span>
            <span>
              Nepieciešams: {SCORING_THRESHOLDS.ANTHEM_MIN_CHARACTERS}+ simboli
            </span>
          </div>
        </div>

        {isCompleted && (
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-100">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Apsveicam!</strong> Jūs esat nokārtojuši himnas sekciju.
              Varat pāriet uz nākamo sekciju.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setShowReference(!showReference)}
            className="flex-1"
          >
            {showReference ? 'Paslēpt' : 'Rādīt'} etalona tekstu
          </Button>
          {isCompleted && onNext && (
            <Button onClick={onNext} className="flex-1">
              Turpināt uz vēstures jautājumiem
            </Button>
          )}
        </div>

        {showReference && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Etalona teksts (tikai atsaucei):</strong>
              <pre className="mt-2 font-serif text-sm whitespace-pre-wrap leading-relaxed">
                {NATIONAL_ANTHEM_TEXT}
              </pre>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </ExamSection>
  )
}
