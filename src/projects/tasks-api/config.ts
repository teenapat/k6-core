import { ProjectConfig } from '../../core/types'

const config: ProjectConfig = {
  name: 'tasks-api',
  baseURL: 'http://localhost:3000',
  load: {
    vus: 10,          // จำนวน virtual users
    duration: '30s',  // ระยะเวลาทดสอบ
  },
  auth: {
    type: 'none',     // ไม่ต้อง auth
  },
  report: {
    output: [
      { type: 'console' },
      { type: 'json', path: './reports' },
    ],
  },
}

export default config

