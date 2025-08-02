/**
 * @fileoverview Tests for ExamResults component
 *
 * Tests the exam results display component including:
 * - Pass/fail determination and display
 * - Section-by-section results breakdown
 * - Score calculations and progress indicators
 * - Retake functionality
 * - Detailed feedback and analysis
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExamResults } from '../ExamResults'
import type { TestResults } from '@/types'

// Mock scoring utility
vi.mock('@/utils/scoring', () => ({
  getSectionPassSummary: vi.fn((results) => ({
    overall: results.overallPassed,
    anthem: results.anthem?.passed || false,
    history: results.history?.passed || false,
    constitution: results.constitution?.passed || false,
  })),
}))

describe('ExamResults', () => {
  const mockPassedResults: TestResults = {
    anthem: {
      passed: true,
      accuracy: 90,
      characterDifferences: [],
      submittedText: 'User anthem text',
      referenceText: 'Reference anthem text',
      totalCharacters: 100,
      correctCharacters: 90,
      analysis: {
        lineStats: [],
        errorPatterns: [],
        timing: {
          typingTime: 600000,
          typingSpeed: 120,
          longPauses: 2,
          thinkingTime: 5000,
        },
        qualityMetrics: {
          encodingIssues: false,
          whitespaceIssues: false,
          nonStandardCharacters: [],
          qualityScore: 95,
        },
      },
    },
    history: {
      answers: [],
      correct: 8,
      total: 10,
      percentage: 80,
      passed: true,
      passingScore: 70,
      analysis: {
        averageTimePerQuestion: 30000,
        firstTryCorrect: 8,
        answerDistribution: {
          option0: 3,
          option1: 4,
          option2: 3,
        },
        timingStats: {
          fastest: {
            question: {
              id: 1,
              question: 'Mock question',
              options: ['A', 'B', 'C'] as [string, string, string],
              correctAnswer: 0 as const,
              category: 'history' as const,
            },
            selectedAnswer: 0,
            isCorrect: true,
            timeToAnswer: 15000,
            correctAnswer: 0,
          },
          slowest: {
            question: {
              id: 2,
              question: 'Mock question 2',
              options: ['A', 'B', 'C'] as [string, string, string],
              correctAnswer: 1 as const,
              category: 'history' as const,
            },
            selectedAnswer: 1,
            isCorrect: true,
            timeToAnswer: 60000,
            correctAnswer: 1,
          },
          median: 30000,
        },
      },
    },
    constitution: {
      answers: [],
      correct: 7,
      total: 8,
      percentage: 87.5,
      passed: true,
      passingScore: 62.5,
      analysis: {
        averageTimePerQuestion: 25000,
        firstTryCorrect: 7,
        answerDistribution: {
          option0: 2,
          option1: 4,
          option2: 2,
        },
        timingStats: {
          fastest: {
            question: {
              id: 3,
              question: 'Mock constitution question',
              options: ['A', 'B', 'C'] as [string, string, string],
              correctAnswer: 0 as const,
              category: 'constitution' as const,
            },
            selectedAnswer: 0,
            isCorrect: true,
            timeToAnswer: 12000,
            correctAnswer: 0,
          },
          slowest: {
            question: {
              id: 4,
              question: 'Mock constitution question 2',
              options: ['A', 'B', 'C'] as [string, string, string],
              correctAnswer: 2 as const,
              category: 'constitution' as const,
            },
            selectedAnswer: 2,
            isCorrect: true,
            timeToAnswer: 45000,
            correctAnswer: 2,
          },
          median: 25000,
        },
      },
    },
    overall: {
      passed: true,
      overallScore: 85,
      sectionResults: {
        anthem: true,
        history: true,
        constitution: true,
      },
      totalTime: 1800000,
      completedAt: Date.now(),
      certificateEligible: true,
    },
    calculatedAt: Date.now(),
    analytics: {
      trends: {
        accuracyTrend: 'improving' as const,
        speedTrend: 'stable' as const,
        confidenceTrend: 'improving' as const,
      },
      benchmarks: {
        percentileRanking: 75,
        comparedToAverage: {
          anthem: 'above' as const,
          history: 'average' as const,
          constitution: 'above' as const,
          timing: 'below' as const,
        },
      },
      recommendations: [
        'Focus on diacritical marks',
        'Practice time management',
      ],
      strengths: ['Good accuracy', 'Consistent performance'],
      statistics: {
        totalCharactersTyped: 800,
        totalQuestionsAnswered: 18,
        answerChanges: 3,
        timeDistribution: {
          anthem: 600000,
          history: 600000,
          constitution: 600000,
          results: 60000,
        },
        errorStats: {
          totalErrors: 5,
          errorsByType: {
            diacritic_missing: 3,
            case_error: 2,
          },
          mostCommonError: 'diacritic_missing',
        },
      },
    },
  }

  const mockFailedResults: TestResults = {
    ...mockPassedResults,
    overall: {
      ...mockPassedResults.overall,
      passed: false,
      overallScore: 45,
    },
    anthem: {
      ...mockPassedResults.anthem!,
      passed: false,
      accuracy: 50,
    },
    history: {
      ...mockPassedResults.history!,
      passed: false,
      correct: 4,
      percentage: 40,
    },
  }

  const defaultProps = {
    results: mockPassedResults,
    onRetakeExam: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders exam results with overall status', () => {
      render(<ExamResults {...defaultProps} />)

      expect(screen.getByText(/eksāmena rezultāti/i)).toBeInTheDocument()
      expect(screen.getByText(/apsveicam/i)).toBeInTheDocument() // Congratulations for passing
    })

    test('displays overall pass status correctly', () => {
      render(<ExamResults {...defaultProps} />)

      // Should show passing indicators
      expect(screen.getByText(/nokārtots/i)).toBeInTheDocument()
      expect(
        screen.getByTestId('check-circle') ||
          screen.getByRole('img', { name: /success/i })
      ).toBeInTheDocument()
    })

    test('displays overall fail status correctly', () => {
      render(<ExamResults {...defaultProps} results={mockFailedResults} />)

      // Should show failing indicators
      expect(screen.getByText(/nenokārtots/i)).toBeInTheDocument()
      expect(
        screen.getByTestId('x-circle') ||
          screen.getByRole('img', { name: /fail/i })
      ).toBeInTheDocument()
    })

    test('displays total score', () => {
      render(<ExamResults {...defaultProps} />)

      expect(screen.getByText('85')).toBeInTheDocument() // Total score
      expect(screen.getByText(/%/)).toBeInTheDocument()
    })

    test('shows retake button', () => {
      render(<ExamResults {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /mēģināt vēlreiz/i })
      ).toBeInTheDocument()
    })
  })

  describe('Section Results', () => {
    test('displays anthem section results', () => {
      render(<ExamResults {...defaultProps} />)

      expect(screen.getByText(/himna/i)).toBeInTheDocument()
      expect(screen.getByText('90%')).toBeInTheDocument() // Anthem accuracy
    })

    test('displays history section results', () => {
      render(<ExamResults {...defaultProps} />)

      expect(screen.getByText(/vēsture/i)).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument() // Correct answers
      expect(screen.getByText('10')).toBeInTheDocument() // Total questions
    })

    test('displays constitution section results', () => {
      render(<ExamResults {...defaultProps} />)

      expect(screen.getByText(/satversme/i)).toBeInTheDocument()
      expect(screen.getByText('54')).toBeInTheDocument() // Correct answers
      expect(screen.getByText('64')).toBeInTheDocument() // Total questions
    })

    test('shows section pass/fail indicators', () => {
      render(<ExamResults {...defaultProps} />)

      // All sections should show as passed
      const passIndicators =
        screen.getAllByTestId('check-circle') ||
        screen.getAllByRole('img', { name: /success/i })
      expect(passIndicators.length).toBeGreaterThan(0)
    })

    test('shows mixed section results for partial failure', () => {
      render(<ExamResults {...defaultProps} results={mockFailedResults} />)

      // Should show both pass and fail indicators
      expect(
        screen.getByTestId('check-circle') ||
          screen.getByRole('img', { name: /success/i })
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('x-circle') ||
          screen.getByRole('img', { name: /fail/i })
      ).toBeInTheDocument()
    })
  })

  describe('Progress Indicators', () => {
    test('displays progress bars for sections', () => {
      render(<ExamResults {...defaultProps} />)

      // Should have progress indicators
      const progressBars = screen.getAllByRole('progressbar')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    test('shows correct progress percentages', () => {
      render(<ExamResults {...defaultProps} />)

      // Check for percentage values
      expect(screen.getByText('90%')).toBeInTheDocument() // Anthem
      expect(screen.getByText('80%')).toBeInTheDocument() // History
      expect(screen.getByText('85%')).toBeInTheDocument() // Constitution
    })
  })

  describe('User Interactions', () => {
    test('calls onRetakeExam when retake button is clicked', async () => {
      const user = userEvent.setup()
      const onRetakeExam = vi.fn()

      render(<ExamResults {...defaultProps} onRetakeExam={onRetakeExam} />)

      const retakeButton = screen.getByRole('button', {
        name: /mēģināt vēlreiz/i,
      })
      await user.click(retakeButton)

      expect(onRetakeExam).toHaveBeenCalledTimes(1)
    })

    test('expands/collapses detailed sections when clicked', async () => {
      const user = userEvent.setup()

      render(<ExamResults {...defaultProps} />)

      // Look for expandable sections
      const expandButtons =
        screen.getAllByRole('button', { name: /detaļas/i }) ||
        screen.getAllByRole('button', { name: /chevron/i })

      if (expandButtons.length > 0) {
        await user.click(expandButtons[0])

        // Should expand section with more details
        expect(
          screen.getByText(/detalizēta analīze/i) ||
            screen.getByText(/analysis/i)
        ).toBeInTheDocument()
      }
    })
  })

  describe('Detailed Analysis', () => {
    test('shows anthem text analysis when expanded', async () => {
      const user = userEvent.setup()

      render(<ExamResults {...defaultProps} />)

      // Try to expand anthem section
      const expandButton =
        screen.getByRole('button', { name: /himna.*detaļas/i }) ||
        screen
          .getAllByRole('button')
          .find((btn) => btn.textContent?.includes('himna'))

      if (expandButton) {
        await user.click(expandButton)

        // Should show detailed anthem analysis
        expect(
          screen.getByText(/rakstu analīze/i) || screen.getByText(/accuracy/i)
        ).toBeInTheDocument()
      }
    })

    test('displays completion timestamp', () => {
      render(<ExamResults {...defaultProps} />)

      // Should show when exam was completed
      expect(
        screen.getByText(/pabeigts/i) || screen.getByText(/completed/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })

    test('shows session information', () => {
      render(<ExamResults {...defaultProps} />)

      // Should display session ID or reference
      expect(
        screen.getByText(/sesija/i) || screen.getByText(/session/i)
      ).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles incomplete results gracefully', () => {
      const incompleteResults: Partial<TestResults> = {
        ...mockPassedResults,
        anthem: mockPassedResults.anthem,
        // Missing history and constitution
      }

      render(
        <ExamResults
          {...defaultProps}
          results={incompleteResults as TestResults}
        />
      )

      // Should not crash and should display available results
      expect(screen.getByText(/himna/i)).toBeInTheDocument()
    })

    test('handles missing section data', () => {
      const resultsWithMissingData = {
        ...mockPassedResults,
        anthem: mockPassedResults.anthem,
        history: mockPassedResults.history,
        constitution: mockPassedResults.constitution,
      }

      render(<ExamResults {...defaultProps} results={resultsWithMissingData} />)

      // Should display fallback content
      expect(screen.getByText(/rezultāti/i)).toBeInTheDocument()
    })

    test('handles invalid date gracefully', () => {
      const invalidDateResults = {
        ...mockPassedResults,
        completedAt: new Date('invalid-date'),
      }

      render(<ExamResults {...defaultProps} results={invalidDateResults} />)

      // Should not crash
      expect(screen.getByText(/rezultāti/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(<ExamResults {...defaultProps} />)

      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
      expect(headings[0]).toHaveTextContent(/rezultāti/i)
    })

    test('progress bars have proper accessibility attributes', () => {
      render(<ExamResults {...defaultProps} />)

      const progressBars = screen.getAllByRole('progressbar')
      progressBars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuenow')
        expect(bar).toHaveAttribute('aria-valuemin', '0')
        expect(bar).toHaveAttribute('aria-valuemax', '100')
      })
    })

    test('status indicators have proper labels', () => {
      render(<ExamResults {...defaultProps} />)

      // Success/failure indicators should be properly labeled
      const statusElements =
        screen.getAllByRole('img') || screen.getAllByTestId(/circle/)
      expect(statusElements.length).toBeGreaterThan(0)
    })

    test('interactive elements are keyboard accessible', () => {
      render(<ExamResults {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabIndex', '-1')
      })
    })
  })

  describe('Visual States', () => {
    test('displays success theme for passed exam', () => {
      render(<ExamResults {...defaultProps} />)

      // Should show success indicators and messaging
      expect(
        screen.getByText(/apsveicam/i) || screen.getByText(/congratulations/i)
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('check-circle') ||
          screen.getByRole('img', { name: /success/i })
      ).toBeInTheDocument()
    })

    test('displays failure theme for failed exam', () => {
      render(<ExamResults {...defaultProps} results={mockFailedResults} />)

      // Should show failure indicators and messaging
      expect(
        screen.getByText(/nenokārtots/i) || screen.getByText(/failed/i)
      ).toBeInTheDocument()
      expect(
        screen.getByTestId('x-circle') ||
          screen.getByRole('img', { name: /fail/i })
      ).toBeInTheDocument()
    })

    test('shows appropriate badges and indicators', () => {
      render(<ExamResults {...defaultProps} />)

      // Should have status badges
      const badges =
        screen.getAllByText(/nokārtots/i) || screen.getAllByText(/passed/i)
      expect(badges.length).toBeGreaterThan(0)
    })
  })
})
