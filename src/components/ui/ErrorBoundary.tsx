/**
 * @fileoverview Enhanced error boundary component for graceful error handling
 *  
 * Provides React error boundary functionality with fallback UI,
 * error reporting, and integration with global error handling system.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw, Download, Bug } from 'lucide-react'
import { logRuntimeError, exportErrorLog } from '@/utils/errorLogger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Component name for better error tracking */
  componentName?: string
  /** Whether this is a critical component */
  isCritical?: boolean
  /** Whether to show detailed error information */
  showDetails?: boolean
  /** Whether to attempt automatic recovery */
  enableAutoRecovery?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  retryCount: number
  lastErrorTime: number
}

export class ErrorBoundary extends Component<Props, State> {
  private autoRecoveryTimeout: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, lastErrorTime: Date.now() }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'UnknownComponent'
    
    // Log error to global error handling system
    const errorId = logRuntimeError(
      error,
      componentName,
      'ErrorBoundary',
      {
        session: this.getSessionInfo(),
      }
    )

    this.setState({
      error,
      errorInfo,
      errorId,
    })

    // Call the error callback if provided
    this.props.onError?.(error, errorInfo)

    // Attempt automatic recovery if enabled and not too many retries
    if (this.props.enableAutoRecovery && this.state.retryCount < 3) {
      this.scheduleAutoRecovery()
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ErrorBoundary: ${componentName}`)
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  componentWillUnmount() {
    if (this.autoRecoveryTimeout) {
      clearTimeout(this.autoRecoveryTimeout)
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      errorId: null,
      retryCount: this.state.retryCount + 1
    })
  }

  handleExportError = () => {
    try {
      const errorData = exportErrorLog()
      const blob = new Blob([errorData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `error-log-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (exportError) {
      console.error('Failed to export error log:', exportError)
    }
  }

  private scheduleAutoRecovery = () => {
    // Try to recover after 3 seconds
    this.autoRecoveryTimeout = window.setTimeout(() => {
      console.log(`Attempting auto-recovery for ${this.props.componentName}`)
      this.handleReset()
    }, 3000)
  }

  private getSessionInfo = () => {
    try {
      const sessionData = sessionStorage.getItem('latvian-exam-session')
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        return {
          sessionId: parsed.sessionId || 'unknown',
          duration: Date.now() - (parsed.testState?.startTime || Date.now()),
          isActive: !parsed.testState?.isCompleted,
        }
      }
    } catch {
      // Ignore parsing errors
    }
    return undefined
  }


  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="p-4 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Komponentes kļūda</strong>
                    {this.props.componentName && (
                      <Badge variant="outline" className="ml-2">
                        {this.props.componentName}
                      </Badge>
                    )}
                    {this.props.isCritical && (
                      <Badge variant="destructive" className="ml-2">
                        Kritiska komponente
                      </Badge>
                    )}
                  </div>
                  {this.state.errorId && (
                    <Badge variant="secondary" className="text-xs">
                      ID: {this.state.errorId.substring(0, 8)}
                    </Badge>
                  )}
                </div>
                
                <div>
                  Radās neparedzēta kļūda komponentē. Lūdzu, mēģinājiet vēlreiz.
                  {this.state.retryCount > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Mēģinājumi: {this.state.retryCount}/3
                    </div>
                  )}
                </div>

                {this.props.enableAutoRecovery && this.state.retryCount < 3 && (
                  <div className="text-sm text-blue-600">
                    ⚡ Automātiska atjaunošana pēc 3 sekundēm...
                  </div>
                )}

                {(this.props.showDetails || process.env.NODE_ENV === 'development') && this.state.error && (
                  <details className="text-xs">
                    <summary className="cursor-pointer hover:text-foreground">
                      Tehniskā informācija {process.env.NODE_ENV === 'development' ? '(izstrādes režīms)' : ''}
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div className="font-mono text-xs bg-muted p-2 rounded">
                        <strong>Kļūda:</strong> {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <div className="font-mono text-xs bg-muted p-2 rounded max-h-32 overflow-y-auto">
                          <strong>Stack trace:</strong>
                          <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div className="font-mono text-xs bg-muted p-2 rounded max-h-32 overflow-y-auto">
                          <strong>Component stack:</strong>
                          <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-2">
            <Button onClick={this.handleReset} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Mēģināt vēlreiz
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
            >
              Pārlādēt lapu
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={this.handleExportError}
                variant="ghost"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Eksportēt kļūdu
              </Button>
            )}
            {this.props.isCritical && (
              <Button
                onClick={() => {
                  sessionStorage.clear()
                  window.location.reload()
                }}
                variant="destructive"
                size="sm"
              >
                <Bug className="h-4 w-4 mr-2" />
                Ārkārtas atjaunošana
              </Button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error handler for functional components
 */
export function useErrorHandler(componentName?: string) {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // Log to global error handling system
    logRuntimeError(
      error,
      componentName || 'UnknownComponent',
      'useErrorHandler',
      {
        session: getSessionInfo(),
      }
    )

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 useErrorHandler: ${componentName || 'UnknownComponent'}`)
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.groupEnd()
    }
  }
}

/**
 * Enhanced higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
    componentName?: string
    isCritical?: boolean
    enableAutoRecovery?: boolean
    showDetails?: boolean
  } = {}
) {
  const {
    fallback,
    onError,
    componentName = Component.displayName || Component.name || 'WrappedComponent',
    isCritical = false,
    enableAutoRecovery = true,
    showDetails = false,
  } = options

  const WrappedComponent = function(props: P) {
    return (
      <ErrorBoundary
        fallback={fallback}
        onError={onError}
        componentName={componentName}
        isCritical={isCritical}
        enableAutoRecovery={enableAutoRecovery}
        showDetails={showDetails}
      >
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${componentName})`
  return WrappedComponent
}

/**
 * Section-specific error boundary for exam sections
 */
export function SectionErrorBoundary({ 
  children, 
  sectionName,
  isCritical = true 
}: { 
  children: ReactNode
  sectionName: string
  isCritical?: boolean 
}) {
  return (
    <ErrorBoundary
      componentName={`${sectionName}Section`}
      isCritical={isCritical}
      enableAutoRecovery={!isCritical}
      showDetails={process.env.NODE_ENV === 'development'}
      fallback={
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <strong>Sadaļas kļūda: {sectionName}</strong>
              </div>
              <div>
                Šajā eksāmena sadaļā radās kļūda. Lūdzu, pārlādējiet lapu vai sazinieties ar atbalstu.
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Pārlādēt lapu
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Utility function to get session info (used by error handlers)
 */
function getSessionInfo() {
  try {
    const sessionData = sessionStorage.getItem('latvian-exam-session')
    if (sessionData) {
      const parsed = JSON.parse(sessionData)
      return {
        sessionId: parsed.sessionId || 'unknown',
        duration: Date.now() - (parsed.testState?.startTime || Date.now()),
        isActive: !parsed.testState?.isCompleted,
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return undefined
}
