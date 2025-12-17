/**
 * Example: Endpoints for OTP API
 * 
 * หลังจาก login สำเร็จ (ได้ token แล้ว)
 * Framework จะเรียก endpoints เหล่านี้เพื่อทำ load test
 */

import { EndpointConfig } from '../../core/types'

export const endpoints: EndpointConfig[] = [
  // ========== User Profile ==========
  {
    name: 'Get Profile',
    method: 'GET',
    url: '/api/users/me',
  },

  // ========== Protected Resources ==========
  {
    name: 'Get Dashboard',
    method: 'GET',
    url: '/api/dashboard',
  },

  {
    name: 'List Transactions',
    method: 'GET',
    url: '/api/transactions?page=1&limit=10',
  },

  {
    name: 'Get Account Balance',
    method: 'GET',
    url: '/api/accounts/balance',
  },

  // ========== Example POST with Body ==========
  {
    name: 'Update Settings',
    method: 'POST',
    url: '/api/users/settings',
    body: () => ({
      notifications: true,
      language: 'th',
    }),
  },
]

