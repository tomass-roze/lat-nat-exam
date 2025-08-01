/**
 * @fileoverview Browser Compatibility Warning Component
 *
 * Displays compatibility warnings and recommendations to users when
 * browser compatibility issues are detected.
 */

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertTriangle,
  Chrome,
  Smartphone,
  Monitor,
  X,
  CheckCircle,
  XCircle,
  Globe,
} from 'lucide-react'
import type { CompatibilityResult } from '@/utils/browserCompatibility'
import { browserCompatibility } from '@/utils/browserCompatibility'

/**
 * Props for CompatibilityWarning component
 */
interface CompatibilityWarningProps {
  /** Whether to show the warning automatically */
  autoShow?: boolean
  /** Callback when warning is dismissed */
  onDismiss?: () => void
  /** Whether to show detailed information */
  showDetails?: boolean
}

/**
 * Browser Compatibility Warning Component
 */
export function CompatibilityWarning({
  autoShow = true,
  onDismiss,
  showDetails = false,
}: CompatibilityWarningProps) {
  const [compatibilityResult, setCompatibilityResult] =
    useState<CompatibilityResult | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [showDetailedInfo, setShowDetailedInfo] = useState(showDetails)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const result = browserCompatibility.performCompatibilityCheck()
    setCompatibilityResult(result)

    // Show warning if there are compatibility issues and auto-show is enabled
    if (
      autoShow &&
      (result.supportLevel !== 'supported' || result.warnings.length > 0)
    ) {
      // Check if warning was previously dismissed in this session
      const dismissed = sessionStorage.getItem(
        'compatibility-warning-dismissed'
      )
      if (!dismissed) {
        setIsVisible(true)
      }
    }
  }, [autoShow])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    sessionStorage.setItem('compatibility-warning-dismissed', 'true')
    onDismiss?.()
  }

  const getAlertVariant = () => {
    if (!compatibilityResult) return 'default'

    switch (compatibilityResult.supportLevel) {
      case 'unsupported':
        return 'destructive'
      case 'limited':
        return 'default'
      case 'supported':
        return compatibilityResult.warnings.length > 0 ? 'default' : 'default'
      default:
        return 'default'
    }
  }

  const getSeverityIcon = () => {
    if (!compatibilityResult) return <AlertTriangle className="h-4 w-4" />

    switch (compatibilityResult.supportLevel) {
      case 'unsupported':
        return <XCircle className="h-4 w-4" />
      case 'limited':
        return <AlertTriangle className="h-4 w-4" />
      case 'supported':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getBrowserIcon = (browserName: string) => {
    switch (browserName.toLowerCase()) {
      case 'chrome':
        return <Chrome className="h-4 w-4" />
      case 'firefox':
        return <Globe className="h-4 w-4" />
      default:
        return compatibilityResult?.browserInfo.isMobile ? (
          <Smartphone className="h-4 w-4" />
        ) : (
          <Monitor className="h-4 w-4" />
        )
    }
  }

  const getSupportLevelText = (level: string) => {
    switch (level) {
      case 'supported':
        return 'Pilnībā atbalstīts'
      case 'limited':
        return 'Ierobežots atbalsts'
      case 'unsupported':
        return 'Nav atbalstīts'
      default:
        return 'Nezināms'
    }
  }

  const getSupportLevelColor = (level: string) => {
    switch (level) {
      case 'supported':
        return 'bg-green-100 text-green-800'
      case 'limited':
        return 'bg-yellow-100 text-yellow-800'
      case 'unsupported':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!compatibilityResult || isDismissed) {
    return null
  }

  // Don't show if everything is supported and no warnings
  if (
    !isVisible &&
    compatibilityResult.supportLevel === 'supported' &&
    compatibilityResult.warnings.length === 0
  ) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {isVisible && (
        <Alert variant={getAlertVariant()} className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>

          {getSeverityIcon()}

          <AlertTitle className="pr-8">Pārlūkprogrammas saderība</AlertTitle>

          <AlertDescription className="space-y-3">
            <div className="flex items-center space-x-2">
              {getBrowserIcon(compatibilityResult.browserInfo.name)}
              <span className="text-sm">
                {compatibilityResult.browserInfo.name}{' '}
                {compatibilityResult.browserInfo.version}
              </span>
              <Badge
                className={getSupportLevelColor(
                  compatibilityResult.supportLevel
                )}
              >
                {getSupportLevelText(compatibilityResult.supportLevel)}
              </Badge>
            </div>

            {compatibilityResult.warnings.length > 0 && (
              <div className="space-y-1">
                {compatibilityResult.warnings.map((warning, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    • {warning}
                  </p>
                ))}
              </div>
            )}

            {compatibilityResult.recommendations.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Ieteikumi:</p>
                {compatibilityResult.recommendations
                  .slice(0, 2)
                  .map((recommendation, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      • {recommendation}
                    </p>
                  ))}
                {compatibilityResult.recommendations.length > 2 &&
                  !showDetailedInfo && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setShowDetailedInfo(true)}
                    >
                      Rādīt vairāk (
                      {compatibilityResult.recommendations.length - 2})
                    </Button>
                  )}
              </div>
            )}

            {showDetailedInfo && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowDetailedInfo(false)}
              >
                Paslēpt detaļas
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {showDetailedInfo && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">
              Detalizēta saderības informācija
            </CardTitle>
            <CardDescription>
              Pilna informācija par jūsu pārlūkprogrammas atbalstu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Browser Information */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Pārlūkprogrammas informācija
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Nosaukums: {compatibilityResult.browserInfo.name}</div>
                <div>Versija: {compatibilityResult.browserInfo.version}</div>
                <div>Dzinējs: {compatibilityResult.browserInfo.engine}</div>
                <div>Platforma: {compatibilityResult.browserInfo.platform}</div>
                <div>
                  Mobilā ierīce:{' '}
                  {compatibilityResult.browserInfo.isMobile ? 'Jā' : 'Nē'}
                </div>
                <div>
                  Planšetdators:{' '}
                  {compatibilityResult.browserInfo.isTablet ? 'Jā' : 'Nē'}
                </div>
              </div>
            </div>

            {/* Supported Features */}
            {compatibilityResult.supportedFeatures.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-green-700">
                  Atbalstītās funkcijas (
                  {compatibilityResult.supportedFeatures.length})
                </h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {compatibilityResult.supportedFeatures.map(
                    (feature, index) => (
                      <div key={index} className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{feature.name}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Unsupported Features */}
            {compatibilityResult.unsupportedFeatures.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-red-700">
                  Neatbalstītās funkcijas (
                  {compatibilityResult.unsupportedFeatures.length})
                </h4>
                <div className="space-y-1 text-xs">
                  {compatibilityResult.unsupportedFeatures.map(
                    (feature, index) => (
                      <div key={index} className="flex items-start space-x-1">
                        <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                        <div>
                          <div>{feature.name}</div>
                          {feature.alternative && (
                            <div className="text-muted-foreground">
                              Alternatīva: {feature.alternative}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* All Recommendations */}
            {compatibilityResult.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Visi ieteikumi</h4>
                <div className="space-y-1 text-xs">
                  {compatibilityResult.recommendations.map(
                    (recommendation, index) => (
                      <p key={index} className="text-muted-foreground">
                        {index + 1}. {recommendation}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Pārlādēt lapu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailedInfo(false)}
              >
                Aizvērt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Compact compatibility badge for header or footer
 */
export function CompatibilityBadge() {
  const [compatibilityResult, setCompatibilityResult] =
    useState<CompatibilityResult | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const result = browserCompatibility.performCompatibilityCheck()
    setCompatibilityResult(result)
  }, [])

  if (
    !compatibilityResult ||
    compatibilityResult.supportLevel === 'supported'
  ) {
    return null
  }

  return (
    <div className="relative">
      <Badge
        variant={
          compatibilityResult.supportLevel === 'unsupported'
            ? 'destructive'
            : 'secondary'
        }
        className="cursor-pointer"
        onClick={() => setShowTooltip(!showTooltip)}
      >
        {getSeverityIcon()}
        <span className="ml-1 text-xs">
          {getSupportLevelText(compatibilityResult.supportLevel)}
        </span>
      </Badge>

      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-white border rounded-lg shadow-lg z-50">
          <div className="text-xs space-y-1">
            <div className="font-medium">
              {compatibilityResult.browserInfo.name}{' '}
              {compatibilityResult.browserInfo.version}
            </div>
            {compatibilityResult.warnings.slice(0, 2).map((warning, index) => (
              <div key={index} className="text-muted-foreground">
                • {warning}
              </div>
            ))}
          </div>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs mt-1"
            onClick={() => setShowTooltip(false)}
          >
            Aizvērt
          </Button>
        </div>
      )}
    </div>
  )

  function getSeverityIcon() {
    switch (compatibilityResult?.supportLevel) {
      case 'unsupported':
        return <XCircle className="h-3 w-3" />
      case 'limited':
        return <AlertTriangle className="h-3 w-3" />
      case 'supported':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <AlertTriangle className="h-3 w-3" />
    }
  }

  function getSupportLevelText(level: string) {
    switch (level) {
      case 'supported':
        return 'Atbalstīts'
      case 'limited':
        return 'Ierobežots'
      case 'unsupported':
        return 'Nav atbalstīts'
      default:
        return 'Nezināms'
    }
  }
}
