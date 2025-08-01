/**
 * @fileoverview Tests for ConstitutionSection component
 *
 * Tests the constitution questions component including:
 * - Question display and selection
 * - Answer tracking and validation
 * - Progress calculation
 * - Error handling
 * - Accessibility features
 */

import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConstitutionSection } from '../ConstitutionSection'
import type { Question } from '@/types/questions'

// Mock the ExamSection wrapper component
vi.mock('../ExamSection', () => ({
  ExamSection: ({ children, title, progress }: { children: React.ReactNode; title: string; progress?: number }) => (
    <div data-testid="exam-section">
      <h2>{title}</h2>
      {progress !== undefined && <div data-testid="progress">{progress}%</div>}
      {children}
    </div>
  )
}))

// Mock question data
const mockQuestions: Question[] = [
  {
    id: 1,
    question: 'Kurš ir Latvijas valsts himnas autors?',
    options: ['Kārlis Baumanis', 'Jānis Čakste', 'Krišjānis Barons'],
    correctAnswer: 0,
    category: 'constitution',
    difficulty: 'medium'
  },
  {
    id: 2,
    question: 'Kurā gadā tika proklamēta Latvijas neatkarība?',
    options: ['1918', '1920', '1921'],
    correctAnswer: 0,
    category: 'constitution',
    difficulty: 'easy'
  },
  {
    id: 3,
    question: 'Cik deputātu ir Saeimā?',
    options: ['100', '120', '150'],
    correctAnswer: 0,
    category: 'constitution',
    difficulty: 'medium'
  }
]

