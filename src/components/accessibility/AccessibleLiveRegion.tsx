import { useEffect, useRef } from 'react'

interface AccessibleLiveRegionProps {
  message: string
  level?: 'polite' | 'assertive' | 'off'
  clearDelay?: number
  className?: string
}

export function AccessibleLiveRegion({
  message,
  level = 'polite',
  clearDelay = 5000,
  className = '',
}: AccessibleLiveRegionProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (message && clearDelay > 0) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set a new timeout to clear the message
      timeoutRef.current = setTimeout(() => {
        // Message will be cleared by parent component state update
      }, clearDelay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [message, clearDelay])

  if (!message) return null

  return (
    <div
      aria-live={level}
      aria-atomic="true"
      className={`sr-only ${className}`}
      role="status"
    >
      {message}
    </div>
  )
}

// Hook for managing live region announcements
export function useAccessibleAnnouncements() {
  const announceRef =
    useRef<(message: string, level?: 'polite' | 'assertive') => void | null>(
      null
    )

  const announce = (
    message: string,
    level: 'polite' | 'assertive' = 'polite'
  ) => {
    // This would be connected to a global announcement system
    if (announceRef.current) {
      announceRef.current(message, level)
    } else {
      // Fallback: create a temporary live region
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', level)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      liveRegion.textContent = message

      document.body.appendChild(liveRegion)

      setTimeout(() => {
        document.body.removeChild(liveRegion)
      }, 5000)
    }
  }

  return { announce }
}
