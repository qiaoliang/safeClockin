import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TEST_VERIFICATION_CODE, testUtils, server } from '../setup.integration.js'

// Mock uni API
global.uni = {
  request: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn()
}

describe('手机号注册集成测试（直接 HTTP）', () => {
  beforeEach(() => {
    // 重置 uni API mock
    vi.clearAllMocks()
    
    // 设置默认的 uni API mock
    uni.request.mockImplementation(({ url, method, data, header }) => {
      // 直接返回 MSW 处理的结果
      return fetch(`http://localhost:9999${url}`, {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...header
        },
        body: data ? JSON.stringify(data) : undefined
      }).then(async (response) => {
        const responseData = await response.json()
        return {
          statusCode: response.status,
          data: responseData
        }
      })
    })
    
    uni.showToast.mockReturnValue(true)
    uni.getStorageSync.mockReturnValue(null)
    uni.setStorageSync.mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('发送验证码 API 集成测试', () => {
    it('应该成功发送验证码', async () => {
      const phone = '13800138000'
      
      const response = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: phone,
          purpose: 'register'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.data.code).toBe(1)
      expect(response.data.msg).toBe('验证码发送成功')
    })

    it('应该拒绝无效的手机号格式', async () => {
      const invalidPhone = '123456'
      
      const response = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: invalidPhone,
          purpose: 'register'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.data.code).toBe(0)
      expect(response.data.msg).toBe('手机号格式错误')
    })

    it('应该处理网络错误', async () => {
      testUtils.mockApiError('/api/sms/send_code', '网络连接失败')
      
      const response = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: '13800138000',
          purpose: 'register'
        }
      })

      expect(response.statusCode).toBe(500)
      expect(response.data.code).toBe(0)
      expect(response.data.msg).toBe('网络连接失败')
    })

    it('应该处理网络延迟', async () => {
      testUtils.mockNetworkDelay('/api/sms/send_code', 1000)
      
      const startTime = Date.now()
      const response = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: '13800138000',
          purpose: 'register'
        }
      })
      const endTime = Date.now()

      expect(response.statusCode).toBe(200)
      expect(response.data.code).toBe(1)
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000)
    })
  })

  describe('手机号注册 API 集成测试', () => {
    const validPhone = '13800138000'
    const validPassword = 'Test123456'

    it('应该成功注册新用户', async () => {
      const response = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: validPhone,
          code: TEST_VERIFICATION_CODE,
          password: validPassword
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.data.code).toBe(1)
      expect(response.data.msg).toBe('注册成功')
      expect(response.data.data).toHaveProperty('token')
      expect(response.data.data).toHaveProperty('refresh_token')
      expect(response.data.data).toHaveProperty('user_id')
      expect(response.data.data).toHaveProperty('nickname')
      expect(response.data.data).toHaveProperty('role')
      expect(response.data.data).toHaveProperty('phone')
      expect(response.data.data.phone).toBe(validPhone)
      expect(response.data.data.role).toBe('solo')
    })

    it('应该拒绝错误的验证码', async () => {
      const response = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: validPhone,
          code: '999999', // 错误验证码
          password: validPassword
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.data.code).toBe(0)
      expect(response.data.msg).toBe('验证码错误')
    })

    it('应该拒绝弱密码', async () => {
      const weakPasswords = ['123', '12345678', 'abcdefgh', 'password']
      
      for (const password of weakPasswords) {
        const response = await uni.request({
          url: '/api/auth/register_phone',
          method: 'POST',
          data: {
            phone: validPhone,
            code: TEST_VERIFICATION_CODE,
            password: password
          }
        })

        expect(response.statusCode).toBe(400)
        expect(response.data.code).toBe(0)
        expect(response.data.msg).toBe('密码至少8位，包含字母和数字')
      }
    })

    it('应该拒绝无效的手机号', async () => {
      const invalidPhones = ['123456', '138001380001', 'abc1234567', '']
      
      for (const phone of invalidPhones) {
        const response = await uni.request({
          url: '/api/auth/register_phone',
          method: 'POST',
          data: {
            phone: phone,
            code: TEST_VERIFICATION_CODE,
            password: validPassword
          }
        })

        expect(response.statusCode).toBe(400)
        expect(response.data.code).toBe(0)
        expect(response.data.msg).toBe('手机号格式错误')
      }
    })

    it('应该处理重复注册', async () => {
      const duplicatePhone = '13900139000' // 预设的重复手机号
      
      const response = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: duplicatePhone,
          code: TEST_VERIFICATION_CODE,
          password: validPassword
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.data.code).toBe(0)
      expect(response.data.msg).toBe('手机号已注册')
    })

    it('应该处理服务器错误', async () => {
      testUtils.mockApiError('/api/auth/register_phone', '服务器内部错误')
      
      const response = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: validPhone,
          code: TEST_VERIFICATION_CODE,
          password: validPassword
        }
      })

      expect(response.statusCode).toBe(500)
      expect(response.data.code).toBe(0)
      expect(response.data.msg).toBe('服务器内部错误')
    })
  })

  describe('手机号登录集成测试', () => {
    const validPhone = '13800138000'

    it('应该成功登录', async () => {
      const response = await uni.request({
        url: '/api/auth/login_phone',
        method: 'POST',
        data: {
          phone: validPhone,
          code: TEST_VERIFICATION_CODE
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.data.code).toBe(1)
      expect(response.data.msg).toBe('登录成功')
      expect(response.data.data).toHaveProperty('token')
      expect(response.data.data).toHaveProperty('refresh_token')
      expect(response.data.data).toHaveProperty('user_id')
      expect(response.data.data).toHaveProperty('nickname')
      expect(response.data.data).toHaveProperty('role')
      expect(response.data.data.phone).toBe(validPhone)
    })

    it('应该拒绝错误的验证码', async () => {
      const response = await uni.request({
        url: '/api/auth/login_phone',
        method: 'POST',
        data: {
          phone: validPhone,
          code: '999999'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.data.code).toBe(0)
      expect(response.data.msg).toBe('验证码错误')
    })

    it('应该拒绝无效的手机号', async () => {
      const response = await uni.request({
        url: '/api/auth/login_phone',
        method: 'POST',
        data: {
          phone: '123456',
          code: TEST_VERIFICATION_CODE
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.data.code).toBe(0)
      expect(response.data.msg).toBe('手机号格式错误')
    })
  })

  describe('完整注册流程集成测试', () => {
    const validPhone = '13800138000'
    const validPassword = 'Test123456'

    it('应该完成完整的注册流程', async () => {
      // 1. 发送验证码
      const smsResponse = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: validPhone,
          purpose: 'register'
        }
      })
      
      expect(smsResponse.statusCode).toBe(200)
      expect(smsResponse.data.code).toBe(1)
      expect(smsResponse.data.msg).toBe('验证码发送成功')

      // 2. 注册用户
      const registerResponse = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: validPhone,
          code: TEST_VERIFICATION_CODE,
          password: validPassword
        }
      })

      expect(registerResponse.statusCode).toBe(200)
      expect(registerResponse.data.code).toBe(1)
      expect(registerResponse.data.data).toHaveProperty('token')
      expect(registerResponse.data.data).toHaveProperty('user_id')
      expect(registerResponse.data.data.role).toBe('solo')
    })

    it('应该处理注册流程中的网络错误', async () => {
      // 1. 发送验证码成功
      const smsResponse = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: validPhone,
          purpose: 'register'
        }
      })
      expect(smsResponse.statusCode).toBe(200)

      // 2. 模拟注册时的网络错误
      testUtils.mockApiError('/api/auth/register_phone', '网络超时')
      
      const registerResponse = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: validPhone,
          code: TEST_VERIFICATION_CODE,
          password: validPassword
        }
      })

      expect(registerResponse.statusCode).toBe(500)
      expect(registerResponse.data.code).toBe(0)
      expect(registerResponse.data.msg).toBe('网络超时')
    })
  })

  describe('性能和边界测试', () => {
    it('API 响应时间应该在合理范围内', async () => {
      const startTime = Date.now()
      
      const response = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: '13800138000',
          purpose: 'register'
        }
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime

      // 响应时间应该小于1秒（不包括网络延迟）
      expect(responseTime).toBeLessThan(1000)
      expect(response.statusCode).toBe(200)
    })

    it('应该处理并发请求', async () => {
      const promises = Array(5).fill().map((_, index) => 
        uni.request({
          url: '/api/sms/send_code',
          method: 'POST',
          data: {
            phone: '1380013800' + index,
            purpose: 'register'
          }
        })
      )

      const responses = await Promise.all(promises)
      
      // 所有请求都应该成功
      responses.forEach(response => {
        expect(response.statusCode).toBe(200)
        expect(response.data.code).toBe(1)
      })
    })

    it('应该处理大量数据', async () => {
      const largePassword = 'A'.repeat(100) + '1'.repeat(100)
      
      const response = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: '13800138001',
          code: TEST_VERIFICATION_CODE,
          password: largePassword
        }
      })

      // 应该能处理长密码
      expect(response.statusCode).toBe(200)
      expect(response.data.code).toBe(1)
    })
  })

  describe('错误恢复测试', () => {
    it('应该从网络错误中恢复', async () => {
      // 模拟网络错误
      testUtils.mockApiError('/api/sms/send_code', '网络连接失败')
      
      const errorResponse = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: '13800138000',
          purpose: 'register'
        }
      })

      expect(errorResponse.statusCode).toBe(500)
      expect(errorResponse.data.code).toBe(0)

      // 恢复正常
      server.resetHandlers()
      
      const successResponse = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: '13800138000',
          purpose: 'register'
        }
      })

      expect(successResponse.statusCode).toBe(200)
      expect(successResponse.data.code).toBe(1)
    })

    it('应该处理部分失败', async () => {
      // 第一个请求成功
      const response1 = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: '13800138000',
          purpose: 'register'
        }
      })
      expect(response1.statusCode).toBe(200)

      // 第二个请求失败
      testUtils.mockApiError('/api/auth/register_phone', '服务器繁忙')
      
      const response2 = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: '13800138000',
          code: TEST_VERIFICATION_CODE,
          password: 'Test123456'
        }
      })
      expect(response2.statusCode).toBe(500)

      // 第三个请求恢复成功
      server.resetHandlers()
      
      const response3 = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: '13800138001',
          code: TEST_VERIFICATION_CODE,
          password: 'Test123456'
        }
      })
      expect(response3.statusCode).toBe(200)
    })
  })
})

