/**
 * Example: CRUD Flow with Request Context
 *
 * Flow: Create Task → Get Task → Update Task → Delete Task
 *
 * Key Features:
 * - `extract`: Pull values from response into context
 * - `body: (ctx) => {...}`: Use context in request body
 * - `url: (ctx) => ...`: Use context in URL
 * - `pathParams`: Use context in path parameters
 */

import { EndpointConfig, RequestContext } from '../../core/types';

export const endpoints: EndpointConfig[] = [
  // ========== Step 1: Create Task ==========
  // Creates a new task and extracts the ID for later use
  {
    name: 'Create Task',
    method: 'POST',
    url: '/api/tasks',
    body: () => ({
      title: `Load Test Task ${Date.now()}`,
      description: 'Created by K6 load test',
      priority: 'high',
      status: 'pending',
    }),
    // Extract values from response to context
    extract: {
      taskId: 'data.id',           // ctx.taskId = response.data.id
      taskTitle: 'data.title',     // ctx.taskTitle = response.data.title
      createdAt: 'data.createdAt', // ctx.createdAt = response.data.createdAt
    },
  },

  // ========== Step 2: Get Created Task ==========
  // Uses extracted taskId to fetch the task we just created
  {
    name: 'Get Task',
    method: 'GET',
    url: '/api/tasks/{taskId}',
    pathParams: {
      taskId: (ctx: RequestContext) => String(ctx.taskId), // Use extracted taskId
    },
  },

  // ========== Step 3: Update Task ==========
  // Uses context for both URL and body
  {
    name: 'Update Task',
    method: 'PUT',
    url: (ctx: RequestContext) => `/api/tasks/${ctx.taskId}`, // Dynamic URL using context
    body: (ctx: RequestContext) => ({
      title: ctx.taskTitle,           // Keep original title
      description: 'Updated by K6',
      priority: 'medium',
      status: 'in_progress',
    }),
    // Extract updated data
    extract: {
      updatedAt: 'data.updatedAt',
    },
  },

  // ========== Step 4: Add Comment to Task ==========
  // Demonstrates nested resource using context
  {
    name: 'Add Comment',
    method: 'POST',
    url: '/api/tasks/{taskId}/comments',
    pathParams: {
      taskId: (ctx: RequestContext) => String(ctx.taskId),
    },
    body: (ctx: RequestContext) => ({
      text: `Task ${ctx.taskId} updated at ${ctx.updatedAt}`,
      author: 'Load Test Bot',
    }),
    extract: {
      commentId: 'data.id',
    },
  },

  // ========== Step 5: Delete Task ==========
  // Clean up - delete the task we created
  {
    name: 'Delete Task',
    method: 'DELETE',
    url: '/api/tasks/{taskId}',
    pathParams: {
      taskId: (ctx: RequestContext) => String(ctx.taskId),
    },
  },
];

// ========== Alternative: Simpler example without extract ==========
export const simpleEndpoints: EndpointConfig[] = [
  {
    name: 'List Tasks',
    method: 'GET',
    url: '/api/tasks',
    queryParams: {
      page: '1',
      limit: '10',
      status: 'pending',
    },
  },
  {
    name: 'Get Task Stats',
    method: 'GET',
    url: '/api/tasks/stats',
  },
];

