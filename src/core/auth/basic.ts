import encoding from 'k6/encoding';
import { AuthResult, BasicAuthConfig } from './auth.types';

/**
 * Basic HTTP authentication
 * Returns base64 encoded credentials
 */
export function authenticate(config: BasicAuthConfig): AuthResult {
  console.log(`[Auth] Basic authentication for user: ${config.username}`);

  // Create base64 encoded credentials
  const credentials = `${config.username}:${config.password}`;
  const encoded = encoding.b64encode(credentials);

  return {
    success: true,
    // Store as "basic:{encoded}" for later parsing
    token: `basic:${encoded}`,
  };
}

/**
 * Get Authorization header for Basic auth
 */
export function getAuthHeader(token: string): Record<string, string> {
  // Token format: "basic:{base64_credentials}"
  if (token.startsWith('basic:')) {
    const encoded = token.substring(6);
    return {
      Authorization: `Basic ${encoded}`,
    };
  }

  // Fallback: assume token is already base64 encoded
  return {
    Authorization: `Basic ${token}`,
  };
}

/**
 * Check if token is Basic auth format
 */
export function isBasicToken(token: string): boolean {
  return token.startsWith('basic:');
}

