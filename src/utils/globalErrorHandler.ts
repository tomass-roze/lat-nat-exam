/**
 * @fileoverview Global Error Handler for JavaScript Runtime Errors
 *
 * Implements comprehensive global error handling for unhandled JavaScript errors,
 * unhandled promise rejections, and other runtime issues with intelligent recovery
 * and user notification strategies.
 */

import type {
  ApplicationError,
  ErrorHandlerResult,
  ErrorRecoveryStrategy,
  ErrorNotificationPreferences,
  ErrorRecoveryAction,
} from '@/types/errors'
import { errorLogger } from './errorLogger'

/**
 * Global error handler configuration
 */
interface GlobalErrorHandlerConfig {
  /** Whether to handle window.onerror events */
  handleWindowErrors: boolean
  /** Whether to handle unhandled promise rejections */
  handlePromiseRejections: boolean
  /** Whether to attempt automatic recovery */
  attemptAutoRecovery: boolean
  /** Maximum number of errors before showing degradation warning */
  maxErrorsBeforeWarning: number
  /** Time window for error counting (ms) */
  errorCountingWindow: number
  /** Whether to show error notifications to users */
  showUserNotifications: boolean
  /** Notification preferences */
  notificationPreferences: ErrorNotificationPreferences
  /** Recovery strategies for different error types */
  recoveryStrategies: ErrorRecoveryStrategy[]
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: GlobalErrorHandlerConfig = {
  handleWindowErrors: true,
  handlePromiseRejections: true,
  attemptAutoRecovery: true,
  maxErrorsBeforeWarning: 5,
  errorCountingWindow: 60000, // 1 minute
  showUserNotifications: true,
  notificationPreferences: {
    showNotifications: true,
    notificationTimeout: 5000,
    showTechnicalDetails: process.env.NODE_ENV === 'development',
    position: 'top',
    soundEnabled: false,
    vibrationEnabled: false,
  },
  recoveryStrategies: [
    {
      categories: ['runtime'],
      automaticActions: ['retry'],
      maxRetries: 3,
      retryDelay: 1000,
      useExponentialBackoff: true,
      suggestedUserActions: ['refresh', 'restart'],
      fallbackStrategy: 'refresh',
    },
    {
      categories: ['network'],
      automaticActions: ['retry'],
      maxRetries: 5,
      retryDelay: 2000,
      useExponentialBackoff: true,
      suggestedUserActions: ['retry', 'refresh'],
      fallbackStrategy: 'fallback',
    },
    {
      categories: ['storage'],
      automaticActions: ['fallback'],
      maxRetries: 1,
      retryDelay: 500,
      useExponentialBackoff: false,
      suggestedUserActions: ['refresh', 'contact'],
      fallbackStrategy: 'restart',
    },
  ],
}

/**
 * Error tracking for degradation detection
 */
interface ErrorTracker {
  count: number
  windowStart: number
  recentErrors: Array<{
    timestamp: number
    category: string
    severity: string
  }>
}

/**
 * Global Error Handler Class
 */
export class GlobalErrorHandler {
  private config: GlobalErrorHandlerConfig
  private errorTracker: ErrorTracker = {
    count: 0,
    windowStart: Date.now(),
    recentErrors: [],
  }
  private isInitialized = false
  private originalErrorHandler?: OnErrorEventHandler
  private originalRejectionHandler?: (event: PromiseRejectionEvent) => void
  private notificationContainer?: HTMLElement

  constructor(config: Partial<GlobalErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize global error handling
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('Global error handler already initialized')
      return
    }

    try {
      if (this.config.handleWindowErrors) {
        this.setupWindowErrorHandler()
      }

      if (this.config.handlePromiseRejections) {
        this.setupPromiseRejectionHandler()
      }

      if (this.config.showUserNotifications) {
        this.setupNotificationContainer()
      }

      this.isInitialized = true
      console.log('Global error handler initialized successfully')
    } catch (error) {
      console.error('Failed to initialize global error handler:', error)
    }
  }

