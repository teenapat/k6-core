import { ReportData, SummaryMetrics } from './reporter.types'

/**
 * Format number with comma separators (k6 compatible)
 */
function formatNumber(num: number): string {
  // k6's goja engine doesn't support toLocaleString with locale
  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

/**
 * Print horizontal line
 */
function line(char: string = '─', length: number = 60): string {
  return char.repeat(length)
}

/**
 * Generate console report
 */
export function generateConsoleReport(data: ReportData): void {
  const { project, scenario, load, summary, latency } = data

  console.log('\n')
  console.log(line('═'))
  console.log(`  📊 K6 Load Test Report`)
  console.log(line('═'))
  console.log('')
  console.log(`  Project:   ${project}`)
  console.log(`  Scenario:  ${scenario}`)
  console.log(`  VUs:       ${load.vus}`)
  console.log(`  Duration:  ${load.duration}`)
  console.log(`  Time:      ${data.timestamp}`)
  console.log('')
  console.log(line('─'))
  console.log('  📈 Summary')
  console.log(line('─'))
  console.log(`  Total Requests:  ${formatNumber(summary.requests)}`)
  console.log(`  RPS:             ${summary.rps}`)
  console.log(`  Error Rate:      ${summary.errorRate}%`)
  console.log('')
  console.log(line('─'))
  console.log('  ⏱️  Latency')
  console.log(line('─'))
  console.log(`  Avg:             ${latency.avg}ms`)
  console.log(`  P95:             ${latency.p95}ms`)
  console.log(`  P99:             ${latency.p99}ms`)
  console.log('')

  // Status indicator
  const status = getStatus(summary)
  console.log(line('─'))
  console.log(`  Status: ${status}`)
  console.log(line('═'))
  console.log('')
}

/**
 * Get status indicator based on metrics
 */
function getStatus(summary: { errorRate: number; rps: number }): string {
  if (summary.errorRate > 5) {
    return '❌ FAILED - High error rate (>5%)'
  }
  if (summary.errorRate > 1) {
    return '⚠️  WARNING - Error rate above 1%'
  }
  return '✅ PASSED'
}

/**
 * Print summary metrics only (compact version)
 */
export function printSummary(metrics: SummaryMetrics): void {
  console.log(`\n📊 Quick Summary: ${metrics.requests} reqs | ${metrics.rps} rps | ${metrics.errorRate}% errors | avg ${metrics.avgLatency}ms | p95 ${metrics.p95Latency}ms\n`)
}

