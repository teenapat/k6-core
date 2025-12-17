import { AuthConfig } from './auth/auth.types'
import { ReportConfig } from './reporter/reporter.types'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// ========== Request Context ==========
/**
 * Context for sharing data between endpoint calls
 * Enables chaining requests (e.g., Create → Get → Update → Delete)
 */
export interface RequestContext {
  [key: string]: unknown;
}

// ========== Dynamic Value Types ==========
/**
 * Value can be static or dynamic (function)
 */
export type DynamicValue<T> = T | ((ctx: RequestContext) => T);

// ========== Endpoint Configuration ==========
export interface EndpointConfig {
  /** Endpoint name for logging/reporting */
  name: string;
  /** HTTP method */
  method: HttpMethod;
  /**
   * URL path - supports:
   * - Static: '/api/users'
   * - With path params: '/api/users/{userId}'
   * - Dynamic function: (ctx) => `/api/users/${ctx.userId}`
   */
  url: DynamicValue<string>;
  /**
   * Path parameters to replace in URL
   * e.g., { userId: '123' } replaces {userId} in URL
   * Supports dynamic values: { userId: (ctx) => ctx.createdId }
   */
  pathParams?: Record<string, DynamicValue<string | number>>;
  /**
   * Query parameters to append to URL
   * e.g., { page: '1', limit: '10' } → ?page=1&limit=10
   * Supports dynamic values: { id: (ctx) => ctx.lastId }
   */
  queryParams?: Record<string, DynamicValue<string | number | boolean>>;
  /**
   * Request body - static object or function receiving context
   */
  body?: DynamicValue<unknown>;
  /**
   * Custom headers for this endpoint
   */
  headers?: Record<string, string>;
  /**
   * Extract values from response to store in context
   * Key = context variable name, Value = dot notation path in response
   * e.g., { 'createdId': 'data.id', 'userName': 'data.user.name' }
   */
  extract?: Record<string, string>;
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
  /** Shared context for request chaining */
  requestContext?: RequestContext
}

// ========== Helper Functions ==========
/**
 * Resolve dynamic value to actual value
 */
export function resolveDynamicValue<T>(
  value: DynamicValue<T>,
  ctx: RequestContext
): T {
  if (typeof value === 'function') {
    return (value as (ctx: RequestContext) => T)(ctx);
  }
  return value;
}

/**
 * Get nested value from object using dot notation
 * Supports array index: "data.items[0].name"
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const keys = normalizedPath.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object') {
      if (Array.isArray(current) && /^\d+$/.test(key)) {
        current = current[parseInt(key, 10)];
      } else if (key in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }
  return current;
}

