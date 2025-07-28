/**
 * @fileoverview ExamResults Component - Comprehensive Results Display
 *
 * Displays detailed exam results with pass/fail indicators, section-by-section
 * analysis, and actionable feedback for the Latvian citizenship exam.
 */

import { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Trophy,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import type { TestResults } from '@/types'
import { getSectionPassSummary } from '@/utils/scoring'

interface ExamResultsProps {
  results: TestResults
  onRetakeExam: () => void
}

export function ExamResults({ results, onRetakeExam }: ExamResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  )
  const {
    passed: passedSections,
    total: totalSections,
    sections,
  } = getSectionPassSummary(results)

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <div
      className="max-w-4xl mx-auto space-y-8 py-8"
      role="main"
      aria-labelledby="results-title"
    >
      {/* Overall Result Header */}
      <Card className="border-2">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {results.overall.passed ? (
              <div className="flex items-center space-x-3 text-green-600">
                <Trophy className="h-12 w-12" />
                <CheckCircle className="h-12 w-12" />
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-red-600">
                <AlertTriangle className="h-12 w-12" />
                <XCircle className="h-12 w-12" />
              </div>
            )}
          </div>

          <CardTitle id="results-title" className="text-3xl mb-2">
            {results.overall.passed
              ? 'Apsveicam! Eksāmens nokārtots!'
              : 'Eksāmens nav nokārtots'}
          </CardTitle>

          <p className="text-lg text-muted-foreground mb-4">
            {results.overall.passed
              ? 'Jūs esat veiksmīgi nokārtojis Latvijas pilsonības eksāmenu!'
              : 'Nav bēdīgs! Turpinājiet studēt un mēģinājiet vēlreiz.'}
          </p>

          <div className="flex justify-center items-center space-x-6 text-sm text-muted-foreground flex-wrap">
            <span>
              Nokārtotās sekcijas: {passedSections}/{totalSections}
            </span>
            <span>Kopējais laiks: {formatTime(results.overall.totalTime)}</span>
            <span>Vidējais rezultāts: {results.overall.overallScore}%</span>
          </div>
        </CardHeader>
      </Card>

      {/* Section Results Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {sections.map((section, index) => (
          <Card key={section.name} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{section.name}</CardTitle>
                <Badge variant={section.passed ? 'default' : 'destructive'}>
                  {section.passed ? 'Nokārtots' : 'Nenokārtots'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Progress value={section.score} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>{section.score}%</span>
                  <span className="text-muted-foreground">
                    {index === 0 && '≥75% vajadzīgs'}
                    {index === 1 && '≥70% vajadzīgs'}
                    {index === 2 && '≥62.5% vajadzīgs'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Section Results */}
      <div className="space-y-6">
        {/* Anthem Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CardTitle id="anthem-title">Valsts himna</CardTitle>
                <Badge
                  variant={results.anthem.passed ? 'default' : 'destructive'}
                >
                  {results.anthem.accuracy.toFixed(1)}% precizitāte
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('anthem')}
                className="flex items-center space-x-1"
                aria-expanded={expandedSections.has('anthem')}
                aria-controls="anthem-details"
              >
                <span>Detaļas</span>
                {expandedSections.has('anthem') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          {expandedSections.has('anthem') && (
            <CardContent
              id="anthem-details"
              className="pt-0"
              role="region"
              aria-labelledby="anthem-title"
            >
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Statistika</p>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <div>
                        Pareizi rakstu: {results.anthem.correctCharacters}/
                        {results.anthem.totalCharacters}
                      </div>
                      <div>
                        Precizitāte: {results.anthem.accuracy.toFixed(2)}%
                      </div>
                      <div>Nepieciešamā precizitāte: 75%</div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Analīze</p>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <div>
                        Kļūdu skaits:{' '}
                        {results.anthem.characterDifferences.length}
                      </div>
                      <div>
                        Teksta kvalitāte:{' '}
                        {results.anthem.analysis.qualityMetrics.qualityScore}%
                      </div>
                    </div>
                  </div>
                </div>

                {results.anthem.characterDifferences.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atrastās kļūdas</AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="text-sm space-y-1">
                        {results.anthem.analysis.errorPatterns
                          .slice(0, 3)
                          .map((pattern, index) => (
                            <div key={index}>
                              • {pattern.suggestion} ({pattern.count} reizes)
                            </div>
                          ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* History Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CardTitle>Vēstures jautājumi</CardTitle>
                <Badge
                  variant={results.history.passed ? 'default' : 'destructive'}
                >
                  {results.history.correct}/{results.history.total} pareizi
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('history')}
                className="flex items-center space-x-1"
              >
                <span>Detaļas</span>
                {expandedSections.has('history') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          {expandedSections.has('history') && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Rezultāts: {results.history.percentage}%</span>
                  <span className="text-muted-foreground">
                    Nepieciešams: ≥70%
                  </span>
                </div>

                {results.history.answers.some((a) => !a.isCorrect) && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Nepareizās atbildes</AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="space-y-2">
                        {results.history.answers
                          .filter((a) => !a.isCorrect)
                          .slice(0, 5)
                          .map((answer, index) => (
                            <div
                              key={index}
                              className="text-sm p-2 bg-muted rounded"
                            >
                              <div className="font-medium">
                                {answer.question.question}
                              </div>
                              <div className="text-red-600 mt-1">
                                Jūsu atbilde:{' '}
                                {answer.question.options[answer.selectedAnswer]}
                              </div>
                              <div className="text-green-600">
                                Pareizā atbilde:{' '}
                                {answer.question.options[answer.correctAnswer]}
                              </div>
                            </div>
                          ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Constitution Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CardTitle>Konstitūcijas jautājumi</CardTitle>
                <Badge
                  variant={
                    results.constitution.passed ? 'default' : 'destructive'
                  }
                >
                  {results.constitution.correct}/{results.constitution.total}{' '}
                  pareizi
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('constitution')}
                className="flex items-center space-x-1"
              >
                <span>Detaļas</span>
                {expandedSections.has('constitution') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          {expandedSections.has('constitution') && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Rezultāts: {results.constitution.percentage}%</span>
                  <span className="text-muted-foreground">
                    Nepieciešams: ≥62.5%
                  </span>
                </div>

                {results.constitution.answers.some((a) => !a.isCorrect) && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Nepareizās atbildes</AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="space-y-2">
                        {results.constitution.answers
                          .filter((a) => !a.isCorrect)
                          .slice(0, 5)
                          .map((answer, index) => (
                            <div
                              key={index}
                              className="text-sm p-2 bg-muted rounded"
                            >
                              <div className="font-medium">
                                {answer.question.question}
                              </div>
                              <div className="text-red-600 mt-1">
                                Jūsu atbilde:{' '}
                                {answer.question.options[answer.selectedAnswer]}
                              </div>
                              <div className="text-green-600">
                                Pareizā atbilde:{' '}
                                {answer.question.options[answer.correctAnswer]}
                              </div>
                            </div>
                          ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Recommendations and Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Ieteikumi un nākamie soļi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.analytics.strengths.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">
                  Jūsu stiprās puses
                </AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {results.analytics.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ieteikumi uzlabošanai</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {results.analytics.recommendations.map(
                    (recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    )
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={onRetakeExam}
          variant="outline"
          size="lg"
          className="flex items-center space-x-2"
        >
          <RotateCcw className="h-5 w-5" />
          <span>Mēģināt vēlreiz</span>
        </Button>

        {results.overall.passed && (
          <Button size="lg" className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Lejupielādēt sertifikātu</span>
          </Button>
        )}
      </div>
    </div>
  )
}
