# K6 Central Load Testing Framework

> **TypeScript Edition** — Type-safe, Reusable, Production Ready

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build and run load test
npm run test:sample

# 3. Or run with custom VUs
npm run test:sample:vus
```

---

## Core Idea

Build a **centralized K6 Core Framework** that can load test any API  
without having to write K6 scripts from scratch every time.

The main concept is to clearly separate into 2 parts:

- **Core Engine**  
  Reusable central logic (auth, scenario, metrics, http wrapper, report)

- **Project Configuration**  
  Things that change for each API (endpoint, payload, load profile)

> Goal:  
> clone → config → run → get report

---

## 📂 Project Structure

```
k6-core/
├── src/
│   ├── core/                       # Core Engine (reusable)
│   │   ├── http/
│   │   │   └── httpClient.ts       # HTTP wrapper + auth injection
│   │   ├── auth/
│   │   │   ├── auth.types.ts       # Auth type definitions
│   │   │   ├── jwt.ts              # JWT authentication
│   │   │   └── none.ts             # No auth handler
│   │   ├── scenarios/
│   │   │   ├── simple.ts           # Simple sequential scenario
│   │   │   └── flow.ts             # Flow/journey scenario
│   │   ├── reporter/
│   │   │   ├── reporter.types.ts   # Report type definitions
│   │   │   ├── console.ts          # Console report output
│   │   │   └── json.ts             # JSON report generator
│   │   ├── metrics.ts              # Metrics collector
│   │   └── types.ts                # Core type definitions
│   │
│   ├── projects/                   # Project Configurations
│   │   └── sample-project/
│   │       ├── config.ts           # Project config
│   │       └── endpoints.ts        # API endpoints
│   │
│   └── main.ts                     # Entry point
│
├── dist/                           # Compiled JS (generated)
├── reports/                        # Generated reports
├── package.json
├── tsconfig.json
└── README.md
```

---

## Why This Exists

Problems encountered with traditional K6 usage:

- Duplicate scripts across multiple projects
- No standardized report format
- Teams interpret results differently
- Have to parse output manually every time

This framework is designed to:

- Make load test **output easy to read**
- Use the same report format for all APIs
- Store results for historical comparison

---

## 💎 Why TypeScript?

| Benefit | Description |
|---------|-------------|
| **Auto-complete** | IDE suggests config options automatically |
| **Type Safety** | Catch config errors at compile time |
| **Refactor Friendly** | Change a type and instantly know what needs updating |
| **Team Collaboration** | Easy for teams to use because types document everything |

---

## 📄 Create New Project

### 1. Copy sample project

```bash
cp -r src/projects/sample-project src/projects/my-api
```

### 2. Edit `config.ts`

```typescript
// src/projects/my-api/config.ts
import { ProjectConfig } from '../../core/types'

const config: ProjectConfig = {
  name: 'my-api',
  baseURL: 'https://api.myapp.com',
  load: {
    vus: 100,
    duration: '5m',
  },
  auth: {
    type: 'jwt',
    loginEndpoint: '/auth/login',
    payload: {
      username: 'loadtest',
      password: 'secret',
    },
    tokenPath: 'data.accessToken',
  },
  report: {
    output: [
      { type: 'console' },
      { type: 'json', path: './reports' },
    ],
  },
}

export default config
```

### 3. Define `endpoints.ts`

```typescript
// src/projects/my-api/endpoints.ts
import { EndpointConfig } from '../../core/types'

