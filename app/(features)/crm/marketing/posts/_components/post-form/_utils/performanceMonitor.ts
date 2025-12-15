/**
 * Performance Monitoring Utilities for PostForm
 *
 * Usage:
 * ```tsx
 * const monitor = usePerformanceMonitor('PostForm')
 *
 * useEffect(() => {
 *   monitor.mark('state-update')
 * }, [state])
 * ```
 */

export interface PerformanceMetrics {
  componentName: string
  renderCount: number
  averageRenderTime: number
  totalRenderTime: number
  lastRenderTime: number
  marks: Map<string, number>
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private renderStartTimes: Map<string, number> = new Map()

  /**
   * Start tracking a component render
   */
  startRender(componentName: string): void {
    this.renderStartTimes.set(componentName, performance.now())
  }

  /**
   * End tracking a component render
   */
  endRender(componentName: string): void {
    const startTime = this.renderStartTimes.get(componentName)
    if (!startTime) return

    const renderTime = performance.now() - startTime
    const existing = this.metrics.get(componentName)

    if (existing) {
      const newRenderCount = existing.renderCount + 1
      const newTotalTime = existing.totalRenderTime + renderTime

      this.metrics.set(componentName, {
        ...existing,
        renderCount: newRenderCount,
        totalRenderTime: newTotalTime,
        averageRenderTime: newTotalTime / newRenderCount,
        lastRenderTime: renderTime
      })
    } else {
      this.metrics.set(componentName, {
        componentName,
        renderCount: 1,
        totalRenderTime: renderTime,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        marks: new Map()
      })
    }

    this.renderStartTimes.delete(componentName)
  }

  /**
   * Mark a specific event
   */
  mark(componentName: string, markName: string): void {
    const metric = this.metrics.get(componentName)
    if (!metric) return

    const count = metric.marks.get(markName) || 0
    metric.marks.set(markName, count + 1)
  }

  /**
   * Get metrics for a component
   */
  getMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName)
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Log metrics to console
   */
  logMetrics(componentName?: string): void {
    if (componentName) {
      const metric = this.metrics.get(componentName)
      if (!metric) {
        console.warn(`[Performance] No metrics found for ${componentName}`)
        return
      }
      this.logMetric(metric)
    } else {
      console.group('[Performance] All Metrics')
      this.metrics.forEach(metric => this.logMetric(metric))
      console.groupEnd()
    }
  }

  private logMetric(metric: PerformanceMetrics): void {
    console.group(`[Performance] ${metric.componentName}`)
    console.log('Render Count:', metric.renderCount)
    console.log('Average Render Time:', `${metric.averageRenderTime.toFixed(2)}ms`)
    console.log('Total Render Time:', `${metric.totalRenderTime.toFixed(2)}ms`)
    console.log('Last Render Time:', `${metric.lastRenderTime.toFixed(2)}ms`)
    if (metric.marks.size > 0) {
      console.log('Marks:', Object.fromEntries(metric.marks))
    }
    console.groupEnd()
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
    this.renderStartTimes.clear()
  }

  /**
   * Clear metrics for a specific component
   */
  clearComponent(componentName: string): void {
    this.metrics.delete(componentName)
    this.renderStartTimes.delete(componentName)
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor()

export { performanceMonitor }

/**
 * React Hook for performance monitoring
 */
import { useEffect, useRef } from 'react'

export function usePerformanceMonitor(componentName: string, enabled: boolean = process.env.NODE_ENV === 'development') {
  const renderCountRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    renderCountRef.current += 1
    performanceMonitor.startRender(componentName)

    return () => {
      performanceMonitor.endRender(componentName)
    }
  })

  return {
    mark: (markName: string) => {
      if (enabled) {
        performanceMonitor.mark(componentName, markName)
      }
    },
    getMetrics: () => performanceMonitor.getMetrics(componentName),
    logMetrics: () => performanceMonitor.logMetrics(componentName)
  }
}

/**
 * HOC for performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  return function MonitoredComponent(props: P) {
    usePerformanceMonitor(componentName)
    return <Component {...props} />
  }
}
