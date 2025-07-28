/**
 * @fileoverview Session status indicator component
 *
 * Displays current session status, auto-save status, and provides
 * session management controls in the exam interface.
 */

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SessionStatus, AutoSaveStatus } from '@/types/session'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  WifiOff,
  Save,
  MoreVertical,
  RefreshCw,
  Trash2,
} from 'lucide-react'

interface SessionStatusIndicatorProps {
  /** Current session status */
  status: SessionStatus
  /** Auto-save status information */
  autoSave: AutoSaveStatus
  /** Whether storage is available */
  hasStorage: boolean
  /** Whether auto-save is working */
  isAutoSaveWorking: boolean
  /** Callback to manually save */
  onManualSave?: () => Promise<void>
  /** Callback to extend session */
  onExtendSession?: () => Promise<void>
  /** Callback to clear session */
  onClearSession?: () => void
  /** Whether to show extended information */
  showDetails?: boolean
}

/**
 * Get status color and icon
 */
function getStatusDisplay(status: SessionStatus, hasStorage: boolean) {
  if (!hasStorage) {
    return {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: <WifiOff className="h-3 w-3" />,
      text: 'Nav krātuves',
      description: 'SessionStorage nav pieejams',
    }
  }

  switch (status) {
    case 'active':
      return {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: <CheckCircle className="h-3 w-3" />,
        text: 'Aktīva',
        description: 'Sesija ir aktīva un darbojas',
      }
    case 'expired':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <Clock className="h-3 w-3" />,
        text: 'Beigusies',
        description: 'Sesija ir beigusies (2 stundas)',
      }
    case 'corrupted':
      return {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: <AlertTriangle className="h-3 w-3" />,
        text: 'Bojāta',
        description: 'Sesijas dati ir bojāti vai nederīgi',
      }
    case 'missing':
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: <WifiOff className="h-3 w-3" />,
        text: 'Nav sesijas',
        description: 'Nav atrasta saglabāta sesija',
      }
    case 'migrating':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <RefreshCw className="h-3 w-3" />,
        text: 'Migrē',
        description: 'Notiek sesijas datu migrācija',
      }
    default:
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: <AlertTriangle className="h-3 w-3" />,
        text: 'Nezināms',
        description: 'Nezināms sesijas stāvoklis',
      }
  }
}

/**
 * Get auto-save status display
 */
function getAutoSaveDisplay(autoSave: AutoSaveStatus, isWorking: boolean) {
  if (!autoSave.isActive) {
    return {
      color: 'bg-gray-100 text-gray-800',
      icon: <WifiOff className="h-3 w-3" />,
      text: 'Neaktīvs',
      description: 'Automātiskais saglabāšana ir izslēgta',
    }
  }

  if (autoSave.saving) {
    return {
      color: 'bg-blue-100 text-blue-800',
      icon: <Save className="h-3 w-3 animate-pulse" />,
      text: 'Saglabā...',
      description: 'Notiek saglabāšana',
    }
  }

  if (!isWorking || autoSave.failedAttempts > 0) {
    return {
      color: 'bg-yellow-100 text-yellow-800',
      icon: <AlertTriangle className="h-3 w-3" />,
      text: `Kļūdas (${autoSave.failedAttempts})`,
      description: 'Automātiskajā saglabāšanā radušās kļūdas',
    }
  }

  if (autoSave.lastSave > 0) {
    return {
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="h-3 w-3" />,
      text: 'Darbojas',
      description: 'Automātiskā saglabāšana darbojas normāli',
    }
  }

  return {
    color: 'bg-blue-100 text-blue-800',
    icon: <Clock className="h-3 w-3" />,
    text: 'Gaida',
    description: 'Gaida pirmo saglabāšanu',
  }
}

/**
 * Format time for display
 */
function formatTimeAgo(timestamp: number): string {
  if (timestamp === 0) {
    return 'Nekad'
  }

  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (minutes > 0) {
    return `Pirms ${minutes} min`
  } else if (seconds > 0) {
    return `Pirms ${seconds} sek`
  } else {
    return 'Tikko'
  }
}

/**
 * Session status indicator component
 */
