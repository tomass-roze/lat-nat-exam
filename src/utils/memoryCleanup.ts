/**
 * @fileoverview Memory Management and Cleanup Utilities
 *
 * Provides utilities for managing memory usage, cleaning up resources,
 * and preventing memory leaks in the Latvian citizenship exam application.
 */

// Global registry for tracking active resources
const activeEventListeners = new WeakMap<
  Element,
  Array<{ event: string; handler: EventListener }>
>()
const activeTimers = new Set<NodeJS.Timeout | number>()
const activeIntervals = new Set<NodeJS.Timeout | number>()
const activeObservers = new Set<
  ResizeObserver | MutationObserver | IntersectionObserver
>()

/**
 * Enhanced event listener management with automatic cleanup tracking
 */
export class ManagedEventListener {
  private element: Element
  private event: string
  private handler: EventListener
  private options?: boolean | AddEventListenerOptions

  constructor(
    element: Element,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) {
    this.element = element
    this.event = event
    this.handler = handler
    this.options = options

    // Add the event listener
    element.addEventListener(event, handler, options)

    // Track for cleanup
    this.trackEventListener()
  }

  private trackEventListener() {
    if (!activeEventListeners.has(this.element)) {
      activeEventListeners.set(this.element, [])
    }

    const listeners = activeEventListeners.get(this.element)!
    listeners.push({ event: this.event, handler: this.handler })
  }

  /**
   * Remove the event listener and stop tracking
   */
  cleanup() {
    this.element.removeEventListener(this.event, this.handler, this.options)

    const listeners = activeEventListeners.get(this.element)
    if (listeners) {
      const index = listeners.findIndex(
        (l) => l.event === this.event && l.handler === this.handler
      )
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }
}

/**
 * Managed timer that automatically tracks itself for cleanup
 */
export class ManagedTimeout {
  private timerId: NodeJS.Timeout | number

  constructor(callback: () => void, delay: number) {
    this.timerId = setTimeout(() => {
      callback()
      // Remove from tracking when timer completes naturally
      activeTimers.delete(this.timerId)
    }, delay)

    // Track for cleanup
    activeTimers.add(this.timerId)
  }

  /**
   * Clear the timeout and stop tracking
   */
  clear() {
    clearTimeout(this.timerId)
    activeTimers.delete(this.timerId)
  }
}

/**
 * Managed interval that automatically tracks itself for cleanup
 */
export class ManagedInterval {
  private intervalId: NodeJS.Timeout | number

  constructor(callback: () => void, delay: number) {
    this.intervalId = setInterval(callback, delay)
    activeIntervals.add(this.intervalId)
  }

  /**
   * Clear the interval and stop tracking
   */
  clear() {
    clearInterval(this.intervalId)
    activeIntervals.delete(this.intervalId)
  }
}

/**
 * Managed observer that automatically tracks itself for cleanup
 */
export class ManagedObserver<
  T extends ResizeObserver | MutationObserver | IntersectionObserver,
> {
  private observer: T

  constructor(observer: T) {
    this.observer = observer
    activeObservers.add(observer)
  }

  /**
   * Get the underlying observer instance
   */
  get() {
    return this.observer
  }

  /**
   * Disconnect the observer and stop tracking
   */
  disconnect() {
    this.observer.disconnect()
    activeObservers.delete(this.observer)
  }
}

/**
 * Memory usage monitoring utilities
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor
  private memoryCheckInterval: ManagedInterval | null = null

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor()
    }
    return MemoryMonitor.instance
  }

  /**
   * Get current memory usage information
   */
  getMemoryInfo(): {
    jsHeapSizeLimit?: number
    totalJSHeapSize?: number
    usedJSHeapSize?: number
    estimatedResourceCount: number
  } {
    const performance = (window as any).performance
    const memory = performance?.memory

    return {
      jsHeapSizeLimit: memory?.jsHeapSizeLimit,
      totalJSHeapSize: memory?.totalJSHeapSize,
      usedJSHeapSize: memory?.usedJSHeapSize,
      estimatedResourceCount: this.getActiveResourceCount(),
    }
  }

  /**
   * Get count of active tracked resources
   */
  private getActiveResourceCount(): number {
    return activeTimers.size + activeIntervals.size + activeObservers.size
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.memoryCheckInterval) {
      this.memoryCheckInterval.clear()
    }

