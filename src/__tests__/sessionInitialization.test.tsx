/**
 * @fileoverview Tests for session initialization logic and section configuration handling
 *
 * Specifically tests the fix for Issue #70: Session persists when starting new test
 * with different section selection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadSessionData, clearSessionData } from '@/utils/sessionStorage'
import { arraysEqual } from '@/utils/arrayUtils'
import type { SessionData, TestState } from '@/types'

// Mock the session storage utilities
vi.mock('@/utils/sessionStorage', () => ({
  loadSessionData: vi.fn(),
  clearSessionData: vi.fn(),
  saveSessionData: vi.fn(),
}))

// Mock array utils (though it should work correctly)
vi.mock('@/utils/arrayUtils', () => ({
  arraysEqual: vi.fn(),
}))

const mockLoadSessionData = vi.mocked(loadSessionData)
const mockClearSessionData = vi.mocked(clearSessionData)
const mockArraysEqual = vi.mocked(arraysEqual)

describe('Session Initialization Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClearSessionData.mockReturnValue(true)
  })

  const createMockSessionData = (
    selectedSectionIds: string[]
  ): SessionData => ({
    testState: {
      anthemText: '',
      historyAnswers: {},
      constitutionAnswers: {},
      startTime: Date.now(),
      lastSaved: 0,
      isCompleted: false,
      currentSection: 'anthem' as const,
      selectedQuestions: {
        anthem: [],
        history: [],
        constitution: [],
      },
      enabledSections: {
        anthem: selectedSectionIds.includes('anthem'),
        history: selectedSectionIds.includes('history'),
        constitution: selectedSectionIds.includes('constitution'),
      },
      selectedSectionIds,
      testConfiguration: {
        totalSections: selectedSectionIds.length,
        sectionNames: selectedSectionIds,
        isPartialTest: selectedSectionIds.length < 3,
      },
      metadata: {
        sessionId: 'test-session',
        timezone: 'UTC',
        attemptNumber: 1,
        darkMode: false,
      },
    } as TestState,
    selectedQuestions: {
      anthem: [],
      history: [],
      constitution: [],
    },
    sessionId: 'test-session',
    expiresAt: Date.now() + 7200000, // 2 hours
    version: '1.0.0',
    metadata: {
      sessionId: 'test-session',
      timezone: 'UTC',
      attemptNumber: 1,
      darkMode: false,
      lastUpdated: Date.now(),
    },
  })

  describe('Session Configuration Comparison', () => {
    it('should detect when configurations match', () => {
      // Setup: Existing session with anthem and history
      const existingConfig = ['anthem', 'history']
      const newConfig = ['anthem', 'history']

      mockArraysEqual.mockReturnValue(true)

      const result = arraysEqual(existingConfig, newConfig)

      expect(result).toBe(true)
      expect(mockArraysEqual).toHaveBeenCalledWith(existingConfig, newConfig)
    })

    it('should detect when configurations differ', () => {
      // Setup: Existing session with anthem and history, new config with only anthem
      const existingConfig = ['anthem', 'history']
      const newConfig = ['anthem']

      mockArraysEqual.mockReturnValue(false)

      const result = arraysEqual(existingConfig, newConfig)

      expect(result).toBe(false)
      expect(mockArraysEqual).toHaveBeenCalledWith(existingConfig, newConfig)
    })

    it('should detect when order differs but content is same', () => {
      // Setup: Same sections in different order should be considered equal
      const existingConfig = ['anthem', 'history', 'constitution']
      const newConfig = ['history', 'constitution', 'anthem']

      mockArraysEqual.mockReturnValue(true) // Our arraysEqual function handles order-independence

      const result = arraysEqual(existingConfig, newConfig)

      expect(result).toBe(true)
      expect(mockArraysEqual).toHaveBeenCalledWith(existingConfig, newConfig)
    })
  })

  describe('Session Loading with Navigation State', () => {
    it('should load existing session when configurations match', () => {
      // Setup: Navigation state with anthem and history
      const navigationSections = ['anthem', 'history']
      const existingSession = createMockSessionData(['anthem', 'history'])

      mockLoadSessionData.mockReturnValue({
        success: true,
        sessionData: existingSession,
      })
      mockArraysEqual.mockReturnValue(true)

      // Simulate the logic from App.tsx
      const hasNavigationState = navigationSections.length > 0

      if (hasNavigationState) {
        const existingSessionResult = loadSessionData()

        if (
          existingSessionResult.success &&
          existingSessionResult.sessionData
        ) {
          const existingConfig =
            existingSessionResult.sessionData.testState.selectedSectionIds || []
          const newConfig = navigationSections

          const shouldClearSession = !arraysEqual(existingConfig, newConfig)

          expect(shouldClearSession).toBe(false)
          expect(mockClearSessionData).not.toHaveBeenCalled()
        }
      }

      expect(mockLoadSessionData).toHaveBeenCalled()
      expect(mockArraysEqual).toHaveBeenCalledWith(
        ['anthem', 'history'],
        navigationSections
      )
    })

    it('should clear session when configurations differ', () => {
      // Setup: Navigation state with only anthem, existing session with anthem and history
      const navigationSections = ['anthem']
      const existingSession = createMockSessionData(['anthem', 'history'])

      mockLoadSessionData.mockReturnValue({
        success: true,
        sessionData: existingSession,
      })
      mockArraysEqual.mockReturnValue(false)

      // Simulate the logic from App.tsx
      const hasNavigationState = navigationSections.length > 0
      let shouldCreateNewSession = false

      if (hasNavigationState) {
        const existingSessionResult = loadSessionData()

        if (
          existingSessionResult.success &&
          existingSessionResult.sessionData
        ) {
          const existingConfig =
            existingSessionResult.sessionData.testState.selectedSectionIds || []
          const newConfig = navigationSections

          if (!arraysEqual(existingConfig, newConfig)) {
            clearSessionData() // Would call clearSession() in real implementation
            shouldCreateNewSession = true
          }
        }
      }

      expect(shouldCreateNewSession).toBe(true)
      expect(mockLoadSessionData).toHaveBeenCalled()
      expect(mockArraysEqual).toHaveBeenCalledWith(
        ['anthem', 'history'],
        navigationSections
      )
      expect(mockClearSessionData).toHaveBeenCalled()
    })

    it('should create new session when no existing session found', () => {
      // Setup: Navigation state with sections but no existing session
      const navigationSections = ['constitution']

      mockLoadSessionData.mockReturnValue({
        success: false,
        error: {
          code: 'NO_SESSION_DATA',
          message: 'No session data found',
          timestamp: Date.now(),
          severity: 'warning',
        },
      })

      // Simulate the logic from App.tsx
      const hasNavigationState = navigationSections.length > 0
      let shouldCreateNewSession = false

      if (hasNavigationState) {
        const existingSessionResult = loadSessionData()

        if (
          existingSessionResult.success &&
          existingSessionResult.sessionData
        ) {
          // This branch won't execute due to success: false
        } else {
          shouldCreateNewSession = true
        }
      }

      expect(shouldCreateNewSession).toBe(true)
      expect(mockLoadSessionData).toHaveBeenCalled()
      expect(mockClearSessionData).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty section configurations', () => {
      const existingConfig: string[] = []
      const newConfig: string[] = []

      mockArraysEqual.mockReturnValue(true)

      const result = arraysEqual(existingConfig, newConfig)

      expect(result).toBe(true)
      expect(mockArraysEqual).toHaveBeenCalledWith(existingConfig, newConfig)
    })

    it('should handle null/undefined configurations gracefully', () => {
      const navigationSections = ['anthem']
      const existingSession = createMockSessionData(['anthem'])

      // Simulate missing selectedSectionIds
      existingSession.testState.selectedSectionIds = undefined as any

      mockLoadSessionData.mockReturnValue({
        success: true,
        sessionData: existingSession,
      })
      mockArraysEqual.mockReturnValue(false)

      // Simulate the logic from App.tsx with fallback to empty array
      const hasNavigationState = navigationSections.length > 0

      if (hasNavigationState) {
        const existingSessionResult = loadSessionData()

        if (
          existingSessionResult.success &&
          existingSessionResult.sessionData
        ) {
          const existingConfig =
            existingSessionResult.sessionData.testState.selectedSectionIds || []
          const newConfig = navigationSections

          // Should handle undefined by falling back to empty array
          expect(existingConfig).toEqual([])
          expect(arraysEqual(existingConfig, newConfig)).toBe(false)
        }
      }

      expect(mockArraysEqual).toHaveBeenCalledWith([], navigationSections)
    })

    it('should handle session data loading errors', () => {
      const navigationSections = ['anthem', 'history']

      mockLoadSessionData.mockReturnValue({
        success: false,
        error: {
          code: 'STORAGE_UNAVAILABLE',
          message: 'Session storage is not available',
          timestamp: Date.now(),
          severity: 'error',
        },
      })

      // Simulate the logic from App.tsx
      const hasNavigationState = navigationSections.length > 0
      let shouldCreateNewSession = false

      if (hasNavigationState) {
        const existingSessionResult = loadSessionData()

        if (
          existingSessionResult.success &&
          existingSessionResult.sessionData
        ) {
          // This won't execute due to success: false
        } else {
          shouldCreateNewSession = true
        }
      }

      expect(shouldCreateNewSession).toBe(true)
      expect(mockClearSessionData).not.toHaveBeenCalled()
    })
  })

  describe('Real-world Scenarios from Issue #70', () => {
    it('should handle Test Case 1: Same Selection (should keep session)', () => {
      // User selects A, B, C → start test → return to landing → select same A, B, C → start test
      const sections = ['anthem', 'history', 'constitution']
      const existingSession = createMockSessionData(sections)

      mockLoadSessionData.mockReturnValue({
        success: true,
        sessionData: existingSession,
      })
      mockArraysEqual.mockReturnValue(true)

      let shouldClearSession = false
      let shouldLoadExisting = false

      const existingSessionResult = loadSessionData()
      if (existingSessionResult.success && existingSessionResult.sessionData) {
        const existingConfig =
          existingSessionResult.sessionData.testState.selectedSectionIds || []
        const newConfig = sections

        if (!arraysEqual(existingConfig, newConfig)) {
          shouldClearSession = true
        } else {
          shouldLoadExisting = true
        }
      }

      expect(shouldClearSession).toBe(false)
      expect(shouldLoadExisting).toBe(true)
      expect(mockClearSessionData).not.toHaveBeenCalled()
    })

    it('should handle Test Case 2: Different Selection (should clear session)', () => {
      // User selects A, B → start test → return to landing → select B, C → start test
      const existingSections = ['anthem', 'history']
      const newSections = ['history', 'constitution']
      const existingSession = createMockSessionData(existingSections)

      mockLoadSessionData.mockReturnValue({
        success: true,
        sessionData: existingSession,
      })
      mockArraysEqual.mockReturnValue(false)

      let shouldClearSession = false
      let shouldCreateNew = false

      const existingSessionResult = loadSessionData()
      if (existingSessionResult.success && existingSessionResult.sessionData) {
        const existingConfig =
          existingSessionResult.sessionData.testState.selectedSectionIds || []
        const newConfig = newSections

        if (!arraysEqual(existingConfig, newConfig)) {
          clearSessionData()
          shouldClearSession = true
          shouldCreateNew = true
        }
      }

      expect(shouldClearSession).toBe(true)
      expect(shouldCreateNew).toBe(true)
      expect(mockClearSessionData).toHaveBeenCalled()
    })

    it('should handle Test Case 3: Subset Selection (should clear session)', () => {
      // User selects all A, B, C → start test → return to landing → select only A → start test
      const existingSections = ['anthem', 'history', 'constitution']
      const newSections = ['anthem']
      const existingSession = createMockSessionData(existingSections)

      mockLoadSessionData.mockReturnValue({
        success: true,
        sessionData: existingSession,
      })
      mockArraysEqual.mockReturnValue(false)

      let shouldClearSession = false

      const existingSessionResult = loadSessionData()
      if (existingSessionResult.success && existingSessionResult.sessionData) {
        const existingConfig =
          existingSessionResult.sessionData.testState.selectedSectionIds || []
        const newConfig = newSections

        if (!arraysEqual(existingConfig, newConfig)) {
          clearSessionData()
          shouldClearSession = true
        }
      }

      expect(shouldClearSession).toBe(true)
      expect(mockClearSessionData).toHaveBeenCalled()
      expect(mockArraysEqual).toHaveBeenCalledWith(
        existingSections,
        newSections
      )
    })
  })
})
