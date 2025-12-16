import { ReportData } from './reporter.types'

/**
 * Generate JSON report string
 */
export function generateJsonReport(data: ReportData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Build report data object from metrics
 */
export function buildReportData(
  project: string,
  scenario: string,
  vus: number,
  duration: string,
  summary: {
    requests: number
    rps: number
    errorRate: number
  },
  latency: {
    avg: number
    p95: number
    p99: number
  }
): ReportData {
  return {
    project,
    scenario,
    timestamp: new Date().toISOString(),
    load: {
      vus,
      duration,
    },
    summary,
    latency,
  }
}

/**
 * Get filename for JSON report
 */
export function getReportFilename(project: string, scenario: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${project}-${scenario}-${timestamp}.json`
}

