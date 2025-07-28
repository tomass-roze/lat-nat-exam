/**
 * @fileoverview Validation context for form-wide validation state management
 *
 * Provides React context for real-time validation state, error aggregation,
 * and submission readiness calculation across all exam sections.
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
  ValidationResult,
  ValidationState,
  RealTimeValidationConfig,
  ValidationTrigger,
} from '@/types/validation'
import type { TestState } from '@/types/exam'
import type { ExamSection } from '@/types/constants'
import {
  validateTestState,
  isSectionValid,
  getSectionErrors,
} from '@/utils/validation'

/**
 * Default real-time validation configuration
 */
const DEFAULT_VALIDATION_CONFIG: RealTimeValidationConfig = {
  enabled: true,
  triggers: ['onChange', 'onBlur'],
  debounceDelay: 300,
  showErrorsImmediately: false,
  showWarnings: true,
  showInfo: true,
}

/**
 * Validation context state
 */
interface ValidationContextState extends ValidationState {
  /** Whether validation is currently in progress */
  isValidating: boolean
  /** Whether errors should be shown to user */
  showErrors: boolean
}

/**
 * Validation context actions
 */
type ValidationAction =
  | { type: 'SET_VALIDATING'; payload: boolean }
  | { type: 'SET_VALIDATION_RESULT'; payload: ValidationResult }
  | { type: 'SET_SHOW_ERRORS'; payload: boolean }
  | { type: 'UPDATE_CONFIG'; payload: Partial<RealTimeValidationConfig> }
  | {
      type: 'ADD_HISTORY_ENTRY'
      payload: {
        trigger: ValidationTrigger
        result: ValidationResult
        field?: string
      }
    }

/**
 * Initial validation state
 */
const initialState: ValidationContextState = {
  results: {
    isValid: false,
    isSubmissionReady: false,
    fieldResults: {},
    globalErrors: [],
    summary: {
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      errorsBySeverity: { error: 0, warning: 0, info: 0 },
      completionPercentage: 0,
      criticalIssues: [],
    },
    metadata: {
      startedAt: Date.now(),
      completedAt: Date.now(),
      duration: 0,
      appliedRules: [],
      validatorVersion: '1.0.0',
    },
  },
  isValidating: false,
  lastValidated: 0,
  config: DEFAULT_VALIDATION_CONFIG,
  history: [],
  showErrors: false,
}

/**
 * Validation state reducer
 */
function validationReducer(
  state: ValidationContextState,
  action: ValidationAction
): ValidationContextState {
  switch (action.type) {
    case 'SET_VALIDATING':
      return { ...state, isValidating: action.payload }

    case 'SET_VALIDATION_RESULT':
      return {
        ...state,
        results: action.payload,
        lastValidated: Date.now(),
        isValidating: false,
      }

    case 'SET_SHOW_ERRORS':
      return { ...state, showErrors: action.payload }

    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      }

    case 'ADD_HISTORY_ENTRY': {
      const newEntry = {
        timestamp: Date.now(),
        trigger: action.payload.trigger,
        result: action.payload.result,
        field: action.payload.field,
      }

      return {
        ...state,
        history: [...state.history.slice(-49), newEntry], // Keep last 50 entries
      }
    }

    default:
      return state
  }
}

/**
 * Validation context interface
 */
interface ValidationContextValue {
  /** Current validation state */
  state: ValidationContextState
  /** Validate the entire test state */
  validateAll: (testState: TestState, trigger?: ValidationTrigger) => void
  /** Validate a specific section */
  validateSection: (
    section: ExamSection,
    testState: TestState,
    trigger?: ValidationTrigger
  ) => void
  /** Check if a specific section is valid */
  isSectionValid: (section: ExamSection) => boolean
  /** Get errors for a specific section */
  getSectionErrors: (
    section: ExamSection
  ) => import('@/types/validation').ValidationError[]
  /** Update validation configuration */
  updateConfig: (config: Partial<RealTimeValidationConfig>) => void
  /** Show/hide validation errors */
  setShowErrors: (show: boolean) => void
  /** Clear validation state */
  clearValidation: () => void
}

/**
 * Validation context
 */
const ValidationContext = createContext<ValidationContextValue | null>(null)

/**
 * Validation context provider props
 */
interface ValidationProviderProps {
  children: React.ReactNode
  config?: Partial<RealTimeValidationConfig>
}

/**
 * Validation context provider
 */
