import { sleep } from 'k6'
import { HttpClient } from '../http/httpClient'
import { EndpointConfig } from '../types'

export interface SimpleScenarioConfig {
  endpoints: EndpointConfig[]
  thinkTime?: number // seconds between requests
}

/**
 * Simple Scenario
 * - Executes each endpoint sequentially
 * - Good for basic API testing
 * - Each VU runs through all endpoints in order
 */
export function runSimpleScenario(
  client: HttpClient,
  config: SimpleScenarioConfig
): void {
  const { endpoints, thinkTime = 1 } = config

  for (const endpoint of endpoints) {
    client.execute(endpoint)
    
    if (thinkTime > 0) {
      sleep(thinkTime)
    }
  }
}

/**
 * Run a single endpoint repeatedly
 */
export function runSingleEndpoint(
  client: HttpClient,
  endpoint: EndpointConfig,
  thinkTime: number = 1
): void {
  client.execute(endpoint)
  
  if (thinkTime > 0) {
    sleep(thinkTime)
  }
}

