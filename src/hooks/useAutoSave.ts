/**
 * @fileoverview Auto-save hook for exam session persistence
 *
 * Provides automated saving functionality with configurable intervals,
 * event-based triggers, and performance optimizations.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SessionError } from '@/types/session'
import type { TestState } from '@/types/exam'
import type { SelectedQuestions } from '@/types/questions'
import { saveSessionData } from '@/utils/sessionStorage'

/**
 * Auto-save configuration options
 */
interface AutoSaveConfig {
  /** Auto-save interval in milliseconds */
  interval: number
  /** Enable saving on window blur */
  saveOnBlur: boolean
  /** Enable saving on visibility change */
  saveOnVisibilityChange: boolean
  /** Enable saving on beforeunload */
  saveOnBeforeUnload: boolean
  /** Maximum retry attempts */
  maxRetries: number
  /** Delay between retries in milliseconds */
  retryDelay: number
  /** Enable debouncing of rapid changes */
  debounce: boolean
  /** Debounce delay in milliseconds */
  debounceDelay: number
}

/**
 * Auto-save status information
 */
interface AutoSaveStatus {
  /** Whether auto-save is currently active */
  isActive: boolean
  /** Last successful save timestamp */
  lastSave: number
  /** Next scheduled save timestamp */
  nextSave: number
  /** Whether a save operation is in progress */
  isSaving: boolean
  /** Number of consecutive failed attempts */
  failedAttempts: number
  /** Total number of successful saves */
  successfulSaves: number
  /** Last error encountered */
  lastError: SessionError | null
  /** Whether auto-save is working reliably */
  isHealthy: boolean
}

/**
 * Auto-save hook return type
 */
interface UseAutoSaveReturn {
  /** Current auto-save status */
  status: AutoSaveStatus
  /** Manually trigger a save */
  save: () => Promise<boolean>
  /** Start auto-save */
  start: () => void
  /** Stop auto-save */
  stop: () => void
  /** Reset failed attempts counter */
  reset: () => void
  /** Update configuration */
  updateConfig: (config: Partial<AutoSaveConfig>) => void
}

/**
 * Default auto-save configuration
 */
const DEFAULT_CONFIG: AutoSaveConfig = {
  interval: 30000, // 30 seconds
  saveOnBlur: true,
  saveOnVisibilityChange: true,
  saveOnBeforeUnload: true,
  maxRetries: 3,
  retryDelay: 1000,
  debounce: true,
  debounceDelay: 1000,
}

/**
 * Auto-save hook for exam session persistence
 */
