export interface SummaryMetrics {
  requests: number
  rps: number
  errorRate: number
  avgLatency: number
  p95Latency: number
  p99Latency: number
}

export interface ReportOutput {
  type: 'console' | 'json' | 'html'
  path?: string
}

export interface ReportConfig {
  output: ReportOutput[]
}

export interface ReportData {
  project: string
  scenario: string
  timestamp: string
  load: {
    vus: number
    duration: string
  }
  summary: {
    requests: number
    rps: number
    errorRate: number
  }
  latency: {
    avg: number
    p95: number
    p99: number
  }
  endpoints?: EndpointMetrics[]
}

export interface EndpointMetrics {
  name: string
  requests: number
  errorRate: number
  avgLatency: number
  p95Latency: number
}

