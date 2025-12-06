// 真实后端服务的 E2E 测试
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { request } from '@/api/request.js'

describe('真实后端服务 E2E 测试', () => {
  const backendUrl = process.env.BASE_URL_FOR_SAFEGUARD || 'http://localhost:8080'
  
  beforeEach(() => {
    // 清理存储
    global.uni.getStorageSync.mockReturnValue(null)
    global.storage.get.mockReturnValue(null)
  })

  afterEach(() => {
    // 清理测试数据
    global.uni.removeStorageSync.mockClear()
    global.storage.remove.mockClear()
  })

  describe('后端服务连接测试', () => {
    it('应该能够连接到后端服务', async () => {
      const response = await request({
        url: '/api/count',
        method: 'GET'
      })

      expect(response.code).toBe(1)
      expect(response.data).toBeDefined()
    })

    it('应该能够获取计数器值', async () => {
      const response = await request({
        url: '/api/count',
        method: 'GET'
      })

      expect(response.code).toBe(1)
      expect(response.data.count).toBeDefined()
      expect(typeof response.data.count).toBe('number')
    })

    it('应该能够增加计数器值', async () => {
      // 先获取当前值
      const getResponse = await request({
        url: '/api/count',
        method: 'GET'
      })
      const initialValue = getResponse.data.count

      // 增加计数器
      const incResponse = await request({
        url: '/api/count',
        method: 'POST',
        data: { action: 'inc' }
      })

      expect(incResponse.code).toBe(1)
      expect(incResponse.data.count).toBe(initialValue + 1)
    })
  })

  describe('微信登录测试', () => {
    const TEST_CODE = 'test_wechat_code_12345'

    it('应该能够处理微信登录请求', async () => {
      const response = await request({
        url: '/api/login',
        method: 'POST',
        data: { code: TEST_CODE }
      })

      // 注意：由于没有真实的微信 code，这里可能会失败，但应该返回结构化的错误
      expect(response).toBeDefined()
      expect(response.code).toBeDefined()
      expect(response.msg).toBeDefined()
    })
  })

  describe('用户信息测试', () => {
    it('未登录时获取用户信息应该返回错误', async () => {
      try {
        await request({
          url: '/api/user/profile',
          method: 'GET'
        })
        // 如果没有抛出错误，这是意外的
        expect(true).toBe(false)
      } catch (error) {
        // 应该抛出认证错误
        expect(error.message).toContain('Token') || expect(error.message).toContain('登录')
      }
    })
  })

  describe('错误处理测试', () => {
    it('不存在的端点应该返回404错误', async () => {
      try {
        await request({
          url: '/api/nonexistent_endpoint',
          method: 'GET'
        })
        // 如果没有抛出错误，这是意外的
        expect(true).toBe(false)
      } catch (error) {
        // 应该抛出错误
        expect(error.message).toContain('请求失败')
        expect(error.message).toContain('404')
      }
    })

    it('无效的请求方法应该返回错误', async () => {
      try {
        await request({
          url: '/api/count',
          method: 'INVALID_METHOD'
        })
        // 如果没有抛出错误，这是意外的
        expect(true).toBe(false)
      } catch (error) {
        // 应该抛出错误
        expect(error.message).toContain('请求失败')
      }
    })
  })

  describe('环境变量测试', () => {
    it('应该使用正确的后端 URL', () => {
      // 这个测试验证环境变量是否正确设置
      expect(backendUrl).toBeDefined()
      expect(backendUrl).toMatch(/^https?:\/\/.+/)
    })
  })
})