import { RequestMetric } from './types'
import { SummaryMetrics } from './reporter/reporter.types'

/**
 * Metrics collector - stores and analyzes request metrics
 */
class MetricsCollector {
  private metrics: RequestMetric[] = []
  private startTime: number = Date.now()

  /**
   * Record a request metric
   */
  record(metric: RequestMetric): void {
    this.metrics.push(metric)
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = []
    this.startTime = Date.now()
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): RequestMetric[] {
    return [...this.metrics]
  }

  /**
   * Calculate percentile value from array
   */
  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * Calculate summary metrics
   */
  getSummary(): SummaryMetrics {
    const totalRequests = this.metrics.length
    const durations = this.metrics.map(m => m.duration)
    const errors = this.metrics.filter(m => !m.success).length
    
    const elapsedSeconds = Math.max(1, (Date.now() - this.startTime) / 1000)
    const rps = Math.round((totalRequests / elapsedSeconds) * 100) / 100

    const avgLatency = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0

    return {
      requests: totalRequests,
      rps,
      errorRate: totalRequests > 0 
        ? Math.round((errors / totalRequests) * 10000) / 100 
        : 0,
      avgLatency,
      p95Latency: this.percentile(durations, 95),
      p99Latency: this.percentile(durations, 99),
    }
  }

  /**
   * Get metrics grouped by endpoint
   */
  getByEndpoint(): Map<string, RequestMetric[]> {
    const grouped = new Map<string, RequestMetric[]>()
    
    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.endpoint}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(metric)
    }
    
    return grouped
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector()

