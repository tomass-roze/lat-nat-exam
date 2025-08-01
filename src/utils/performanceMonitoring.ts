/**
 * @fileoverview Performance Monitoring and Core Web Vitals Tracking
 *
 * Comprehensive performance monitoring system that tracks Core Web Vitals,
 * runtime performance metrics, and provides performance budgeting capabilities.
 */

// Performance metrics interface
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte

  // Custom metrics
  componentRenderTime?: number
  bundleLoadTime?: number
  memoryUsage?: number
  navigationTiming?: PerformanceNavigationTiming

  // Metadata
  timestamp: number
  url: string
  userAgent: string
}

// Performance budget thresholds
export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals thresholds (good/needs improvement/poor)
  LCP: { good: 2500, poor: 4000 }, // milliseconds
  FID: { good: 100, poor: 300 }, // milliseconds
  CLS: { good: 0.1, poor: 0.25 }, // score
  FCP: { good: 1800, poor: 3000 }, // milliseconds
  TTFB: { good: 800, poor: 1800 }, // milliseconds

  // Custom budgets
  BUNDLE_SIZE: { good: 500, poor: 1000 }, // KB (gzipped)
  MEMORY_USAGE: { good: 50, poor: 100 }, // MB
} as const

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private isMonitoring = false
  private observer?: PerformanceObserver

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true

    // Monitor navigation and paint timings
    this.observeNavigationTimings()

    // Monitor Core Web Vitals
    this.observeCoreWebVitals()

    // Monitor resource loading
    this.observeResourceTimings()

    // Monitor long tasks
    this.observeLongTasks()

    console.log('Performance monitoring started')
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false

    if (this.observer) {
      this.observer.disconnect()
      this.observer = undefined
    }

    console.log('Performance monitoring stopped')
  }

  /**
   * Observe navigation and paint timings
   */
  private observeNavigationTimings(): void {
    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.recordNavigationMetrics(entry as PerformanceNavigationTiming)
            }

            if (entry.entryType === 'paint') {
              this.recordPaintMetrics(entry as PerformancePaintTiming)
            }
          }
        })

        observer.observe({ entryTypes: ['navigation', 'paint'] })
        this.observer = observer
      }
    } catch (error) {
      console.warn('Navigation timing observation failed:', error)
    }
  }

  /**
   * Observe Core Web Vitals using web-vitals library approach
   */
  private observeCoreWebVitals(): void {
    // LCP (Largest Contentful Paint)
    this.observeLCP()

    // FID (First Input Delay)
    this.observeFID()

    // CLS (Cumulative Layout Shift)
    this.observeCLS()
  }

  /**
   * Observe LCP (Largest Contentful Paint)
   */
  private observeLCP(): void {
    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]

          if (lastEntry) {
            this.recordMetric('lcp', lastEntry.startTime)
          }
        })

        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      }
    } catch (error) {
      console.warn('LCP observation failed:', error)
    }
  }

  /**
   * Observe FID (First Input Delay)
   */
  private observeFID(): void {
    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              const fidEntry = entry as PerformanceEventTiming
              this.recordMetric(
                'fid',
                fidEntry.processingStart - fidEntry.startTime
              )
            }
          }
        })

        observer.observe({ entryTypes: ['first-input'] })
      }
    } catch (error) {
      console.warn('FID observation failed:', error)
    }
  }

  /**
   * Observe CLS (Cumulative Layout Shift)
   */
  private observeCLS(): void {
    try {
      if ('PerformanceObserver' in window) {
        let clsScore = 0

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (
              entry.entryType === 'layout-shift' &&
              !(entry as any).hadRecentInput
            ) {
              clsScore += (entry as any).value
              this.recordMetric('cls', clsScore)
            }
          }
        })

        observer.observe({ entryTypes: ['layout-shift'] })
      }
    } catch (error) {
      console.warn('CLS observation failed:', error)
    }
  }

  /**
   * Observe resource loading timings
   */
  private observeResourceTimings(): void {
    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              this.analyzeResourceTiming(entry as PerformanceResourceTiming)
            }
          }
        })

        observer.observe({ entryTypes: ['resource'] })
      }
    } catch (error) {
      console.warn('Resource timing observation failed:', error)
    }
  }

  /**
   * Observe long tasks that block the main thread
   */
  private observeLongTasks(): void {
    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              console.warn('Long task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              })
            }
          }
        })

        observer.observe({ entryTypes: ['longtask'] })
      }
    } catch (error) {
      console.warn('Long task observation failed:', error)
    }
  }

  /**
   * Record navigation metrics
   */
  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const metrics: Partial<PerformanceMetrics> = {
      ttfb: entry.responseStart - entry.requestStart,
      navigationTiming: entry,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    this.addMetrics(metrics)
  }

  /**
   * Record paint metrics
   */
  private recordPaintMetrics(entry: PerformancePaintTiming): void {
    if (entry.name === 'first-contentful-paint') {
      this.recordMetric('fcp', entry.startTime)
    }
  }

  /**
   * Analyze resource timing for optimization opportunities
   */
  private analyzeResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime

    // Flag slow resources
    if (duration > 2000) {
      // 2 seconds
      console.warn('Slow resource detected:', {
        name: entry.name,
        duration: Math.round(duration),
        size: entry.transferSize,
        type: this.getResourceType(entry.name),
      })
    }

    // Track bundle sizes
    if (entry.name.includes('index-') && entry.name.includes('.js')) {
      const sizeKB = Math.round((entry.transferSize || 0) / 1024)
      this.recordMetric('bundleLoadTime', duration)

      // Check against budget
      if (sizeKB > PERFORMANCE_BUDGETS.BUNDLE_SIZE.poor) {
        console.warn('Bundle size exceeds budget:', sizeKB + 'KB')
      }
    }
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript'
    if (url.includes('.css')) return 'stylesheet'
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg'))
      return 'image'
    if (url.includes('.woff') || url.includes('.ttf')) return 'font'
    return 'other'
  }

  /**
   * Record a specific metric
   */
  private recordMetric(key: keyof PerformanceMetrics, value: number): void {
    const metrics: Partial<PerformanceMetrics> = {
      [key]: value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    this.addMetrics(metrics)

    // Check against budgets
    this.checkBudget(key, value)
  }

  /**
   * Add metrics to collection
   */
  private addMetrics(metrics: Partial<PerformanceMetrics>): void {
    const fullMetrics: PerformanceMetrics = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...metrics,
    }

    this.metrics.push(fullMetrics)

    // Keep only last 100 entries to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }
  }

  /**
   * Check metric against performance budget
   */
  private checkBudget(metric: keyof PerformanceMetrics, value: number): void {
    const budgets: Record<string, any> = {
      lcp: PERFORMANCE_BUDGETS.LCP,
      fid: PERFORMANCE_BUDGETS.FID,
      cls: PERFORMANCE_BUDGETS.CLS,
      fcp: PERFORMANCE_BUDGETS.FCP,
      ttfb: PERFORMANCE_BUDGETS.TTFB,
    }

    const budget = budgets[metric]
    if (!budget) return

    let status = 'good'
    if (value > budget.poor) {
      status = 'poor'
    } else if (value > budget.good) {
      status = 'needs-improvement'
    }

    if (status !== 'good') {
      console.warn(`Performance budget exceeded for ${metric}:`, {
        value: Math.round(value),
        status,
        budget,
      })
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    coreWebVitals: Record<string, { value: number; status: string } | null>
    averages: Record<string, number>
    recentMetrics: PerformanceMetrics[]
  } {
    const recent = this.metrics.slice(-10)

    return {
      coreWebVitals: {
        lcp: this.getMetricSummary('lcp'),
        fid: this.getMetricSummary('fid'),
        cls: this.getMetricSummary('cls'),
        fcp: this.getMetricSummary('fcp'),
        ttfb: this.getMetricSummary('ttfb'),
      },
      averages: this.calculateAverages(),
      recentMetrics: recent,
    }
  }

  /**
   * Get metric summary with status
   */
  private getMetricSummary(
    metric: keyof PerformanceMetrics
  ): { value: number; status: string } | null {
    const values = this.metrics
      .map((m) => m[metric])
      .filter((v) => v !== undefined) as number[]

    if (values.length === 0) return null

    const latest = values[values.length - 1]
    const budgets: Record<string, any> = {
      lcp: PERFORMANCE_BUDGETS.LCP,
      fid: PERFORMANCE_BUDGETS.FID,
      cls: PERFORMANCE_BUDGETS.CLS,
      fcp: PERFORMANCE_BUDGETS.FCP,
      ttfb: PERFORMANCE_BUDGETS.TTFB,
    }

    const budget = budgets[metric]
    let status = 'good'

    if (budget) {
      if (latest > budget.poor) {
        status = 'poor'
      } else if (latest > budget.good) {
        status = 'needs-improvement'
      }
    }

    return { value: latest, status }
  }

  /**
   * Calculate metric averages
   */
  private calculateAverages(): Record<string, number> {
    const averages: Record<string, number> = {}
    const keys: (keyof PerformanceMetrics)[] = [
      'lcp',
      'fid',
      'cls',
      'fcp',
      'ttfb',
      'componentRenderTime',
      'bundleLoadTime',
    ]

    keys.forEach((key) => {
      const values = this.metrics
        .map((m) => m[key])
        .filter((v) => v !== undefined) as number[]

      if (values.length > 0) {
        averages[key] =
          values.reduce((sum, val) => sum + val, 0) / values.length
      }
    })

    return averages
  }

  /**
   * Measure component render time
   */
  measureComponentRender<T>(componentName: string, renderFn: () => T): T {
    const startTime = performance.now()
    const result = renderFn()
    const endTime = performance.now()

    const renderTime = endTime - startTime
    this.recordMetric('componentRenderTime', renderTime)

    if (renderTime > 16) {
      // 60fps threshold
      console.warn(
        `Slow component render: ${componentName} took ${Math.round(renderTime)}ms`
      )
    }

    return result
  }

  /**
   * Clear all collected metrics
   */
  clearMetrics(): void {
    this.metrics.length = 0
  }
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(): void {
  const monitor = PerformanceMonitor.getInstance()
  monitor.startMonitoring()

  // Log initial performance info
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      const summary = monitor.getPerformanceSummary()
      console.log('Performance Summary:', summary)
    }, 5000)
  }
}

/**
 * Get performance monitoring instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  return PerformanceMonitor.getInstance()
}

/**
 * Simple performance measurement utility
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const startTime = performance.now()
  const result = fn()
  const endTime = performance.now()

  console.log(`${name}: ${Math.round(endTime - startTime)}ms`)

  return result
}

/**
 * Async performance measurement utility
 */
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  const result = await fn()
  const endTime = performance.now()

  console.log(`${name}: ${Math.round(endTime - startTime)}ms`)

  return result
}
