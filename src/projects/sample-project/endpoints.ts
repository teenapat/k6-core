import { EndpointConfig } from '../../core/types'

/**
 * Sample Project Endpoints
 * 
 * Define all endpoints to test here.
 * Each endpoint has:
 * - name: Identifier for metrics
 * - method: HTTP method
 * - url: Path (will be appended to baseURL)
 * - body: Optional function returning request body
 * - headers: Optional custom headers
 */

export const endpoints: EndpointConfig[] = [
  {
    name: 'Get Users',
    method: 'GET',
    url: '/api/users',
  },
  {
    name: 'Get User By ID',
    method: 'GET',
    url: '/api/users/1',
  },
  {
    name: 'Create User',
    method: 'POST',
    url: '/api/users',
    body: () => ({
      name: `User ${Date.now()}`,
      email: `user${Date.now()}@test.com`,
    }),
  },
  {
    name: 'Update User',
    method: 'PUT',
    url: '/api/users/1',
    body: () => ({
      name: `Updated User ${Date.now()}`,
    }),
  },
  {
    name: 'Delete User',
    method: 'DELETE',
    url: '/api/users/1',
  },
]

/**
 * Endpoints for simple scenario (read-only)
 */
export const readOnlyEndpoints: EndpointConfig[] = [
  endpoints[0], // Get Users
  endpoints[1], // Get User By ID
]

/**
 * Endpoints for CRUD flow scenario
 */
export const crudEndpoints = {
  create: endpoints[2],
  read: endpoints[1],
  update: endpoints[3],
  delete: endpoints[4],
}

