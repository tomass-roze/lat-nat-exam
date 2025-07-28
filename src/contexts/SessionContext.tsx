/**
 * @fileoverview Session context for persistent exam state management
 *
 * Provides React context for session persistence with auto-save functionality,
 * recovery mechanisms, and integration with sessionStorage utilities.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import type {
  SessionData,
  SessionError,
  SessionRecovery,
  AutoSaveStatus,
  SessionStatus,
} from '@/types/session'
import type { TestState } from '@/types/exam'
import type { SelectedQuestions } from '@/types/questions'
import {
  saveSessionData,
  loadSessionData,
  clearSessionData,
  isSessionStorageAvailable,
  extendSession,
} from '@/utils/sessionStorage'

/**
 * Session context state
 */
interface SessionContextState {
  /** Current test state */
  testState: TestState

  /** Selected questions for this session */
  selectedQuestions: SelectedQuestions

  /** Current session status */
  status: SessionStatus

  /** Last session error if any */
  lastError: SessionError | null

  /** Auto-save status */
  autoSave: AutoSaveStatus

  /** Session recovery information */
  recovery: SessionRecovery | null

  /** Whether session context is initialized */
  isInitialized: boolean

  /** Whether storage is available */
  hasStorage: boolean
}

/**
 * Session context actions
 */
type SessionAction =
  | {
      type: 'INITIALIZE_SESSION'
      payload: { testState: TestState; selectedQuestions: SelectedQuestions }
    }
  | { type: 'LOAD_SESSION_SUCCESS'; payload: SessionData }
  | { type: 'LOAD_SESSION_ERROR'; payload: SessionError }
  | { type: 'UPDATE_TEST_STATE'; payload: Partial<TestState> }
  | { type: 'UPDATE_SELECTED_QUESTIONS'; payload: SelectedQuestions }
  | { type: 'SET_STATUS'; payload: SessionStatus }
  | { type: 'SET_AUTO_SAVE_STATUS'; payload: Partial<AutoSaveStatus> }
  | { type: 'SET_RECOVERY_INFO'; payload: SessionRecovery | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'STORAGE_UNAVAILABLE' }

/**
 * Create initial test state
 */
function createInitialTestState(): TestState {
  return {
    anthemText: '',
    historyAnswers: {},
    constitutionAnswers: {},
    startTime: Date.now(),
    lastSaved: 0,
    isCompleted: false,
    currentSection: 'anthem',
    selectedQuestions: {
      history: [],
      constitution: [],
      selectionMetadata: {
        randomSeed: Date.now(),
        selectedAt: Date.now(),
        selectedIds: {
          history: [],
          constitution: [],
        },
      },
    },
    metadata: {
      sessionId: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      attemptNumber: 1,
      darkMode: false,
    },
  }
}

/**
 * Create initial selected questions
 */
function createInitialSelectedQuestions(): SelectedQuestions {
  return {
    history: [],
    constitution: [],
    selectionMetadata: {
      randomSeed: Date.now(),
      selectedAt: Date.now(),
      selectedIds: {
        history: [],
        constitution: [],
      },
    },
  }
}

/**
 * Initial session state
 */
const initialState: SessionContextState = {
  testState: createInitialTestState(),
  selectedQuestions: createInitialSelectedQuestions(),
  status: 'missing',
  lastError: null,
  autoSave: {
    lastSave: 0,
    failedAttempts: 0,
    isActive: false,
    nextSave: 0,
    saving: false,
  },
  recovery: null,
  isInitialized: false,
  hasStorage: isSessionStorageAvailable(),
}

/**
 * Session state reducer
 */
