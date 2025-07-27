/**
 * @fileoverview Session management and persistence interfaces
 *
 * Defines types for managing exam sessions, data persistence, recovery,
 * and state synchronization across browser sessions.
 */

import type { TestState } from './exam'
import type { SelectedQuestions } from './questions'

/**
 * Complete session data stored in sessionStorage
 */
export interface SessionData {
  /** Current test state */
  testState: TestState

  /** Questions selected for this session */
  selectedQuestions: SelectedQuestions

  /** Unique session identifier */
  sessionId: string

  /** When this session expires */
  expiresAt: number

  /** Schema version for migration support */
  version: string

  /** Session metadata */
  metadata: SessionMetadata

  /** Checksum for data integrity verification */
  checksum: string
}

/**
 * Metadata associated with the session
 */
export interface SessionMetadata {
  /** When the session was created */
  createdAt: number

  /** When the session was last updated */
  lastUpdated: number

  /** Number of auto-saves performed */
  saveCount: number

  /** Browser information */
  browserInfo: BrowserInfo

  /** Session configuration used */
  config: SessionConfig

  /** Migration history if any */
  migrations: SessionMigration[]
}

/**
 * Browser information for session tracking
 */
export interface BrowserInfo {
  /** User agent string */
  userAgent: string

  /** Browser language setting */
  language: string

  /** Browser timezone */
  timezone: string

  /** Screen resolution */
  screen: {
    width: number
    height: number
    colorDepth: number
  }

  /** Cookie support enabled */
  cookieEnabled: boolean

  /** Local storage available */
  localStorage: boolean

  /** Session storage available */
  sessionStorage: boolean
}

/**
 * Session configuration settings
 */
export interface SessionConfig {
  /** Auto-save interval in milliseconds */
  autoSaveInterval: number

  /** Session duration in milliseconds */
  sessionDuration: number

  /** Storage key prefix */
  storageKey: string

  /** Enable compression for large data */
  compression: boolean

  /** Enable encryption for sensitive data */
  encryption: boolean

  /** Maximum storage size in bytes */
  maxStorageSize: number
}

/**
 * Session migration record
 */
export interface SessionMigration {
  /** Version migrated from */
  fromVersion: string

  /** Version migrated to */
  toVersion: string

  /** Migration timestamp */
  migratedAt: number

  /** Migration success status */
  success: boolean

  /** Migration notes or errors */
  notes?: string
}

/**
 * Session persistence operation result
 */
export interface SessionPersistenceResult {
  /** Whether the operation was successful */
  success: boolean

  /** Error information if failed */
  error?: SessionError

  /** Size of data saved/loaded in bytes */
  dataSize: number

  /** Operation timestamp */
  timestamp: number

  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Session error information
 */
export interface SessionError {
  /** Error code */
  code: SessionErrorCode

  /** Human-readable error message */
  message: string

  /** Technical details */
  details?: string

  /** Whether error is recoverable */
  recoverable: boolean

  /** Suggested action for recovery */
  suggestedAction?: string
}

/**
 * Session error codes
 */
export type SessionErrorCode =
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'STORAGE_NOT_AVAILABLE'
  | 'SESSION_EXPIRED'
  | 'INVALID_SESSION_DATA'
  | 'CHECKSUM_MISMATCH'
  | 'MIGRATION_FAILED'
  | 'SERIALIZATION_ERROR'
  | 'DESERIALIZATION_ERROR'
  | 'COMPRESSION_ERROR'
  | 'ENCRYPTION_ERROR'

/**
 * Session recovery information
 */
export interface SessionRecovery {
  /** Whether recovery is possible */
  canRecover: boolean

  /** Available recovery options */
  options: SessionRecoveryOption[]

  /** Automatically selected best option */
  recommendedOption?: SessionRecoveryOption

  /** Last known good state if available */
  lastKnownGoodState?: Partial<TestState>
}

/**
 * Session recovery option
 */
export interface SessionRecoveryOption {
  /** Unique identifier for this option */
  id: string

  /** Recovery method description */
  description: string

  /** Data that would be recovered */
  dataPreview: SessionRecoveryPreview

