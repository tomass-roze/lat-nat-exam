import { ReactNode, useState, useEffect } from 'react'
import FocusTrapReact from 'focus-trap-react'

interface FocusTrapProps {
  children: ReactNode
  active: boolean
  onDeactivate?: () => void
  className?: string
  focusTrapOptions?: {
    initialFocus?: string | HTMLElement | false
    fallbackFocus?: string | HTMLElement
    escapeDeactivates?: boolean
    clickOutsideDeactivates?: boolean
    returnFocusOnDeactivate?: boolean
  }
}

export function FocusTrap({
  children,
  active,
  onDeactivate,
  className,
  focusTrapOptions = {},
}: FocusTrapProps) {
  const [focusTrapError, setFocusTrapError] = useState<string | null>(null)
  const [useFallback, setUseFallback] = useState(false)

  const defaultOptions = {
    escapeDeactivates: true,
    clickOutsideDeactivates: true,
    returnFocusOnDeactivate: true,
    ...focusTrapOptions,
  }

  // Reset error state when active changes
  useEffect(() => {
    if (active) {
      setFocusTrapError(null)
      setUseFallback(false)
    }
  }, [active])

  // Enhanced focus trap options with error handling
  const enhancedOptions = {
    ...defaultOptions,
    onDeactivate: onDeactivate,
    onActivate: () => {
      // Successfully activated, clear any error state
      setFocusTrapError(null)
    },
    onPostActivate: () => {
      // Focus trap is fully active and working
      console.debug('FocusTrap activated successfully')
    },
  }

  // Fallback component without focus trap
  if (useFallback || focusTrapError) {
    return (
      <div
        className={className}
        onKeyDown={(e) => {
          // Basic escape key handling as fallback
          if (e.key === 'Escape' && defaultOptions.escapeDeactivates) {
            onDeactivate?.()
          }
        }}
      >
        {children}
        {focusTrapError && (
          <div className="sr-only">
            Focus trap error: {focusTrapError}. Using fallback keyboard
            navigation.
          </div>
        )}
      </div>
    )
  }

  // Try to use the focus trap with error boundary
  try {
    return (
      <FocusTrapReact active={active} focusTrapOptions={enhancedOptions}>
        <div className={className}>{children}</div>
      </FocusTrapReact>
    )
  } catch (error) {
    // If focus trap fails, fall back to simple div
    console.warn('FocusTrap failed, using fallback:', error)
    setFocusTrapError(
      error instanceof Error ? error.message : 'Unknown focus trap error'
    )
    setUseFallback(true)

    return (
      <div
        className={className}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && defaultOptions.escapeDeactivates) {
            onDeactivate?.()
          }
        }}
      >
        {children}
      </div>
    )
  }
}

// Custom hook for managing focus within a component
export function useFocusManagement() {
  const focusableElementsSelector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

  const getFocusableElements = (container: HTMLElement) => {
    return container.querySelectorAll(
      focusableElementsSelector
    ) as NodeListOf<HTMLElement>
  }

  const focusFirstElement = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }

  const focusLastElement = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus()
    }
  }

  const trapFocus = (event: KeyboardEvent, container: HTMLElement) => {
    if (event.key !== 'Tab') return

    const focusableElements = getFocusableElements(container)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement as HTMLElement

    if (event.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  return {
    getFocusableElements,
    focusFirstElement,
    focusLastElement,
    trapFocus,
  }
}
