import { Options } from 'k6/options'
import { authenticate as jwtAuth } from './core/auth/jwt'
import { authenticate as noAuth } from './core/auth/none'
import { createHttpClient } from './core/http/httpClient'
import { metricsCollector } from './core/metrics'
import { generateConsoleReport } from './core/reporter/console'
import { buildReportData, generateJsonReport } from './core/reporter/json'
import { runSimpleScenario } from './core/scenarios/simple'

// Import project config and endpoints
// 👉 เปลี่ยน project ที่นี่
import config from './projects/tasks-api/config'
import { endpoints } from './projects/tasks-api/endpoints'

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
 * Generates reports
 */
export function teardown(): void {
  console.log('\n📊 Generating reports...\n')

  // Get metrics summary
  const summary = metricsCollector.getSummary()

  // Build report data
  const reportData = buildReportData(
    config.name,
    'simple', // scenario name
    config.load.vus,
    config.load.duration,
    {
      requests: summary.requests,
      rps: summary.rps,
      errorRate: summary.errorRate,
    },
    {
      avg: summary.avgLatency,
      p95: summary.p95Latency,
      p99: summary.p99Latency,
    }
  )

  // Generate reports based on config
  if (config.report?.output) {
    for (const output of config.report.output) {
      if (output.type === 'console') {
        generateConsoleReport(reportData)
      } else if (output.type === 'json') {
        const jsonReport = generateJsonReport(reportData)
        console.log('📄 JSON Report:')
        console.log(jsonReport)
        // Note: K6 doesn't support file writing in teardown
        // Use handleSummary for file output
      }
    }
  } else {
    // Default: console report
    generateConsoleReport(reportData)
  }
}

/**
 * Handle K6 summary data
 * Use this for file output
 */
export function handleSummary(_data: unknown): Record<string, string> {
  const summary = metricsCollector.getSummary()
  
  const reportData = buildReportData(
    config.name,
    'simple',
    config.load.vus,
    config.load.duration,
    {
      requests: summary.requests,
      rps: summary.rps,
      errorRate: summary.errorRate,
    },
    {
      avg: summary.avgLatency,
      p95: summary.p95Latency,
      p99: summary.p99Latency,
    }
  )

  const outputs: Record<string, string> = {}

  // Check if JSON output is configured
  if (config.report?.output) {
    for (const output of config.report.output) {
      if (output.type === 'json' && output.path) {
        const filename = `${output.path}/${config.name}-report.json`
        outputs[filename] = generateJsonReport(reportData)
      }
    }
  }

  // Always output to stdout
  outputs['stdout'] = '\n'

  return outputs
}

