import http from 'k6/http'
import { JwtAuthConfig, AuthResult } from './auth.types'

/**
 * Get nested value from object using dot notation path
 * e.g. "data.accessToken" from { data: { accessToken: "xyz" } }
 */
function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }
  
  return typeof current === 'string' ? current : undefined
}

/**
 * Authenticate using JWT
 * Calls login endpoint and extracts token from response
 */
export function authenticate(
  baseURL: string, 
  config: JwtAuthConfig
): AuthResult {
  const loginUrl = `${baseURL}${config.loginEndpoint}`
  
  const response = http.post(
    loginUrl,
    JSON.stringify(config.payload),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (response.status !== 200) {
    return {
      success: false,
      error: `Login failed with status ${response.status}: ${response.body}`,
    }
  }

  let body: unknown
  try {
    body = response.json()
  } catch {
    return {
      success: false,
      error: 'Failed to parse login response as JSON',
    }
  }

  const token = getNestedValue(body, config.tokenPath)
  
  if (!token) {
    return {
      success: false,
      error: `Token not found at path: ${config.tokenPath}`,
    }
  }

  return {
    success: true,
    token,
  }
}

/**
 * Get authorization header for authenticated requests
 */
export function getAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  }
}

