/**
 * @fileoverview Browser Compatibility Detection and Graceful Degradation
 *
 * Detects browser capabilities, identifies compatibility issues, and provides
 * graceful degradation strategies for the Latvian citizenship exam application.
 */

import type { CompatibilityError, CompatibilityLevel } from '@/types/errors'
import { logError } from '@/utils/errorLogger'

/**
 * Browser information
 */
export interface BrowserInfo {
  name: string
  version: string
  majorVersion: number
  userAgent: string
  engine: string
  platform: string
  isMobile: boolean
  isTablet: boolean
}

/**
 * Feature support information
 */
export interface FeatureSupport {
  name: string
  supported: boolean
  alternative?: string
  fallback?: () => void
  critical: boolean
}

/**
 * Compatibility check result
 */
export interface CompatibilityResult {
  browserInfo: BrowserInfo
  supportLevel: CompatibilityLevel
  supportedFeatures: FeatureSupport[]
  unsupportedFeatures: FeatureSupport[]
  warnings: string[]
  recommendations: string[]
}

/**
 * Minimum browser version requirements
 */
const MIN_BROWSER_VERSIONS = {
  chrome: 88,
  firefox: 85,
  safari: 14,
  edge: 88,
  opera: 74,
  samsung: 15,
} as const

/**
 * Base feature test interface
 */
interface BaseFeatureTest {
  name: string
  test: () => boolean
  critical: boolean
  fallback?: () => void
  alternative?: string
}

/**
 * Feature detection functions
 */
const FEATURE_TESTS: Record<string, BaseFeatureTest> = {
  // Core JavaScript features
  es6: {
    name: 'ES6 Support',
    test: () => {
      try {
        new Function('(a = 0) => a')()
        return true
      } catch {
        return false
      }
    },
    critical: true,
    fallback: () =>
      console.warn('ES6 not supported - application may not work correctly'),
  },

  // Web APIs
  localStorage: {
    name: 'Local Storage',
    test: () => {
      try {
        const test = '__localStorage_test__'
        localStorage.setItem(test, 'test')
        localStorage.removeItem(test)
        return true
      } catch {
        return false
      }
    },
    critical: false,
    alternative: 'Session Storage',
    fallback: () =>
      console.warn('localStorage not available - using memory storage'),
  },

  sessionStorage: {
    name: 'Session Storage',
    test: () => {
      try {
        const test = '__sessionStorage_test__'
        sessionStorage.setItem(test, 'test')
        sessionStorage.removeItem(test)
        return true
      } catch {
        return false
      }
    },
    critical: true,
    alternative: 'Memory storage',
    fallback: () =>
      console.warn('sessionStorage not available - using memory storage'),
  },

  fetch: {
    name: 'Fetch API',
    test: () => typeof fetch === 'function',
    critical: true,
    alternative: 'XMLHttpRequest',
    fallback: () =>
      console.warn('Fetch API not supported - using XMLHttpRequest'),
  },

  // Modern JavaScript features
  promises: {
    name: 'Promises',
    test: () => typeof Promise === 'function',
    critical: true,
    alternative: 'Callback functions',
    fallback: () =>
      console.warn('Promises not supported - application may not work'),
  },

  asyncAwait: {
    name: 'Async/Await',
    test: () => {
      try {
        new Function('async () => {}')()
        return true
      } catch {
        return false
      }
    },
    critical: false,
    alternative: 'Promises',
    fallback: () => console.warn('Async/await not supported - using Promises'),
  },

  // CSS features
  flexbox: {
    name: 'CSS Flexbox',
    test: () => {
      const element = document.createElement('div')
      element.style.display = 'flex'
      return element.style.display === 'flex'
    },
    critical: false,
    alternative: 'CSS Grid or Float layouts',
    fallback: () =>
      console.warn('Flexbox not supported - using alternative layouts'),
  },

  cssgrid: {
    name: 'CSS Grid',
    test: () => {
      const element = document.createElement('div')
      element.style.display = 'grid'
      return element.style.display === 'grid'
    },
    critical: false,
    alternative: 'Flexbox or Float layouts',
    fallback: () =>
      console.warn('CSS Grid not supported - using alternative layouts'),
  },

  // Form features
  formValidation: {
    name: 'HTML5 Form Validation',
    test: () => {
      const input = document.createElement('input')
      return typeof input.checkValidity === 'function'
    },
    critical: false,
    alternative: 'JavaScript validation',
    fallback: () =>
      console.warn('HTML5 form validation not supported - using JS validation'),
  },

  // Audio/Video
  audio: {
    name: 'HTML5 Audio',
    test: () => {
      const audio = document.createElement('audio')
      return !!(audio.canPlayType && audio.canPlayType('audio/mpeg'))
    },
    critical: false,
    alternative: 'Flash player or no audio',
    fallback: () =>
      console.warn('HTML5 Audio not supported - disabling audio features'),
  },

  // Touch events
  touch: {
    name: 'Touch Events',
    test: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    critical: false,
    alternative: 'Mouse events',
    fallback: () =>
      console.log('Touch events not supported - using mouse events only'),
  },

  // Intersection Observer
  intersectionObserver: {
    name: 'Intersection Observer',
    test: () => 'IntersectionObserver' in window,
    critical: false,
    alternative: 'Scroll event listeners',
    fallback: () =>
      console.warn('IntersectionObserver not supported - using scroll events'),
  },

  // Service Workers
  serviceWorker: {
    name: 'Service Workers',
    test: () => 'serviceWorker' in navigator,
    critical: false,
    alternative: 'Application Cache or no offline support',
    fallback: () =>
      console.warn('Service Workers not supported - no offline functionality'),
  },
}

