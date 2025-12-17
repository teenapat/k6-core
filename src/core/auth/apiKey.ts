import { ApiKeyAuthConfig, AuthResult } from './auth.types';

/**
 * API Key authentication
 * Returns the key info for injection into requests
 */
export function authenticate(config: ApiKeyAuthConfig): AuthResult {
  console.log(`[Auth] API Key authentication: ${config.key} in ${config.in}`);

  return {
    success: true,
    // Store key info in token field for later use
    // Format: "apiKey:{in}:{key}:{value}"
    token: `apiKey:${config.in}:${config.key}:${config.value}`,
  };
}

/**
 * Get auth header for API Key (when in: 'header')
 */
export function getAuthHeader(config: ApiKeyAuthConfig): Record<string, string> {
  if (config.in === 'header') {
    return {
      [config.key]: config.value,
    };
  }
  return {};
}

/**
 * Get auth query params for API Key (when in: 'query')
 */
export function getAuthQueryParams(config: ApiKeyAuthConfig): Record<string, string> {
  if (config.in === 'query') {
    return {
      [config.key]: config.value,
    };
  }
  return {};
}

/**
 * Parse API Key token string back to config
 * Token format: "apiKey:{in}:{key}:{value}"
 */
export function parseApiKeyToken(token: string): ApiKeyAuthConfig | null {
  if (!token.startsWith('apiKey:')) {
    return null;
  }

  const parts = token.split(':');
  if (parts.length < 4) {
    return null;
  }

  const [, location, key, ...valueParts] = parts;
  const value = valueParts.join(':'); // Handle values that contain ':'

  return {
    type: 'apiKey',
    in: location as 'header' | 'query',
    key,
    value,
  };
}