function sessionReducer(
  state: SessionContextState,
  action: SessionAction
): SessionContextState {
  switch (action.type) {
    case 'INITIALIZE_SESSION':
      return {
        ...state,
        testState: action.payload.testState,
        selectedQuestions: action.payload.selectedQuestions,
        status: 'active',
        isInitialized: true,
        autoSave: {
          ...state.autoSave,
          isActive: true,
          nextSave: Date.now() + 30000, // 30 seconds
        },
      }

    case 'LOAD_SESSION_SUCCESS':
      return {
        ...state,
        testState: action.payload.testState,
        selectedQuestions: action.payload.selectedQuestions,
        status: 'active',
        lastError: null,
        isInitialized: true,
        autoSave: {
          ...state.autoSave,
          lastSave: action.payload.metadata.lastUpdated,
          isActive: true,
          failedAttempts: 0,
          nextSave: Date.now() + 30000,
        },
      }

    case 'LOAD_SESSION_ERROR':
      return {
        ...state,
        lastError: action.payload,
        status:
          action.payload.code === 'SESSION_EXPIRED' ? 'expired' : 'corrupted',
        recovery: action.payload.recoverable
          ? {
              canRecover: true,
              options: [
                {
                  id: 'start-fresh',
                  description: 'Start a new exam session',
                  dataPreview: {
                    lastSaved: 0,
                    progressPercentage: 0,
                    completedSections: [],
                    dataAge: 'N/A',
                    integrityCheck: 'unknown',
                  },
                  confidence: 'high',
                  requiresConfirmation: true,
                },
              ],
              recommendedOption: {
                id: 'start-fresh',
                description: 'Start a new exam session',
                dataPreview: {
                  lastSaved: 0,
                  progressPercentage: 0,
                  completedSections: [],
                  dataAge: 'N/A',
                  integrityCheck: 'unknown',
                },
                confidence: 'high',
                requiresConfirmation: true,
              },
            }
          : null,
      }

    case 'UPDATE_TEST_STATE':
      return {
        ...state,
        testState: {
          ...state.testState,
          ...action.payload,
          lastSaved: state.autoSave.lastSave,
        },
      }

    case 'UPDATE_SELECTED_QUESTIONS':
      return {
        ...state,
        selectedQuestions: action.payload,
      }

    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
      }

    case 'SET_AUTO_SAVE_STATUS':
      return {
        ...state,
        autoSave: {
          ...state.autoSave,
          ...action.payload,
        },
      }

    case 'SET_RECOVERY_INFO':
      return {
        ...state,
        recovery: action.payload,
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        lastError: null,
      }

    case 'SESSION_EXPIRED':
      return {
        ...state,
        status: 'expired',
        autoSave: {
          ...state.autoSave,
          isActive: false,
        },
      }

    case 'STORAGE_UNAVAILABLE':
      return {
        ...state,
        hasStorage: false,
        status: 'missing',
        autoSave: {
          ...state.autoSave,
          isActive: false,
        },
      }

    default:
      return state
  }
}

/**
 * Session context interface
 */
interface SessionContextValue {
  /** Current session state */
  state: SessionContextState

  /** Initialize new session */
  initializeSession: (
    testState: TestState,
    selectedQuestions: SelectedQuestions
  ) => void

  /** Load existing session */
  loadSession: () => Promise<boolean>

  /** Update test state */
  updateTestState: (updates: Partial<TestState>) => void

  /** Update selected questions */
  updateSelectedQuestions: (questions: SelectedQuestions) => void

  /** Manually trigger save */
  saveSession: () => Promise<boolean>

  /** Clear session data */
  clearSession: () => void

  /** Recover from error state */
  recoverSession: (optionId: string) => void

  /** Extend session expiry */
  extendSessionExpiry: () => Promise<boolean>

  /** Check if auto-save is working */
  isAutoSaveWorking: () => boolean
}

/**
 * Session context
 */
const SessionContext = createContext<SessionContextValue | null>(null)

/**
 * Session context provider props
 */
interface SessionProviderProps {
  children: React.ReactNode
  autoSaveInterval?: number
  onSessionExpiry?: () => void
  onStorageError?: (error: SessionError) => void
}

/**
 * Session context provider
 */
