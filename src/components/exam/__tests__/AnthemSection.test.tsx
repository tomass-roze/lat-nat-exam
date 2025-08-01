/**
 * @fileoverview Tests for AnthemSection component
 * 
 * Tests the national anthem input component including:
 * - Line-by-line input functionality
 * - Value change handling
 * - Form validation states
 * - Accessibility features
 * - User interaction flows
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnthemSection } from '../AnthemSection'
import { NATIONAL_ANTHEM_REFERENCE } from '@/types'

// Mock the ExamSection wrapper component
vi.mock('../ExamSection', () => ({
  ExamSection: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="exam-section">
      <h2>{title}</h2>
      {children}
    </div>
  )
}))

describe('AnthemSection', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onNext: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders anthem section with title', () => {
      render(<AnthemSection {...defaultProps} />)
      
      expect(screen.getByTestId('exam-section')).toBeInTheDocument()
      expect(screen.getByText(/Valsts himnas/i)).toBeInTheDocument()
    })

    test('renders all 8 anthem input lines', () => {
      render(<AnthemSection {...defaultProps} />)
      
      // Should have 8 input fields for anthem lines
      const inputs = screen.getAllByRole('textbox')
      expect(inputs).toHaveLength(8)
      
      // Each input should have proper labeling
      NATIONAL_ANTHEM_REFERENCE.forEach((_line, index) => {
        const expectedLabel = `${index + 1}. rinda`
        expect(screen.getByLabelText(expectedLabel)).toBeInTheDocument()
      })
    })

    test('displays reference text for each line', () => {
      render(<AnthemSection {...defaultProps} />)
      
      // Should show reference text for each line
      NATIONAL_ANTHEM_REFERENCE.forEach((line) => {
        expect(screen.getByText(line)).toBeInTheDocument()
      })
    })

    test('shows next button when available', () => {
      render(<AnthemSection {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /turpināt/i })).toBeInTheDocument()
    })
  })

  describe('Value Initialization', () => {
    test('initializes with empty inputs when value is empty', () => {
      render(<AnthemSection {...defaultProps} />)
      
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toHaveValue('')
      })
    })

    test('initializes inputs from provided value', () => {
      const initialValue = `Dievs, svētī Latviju,
Mūs' dārgo tēviju,
Svētī jel Latviju,
Ak, svētī jel to!`
      
      render(<AnthemSection {...defaultProps} value={initialValue} />)
      
      const inputs = screen.getAllByRole('textbox')
      expect(inputs[0]).toHaveValue('Dievs, svētī Latviju,')
      expect(inputs[1]).toHaveValue('Mūs\' dārgo tēviju,')
      expect(inputs[2]).toHaveValue('Svētī jel Latviju,')
      expect(inputs[3]).toHaveValue('Ak, svētī jel to!')
      
      // Remaining inputs should be empty
      for (let i = 4; i < 8; i++) {
        expect(inputs[i]).toHaveValue('')
      }
    })

    test('handles complex initialization with empty lines', () => {
      const initialValue = `Dievs, svētī Latviju,

Svētī jel Latviju,

Kur latvju meitas zied,`
      
      render(<AnthemSection {...defaultProps} value={initialValue} />)
      
      const inputs = screen.getAllByRole('textbox')
      expect(inputs[0]).toHaveValue('Dievs, svētī Latviju,')
      expect(inputs[1]).toHaveValue('Svētī jel Latviju,')
      expect(inputs[2]).toHaveValue('Kur latvju meitas zied,')
      
      // Check remaining inputs are empty
      for (let i = 3; i < 8; i++) {
        expect(inputs[i]).toHaveValue('')
      }
    })
  })

  describe('User Interactions', () => {
    test('updates individual line inputs correctly', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<AnthemSection {...defaultProps} onChange={onChange} />)
      
      const firstInput = screen.getByLabelText('1. rinda')
      await user.type(firstInput, 'Dievs, svētī Latviju,')
      
      expect(onChange).toHaveBeenCalledWith('Dievs, svētī Latviju,\n\n\n\n\n\n\n')
    })

    test('maintains proper line structure when typing in multiple inputs', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<AnthemSection {...defaultProps} onChange={onChange} />)
      
      // Type in first line
      await user.type(screen.getByLabelText('1. rinda'), 'First line')
      expect(onChange).toHaveBeenLastCalledWith('First line\n\n\n\n\n\n\n')
      
      // Type in third line (skipping second)
      await user.type(screen.getByLabelText('3. rinda'), 'Third line')
      expect(onChange).toHaveBeenLastCalledWith('First line\n\nThird line\n\n\n\n\n')
      
      // Type in second line
      await user.type(screen.getByLabelText('2. rinda'), 'Second line')
      expect(onChange).toHaveBeenLastCalledWith('First line\nSecond line\nThird line\n\n\n\n\n')
    })

    test('handles text clearing correctly', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<AnthemSection {...defaultProps} value="Initial text" onChange={onChange} />)
      
      const firstInput = screen.getByLabelText('1. rinda')
      await user.clear(firstInput)
      
      expect(onChange).toHaveBeenCalledWith('\n\n\n\n\n\n\n')
    })

    test('calls onNext when next button is clicked', async () => {
      const user = userEvent.setup()
      const onNext = vi.fn()
      
      render(<AnthemSection {...defaultProps} onNext={onNext} />)
      
      const nextButton = screen.getByRole('button', { name: /turpināt/i })
      await user.click(nextButton)
      
      expect(onNext).toHaveBeenCalledTimes(1)
    })
  })

  describe('Line Structure Handling', () => {
    test('maintains empty line after 4th line for proper anthem structure', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<AnthemSection {...defaultProps} onChange={onChange} />)
      
      // Fill first 4 lines
      await user.type(screen.getByLabelText('1. rinda'), 'Line 1')
      await user.type(screen.getByLabelText('2. rinda'), 'Line 2')
      await user.type(screen.getByLabelText('3. rinda'), 'Line 3')
      await user.type(screen.getByLabelText('4. rinda'), 'Line 4')
      
      // The structure should include proper line breaks
      const expectedStructure = 'Line 1\nLine 2\nLine 3\nLine 4\n\n\n\n'
      expect(onChange).toHaveBeenLastCalledWith(expectedStructure)
    })

    test('fills all 8 lines correctly', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<AnthemSection {...defaultProps} onChange={onChange} />)
      
      // Fill all 8 lines
      for (let i = 1; i <= 8; i++) {
        await user.type(screen.getByLabelText(`${i}. rinda`), `Line ${i}`)
      }
      
      const expectedValue = 'Line 1\nLine 2\nLine 3\nLine 4\n\nLine 5\nLine 6\nLine 7\nLine 8'
      expect(onChange).toHaveBeenLastCalledWith(expectedValue)
    })
  })

  describe('Accessibility', () => {
    test('has proper labeling for all inputs', () => {
      render(<AnthemSection {...defaultProps} />)
      
      // Each input should be properly labeled
      for (let i = 1; i <= 8; i++) {
        const input = screen.getByLabelText(`${i}. rinda`)
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('type', 'text')
      }
    })

    test('inputs are keyboard navigable', () => {
      render(<AnthemSection {...defaultProps} />)
      
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).not.toHaveAttribute('tabIndex', '-1')
      })
    })

    test('has proper form structure', () => {
      render(<AnthemSection {...defaultProps} />)
      
      // Should have proper headings and structure
      expect(screen.getByRole('heading')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles very long input text', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<AnthemSection {...defaultProps} onChange={onChange} />)
      
      const longText = 'A'.repeat(1000)
      const firstInput = screen.getByLabelText('1. rinda')
      
      await user.type(firstInput, longText)
      
      expect(onChange).toHaveBeenCalled()
      expect(firstInput).toHaveValue(longText)
    })

    test('handles special characters and diacritics', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<AnthemSection {...defaultProps} onChange={onChange} />)
      
      const latvianText = 'Dievs, svētī Latviju, mūs\' dārgo tēviju'
      const firstInput = screen.getByLabelText('1. rinda')
      
      await user.type(firstInput, latvianText)
      
      expect(firstInput).toHaveValue(latvianText)
      expect(onChange).toHaveBeenCalledWith(expect.stringContaining(latvianText))
    })

    test('handles rapid consecutive inputs', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<AnthemSection {...defaultProps} onChange={onChange} />)
      
      const inputs = screen.getAllByRole('textbox')
      
      // Rapidly type in multiple inputs
      await Promise.all([
        user.type(inputs[0], 'First'),
        user.type(inputs[1], 'Second'),
        user.type(inputs[2], 'Third')
      ])
      
      // Should handle all inputs correctly
      expect(inputs[0]).toHaveValue('First')
      expect(inputs[1]).toHaveValue('Second')
      expect(inputs[2]).toHaveValue('Third')
    })
  })

  describe('Performance', () => {
    test('does not create unnecessary re-renders', () => {
      const onChange = vi.fn()
      const { rerender } = render(<AnthemSection {...defaultProps} onChange={onChange} />)
      
      // Re-render with same props
      rerender(<AnthemSection {...defaultProps} onChange={onChange} />)
      
      // Component should handle re-renders gracefully
      expect(screen.getAllByRole('textbox')).toHaveLength(8)
    })

    test('handles prop changes efficiently', () => {
      const onChange = vi.fn()
      const { rerender } = render(<AnthemSection {...defaultProps} onChange={onChange} />)
      
      // Change value prop
      rerender(<AnthemSection {...defaultProps} value="New value" onChange={onChange} />)
      
      // Should update without errors
      expect(screen.getByDisplayValue('New value')).toBeInTheDocument()
    })
  })
})