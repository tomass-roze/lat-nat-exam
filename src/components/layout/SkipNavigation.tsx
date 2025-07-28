import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SkipNavigationProps {
  className?: string
}

export function SkipNavigation({ className }: SkipNavigationProps) {
  const skipLinks = [
    { href: '#main-content', label: 'Pāriet uz galveno saturu' },
    { href: '#anthem-section', label: 'Pāriet uz himnas sekciju' },
    { href: '#history-section', label: 'Pāriet uz vēstures sekciju' },
    { href: '#constitution-section', label: 'Pāriet uz konstitūcijas sekciju' },
    { href: '#submission-section', label: 'Pāriet uz iesniegšanas sekciju' },
  ]

  const handleSkipClick = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Focus the element for screen readers
      const focusableElement = element.querySelector(
        'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      if (focusableElement) {
        focusableElement.focus()
      } else if (element instanceof HTMLElement && element.tabIndex >= 0) {
        element.focus()
      }
    }
  }

  return (
    <nav
      className={cn(
        'sr-only focus-within:not-sr-only fixed top-0 left-0 z-[100] bg-background border border-border shadow-lg p-2',
        className
      )}
      aria-label="Pārlēkšanas navigācija"
    >
      <div className="flex flex-col gap-1">
        {skipLinks.map((link) => (
          <Button
            key={link.href}
            variant="outline"
            size="sm"
            onClick={() => handleSkipClick(link.href)}
            className="text-sm font-medium focus-visible:ring-4 focus-visible:ring-ring/50"
          >
            {link.label}
          </Button>
        ))}
      </div>
    </nav>
  )
}
