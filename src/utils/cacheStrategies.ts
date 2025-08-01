/**
 * @fileoverview Caching Strategies and Resource Management
 *
 * Implements various caching strategies for optimal performance:
 * - Service Worker for static asset caching
 * - Runtime caching for dynamic content
 * - Browser cache optimization
 * - Memory-based caching for frequently accessed data
 */

// Cache configuration
export const CACHE_CONFIG = {
  // Cache names
  STATIC_CACHE: 'latvian-exam-static-v1',
  DYNAMIC_CACHE: 'latvian-exam-dynamic-v1',

  // Cache durations (in milliseconds)
  STATIC_TTL: 30 * 24 * 60 * 60 * 1000, // 30 days
  DYNAMIC_TTL: 24 * 60 * 60 * 1000, // 1 day
  MEMORY_TTL: 5 * 60 * 1000, // 5 minutes

  // Cache limits
  MAX_DYNAMIC_ENTRIES: 50,
  MAX_MEMORY_ENTRIES: 100,
} as const

// Memory cache implementation
class MemoryCache<T> {
  private cache = new Map<string, { data: T; expires: number }>()
  private maxEntries: number
  private ttl: number

  constructor(
    maxEntries: number = CACHE_CONFIG.MAX_MEMORY_ENTRIES,
    ttl: number = CACHE_CONFIG.MEMORY_TTL
  ) {
    this.maxEntries = maxEntries
    this.ttl = ttl
  }

  set(key: string, data: T): void {
    // Remove expired entries before adding new ones
    this.cleanup()

    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttl,
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    this.cleanup()
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
      }
    }
  }
}

// Global memory caches for different content types
export const questionCache = new MemoryCache<any>(50, CACHE_CONFIG.DYNAMIC_TTL)
export const textProcessingCache = new MemoryCache<any>(
  100,
  CACHE_CONFIG.MEMORY_TTL
)
export const imageCache = new MemoryCache<string>(20, CACHE_CONFIG.STATIC_TTL)

/**
 * HTTP Cache utilities for optimizing network requests
 */
export class HTTPCacheManager {
  /**
   * Configure cache headers for different resource types
   */
  static getCacheHeaders(
    resourceType: 'static' | 'dynamic' | 'api'
  ): Record<string, string> {
    switch (resourceType) {
      case 'static':
        return {
          'Cache-Control': 'public, max-age=2592000', // 30 days
          ETag: `"${Date.now()}"`,
        }

      case 'dynamic':
        return {
          'Cache-Control': 'public, max-age=86400', // 1 day
          ETag: `"${Date.now()}"`,
        }

      case 'api':
        return {
          'Cache-Control': 'public, max-age=300', // 5 minutes
          ETag: `"${Date.now()}"`,
        }

      default:
        return {
          'Cache-Control': 'no-cache',
        }
    }
  }

  /**
   * Fetch with caching strategy
   */
  static async fetchWithCache(
    url: string,
    options: RequestInit = {},
    cacheStrategy:
      | 'cache-first'
      | 'network-first'
      | 'cache-only'
      | 'network-only' = 'cache-first'
  ): Promise<Response> {
    const cacheKey = url + JSON.stringify(options)

    switch (cacheStrategy) {
      case 'cache-first':
        return this.fetchCacheFirst(url, options, cacheKey)

      case 'network-first':
        return this.fetchNetworkFirst(url, options, cacheKey)

      case 'cache-only':
        return this.fetchCacheOnly(cacheKey)

      case 'network-only':
        return fetch(url, options)

      default:
        return fetch(url, options)
    }
  }

  private static async fetchCacheFirst(
    url: string,
    options: RequestInit,
    cacheKey: string
  ): Promise<Response> {
    try {
      const cache = await caches.open(CACHE_CONFIG.DYNAMIC_CACHE)
      const cachedResponse = await cache.match(cacheKey)

      if (cachedResponse) {
        // Return cached response and update in background
        this.updateCacheInBackground(url, options, cache, cacheKey)
        return cachedResponse
      }

      // Not in cache, fetch and cache
      const response = await fetch(url, options)
      if (response.ok) {
        cache.put(cacheKey, response.clone())
      }
      return response
    } catch (error) {
      console.warn('Cache-first fetch failed:', error)
      return fetch(url, options)
    }
  }

  private static async fetchNetworkFirst(
    url: string,
    options: RequestInit,
    cacheKey: string
  ): Promise<Response> {
    try {
      const response = await fetch(url, options)

      if (response.ok) {
        const cache = await caches.open(CACHE_CONFIG.DYNAMIC_CACHE)
        cache.put(cacheKey, response.clone())
      }

      return response
    } catch (error) {
      console.warn('Network fetch failed, trying cache:', error)

      const cache = await caches.open(CACHE_CONFIG.DYNAMIC_CACHE)
      const cachedResponse = await cache.match(cacheKey)

      if (cachedResponse) {
        return cachedResponse
      }

      throw error
    }
  }

