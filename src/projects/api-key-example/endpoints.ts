/**
 * Example: Endpoints with Dynamic URL Parameters
 *
 * Demonstrates:
 * - Path parameters: /users/{userId}
 * - Query parameters: ?page=1&limit=10
 * - Dynamic values from context
 */

import { EndpointConfig } from '../../core/types';

// Helper: Generate random ID
function randomId(): string {
  return String(Math.floor(Math.random() * 1000) + 1);
}

// Helper: Random category
function randomCategory(): string {
  const categories = ['electronics', 'clothing', 'food', 'books'];
  return categories[Math.floor(Math.random() * categories.length)];
}

export const endpoints: EndpointConfig[] = [
  // ========== Static URL ==========
  {
    name: 'List Products',
    method: 'GET',
    url: '/api/products',
  },

  // ========== Path Parameters ==========
  // URL: /api/products/{productId} → /api/products/123
  {
    name: 'Get Product by ID',
    method: 'GET',
    url: '/api/products/{productId}',
    pathParams: {
      productId: () => randomId(), // Dynamic: random ID each time
    },
  },

  // ========== Query Parameters ==========
  // URL: /api/products?page=1&limit=10&category=electronics
  {
    name: 'Search Products',
    method: 'GET',
    url: '/api/products',
    queryParams: {
      page: '1',
      limit: '10',
      category: () => randomCategory(), // Dynamic category
    },
  },

  // ========== Both Path and Query Params ==========
  // URL: /api/users/{userId}/orders?status=pending&limit=5
  {
    name: 'Get User Orders',
    method: 'GET',
    url: '/api/users/{userId}/orders',
    pathParams: {
      userId: '123', // Static user ID
    },
    queryParams: {
      status: 'pending',
      limit: '5',
    },
  },

  // ========== Dynamic URL Function ==========
  // For complex URL building logic
  {
    name: 'Get Product Reviews',
    method: 'GET',
    url: (ctx) => {
      // Can use context values if available
      const productId = ctx.lastProductId || randomId();
      return `/api/products/${productId}/reviews`;
    },
    queryParams: {
      sort: 'newest',
      limit: '10',
    },
  },
];

