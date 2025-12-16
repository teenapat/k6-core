import { sleep } from 'k6'
import { HttpClient } from '../http/httpClient'
import { EndpointConfig } from '../types'

export interface FlowStep {
  endpoint: EndpointConfig
  thinkTime?: number
  condition?: (response: unknown) => boolean
}

export interface FlowScenarioConfig {
  steps: FlowStep[]
  defaultThinkTime?: number
}

/**
 * Flow Scenario
 * - Executes a sequence of steps (user journey)
 * - Each step can have its own think time
 * - Steps can have conditions for continuation
 * - Simulates real user behavior
 */
export function runFlowScenario(
  client: HttpClient,
  config: FlowScenarioConfig
): void {
  const { steps, defaultThinkTime = 1 } = config

  for (const step of steps) {
    const response = client.execute(step.endpoint)

    // Check condition if provided
    if (step.condition) {
      let responseBody: unknown
      try {
        responseBody = response.json()
      } catch {
        responseBody = response.body
      }

      if (!step.condition(responseBody)) {
        // Condition failed, stop flow
        console.log(`Flow stopped: condition failed at ${step.endpoint.name}`)
        break
      }
    }

    // Apply think time
    const thinkTime = step.thinkTime ?? defaultThinkTime
    if (thinkTime > 0) {
      sleep(thinkTime)
    }
  }
}

/**
 * Create a login flow
 * Common pattern: login -> access resource
 */
export function createLoginFlow(
  loginEndpoint: EndpointConfig,
  protectedEndpoints: EndpointConfig[],
  tokenExtractor: (response: unknown) => string | undefined
): FlowScenarioConfig {
  return {
    steps: [
      {
        endpoint: loginEndpoint,
        thinkTime: 0.5,
        condition: (response) => {
          const token = tokenExtractor(response)
          return token !== undefined
        },
      },
      ...protectedEndpoints.map(endpoint => ({
        endpoint,
        thinkTime: 1,
      })),
    ],
    defaultThinkTime: 1,
  }
}

/**
 * Create a CRUD flow
 * Common pattern: Create -> Read -> Update -> Delete
 */
export function createCrudFlow(
  createEndpoint: EndpointConfig,
  readEndpoint: EndpointConfig,
  updateEndpoint: EndpointConfig,
  deleteEndpoint: EndpointConfig
): FlowScenarioConfig {
  return {
    steps: [
      { endpoint: createEndpoint, thinkTime: 0.5 },
      { endpoint: readEndpoint, thinkTime: 0.5 },
      { endpoint: updateEndpoint, thinkTime: 0.5 },
      { endpoint: deleteEndpoint, thinkTime: 0.5 },
    ],
    defaultThinkTime: 0.5,
  }
}

