/**
 * @fileoverview Centralized Error Logging and Reporting System
 *
 * Provides structured error logging, storage, aggregation, and reporting
 * for the Latvian citizenship exam application with privacy-conscious design.
 */

import type {
  ApplicationError,
  ErrorLogEntry,
  ErrorContext,
  ErrorStatistics,
  ErrorHandlerConfig,
  ErrorSeverity,
  ErrorCategory,
  NetworkQuality,
  ErrorRecoveryAction,
} from '@/types/errors'

/**
 * Default error handler configuration
 */
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  collectStatistics: true,
  maxLogEntries: 1000,
  rateLimitPerMinute: 60,
  showTechnicalDetails: process.env.NODE_ENV === 'development',
  attemptAutoRecovery: true,
  networkTimeout: 5000,
  storageQuotaWarningThreshold: 85,
}

/**
 * Local storage keys for error logging
 */
const STORAGE_KEYS = {
  ERROR_LOG: 'latvian-exam-error-log',
  ERROR_STATS: 'latvian-exam-error-stats',
  ERROR_CONFIG: 'latvian-exam-error-config',
  RATE_LIMIT: 'latvian-exam-rate-limit',
} as const

/**
 * Rate limiting state
 */
interface RateLimitState {
  count: number
  resetTime: number
}

/**
 * Error deduplication cache
 */
interface ErrorDeduplicationCache {
  [key: string]: {
    count: number
    lastSeen: number
    firstSeen: number
  }
}

/**
 * Centralized Error Logger Class
 */