/**
 * Browser Compatibility Detector
 */
export class BrowserCompatibilityDetector {
  private browserInfo: BrowserInfo | null = null
  private compatibilityResult: CompatibilityResult | null = null

  /**
   * Detect browser information
   */
  public detectBrowser(): BrowserInfo {
    if (this.browserInfo) {
      return this.browserInfo
    }

    const userAgent = navigator.userAgent
    let name = 'unknown'
    let version = '0'
    let engine = 'unknown'

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      name = 'chrome'
      const match = userAgent.match(/Chrome\/(\d+)/)
      version = match ? match[1] : '0'
      engine = 'blink'
    }
    // Edge
    else if (userAgent.includes('Edg')) {
      name = 'edge'
      const match = userAgent.match(/Edg\/(\d+)/)
      version = match ? match[1] : '0'
      engine = 'blink'
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      name = 'firefox'
      const match = userAgent.match(/Firefox\/(\d+)/)
      version = match ? match[1] : '0'
      engine = 'gecko'
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'safari'
      const match = userAgent.match(/Version\/(\d+)/)
      version = match ? match[1] : '0'
      engine = 'webkit'
    }
    // Opera
    else if (userAgent.includes('OPR')) {
      name = 'opera'
      const match = userAgent.match(/OPR\/(\d+)/)
      version = match ? match[1] : '0'
      engine = 'blink'
    }
    // Samsung Internet
    else if (userAgent.includes('SamsungBrowser')) {
      name = 'samsung'
      const match = userAgent.match(/SamsungBrowser\/(\d+)/)
      version = match ? match[1] : '0'
      engine = 'blink'
    }

