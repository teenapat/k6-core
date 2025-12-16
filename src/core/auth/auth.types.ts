export type AuthType = 'none' | 'jwt'

export interface JwtAuthConfig {
  type: 'jwt'
  loginEndpoint: string
  payload: Record<string, unknown>
  tokenPath: string // e.g. "data.accessToken"
}

export interface NoneAuthConfig {
  type: 'none'
}

export type AuthConfig = JwtAuthConfig | NoneAuthConfig

export interface AuthResult {
  success: boolean
  token?: string
  error?: string
}

