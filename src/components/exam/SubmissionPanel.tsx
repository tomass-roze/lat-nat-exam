import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { SCORING_THRESHOLDS } from '@/types/constants'

interface SubmissionPanelProps {
  anthemProgress: number
  historyAnswered: number
  constitutionAnswered: number
  isReadyForSubmission: boolean
  onSubmit: () => void
  className?: string
}

export function SubmissionPanel({
  anthemProgress,
  historyAnswered,
  constitutionAnswered,
  isReadyForSubmission,
  onSubmit,
  className,
}: SubmissionPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSectionStatus = (
    current: number,
    required: number,
    type: 'count' | 'percentage' = 'count'
  ) => {
    if (type === 'percentage') {
      return current >= required
        ? 'completed'
        : current > 0
          ? 'in-progress'
          : 'pending'
    }
    return current >= required
      ? 'completed'
      : current > 0
        ? 'in-progress'
        : 'pending'
  }

  const anthemStatus = getSectionStatus(
    anthemProgress,
    SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE,
    'percentage'
  )
  const historyStatus = getSectionStatus(
    historyAnswered,
    SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS
  )
  const constitutionStatus = getSectionStatus(
    constitutionAnswered,
    SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in-progress':
        return <Clock className="h-4 w-4 text-primary" />
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Pabeigts</Badge>
        )
      case 'in-progress':
        return <Badge>Daļēji</Badge>
      default:
        return <Badge variant="outline">Nav sākts</Badge>
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Eksāmena iesniedzana
        </CardTitle>
        <CardDescription>
          Pārbaudiet savu progresu un iesniedziet eksāmenu, kad esat pabeiguši
          visas sekcijas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Summary */}
        <div className="space-y-4">
          <h4 className="font-medium">Sekciju statuss</h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {getStatusIcon(anthemStatus)}
                <span className="font-medium">Valsts himna</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {Math.round(anthemProgress)}%
                </span>
                {getStatusBadge(anthemStatus)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {getStatusIcon(historyStatus)}
                <span className="font-medium">Vēstures jautājumi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {historyAnswered}/{SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS}
                </span>
                {getStatusBadge(historyStatus)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {getStatusIcon(constitutionStatus)}
                <span className="font-medium">Konstitūcijas jautājumi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {constitutionAnswered}/
                  {SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS}
                </span>
                {getStatusBadge(constitutionStatus)}
              </div>
            </div>
          </div>
        </div>

        {/* Submission Status */}
        {!isReadyForSubmission ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Eksāmens nav gatavs iesniegšanai.</strong>
              <br />
              Lūdzu, pabeidziet visas sekcijas pirms eksāmena iesniegšanas:
              <ul className="mt-2 ml-4 space-y-1">
                {anthemProgress < SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE && (
                  <li>
                    • Pabeigtu valsts himnas sekciju (vismaz{' '}
                    {SCORING_THRESHOLDS.ANTHEM_PASS_PERCENTAGE}% precizitāte)
                  </li>
                )}
                {historyAnswered <
                  SCORING_THRESHOLDS.HISTORY_TOTAL_QUESTIONS && (
                  <li>• Atbildētu uz visiem vēstures jautājumiem</li>
                )}
                {constitutionAnswered <
                  SCORING_THRESHOLDS.CONSTITUTION_TOTAL_QUESTIONS && (
                  <li>• Atbildētu uz visiem konstitūcijas jautājumiem</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-100">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Eksāmens ir gatavs iesniegšanai!</strong>
              <br />
              Jūs esat pabeiguši visas nepieciešamās sekcijas. Varat iesniegt
              eksāmenu vērtēšanai.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!isReadyForSubmission || isSubmitting}
            size="lg"
            className="min-w-32"
          >
            {isSubmitting ? 'Iesniedz...' : 'Iesniegt eksāmenu'}
          </Button>
        </div>

        {/* Important Notice */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Uzmanību!</strong> Pēc eksāmena iesniegšanas jūs nevarēsiet
            veikt izmaiņas atbildēs. Lūdzu, pārbaudiet visas atbildes pirms
            iesniegšanas.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
