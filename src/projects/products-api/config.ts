import { ProjectConfig } from '../../core/types'

/**
 * Products API Configuration
 * 
 * API ที่ต้อง login ก่อนถึงจะเข้าถึง products ได้
 * - POST /auth/login → ได้ JWT token
 * - GET/POST/PUT/DELETE /products → ต้องใช้ token
 */
const config: ProjectConfig = {
  name: 'products-api',
  baseURL: 'http://localhost:3000',
  load: {
    vus: 10,
    duration: '30s',
  },
  auth: {
    type: 'jwt',
    loginEndpoint: '/auth/login',
    payload: {
      username: 'admin',
      password: 'password123',
    },
    tokenPath: 'access_token', 
  },
  report: {
    output: [
      { type: 'console' },
      { type: 'json', path: './reports' },
      { type: 'html', path: './reports' },
    ],
  },
}

export default config

