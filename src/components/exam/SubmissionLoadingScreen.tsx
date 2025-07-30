/**
 * @fileoverview Loading screen for exam submission processing
 *
 * Displays a modal loading screen during exam result calculation and submission.
 * Provides user feedback during the processing phase to prevent confusion.
 */

import { Clock } from 'lucide-react'

interface SubmissionLoadingScreenProps {
  /** Whether the loading screen should be visible */
  isVisible: boolean
}

/**
 * Loading screen component for exam submission processing
 *
 * Shows a centered modal with loading spinner and progress message
 * during exam result calculation and session saving.
 */
export function SubmissionLoadingScreen({
  isVisible,
}: SubmissionLoadingScreenProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-lg border max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <Clock className="h-8 w-8 animate-spin text-primary" />
          <h3 className="text-lg font-semibold text-center">
            Aprēķina rezultātus...
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Lūdzu, uzgaidiet, kamēr tiek apstrādāti jūsu eksāmena rezultāti. Tas
            var aizņemt dažas sekundes.
          </p>
        </div>
      </div>
    </div>
  )
}
