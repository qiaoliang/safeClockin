// 真实后端服务的手机注册集成测试
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { request } from '@/api/request.js'

describe('手机注册 - 真实后端集成测试', () => {
  const TEST_PHONE = '13800138999'
  const TEST_CODE = '123456' // 使用调试验证码
  
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该能够发送验证码', async () => {
    const response = await request({
      url: '/api/sms/send_code',
      method: 'POST',
      data: {
        phone: TEST_PHONE,
        purpose: 'register'
      },
      header: {
        'X-Debug-Code': '1' // 启用调试模式获取验证码
      },
      suppressErrorLog: true
    })

    expect(response.code).toBe(1)
    expect(response.data.message).toBe('验证码已发送')
    expect(response.data.debug_code).toBe(TEST_CODE)
  })

  it('应该能够使用验证码注册', async () => {
    // 先发送验证码
    await request({
      url: '/api/sms/send_code',
      method: 'POST',
      data: {
        phone: TEST_PHONE,
        purpose: 'register'
      },
      header: {
        'X-Debug-Code': '1'
      },
      suppressErrorLog: true
    })

    // 使用验证码注册
    const response = await request({
      url: '/api/auth/register_phone',
      method: 'POST',
      data: {
        phone: TEST_PHONE,
        code: TEST_CODE,
        nickname: '集成测试用户',
        password: 'Test123456'
      },
      suppressErrorLog: true
    })

    expect(response.code).toBe(1)
    expect(response.data.token).toBeDefined()
    expect(response.data.refresh_token).toBeDefined()
    expect(response.data.user_id).toBeDefined()
  })

  it('应该拒绝重复注册', async () => {
    // 先发送验证码
    await request({
      url: '/api/sms/send_code',
      method: 'POST',
      data: {
        phone: TEST_PHONE,
        purpose: 'register'
      },
      header: {
        'X-Debug-Code': '1'
      },
      suppressErrorLog: true
    })

    // 尝试重复注册
    const response = await request({
      url: '/api/auth/register_phone',
      method: 'POST',
      data: {
        phone: TEST_PHONE,
        code: TEST_CODE,
        nickname: '重复测试用户',
        password: 'Test123456'
      },
      suppressErrorLog: true
    })

    expect(response.code).toBe(0)
    expect(response.msg).toContain('手机号已注册')
  })

  it('应该拒绝错误的验证码', async () => {
    // 先发送验证码
    await request({
      url: '/api/sms/send_code',
      method: 'POST',
      data: {
        phone: '13800138998',
        purpose: 'register'
      },
      header: {
        'X-Debug-Code': '1'
      },
      suppressErrorLog: true
    })

    // 使用错误的验证码
    const response = await request({
      url: '/api/auth/register_phone',
      method: 'POST',
      data: {
        phone: '13800138998',
        code: '999999',
        nickname: '错误验证码测试',
        password: 'Test123456'
      },
      suppressErrorLog: true
    })

    expect(response.code).toBe(0)
    expect(response.msg).toContain('验证码无效')
  })

  it('应该拒绝弱密码', async () => {
    // 先发送验证码
    await request({
      url: '/api/sms/send_code',
      method: 'POST',
      data: {
        phone: '13800138997',
        purpose: 'register'
      },
      header: {
        'X-Debug-Code': '1'
      },
      suppressErrorLog: true
    })

    // 使用弱密码
    const response = await request({
      url: '/api/auth/register_phone',
      method: 'POST',
      data: {
        phone: '13800138997',
        code: TEST_CODE,
        nickname: '弱密码测试',
        password: '123' // 弱密码
      },
      suppressErrorLog: true
    })

    expect(response.code).toBe(0)
    expect(response.msg).toContain('密码强度不足')
  })
})