export class ErrorLogger {
  private config: ErrorHandlerConfig
  private errorLog: ErrorLogEntry[] = []
  private rateLimitState: RateLimitState = { count: 0, resetTime: 0 }
  private deduplicationCache: ErrorDeduplicationCache = {}
  private isInitialized = false

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initialize()
  }

  /**
   * Initialize the error logger
   */
  private initialize(): void {
    if (this.isInitialized) return

    try {
      // Load existing error log
      this.loadErrorLog()

      // Load rate limiting state
      this.loadRateLimitState()

      // Set up periodic cleanup
      this.setupPeriodicCleanup()

      this.isInitialized = true
    } catch (error) {
      console.warn('Failed to initialize error logger:', error)
    }
  }

  /**
   * Log an error
   */
  public logError(
    error: ApplicationError,
    context: Partial<ErrorContext> = {},
    recoveryActions: ErrorRecoveryAction[] = []
  ): string {
    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        console.warn('Error logging rate limit exceeded')
        return ''
      }

      // Generate error key for deduplication
      const errorKey = this.generateErrorKey(error)

      // Check for duplicate errors
      if (this.isDuplicateError(errorKey)) {
        this.updateDuplicateError(errorKey)
        return errorKey
      }

      // Create full context
      const fullContext = this.createFullContext(context)

      // Create log entry
      const logEntry: ErrorLogEntry = {
        error,
        context: fullContext,
        handled: false,
        recoveryActions,
        recoverySuccessful: undefined,
      }

      // Add to error log
      this.errorLog.push(logEntry)

      // Update deduplication cache
      this.updateDeduplicationCache(errorKey)

      // Persist to storage
      this.persistErrorLog()

      // Update statistics
      this.updateStatistics()

      // Console logging for development
      if (this.config.showTechnicalDetails) {
        this.logToConsole(error, fullContext)
      }

      return errorKey
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
      return ''
    }
  }

  /**
   * Mark an error as handled
   */
  public markErrorHandled(
    errorKey: string,
    recoveryActions: ErrorRecoveryAction[],
    successful: boolean
  ): void {
    try {
      const entry = this.errorLog.find(
        (e) => this.generateErrorKey(e.error) === errorKey
      )

      if (entry) {
        entry.handled = true
        entry.recoveryActions = [...entry.recoveryActions, ...recoveryActions]
        entry.recoverySuccessful = successful
        this.persistErrorLog()
      }
    } catch (error) {
      console.warn('Failed to mark error as handled:', error)
    }
  }

  /**
   * Get error statistics
   */
  public getStatistics(periodMs = 24 * 60 * 60 * 1000): ErrorStatistics {
    const endTime = Date.now()
    const startTime = endTime - periodMs

    const recentErrors = this.errorLog.filter(
      (entry) => entry.error.timestamp >= startTime
    )

    const byCategory = {} as Record<ErrorCategory, number>
    const bySeverity = {} as Record<ErrorSeverity, number>
    const errorCounts = new Map<string, number>()

    recentErrors.forEach((entry) => {
      const { error } = entry
      byCategory[error.category] = (byCategory[error.category] || 0) + 1
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1

      const errorId = error.id
      errorCounts.set(errorId, (errorCounts.get(errorId) || 0) + 1)
    })

    const topErrors = Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([errorId, count]) => {
        const error = recentErrors.find((e) => e.error.id === errorId)?.error
        return {
          errorId,
          count,
          message: error?.message || 'Unknown error',
        }
      })

    const recoveredErrors = recentErrors.filter(
      (entry) => entry.recoverySuccessful === true
    ).length
    const totalRecoveryAttempts = recentErrors.filter(
      (entry) => entry.recoverySuccessful !== undefined
    ).length
    const recoverySuccessRate =
      totalRecoveryAttempts > 0
        ? (recoveredErrors / totalRecoveryAttempts) * 100
        : 0

    return {
      totalErrors: recentErrors.length,
      byCategory,
      bySeverity,
      topErrors,
      recoverySuccessRate,
      period: { start: startTime, end: endTime },
    }
  }

  /**
   * Export error log for debugging
   */
  public exportErrorLog(): string {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        config: this.config,
        errorLog: this.errorLog,
        statistics: this.getStatistics(),
        deduplicationCache: this.deduplicationCache,
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Failed to export error log:', error)
      return JSON.stringify({ error: 'Export failed' })
    }
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    try {
      this.errorLog = []
      this.deduplicationCache = {}
      this.persistErrorLog()
      this.clearStorage(STORAGE_KEYS.ERROR_STATS)
    } catch (error) {
      console.warn('Failed to clear error log:', error)
    }
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(count = 10): ErrorLogEntry[] {
    return this.errorLog
      .slice(-count)
      .sort((a, b) => b.error.timestamp - a.error.timestamp)
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(): boolean {
    const now = Date.now()

    // Reset rate limit if time window has passed
    if (now > this.rateLimitState.resetTime) {
      this.rateLimitState = {
        count: 0,
        resetTime: now + 60000, // 1 minute
      }
    }

    // Check if under limit
    if (this.rateLimitState.count >= this.config.rateLimitPerMinute) {
      return false
    }

    this.rateLimitState.count++
    this.persistRateLimitState()
    return true
  }

  /**
   * Generate error key for deduplication
   */
  private generateErrorKey(error: ApplicationError): string {
    const keyParts = [error.category, error.message, error.details || '']

    // Add specific fields based on error type
    if (error.category === 'runtime' && 'stack' in error) {
      // Use first few lines of stack trace for runtime errors
      const stackLines = error.stack?.split('\n').slice(0, 3).join('\n') || ''
      keyParts.push(stackLines)
    }

    return btoa(keyParts.join('|')).substring(0, 16)
  }

  /**
   * Check if error is duplicate
   */
  private isDuplicateError(errorKey: string): boolean {
    const cached = this.deduplicationCache[errorKey]
    if (!cached) return false

    // Consider it duplicate if seen within last 5 minutes
    const timeSinceLastSeen = Date.now() - cached.lastSeen
    return timeSinceLastSeen < 5 * 60 * 1000
  }

  /**
   * Update duplicate error
   */
  private updateDuplicateError(errorKey: string): void {
    const cached = this.deduplicationCache[errorKey]
    if (cached) {
      cached.count++
      cached.lastSeen = Date.now()
    }
  }

  /**
   * Update deduplication cache
   */
  private updateDeduplicationCache(errorKey: string): void {
    const now = Date.now()
    this.deduplicationCache[errorKey] = {
      count: 1,
      lastSeen: now,
      firstSeen: now,
    }
  }

  /**
   * Create full error context
   */
  private createFullContext(
    partialContext: Partial<ErrorContext>
  ): ErrorContext {
    try {
      const fullContext: ErrorContext = {
        environment: {
          userAgent: navigator.userAgent?.substring(0, 200) || 'Unknown',
          language: navigator.language || 'Unknown',
          screenSize: {
            width: window.screen?.width || 0,
            height: window.screen?.height || 0,
          },
          timezone: this.getSafeTimezone(),
          cookieEnabled: Boolean(navigator.cookieEnabled),
          localStorage: this.checkStorageAvailable('localStorage'),
          sessionStorage: this.checkStorageAvailable('sessionStorage'),
        },
        ...this.sanitizePartialContext(partialContext),
      }

      // Add performance information if available (safe extraction)
      if (window.performance) {
        fullContext.performance = {
          memoryUsage: this.getSafeMemoryUsage(),
          timing: this.getSafePerformanceTiming(),
          navigation: this.getSafeNavigationInfo(),
        }
      }

      // Add network information if available (safe extraction)
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        if (connection) {
          fullContext.network = {
            quality: this.determineNetworkQuality(connection),
            effectiveType: connection.effectiveType || 'unknown',
            downlink: Number(connection.downlink) || 0,
            rtt: Number(connection.rtt) || 0,
          }
        }
      }

      return fullContext
    } catch (contextError) {
      // Return minimal context if full context creation fails
      console.warn('Failed to create full error context:', contextError)
      return {
        environment: {
          userAgent: 'Context creation failed',
          language: 'unknown',
          screenSize: { width: 0, height: 0 },
          timezone: 'unknown',
          cookieEnabled: false,
          localStorage: false,
          sessionStorage: false,
        },
        session: {
          sessionId: 'context-creation-failed',
          duration: 0,
          isActive: false,
        },
      }
    }
  }

  /**
   * Sanitize partial context to remove complex objects
   */
  private sanitizePartialContext(
    partialContext: Partial<ErrorContext>
  ): Partial<ErrorContext> {
    if (!partialContext || typeof partialContext !== 'object') {
      return {}
    }

    const sanitized: Partial<ErrorContext> = {}

    try {
      // Only include safe, primitive properties
      for (const [key, value] of Object.entries(partialContext)) {
        if (value === null || value === undefined) {
          sanitized[key as keyof ErrorContext] = value
        } else if (key === 'isInitialization' && typeof value === 'boolean') {
          // Handle isInitialization specifically
          sanitized.isInitialization = value
        } else if (typeof value === 'string' || typeof value === 'number') {
          // Handle string and number values
          ;(sanitized as any)[key] = value
        } else if (typeof value === 'boolean' && key !== 'isInitialization') {
          // Handle other boolean values
          ;(sanitized as any)[key] = value
        } else if (key === 'session' && typeof value === 'object') {
          // Safe session data extraction
          const sessionData = value as any
          sanitized.session = {
            sessionId: String(sessionData.sessionId || 'unknown').substring(
              0,
              50
            ),
            duration: Number(sessionData.duration) || 0,
            isActive: Boolean(sessionData.isActive),
          }
        } else {
          // Skip complex objects
          sanitized[key as keyof ErrorContext] = `[${typeof value}]` as any
        }
      }
    } catch (err) {
      console.warn('Failed to sanitize partial context:', err)
    }

    return sanitized
  }

  /**
   * Get safe timezone information
   */
  private getSafeTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
    } catch {
      return 'Unknown'
    }
  }

  /**
   * Get safe memory usage information
   */
  private getSafeMemoryUsage(): number {
    try {
      return (performance as any).memory?.usedJSHeapSize || 0
    } catch {
      return 0
    }
  }

  /**
   * Get safe performance timing information
   */
  private getSafePerformanceTiming(): any {
    try {
      const timing = performance.timing
      if (!timing) return undefined

      // Extract only essential timing info to avoid circular references
      return {
        navigationStart: timing.navigationStart || 0,
        loadEventEnd: timing.loadEventEnd || 0,
        domContentLoadedEventEnd: timing.domContentLoadedEventEnd || 0,
      }
    } catch {
      return undefined
    }
  }

  /**
   * Get safe navigation information
   */
  private getSafeNavigationInfo(): any {
    try {
      const navigation = performance.navigation
      if (!navigation) return undefined

      return {
        type: navigation.type || 0,
        redirectCount: navigation.redirectCount || 0,
      }
    } catch {
      return undefined
    }
  }

  /**
   * Determine network quality
   */
  private determineNetworkQuality(connection: any): NetworkQuality {
    if (!navigator.onLine) return 'offline'
    if (!connection) return 'unknown'

    const { effectiveType, downlink, rtt } = connection

    if (effectiveType === '4g' && downlink > 10 && rtt < 100) {
      return 'excellent'
    }
    if (effectiveType === '4g' || (downlink > 1.5 && rtt < 300)) {
      return 'good'
    }
    return 'poor'
  }

  /**
   * Check if storage is available
   */
  private checkStorageAvailable(
    type: 'localStorage' | 'sessionStorage'
  ): boolean {
    try {
      const storage = window[type]
      const testKey = '__storage_test__'
      storage.setItem(testKey, 'test')
      storage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * Log error to console in development
   */
  private logToConsole(error: ApplicationError, context: ErrorContext): void {
    try {
      const style = this.getConsoleStyle(error.severity)

      console.group(`%c[ERROR LOGGER] ${error.category.toUpperCase()}`, style)

      // Safely log error with circular reference handling
      try {
        console.error('Error:', this.sanitizeForLogging(error))
      } catch (errorLogErr) {
        console.error('Error (sanitized):', {
          id: error.id,
          message: error.message,
          category: error.category,
          severity: error.severity,
          timestamp: error.timestamp,
        })
      }

      // Safely log context with circular reference handling
      try {
        console.log('Context:', this.sanitizeForLogging(context))
      } catch (contextLogErr) {
        console.log('Context (sanitized):', this.createSafeContext(context))
      }

      console.groupEnd()
    } catch (consoleError) {
      // Fallback logging if all else fails
      console.error(
        '[ERROR LOGGER] Failed to log error safely:',
        error.message || 'Unknown error'
      )
    }
  }

  /**
   * Sanitize objects for safe console logging (handles circular references)
   */
  private sanitizeForLogging(obj: any, maxDepth = 3): any {
    const seen = new WeakSet()

    const sanitize = (value: any, depth: number): any => {
      // Depth limit to prevent infinite recursion
      if (depth > maxDepth) {
        return '[Max Depth Reached]'
      }

      // Handle null and undefined
      if (value === null || value === undefined) {
        return value
      }

      // Handle primitives
      if (typeof value !== 'object') {
        return value
      }

      // Handle circular references
      if (seen.has(value)) {
        return '[Circular Reference]'
      }
      seen.add(value)

      // Handle arrays
      if (Array.isArray(value)) {
        return value.slice(0, 10).map((item) => sanitize(item, depth + 1)) // Limit array size
      }

      // Handle DOM elements
      if (value instanceof Element) {
        return `[DOM Element: ${value.tagName}${value.id ? '#' + value.id : ''}]`
      }

      // Handle functions
      if (typeof value === 'function') {
        return `[Function: ${value.name || 'anonymous'}]`
      }

      // Handle Error objects
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack?.split('\n').slice(0, 5).join('\n'), // Limit stack trace
        }
      }

      // Handle React components/elements
      if (
        value.$$typeof ||
        value._owner !== undefined ||
        value.type !== undefined
      ) {
        return '[React Element/Component]'
      }

      // Handle plain objects
      if (value.constructor === Object || value.constructor === undefined) {
        const sanitized: any = {}
        const keys = Object.keys(value).slice(0, 20) // Limit object keys

        for (const key of keys) {
          try {
            sanitized[key] = sanitize(value[key], depth + 1)
          } catch (err) {
            sanitized[key] = '[Error accessing property]'
          }
        }

        if (Object.keys(value).length > 20) {
          sanitized['...'] =
            `[${Object.keys(value).length - 20} more properties]`
        }

        return sanitized
      }

      // For other object types, try to extract basic info
      try {
        return `[Object: ${value.constructor?.name || 'Unknown'}]`
      } catch {
        return '[Complex Object]'
      }
    }

    try {
      return sanitize(obj, 0)
    } catch (err) {
      return `[Sanitization Failed: ${err instanceof Error ? err.message : 'Unknown error'}]`
    }
  }

  /**
   * Create a safe context object with only essential properties
   */
  private createSafeContext(context: ErrorContext): any {
    try {
      return {
        environment: {
          userAgent:
            context.environment?.userAgent?.substring(0, 100) || 'Unknown',
          language: context.environment?.language || 'Unknown',
          screenSize: context.environment?.screenSize || {
            width: 0,
            height: 0,
          },
          timezone: context.environment?.timezone || 'Unknown',
          cookieEnabled: Boolean(context.environment?.cookieEnabled),
          localStorage: Boolean(context.environment?.localStorage),
          sessionStorage: Boolean(context.environment?.sessionStorage),
        },
        performance: context.performance
          ? {
              memoryUsage: context.performance.memoryUsage || 0,
              timingAvailable: Boolean(context.performance.timing),
              navigationAvailable: Boolean(context.performance.navigation),
            }
          : undefined,
        network: context.network
          ? {
              quality: context.network.quality || 'unknown',
              effectiveType: context.network.effectiveType || 'unknown',
              downlink: context.network.downlink || 0,
              rtt: context.network.rtt || 0,
            }
          : undefined,
        session: context.session || undefined,
        // Exclude component and boundary as they're not part of ErrorContext type
        // These are handled in the ApplicationError interface itself
      }
    } catch (err) {
      return {
        session: {
          sessionId: 'safe-context-failed',
          duration: 0,
          isActive: false,
        },
      }
    }
  }

  /**
   * Get console styling for error severity
   */
  private getConsoleStyle(severity: ErrorSeverity): string {
    switch (severity) {
      case 'critical':
        return 'color: white; background-color: red; font-weight: bold;'
      case 'error':
        return 'color: red; font-weight: bold;'
      case 'warning':
        return 'color: orange; font-weight: bold;'
      case 'info':
        return 'color: blue;'
      default:
        return 'color: gray;'
    }
  }

  /**
   * Update error statistics
   */
  private updateStatistics(): void {
    // Statistics are calculated on-demand to avoid storage overhead
    // This method could be extended to maintain running counters if needed
  }

  /**
   * Load error log from storage
   */
  private loadErrorLog(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ERROR_LOG)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.errorLog = Array.isArray(parsed) ? parsed : []

        // Limit log size
        if (this.errorLog.length > this.config.maxLogEntries) {
          this.errorLog = this.errorLog.slice(-this.config.maxLogEntries)
        }
      }
    } catch (error) {
      console.warn('Failed to load error log from storage:', error)
      this.errorLog = []
    }
  }

  /**
   * Persist error log to storage
   */
  private persistErrorLog(): void {
    try {
      // Limit log size before persisting
      const logToStore = this.errorLog.slice(-this.config.maxLogEntries)
      localStorage.setItem(STORAGE_KEYS.ERROR_LOG, JSON.stringify(logToStore))
    } catch (error) {
      console.warn('Failed to persist error log:', error)
    }
  }

  /**
   * Load rate limit state from storage
   */
  private loadRateLimitState(): void {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.RATE_LIMIT)
      if (stored) {
        this.rateLimitState = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load rate limit state:', error)
    }
  }

  /**
   * Persist rate limit state to storage
   */
  private persistRateLimitState(): void {
    try {
      sessionStorage.setItem(
        STORAGE_KEYS.RATE_LIMIT,
        JSON.stringify(this.rateLimitState)
      )
    } catch (error) {
      console.warn('Failed to persist rate limit state:', error)
    }
  }

  /**
   * Clear storage key
   */
  private clearStorage(key: string): void {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to clear storage key ${key}:`, error)
    }
  }

  /**
   * Setup periodic cleanup of old errors
   */
  private setupPeriodicCleanup(): void {
    // Clean up old errors every hour
    setInterval(
      () => {
        try {
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
          this.errorLog = this.errorLog.filter(
            (entry) => entry.error.timestamp > oneDayAgo
          )
          this.persistErrorLog()

          // Clean up deduplication cache
          Object.keys(this.deduplicationCache).forEach((key) => {
            const cached = this.deduplicationCache[key]
            if (Date.now() - cached.lastSeen > 60 * 60 * 1000) {
              delete this.deduplicationCache[key]
            }
          })
        } catch (error) {
          console.warn('Error during periodic cleanup:', error)
        }
      },
      60 * 60 * 1000
    ) // 1 hour
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = new ErrorLogger()

/**
 * Convenience function to log errors
 */
export function logError(
  error: ApplicationError,
  context?: Partial<ErrorContext>,
  recoveryActions?: ErrorRecoveryAction[]
): string {
  return errorLogger.logError(error, context, recoveryActions)
}

/**
 * Create production-specific error context with deployment information
 */
export function createProductionContext(): Partial<ErrorContext> {
  const context: Partial<ErrorContext> = {}
  
  try {
    // Add build and deployment information for production debugging
    const productionInfo = {
      buildMode: process.env.NODE_ENV,
      deploymentTarget: 'vercel',
      userAgent: navigator.userAgent?.substring(0, 200) || 'Unknown',
      timestamp: Date.now(),
      href: window.location.href,
      origin: window.location.origin,
    }
    
    // Add to context in a safe way
    ;(context as any).production = productionInfo
  } catch (error) {
    console.warn('Failed to create production context:', error)
  }
  
  return context
}

/**
 * Convenience function to create and log a runtime error with production enhancements
 */
export function logRuntimeError(
  originalError: Error,
  component?: string,
  boundary?: string,
  context?: Partial<ErrorContext>
): string {
  const enhancedContext = {
    ...context,
    ...(process.env.NODE_ENV === 'production' ? createProductionContext() : {}),
  }

  const runtimeError: ApplicationError = {
    id: `runtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message: originalError.message || 'Nezināma kļūda',
    details: originalError.stack,
    severity: 'error',
    category: 'runtime',
    timestamp: Date.now(),
    recoverable: true,
    suggestedActions: ['refresh', 'retry'],
    context: { component, boundary },
    originalError,
    stack: originalError.stack,
    component,
    boundary,
  }

  return logError(runtimeError, enhancedContext)
}

