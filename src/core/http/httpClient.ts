import http, { RefinedResponse, ResponseType } from 'k6/http';
import {
  HttpMethod,
  EndpointConfig,
  RequestMetric,
  RequestContext,
  DynamicValue,
  resolveDynamicValue,
  getNestedValue,
} from '../types';
import { getAuthHeader as getJwtAuthHeader } from '../auth/jwt';
import { parseApiKeyToken, getAuthHeader as getApiKeyAuthHeader, getAuthQueryParams } from '../auth/apiKey';
import { isBasicToken, getAuthHeader as getBasicAuthHeader } from '../auth/basic';
import { metricsCollector } from '../metrics';

export interface HttpClientConfig {
  baseURL: string;
  token?: string;
  defaultHeaders?: Record<string, string>;
}

export class HttpClient {
  private baseURL: string;
  private token?: string;
  private defaultHeaders: Record<string, string>;
  private context: RequestContext = {};

  constructor(config: HttpClientConfig) {
    this.baseURL = config.baseURL;
    this.token = config.token;
    this.defaultHeaders = config.defaultHeaders || {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Get current request context
   */
  getContext(): RequestContext {
    return { ...this.context };
  }

  /**
   * Set context value
   */
  setContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Get merged headers with auth
   */
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    let authHeader: Record<string, string> = {};

    if (this.token) {
      // Check token type and get appropriate header
      if (this.token.startsWith('apiKey:')) {
        const apiKeyConfig = parseApiKeyToken(this.token);
        if (apiKeyConfig) {
          authHeader = getApiKeyAuthHeader(apiKeyConfig);
        }
      } else if (isBasicToken(this.token)) {
        authHeader = getBasicAuthHeader(this.token);
      } else {
        // Default: JWT Bearer token
        authHeader = getJwtAuthHeader(this.token);
      }
    }

    return {
      ...this.defaultHeaders,
      ...authHeader,
      ...customHeaders,
    };
  }

  /**
   * Build URL with path params replaced
   */
  private buildUrlWithParams(
    path: string,
    pathParams?: Record<string, DynamicValue<string | number>>,
    queryParams?: Record<string, DynamicValue<string | number | boolean>>
  ): string {
    let url = path;

    // Replace path parameters: /users/{userId} → /users/123
    if (pathParams) {
      for (const [key, value] of Object.entries(pathParams)) {
        const resolvedValue = resolveDynamicValue(value, this.context);
        url = url.replace(`{${key}}`, String(resolvedValue));
      }
    }

    // Add query parameters
    if (queryParams) {
      const params: string[] = [];
      for (const [key, value] of Object.entries(queryParams)) {
        const resolvedValue = resolveDynamicValue(value, this.context);
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(resolvedValue))}`);
      }

      // Handle API Key in query if present
      if (this.token?.startsWith('apiKey:')) {
        const apiKeyConfig = parseApiKeyToken(this.token);
        if (apiKeyConfig) {
          const apiKeyParams = getAuthQueryParams(apiKeyConfig);
          for (const [key, value] of Object.entries(apiKeyParams)) {
            params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
          }
        }
      }

      if (params.length > 0) {
        url += (url.includes('?') ? '&' : '?') + params.join('&');
      }
    } else if (this.token?.startsWith('apiKey:')) {
      // Add API Key query params even if no other query params
      const apiKeyConfig = parseApiKeyToken(this.token);
      if (apiKeyConfig) {
        const apiKeyParams = getAuthQueryParams(apiKeyConfig);
        const params: string[] = [];
        for (const [key, value] of Object.entries(apiKeyParams)) {
          params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
        if (params.length > 0) {
          url += (url.includes('?') ? '&' : '?') + params.join('&');
        }
      }
    }

    return `${this.baseURL}${url}`;
  }

  /**
   * Build full URL (simple version)
   */
  private buildUrl(path: string): string {
    return this.buildUrlWithParams(path);
  }

  /**
   * Extract values from response and store in context
   */
  private extractToContext(
    response: RefinedResponse<ResponseType>,
    extractConfig?: Record<string, string>
  ): void {
    if (!extractConfig) return;

    let body: unknown;
    try {
      body = response.json();
    } catch {
      return;
    }

    for (const [contextKey, path] of Object.entries(extractConfig)) {
      const value = getNestedValue(body, path);
      if (value !== undefined) {
        this.context[contextKey] = value;
        console.log(`[Context] Extracted ${contextKey} = ${JSON.stringify(value)}`);
      }
    }
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
    };
    metricsCollector.record(metric);
  }

  /**
   * GET request
   */
  get(path: string, headers?: Record<string, string>): RefinedResponse<ResponseType> {
    const startTime = Date.now();
    const response = http.get(this.buildUrl(path), {
      headers: this.getHeaders(headers),
    });
    this.recordMetric(path, 'GET', response, startTime);
    return response;
  }

  /**
   * POST request
   */
  post(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): RefinedResponse<ResponseType> {
    const startTime = Date.now();
    const response = http.post(
      this.buildUrl(path),
      body ? JSON.stringify(body) : null,
      { headers: this.getHeaders(headers) }
    );
    this.recordMetric(path, 'POST', response, startTime);
    return response;
  }

  /**
   * PUT request
   */
  put(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): RefinedResponse<ResponseType> {
    const startTime = Date.now();
    const response = http.put(
      this.buildUrl(path),
      body ? JSON.stringify(body) : null,
      { headers: this.getHeaders(headers) }
    );
    this.recordMetric(path, 'PUT', response, startTime);
    return response;
  }

  /**
   * PATCH request
   */
  patch(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): RefinedResponse<ResponseType> {
    const startTime = Date.now();
    const response = http.patch(
      this.buildUrl(path),
      body ? JSON.stringify(body) : null,
      { headers: this.getHeaders(headers) }
    );
    this.recordMetric(path, 'PATCH', response, startTime);
    return response;
  }

  /**
   * DELETE request
   */
  delete(path: string, headers?: Record<string, string>): RefinedResponse<ResponseType> {
    const startTime = Date.now();
    const response = http.del(this.buildUrl(path), null, {
      headers: this.getHeaders(headers),
    });
    this.recordMetric(path, 'DELETE', response, startTime);
    return response;
  }

  /**
   * Execute endpoint config with full context support
   */
  execute(endpoint: EndpointConfig): RefinedResponse<ResponseType> {
    // Resolve dynamic URL
    const urlPath = resolveDynamicValue(endpoint.url, this.context);

    // Build full URL with path and query params
    const fullUrl = this.buildUrlWithParams(
      urlPath,
      endpoint.pathParams,
      endpoint.queryParams
    );

    // Resolve dynamic body
    const body = endpoint.body ? resolveDynamicValue(endpoint.body, this.context) : undefined;

    const startTime = Date.now();
    let response: RefinedResponse<ResponseType>;

    const headers = this.getHeaders(endpoint.headers);

    switch (endpoint.method) {
      case 'GET':
        response = http.get(fullUrl, { headers });
        break;
      case 'POST':
        response = http.post(fullUrl, body ? JSON.stringify(body) : null, { headers });
        break;
      case 'PUT':
        response = http.put(fullUrl, body ? JSON.stringify(body) : null, { headers });
        break;
      case 'PATCH':
        response = http.patch(fullUrl, body ? JSON.stringify(body) : null, { headers });
        break;
      case 'DELETE':
        response = http.del(fullUrl, null, { headers });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${endpoint.method}`);
    }

    this.recordMetric(urlPath, endpoint.method, response, startTime);

    // Extract values to context for next requests
    this.extractToContext(response, endpoint.extract);

    return response;
  }
}

/**
 * Create HTTP client instance
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