  /**
   * Cleanup global error handling
   */
  public cleanup(): void {
    if (!this.isInitialized) return

    try {
      // Restore original handlers
      if (this.originalErrorHandler) {
        window.onerror = this.originalErrorHandler
      }

      if (this.originalRejectionHandler) {
        window.removeEventListener(
          'unhandledrejection',
          this.originalRejectionHandler
        )
      }

      // Remove notification container
      if (this.notificationContainer) {
        this.notificationContainer.remove()
      }

      this.isInitialized = false
      console.log('Global error handler cleaned up')
    } catch (error) {
      console.error('Failed to cleanup global error handler:', error)
    }
  }

  /**
   * Handle an error with recovery attempts
   */
  public async handleError(
    error: ApplicationError,
    context: any = {}
  ): Promise<ErrorHandlerResult> {
    try {
      // Log the error
      const errorKey = errorLogger.logError(error, context)

      // Update error tracking
      this.updateErrorTracking(error)

      // Check if we should show degradation warning
      if (this.shouldShowDegradationWarning()) {
        this.showDegradationWarning()
      }

      // Find appropriate recovery strategy
      const strategy = this.findRecoveryStrategy(error)

      if (!strategy || !this.config.attemptAutoRecovery) {
        return {
          handled: true,
          actionsTaken: [],
          requiresUserAction: true,
          userMessage: this.getUserMessage(error),
          technicalMessage: error.details,
          shouldContinue: error.recoverable,
        }
      }

      // Attempt automatic recovery
      const recoveryResult = await this.attemptRecovery(error, strategy)

      // Mark error as handled
      errorLogger.markErrorHandled(
        errorKey,
        recoveryResult.actionsTaken,
        recoveryResult.handled
      )

      // Show user notification if needed
      if (this.config.showUserNotifications && !recoveryResult.handled) {
        this.showErrorNotification(error, recoveryResult)
      }

      return recoveryResult
    } catch (handlingError) {
      console.error('Error while handling error:', handlingError)
      return {
        handled: false,
        actionsTaken: [],
        requiresUserAction: true,
        userMessage: 'Radās neparedzēta kļūda. Lūdzu, pārlādējiet lapu.',
        shouldContinue: false,
      }
    }
  }

