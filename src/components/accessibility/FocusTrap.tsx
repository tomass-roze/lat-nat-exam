import { ReactNode } from 'react'
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
  const defaultOptions = {
    escapeDeactivates: true,
    clickOutsideDeactivates: true,
    returnFocusOnDeactivate: true,
    ...focusTrapOptions,
  }

  return (
    <FocusTrapReact
      active={active}
      focusTrapOptions={{
        ...defaultOptions,
        onDeactivate: onDeactivate,
      }}
    >
      <div className={className}>{children}</div>
    </FocusTrapReact>
  )
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