    const majorVersion = parseInt(version, 10)
    const platform = this.detectPlatform(userAgent)
    const isMobile =
      /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      )
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent)

    this.browserInfo = {
      name,
      version,
      majorVersion,
      userAgent,
      engine,
      platform,
      isMobile,
      isTablet,
    }

    return this.browserInfo
  }

  /**
   * Detect platform
   */
  private detectPlatform(userAgent: string): string {
    if (/Windows/i.test(userAgent)) return 'Windows'
    if (/Mac OS X/i.test(userAgent)) return 'macOS'
    if (/Linux/i.test(userAgent)) return 'Linux'
    if (/Android/i.test(userAgent)) return 'Android'
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS'
    return 'Unknown'
  }

  /**
   * Check browser version compatibility
   */
  private checkVersionCompatibility(
    browserInfo: BrowserInfo
  ): CompatibilityLevel {
    const minVersion =
      MIN_BROWSER_VERSIONS[
        browserInfo.name as keyof typeof MIN_BROWSER_VERSIONS
      ]

    if (!minVersion) {
      return 'limited' // Unknown browser
    }

    if (browserInfo.majorVersion >= minVersion) {
      return 'supported'
    }

    if (browserInfo.majorVersion >= minVersion - 5) {
      return 'limited' // Recent enough but not ideal
    }

    return 'unsupported'
  }

  /**
   * Test feature support
   */
  private testFeatures(): {
    supported: FeatureSupport[]
    unsupported: FeatureSupport[]
  } {
    const supported: FeatureSupport[] = []
    const unsupported: FeatureSupport[] = []

    Object.entries(FEATURE_TESTS).forEach(([, config]) => {
      const isSupported = config.test()
      const feature: FeatureSupport = {
        name: config.name,
        supported: isSupported,
        alternative: config.alternative,
        fallback: config.fallback,
        critical: config.critical,
      }

      if (isSupported) {
        supported.push(feature)
      } else {
        unsupported.push(feature)

        // Execute fallback if feature is not supported
        if (config.fallback) {
          config.fallback()
        }

        // Log compatibility error for critical features
        if (config.critical) {
          this.logCompatibilityError(config.name, feature)
        }
      }
    })

    return { supported, unsupported }
  }

  /**
   * Log compatibility error
   */
  private logCompatibilityError(
    featureName: string,
    feature: FeatureSupport
  ): void {
    const browserInfo = this.detectBrowser()

    const compatibilityError: CompatibilityError = {
      id: `compat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: `Funkcija "${featureName}" nav atbalstīta jūsu pārlūkprogrammā`,
      details: `Browser: ${browserInfo.name} ${browserInfo.version}`,
      severity: feature.critical ? 'error' : 'warning',
      category: 'compatibility',
      timestamp: Date.now(),
      recoverable: !!feature.alternative,
      suggestedActions: feature.alternative ? ['fallback'] : ['refresh'],
      feature: featureName,
      browser: {
        name: browserInfo.name,
        version: browserInfo.version,
        userAgent: browserInfo.userAgent,
      },
      compatibilityLevel: feature.critical ? 'unsupported' : 'limited',
      alternatives: feature.alternative ? [feature.alternative] : undefined,
    }

    logError(compatibilityError, {
      environment: {
        userAgent: browserInfo.userAgent,
        language: navigator.language,
        screenSize: {
          width: window.screen.width,
          height: window.screen.height,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookieEnabled: navigator.cookieEnabled,
        localStorage: feature.name !== 'Local Storage',
        sessionStorage: feature.name !== 'Session Storage',
      },
    })
  }

  /**
   * Generate warnings and recommendations
   */
  private generateWarningsAndRecommendations(
    browserInfo: BrowserInfo,
    supportLevel: CompatibilityLevel,
    unsupportedFeatures: FeatureSupport[]
  ): { warnings: string[]; recommendations: string[] } {
    const warnings: string[] = []
    const recommendations: string[] = []

    // Browser version warnings
    if (supportLevel === 'unsupported') {
      warnings.push(
        `Jūsu pārlūkprogramma ${browserInfo.name} ${browserInfo.version} nav pilnībā atbalstīta`
      )
      recommendations.push(
        'Atjauniniet savu pārlūkprogrammu uz jaunāko versiju'
      )
    } else if (supportLevel === 'limited') {
      warnings.push(`Jūsu pārlūkprogramma var darboties ar ierobežojumiem`)
      recommendations.push(
        'Ieteicams atjaunināt pārlūkprogrammu labākai veiktspējai'
      )
    }

    // Critical feature warnings
    const criticalUnsupported = unsupportedFeatures.filter((f) => f.critical)
    if (criticalUnsupported.length > 0) {
      warnings.push(
        `Svarīgas funkcijas nav atbalstītas: ${criticalUnsupported.map((f) => f.name).join(', ')}`
      )
      recommendations.push(
        'Izmantojiet modernu pārlūkprogrammu (Chrome, Firefox, Safari, Edge)'
      )
    }

    // Mobile-specific recommendations
    if (browserInfo.isMobile) {
      recommendations.push(
        'Lai izvairītos no pārtraukumiem, izmantojiet stabilu Wi-Fi savienojumu'
      )
      recommendations.push(
        'Novietojiet ierīci horizontāli labākai satura apskatei'
      )
    }

    // Old browser specific recommendations
    if (browserInfo.name === 'chrome' && browserInfo.majorVersion < 80) {
      recommendations.push(
        'Chrome versija ir novecojusi - atjauniniet uz Chrome 88 vai jaunāku'
      )
    }
    if (browserInfo.name === 'firefox' && browserInfo.majorVersion < 78) {
      recommendations.push(
        'Firefox versija ir novecojusi - atjauniniet uz Firefox 85 vai jaunāku'
      )
    }
    if (browserInfo.name === 'safari' && browserInfo.majorVersion < 13) {
      recommendations.push(
        'Safari versija ir novecojusi - atjauniniet macOS vai iOS'
      )
    }

    return { warnings, recommendations }
  }

  /**
   * Perform comprehensive compatibility check
   */
  public performCompatibilityCheck(): CompatibilityResult {
    if (this.compatibilityResult) {
      return this.compatibilityResult
    }

    const browserInfo = this.detectBrowser()
    const supportLevel = this.checkVersionCompatibility(browserInfo)
    const { supported, unsupported } = this.testFeatures()
    const { warnings, recommendations } =
      this.generateWarningsAndRecommendations(
        browserInfo,
        supportLevel,
        unsupported
      )

    this.compatibilityResult = {
      browserInfo,
      supportLevel,
      supportedFeatures: supported,
      unsupportedFeatures: unsupported,
      warnings,
      recommendations,
    }

    // Log overall compatibility status
    if (supportLevel === 'unsupported' || unsupported.some((f) => f.critical)) {
      console.warn(
        'Browser compatibility issues detected:',
        this.compatibilityResult
      )
    } else {
      console.log(
        'Browser compatibility check passed:',
        this.compatibilityResult
      )
    }

    return this.compatibilityResult
  }

  /**
   * Check if application can run
   */
  public canApplicationRun(): boolean {
    const result = this.performCompatibilityCheck()
    return (
      result.supportLevel !== 'unsupported' &&
      !result.unsupportedFeatures.some((f) => f.critical)
    )
  }

  /**
   * Apply compatibility fixes
   */
  public applyCompatibilityFixes(): void {
    const result = this.performCompatibilityCheck()

    // Apply CSS classes for browser-specific styling
    document.documentElement.classList.add(`browser-${result.browserInfo.name}`)
    document.documentElement.classList.add(
      `browser-${result.browserInfo.name}-${result.browserInfo.majorVersion}`
    )
    document.documentElement.classList.add(
      `engine-${result.browserInfo.engine}`
    )
    document.documentElement.classList.add(
      `platform-${result.browserInfo.platform.toLowerCase()}`
    )

    if (result.browserInfo.isMobile) {
      document.documentElement.classList.add('is-mobile')
    }
    if (result.browserInfo.isTablet) {
      document.documentElement.classList.add('is-tablet')
    }

    // Apply feature-based classes
    result.supportedFeatures.forEach((feature) => {
      const className = feature.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      document.documentElement.classList.add(`has-${className}`)
    })

    result.unsupportedFeatures.forEach((feature) => {
      const className = feature.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      document.documentElement.classList.add(`no-${className}`)
    })

    // Set compatibility level
    document.documentElement.classList.add(`compat-${result.supportLevel}`)
  }

  /**
   * Get user-friendly compatibility message
   */
  public getCompatibilityMessage(): string {
    const result = this.performCompatibilityCheck()

    if (
      result.supportLevel === 'supported' &&
      result.unsupportedFeatures.length === 0
    ) {
      return 'Jūsu pārlūkprogramma ir pilnībā atbalstīta'
    }

    if (result.supportLevel === 'supported') {
      return 'Jūsu pārlūkprogramma ir atbalstīta ar nelieliem ierobežojumiem'
    }

    if (result.supportLevel === 'limited') {
      return 'Jūsu pārlūkprogramma darbojas ar ierobežojumiem. Ieteicams atjaunināt.'
    }

    return 'Jūsu pārlūkprogramma nav pilnībā atbalstīta. Lūdzu, izmantojiet modernu pārlūkprogrammu.'
  }
}

/**
 * Global compatibility detector instance
 */
export const browserCompatibility = new BrowserCompatibilityDetector()

/**
 * Initialize browser compatibility checking
 */
export function initializeBrowserCompatibility(): CompatibilityResult {
  const result = browserCompatibility.performCompatibilityCheck()
  browserCompatibility.applyCompatibilityFixes()

  // Show compatibility warning if needed
  if (result.supportLevel === 'unsupported' || result.warnings.length > 0) {
    console.warn('Browser compatibility issues:', result)
  }

  return result
}

/**
 * Check if browser is compatible
 */
export function isBrowserCompatible(): boolean {
  return browserCompatibility.canApplicationRun()
}

/**
 * Get browser information
 */
export function getBrowserInfo(): BrowserInfo {
  return browserCompatibility.detectBrowser()
}

/**
 * Get compatibility result
 */
export function getCompatibilityResult(): CompatibilityResult {
  return browserCompatibility.performCompatibilityCheck()
}
