import { useEffect, useCallback } from 'react'

interface KeyboardNavigationOptions {
  enableSectionNavigation?: boolean
  enableGlobalShortcuts?: boolean
  onSectionChange?: (sectionId: string) => void
}

export function useKeyboardNavigation({
  enableSectionNavigation = true,
  enableGlobalShortcuts = true,
  onSectionChange,
}: KeyboardNavigationOptions = {}) {
  const navigateToSection = useCallback(
    (sectionId: string) => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })

        // Focus the first focusable element in the section
        const focusableElement = element.querySelector(
          'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement

        if (focusableElement) {
          focusableElement.focus()
        } else if (element.tabIndex >= 0) {
          element.focus()
        }

        onSectionChange?.(sectionId)
      }
    },
    [onSectionChange]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return
      }

      // Section navigation shortcuts (Ctrl/Cmd + number)
      if (enableSectionNavigation && (event.ctrlKey || event.metaKey)) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            navigateToSection('anthem-section')
            break
          case '2':
            event.preventDefault()
            navigateToSection('history-section')
            break
          case '3':
            event.preventDefault()
            navigateToSection('constitution-section')
            break
          case '4':
            event.preventDefault()
            navigateToSection('submission-section')
            break
        }
      }

      // Global navigation shortcuts
      if (enableGlobalShortcuts) {
        switch (event.key) {
          case 'Escape':
            // Close any open modals or return focus to main content
            const mainContent = document.getElementById('main-content')
            if (mainContent) {
              mainContent.focus()
            }
            break
          case 'Home':
            if (event.ctrlKey) {
              event.preventDefault()
              navigateToSection('main-content')
            }
            break
          case 'End':
            if (event.ctrlKey) {
              event.preventDefault()
              navigateToSection('submission-section')
            }
            break
        }
      }
    },
    [enableSectionNavigation, enableGlobalShortcuts, navigateToSection]
  )

  useEffect(() => {
    if (enableSectionNavigation || enableGlobalShortcuts) {
      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown, enableSectionNavigation, enableGlobalShortcuts])

  return {
    navigateToSection,
  }
}
