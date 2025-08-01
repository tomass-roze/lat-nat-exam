import { useState } from 'react'
import { ExamSection } from './ExamSection'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Info, CheckCircle } from 'lucide-react'
import { NATIONAL_ANTHEM_REFERENCE } from '@/types'
// Validation imports removed for blind test approach

interface AnthemSectionProps {
  value: string
  onChange: (value: string) => void
  onNext?: () => void
}

export function AnthemSection({ value, onChange, onNext }: AnthemSectionProps) {
  // Individual line inputs - all 8 lines are now valid
  const anthemLines = NATIONAL_ANTHEM_REFERENCE
  const [anthemInputs, setAnthemInputs] = useState<string[]>(() => {
    // Initialize from existing value if available
    if (value) {
      const lines = value.split('\n')
      const inputs = Array(8).fill('')
      let inputIndex = 0

      for (let i = 0; i < lines.length && inputIndex < 8; i++) {
        const line = lines[i].trim()
        if (line !== '') {
          inputs[inputIndex] = line
          inputIndex++
        }
      }
      return inputs
    }
    return Array(8).fill('')
  })

  // Update the main value when individual inputs change
  const updateAnthemLine = (index: number, lineValue: string) => {
    const newInputs = [...anthemInputs]
    newInputs[index] = lineValue
    setAnthemInputs(newInputs)

    // Join non-empty lines with newlines, maintaining the original structure
    const joinedText = newInputs
      .map((line, i) => {
        // Add empty line after 4th line to match original structure
        if (i === 3) {
          return line + '\n'
        }
        return line
      })
      .join('\n')
      .trim()

    onChange(joinedText)
  }

  // Validation context removed for blind test approach
  // No real-time validation feedback during input

  const getProgress = () => {
    // Count completed lines (lines with at least one letter)
    const completedLines = anthemInputs.filter((line) =>
      /[a-zA-ZāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/.test(line)
    ).length

    const totalLines = 8
    const percentage = (completedLines / totalLines) * 100

    return {
      current: completedLines,
      total: totalLines,
      percentage,
      accuracy: null,
      passed: completedLines === totalLines,
    }
  }

  const progress = getProgress()
  const isCompleted = progress.passed
  const status = isCompleted
    ? 'completed'
    : progress.current > 0
      ? 'in-progress'
      : 'pending'

  return (
    <ExamSection
      id="anthem"
      title="Valsts himna"
      description="Ierakstiet Latvijas valsts himnas tekstu. Precizitāte tiks pārbaudīta iesniegšanas laikā."
      status={status}
      progress={progress}
    >
      <div className="space-y-6">
        <Alert
          id="anthem-instructions"
          role="region"
          aria-labelledby="anthem-instructions-title"
        >
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span id="anthem-instructions-title" className="sr-only">
              Himnas instrukcijas
            </span>
            Ierakstiet pilnu Latvijas valsts himnas tekstu katrā rindā.
            Precizitāte un pareizība tiks pārbaudīta iesniegšanas laikā.
            Nepieciešams sasniegt vismaz 75% precizitāti, lai nokārtotu šo
            sekciju.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div
            className={`flex flex-col items-center space-y-3 ${
              progress.current < 8 ? 'pb-6' : ''
            }`}
          >
            {anthemLines.map((_, index) => (
              <div
                key={index}
                className={`relative w-[50%] ${index === 4 ? 'mt-6' : ''}`}
              >
                <Input
                  id={`anthem-line-${index}`}
                  value={anthemInputs[index] || ''}
                  onChange={(e) => updateAnthemLine(index, e.target.value)}
                  placeholder={`Ierakstiet ${index + 1}. rindu...`}
                  className={`anthem-line-input font-serif text-base border-0 border-b bg-transparent px-0 py-3 rounded-none focus:ring-0 focus:ring-offset-0 ${
                    anthemInputs[index]?.trim()
                      ? 'border-primary'
                      : 'border-border focus:border-primary'
                  }`}
                  aria-describedby="anthem-feedback anthem-instructions anthem-validation"
                  aria-label={`Latvijas valsts himnas ${index + 1}. rindas ievades lauks`}
                  aria-required="true"
                  aria-invalid="false"
                />
              </div>
            ))}
          </div>

          {/* Real-time validation feedback removed for blind test approach */}
        </div>

        {/* Comprehensive validation feedback removed for blind test approach */}

        {isCompleted && (
          <Alert
            className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-100"
            role="alert"
            aria-live="assertive"
            aria-labelledby="completion-message"
          >
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong id="completion-message">Apsveicam!</strong> Jūs esat
              aizpildījuši visas himnas rindas. Varat pāriet uz nākamo sekciju.
            </AlertDescription>
          </Alert>
        )}

        {isCompleted && onNext && (
          <div className="flex justify-center">
            <Button onClick={onNext} className="min-w-[200px]">
              Turpināt uz vēstures jautājumiem
            </Button>
          </div>
        )}
      </div>
    </ExamSection>
  )
}