export const endpoints: EndpointConfig[] = [
  {
    name: 'Get Products',
    method: 'GET',
    url: '/api/products',
  },
  {
    name: 'Create Order',
    method: 'POST',
    url: '/api/orders',
    body: () => ({
      productId: 1,
      quantity: 2,
    }),
  },
]
```

### 4. Update `main.ts` import

```typescript
// src/main.ts
import config from './projects/my-api/config'
import { endpoints } from './projects/my-api/endpoints'
```

### 5. Run test

```bash
npm run test:sample
```

---

## MVP Features

### 1. Project-based Configuration

Configure via config:

- `baseURL` — API base URL
- `load` — VUs and duration
- `auth` — JWT or No Auth
- `endpoints` — API endpoints to test
- `report` — Console / JSON output

### 2. Authentication Support

| Type | Description |
|------|-------------|
| `none` | No authentication required |
| `jwt` | Login once in setup then inject token for every request |

### 3. HTTP Wrapper

- Wrap http methods (GET, POST, PUT, DELETE)
- Auto-inject auth header
- Auto-collect metrics for every request

### 4. Scenario Runner

| Scenario | Use Case |
|----------|----------|
| `simple` | Call endpoints sequentially, repeatedly |
| `flow` | Simulate user journey (login → browse → purchase) |

---

## 📑 Reporting

### Reports answer 3 questions:

1. **Can the system handle the load?** → RPS, Error Rate
2. **Where is it slow?** → Latency (avg, p95, p99)
3. **Are there errors?** → Error Rate %

### Metrics

| Metric | Description |
|--------|-------------|
| Total Requests | Total number of requests |
| RPS | Requests per Second |
| Error Rate | % of failed requests |
| Avg Latency | Average response time |
| P95 Latency | 95th percentile |
| P99 Latency | 99th percentile |

### Report Output

#### 1. Console Summary

```
════════════════════════════════════════════════════════════
  ▸ K6 Load Test Report
════════════════════════════════════════════════════════════

  Project:   sample-project
  Scenario:  simple
  VUs:       50
  Duration:  2m

────────────────────────────────────────────────────────────
  ▸ Summary
────────────────────────────────────────────────────────────
  Total Requests:  12,000
  RPS:             100
  Error Rate:      0.3%

────────────────────────────────────────────────────────────
  ▸ Latency
────────────────────────────────────────────────────────────
  Avg:             180ms
  P95:             420ms
  P99:             900ms

────────────────────────────────────────────────────────────
  Status: ✅ PASSED
════════════════════════════════════════════════════════════
```

#### 2. JSON Report

```json
{
  "project": "sample-project",
  "scenario": "simple",
  "timestamp": "2025-12-16T10:30:00.000Z",
  "load": {
    "vus": 50,
    "duration": "2m"
  },
  "summary": {
    "requests": 12000,
    "rps": 100,
    "errorRate": 0.3
  },
  "latency": {
    "avg": 180,
    "p95": 420,
    "p99": 900
  }
}
```

---

## 📐 How to Read and Measure Load Test Results

### ▶ Sample Report

```json
{
  "project": "tasks-api",
  "scenario": "simple",
  "timestamp": "2025-12-16T15:03:53.490Z",
  "load": {
    "vus": 15,
    "duration": "60s"
  },
  "summary": {
    "requests": 900,
    "rps": 14.97,
    "errorRate": 0
  },
  "latency": {
    "avg": 1,
    "p95": 4,
    "p99": 8
  }
}
```

---

### ◆ Field Definitions

#### Basic Information

| Field | Meaning | Example |
|-------|---------|---------|
| `project` | Project name being tested | `"tasks-api"` |
| `scenario` | Test pattern | `"simple"` = hit all endpoints sequentially |
| `timestamp` | Completion time (UTC) | `"2025-12-16T15:03:53.490Z"` |

#### Load Configuration

| Field | Meaning | Example |
|-------|---------|---------|
| `vus` | **Virtual Users** - Number of simulated users sending requests concurrently | `15` = 15 users hitting simultaneously |
| `duration` | Test duration | `"60s"` = 1 minute |

#### Summary Metrics

| Field | Meaning | Calculation |
|-------|---------|-------------|
| `requests` | Total HTTP requests | Count all requests sent |
| `rps` | **Requests Per Second** | `requests ÷ duration` (e.g., 900 ÷ 60 = 15 rps) |
| `errorRate` | % of failed requests | `(failed ÷ total) × 100` |

#### Latency Metrics (unit: milliseconds)

| Field | Meaning | Explanation |
|-------|---------|-------------|
| `avg` | **Average** - Mean response time | Average of all requests |
| `p95` | **95th Percentile** | 95% of requests respond within this time |
| `p99` | **99th Percentile** | 99% of requests respond within this time |

---

### ◆ What is Percentile?

```
Assume 100 requests sorted by latency:

