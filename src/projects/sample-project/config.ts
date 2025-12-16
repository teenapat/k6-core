import { ProjectConfig } from '../../core/types'

/**
 * Sample Project Configuration
 * 
 * Copy this template and modify for your project:
 * 1. Change baseURL to your API
 * 2. Adjust load profile (vus, duration)
 * 3. Configure authentication
 * 4. Set report options
 */
const config: ProjectConfig = {
  name: 'sample-project',
  baseURL: 'https://api.sample.com',
  load: {
    vus: 50,
    duration: '2m',
  },
  auth: {
    type: 'jwt',
    loginEndpoint: '/auth/login',
    payload: {
      username: 'test',
      password: 'test',
    },
    tokenPath: 'data.accessToken',
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

