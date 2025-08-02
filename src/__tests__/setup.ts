/**
 * @fileoverview Vitest setup configuration
 *
 * Global test setup for the Latvian Citizenship Exam application.
 * Configures React Testing Library, jsdom environment, and global test utilities.
 */

import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup()
})

// Global test setup
beforeAll(() => {
  // Mock window.matchMedia for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })

  // Mock IntersectionObserver for components that use it
  global.IntersectionObserver = class IntersectionObserver {
    root: Element | null = null
    rootMargin: string = '0px'
    thresholds: ReadonlyArray<number> = [0]

    constructor(
      _callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit
    ) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  } as any

  // Mock ResizeObserver for responsive components
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock localStorage for session storage tests
  const storage: Record<string, string> = {}
  const localStorageMock = {
    getItem: (key: string): string | null => {
      return storage[key] || null
    },
    setItem: (key: string, value: string) => {
      storage[key] = value
    },
    removeItem: (key: string) => {
      delete storage[key]
    },
    clear: () => {
      Object.keys(storage).forEach((key) => {
        delete storage[key]
      })
    },
  }

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })

  // Mock sessionStorage similarly
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  })
})

// Global test cleanup
afterAll(() => {
  // Cleanup any global mocks if needed
})

// Extend expect with custom matchers if needed
expect.extend({
  // Custom matchers can be added here
})

// Suppress console warnings/errors during tests (optional)
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Filter out known React warnings during testing
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
        args[0].includes('Warning: act(...) is not supported'))
    ) {
      return
    }
    originalConsoleError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    // Filter out known warnings during testing
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return
    }
    originalConsoleWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})
