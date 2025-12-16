import { AuthResult } from './auth.types'

/**
 * No authentication - returns success with no token
 */
export function authenticate(): AuthResult {
  return {
    success: true,
    token: undefined,
  }
}

/**
 * Get empty auth header (no auth required)
 */
export function getAuthHeader(): Record<string, string> {
  return {}
}