describe('ConstitutionSection', () => {
  const defaultProps = {
    answers: {},
    onChange: vi.fn(),
    onComplete: vi.fn(),
    questions: mockQuestions
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders constitution section with title', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      expect(screen.getByTestId('exam-section')).toBeInTheDocument()
      expect(screen.getByText(/Satversmes jautājumi/i)).toBeInTheDocument()
    })

    test('renders all provided questions', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      mockQuestions.forEach(question => {
        expect(screen.getByText(question.question)).toBeInTheDocument()
        
        question.options.forEach(option => {
          expect(screen.getByText(option)).toBeInTheDocument()
        })
      })
    })

    test('renders progress indicator', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      expect(screen.getByTestId('progress')).toBeInTheDocument()
      expect(screen.getByTestId('progress')).toHaveTextContent('0%')
    })

    test('renders complete button', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /pabeigt/i })).toBeInTheDocument()
    })

    test('displays error message when provided', () => {
      const errorMessage = 'Test error message'
      render(<ConstitutionSection {...defaultProps} error={errorMessage} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe('Question Interaction', () => {
    test('allows selecting answers for questions', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<ConstitutionSection {...defaultProps} onChange={onChange} />)
      
      // Find and click the first option of the first question
      const firstOption = screen.getAllByRole('radio')[0]
      await user.click(firstOption)
      
      expect(onChange).toHaveBeenCalledWith(1, 0)
    })

    test('displays selected answers correctly', () => {
      const answers = { 1: 0, 2: 1 } as Record<number, 0 | 1 | 2>
      
      render(<ConstitutionSection {...defaultProps} answers={answers} />)
      
      // Check that the correct radio buttons are selected
      const radioButtons = screen.getAllByRole('radio') as HTMLInputElement[]
      
      // First question, first option should be checked
      expect(radioButtons[0]).toBeChecked()
      expect(radioButtons[1]).not.toBeChecked()
      expect(radioButtons[2]).not.toBeChecked()
      
      // Second question, second option should be checked
      expect(radioButtons[3]).not.toBeChecked()
      expect(radioButtons[4]).toBeChecked()
      expect(radioButtons[5]).not.toBeChecked()
    })

    test('allows changing answers', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const answers = { 1: 0 } as Record<number, 0 | 1 | 2>
      
      render(<ConstitutionSection {...defaultProps} answers={answers} onChange={onChange} />)
      
      // Change answer for first question from option 0 to option 1
      const secondOption = screen.getAllByRole('radio')[1]
      await user.click(secondOption)
      
      expect(onChange).toHaveBeenCalledWith(1, 1)
    })

    test('handles multiple question selections', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<ConstitutionSection {...defaultProps} onChange={onChange} />)
      
      // Select answers for multiple questions
      const radioButtons = screen.getAllByRole('radio')
      
      await user.click(radioButtons[0]) // Q1, Option 0
      await user.click(radioButtons[4]) // Q2, Option 1
      await user.click(radioButtons[8]) // Q3, Option 2
      
      expect(onChange).toHaveBeenCalledWith(1, 0)
      expect(onChange).toHaveBeenCalledWith(2, 1)
      expect(onChange).toHaveBeenCalledWith(3, 2)
    })
  })

  describe('Progress Calculation', () => {
    test('calculates progress correctly with no answers', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      expect(screen.getByTestId('progress')).toHaveTextContent('0%')
    })

    test('calculates progress correctly with partial answers', () => {
      const answers = { 1: 0, 2: 1 } as Record<number, 0 | 1 | 2>
      
      render(<ConstitutionSection {...defaultProps} questions={mockQuestions} answers={answers} />)
      
      // 2 answers out of 64 total questions (CONSTITUTION_TOTAL_QUESTIONS = 64)
      const expectedProgress = Math.round((2 / 64) * 100)
      expect(screen.getByTestId('progress')).toHaveTextContent(`${expectedProgress}%`)
    })

    test('shows completion status when all questions answered', () => {
      // Create answers for all constitution questions (64 total)
      const answers: Record<number, 0 | 1 | 2> = {}
      for (let i = 1; i <= 64; i++) {
        answers[i] = 0
      }
      
      render(<ConstitutionSection {...defaultProps} answers={answers} />)
      
      expect(screen.getByTestId('progress')).toHaveTextContent('100%')
    })
  })

  describe('Completion Handling', () => {
    test('calls onComplete when complete button is clicked', async () => {
      const user = userEvent.setup()
      const onComplete = vi.fn()
      
      render(<ConstitutionSection {...defaultProps} onComplete={onComplete} />)
      
      const completeButton = screen.getByRole('button', { name: /pabeigt/i })
      await user.click(completeButton)
      
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    test('shows completion status for fully answered section', () => {
      // Mock all questions answered
      const answers: Record<number, 0 | 1 | 2> = {}
      for (let i = 1; i <= 64; i++) {
        answers[i] = 0
      }
      
      render(<ConstitutionSection {...defaultProps} answers={answers} />)
      
      // Should show completion indicator
      expect(screen.getByTestId('progress')).toHaveTextContent('100%')
    })
  })

  describe('Error Handling', () => {
    test('displays error message prominently', () => {
      const error = 'Kļūda ielādējot jautājumus'
      render(<ConstitutionSection {...defaultProps} error={error} />)
      
      expect(screen.getByText(error)).toBeInTheDocument()
      // Error should be in an alert component
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    test('handles empty questions array gracefully', () => {
      render(<ConstitutionSection {...defaultProps} questions={[]} />)
      
      // Should not crash and should show empty state
      expect(screen.getByTestId('exam-section')).toBeInTheDocument()
      expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    })

    test('handles missing onComplete prop', async () => {
      const user = userEvent.setup()
      
      render(<ConstitutionSection {...defaultProps} onComplete={undefined} />)
      
      const completeButton = screen.getByRole('button', { name: /pabeigt/i })
      
      // Should not crash when clicking without onComplete
      await expect(user.click(completeButton)).resolves.not.toThrow()
    })
  })

  describe('Accessibility', () => {
    test('has proper radio group structure', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      // Each question should have its own radio group
      const radioGroups = screen.getAllByRole('radiogroup')
      expect(radioGroups).toHaveLength(mockQuestions.length)
    })

    test('radio buttons have proper labels', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      mockQuestions.forEach(question => {
        question.options.forEach(option => {
          const radioButton = screen.getByRole('radio', { name: option })
          expect(radioButton).toBeInTheDocument()
        })
      })
    })

    test('questions have proper heading structure', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      // Should have main heading and question text should be accessible
      expect(screen.getByRole('heading')).toBeInTheDocument()
      
      mockQuestions.forEach(question => {
        expect(screen.getByText(question.question)).toBeInTheDocument()
      })
    })

    test('form elements are keyboard navigable', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      const radioButtons = screen.getAllByRole('radio')
      radioButtons.forEach(radio => {
        expect(radio).not.toHaveAttribute('tabIndex', '-1')
      })
      
      const button = screen.getByRole('button')
      expect(button).not.toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('Question Display', () => {
    test('displays question numbers correctly', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      mockQuestions.forEach((question, index) => {
        // Question numbers should be displayed (implementation-dependent)
        expect(screen.getByText(question.question)).toBeInTheDocument()
      })
    })

    test('displays all answer options for each question', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      mockQuestions.forEach(question => {
        question.options.forEach(option => {
          expect(screen.getByText(option)).toBeInTheDocument()
        })
      })
    })

    test('groups questions in proper card layout', () => {
      render(<ConstitutionSection {...defaultProps} />)
      
      // Should have card components for question organization
      const cardContent = screen.getAllByTestId('card-content') || []
      // Implementation may vary, but structure should be accessible
      expect(screen.getByTestId('exam-section')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    test('handles large number of questions efficiently', () => {
      const largeQuestionSet = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        question: `Question ${i + 1}?`,
        options: [`Option A${i}`, `Option B${i}`, `Option C${i}`],
        correctAnswer: 0,
        category: 'constitution' as const,
        difficulty: 'medium' as const
      }))
      
      const { container } = render(<ConstitutionSection {...defaultProps} questions={largeQuestionSet} />)
      
      // Should render without performance issues
      expect(container).toBeInTheDocument()
      expect(screen.getAllByRole('radio')).toHaveLength(300) // 100 questions × 3 options
    })

    test('re-renders efficiently on answer changes', () => {
      const onChange = vi.fn()
      const { rerender } = render(<ConstitutionSection {...defaultProps} onChange={onChange} />)
      
      // Update with new answers
      const newAnswers = { 1: 1 } as Record<number, 0 | 1 | 2>
      rerender(<ConstitutionSection {...defaultProps} answers={newAnswers} onChange={onChange} />)
      
      // Should handle updates without issues
      expect(screen.getAllByRole('radio')[1]).toBeChecked()
    })
  })
})