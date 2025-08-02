/**
 * @fileoverview Error type definitions for comprehensive error handling
 *
 * Defines interfaces and types for structured error handling, logging,
 * and recovery mechanisms throughout the Latvian citizenship exam application.
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info'

/**
 * Error categories for better organization and handling
 */
export type ErrorCategory =
  | 'runtime' // JavaScript runtime errors
  | 'network' // Network connectivity and API errors
  | 'validation' // User input and form validation errors
  | 'storage' // SessionStorage and data persistence errors
  | 'performance' // Performance-related issues
  | 'compatibility' // Browser compatibility issues
  | 'security' // Security-related errors
  | 'accessibility' // Accessibility feature errors
  | 'ui' // UI component errors
  | 'business' // Business logic errors

/**
 * Error recovery actions available to users
 */
export type ErrorRecoveryAction =
  | 'retry' // Try the operation again
  | 'refresh' // Refresh the page/component
  | 'restart' // Restart the entire application
  | 'fallback' // Use fallback functionality
  | 'contact' // Contact support
  | 'ignore' // Continue despite error
  | 'export' // Export data before fixing

/**
 * Browser compatibility levels
 */
export type CompatibilityLevel = 'supported' | 'limited' | 'unsupported'

/**
 * Network connection quality indicators
 */
export type NetworkQuality =
  | 'excellent'
  | 'good'
  | 'poor'
  | 'offline'
  | 'unknown'

/**
 * Base error interface
 */
export interface BaseError {
  /** Unique error identifier */
  id: string
  /** Error message in user's language */
  message: string
  /** Technical error details (for developers) */
  details?: string
  /** Error severity level */
  severity: ErrorSeverity
  /** Error category */
  category: ErrorCategory
  /** Timestamp when error occurred */
  timestamp: number
  /** Whether error can be recovered from */
  recoverable: boolean
  /** Suggested user actions */
  suggestedActions: ErrorRecoveryAction[]
  /** Additional context data */
  context?: Record<string, unknown>
}

/**
 * JavaScript runtime error
 */
export interface RuntimeError extends BaseError {
  category: 'runtime'
  /** Original Error object */
  originalError: Error
  /** Stack trace */
  stack?: string
  /** Component where error occurred */
  component?: string
  /** Error boundary that caught it */
  boundary?: string
}

/**
 * Network error
 */
export interface NetworkError extends BaseError {
  category: 'network'
  /** HTTP status code if applicable */
  statusCode?: number
  /** Request URL that failed */
  url?: string
  /** Network quality at time of error */
  networkQuality: NetworkQuality
  /** Whether this is a timeout error */
  isTimeout: boolean
  /** Number of retry attempts made */
  retryCount: number
}

/**
 * Validation error
 */
export interface ValidationError extends BaseError {
  category: 'validation'
  /** Form field that failed validation */
  field: string
  /** Validation rule that failed */
  rule: string
  /** Expected format or value */
  expected?: string
  /** Actual value provided */
  actual?: string
}

/**
 * Storage error
 */
export interface StorageError extends BaseError {
  category: 'storage'
  /** Storage type (sessionStorage, localStorage, etc.) */
  storageType: 'session' | 'local' | 'memory'
  /** Operation that failed */
  operation: 'read' | 'write' | 'delete' | 'clear'
  /** Storage key involved */
  key?: string
  /** Storage quota information */
  quotaInfo?: {
    used: number
    available: number
    exceeded: boolean
  }
}

/**
 * Performance error
 */
export interface PerformanceError extends BaseError {
  category: 'performance'
  /** Performance metric that triggered the error */
  metric: 'memory' | 'cpu' | 'network' | 'render' | 'load'
  /** Measured value that exceeded threshold */
  value: number
  /** Threshold that was exceeded */
  threshold: number
  /** Unit of measurement */
  unit: string
}

/**
 * Browser compatibility error
 */
export interface CompatibilityError extends BaseError {
  category: 'compatibility'
  /** Feature that is not supported */
  feature: string
  /** Browser information */
  browser: {
    name: string
    version: string
    userAgent: string
  }
  /** Compatibility level */
  compatibilityLevel: CompatibilityLevel
  /** Alternative features available */
  alternatives?: string[]
}

/**
 * UI component error
 */