export function ValidationProvider({
  children,
  config,
}: ValidationProviderProps) {
  const [state, dispatch] = useReducer(validationReducer, {
    ...initialState,
    config: { ...DEFAULT_VALIDATION_CONFIG, ...config },
  })

  // Use refs for frequently changing values to prevent callback recreation
  const validationTimeoutRef = useRef<number | null>(null)
  const configRef = useRef(state.config)

  // Update config ref when it changes
  useEffect(() => {
    configRef.current = state.config
  }, [state.config])

  /**
   * Debounced validation function with stable dependencies
   */
  const performValidation = useCallback(
    (
      testState: TestState,
      trigger: ValidationTrigger = 'onChange',
      field?: string
    ) => {
      if (!configRef.current.enabled) return

      // Clear existing timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
        validationTimeoutRef.current = null
      }

      // Set validating state
      dispatch({ type: 'SET_VALIDATING', payload: true })

      // Create debounced validation
      const timeoutId = window.setTimeout(() => {
        try {
          const result = validateTestState(testState)

          dispatch({ type: 'SET_VALIDATION_RESULT', payload: result })
          dispatch({
            type: 'ADD_HISTORY_ENTRY',
            payload: { trigger, result, field },
          })

          // Show errors immediately if configured or after blur event
          if (configRef.current.showErrorsImmediately || trigger === 'onBlur') {
            dispatch({ type: 'SET_SHOW_ERRORS', payload: true })
          }
        } catch (error) {
          console.error('Validation error:', error)
          dispatch({ type: 'SET_VALIDATING', payload: false })
        }
      }, configRef.current.debounceDelay)

      validationTimeoutRef.current = timeoutId
    },
    [] // Empty dependencies - all values come from refs
  )

  /**
   * Validate entire test state
   */
  const validateAll = useCallback(
    (testState: TestState, trigger: ValidationTrigger = 'onChange') => {
      performValidation(testState, trigger)
    },
    [performValidation]
  )

  /**
   * Validate specific section
   */
  const validateSection = useCallback(
    (
      section: ExamSection,
      testState: TestState,
      trigger: ValidationTrigger = 'onChange'
    ) => {
      performValidation(testState, trigger, section)
    },
    [performValidation]
  )

  /**
   * Check if section is valid
   */
  const checkSectionValid = useCallback(
    (section: ExamSection): boolean => {
      return isSectionValid(state.results, section)
    },
    [state.results]
  )

  /**
   * Get section errors
   */
  const getErrors = useCallback(
    (section: ExamSection) => {
      return getSectionErrors(state.results, section)
    },
    [state.results]
  )

  /**
   * Update validation configuration
   */
  const updateConfig = useCallback(
    (newConfig: Partial<RealTimeValidationConfig>) => {
      dispatch({ type: 'UPDATE_CONFIG', payload: newConfig })
    },
    []
  )

  /**
   * Set whether to show validation errors
   */
  const setShowErrors = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_ERRORS', payload: show })
  }, [])

  /**
   * Clear validation state
   */
  const clearValidation = useCallback(() => {
    dispatch({ type: 'SET_VALIDATION_RESULT', payload: initialState.results })
    dispatch({ type: 'SET_SHOW_ERRORS', payload: false })
  }, [])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  const contextValue = useMemo(
    (): ValidationContextValue => ({
      state,
      validateAll,
      validateSection,
      isSectionValid: checkSectionValid,
      getSectionErrors: getErrors,
      updateConfig,
      setShowErrors,
      clearValidation,
    }),
    [
      // Only depend on essential state properties that actually change
      state.results,
      state.isValidating,
      state.showErrors,
      state.lastValidated,
      // All callbacks are stable due to useCallback with stable deps
      validateAll,
      validateSection,
      checkSectionValid,
      getErrors,
      updateConfig,
      setShowErrors,
      clearValidation,
    ]
  )

  return (
    <ValidationContext.Provider value={contextValue}>
      {children}
    </ValidationContext.Provider>
  )
}

/**
 * Hook to use validation context
 */
export function useValidation(): ValidationContextValue {
  const context = useContext(ValidationContext)
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider')
  }
  return context
}

/**
 * Hook to get validation state for a specific section
 */
export function useSectionValidation(section: ExamSection) {
  const { state, getSectionErrors, isSectionValid } = useValidation()

  return useMemo(
    () => ({
      isValid: isSectionValid(section),
      errors: getSectionErrors(section),
      isValidating: state.isValidating,
      showErrors: state.showErrors,
    }),
    [
      section,
      isSectionValid,
      getSectionErrors,
      state.isValidating,
      state.showErrors,
    ]
  )
}

/**
 * Hook to get overall validation status
 */
export function useValidationStatus() {
  const { state, setShowErrors } = useValidation()

  return useMemo(
    () => ({
      isValid: state.results.isValid,
      isSubmissionReady: state.results.isSubmissionReady,
      completionPercentage: state.results.summary.completionPercentage,
      errorCount: state.results.summary.errorCount,
      criticalIssues: state.results.summary.criticalIssues,
      isValidating: state.isValidating,
      showErrors: state.showErrors,
      setShowErrors,
    }),
    [state, setShowErrors]
  )
}

/**
 * Hook for form submission with validation
 */
export function useFormSubmission() {
  const { state, validateAll, setShowErrors } = useValidation()

  const canSubmit = useMemo(() => {
    return state.results.isSubmissionReady && !state.isValidating
  }, [state.results.isSubmissionReady, state.isValidating])

  const prepareSubmission = useCallback(
    (testState: TestState): Promise<boolean> => {
      return new Promise((resolve) => {
        // Force validation and show all errors
        setShowErrors(true)
        validateAll(testState, 'onSubmit')

        // Wait for validation to complete
        const checkValidation = () => {
          if (!state.isValidating) {
            resolve(state.results.isSubmissionReady)
          } else {
            setTimeout(checkValidation, 50)
          }
        }

        checkValidation()
      })
    },
    [
      validateAll,
      setShowErrors,
      state.isValidating,
      state.results.isSubmissionReady,
    ]
  )

  return {
    canSubmit,
    prepareSubmission,
    validationResult: state.results,
  }
}