  private static async fetchCacheOnly(cacheKey: string): Promise<Response> {
    const cache = await caches.open(CACHE_CONFIG.DYNAMIC_CACHE)
    const cachedResponse = await cache.match(cacheKey)

    if (cachedResponse) {
      return cachedResponse
    }

    throw new Error('Resource not found in cache')
  }

  private static async updateCacheInBackground(
    url: string,
    options: RequestInit,
    cache: Cache,
    cacheKey: string
  ): Promise<void> {
    try {
      const response = await fetch(url, options)
      if (response.ok) {
        await cache.put(cacheKey, response)
      }
    } catch (error) {
      console.warn('Background cache update failed:', error)
    }
  }
}

/**
 * Service Worker registration for advanced caching
 */
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager()
    }
    return ServiceWorkerManager.instance
  }

  /**
   * Register service worker
   */
  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('Service Worker registered successfully')

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found')
      })

      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  /**
   * Update service worker
   */
  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update()
    }
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      console.log('All caches cleared')
    } catch (error) {
      console.error('Failed to clear caches:', error)
    }
  }
}

/**
 * Resource prefetching utilities
 */
export class ResourcePrefetcher {
  private prefetchedUrls = new Set<string>()

  /**
   * Prefetch critical resources
   */
  async prefetchCriticalResources(): Promise<void> {
    const criticalResources = [
      '/api/questions/history',
      '/api/questions/constitution',
      // Add other critical resources
    ]

    await Promise.all(
      criticalResources.map((url) => this.prefetchResource(url))
    )
  }

  /**
   * Prefetch a single resource
   */
  async prefetchResource(
    url: string,
    priority: 'high' | 'low' = 'low'
  ): Promise<void> {
    if (this.prefetchedUrls.has(url)) {
      return
    }

    try {
      // Use different strategies based on priority
      if (priority === 'high') {
        await HTTPCacheManager.fetchWithCache(url, {}, 'network-first')
      } else {
        // Low priority - prefetch during idle time
        if ('requestIdleCallback' in window) {
          requestIdleCallback(async () => {
            await HTTPCacheManager.fetchWithCache(url, {}, 'cache-first')
          })
        } else {
          setTimeout(async () => {
            await HTTPCacheManager.fetchWithCache(url, {}, 'cache-first')
          }, 100)
        }
      }

      this.prefetchedUrls.add(url)
    } catch (error) {
      console.warn(`Failed to prefetch ${url}:`, error)
    }
  }

  /**
   * Prefetch based on user behavior predictions
   */
  predictivePreload(
    currentSection: 'anthem' | 'history' | 'constitution'
  ): void {
    switch (currentSection) {
      case 'anthem':
        // User likely to go to history next
        this.prefetchResource('/api/questions/history', 'high')
        break

      case 'history':
        // User likely to go to constitution next
        this.prefetchResource('/api/questions/constitution', 'high')
        break

      case 'constitution':
        // User likely to submit, prefetch results page resources
        this.prefetchResource('/api/results/template', 'low')
        break
    }
  }
}

/**
 * Cache warming strategies
 */
export async function warmupCaches(): Promise<void> {
  try {
    // Warm up critical caches
    const prefetcher = new ResourcePrefetcher()
    await prefetcher.prefetchCriticalResources()

    // Pre-cache common text processing results
    const commonTexts = [
      'Dievs, svētī Latviju',
      'mūs dārgo tēviju',
      // Add more common phrases
    ]

    commonTexts.forEach((text) => {
      textProcessingCache.set(`normalize:${text}`, text.toLowerCase().trim())
    })

    console.log('Cache warmup completed')
  } catch (error) {
    console.warn('Cache warmup failed:', error)
  }
}

/**
 * Initialize caching system
 */
export async function initializeCaching(): Promise<void> {
  // Register service worker
  const swManager = ServiceWorkerManager.getInstance()
  await swManager.register()

  // Warm up caches
  await warmupCaches()

  // Set up cache cleanup intervals
  setInterval(
    () => {
      questionCache.size() // Triggers cleanup
      textProcessingCache.size() // Triggers cleanup
      imageCache.size() // Triggers cleanup
    },
    5 * 60 * 1000
  ) // Every 5 minutes

  console.log('Caching system initialized')
}

/**
 * Get cache statistics
 */
export function getCacheStatistics(): {
  memory: {
    questions: number
    textProcessing: number
    images: number
  }
  browser: {
    supported: boolean
    storage?: StorageEstimate
  }
} {
  return {
    memory: {
      questions: questionCache.size(),
      textProcessing: textProcessingCache.size(),
      images: imageCache.size(),
    },
    browser: {
      supported: 'caches' in window,
      // Note: storage estimate would need to be fetched asynchronously
    },
  }
}