  /** Confidence level in recovery success */
  confidence: 'high' | 'medium' | 'low'

  /** Whether this option requires user confirmation */
  requiresConfirmation: boolean
}

/**
 * Preview of recoverable session data
 */
export interface SessionRecoveryPreview {
  /** When the session was last saved */
  lastSaved: number

  /** Progress percentage at time of save */
  progressPercentage: number

  /** Sections completed */
  completedSections: string[]

  /** Estimated data age */
  dataAge: string

  /** Data integrity status */
  integrityCheck: 'passed' | 'failed' | 'unknown'
}

/**
 * Auto-save configuration and status
 */
export interface AutoSaveConfig {
  /** Whether auto-save is enabled */
  enabled: boolean

  /** Save interval in milliseconds */
  interval: number

  /** Whether to save on window blur */
  saveOnBlur: boolean

  /** Whether to save on page visibility change */
  saveOnVisibilityChange: boolean

  /** Maximum number of save attempts before giving up */
  maxRetries: number

  /** Delay between retry attempts */
  retryDelay: number
}

/**
 * Auto-save status tracking
 */
export interface AutoSaveStatus {
  /** Last successful save timestamp */
  lastSave: number

  /** Number of failed save attempts */
  failedAttempts: number

  /** Whether auto-save is currently active */
  isActive: boolean

  /** Next scheduled save time */
  nextSave: number

  /** Current save operation in progress */
  saving: boolean

  /** Last save error if any */
  lastError?: SessionError
}

/**
 * Session state synchronization
 */
export interface SessionSync {
  /** Whether sync is enabled */
  enabled: boolean

  /** Sync conflicts detected */
  conflicts: SessionConflict[]

  /** Last sync timestamp */
  lastSync: number

  /** Sync status */
  status: 'synchronized' | 'conflicts' | 'error' | 'disabled'
}

/**
 * Session conflict information
 */
export interface SessionConflict {
  /** Conflict type */
  type: 'data_mismatch' | 'version_conflict' | 'timestamp_conflict'

  /** Field where conflict occurred */
  field: string

  /** Local value */
  localValue: unknown

  /** Remote/stored value */
  remoteValue: unknown

  /** Suggested resolution */
  resolution: 'use_local' | 'use_remote' | 'manual_merge'
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  /** Total quota in bytes */
  total: number

  /** Used space in bytes */
  used: number

  /** Available space in bytes */
  available: number

  /** Usage percentage */
  usagePercentage: number

  /** Whether approaching quota limit */
  nearLimit: boolean
}

/**
 * Type guards for session validation
 */

/**
 * Check if object is valid SessionData
 */
export function isValidSessionData(obj: unknown): obj is SessionData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as SessionData).sessionId === 'string' &&
    typeof (obj as SessionData).expiresAt === 'number' &&
    typeof (obj as SessionData).version === 'string' &&
    typeof (obj as SessionData).testState === 'object' &&
    typeof (obj as SessionData).selectedQuestions === 'object'
  )
}

/**
 * Check if session is expired
 */
export function isSessionExpired(sessionData: SessionData): boolean {
  return Date.now() > sessionData.expiresAt
}

/**
 * Check if session data is corrupted
 */
export function isSessionCorrupted(_sessionData: SessionData): boolean {
  // This would implement checksum validation
  return false
}

/**
 * Utility types for session management
 */

/** Session operation types */
export type SessionOperation = 'save' | 'load' | 'clear' | 'migrate' | 'recover'

/** Session state status */
export type SessionStatus =
  | 'active'
  | 'expired'
  | 'corrupted'
  | 'missing'
  | 'migrating'

/** Storage backend types */
export type StorageBackend =
  | 'sessionStorage'
  | 'localStorage'
  | 'indexedDB'
  | 'memory'

/** Session data serialization format */
export type SerializationFormat = 'json' | 'compressed' | 'encrypted'

/** Partial session update */
export type SessionUpdate = Partial<Pick<SessionData, 'testState' | 'metadata'>>

/** Session cleanup options */
export type SessionCleanupOptions = {
  clearExpired: boolean
  clearCorrupted: boolean
  clearAll: boolean
  preserveConfig: boolean
}
