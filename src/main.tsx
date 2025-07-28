import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

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
