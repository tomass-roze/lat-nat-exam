/**
 * @fileoverview Network Status Indicator Component
 *
 * Displays current network connectivity status with visual indicators,
 * quality information, and user guidance for network issues.
 */

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  WifiOff,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import type { NetworkQuality } from '@/types/errors'

/**
 * Get icon for network quality
 */
function getQualityIcon(quality: NetworkQuality, size = 'h-4 w-4') {
  switch (quality) {
    case 'excellent':
      return <Signal className={size} />
    case 'good':
      return <SignalHigh className={size} />
    case 'poor':
      return <SignalLow className={size} />
    case 'offline':
      return <WifiOff className={size} />
    default:
      return <SignalMedium className={size} />
  }
}

/**
 * Get color classes for network quality
 */
function getQualityColors(quality: NetworkQuality) {
  switch (quality) {
    case 'excellent':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: 'text-green-600',
      }
    case 'good':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: 'text-blue-600',
      }
    case 'poor':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
      }
    case 'offline':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: 'text-red-600',
      }
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        icon: 'text-gray-600',
      }
  }
}

/**
 * Format network speed for display
 */
function formatSpeed(downlink?: number): string {
  if (!downlink) return 'Nav pieejams'

  if (downlink >= 1) {
    return `${downlink.toFixed(1)} Mbps`
  } else {
    return `${(downlink * 1000).toFixed(0)} kbps`
  }
}

/**
 * Format RTT (round-trip time) for display
 */
function formatRTT(rtt?: number): string {
  if (!rtt) return 'Nav pieejams'
  return `${rtt}ms`
}

/**
 * Props for NetworkStatusIndicator
 */
interface NetworkStatusIndicatorProps {
  /** Whether to show detailed information */
  showDetails?: boolean
  /** Whether to show as compact indicator */
  compact?: boolean
  /** Whether to show recommendations for poor connection */
  showRecommendations?: boolean
  /** Custom className */
  className?: string
}

/**
 * Network Status Indicator Component
 */
export function NetworkStatusIndicator({
  showDetails = false,
  compact = false,
  showRecommendations = true,
  className = '',
}: NetworkStatusIndicatorProps) {
  const {
    networkStatus,
    forceCheck,
    isNetworkSuitable,
    getStatusMessage,
    getRecommendedActions,
  } = useNetworkStatus()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const colors = getQualityColors(networkStatus.quality)
  const icon = getQualityIcon(networkStatus.quality)
  const isSuitable = isNetworkSuitable()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    forceCheck()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Compact view
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={colors.icon}>{icon}</div>
        <Badge
          variant="outline"
          className={`${colors.bg} ${colors.text} ${colors.border}`}
        >
          {getStatusMessage()}
        </Badge>
        {!isSuitable && <AlertTriangle className="h-4 w-4 text-amber-500" />}
      </div>
    )
  }

  // Full view
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={colors.icon}>
            {getQualityIcon(networkStatus.quality, 'h-5 w-5')}
          </div>
          <div>
            <div className="font-medium">Interneta savienojums</div>
            <div className={`text-sm ${colors.text}`}>{getStatusMessage()}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* Network Quality Alert */}
      {!isSuitable && (
        <Alert className={`${colors.bg} ${colors.border}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <strong>Interneta savienojuma brīdinājums</strong>
              </div>
              <div className="text-sm">
                {networkStatus.quality === 'offline'
                  ? 'Nav interneta savienojuma. Eksāmenu nevar turpināt bez interneta.'
                  : 'Vājš interneta savienojums var ietekmēt eksāmena veiktspēju.'}
              </div>
              {showRecommendations && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Ieteikumi:</div>
                  <ul className="text-sm space-y-1">
                    {getRecommendedActions().map((action, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-xs mt-1">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Information */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Statuss</div>
            <div className="flex items-center gap-2">
              {networkStatus.isOnline ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              {networkStatus.isOnline ? 'Pieslēgts' : 'Atvienots'}
            </div>
          </div>

          <div>
            <div className="font-medium text-muted-foreground">Kvalitāte</div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${colors.bg} ${colors.text} ${colors.border}`}
              >
                {networkStatus.quality}
              </Badge>
            </div>
          </div>

          {networkStatus.effectiveType && (
            <div>
              <div className="font-medium text-muted-foreground">Veids</div>
              <div>{networkStatus.effectiveType.toUpperCase()}</div>
            </div>
          )}

          {networkStatus.downlink && (
            <div>
              <div className="font-medium text-muted-foreground">Ātrums</div>
              <div>{formatSpeed(networkStatus.downlink)}</div>
            </div>
          )}

          {networkStatus.rtt && (
            <div>
              <div className="font-medium text-muted-foreground">Latentums</div>
              <div>{formatRTT(networkStatus.rtt)}</div>
            </div>
          )}

          <div>
            <div className="font-medium text-muted-foreground">Pārbaudes</div>
            <div>{networkStatus.connectionAttempts}</div>
          </div>

          {networkStatus.saveData && (
            <div className="col-span-2">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-xs">
                    <strong>Datu taupīšanas režīms:</strong> Ieslēgts - var
                    ietekmēt veiktspēju
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground">
        Pēdējoreiz atjaunots:{' '}
        {new Date(networkStatus.lastUpdated).toLocaleTimeString('lv-LV')}
      </div>
    </div>
  )
}

/**
 * Simple network status badge for header/footer
 */
export function NetworkStatusBadge({ className = '' }: { className?: string }) {
  const { networkStatus } = useNetworkStatus()
  const colors = getQualityColors(networkStatus.quality)
  const icon = getQualityIcon(networkStatus.quality, 'h-3 w-3')

  return (
    <Badge
      variant="outline"
      className={`${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-xs">
          {networkStatus.quality === 'offline' && 'Offline'}
          {networkStatus.quality === 'poor' && 'Vājš'}
          {networkStatus.quality === 'good' && 'Labs'}
          {networkStatus.quality === 'excellent' && 'Lielisks'}
          {networkStatus.quality === 'unknown' && '?'}
        </span>
        {(networkStatus.quality === 'offline' ||
          networkStatus.quality === 'poor') && (
          <AlertTriangle className="h-3 w-3 ml-1" />
        )}
      </div>
    </Badge>
  )
}

/**
 * Network warning banner for critical network issues
 */
export function NetworkWarningBanner() {
  const { networkStatus, getRecommendedActions } = useNetworkStatus()

  // Only show for offline or very poor connections
  if (networkStatus.quality !== 'offline' && networkStatus.quality !== 'poor') {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <div>
            <strong>Interneta savienojuma problēma</strong>
          </div>
          <div>
            {networkStatus.quality === 'offline'
              ? 'Nav interneta savienojuma. Eksāmenu nevar turpināt bez interneta savienojuma.'
              : 'Vājš interneta savienojums var izraisīt eksāmena traucējumus vai datu zudumu.'}
          </div>
          <div className="space-y-1">
            <div className="font-medium">Ko darīt:</div>
            <ul className="text-sm space-y-1">
              {getRecommendedActions().map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
