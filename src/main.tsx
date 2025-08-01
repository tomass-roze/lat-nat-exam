import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

// Initialize global error handling
import { initializeGlobalErrorHandling } from './utils/globalErrorHandler'

// Initialize global error handling before anything else
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

// Initialize memory management system
import { initializeMemoryManagement } from './utils/memoryCleanup'
initializeMemoryManagement()

// Initialize question preloading for better performance
import { initializeQuestionPreloading } from './utils/questionLoader'
initializeQuestionPreloading()

// Initialize performance monitoring
import { initializePerformanceMonitoring } from './utils/performanceMonitoring'
initializePerformanceMonitoring()

// Initialize caching system
import { initializeCaching } from './utils/cacheStrategies'
initializeCaching()

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
    <App />
  </StrictMode>
)
