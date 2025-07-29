/**
 * @fileoverview Debug utilities for development and troubleshooting
 *
 * Provides logging, performance monitoring, and debugging tools
 * for validation and dialog components.
 */

import type { ValidationResult } from '@/types/validation'
import type { TestState } from '@/types/exam'

export interface DebugLog {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  category: string
  message: string
  data?: unknown
}

class DebugLogger {
  private logs: DebugLog[] = []
  private maxLogs = 1000

  log(
    level: DebugLog['level'],
    category: string,
    message: string,
    data?: unknown
  ) {
    const log: DebugLog = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    }

    this.logs.push(log)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date(log.timestamp).toISOString()
      const prefix = `[${timestamp}] [${category}]`

      switch (level) {
        case 'debug':
          console.debug(prefix, message, data)
          break
        case 'info':
          console.info(prefix, message, data)
          break
        case 'warn':
          console.warn(prefix, message, data)
          break
        case 'error':
          console.error(prefix, message, data)
          break
      }
    }
  }

  debug(category: string, message: string, data?: unknown) {
    this.log('debug', category, message, data)
  }

  info(category: string, message: string, data?: unknown) {
    this.log('info', category, message, data)
  }

  warn(category: string, message: string, data?: unknown) {
    this.log('warn', category, message, data)
  }

  error(category: string, message: string, data?: unknown) {
    this.log('error', category, message, data)
  }

  getLogs(category?: string, level?: DebugLog['level']): DebugLog[] {
    return this.logs.filter((log) => {
      if (category && log.category !== category) return false
      if (level && log.level !== level) return false
      return true
    })
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const debugLogger = new DebugLogger()

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private timers: Map<string, number> = new Map()

  start(label: string) {
    this.timers.set(label, performance.now())
    debugLogger.debug('performance', `Started timing: ${label}`)
  }

  end(label: string): number {
    const startTime = this.timers.get(label)
    if (!startTime) {
      debugLogger.warn('performance', `No start time found for: ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(label)

    debugLogger.info('performance', `${label} completed`, {
      duration: `${duration.toFixed(2)}ms`,
    })

    return duration
  }

  measure<T>(label: string, fn: () => T): T {
    this.start(label)
    try {
      const result = fn()
      return result
    } finally {
      this.end(label)
    }
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      return result
    } finally {
      this.end(label)
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Validation debugging utilities
 */
export function logValidationStart(testState: TestState, trigger: string) {
  debugLogger.info('validation', `Starting validation (trigger: ${trigger})`, {
    anthemLength: testState.anthemText.length,
    historyAnswers: Object.keys(testState.historyAnswers).length,
    constitutionAnswers: Object.keys(testState.constitutionAnswers).length,
  })

  performanceMonitor.start('validation')
}

export function logValidationSuccess(result: ValidationResult) {
  const duration = performanceMonitor.end('validation')

  debugLogger.info('validation', 'Validation completed successfully', {
    isValid: result.isValid,
    isSubmissionReady: result.isSubmissionReady,
    duration: `${duration.toFixed(2)}ms`,
    errorCount: result.summary.errorCount,
    completionPercentage: result.summary.completionPercentage,
  })
}

export function logValidationError(error: Error, testState: TestState) {
  performanceMonitor.end('validation')

  debugLogger.error('validation', 'Validation failed', {
    error: error.message,
    stack: error.stack,
    testStateSnapshot: {
      anthemLength: testState.anthemText.length,
      historyAnswers: Object.keys(testState.historyAnswers).length,
      constitutionAnswers: Object.keys(testState.constitutionAnswers).length,
    },
  })
}

/**
 * Dialog debugging utilities
 */
export function logDialogOpen(dialogName: string) {
  debugLogger.info('dialog', `${dialogName} opened`)
}

export function logDialogClose(dialogName: string) {
  debugLogger.info('dialog', `${dialogName} closed`)
}

export function logDialogError(dialogName: string, error: Error) {
  debugLogger.error('dialog', `${dialogName} error`, {
    error: error.message,
    stack: error.stack,
  })
}

/**
 * Focus trap debugging utilities
 */
export function logFocusTrapActivation(success: boolean, error?: Error) {
  if (success) {
    debugLogger.debug('focus-trap', 'Focus trap activated successfully')
  } else {
    debugLogger.warn('focus-trap', 'Focus trap activation failed', {
      error: error?.message,
    })
  }
}

/**
 * Development helper to expose debug utilities to window
 */
if (process.env.NODE_ENV === 'development') {
  ;(window as any).debugUtils = {
    logger: debugLogger,
    performance: performanceMonitor,
    exportLogs: () => debugLogger.exportLogs(),
    clearLogs: () => debugLogger.clearLogs(),
  }
}

/**
 * Error reporting utilities
 */
export function reportError(
  error: Error,
  context: string,
  additionalData?: unknown
) {
  debugLogger.error('error-report', `${context}: ${error.message}`, {
    error: error.message,
    stack: error.stack,
    context,
    additionalData,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  })

  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorService(error, context, additionalData)
  }
}
