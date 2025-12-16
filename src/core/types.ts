import { AuthConfig } from './auth/auth.types'
import { ReportConfig } from './reporter/reporter.types'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface EndpointConfig {
  name: string
  method: HttpMethod
  url: string
  body?: () => unknown
  headers?: Record<string, string>
}

export interface LoadProfile {
  vus: number
  duration: string
}

export interface ProjectConfig {
  name: string
  baseURL: string
  load: LoadProfile
  auth?: AuthConfig
  report?: ReportConfig
  endpoints?: EndpointConfig[]
}

export interface RequestMetric {
  endpoint: string
  method: HttpMethod
  status: number
  duration: number
  timestamp: number
  success: boolean
}

export interface TestContext {
  config: ProjectConfig
  token?: string
}