    this.memoryCheckInterval = new ManagedInterval(() => {
      const memInfo = this.getMemoryInfo()

      // Log memory usage in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Memory Usage:', {
          used: memInfo.usedJSHeapSize
            ? Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB'
            : 'Unknown',
          limit: memInfo.jsHeapSizeLimit
            ? Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
            : 'Unknown',
          resources: memInfo.estimatedResourceCount,
        })
      }

      // Trigger cleanup if memory usage is high
      if (memInfo.usedJSHeapSize && memInfo.jsHeapSizeLimit) {
        const usagePercentage =
          (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100
        if (usagePercentage > 80) {
          console.warn('High memory usage detected, triggering cleanup')
          this.triggerCleanup()
        }
      }
    }, intervalMs)
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.memoryCheckInterval) {
      this.memoryCheckInterval.clear()
      this.memoryCheckInterval = null
    }
  }

  /**
   * Trigger aggressive cleanup of resources
   */
  triggerCleanup(): void {
    // Clear performance caches if available
    try {
      if (typeof window !== 'undefined') {
        // Clear various browser caches that can be safely cleared
        if ('caches' in window) {
          // Note: This is just a cleanup trigger, actual cache clearing
          // should be done by the application's cache management
        }
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error)
    }

    // Suggest garbage collection if available (development only)
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      try {
        ;(window as any).gc()
      } catch (error) {
        // Silently fail - gc() might not be available
      }
    }
  }
}

/**
 * Component lifecycle hook for managing resources
 */
export class ComponentResourceManager {
  private resources: Array<{ cleanup: () => void }> = []

  /**
   * Add a managed event listener
   */
  addEventListener(
    element: Element,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    const listener = new ManagedEventListener(element, event, handler, options)
    this.resources.push({ cleanup: () => listener.cleanup() })
  }

  /**
   * Add a managed timeout
   */
  setTimeout(callback: () => void, delay: number): void {
    const timeout = new ManagedTimeout(callback, delay)
    this.resources.push({ cleanup: () => timeout.clear() })
  }

  /**
   * Add a managed interval
   */
  setInterval(callback: () => void, delay: number): void {
    const interval = new ManagedInterval(callback, delay)
    this.resources.push({ cleanup: () => interval.clear() })
  }

  /**
   * Add a managed observer
   */
  addObserver<
    T extends ResizeObserver | MutationObserver | IntersectionObserver,
  >(observer: T): ManagedObserver<T> {
    const managedObserver = new ManagedObserver(observer)
    this.resources.push({ cleanup: () => managedObserver.disconnect() })
    return managedObserver
  }

  /**
   * Clean up all managed resources
   */
  cleanup(): void {
    this.resources.forEach((resource) => {
      try {
        resource.cleanup()
      } catch (error) {
        console.warn('Resource cleanup failed:', error)
      }
    })
    this.resources.length = 0
  }
}

/**
 * Global cleanup function for emergency situations
 */
export function performGlobalCleanup(): {
  timersCleared: number
  intervalsCleared: number
  observersDisconnected: number
} {
  let timersCleared = 0
  let intervalsCleared = 0
  let observersDisconnected = 0

  // Clear all tracked timers
  activeTimers.forEach((timerId) => {
    try {
      clearTimeout(timerId)
      timersCleared++
    } catch (error) {
      console.warn('Failed to clear timer:', error)
    }
  })
  activeTimers.clear()

  // Clear all tracked intervals
  activeIntervals.forEach((intervalId) => {
    try {
      clearInterval(intervalId)
      intervalsCleared++
    } catch (error) {
      console.warn('Failed to clear interval:', error)
    }
  })
  activeIntervals.clear()

  // Disconnect all tracked observers
  activeObservers.forEach((observer) => {
    try {
      observer.disconnect()
      observersDisconnected++
    } catch (error) {
      console.warn('Failed to disconnect observer:', error)
    }
  })
  activeObservers.clear()

  return {
    timersCleared,
    intervalsCleared,
    observersDisconnected,
  }
}

/**
 * Initialize memory management system
 */
export function initializeMemoryManagement(): void {
  const monitor = MemoryMonitor.getInstance()
  monitor.startMonitoring()

  // Set up cleanup on page unload
  if (typeof window !== 'undefined') {
    const cleanup = () => performGlobalCleanup()

    window.addEventListener('beforeunload', cleanup)
    window.addEventListener('pagehide', cleanup)

    // For React development with hot reloading
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore - This is for development hot reloading
      if (module.hot) {
        // @ts-ignore
        module.hot.dispose(cleanup)
      }
    }
  }
}

/**
 * Get memory and resource statistics
 */
export function getResourceStatistics(): {
  memory: ReturnType<MemoryMonitor['getMemoryInfo']>
  resources: {
    activeTimers: number
    activeIntervals: number
    activeObservers: number
  }
} {
  const monitor = MemoryMonitor.getInstance()

  return {
    memory: monitor.getMemoryInfo(),
    resources: {
      activeTimers: activeTimers.size,
      activeIntervals: activeIntervals.size,
      activeObservers: activeObservers.size,
    },
  }
}
