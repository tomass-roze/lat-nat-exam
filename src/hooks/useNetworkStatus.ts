/**
 * @fileoverview Network Status Monitoring Hook
 *
 * Provides comprehensive network connectivity monitoring with quality detection,
 * offline handling, and network error tracking for the Latvian citizenship exam.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { NetworkQuality, NetworkError } from '@/types/errors'
import { logNetworkError } from '@/utils/errorLogger'

/**
 * Network status information
 */
export interface NetworkStatus {
  /** Whether browser reports online status */
  isOnline: boolean
  /** Detected network quality */
  quality: NetworkQuality
  /** Connection effective type if available */
  effectiveType?: string
  /** Downlink speed in Mbps if available */
  downlink?: number
  /** Round-trip time in ms if available */
  rtt?: number
  /** Whether connection is metered */
  saveData?: boolean
  /** Last time status was updated */
  lastUpdated: number
  /** Number of connection attempts */
  connectionAttempts: number
  /** Last network error if any */
  lastError?: NetworkError
}

/**
 * Network quality thresholds
 */
const QUALITY_THRESHOLDS = {
  excellent: { minDownlink: 10, maxRtt: 100 },
  good: { minDownlink: 1.5, maxRtt: 300 },
  poor: { minDownlink: 0, maxRtt: Infinity },
} as const

/**
 * Configuration for network monitoring
 */
