import { EndpointConfig } from '../../core/types'

/**
 * Tasks API Endpoints
 */
export const endpoints: EndpointConfig[] = [
  {
    name: 'Get All Tasks',
    method: 'GET',
    url: '/tasks',
  },
  {
    name: 'Get Task By ID',
    method: 'GET',
    url: '/tasks/1',
  },
  {
    name: 'Create Task',
    method: 'POST',
    url: '/tasks',
    body: () => ({
      title: `Task ${Date.now()}`,
      completed: false,
    }),
  },
  {
    name: 'Update Task',
    method: 'PUT',
    url: '/tasks/1',
    body: () => ({
      title: `Updated Task ${Date.now()}`,
      completed: true,
    }),
  },
  {
    name: 'Delete Task',
    method: 'DELETE',
    url: '/tasks/1',
  },
]

/**
 * Read-only endpoints (safe for high load)
 */
export const readOnlyEndpoints: EndpointConfig[] = [
  endpoints[0], // Get All Tasks
  endpoints[1], // Get Task By ID
]

