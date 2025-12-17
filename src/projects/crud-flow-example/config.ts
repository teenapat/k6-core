/**
 * Example: CRUD Flow with Request Context Chaining
 *
 * Demonstrates:
 * - Extract values from response
 * - Use extracted values in next requests
 * - Complete Create → Read → Update → Delete flow
 */

import { ProjectConfig } from '../../core/types';

const config: ProjectConfig = {
  name: 'crud-flow-example',
  baseURL: 'https://api.example.com',

  load: {
    vus: 5,
    duration: '30s',
  },

  // Basic Auth example
  auth: {
    type: 'basic',
    username: 'loadtest',
    password: 'secret123',
  },

  report: {
    output: [
      { type: 'console' },
      { type: 'json', path: './reports' },
    ],
  },
};

export default config;

