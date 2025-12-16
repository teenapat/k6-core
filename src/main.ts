import { Options } from 'k6/options'
import { authenticate as jwtAuth } from './core/auth/jwt'
import { authenticate as noAuth } from './core/auth/none'
import { createHttpClient } from './core/http/httpClient'
import { generateHtmlReport } from './core/reporter/html'
import { buildReportData, generateJsonReport } from './core/reporter/json'
import { runSimpleScenario } from './core/scenarios/simple'

// Import project config and endpoints
// 👉 เปลี่ยน project ที่นี่
import config from './projects/products-api/config'
import { endpoints } from './projects/products-api/endpoints'

// K6 Options - from project config
export const options: Options = {
  vus: config.load.vus,
  duration: config.load.duration,
}

/**
 * Setup function - runs once before the test
 * Handles authentication if configured
 */
export function setup(): { token?: string } {
  console.log(`\n🚀 Starting load test for: ${config.name}`)
  console.log(`   VUs: ${config.load.vus} | Duration: ${config.load.duration}\n`)

  // Handle authentication
  if (config.auth) {
    if (config.auth.type === 'jwt') {
      console.log('🔐 Authenticating with JWT...')
      const authResult = jwtAuth(config.baseURL, config.auth)
      
      if (!authResult.success) {
        console.error(`❌ Authentication failed: ${authResult.error}`)
        throw new Error(`Authentication failed: ${authResult.error}`)
      }
      
      console.log('✅ Authentication successful\n')
      return { token: authResult.token }
    } else if (config.auth.type === 'none') {
      const authResult = noAuth()
      return { token: authResult.token }
    }
  }

  return {}
}

/**
 * Default function - runs for each VU iteration
 */
export default function(data: { token?: string }): void {
  // Create HTTP client with token from setup
  const client = createHttpClient({
    baseURL: config.baseURL,
    token: data.token,
  })

  // Run simple scenario with all endpoints
  runSimpleScenario(client, {
    endpoints,
    thinkTime: 1,
  })
}

/**
 * Teardown function - runs once after the test
 * Note: Reports are generated in handleSummary() which has access to k6 metrics
 */
export function teardown(): void {
  console.log('\n📊 Generating reports...\n')
}

/**
 * K6 Summary Data types
 */
interface K6Metric {
  values: {
    count?: number
    rate?: number
    avg?: number
    med?: number
    'p(95)'?: number
    'p(99)'?: number
    passes?: number
    fails?: number
  }
}

interface K6SummaryData {
  metrics: {
    http_reqs?: K6Metric
    http_req_duration?: K6Metric
    checks?: K6Metric
    iterations?: K6Metric
    [key: string]: K6Metric | undefined
  }
  state: {
    testRunDurationMs: number
  }
}

/**
 * Handle K6 summary data
 * Use this for file output
 */
export function handleSummary(data: K6SummaryData): Record<string, string> {
  // Extract metrics from k6's built-in data
  const httpReqs = data.metrics.http_reqs?.values.count || 0
  const duration = data.metrics.http_req_duration?.values || {}
  const checks = data.metrics.checks?.values || {}
  const testDurationSec = data.state.testRunDurationMs / 1000

  // Calculate RPS from actual data
  const rps = testDurationSec > 0 
    ? Math.round((httpReqs / testDurationSec) * 100) / 100 
    : 0

  // Calculate error rate from checks (if any)
  const totalChecks = (checks.passes || 0) + (checks.fails || 0)
  const errorRate = totalChecks > 0
    ? Math.round(((checks.fails || 0) / totalChecks) * 10000) / 100
    : 0

  const reportData = buildReportData(
    config.name,
    'simple',
    config.load.vus,
    config.load.duration,
    {
      requests: httpReqs,
      rps,
      errorRate,
    },
    {
      avg: Math.round(duration.avg || 0),
      p95: Math.round(duration['p(95)'] || 0),
      p99: Math.round(duration['p(99)'] || 0),
    }
  )

  const outputs: Record<string, string> = {}

  // Generate reports based on config
  if (config.report?.output) {
    for (const output of config.report.output) {
      if (output.type === 'console') {
        // Build console output string
        outputs['stdout'] = buildConsoleOutput(reportData)
      }
      if (output.type === 'json' && output.path) {
        const filename = `${output.path}/${config.name}-report.json`
        outputs[filename] = generateJsonReport(reportData)
      }
      if (output.type === 'html' && output.path) {
        const filename = `${output.path}/${config.name}-report.html`
        outputs[filename] = generateHtmlReport(reportData)
      }
    }
  }

  // Ensure stdout has something
  if (!outputs['stdout']) {
    outputs['stdout'] = buildConsoleOutput(reportData)
  }

  return outputs
}

/**
 * Build console output string for handleSummary
 */
function buildConsoleOutput(data: ReturnType<typeof buildReportData>): string {
  const line = (char: string, len: number = 60) => char.repeat(len)
  const fmt = (n: number) => {
    const parts = n.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
  }

  return `
${line('═')}
  📊 K6 Load Test Report
${line('═')}

  Project:   ${data.project}
  Scenario:  ${data.scenario}
  VUs:       ${data.load.vus}
  Duration:  ${data.load.duration}
  Time:      ${data.timestamp}

${line('─')}
  📈 Summary
${line('─')}
  Total Requests:  ${fmt(data.summary.requests)}
  RPS:             ${data.summary.rps}
  Error Rate:      ${data.summary.errorRate}%

${line('─')}
  ⏱️  Latency
${line('─')}
  Avg:             ${data.latency.avg}ms
  P95:             ${data.latency.p95}ms
  P99:             ${data.latency.p99}ms

${line('─')}
  Status: ${data.summary.errorRate > 5 ? '❌ FAILED' : data.summary.errorRate > 1 ? '⚠️  WARNING' : '✅ PASSED'}
${line('═')}
`
}

