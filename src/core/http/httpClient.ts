import http, { RefinedResponse, ResponseType } from 'k6/http'
import { HttpMethod, EndpointConfig, RequestMetric } from '../types'
import { getAuthHeader as getJwtAuthHeader } from '../auth/jwt'
import { metricsCollector } from '../metrics'

export interface HttpClientConfig {
  baseURL: string
  token?: string
  defaultHeaders?: Record<string, string>
}

export class HttpClient {
  private baseURL: string
  private token?: string
  private defaultHeaders: Record<string, string>

  constructor(config: HttpClientConfig) {
    this.baseURL = config.baseURL
    this.token = config.token
    this.defaultHeaders = config.defaultHeaders || {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token
  }

  /**
   * Get merged headers with auth
   */
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const authHeader = this.token ? getJwtAuthHeader(this.token) : {}
    return {
      ...this.defaultHeaders,
      ...authHeader,
      ...customHeaders,
    }
  }

  /**
   * Build full URL
   */
  private buildUrl(path: string): string {
    return `${this.baseURL}${path}`
  }

  /**
   * Record request metric
   */
  private recordMetric(
    endpoint: string,
    method: HttpMethod,
    response: RefinedResponse<ResponseType>,
    startTime: number
  ): void {
    const metric: RequestMetric = {
      endpoint,
      method,
      status: response.status,
      duration: Date.now() - startTime,
      timestamp: startTime,
      success: response.status >= 200 && response.status < 400,
    }
    metricsCollector.record(metric)
  }

  /**
   * GET request
   */
  get(
    path: string, 
    headers?: Record<string, string>
  ): RefinedResponse<ResponseType> {
    const startTime = Date.now()
    const response = http.get(this.buildUrl(path), {
      headers: this.getHeaders(headers),
    })
    this.recordMetric(path, 'GET', response, startTime)
    return response
  }

  /**
   * POST request
   */
  post(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): RefinedResponse<ResponseType> {
    const startTime = Date.now()
    const response = http.post(
      this.buildUrl(path),
      body ? JSON.stringify(body) : null,
      { headers: this.getHeaders(headers) }
    )
    this.recordMetric(path, 'POST', response, startTime)
    return response
  }

  /**
   * PUT request
   */
  put(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): RefinedResponse<ResponseType> {
    const startTime = Date.now()
    const response = http.put(
      this.buildUrl(path),
      body ? JSON.stringify(body) : null,
      { headers: this.getHeaders(headers) }
    )
    this.recordMetric(path, 'PUT', response, startTime)
    return response
  }

  /**
   * DELETE request
   */
  delete(
    path: string,
    headers?: Record<string, string>
  ): RefinedResponse<ResponseType> {
    const startTime = Date.now()
    const response = http.del(this.buildUrl(path), null, {
      headers: this.getHeaders(headers),
    })
    this.recordMetric(path, 'DELETE', response, startTime)
    return response
  }

  /**
   * Execute endpoint config
   */
  execute(endpoint: EndpointConfig): RefinedResponse<ResponseType> {
    const body = endpoint.body ? endpoint.body() : undefined

    switch (endpoint.method) {
      case 'GET':
        return this.get(endpoint.url, endpoint.headers)
      case 'POST':
        return this.post(endpoint.url, body, endpoint.headers)
      case 'PUT':
        return this.put(endpoint.url, body, endpoint.headers)
      case 'DELETE':
        return this.delete(endpoint.url, endpoint.headers)
      default:
        throw new Error(`Unsupported HTTP method: ${endpoint.method}`)
    }
  }
}

/**
 * Create HTTP client instance
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config)
}