export interface UIError extends BaseError {
  category: 'ui'
  /** Component name where error occurred */
  componentName: string
  /** Component props at time of error */
  props?: Record<string, unknown>
  /** React error info if available */
  errorInfo?: {
    componentStack?: string
    errorBoundary?: string
  }
}

/**
 * Union type for all error types
 */
export type ApplicationError =
  | RuntimeError
  | NetworkError
  | ValidationError
  | StorageError
  | PerformanceError
  | CompatibilityError
  | UIError
  | BaseError

/**
 * Error context information
 */
export interface ErrorContext {
  /** User session information */
  session?: {
    sessionId: string
    duration: number
    isActive: boolean
  }
  /** Application state at time of error */
  appState?: {
    currentSection: string
    progress: number
    isSubmissionReady: boolean
  }
  /** Browser environment information */
  environment?: {
    userAgent: string
    language: string
    screenSize: { width: number; height: number }
    timezone: string
    cookieEnabled: boolean
    localStorage: boolean
    sessionStorage: boolean
  }
  /** Performance metrics */
  performance?: {
    memoryUsage: number
    timing: PerformanceTiming
    navigation: PerformanceNavigation
  }
  /** Network information */
  network?: {
    quality: NetworkQuality
    effectiveType?: string
    downlink?: number
    rtt?: number
  }
  /** Whether error occurred during app initialization */
  isInitialization?: boolean
}

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  /** Error information */
  error: ApplicationError
  /** Additional context */
  context: ErrorContext
  /** Whether error was handled */
  handled: boolean
  /** Recovery actions taken */
  recoveryActions: ErrorRecoveryAction[]
  /** Whether recovery was successful */
  recoverySuccessful?: boolean
  /** User feedback on error handling */
  userFeedback?: {
    helpful: boolean
    comment?: string
  }
}

/**
 * Error statistics
 */
export interface ErrorStatistics {
  /** Total error count */
  totalErrors: number
  /** Errors by category */
  byCategory: Record<ErrorCategory, number>
  /** Errors by severity */
  bySeverity: Record<ErrorSeverity, number>
  /** Most common errors */
  topErrors: Array<{
    errorId: string
    count: number
    message: string
  }>
  /** Recovery success rate */
  recoverySuccessRate: number
  /** Time period for these statistics */
  period: {
    start: number
    end: number
  }
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Whether to collect error statistics */
  collectStatistics: boolean
  /** Maximum number of errors to log */
  maxLogEntries: number
  /** Error rate limiting (errors per minute) */
  rateLimitPerMinute: number
  /** Whether to show technical details in dev mode */
  showTechnicalDetails: boolean
  /** Whether to attempt automatic recovery */
  attemptAutoRecovery: boolean
  /** Network timeout for error reporting */
  networkTimeout: number
  /** Storage quota warning threshold (percentage) */
  storageQuotaWarningThreshold: number
}

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  /** Error categories this strategy applies to */
  categories: ErrorCategory[]
  /** Automatic recovery actions to attempt */
  automaticActions: ErrorRecoveryAction[]
  /** Maximum number of automatic retry attempts */
  maxRetries: number
  /** Delay between retry attempts (in ms) */
  retryDelay: number
  /** Whether to use exponential backoff for retries */
  useExponentialBackoff: boolean
  /** User actions to suggest */
  suggestedUserActions: ErrorRecoveryAction[]
  /** Fallback strategy if recovery fails */
  fallbackStrategy?: ErrorRecoveryAction
}

/**
 * Error notification preferences
 */
export interface ErrorNotificationPreferences {
  /** Show error notifications to user */
  showNotifications: boolean
  /** Notification timeout (0 = persistent) */
  notificationTimeout: number
  /** Show technical details */
  showTechnicalDetails: boolean
  /** Notification position */
  position: 'top' | 'bottom' | 'center'
  /** Sound notifications */
  soundEnabled: boolean
  /** Vibration notifications (mobile) */
  vibrationEnabled: boolean
}

/**
 * Error handler result
 */
export interface ErrorHandlerResult {
  /** Whether error was handled successfully */
  handled: boolean
  /** Actions taken to handle the error */
  actionsTaken: ErrorRecoveryAction[]
  /** Whether user intervention is required */
  requiresUserAction: boolean
  /** User-friendly message to display */
  userMessage?: string
  /** Technical message for developers */
  technicalMessage?: string
  /** Whether application should continue */
  shouldContinue: boolean
}
