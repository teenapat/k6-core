/**
 * Example: OTP/2FA Authentication Flow
 *
 * Flow: sign-in → send-otp → confirm-otp → get token
 *
 * สำหรับ load test ควรใช้ test account ที่ backend return fixed OTP (เช่น "123456")
 */

import { ProjectConfig } from '../../core/types';

const config: ProjectConfig = {
  name: 'otp-api-example',
  baseURL: 'https://api.example.com',

  load: {
    vus: 10,
    duration: '30s',
  },

  // ========== Multi-Step JWT Authentication (2FA/OTP) ==========
  auth: {
    type: 'jwt',
    steps: [
      // Step 1: Sign In - ได้ข้อมูล contacts กลับมา
      {
        name: 'Sign In',
        endpoint: '/auth/sign-in',
        payload: {
          username: 'loadtest@test.com',
          password: 'TestPassword123!',
        },
        // ดึงค่าจาก response เก็บไว้ใน context
        extract: {
          sessionId: 'data.sessionId',
          selectedContact: 'data.contacts[0].value', // เลือก contact แรก
        },
      },

      // Step 2: Send OTP - ส่ง OTP ไปยัง contact ที่เลือก
      {
        name: 'Send OTP',
        endpoint: '/auth/send-otp',
        // payload เป็น function ที่รับ context จาก step ก่อนหน้า
        payload: (ctx) => ({
          sessionId: ctx.sessionId,
          contact: ctx.selectedContact,
        }),
        extract: {
          refCode: 'data.refCode',
        },
      },

      // Step 3: Confirm OTP - ยืนยัน OTP และได้ token
      {
        name: 'Confirm OTP',
        endpoint: '/auth/confirm-otp',
        payload: (ctx) => ({
          sessionId: ctx.sessionId,
          refCode: ctx.refCode,
          otp: '123456', // Fixed test OTP (backend ต้องรองรับ test mode)
        }),
        // ไม่ต้อง extract - step สุดท้ายจะดึง token จาก tokenPath
      },
    ],
    // Path ของ token จาก response ของ step สุดท้าย
    tokenPath: 'data.accessToken',
  },

  report: {
    output: [{ type: 'console' }, { type: 'json', path: './reports' }],
  },
};

export default config;
