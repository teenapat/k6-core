/**
 * Example: API Key Authentication
 *
 * Demonstrates:
 * - API Key in header: X-API-Key: your-api-key
 * - API Key in query: ?api_key=your-api-key
 */

import { ProjectConfig } from '../../core/types';

const config: ProjectConfig = {
  name: 'api-key-example',
  baseURL: 'https://api.example.com',

  load: {
    vus: 10,
    duration: '30s',
  },

  // ========== API Key Authentication (Header) ==========
  auth: {
    type: 'apiKey',
    key: 'X-API-Key',           // Header name
    value: 'sk_live_abc123xyz', // Your API key
    in: 'header',               // Send in header
  },

  // ========== Alternative: API Key in Query String ==========
  // auth: {
  //   type: 'apiKey',
  //   key: 'api_key',            // Query param name
  //   value: 'sk_live_abc123xyz',
  //   in: 'query',               // Append to URL: ?api_key=sk_live_abc123xyz
  // },

  report: {
    output: [
      { type: 'console' },
      { type: 'json', path: './reports' },
    ],
  },
};

export default config;

