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
      const entry = this.errorLog.find(e => 
        this.generateErrorKey(e.error) === errorKey
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
      entry => entry.error.timestamp >= startTime
    )

    const byCategory = {} as Record<ErrorCategory, number>
    const bySeverity = {} as Record<ErrorSeverity, number>
    const errorCounts = new Map<string, number>()

    recentErrors.forEach(entry => {
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
        const error = recentErrors.find(e => e.error.id === errorId)?.error
        return {
          errorId,
          count,
          message: error?.message || 'Unknown error',
        }
      })

    const recoveredErrors = recentErrors.filter(
      entry => entry.recoverySuccessful === true
    ).length
    const totalRecoveryAttempts = recentErrors.filter(
      entry => entry.recoverySuccessful !== undefined
    ).length
    const recoverySuccessRate = totalRecoveryAttempts > 0 
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
    const keyParts = [
      error.category,
      error.message,
      error.details || '',
    ]
    
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
  private createFullContext(partialContext: Partial<ErrorContext>): ErrorContext {
    const fullContext: ErrorContext = {
      environment: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenSize: {
          width: window.screen.width,
          height: window.screen.height,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookieEnabled: navigator.cookieEnabled,
        localStorage: this.checkStorageAvailable('localStorage'),
        sessionStorage: this.checkStorageAvailable('sessionStorage'),
      },
      ...partialContext,
    }

    // Add performance information if available
    if (window.performance) {
      fullContext.performance = {
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        timing: performance.timing,
        navigation: performance.navigation,
      }
    }

    // Add network information if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      fullContext.network = {
        quality: this.determineNetworkQuality(connection),
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      }
    }

    return fullContext
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
  private checkStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
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
    const style = this.getConsoleStyle(error.severity)
    
    console.group(`%c[ERROR LOGGER] ${error.category.toUpperCase()}`, style)
    console.error('Error:', error)
    console.log('Context:', context)
    console.groupEnd()
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
    setInterval(() => {
      try {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        this.errorLog = this.errorLog.filter(
          entry => entry.error.timestamp > oneDayAgo
        )
        this.persistErrorLog()
        
        // Clean up deduplication cache
        Object.keys(this.deduplicationCache).forEach(key => {
          const cached = this.deduplicationCache[key]
          if (Date.now() - cached.lastSeen > 60 * 60 * 1000) {
            delete this.deduplicationCache[key]
          }
        })
      } catch (error) {
        console.warn('Error during periodic cleanup:', error)
      }
    }, 60 * 60 * 1000) // 1 hour
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
 * Convenience function to create and log a runtime error
 */
export function logRuntimeError(
  originalError: Error,
  component?: string,
  boundary?: string,
  context?: Partial<ErrorContext>
): string {
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

  return logError(runtimeError, context)
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