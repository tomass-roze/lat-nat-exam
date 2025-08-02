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
  /** Delay before starting network monitoring (ms) */
  initializationDelay: number
  /** Whether app is considered fully initialized */
  waitForInitialization: boolean
}

/**
 * Environment-specific configuration
 */
const PRODUCTION_CONFIG: NetworkMonitorConfig = {
  checkInterval: 60000, // 60 seconds (less frequent in production)
  testTimeout: 8000, // 8 seconds (longer timeout for production)
  testUrls: [
    '/', // Test current domain root
    '/favicon.ico', // Test favicon (should exist)
  ],
  enablePeriodicChecks: true,
  trackQualityChanges: false, // Reduce logging in production
  initializationDelay: 3000, // Wait 3 seconds for app to initialize
  waitForInitialization: true,
}

const DEVELOPMENT_CONFIG: NetworkMonitorConfig = {
  checkInterval: 30000, // 30 seconds
  testTimeout: 5000, // 5 seconds
  testUrls: [
    '/', // Test current domain root
    '/favicon.ico', // Test favicon
  ],
  enablePeriodicChecks: true,
  trackQualityChanges: true,
  initializationDelay: 1000, // Shorter delay in development
  waitForInitialization: false, // Don't wait in development for easier debugging
}

/**
 * Default configuration based on environment
 */
const DEFAULT_CONFIG: NetworkMonitorConfig =
  process.env.NODE_ENV === 'production' ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG

/**
 * Network status monitoring hook
 */
