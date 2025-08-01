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

import { describe, test, expect, vi } from 'vitest'
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
    constitution: results.constitution?.passed || false
  }))
}))

describe('ExamResults', () => {
  const mockPassedResults: TestResults = {
    sessionId: 'test-session-123',
    completedAt: new Date('2024-01-01T12:00:00Z'),
    overallPassed: true,
    totalScore: 85,
    sections: {
      anthem: {
        passed: true,
        score: 90,
        accuracy: 90,
        completed: true,
        maxScore: 100
      },
      history: {
        passed: true,
        score: 80,
        correctAnswers: 8,
        totalQuestions: 10,
        completed: true,
        maxScore: 100
      },
      constitution: {
        passed: true,
        score: 85,
        correctAnswers: 54,
        totalQuestions: 64,
        completed: true,
        maxScore: 100
      }
    },
    anthem: {
      text: 'User anthem text',
      passed: true,
      accuracy: 90,
      characterDifferences: [],
      analysis: {
        lineStats: [],
        errorPatterns: []
      }
    },
    history: {
      answers: {},
      score: 80,
      passed: true,
      questions: []
    },
    constitution: {
      answers: {},
      score: 85,
      passed: true,
      questions: []
    }
  }

  const mockFailedResults: TestResults = {
    ...mockPassedResults,
    overallPassed: false,
    totalScore: 45,
    sections: {
      anthem: {
        passed: false,
        score: 50,
        accuracy: 50,
        completed: true,
        maxScore: 100
      },
      history: {
        passed: false,
        score: 40,
        correctAnswers: 4,
        totalQuestions: 10,
        completed: true,
        maxScore: 100
      },
      constitution: {
        passed: true,
        score: 85,
        correctAnswers: 54,
        totalQuestions: 64,
        completed: true,
        maxScore: 100
      }
    },
    anthem: {
      ...mockPassedResults.anthem!,
      passed: false,
      accuracy: 50
    },
    history: {
      ...mockPassedResults.history!,
      passed: false,
      score: 40
    }
  }

  const defaultProps = {
    results: mockPassedResults,
    onRetakeExam: vi.fn()
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
      expect(screen.getByTestId('check-circle') || screen.getByRole('img', { name: /success/i })).toBeInTheDocument()
    })

    test('displays overall fail status correctly', () => {
      render(<ExamResults {...defaultProps} results={mockFailedResults} />)
      
      // Should show failing indicators
      expect(screen.getByText(/nenokārtots/i)).toBeInTheDocument()
      expect(screen.getByTestId('x-circle') || screen.getByRole('img', { name: /fail/i })).toBeInTheDocument()
    })

    test('displays total score', () => {
      render(<ExamResults {...defaultProps} />)
      
      expect(screen.getByText('85')).toBeInTheDocument() // Total score
      expect(screen.getByText(/%/)).toBeInTheDocument()
    })

    test('shows retake button', () => {
      render(<ExamResults {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /mēģināt vēlreiz/i })).toBeInTheDocument()
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
      const passIndicators = screen.getAllByTestId('check-circle') || screen.getAllByRole('img', { name: /success/i })
      expect(passIndicators.length).toBeGreaterThan(0)
    })

    test('shows mixed section results for partial failure', () => {
      render(<ExamResults {...defaultProps} results={mockFailedResults} />)
      
      // Should show both pass and fail indicators
      expect(screen.getByTestId('check-circle') || screen.getByRole('img', { name: /success/i })).toBeInTheDocument()
      expect(screen.getByTestId('x-circle') || screen.getByRole('img', { name: /fail/i })).toBeInTheDocument()
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
      
      const retakeButton = screen.getByRole('button', { name: /mēģināt vēlreiz/i })
      await user.click(retakeButton)
      
      expect(onRetakeExam).toHaveBeenCalledTimes(1)
    })

    test('expands/collapses detailed sections when clicked', async () => {
      const user = userEvent.setup()
      
      render(<ExamResults {...defaultProps} />)
      
      // Look for expandable sections
      const expandButtons = screen.getAllByRole('button', { name: /detaļas/i }) || 
                           screen.getAllByRole('button', { name: /chevron/i })
      
      if (expandButtons.length > 0) {
        await user.click(expandButtons[0])
        
        // Should expand section with more details
        expect(screen.getByText(/detalizēta analīze/i) || screen.getByText(/analysis/i)).toBeInTheDocument()
      }
    })
  })

  describe('Detailed Analysis', () => {
    test('shows anthem text analysis when expanded', async () => {
      const user = userEvent.setup()
      
      render(<ExamResults {...defaultProps} />)
      
      // Try to expand anthem section
      const expandButton = screen.getByRole('button', { name: /himna.*detaļas/i }) ||
                          screen.getAllByRole('button').find(btn => btn.textContent?.includes('himna'))
      
      if (expandButton) {
        await user.click(expandButton)
        
        // Should show detailed anthem analysis
        expect(screen.getByText(/rakstu analīze/i) || screen.getByText(/accuracy/i)).toBeInTheDocument()
      }
    })

    test('displays completion timestamp', () => {
      render(<ExamResults {...defaultProps} />)
      
      // Should show when exam was completed
      expect(screen.getByText(/pabeigts/i) || screen.getByText(/completed/i)).toBeInTheDocument()
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })

    test('shows session information', () => {
      render(<ExamResults {...defaultProps} />)
      
      // Should display session ID or reference
      expect(screen.getByText(/sesija/i) || screen.getByText(/session/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles incomplete results gracefully', () => {
      const incompleteResults = {
        ...mockPassedResults,
        sections: {
          anthem: mockPassedResults.sections.anthem
          // Missing history and constitution
        }
      }
      
      render(<ExamResults {...defaultProps} results={incompleteResults} />)
      
      // Should not crash and should display available results
      expect(screen.getByText(/himna/i)).toBeInTheDocument()
    })

    test('handles missing section data', () => {
      const resultsWithMissingData = {
        ...mockPassedResults,
        anthem: undefined,
        history: undefined,
        constitution: undefined
      }
      
      render(<ExamResults {...defaultProps} results={resultsWithMissingData} />)
      
      // Should display fallback content
      expect(screen.getByText(/rezultāti/i)).toBeInTheDocument()
    })

    test('handles invalid date gracefully', () => {
      const invalidDateResults = {
        ...mockPassedResults,
        completedAt: new Date('invalid-date')
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
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuenow')
        expect(bar).toHaveAttribute('aria-valuemin', '0')
        expect(bar).toHaveAttribute('aria-valuemax', '100')
      })
    })

    test('status indicators have proper labels', () => {
      render(<ExamResults {...defaultProps} />)
      
      // Success/failure indicators should be properly labeled
      const statusElements = screen.getAllByRole('img') || screen.getAllByTestId(/circle/)
      expect(statusElements.length).toBeGreaterThan(0)
    })

    test('interactive elements are keyboard accessible', () => {
      render(<ExamResults {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1')
      })
    })
  })

  describe('Visual States', () => {
    test('displays success theme for passed exam', () => {
      render(<ExamResults {...defaultProps} />)
      
      // Should show success indicators and messaging
      expect(screen.getByText(/apsveicam/i) || screen.getByText(/congratulations/i)).toBeInTheDocument()
      expect(screen.getByTestId('check-circle') || screen.getByRole('img', { name: /success/i })).toBeInTheDocument()
    })

    test('displays failure theme for failed exam', () => {
      render(<ExamResults {...defaultProps} results={mockFailedResults} />)
      
      // Should show failure indicators and messaging
      expect(screen.getByText(/nenokārtots/i) || screen.getByText(/failed/i)).toBeInTheDocument()
      expect(screen.getByTestId('x-circle') || screen.getByRole('img', { name: /fail/i })).toBeInTheDocument()
    })

    test('shows appropriate badges and indicators', () => {
      render(<ExamResults {...defaultProps} />)
      
      // Should have status badges
      const badges = screen.getAllByText(/nokārtots/i) || screen.getAllByText(/passed/i)
      expect(badges.length).toBeGreaterThan(0)
    })
  })
})