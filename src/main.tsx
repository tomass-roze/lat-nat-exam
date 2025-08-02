import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './styles/index.css'

// Initialize global error handling
import { initializeGlobalErrorHandling } from './utils/globalErrorHandler'

// Initialize global error handling before anything else with safe error handling
try {
  initializeGlobalErrorHandling({
    showUserNotifications: true,
    attemptAutoRecovery: true,
    maxErrorsBeforeWarning: 3,
    errorCountingWindow: 30000, // 30 seconds
    notificationPreferences: {
      showNotifications: true,
      notificationTimeout: 8000, // 8 seconds
      showTechnicalDetails: process.env.NODE_ENV === 'development',
      position: 'top',
      soundEnabled: false,
      vibrationEnabled: false,
    },
  })
  console.log('Global error handling initialized successfully')
} catch (initError) {
  console.error('Failed to initialize global error handling:', initError)
  // Continue with application startup even if error handling fails
}

// Initialize memory management system
import { initializeMemoryManagement } from './utils/memoryCleanup'
try {
  initializeMemoryManagement()
  console.log('Memory management initialized')
} catch (error) {
  console.warn('Failed to initialize memory management:', error)
}

// Initialize question preloading for better performance
import { initializeQuestionPreloading } from './utils/questionLoader'
try {
  initializeQuestionPreloading()
  console.log('Question preloading initialized')
} catch (error) {
  console.warn('Failed to initialize question preloading:', error)
}

// Initialize performance monitoring
import { initializePerformanceMonitoring } from './utils/performanceMonitoring'
try {
  initializePerformanceMonitoring()
  console.log('Performance monitoring initialized')
} catch (error) {
  console.warn('Failed to initialize performance monitoring:', error)
}

// Initialize caching system
import { initializeCaching } from './utils/cacheStrategies'
try {
  initializeCaching()
  console.log('Caching system initialized')
} catch (error) {
  console.warn('Failed to initialize caching system:', error)
}

// Initialize browser compatibility detection early
import { initializeBrowserCompatibility } from './utils/browserCompatibility'
try {
  initializeBrowserCompatibility()
  console.log('Browser compatibility detection initialized')
} catch (error) {
  console.warn('Failed to initialize browser compatibility detection:', error)
}

// Initialize axe-core for development accessibility testing
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react')
    .then((axe) => {
      import('react').then((React) => {
        import('react-dom').then((ReactDOM) => {
          axe.default(React, ReactDOM, 1000)
        })
      })
    })
    .catch(() => {
      // Silently fail if axe-core fails to load
    })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