export function useNetworkStatus(
  config: Partial<NetworkMonitorConfig> = {},
  isAppInitialized: boolean = true
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    quality: 'unknown',
    lastUpdated: Date.now(),
    connectionAttempts: 0,
  }))

  const [isInitializationComplete, setIsInitializationComplete] = useState(
    !finalConfig.waitForInitialization || isAppInitialized
  )

  const checkIntervalRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const initializationTimeoutRef = useRef<number | null>(null)

  /**
   * Determine network quality from connection info with production-safe defaults
   */
  const determineQuality = useCallback(
    (connection: any, isOnline: boolean): NetworkQuality => {
      if (!isOnline) return 'offline'

      // If no connection info available but we're online, assume good quality in production
      // This prevents false negatives when Network Information API is unavailable
      if (!connection) {
        return process.env.NODE_ENV === 'production' ? 'good' : 'unknown'
      }

      const { effectiveType, downlink, rtt } = connection

      // Use effective type as primary indicator
      if (effectiveType === '4g' || effectiveType === '5g') {
        if (
          downlink >= QUALITY_THRESHOLDS.excellent.minDownlink &&
          rtt <= QUALITY_THRESHOLDS.excellent.maxRtt
        ) {
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

      // Fallback to speed-based detection if available
      if (downlink !== undefined && rtt !== undefined) {
        if (
          downlink >= QUALITY_THRESHOLDS.excellent.minDownlink &&
          rtt <= QUALITY_THRESHOLDS.excellent.maxRtt
        ) {
          return 'excellent'
        }

        if (
          downlink >= QUALITY_THRESHOLDS.good.minDownlink &&
          rtt <= QUALITY_THRESHOLDS.good.maxRtt
        ) {
          return 'good'
        }

        return 'poor'
      }

      // Final fallback: if we have connection info but no metrics,
      // be optimistic in production to avoid false warnings
      return process.env.NODE_ENV === 'production' ? 'good' : 'unknown'
    },
    []
  )

  /**
   * Test actual connectivity with CSP-safe fallback mechanism
   */
  const testConnectivity = useCallback(async (): Promise<boolean> => {
    // First check: Use browser's online status as baseline
    if (!navigator.onLine) {
      return false
    }

    // Second check: Try to fetch relative paths (CSP-safe)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    try {
      // Test relative URLs that are CSP-compliant
      const testPromises = finalConfig.testUrls.map(async (url) => {
        const controller = new AbortController()
        signal.addEventListener('abort', () => controller.abort())

        const timeout = setTimeout(
          () => controller.abort(),
          finalConfig.testTimeout
        )

        try {
          const response = await fetch(url, {
            method: 'HEAD',
            cache: 'no-cache',
            signal: controller.signal,
          })
          clearTimeout(timeout)
          // Consider successful if we get any response (even 404 is fine - server is reachable)
          return response.status < 500
        } catch (fetchError) {
          clearTimeout(timeout)

          // If fetch fails due to CSP or other restrictions,
          // fall back to navigator.onLine status
          if (
            fetchError instanceof TypeError &&
            fetchError.message.includes('fetch')
          ) {
            console.warn(
              '[NetworkStatus] Fetch blocked, using navigator.onLine fallback'
            )
            return navigator.onLine
          }

          return false
        }
      })

      const results = await Promise.allSettled(testPromises)
      const successCount = results.filter(
        (result) => result.status === 'fulfilled' && result.value
      ).length

      // If any test succeeds, consider connected
      if (successCount > 0) {
        return true
      }

      // Fallback: If all tests fail but browser reports online, trust the browser
      // This handles cases where CSP blocks our tests but connection is actually fine
      if (navigator.onLine) {
        console.info(
          '[NetworkStatus] Fetch tests failed but navigator.onLine is true, assuming connected'
        )
        return true
      }

      return false
    } catch (error) {
      // Log error only if not in production or if it's a critical error
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[NetworkStatus] Connectivity test failed:', error)
      }

      // Final fallback: trust navigator.onLine
      return navigator.onLine
    }
  }, [finalConfig.testUrls, finalConfig.testTimeout])

  /**
   * Update network status
   */
  const updateNetworkStatus = useCallback(async () => {
    const isOnline = navigator.onLine
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection

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
      console.log(
        `Network quality changed: ${networkStatus.quality} → ${quality}`
      )

      // Log significant quality degradation
      if (
        (networkStatus.quality === 'excellent' && quality === 'poor') ||
        (networkStatus.quality === 'good' && quality === 'offline')
      ) {
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
    setNetworkStatus((prev) => ({
      ...prev,
      isOnline: false,
      quality: 'offline',
      lastUpdated: Date.now(),
    }))

    logNetworkError('Network connection lost', undefined, undefined, 'offline')
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
   * Check if network is suitable for exam - more lenient to prevent false warnings
   */
  const isNetworkSuitable = useCallback(() => {
    // During initialization, assume network is suitable to prevent false warnings
    if (!isInitializationComplete) {
      return true
    }

    // Only consider truly problematic cases
    if (!networkStatus.isOnline || networkStatus.quality === 'offline') {
      return false
    }

    // In production, be more lenient with poor connections
    if (
      process.env.NODE_ENV === 'production' &&
      networkStatus.quality === 'poor'
    ) {
      // Allow poor connections unless we have concrete evidence they're too slow
      const { downlink } = networkStatus
      if (downlink !== undefined && downlink < 0.5) {
        // Less than 0.5 Mbps
        return false
      }
      // If no concrete speed data, assume it's acceptable
      return true
    }

    // Development: original logic
    return networkStatus.quality !== 'poor'
  }, [networkStatus, isInitializationComplete])

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
      actions.push(
        'Pārbaudiet, vai nav problēmu ar interneta pakalpojumu sniedzēju'
      )
    } else if (networkStatus.quality === 'poor') {
      actions.push('Pārvietojieties tuvāk Wi-Fi rūterim')
      actions.push('Aizveriet citas internetu izmantojošās aplikācijas')
      actions.push('Izmantojiet stabilāku interneta savienojumu')
    } else if (networkStatus.saveData) {
      actions.push(
        'Datu taupīšanas režīms ir ieslēgts - tas var ietekmēt veiktspēju'
      )
    }

    return actions
  }, [networkStatus])

  // Handle initialization delay
  useEffect(() => {
    if (finalConfig.waitForInitialization && !isAppInitialized) {
      setIsInitializationComplete(false)
      return
    }

    if (!isInitializationComplete) {
      initializationTimeoutRef.current = window.setTimeout(() => {
        setIsInitializationComplete(true)
      }, finalConfig.initializationDelay)

      return () => {
        if (initializationTimeoutRef.current) {
          clearTimeout(initializationTimeoutRef.current)
        }
      }
    }
  }, [
    finalConfig.waitForInitialization,
    finalConfig.initializationDelay,
    isAppInitialized,
    isInitializationComplete,
  ])

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection changes
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    // Only do initial status check if initialization is complete
    if (isInitializationComplete) {
      updateNetworkStatus()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [
    handleOnline,
    handleOffline,
    handleConnectionChange,
    updateNetworkStatus,
    isInitializationComplete,
  ])

  // Set up periodic checks
  useEffect(() => {
    if (!finalConfig.enablePeriodicChecks || !isInitializationComplete) return

    checkIntervalRef.current = window.setInterval(() => {
      updateNetworkStatus()
    }, finalConfig.checkInterval)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [
    finalConfig.enablePeriodicChecks,
    finalConfig.checkInterval,
    updateNetworkStatus,
    isInitializationComplete,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current)
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