interface NetworkMonitorConfig {
  /** How often to check connectivity (ms) */
  checkInterval: number
  /** Timeout for connectivity tests (ms) */
  testTimeout: number
  /** URLs to test connectivity against */
  testUrls: string[]
  /** Whether to perform periodic checks */
  enablePeriodicChecks: boolean
  /** Whether to track network quality changes */
  trackQualityChanges: boolean
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: NetworkMonitorConfig = {
  checkInterval: 30000, // 30 seconds
  testTimeout: 5000, // 5 seconds
  testUrls: [
    'https://www.google.com/favicon.ico',
    'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
  ],
  enablePeriodicChecks: true,
  trackQualityChanges: true,
}

/**
 * Network status monitoring hook
 */
export function useNetworkStatus(config: Partial<NetworkMonitorConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    quality: 'unknown',
    lastUpdated: Date.now(),
    connectionAttempts: 0,
  }))

  const checkIntervalRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Determine network quality from connection info
   */
  const determineQuality = useCallback(
    (connection: any, isOnline: boolean): NetworkQuality => {
      if (!isOnline) return 'offline'
      if (!connection) return 'unknown'

      const { effectiveType, downlink, rtt } = connection

      // Use effective type as fallback
      if (effectiveType === '4g' || effectiveType === '5g') {
        if (downlink >= QUALITY_THRESHOLDS.excellent.minDownlink && 
            rtt <= QUALITY_THRESHOLDS.excellent.maxRtt) {
          return 'excellent'
        }
        return 'good'
      }

      if (effectiveType === '3g') {
        return downlink >= QUALITY_THRESHOLDS.good.minDownlink ? 'good' : 'poor'
      }

      if (effectiveType === '2g' || effectiveType === 'slow-2g') {
        return 'poor'
      }

      // Fallback to speed-based detection
      if (downlink >= QUALITY_THRESHOLDS.excellent.minDownlink && 
          rtt <= QUALITY_THRESHOLDS.excellent.maxRtt) {
        return 'excellent'
      }

      if (downlink >= QUALITY_THRESHOLDS.good.minDownlink && 
          rtt <= QUALITY_THRESHOLDS.good.maxRtt) {
        return 'good'
      }

      return 'poor'
    },
    []
  )

  /**
   * Test actual connectivity by making HTTP requests
   */
  const testConnectivity = useCallback(async (): Promise<boolean> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    try {
      // Test multiple URLs to increase reliability
      const testPromises = finalConfig.testUrls.map(async (url) => {
        const controller = new AbortController()
        signal.addEventListener('abort', () => controller.abort())

        const timeout = setTimeout(() => controller.abort(), finalConfig.testTimeout)

        try {
          await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal,
          })
          clearTimeout(timeout)
          return true
        } catch {
          clearTimeout(timeout)
          return false
        }
      })

      const results = await Promise.allSettled(testPromises)
      const successCount = results.filter(
        (result) => result.status === 'fulfilled' && result.value
      ).length

      // Consider connected if at least one test succeeds
      return successCount > 0
    } catch (error) {
      // Log network error
      logNetworkError(
        'Connectivity test failed',
        undefined,
        undefined,
        networkStatus.quality
      )
      return false
    }
  }, [finalConfig.testUrls, finalConfig.testTimeout, networkStatus.quality])

  /**
   * Update network status
   */
  const updateNetworkStatus = useCallback(async () => {
    const isOnline = navigator.onLine
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    // Perform connectivity test if online
    const actuallyOnline = isOnline ? await testConnectivity() : false

    const quality = determineQuality(connection, actuallyOnline)

    const newStatus: NetworkStatus = {
      isOnline: actuallyOnline,
      quality,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
      lastUpdated: Date.now(),
      connectionAttempts: networkStatus.connectionAttempts + 1,
    }

    // Log quality changes if tracking is enabled
    if (finalConfig.trackQualityChanges && quality !== networkStatus.quality) {
      console.log(`Network quality changed: ${networkStatus.quality} → ${quality}`)
      
      // Log significant quality degradation
      if ((networkStatus.quality === 'excellent' && quality === 'poor') ||
          (networkStatus.quality === 'good' && quality === 'offline')) {
        logNetworkError(
          `Network quality degraded from ${networkStatus.quality} to ${quality}`,
          undefined,
          undefined,
          quality
        )
      }
    }

    setNetworkStatus(newStatus)
  }, [
    determineQuality,
    testConnectivity,
    finalConfig.trackQualityChanges,
    networkStatus.quality,
    networkStatus.connectionAttempts,
  ])

  /**
   * Handle online/offline events
   */
  const handleOnline = useCallback(() => {
    console.log('Browser reports online')
    updateNetworkStatus()
  }, [updateNetworkStatus])

  const handleOffline = useCallback(() => {
    console.log('Browser reports offline')
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: false,
      quality: 'offline',
      lastUpdated: Date.now(),
    }))

    logNetworkError(
      'Network connection lost',
      undefined,
      undefined,
      'offline'
    )
  }, [networkStatus.quality])

  /**
   * Handle connection change events
   */
  const handleConnectionChange = useCallback(() => {
    console.log('Network connection changed')
    updateNetworkStatus()
  }, [updateNetworkStatus])

  /**
   * Force a network status check
   */
  const forceCheck = useCallback(() => {
    updateNetworkStatus()
  }, [updateNetworkStatus])

  /**
   * Check if network is suitable for exam
   */
  const isNetworkSuitable = useCallback(() => {
    return networkStatus.isOnline && 
           networkStatus.quality !== 'offline' && 
           networkStatus.quality !== 'poor'
  }, [networkStatus])

  /**
   * Get network status message in Latvian
   */
  const getStatusMessage = useCallback((): string => {
    if (!networkStatus.isOnline) {
      return 'Nav interneta savienojuma'
    }

    switch (networkStatus.quality) {
      case 'excellent':
        return 'Lielisks interneta savienojums'
      case 'good':
        return 'Labs interneta savienojums'
      case 'poor':
        return 'Vājš interneta savienojums'
      case 'offline':
        return 'Nav interneta savienojuma'
      default:
        return 'Interneta savienojuma kvalitāte nav zināma'
    }
  }, [networkStatus])

  /**
   * Get recommended actions based on network status
   */
  const getRecommendedActions = useCallback((): string[] => {
    const actions: string[] = []

    if (!networkStatus.isOnline) {
      actions.push('Pārbaudiet interneta savienojumu')
      actions.push('Pārstartējiet Wi-Fi vai mobilo datu')
      actions.push('Pārbaudiet, vai nav problēmu ar interneta pakalpojumu sniedzēju')
    } else if (networkStatus.quality === 'poor') {
      actions.push('Pārvietojieties tuvāk Wi-Fi rūterim')
      actions.push('Aizveriet citas internetu izmantojošās aplikācijas')
      actions.push('Izmantojiet stabilāku interneta savienojumu')
    } else if (networkStatus.saveData) {
      actions.push('Datu taupīšanas režīms ir ieslēgts - tas var ietekmēt veiktspēju')
    }

    return actions
  }, [networkStatus])

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection changes
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    // Initial status check
    updateNetworkStatus()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [handleOnline, handleOffline, handleConnectionChange, updateNetworkStatus])

  // Set up periodic checks
  useEffect(() => {
    if (!finalConfig.enablePeriodicChecks) return

    checkIntervalRef.current = window.setInterval(() => {
      updateNetworkStatus()
    }, finalConfig.checkInterval)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [finalConfig.enablePeriodicChecks, finalConfig.checkInterval, updateNetworkStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])

  return {
    networkStatus,
    forceCheck,
    isNetworkSuitable,
    getStatusMessage,
    getRecommendedActions,
  }
}

/**
 * Simplified hook for basic online/offline detection
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}