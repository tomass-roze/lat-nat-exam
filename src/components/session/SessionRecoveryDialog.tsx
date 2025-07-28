/**
 * @fileoverview Session recovery dialog component
 *
 * Provides user interface for recovering from session errors, expired sessions,
 * and corrupted data with clear recovery options and data previews.
 */

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { SessionRecovery, SessionError } from '@/types/session'
import { AlertTriangle, Clock, RefreshCw, Trash2 } from 'lucide-react'

interface SessionRecoveryDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Session error information */
  error: SessionError | null
  /** Recovery options if available */
  recovery: SessionRecovery | null
  /** Callback when recovery option is selected */
  onRecover: (optionId: string) => void
  /** Callback when dialog is dismissed */
  onDismiss: () => void
}

/**
 * Get error severity color
 */
function getErrorSeverityColor(code: string): string {
  switch (code) {
    case 'SESSION_EXPIRED':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'STORAGE_QUOTA_EXCEEDED':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'CHECKSUM_MISMATCH':
    case 'INVALID_SESSION_DATA':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'STORAGE_NOT_AVAILABLE':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

/**
 * Get confidence level color
 */
function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Format data age for display
 */
function formatDataAge(dataAge: string | number): string {
  if (typeof dataAge === 'string') {
    return dataAge
  }

  const minutes = Math.floor(dataAge / (1000 * 60))
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours} stundas, ${minutes % 60} minūtes atpakaļ`
  } else if (minutes > 0) {
    return `${minutes} minūtes atpakaļ`
  } else {
    return 'Tikko'
  }
}

/**
 * Get recovery option icon
 */
function getRecoveryIcon(optionId: string) {
  switch (optionId) {
    case 'start-fresh':
      return <RefreshCw className="h-4 w-4" />
    case 'clear-and-restart':
      return <Trash2 className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

/**
 * Session recovery dialog component
 */
export function SessionRecoveryDialog({
  open,
  error,
  recovery,
  onRecover,
  onDismiss,
}: SessionRecoveryDialogProps) {
  if (!error) {
    return null
  }

  const hasRecoveryOptions = recovery?.canRecover && recovery.options.length > 0

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Sesijas atjaunošana
          </AlertDialogTitle>
          <AlertDialogDescription>
            Radusies problēma ar jūsu eksāmena sesijas datiem. Lūdzu,
            izvēlieties, kā turpināt.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Error Information */}
          <Alert className="border-l-4 border-l-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Kļūdas veids:</span>
                  <Badge
                    variant="outline"
                    className={getErrorSeverityColor(error.code)}
                  >
                    {error.code}
                  </Badge>
                </div>
                <p className="text-sm">{error.message}</p>
                {error.details && (
                  <details className="text-sm text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      Tehniskā informācija
                    </summary>
                    <p className="mt-1 font-mono text-xs bg-muted p-2 rounded">
                      {error.details}
                    </p>
                  </details>
                )}
                {error.suggestedAction && (
                  <div className="text-sm">
                    <span className="font-semibold">Ieteicamā darbība:</span>
                    <p className="text-muted-foreground">
                      {error.suggestedAction}
                    </p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Recovery Options */}
          {hasRecoveryOptions ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Atjaunošanas iespējas</h3>

              {recovery.options.map((option) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    recovery.recommendedOption?.id === option.id
                      ? 'ring-2 ring-primary border-primary'
                      : ''
                  }`}
                  onClick={() => onRecover(option.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getRecoveryIcon(option.id)}
                        {option.description}
                        {recovery.recommendedOption?.id === option.id && (
                          <Badge variant="default" className="ml-2">
                            Ieteicams
                          </Badge>
                        )}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={getConfidenceColor(option.confidence)}
                      >
                        {option.confidence === 'high' && 'Augsta ticamība'}
                        {option.confidence === 'medium' && 'Vidēja ticamība'}
                        {option.confidence === 'low' && 'Zema ticamība'}
                      </Badge>
                    </div>
                  </CardHeader>

                  {option.dataPreview && (
                    <CardContent className="pt-0">
                      <CardDescription>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">
                              Pēdējais saglabājums:
                            </span>
                            <p className="text-muted-foreground">
                              {option.dataPreview.lastSaved > 0
                                ? new Date(
                                    option.dataPreview.lastSaved
                                  ).toLocaleString('lv-LV')
                                : 'Nav pieejams'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Progress:</span>
                            <p className="text-muted-foreground">
                              {option.dataPreview.progressPercentage}%
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">
                              Pabeigtas sadaļas:
                            </span>
                            <p className="text-muted-foreground">
                              {option.dataPreview.completedSections.length > 0
                                ? option.dataPreview.completedSections.join(
                                    ', '
                                  )
                                : 'Neviena'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Datu vecums:</span>
                            <p className="text-muted-foreground">
                              {formatDataAge(option.dataPreview.dataAge)}
                            </p>
                          </div>
                        </div>

                        {option.dataPreview.integrityCheck !== 'passed' && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            Datu integritātes pārbaude:{' '}
                            {option.dataPreview.integrityCheck}
                          </div>
                        )}
                      </CardDescription>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sesiju nevar atjaunot automātiski. Jums būs jāsāk eksāmens no
                jauna.
              </AlertDescription>
            </Alert>
          )}

          {/* Recovery Information */}
          {recovery && (
            <div className="text-sm text-muted-foreground">
              <p>
                💡 <strong>Padoms:</strong> Regulāri saglabājiet savu progresu,
                lai izvairītos no datu zuduma. Eksāmena sesija automātiski tiek
                saglabāta ik pēc 30 sekundēm.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={onDismiss}
            disabled={!error.recoverable}
          >
            Atcelt
          </Button>

          {!hasRecoveryOptions && (
            <Button
              onClick={() => onRecover('start-fresh')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sākt no jauna
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Simple session error alert component
 */
interface SessionErrorAlertProps {
  error: SessionError | null
  onDismiss: () => void
}

export function SessionErrorAlert({
  error,
  onDismiss,
}: SessionErrorAlertProps) {
  if (!error) {
    return null
  }

  return (
    <Alert className="mb-4 border-l-4 border-l-amber-400">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">Sesijas kļūda:</span>{' '}
            {error.message}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-1"
          >
            ✕
          </Button>
        </div>
        {error.suggestedAction && (
          <p className="text-sm text-muted-foreground mt-1">
            {error.suggestedAction}
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}
