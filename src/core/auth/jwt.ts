import http from 'k6/http';
import {
  AuthContext,
  AuthResult,
  AuthStep,
  isMultiStepConfig,
  JwtAuthConfig,
  JwtMultiStepConfig,
  JwtSingleStepConfig,
} from './auth.types';

/**
 * Get nested value from object using dot notation path
 * Supports array index notation: "data.contacts[0].value"
 *
 * @example
 * getNestedValue({ data: { token: "xyz" } }, "data.token") // "xyz"
 * getNestedValue({ data: { items: ["a", "b"] } }, "data.items[1]") // "b"
 */
function getNestedValue(obj: unknown, path: string): unknown {
  // Handle array index notation: convert "items[0]" to "items.0"
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const keys = normalizedPath.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === 'object') {
      // Handle array index
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

/**
 * Extract string value from nested path
 */
function extractString(obj: unknown, path: string): string | undefined {
  const value = getNestedValue(obj, path);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Execute a single authentication step
 */
function executeStep(
  baseURL: string,
  step: AuthStep,
  context: AuthContext,
): { success: boolean; body: unknown; error?: string } {
  const url = `${baseURL}${step.endpoint}`;

  // Build payload - support both static and dynamic (function) payload
  const payload = typeof step.payload === 'function' ? step.payload(context) : step.payload;

  console.log(`[Auth] Executing step: ${step.name}`);

  const response = http.post(url, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status < 200 || response.status >= 300) {
    return {
      success: false,
      body: null,
      error: `Step "${step.name}" failed with status ${response.status}: ${response.body}`,
    };
  }

  let body: unknown;
  try {
    body = response.json();
  } catch {
    return {
      success: false,
      body: null,
      error: `Step "${step.name}" failed to parse response as JSON`,
    };
  }

  return { success: true, body };
}

/**
 * Extract values from response body and merge into context
 */
function extractToContext(
  body: unknown,
  extractConfig: Record<string, string> | undefined,
  context: AuthContext,
): AuthContext {
  if (!extractConfig) {
    return context;
  }

  const newContext = { ...context };

  for (const [contextKey, path] of Object.entries(extractConfig)) {
    const value = getNestedValue(body, path);
    if (value !== undefined) {
      newContext[contextKey] = value;
      console.log(`[Auth] Extracted ${contextKey} from ${path}`);
    } else {
      console.log(`[Auth] Warning: Could not extract ${contextKey} from ${path}`);
    }
  }

  return newContext;
}

/**
 * Authenticate using single-step JWT (original flow)
 * Calls login endpoint and extracts token from response
 */
function authenticateSingleStep(baseURL: string, config: JwtSingleStepConfig): AuthResult {
  const loginUrl = `${baseURL}${config.loginEndpoint}`;

  console.log(`[Auth] Single-step authentication: ${config.loginEndpoint}`);

  const response = http.post(loginUrl, JSON.stringify(config.payload), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    return {
      success: false,
      error: `Login failed with status ${response.status}: ${response.body}`,
    };
  }

  let body: unknown;
  try {
    body = response.json();
  } catch {
    return {
      success: false,
      error: 'Failed to parse login response as JSON',
    };
  }

  const token = extractString(body, config.tokenPath);

  if (!token) {
    return {
      success: false,
      error: `Token not found at path: ${config.tokenPath}`,
    };
  }

  console.log('[Auth] Single-step authentication successful');

  return {
    success: true,
    token,
  };
}

/**
 * Authenticate using multi-step JWT (2FA/OTP flow)
 * Executes each step in order, passing context between steps
 */
function authenticateMultiStep(baseURL: string, config: JwtMultiStepConfig): AuthResult {
  let context: AuthContext = {};
  let lastBody: unknown = null;

  console.log(`[Auth] Multi-step authentication: ${config.steps.length} steps`);

  for (let i = 0; i < config.steps.length; i++) {
    const step = config.steps[i];
    console.log(`[Auth] Step ${i + 1}/${config.steps.length}: ${step.name}`);

    const result = executeStep(baseURL, step, context);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        context,
      };
    }

    // Extract values to context for next step
    context = extractToContext(result.body, step.extract, context);
    lastBody = result.body;
  }

  // Extract token from final step response
  const token = extractString(lastBody, config.tokenPath);

  if (!token) {
    return {
      success: false,
      error: `Token not found at path: ${config.tokenPath} in final step response`,
      context,
    };
  }

  console.log('[Auth] Multi-step authentication successful');

  return {
    success: true,
    token,
    context,
  };
}

/**
 * Main authentication function
 * Automatically detects single-step vs multi-step config
 */
export function authenticate(baseURL: string, config: JwtAuthConfig): AuthResult {
  if (isMultiStepConfig(config)) {
    return authenticateMultiStep(baseURL, config);
  } else {
    return authenticateSingleStep(baseURL, config);
  }
}

/**
 * Get authorization header for authenticated requests
 */
export function getAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}
