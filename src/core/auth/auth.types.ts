export type AuthType = 'none' | 'jwt';

// ========== Auth Context ==========
/**
 * Context for passing data between authentication steps
 * Used in multi-step authentication flows (e.g., 2FA, OTP)
 */
export interface AuthContext {
  [key: string]: unknown;
}

// ========== Auth Step (for Multi-Step) ==========
/**
 * Configuration for a single authentication step
 * Each step can extract data from response to pass to next step
 */
export interface AuthStep {
  /** Step name for logging/debugging */
  name: string;
  /** API endpoint path */
  endpoint: string;
  /**
   * Request payload - can be static object or function that receives context
   * Function form allows using data from previous steps
   */
  payload: Record<string, unknown> | ((context: AuthContext) => Record<string, unknown>);
  /**
   * Extract values from response to store in context
   * Key = context variable name, Value = dot notation path in response
   * e.g., { "sessionId": "data.sessionId", "contact": "data.contacts[0].value" }
   */
  extract?: Record<string, string>;
}

// ========== JWT Single Step (Original) ==========
/**
 * Single-step JWT authentication config
 * For APIs that return token immediately after login
 */
export interface JwtSingleStepConfig {
  type: 'jwt';
  /** Login endpoint path */
  loginEndpoint: string;
  /** Login request payload */
  payload: Record<string, unknown>;
  /** Path to extract token from response (dot notation) */
  tokenPath: string;
}

// ========== JWT Multi-Step (New for 2FA/OTP) ==========
/**
 * Multi-step JWT authentication config
 * For APIs that require multiple steps (e.g., 2FA, OTP verification)
 *
 * @example
 * // OTP Flow: sign-in → send-otp → confirm-otp → token
 * {
 *   type: 'jwt',
 *   steps: [
 *     {
 *       name: 'Sign In',
 *       endpoint: '/auth/sign-in',
 *       payload: { username: 'test', password: 'secret' },
 *       extract: { 'sessionId': 'data.sessionId', 'contact': 'data.contacts[0].phone' }
 *     },
 *     {
 *       name: 'Send OTP',
 *       endpoint: '/auth/send-otp',
 *       payload: (ctx) => ({ sessionId: ctx.sessionId, contact: ctx.contact }),
 *       extract: { 'refCode': 'data.refCode' }
 *     },
 *     {
 *       name: 'Confirm OTP',
 *       endpoint: '/auth/confirm-otp',
 *       payload: (ctx) => ({ sessionId: ctx.sessionId, refCode: ctx.refCode, otp: '123456' })
 *     }
 *   ],
 *   tokenPath: 'data.accessToken'
 * }
 */
export interface JwtMultiStepConfig {
  type: 'jwt';
  /** Array of authentication steps to execute in order */
  steps: AuthStep[];
  /** Path to extract token from final step response (dot notation) */
  tokenPath: string;
}

// ========== Union Types ==========
/**
 * Helper to check if config is multi-step
 */
export function isMultiStepConfig(config: JwtAuthConfig): config is JwtMultiStepConfig {
  return 'steps' in config && Array.isArray(config.steps);
}

/**
 * JWT authentication config - supports both single-step and multi-step
 */
export type JwtAuthConfig = JwtSingleStepConfig | JwtMultiStepConfig;

export interface NoneAuthConfig {
  type: 'none';
}

export type AuthConfig = JwtAuthConfig | NoneAuthConfig;

// ========== Auth Result ==========
export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
  /** Final context after all steps (useful for debugging) */
  context?: AuthContext;
}
