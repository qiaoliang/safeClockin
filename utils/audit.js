import { request } from '@/api/request'

export async function logLoginAttempt(payload) {
  try {
    await request({ url: '/api/audit/login_attempt', method: 'POST', data: payload })
  } catch(e) {}
}