// 集成测试工具函数
export const PhoneRegistrationIntegrationUtils = {
  // 模拟完整注册流程
  async simulateFullRegistration(phone = '13800138000', password = 'Test123456') {
    try {
      // 1. 发送验证码
      const smsResponse = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: phone,
          purpose: 'register'
        }
      })
      
      if (smsResponse.data.code !== 1) {
        return { success: false, error: smsResponse.data.msg, step: 'sms' }
      }

      // 2. 注册用户
      const registerResponse = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: phone,
          code: TEST_VERIFICATION_CODE,
          password: password
        }
      })

      if (registerResponse.data.code !== 1) {
        return { success: false, error: registerResponse.data.msg, step: 'register' }
      }

      return {
        success: true,
        data: registerResponse.data.data
      }
    } catch (error) {
      return { success: false, error: error.message, step: 'exception' }
    }
  },

  // 验证注册结果
  validateRegistrationResult(result, expectedPhone = '13800138000') {
    return {
      success: result.success,
      hasToken: result.data?.token ? true : false,
      hasUserId: result.data?.user_id ? true : false,
      correctPhone: result.data?.phone === expectedPhone,
      correctRole: result.data?.role === 'solo'
    }
  },

  // 清理测试环境
  async cleanup() {
    server.resetHandlers()
    vi.clearAllMocks()
  }
}