export function useAutoSave(
  testState: TestState,
  selectedQuestions: SelectedQuestions,
  config: Partial<AutoSaveConfig> = {},
  onSaveSuccess?: (timestamp: number) => void,
  onSaveError?: (error: SessionError) => void
): UseAutoSaveReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // State
  const [status, setStatus] = useState<AutoSaveStatus>({
    isActive: false,
    lastSave: 0,
    nextSave: 0,
    isSaving: false,
    failedAttempts: 0,
    successfulSaves: 0,
    lastError: null,
    isHealthy: true,
  })

  // Refs for stable callbacks and timers
  const intervalRef = useRef<number | null>(null)
  const debounceTimeoutRef = useRef<number | null>(null)
  const retryTimeoutRef = useRef<number | null>(null)
  const configRef = useRef(finalConfig)
  const onSaveSuccessRef = useRef(onSaveSuccess)
  const onSaveErrorRef = useRef(onSaveError)
  const lastStateRef = useRef<{
    testState: TestState
    selectedQuestions: SelectedQuestions
  }>({
    testState,
    selectedQuestions,
  })
  const saveInProgressRef = useRef(false)

  // Update refs when dependencies change
  useEffect(() => {
    configRef.current = finalConfig
    onSaveSuccessRef.current = onSaveSuccess
    onSaveErrorRef.current = onSaveError
    lastStateRef.current = { testState, selectedQuestions }
  }, [finalConfig, onSaveSuccess, onSaveError, testState, selectedQuestions])

  /**
   * Check if state has changed since last save
   */
  const hasStateChanged = useCallback((): boolean => {
    const current = lastStateRef.current
    return (
      JSON.stringify(current.testState) !== JSON.stringify(testState) ||
      JSON.stringify(current.selectedQuestions) !==
        JSON.stringify(selectedQuestions)
    )
  }, [testState, selectedQuestions])

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(
    async (isRetry = false): Promise<boolean> => {
      if (saveInProgressRef.current && !isRetry) {
        return false
      }

      saveInProgressRef.current = true

      setStatus((prev) => ({
        ...prev,
        isSaving: true,
        nextSave: isRetry
          ? prev.nextSave
          : Date.now() + configRef.current.interval,
      }))

      try {
        const result = await saveSessionData(
          testState,
          selectedQuestions,
          testState.metadata.sessionId
        )

        if (result.success) {
          const newStatus: Partial<AutoSaveStatus> = {
            lastSave: result.timestamp,
            failedAttempts: 0,
            successfulSaves: status.successfulSaves + 1,
            lastError: null,
            isSaving: false,
            isHealthy: true,
          }

          setStatus((prev) => ({ ...prev, ...newStatus }))

          // Update last saved state reference
          lastStateRef.current = { testState, selectedQuestions }

          if (onSaveSuccessRef.current) {
            onSaveSuccessRef.current(result.timestamp)
          }

          return true
        } else {
          const newFailedAttempts = status.failedAttempts + 1
          const isHealthy = newFailedAttempts < configRef.current.maxRetries

          const newStatus: Partial<AutoSaveStatus> = {
            failedAttempts: newFailedAttempts,
            lastError: result.error,
            isSaving: false,
            isHealthy,
          }

          setStatus((prev) => ({ ...prev, ...newStatus }))

          if (onSaveErrorRef.current && result.error) {
            onSaveErrorRef.current(result.error)
          }

          // Schedule retry if within retry limit
          if (newFailedAttempts < configRef.current.maxRetries) {
            retryTimeoutRef.current = window.setTimeout(
              () => {
                performSave(true)
              },
              configRef.current.retryDelay * Math.pow(2, newFailedAttempts - 1)
            ) // Exponential backoff
          }

          return false
        }
      } catch (error) {
        const errorObj: SessionError = {
          code: 'SERIALIZATION_ERROR',
          message: 'Failed to save session data',
          details: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        }

        setStatus((prev) => ({
          ...prev,
          failedAttempts: prev.failedAttempts + 1,
          lastError: errorObj,
          isSaving: false,
          isHealthy: prev.failedAttempts < configRef.current.maxRetries - 1,
        }))

        if (onSaveErrorRef.current) {
          onSaveErrorRef.current(errorObj)
        }

        return false
      } finally {
        saveInProgressRef.current = false
      }
    },
    [
      testState,
      selectedQuestions,
      status.failedAttempts,
      status.successfulSaves,
    ]
  )

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback(async (): Promise<boolean> => {
    if (!configRef.current.debounce) {
      return performSave()
    }

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    return new Promise((resolve) => {
      debounceTimeoutRef.current = window.setTimeout(async () => {
        const result = await performSave()
        resolve(result)
      }, configRef.current.debounceDelay)
    })
  }, [performSave])

  /**
   * Manual save function
   */
  const save = useCallback(async (): Promise<boolean> => {
    if (!status.isActive) {
      return false
    }

    return performSave()
  }, [status.isActive, performSave])

  /**
   * Start auto-save
   */
  const start = useCallback(() => {
    if (status.isActive) {
      return
    }

    setStatus((prev) => ({
      ...prev,
      isActive: true,
      nextSave: Date.now() + configRef.current.interval,
    }))
  }, [status.isActive])

  /**
   * Stop auto-save
   */
  const stop = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      isActive: false,
    }))

    // Clear all timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [])

  /**
   * Reset failed attempts
   */
  const reset = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      failedAttempts: 0,
      lastError: null,
      isHealthy: true,
    }))
  }, [])

  /**
   * Update configuration
   */
  const updateConfig = useCallback(
    (newConfig: Partial<AutoSaveConfig>) => {
      configRef.current = { ...configRef.current, ...newConfig }

      // If interval changed and auto-save is active, restart the timer
      if (newConfig.interval && status.isActive) {
        setStatus((prev) => ({
          ...prev,
          nextSave: Date.now() + configRef.current.interval,
        }))
      }
    },
    [status.isActive]
  )

  // Main auto-save interval effect
  useEffect(() => {
    if (!status.isActive) {
      return
    }

    const scheduleNextSave = () => {
      const now = Date.now()
      const timeUntilNextSave = Math.max(0, status.nextSave - now)

      intervalRef.current = window.setTimeout(async () => {
        // Only save if state has changed
        if (hasStateChanged()) {
          await debouncedSave()
        }

        // Schedule next save
        setStatus((prev) => ({
          ...prev,
          nextSave: Date.now() + configRef.current.interval,
        }))

        scheduleNextSave()
      }, timeUntilNextSave || configRef.current.interval)
    }

    scheduleNextSave()

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status.isActive, status.nextSave, hasStateChanged, debouncedSave])

  // Event-based save effects
  useEffect(() => {
    if (!status.isActive) {
      return
    }

    const handleBlur = () => {
      if (configRef.current.saveOnBlur && hasStateChanged()) {
        performSave()
      }
    }

    const handleVisibilityChange = () => {
      if (
        configRef.current.saveOnVisibilityChange &&
        document.hidden &&
        hasStateChanged()
      ) {
        performSave()
      }
    }

    const handleBeforeUnload = () => {
      if (configRef.current.saveOnBeforeUnload && hasStateChanged()) {
        // Synchronous save for beforeunload
        try {
          saveSessionData(
            testState,
            selectedQuestions,
            testState.metadata.sessionId
          )
        } catch {
          // Silent fail during page unload
        }
      }
    }

    if (configRef.current.saveOnBlur) {
      window.addEventListener('blur', handleBlur)
    }

    if (configRef.current.saveOnVisibilityChange) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    if (configRef.current.saveOnBeforeUnload) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [
    status.isActive,
    hasStateChanged,
    performSave,
    testState,
    selectedQuestions,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    save,
    start,
    stop,
    reset,
    updateConfig,
  }
}

/**
 * Simplified auto-save hook with default configuration
 */
export function useSimpleAutoSave(
  testState: TestState,
  selectedQuestions: SelectedQuestions,
  onSaveSuccess?: (timestamp: number) => void,
  onSaveError?: (error: SessionError) => void
) {
  return useAutoSave(
    testState,
    selectedQuestions,
    {},
    onSaveSuccess,
    onSaveError
  )
}