  /**
   * Setup window.onerror handler
   */
  private setupWindowErrorHandler(): void {
    // Store original handler
    this.originalErrorHandler = window.onerror

    window.onerror = (message, source, lineno, colno, error) => {
      // Call original handler first
      if (this.originalErrorHandler) {
        this.originalErrorHandler(message, source, lineno, colno, error)
      }

      // Create error object
      const runtimeError: ApplicationError = {
        id: `window-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: typeof message === 'string' ? message : 'Nezināma kļūda',
        details: error?.stack || `${source}:${lineno}:${colno}`,
        severity: 'error',
        category: 'runtime',
        timestamp: Date.now(),
        recoverable: true,
        suggestedActions: ['refresh', 'retry'],
        context: {
          source,
          line: lineno,
          column: colno,
        },
        originalError:
          error || new Error(message?.toString() || 'Unknown error'),
        stack: error?.stack,
      }

      // Handle the error asynchronously
      setTimeout(() => {
        this.handleError(runtimeError, {
          source: 'window.onerror',
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        })
      }, 0)

      // Return true to prevent default error handling
      return true
    }
  }

  /**
   * Setup unhandled promise rejection handler
   */
  private setupPromiseRejectionHandler(): void {
    const handler = (event: PromiseRejectionEvent) => {
      // Prevent default unhandled rejection logging
      event.preventDefault()

      const reason = event.reason
      let error: ApplicationError

      if (reason instanceof Error) {
        error = {
          id: `promise-rejection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          message: reason.message || 'Neapstrādāta Promise noraidīšana',
          details: reason.stack,
          severity: 'error',
          category: 'runtime',
          timestamp: Date.now(),
          recoverable: true,
          suggestedActions: ['retry', 'refresh'],
          originalError: reason,
          stack: reason.stack,
        }
      } else {
        // Handle non-Error rejections
        error = {
          id: `promise-rejection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          message: 'Neapstrādāta Promise noraidīšana',
          details: String(reason),
          severity: 'warning',
          category: 'runtime',
          timestamp: Date.now(),
          recoverable: true,
          suggestedActions: ['retry'],
          context: { rejectionReason: reason },
        }
      }

      // Handle the error asynchronously
      setTimeout(() => {
        this.handleError(error, {
          source: 'unhandledrejection',
          promiseReason: reason,
          timestamp: Date.now(),
        })
      }, 0)
    }

    this.originalRejectionHandler = handler
    window.addEventListener('unhandledrejection', handler)
  }

  /**
   * Setup notification container
   */
  private setupNotificationContainer(): void {
    if (this.notificationContainer) return

    const container = document.createElement('div')
    container.id = 'error-notification-container'
    container.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10000;
      pointer-events: none;
      max-width: 400px;
    `

    document.body.appendChild(container)
    this.notificationContainer = container
  }

  /**
   * Update error tracking for degradation detection
   */
  private updateErrorTracking(error: ApplicationError): void {
    const now = Date.now()

    // Reset window if needed
    if (now - this.errorTracker.windowStart > this.config.errorCountingWindow) {
      this.errorTracker = {
        count: 0,
        windowStart: now,
        recentErrors: [],
      }
    }

    // Add current error
    this.errorTracker.count++
    this.errorTracker.recentErrors.push({
      timestamp: now,
      category: error.category,
      severity: error.severity,
    })

    // Limit recent errors array size
    if (this.errorTracker.recentErrors.length > 20) {
      this.errorTracker.recentErrors = this.errorTracker.recentErrors.slice(-20)
    }
  }

  /**
   * Check if we should show degradation warning
   */
  private shouldShowDegradationWarning(): boolean {
    return this.errorTracker.count >= this.config.maxErrorsBeforeWarning
  }

  /**
   * Show degradation warning to user
   */
  private showDegradationWarning(): void {
    // Only show once per session
    if (sessionStorage.getItem('degradation-warning-shown')) {
      return
    }

    const warning = {
      id: `degradation-warning-${Date.now()}`,
      message:
        'Aplikācija saskārusies ar vairākām kļūdām. Ieteicams pārlādēt lapu.',
      severity: 'warning' as const,
      category: 'performance' as const,
      timestamp: Date.now(),
      recoverable: true,
      suggestedActions: ['refresh', 'contact'] as ErrorRecoveryAction[],
    }

    this.showErrorNotification(warning, {
      handled: false,
      actionsTaken: [],
      requiresUserAction: true,
      shouldContinue: true,
    })

    sessionStorage.setItem('degradation-warning-shown', 'true')
  }

  /**
   * Find appropriate recovery strategy for error
   */
  private findRecoveryStrategy(
    error: ApplicationError
  ): ErrorRecoveryStrategy | null {
    return (
      this.config.recoveryStrategies.find((strategy) =>
        strategy.categories.includes(error.category)
      ) || null
    )
  }

  /**
   * Attempt automatic recovery
   */
  private async attemptRecovery(
    error: ApplicationError,
    strategy: ErrorRecoveryStrategy
  ): Promise<ErrorHandlerResult> {
    const actionsTaken: ErrorRecoveryAction[] = []
    let currentDelay = strategy.retryDelay

    for (const action of strategy.automaticActions) {
      try {
        const success = await this.executeRecoveryAction(action, currentDelay)
        actionsTaken.push(action)

        if (success) {
          return {
            handled: true,
            actionsTaken,
            requiresUserAction: false,
            shouldContinue: true,
          }
        }

        // Increase delay for next attempt if using exponential backoff
        if (strategy.useExponentialBackoff) {
          currentDelay *= 2
        }
      } catch (recoveryError) {
        console.warn(`Recovery action ${action} failed:`, recoveryError)
      }
    }

    // Recovery failed
    return {
      handled: false,
      actionsTaken,
      requiresUserAction: true,
      userMessage: this.getUserMessage(error),
      technicalMessage: error.details,
      shouldContinue: error.recoverable,
    }
  }

  /**
   * Execute a recovery action
   */
  private async executeRecoveryAction(
    action: ErrorRecoveryAction,
    delay: number
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, delay))

    switch (action) {
      case 'retry':
        // For network errors, we might be able to retry the failed operation
        return this.retryNetworkOperation()

      case 'fallback':
        // Enable fallback mode for the application
        return this.enableFallbackMode()

      case 'refresh':
        // This would typically be handled by user action
        return false

      default:
        return false
    }
  }

