/**
 * @fileoverview SessionStorage utilities for exam state persistence
 *
 * Provides robust sessionStorage operations with error handling, data validation,
 * quota management, and fallback mechanisms for the Latvian citizenship exam.
 */

import type {
  SessionData,
  SessionPersistenceResult,
  SessionError,
  SessionErrorCode,
  StorageQuota,
} from '@/types/session'
import { isValidSessionData, isSessionExpired } from '@/types/session'
import type { TestState } from '@/types/exam'
import type { SelectedQuestions } from '@/types/questions'

/**
 * Default configuration for session storage
 */
const DEFAULT_CONFIG = {
  STORAGE_KEY: 'latvian-exam-session',
  SESSION_DURATION: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB
  COMPRESSION_THRESHOLD: 1024, // Compress data larger than 1KB
  SCHEMA_VERSION: '1.0.0',
} as const

/**
 * Simple checksum calculation for data integrity
 */
function calculateChecksum(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get browser information for session metadata
 */
function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
    },
    cookieEnabled: navigator.cookieEnabled,
    localStorage: typeof Storage !== 'undefined' && !!window.localStorage,
    sessionStorage: typeof Storage !== 'undefined' && !!window.sessionStorage,
  }
}

/**
 * Check if sessionStorage is available and working
 */
export function isSessionStorageAvailable(): boolean {
  try {
    if (typeof Storage === 'undefined' || !window.sessionStorage) {
      return false
    }

    // Test actual functionality
    const testKey = '__session_storage_test__'
    const testValue = 'test'

    sessionStorage.setItem(testKey, testValue)
    const retrieved = sessionStorage.getItem(testKey)
    sessionStorage.removeItem(testKey)

    return retrieved === testValue
  } catch {
    return false
  }
}

/**
 * Get current storage quota information
 */
export async function getStorageQuota(): Promise<StorageQuota> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate()
      const total = estimate.quota || 0
      const used = estimate.usage || 0
      const available = total - used
      const usagePercentage = total > 0 ? (used / total) * 100 : 0

      return {
        total,
        used,
        available,
        usagePercentage,
        nearLimit: usagePercentage > 85,
      }
    } catch {
      // Fallback for browsers without storage.estimate()
    }
  }

  // Fallback estimation
  return {
    total: DEFAULT_CONFIG.MAX_STORAGE_SIZE,
    used: 0,
    available: DEFAULT_CONFIG.MAX_STORAGE_SIZE,
    usagePercentage: 0,
    nearLimit: false,
  }
}

/**
 * Compress data if it exceeds threshold
 */
function compressData(data: string): string {
  if (data.length < DEFAULT_CONFIG.COMPRESSION_THRESHOLD) {
    return data
  }

  // Simple LZ-like compression for demo purposes
  // In production, you might use a proper compression library
  try {
    return btoa(encodeURIComponent(data))
  } catch {
    return data
  }
}

/**
 * Decompress data
 */
function decompressData(data: string): string {
  try {
    return decodeURIComponent(atob(data))
  } catch {
    return data
  }
}

/**
 * Create session error object
 */
function createSessionError(
  code: SessionErrorCode,
  message: string,
  details?: string,
  recoverable = true,
  suggestedAction?: string
): SessionError {
  return {
    code,
    message,
    details,
    recoverable,
    suggestedAction,
  }
}

/**
 * Save session data to sessionStorage
 */
export async function saveSessionData(
  testState: TestState,
  selectedQuestions: SelectedQuestions,
  existingSessionId?: string
): Promise<SessionPersistenceResult> {
  const timestamp = Date.now()

  try {
    if (!isSessionStorageAvailable()) {
      return {
        success: false,
        error: createSessionError(
          'STORAGE_NOT_AVAILABLE',
          'SessionStorage is not available',
          'Browser may have disabled storage or be in private mode',
          false,
          'Please enable sessionStorage or use a different browser'
        ),
        dataSize: 0,
        timestamp,
      }
    }

    // Get storage quota
    const quota = await getStorageQuota()

    // Create session data
    const sessionData: SessionData = {
      testState,
      selectedQuestions,
      sessionId: existingSessionId || generateSessionId(),
      expiresAt: timestamp + DEFAULT_CONFIG.SESSION_DURATION,
      version: DEFAULT_CONFIG.SCHEMA_VERSION,
      metadata: {
        createdAt: existingSessionId
          ? JSON.parse(
              sessionStorage.getItem(DEFAULT_CONFIG.STORAGE_KEY) || '{}'
            ).metadata?.createdAt || timestamp
          : timestamp,
        lastUpdated: timestamp,
        saveCount: existingSessionId
          ? (JSON.parse(
              sessionStorage.getItem(DEFAULT_CONFIG.STORAGE_KEY) || '{}'
            ).metadata?.saveCount || 0) + 1
          : 1,
        browserInfo: getBrowserInfo(),
        config: {
          autoSaveInterval: 30000,
          sessionDuration: DEFAULT_CONFIG.SESSION_DURATION,
          storageKey: DEFAULT_CONFIG.STORAGE_KEY,
          compression: true,
          encryption: false,
          maxStorageSize: DEFAULT_CONFIG.MAX_STORAGE_SIZE,
        },
        migrations: [],
      },
      checksum: '',
    }

    // Serialize data
    const serializedData = JSON.stringify(sessionData)

    // Calculate checksum
    sessionData.checksum = calculateChecksum(serializedData)

    // Re-serialize with checksum
    const finalData = JSON.stringify(sessionData)
    const compressedData = compressData(finalData)

    // Check if data would exceed quota
    if (compressedData.length > quota.available) {
      return {
        success: false,
        error: createSessionError(
          'STORAGE_QUOTA_EXCEEDED',
          'Storage quota exceeded',
          `Data size: ${compressedData.length} bytes, Available: ${quota.available} bytes`,
          true,
          'Clear browser data or reduce exam content'
        ),
        dataSize: compressedData.length,
        timestamp,
      }
    }

    // Save to sessionStorage
    sessionStorage.setItem(DEFAULT_CONFIG.STORAGE_KEY, compressedData)

    return {
      success: true,
      dataSize: compressedData.length,
      timestamp,
      metadata: {
        sessionId: sessionData.sessionId,
        compressed: compressedData.length < finalData.length,
        saveCount: sessionData.metadata.saveCount,
      },
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      error: createSessionError(
        'SERIALIZATION_ERROR',
        'Failed to save session data',
        errorMessage,
        true,
        'Try refreshing the page'
      ),
      dataSize: 0,
      timestamp,
    }
  }
}

