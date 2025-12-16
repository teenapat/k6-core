# K6 Central Load Testing Framework

> **TypeScript Edition** — Type-safe, Reusable, Production Ready

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build and run load test
npm run test:sample

# 3. หรือรันแบบกำหนด vus เอง
npm run test:sample:vus
```

---

## Core Idea

สร้าง **K6 Core Framework กลาง** ที่สามารถใช้ Load Test กับ API ใดก็ได้  
โดยไม่ต้องเขียน K6 script ใหม่ทุกครั้ง

แนวคิดหลักคือแยกออกเป็น 2 ส่วนชัดเจน:

- **Core Engine**  
  Logic กลางที่ reusable (auth, scenario, metrics, http wrapper, report)

- **Project Configuration**  
  สิ่งที่เปลี่ยนไปตามแต่ละ API (endpoint, payload, load profile)

> เป้าหมายคือ:  
> clone → config → run → get report

---

## 📁 Project Structure

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

ปัญหาที่พบจากการใช้ K6 แบบเดิม:

- Script ซ้ำกันหลายโปรเจ็ค
- ไม่มี report มาตรฐานเดียวกัน
- ทีมอ่านผลลัพธ์ไม่ตรงกัน
- ต้อง parse output เองทุกครั้ง

Framework นี้ถูกออกแบบมาเพื่อ:

- ทำให้ load test มี **output ที่อ่านง่าย**
- ใช้ report format เดียวกันทุก API
- เก็บผลลัพธ์เพื่อเทียบย้อนหลังได้

---

## 💡 Why TypeScript?

| Benefit | Description |
|---------|-------------|
| **Auto-complete** | IDE แนะนำ config options ให้อัตโนมัติ |
| **Type Safety** | กัน config พังตั้งแต่ compile time |
| **Refactor Friendly** | เปลี่ยน type แล้วรู้ทันทีว่าต้องแก้ตรงไหน |
| **Team Collaboration** | ทีมใช้ต่อได้ง่าย เพราะ type บอกทุกอย่าง |

---

## 📝 สร้าง Project ใหม่

### 1. Copy sample project

```bash
cp -r src/projects/sample-project src/projects/my-api
```

### 2. แก้ไข `config.ts`

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

### 3. กำหนด `endpoints.ts`

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

### 4. อัพเดต `main.ts` import

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

กำหนดผ่าน config:

- `baseURL` — API base URL
- `load` — VUs และ duration
- `auth` — JWT หรือ No Auth
- `endpoints` — API endpoints ที่จะทดสอบ
- `report` — Console / JSON output

### 2. Authentication Support

| Type | Description |
|------|-------------|
| `none` | ไม่ต้อง auth |
| `jwt` | Login ครั้งเดียวใน setup แล้ว inject token ทุก request |

### 3. HTTP Wrapper

- Wrap http methods (GET, POST, PUT, DELETE)
- Auto-inject auth header
- Auto-collect metrics ทุก request

### 4. Scenario Runner

| Scenario | Use Case |
|----------|----------|
| `simple` | เรียก endpoints ตามลำดับ ซ้ำๆ |
| `flow` | จำลอง user journey (login → browse → purchase) |

---

## 📊 Reporting

### Report ตอบคำถาม 3 ข้อ:

1. **ระบบรับไหวไหม** → RPS, Error Rate
2. **ช้าตรงไหน** → Latency (avg, p95, p99)
3. **Error เกิดหรือไม่** → Error Rate %

### Metrics

| Metric | Description |
|--------|-------------|
| Total Requests | จำนวน request ทั้งหมด |
| RPS | Requests per Second |
| Error Rate | % ของ request ที่ fail |
| Avg Latency | Response time เฉลี่ย |
| P95 Latency | 95th percentile |
| P99 Latency | 99th percentile |

### Report Output

#### 1. Console Summary

```
════════════════════════════════════════════════════════════
  📊 K6 Load Test Report
════════════════════════════════════════════════════════════

  Project:   sample-project
  Scenario:  simple
  VUs:       50
  Duration:  2m

────────────────────────────────────────────────────────────
  📈 Summary
────────────────────────────────────────────────────────────
  Total Requests:  12,000
  RPS:             100
  Error Rate:      0.3%

────────────────────────────────────────────────────────────
  ⏱️  Latency
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

## 📏 วิธีอ่านและวัดผล Load Test

### 🎯 Report ตัวอย่าง

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

### 📋 ความหมายของแต่ละ Field

#### ข้อมูลพื้นฐาน

| Field | ความหมาย | ตัวอย่าง |
|-------|----------|----------|
| `project` | ชื่อ project ที่ทดสอบ | `"tasks-api"` |
| `scenario` | รูปแบบการทดสอบ | `"simple"` = ยิงทุก endpoint ตามลำดับ |
| `timestamp` | เวลาที่รันเสร็จ (UTC) | `"2025-12-16T15:03:53.490Z"` |

#### Load Configuration

| Field | ความหมาย | ตัวอย่าง |
|-------|----------|----------|
| `vus` | **Virtual Users** - จำนวนผู้ใช้จำลองที่ยิง request พร้อมกัน | `15` = 15 คนยิงพร้อมกัน |
| `duration` | ระยะเวลาทดสอบ | `"60s"` = 1 นาที |

#### Summary Metrics

| Field | ความหมาย | วิธีคิด |
|-------|----------|---------|
| `requests` | จำนวน HTTP requests ทั้งหมด | นับทุก request ที่ส่งออกไป |
| `rps` | **Requests Per Second** | `requests ÷ duration` (เช่น 900 ÷ 60 = 15 rps) |
| `errorRate` | % ของ request ที่ fail | `(failed ÷ total) × 100` |