Request 1-95:    1-4ms   ← P95 = 4ms (95% respond within 4ms)
Request 96-99:   5-10ms  ← P99 = 10ms
Request 100:     50ms    ← outlier (very slow)

► Why look at Percentile?
   - Average includes outliers → may give skewed picture
   - P95/P99 tells you what "most users" experience
```

---

### ● Measurement Criteria

#### Error Rate

| Error Rate | Status | Action |
|------------|--------|--------|
| **0-1%** | ✅ Excellent | Pass! |
| **1-5%** | ⚠️ Warning | Investigate error causes |
| **>5%** | ❌ Problem | Needs immediate fix |

#### Latency (Response Time)

| Latency | Speed | Suitable For |
|---------|-------|--------------|
| **<50ms** | ✅ Very Fast | Internal APIs, Microservices |
| **50-200ms** | ✅ Good | General REST APIs |
| **200-500ms** | ⚠️ Acceptable | APIs with heavy DB queries |
| **>500ms** | ❌ Too Slow | Should optimize |

#### RPS (Throughput)

| Scenario | Expected RPS |
|----------|--------------|
| Standard API | 100-500 rps |
| High-performance API | 1,000+ rps |
| Real-time API | 5,000+ rps |

> **Note:** RPS depends on many factors such as server specs, network, database

---

### ★ Analysis Examples

#### ✅ Good Results

```json
{
  "requests": 900,
  "rps": 14.97,
  "errorRate": 0,
  "latency": { "avg": 1, "p95": 4, "p99": 8 }
}
```

**Analysis:**
- Error = 0% → No errors at all ✅
- Latency avg 1ms, p95 4ms → Very fast ✅
- Can increase VUs to find breaking point

#### ⚠️ Warning Results

```json
{
  "requests": 5000,
  "rps": 83.33,
  "errorRate": 2.5,
  "latency": { "avg": 250, "p95": 800, "p99": 1500 }
}
```

**Analysis:**
- Error 2.5% → Some errors, check logs ⚠️
- P95 = 800ms → Some requests are very slow ⚠️
- Should investigate which endpoint is slow

#### ❌ Failed Results

```json
{
  "requests": 2000,
  "rps": 33.33,
  "errorRate": 15,
  "latency": { "avg": 1200, "p95": 3000, "p99": 5000 }
}
```

**Analysis:**
- Error 15% → Too many errors! ❌
- Latency very high (avg 1.2 seconds) ❌
- **Action needed:** Reduce VUs or optimize API

---

### ▲ Finding the Breaking Point

How to find maximum API capacity:

```
1. Start with low VUs (e.g., 10)
2. Increase VUs by 2x (10 → 20 → 40 → 80)
3. Observe metrics each round
4. Stop when:
   - Error rate > 5%
   - P95 latency > defined SLA
   - RPS doesn't increase despite more VUs (saturated)
```

```
VUs:     10   →   20   →   40   →   80   →  100
RPS:     50       98      180      190      185  ← saturated!
Error:   0%       0%       1%       8%      15%  ← breaking!
P95:    20ms    25ms     80ms    500ms   2000ms ← degraded!
                                   ↑
                          Breaking Point = ~40 VUs
```

---

## ⚙ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build TypeScript → JavaScript |
| `npm run build:watch` | Build in watch mode |
| `npm run test:sample` | Build + Run K6 test |
| `npm run test:sample:vus` | Run with custom VUs |
| `npm run typecheck` | Type check only (no emit) |

---

## ☐ Requirements

- **Node.js** >= 18
- **K6** installed ([Install K6](https://k6.io/docs/get-started/installation/))
- **npm** or **pnpm**

---

## Goals

### Primary Goals

- Use single K6 setup to test multiple API projects
- Change test behavior through config
- Get **clear summary reports**

### Secondary Goals

- Reports readable by both developers and non-devs
- Export to file (JSON / HTML)
- Easy CI/CD integration

### Non-Goals (MVP)

- Real-time dashboard
- Advanced visualization
- Distributed reporting

---

## License

MIT