/**
 * Log initialization errors with enhanced context for production debugging
 */
export function logInitializationError(
  originalError: Error,
  phase: 'question-loading' | 'session-init' | 'browser-compat' | 'component-mount',
  component?: string,
  context?: Partial<ErrorContext>
): string {
  const enhancedContext = {
    ...context,
    isInitialization: true,
    initializationPhase: phase,
    ...(process.env.NODE_ENV === 'production' ? createProductionContext() : {}),
  }

  const initError: ApplicationError = {
    id: `init-${phase}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message: `Initialization failed in ${phase}: ${originalError.message}`,
    details: originalError.stack,
    severity: 'critical',
    category: 'runtime',
    timestamp: Date.now(),
    recoverable: true,
    suggestedActions: ['refresh', 'clear-cache', 'retry'],
    context: { component, boundary: 'initialization' },
    originalError,
    stack: originalError.stack,
    component,
    boundary: 'initialization',
  }

  return logError(initError, enhancedContext)
}

/**
 * Convenience function to create and log a network error
 */
export function logNetworkError(
  message: string,
  url?: string,
  statusCode?: number,
  networkQuality: NetworkQuality = 'unknown',
  context?: Partial<ErrorContext>
): string {
  const networkError: ApplicationError = {
    id: `network-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message,
    severity: 'error',
    category: 'network',
    timestamp: Date.now(),
    recoverable: true,
    suggestedActions: ['retry', 'refresh'],
    url,
    statusCode,
    networkQuality,
    isTimeout: message.toLowerCase().includes('timeout'),
    retryCount: 0,
  }

  return logError(networkError, context)
}

/**
 * Get error statistics
 */
export function getErrorStatistics(periodMs?: number): ErrorStatistics {
  return errorLogger.getStatistics(periodMs)
}

/**
 * Export error log for debugging
 */
export function exportErrorLog(): string {
  return errorLogger.exportErrorLog()
}

/**
 * Clear all error logs
 */
export function clearErrorLogs(): void {
  errorLogger.clearErrorLog()
}