export function SessionProvider({
  children,
  autoSaveInterval = 30000, // 30 seconds
  onSessionExpiry,
  onStorageError,
}: SessionProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, initialState)

  // Refs for stable callbacks
  const autoSaveIntervalRef = useRef<number | null>(null)
  const onSessionExpiryRef = useRef(onSessionExpiry)
  const onStorageErrorRef = useRef(onStorageError)

  // Update refs when props change
  useEffect(() => {
    onSessionExpiryRef.current = onSessionExpiry
    onStorageErrorRef.current = onStorageError
  })

  /**
   * Perform auto-save operation
   */
  const performAutoSave = useCallback(async () => {
    if (
      !state.hasStorage ||
      !state.autoSave.isActive ||
      state.autoSave.saving
    ) {
      return
    }

    dispatch({ type: 'SET_AUTO_SAVE_STATUS', payload: { saving: true } })

    try {
      const result = await saveSessionData(
        state.testState,
        state.selectedQuestions,
        state.testState.metadata.sessionId
      )

      if (result.success) {
        dispatch({
          type: 'SET_AUTO_SAVE_STATUS',
          payload: {
            lastSave: result.timestamp,
            failedAttempts: 0,
            saving: false,
            nextSave: Date.now() + autoSaveInterval,
          },
        })

        // Update test state with new lastSaved timestamp
        dispatch({
          type: 'UPDATE_TEST_STATE',
          payload: { lastSaved: result.timestamp },
        })
      } else {
        const newFailedAttempts = state.autoSave.failedAttempts + 1

        dispatch({
          type: 'SET_AUTO_SAVE_STATUS',
          payload: {
            failedAttempts: newFailedAttempts,
            saving: false,
            lastError: result.error,
            // Exponential backoff for retries
            nextSave:
              Date.now() +
              autoSaveInterval * Math.pow(2, Math.min(newFailedAttempts, 4)),
          },
        })

        // Notify about storage errors
        if (result.error && onStorageErrorRef.current) {
          onStorageErrorRef.current(result.error)
        }
      }
    } catch {
      dispatch({
        type: 'SET_AUTO_SAVE_STATUS',
        payload: {
          failedAttempts: state.autoSave.failedAttempts + 1,
          saving: false,
          nextSave: Date.now() + autoSaveInterval,
        },
      })
    }
  }, [
    state.hasStorage,
    state.autoSave.isActive,
    state.autoSave.saving,
    state.testState,
    state.selectedQuestions,
    autoSaveInterval,
  ])

  /**
   * Initialize new session
   */
  const initializeSession = useCallback(
    (testState: TestState, selectedQuestions: SelectedQuestions) => {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const initializedTestState = {
        ...testState,
        startTime: Date.now(),
        metadata: {
          ...testState.metadata,
          sessionId,
        },
      }

      dispatch({
        type: 'INITIALIZE_SESSION',
        payload: {
          testState: initializedTestState,
          selectedQuestions,
        },
      })
    },
    []
  )

  /**
   * Load existing session
   */
  const loadSession = useCallback(async (): Promise<boolean> => {
    if (!state.hasStorage) {
      dispatch({ type: 'STORAGE_UNAVAILABLE' })
      return false
    }

    const result = loadSessionData()

    if (result.success && result.sessionData) {
      dispatch({ type: 'LOAD_SESSION_SUCCESS', payload: result.sessionData })
      return true
    } else if (result.error) {
      dispatch({ type: 'LOAD_SESSION_ERROR', payload: result.error })

      if (
        result.error.code === 'SESSION_EXPIRED' &&
        onSessionExpiryRef.current
      ) {
        onSessionExpiryRef.current()
      }

      return false
    }

    return false
  }, [state.hasStorage])

  /**
   * Update test state
   */
  const updateTestState = useCallback((updates: Partial<TestState>) => {
    dispatch({ type: 'UPDATE_TEST_STATE', payload: updates })
  }, [])

  /**
   * Update selected questions
   */
  const updateSelectedQuestions = useCallback(
    (questions: SelectedQuestions) => {
      dispatch({ type: 'UPDATE_SELECTED_QUESTIONS', payload: questions })
    },
    []
  )

  /**
   * Manually save session
   */
  const saveSession = useCallback(async (): Promise<boolean> => {
    if (!state.hasStorage) {
      return false
    }

    const result = await saveSessionData(
      state.testState,
      state.selectedQuestions,
      state.testState.metadata.sessionId
    )

    if (result.success) {
      dispatch({
        type: 'SET_AUTO_SAVE_STATUS',
        payload: {
          lastSave: result.timestamp,
          failedAttempts: 0,
        },
      })

      dispatch({
        type: 'UPDATE_TEST_STATE',
        payload: { lastSaved: result.timestamp },
      })

      return true
    } else if (result.error && onStorageErrorRef.current) {
      onStorageErrorRef.current(result.error)
    }

    return false
  }, [state.hasStorage, state.testState, state.selectedQuestions])

  /**
   * Clear session data
   */
  const clearSession = useCallback(() => {
    clearSessionData()
    dispatch({ type: 'SET_STATUS', payload: 'missing' })
    dispatch({
      type: 'SET_AUTO_SAVE_STATUS',
      payload: {
        isActive: false,
        lastSave: 0,
        failedAttempts: 0,
      },
    })
  }, [])

  /**
   * Recover from error state
   */
  const recoverSession = useCallback(
    (optionId: string) => {
      if (optionId === 'start-fresh') {
        clearSession()
        const newTestState = createInitialTestState()
        const newQuestions = createInitialSelectedQuestions()
        initializeSession(newTestState, newQuestions)
      }

      dispatch({ type: 'SET_RECOVERY_INFO', payload: null })
      dispatch({ type: 'CLEAR_ERROR' })
    },
    [clearSession, initializeSession]
  )

  /**
   * Extend session expiry
   */
  const extendSessionExpiry = useCallback(async (): Promise<boolean> => {
    if (!state.hasStorage) {
      return false
    }

    return await extendSession()
  }, [state.hasStorage])

  /**
   * Check if auto-save is working
   */
  const isAutoSaveWorking = useCallback((): boolean => {
    const now = Date.now()
    const timeSinceLastSave = now - state.autoSave.lastSave
    const maxAllowedGap = autoSaveInterval * 3 // Allow 3 intervals before considering it broken

    return (
      state.autoSave.isActive &&
      state.autoSave.failedAttempts < 3 &&
      (state.autoSave.lastSave === 0 || timeSinceLastSave < maxAllowedGap)
    )
  }, [state.autoSave, autoSaveInterval])

  // Auto-save interval effect
  useEffect(() => {
    if (!state.autoSave.isActive || !state.hasStorage) {
      return
    }

    const scheduleNextSave = () => {
      const now = Date.now()
      const timeUntilNextSave = Math.max(0, state.autoSave.nextSave - now)

      autoSaveIntervalRef.current = window.setTimeout(() => {
        performAutoSave()
        scheduleNextSave()
      }, timeUntilNextSave || autoSaveInterval)
    }

    scheduleNextSave()

    return () => {
      if (autoSaveIntervalRef.current) {
        clearTimeout(autoSaveIntervalRef.current)
        autoSaveIntervalRef.current = null
      }
    }
  }, [
    state.autoSave.isActive,
    state.autoSave.nextSave,
    state.hasStorage,
    performAutoSave,
    autoSaveInterval,
  ])

  // Save on window blur and visibility change
  useEffect(() => {
    if (!state.autoSave.isActive) {
      return
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        performAutoSave()
      }
    }

    const handleBeforeUnload = () => {
      // Synchronous save attempt
      if (state.hasStorage) {
        try {
          saveSessionData(
            state.testState,
            state.selectedQuestions,
            state.testState.metadata.sessionId
          )
        } catch {
          // Silent fail on page unload
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('blur', performAutoSave)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('blur', performAutoSave)
    }
  }, [
    state.autoSave.isActive,
    state.hasStorage,
    state.testState,
    state.selectedQuestions,
    performAutoSave,
  ])

  // Context value
  const contextValue = useMemo(
    (): SessionContextValue => ({
      state,
      initializeSession,
      loadSession,
      updateTestState,
      updateSelectedQuestions,
      saveSession,
      clearSession,
      recoverSession,
      extendSessionExpiry,
      isAutoSaveWorking,
    }),
    [
      state,
      initializeSession,
      loadSession,
      updateTestState,
      updateSelectedQuestions,
      saveSession,
      clearSession,
      recoverSession,
      extendSessionExpiry,
      isAutoSaveWorking,
    ]
  )

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}

/**
 * Hook to use session context
 */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

/**
 * Hook to get session status
 */
export function useSessionStatus() {
  const { state } = useSession()

  return useMemo(
    () => ({
      status: state.status,
      isInitialized: state.isInitialized,
      hasStorage: state.hasStorage,
      lastError: state.lastError,
      recovery: state.recovery,
      autoSave: state.autoSave,
    }),
    [
      state.status,
      state.isInitialized,
      state.hasStorage,
      state.lastError,
      state.recovery,
      state.autoSave,
    ]
  )
}