/**
 * Load session data from sessionStorage
 */
export function loadSessionData(): SessionPersistenceResult & {
  sessionData?: SessionData
} {
  const timestamp = Date.now()

  try {
    if (!isSessionStorageAvailable()) {
      return {
        success: false,
        error: createSessionError(
          'STORAGE_NOT_AVAILABLE',
          'SessionStorage is not available',
          undefined,
          false
        ),
        dataSize: 0,
        timestamp,
      }
    }

    const storedData = sessionStorage.getItem(DEFAULT_CONFIG.STORAGE_KEY)

    if (!storedData) {
      return {
        success: false,
        error: createSessionError(
          'INVALID_SESSION_DATA',
          'No session data found',
          undefined,
          false
        ),
        dataSize: 0,
        timestamp,
      }
    }

    // Decompress data
    const decompressedData = decompressData(storedData)

    // Parse JSON
    const sessionData = JSON.parse(decompressedData) as SessionData

    // Validate session data structure
    if (!isValidSessionData(sessionData)) {
      return {
        success: false,
        error: createSessionError(
          'INVALID_SESSION_DATA',
          'Session data is corrupted or invalid',
          'Data structure validation failed',
          true,
          'Clear browser data and start fresh'
        ),
        dataSize: storedData.length,
        timestamp,
      }
    }

    // Check if session is expired
    if (isSessionExpired(sessionData)) {
      // Clean up expired session
      clearSessionData()

      return {
        success: false,
        error: createSessionError(
          'SESSION_EXPIRED',
          'Session has expired',
          `Session expired at ${new Date(sessionData.expiresAt).toLocaleString()}`,
          false,
          'Start a new exam session'
        ),
        dataSize: storedData.length,
        timestamp,
      }
    }

    // Verify checksum
    const dataWithoutChecksum = { ...sessionData, checksum: '' }
    const calculatedChecksum = calculateChecksum(
      JSON.stringify(dataWithoutChecksum)
    )

    if (calculatedChecksum !== sessionData.checksum) {
      return {
        success: false,
        error: createSessionError(
          'CHECKSUM_MISMATCH',
          'Session data integrity check failed',
          `Expected: ${sessionData.checksum}, Got: ${calculatedChecksum}`,
          true,
          'Data may be corrupted, consider starting fresh'
        ),
        dataSize: storedData.length,
        timestamp,
      }
    }

    return {
      success: true,
      sessionData,
      dataSize: storedData.length,
      timestamp,
      metadata: {
        sessionId: sessionData.sessionId,
        isExpired: false,
        dataAge: timestamp - sessionData.metadata.lastUpdated,
        saveCount: sessionData.metadata.saveCount,
      },
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      error: createSessionError(
        'DESERIALIZATION_ERROR',
        'Failed to load session data',
        errorMessage,
        true,
        'Clear browser data and restart'
      ),
      dataSize: 0,
      timestamp,
    }
  }
}

/**
 * Clear session data from sessionStorage
 */
export function clearSessionData(): boolean {
  try {
    if (!isSessionStorageAvailable()) {
      return false
    }

    sessionStorage.removeItem(DEFAULT_CONFIG.STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

/**
 * Check if session exists and is valid
 */
export function hasValidSession(): boolean {
  const result = loadSessionData()
  return result.success && !!result.sessionData
}

/**
 * Get session metadata without loading full data
 */
export function getSessionMetadata() {
  try {
    if (!isSessionStorageAvailable()) {
      return null
    }

    const storedData = sessionStorage.getItem(DEFAULT_CONFIG.STORAGE_KEY)
    if (!storedData) {
      return null
    }

    const decompressedData = decompressData(storedData)
    const sessionData = JSON.parse(decompressedData) as SessionData

    if (!isValidSessionData(sessionData)) {
      return null
    }

    return {
      sessionId: sessionData.sessionId,
      expiresAt: sessionData.expiresAt,
      lastUpdated: sessionData.metadata.lastUpdated,
      saveCount: sessionData.metadata.saveCount,
      isExpired: isSessionExpired(sessionData),
      dataSize: storedData.length,
    }
  } catch {
    return null
  }
}

/**
 * Extend session expiry time
 */
export async function extendSession(): Promise<boolean> {
  const result = loadSessionData()

  if (!result.success || !result.sessionData) {
    return false
  }

  // Extend expiry by another 2 hours
  const extendedSessionData = {
    ...result.sessionData,
    expiresAt: Date.now() + DEFAULT_CONFIG.SESSION_DURATION,
    metadata: {
      ...result.sessionData.metadata,
      lastUpdated: Date.now(),
    },
  }

  const saveResult = await saveSessionData(
    extendedSessionData.testState,
    extendedSessionData.selectedQuestions,
    extendedSessionData.sessionId
  )

  return saveResult.success
}
