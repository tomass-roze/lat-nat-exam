/**
 * @fileoverview Test utilities and helpers
 *
 * Common utilities for testing React components and application logic.
 * Includes custom render functions, mock data, and test helpers.
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SessionProvider } from '@/contexts/SessionContext'
import { ValidationProvider } from '@/contexts/ValidationContext'

// Mock data for testing
export const mockQuestionData = {
  history: [
    {
      id: 'hist_1',
      question: 'Test history question?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
    },
  ],
  constitution: [
    {
      id: 'const_1',
      question: 'Test constitution question?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 1,
    },
  ],
}

export const mockSessionData = {
  sessionId: 'test-session-123',
  startTime: new Date().toISOString(),
  currentSection: 'history' as const,
  responses: {},
  isCompleted: false,
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialSessionState?: any
  initialValidationState?: any
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialSessionState, initialValidationState, ...renderOptions } =
    options

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider>
        <ValidationProvider>{children}</ValidationProvider>
      </SessionProvider>
    )
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Custom render for components without providers
export function renderComponent(ui: ReactElement, options: RenderOptions = {}) {
  return {
    user: userEvent.setup(),
    ...render(ui, options),
  }
}

// Utility to wait for async operations
export const waitForAsyncOperation = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Mock implementations for common dependencies
export const mockNavigate = vi.fn()
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
}

// Accessibility test helper
export const toHaveNoViolations = (received: any) => {
  if (received.violations.length === 0) {
    return {
      pass: true,
      message: () =>
        'Expected to have accessibility violations, but none were found',
    }
  }

  const violationMessages = received.violations
    .map(
      (violation: any) =>
        `${violation.impact}: ${violation.description} (${violation.nodes.length} elements)`
    )
    .join('\n')

  return {
    pass: false,
    message: () =>
      `Expected no accessibility violations, but found:\n${violationMessages}`,
  }
}

// Performance testing helper
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Text processing test helpers
export const createMockAnthemText = (
  variations: {
    missingDiacritics?: boolean
    extraSpaces?: boolean
    wrongCase?: boolean
  } = {}
) => {
  let text = `Dievs, svētī Latviju,
Mūs' dārgo tēviju,
Svētī jel Latviju,
Ak, svētī jel to!

Kur latvju meitas zied,
Kur latvju dēli dzied,
Laid mums tur laimē diet,
Mūs' Latvijā!`

  if (variations.missingDiacritics) {
    text = text.replace(/[āēīūčģķļņšž]/g, (match) => {
      const replacements: Record<string, string> = {
        ā: 'a',
        ē: 'e',
        ī: 'i',
        ū: 'u',
        č: 'c',
        ģ: 'g',
        ķ: 'k',
        ļ: 'l',
        ņ: 'n',
        š: 's',
        ž: 'z',
      }
      return replacements[match] || match
    })
  }

  if (variations.extraSpaces) {
    text = text.replace(/ /g, '  ')
  }

  if (variations.wrongCase) {
    text = text.toUpperCase()
  }

  return text
}

// Question generation helpers
export const createMockQuestion = (overrides: Partial<any> = {}) => ({
  id: 'test-question-1',
  question: 'Test question?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctAnswer: 0,
  category: 'test',
  difficulty: 'medium',
  ...overrides,
})

export const createMockQuestions = (
  count: number,
  type: 'history' | 'constitution' = 'history'
) =>
  Array.from({ length: count }, (_, index) =>
    createMockQuestion({
      id: `${type}_${index + 1}`,
      question: `Test ${type} question ${index + 1}?`,
      correctAnswer: index % 4,
    })
  )

// Form interaction helpers
export const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  fields: Record<string, string>
) => {
  for (const [label, value] of Object.entries(fields)) {
    const input = screen.getByLabelText(new RegExp(label, 'i'))
    await user.clear(input)
    await user.type(input, value)
  }
}

export const selectRadioOption = async (
  user: ReturnType<typeof userEvent.setup>,
  value: string
) => {
  const radio = screen.getByRole('radio', { name: new RegExp(value, 'i') })
  await user.click(radio)
}

// Session storage helpers for testing
export const mockSessionStorage = () => {
  const storage: Record<string, string> = {}

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value
    },
    removeItem: (key: string) => {
      delete storage[key]
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key])
    },
    get storage() {
      return { ...storage }
    },
  }
}

// Export everything needed for tests
export * from '@testing-library/react'
export { userEvent }