export function SessionStatusIndicator({
  status,
  autoSave,
  hasStorage,
  isAutoSaveWorking,
  onManualSave,
  onExtendSession,
  onClearSession,
  showDetails = false,
}: SessionStatusIndicatorProps) {
  const [isManualSaving, setIsManualSaving] = useState(false)
  const [isExtending, setIsExtending] = useState(false)

  const statusDisplay = getStatusDisplay(status, hasStorage)
  const autoSaveDisplay = getAutoSaveDisplay(autoSave, isAutoSaveWorking)

  const handleManualSave = async () => {
    if (!onManualSave || isManualSaving) return

    setIsManualSaving(true)
    try {
      await onManualSave()
    } finally {
      setIsManualSaving(false)
    }
  }

  const handleExtendSession = async () => {
    if (!onExtendSession || isExtending) return

    setIsExtending(true)
    try {
      await onExtendSession()
    } finally {
      setIsExtending(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Session Status Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`${statusDisplay.color} flex items-center gap-1.5 px-2 py-1`}
            >
              {statusDisplay.icon}
              <span className="text-xs font-medium">
                Sesija: {statusDisplay.text}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{statusDisplay.description}</p>
          </TooltipContent>
        </Tooltip>

        {/* Auto-save Status Badge */}
        {hasStorage && status === 'active' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`${autoSaveDisplay.color} flex items-center gap-1.5 px-2 py-1`}
              >
                {autoSaveDisplay.icon}
                <span className="text-xs font-medium">
                  Auto: {autoSaveDisplay.text}
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p>{autoSaveDisplay.description}</p>
                {autoSave.lastSave > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Pēdējais: {formatTimeAgo(autoSave.lastSave)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Neizdevušies: {autoSave.failedAttempts}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Session Actions Menu */}
        {hasStorage && (onManualSave || onExtendSession || onClearSession) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Sesijas darbības</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {onManualSave && (
                <DropdownMenuItem
                  onClick={handleManualSave}
                  disabled={isManualSaving || autoSave.saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isManualSaving ? 'Saglabā...' : 'Saglabāt tagad'}
                </DropdownMenuItem>
              )}

              {onExtendSession && status === 'active' && (
                <DropdownMenuItem
                  onClick={handleExtendSession}
                  disabled={isExtending}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {isExtending ? 'Pagarina...' : 'Pagarināt sesiju'}
                </DropdownMenuItem>
              )}

              {(onManualSave || onExtendSession) && onClearSession && (
                <DropdownMenuSeparator />
              )}

              {onClearSession && (
                <DropdownMenuItem
                  onClick={onClearSession}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Notīrīt sesiju
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Extended Details */}
        {showDetails && hasStorage && status === 'active' && (
          <div className="text-xs text-muted-foreground">
            {autoSave.lastSave > 0 && (
              <span>Saglabāts: {formatTimeAgo(autoSave.lastSave)}</span>
            )}
            {autoSave.nextSave > 0 && autoSave.isActive && (
              <span className="ml-2">
                Nākamais:{' '}
                {Math.max(
                  0,
                  Math.floor((autoSave.nextSave - Date.now()) / 1000)
                )}
                s
              </span>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

/**
 * Compact session status indicator for mobile
 */
export function CompactSessionStatusIndicator({
  status,
  autoSave,
  hasStorage,
  isAutoSaveWorking,
}: Pick<
  SessionStatusIndicatorProps,
  'status' | 'autoSave' | 'hasStorage' | 'isAutoSaveWorking'
>) {
  const statusDisplay = getStatusDisplay(status, hasStorage)
  const autoSaveDisplay = getAutoSaveDisplay(autoSave, isAutoSaveWorking)

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`w-2 h-2 rounded-full ${statusDisplay.color.split(' ')[0]}`}
            />
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>Sesija: {statusDisplay.text}</p>
              {hasStorage && status === 'active' && (
                <p>Auto-saglabāšana: {autoSaveDisplay.text}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {autoSave.saving && (
          <Save className="h-3 w-3 animate-pulse text-blue-600" />
        )}
      </div>
    </TooltipProvider>
  )
}