#### Latency Metrics (หน่วย: milliseconds)

| Field | ความหมาย | อธิบาย |
|-------|----------|--------|
| `avg` | **Average** - เวลาตอบกลับเฉลี่ย | ค่าเฉลี่ยของทุก request |
| `p95` | **95th Percentile** | 95% ของ requests ตอบภายในเวลานี้ |
| `p99` | **99th Percentile** | 99% ของ requests ตอบภายในเวลานี้ |

---

### 📊 Percentile คืออะไร?

```
สมมุติมี 100 requests เรียงตาม latency:

Request 1-95:    1-4ms   ← P95 = 4ms (95% ตอบได้ภายใน 4ms)
Request 96-99:   5-10ms  ← P99 = 10ms
Request 100:     50ms    ← outlier (ช้ามาก)

🔑 ทำไมต้องดู Percentile?
   - Average รวม outlier → อาจเห็นภาพเบี้ยว
   - P95/P99 บอกว่า "คนส่วนใหญ่" ได้ประสบการณ์ยังไง
```

---

### ✅ เกณฑ์การวัดผล

#### Error Rate

| Error Rate | สถานะ | Action |
|------------|--------|--------|
| **0-1%** | ✅ ดีมาก | ผ่าน! |
| **1-5%** | ⚠️ ควรตรวจสอบ | หาสาเหตุ error |
| **>5%** | ❌ มีปัญหา | ต้องแก้ไขด่วน |

#### Latency (Response Time)

| Latency | ความเร็ว | เหมาะกับ |
|---------|----------|----------|
| **<50ms** | 🚀 เร็วมาก | Internal APIs, Microservices |
| **50-200ms** | ✅ ดี | REST APIs ทั่วไป |
| **200-500ms** | ⚠️ พอใช้ได้ | APIs ที่ต้อง query DB หนัก |
| **>500ms** | ❌ ช้าเกินไป | ควร optimize |

#### RPS (Throughput)

| สถานการณ์ | คาดหวัง RPS |
|-----------|-------------|
| API ธรรมดา | 100-500 rps |
| High-performance API | 1,000+ rps |
| Real-time API | 5,000+ rps |

> 💡 **หมายเหตุ:** RPS ขึ้นอยู่กับหลายปัจจัย เช่น server specs, network, database

---

### 🏆 ตัวอย่างการวิเคราะห์

#### ✅ ผลดี

```json
{
  "requests": 900,
  "rps": 14.97,
  "errorRate": 0,
  "latency": { "avg": 1, "p95": 4, "p99": 8 }
}
```

**วิเคราะห์:**
- ❌ Error = 0% → ไม่มี error เลย ✅
- ⚡ Latency avg 1ms, p95 4ms → เร็วมาก ✅
- 📈 สามารถเพิ่ม VUs ได้อีกเพื่อหา breaking point

#### ⚠️ ผลต้องระวัง

```json
{
  "requests": 5000,
  "rps": 83.33,
  "errorRate": 2.5,
  "latency": { "avg": 250, "p95": 800, "p99": 1500 }
}
```

**วิเคราะห์:**
- ⚠️ Error 2.5% → มี error บางส่วน ตรวจสอบ log
- ⚠️ P95 = 800ms → บาง request ช้ามาก
- 🔍 ควรดู endpoint ไหนที่ช้า

#### ❌ ผลไม่ผ่าน

```json
{
  "requests": 2000,
  "rps": 33.33,
  "errorRate": 15,
  "latency": { "avg": 1200, "p95": 3000, "p99": 5000 }
}
```

**วิเคราะห์:**
- ❌ Error 15% → มี error เยอะมาก!
- ❌ Latency สูงมาก (avg 1.2 วินาที)
- 🚨 **ต้องแก้ไข:** ลด VUs หรือ optimize API

---

### 📈 การหา Breaking Point

วิธีหา capacity สูงสุดของ API:

```
1. เริ่มจาก VUs น้อยๆ (เช่น 10)
2. เพิ่ม VUs ทีละ 2x (10 → 20 → 40 → 80)
3. สังเกต metrics ทุกรอบ
4. หยุดเมื่อ:
   - Error rate > 5%
   - P95 latency > SLA ที่กำหนด
   - RPS ไม่เพิ่มขึ้นแม้เพิ่ม VUs (saturated)
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

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build TypeScript → JavaScript |
| `npm run build:watch` | Build แบบ watch mode |
| `npm run test:sample` | Build + Run K6 test |
| `npm run test:sample:vus` | Run with custom VUs |
| `npm run typecheck` | Type check only (no emit) |

---

## 📌 Requirements

- **Node.js** >= 18
- **K6** installed ([Install K6](https://k6.io/docs/get-started/installation/))
- **npm** or **pnpm**

---

## Goals

### Primary Goals

- ใช้ K6 ชุดเดียว ทดสอบ API ได้หลายโปรเจ็ค
- เปลี่ยนพฤติกรรมการทดสอบผ่าน config
- ได้ **report ที่สรุปผลชัดเจน**

### Secondary Goals

- Report อ่านได้ทั้ง developer และ non-dev
- Export เป็น file (JSON / HTML)
- ต่อ CI/CD ได้ง่าย

### Non-Goals (MVP)

- Real-time dashboard
- Visualization ขั้นสูง
- Distributed reporting

---

## License

MIT