  /**
   * Retry network operation
   */
  private async retryNetworkOperation(): Promise<boolean> {
    // This is a placeholder - in real implementation, we'd need to store
    // information about the failed network request and retry it
    return navigator.onLine
  }

  /**
   * Enable fallback mode
   */
  private enableFallbackMode(): boolean {
    // Set fallback mode in session storage for components to use
    try {
      sessionStorage.setItem('app-fallback-mode', 'true')

      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('fallback-mode-enabled'))

      return true
    } catch {
      return false
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserMessage(error: ApplicationError): string {
    switch (error.category) {
      case 'network':
        return 'Savienojums ar internetu ir pārtraukts. Lūdzu, pārbaudiet interneta savienojumu un mēģinājiet vēlreiz.'

      case 'storage':
        return 'Problēma ar datu saglabāšanu. Iespējams, pārlādācijai tiek nepieciešama lapa.'

      case 'runtime':
        return 'Radās tehniska problēma. Lūdzu, mēģinājiet vēlreiz vai pārlādējiet lapu.'

      case 'compatibility':
        return 'Jūsu pārlūks var nebūt pilnībā atbalstīts. Lūdzu, izmantojiet jaunāku pārlūka versiju.'

      default:
        return (
          error.message ||
          'Radās neparedzēta problēma. Lūdzu, mēģinājiet vēlreiz.'
        )
    }
  }

  /**
   * Show error notification to user
   */
  private showErrorNotification(
    error: ApplicationError,
    result: ErrorHandlerResult
  ): void {
    if (!this.notificationContainer) return

    const notification = document.createElement('div')
    notification.style.cssText = `
      background: ${error.severity === 'critical' || error.severity === 'error' ? '#fee2e2' : '#fef3c7'};
      border: 1px solid ${error.severity === 'critical' || error.severity === 'error' ? '#fca5a5' : '#fbbf24'};
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 0.5rem;
      pointer-events: auto;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    `

    const title = document.createElement('div')
    title.style.cssText = 'font-weight: 600; margin-bottom: 0.5rem;'
    title.textContent =
      error.severity === 'critical' || error.severity === 'error'
        ? 'Radās kļūda'
        : 'Brīdinājums'

    const message = document.createElement('div')
    message.style.cssText = 'font-size: 0.875rem; margin-bottom: 0.75rem;'
    message.textContent = result.userMessage || this.getUserMessage(error)

    const actions = document.createElement('div')
    actions.style.cssText = 'display: flex; gap: 0.5rem;'

    if (error.suggestedActions.includes('refresh')) {
      const refreshBtn = document.createElement('button')
      refreshBtn.textContent = 'Pārlādēt lapu'
      refreshBtn.style.cssText = `
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.25rem;
        padding: 0.25rem 0.75rem;
        font-size: 0.875rem;
        cursor: pointer;
      `
      refreshBtn.onclick = () => window.location.reload()
      actions.appendChild(refreshBtn)
    }

    const dismissBtn = document.createElement('button')
    dismissBtn.textContent = 'Aizvērt'
    dismissBtn.style.cssText = `
      background: transparent;
      color: #6b7280;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      padding: 0.25rem 0.75rem;
      font-size: 0.875rem;
      cursor: pointer;
    `
    dismissBtn.onclick = () => notification.remove()
    actions.appendChild(dismissBtn)

    notification.appendChild(title)
    notification.appendChild(message)
    notification.appendChild(actions)
    this.notificationContainer.appendChild(notification)

    // Auto-dismiss after timeout
    if (this.config.notificationPreferences.notificationTimeout > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove()
        }
      }, this.config.notificationPreferences.notificationTimeout)
    }

    // Add CSS animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `
    if (!document.querySelector('#error-notification-styles')) {
      style.id = 'error-notification-styles'
      document.head.appendChild(style)
    }
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new GlobalErrorHandler()

/**
 * Initialize global error handling
 */
export function initializeGlobalErrorHandling(
  config?: Partial<GlobalErrorHandlerConfig>
): void {
  if (config) {
    // Create new instance with custom config
    const customHandler = new GlobalErrorHandler(config)
    customHandler.initialize()
  } else {
    globalErrorHandler.initialize()
  }
}

/**
 * Cleanup global error handling
 */
export function cleanupGlobalErrorHandling(): void {
  globalErrorHandler.cleanup()
}
