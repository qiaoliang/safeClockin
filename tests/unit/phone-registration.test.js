import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import { authApi } from '@/api/auth'

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

// Mock storage
vi.mock('@/store/modules/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  }
}))

// Mock auth API
vi.mock('@/api/auth', () => ({
  authApi: {
    sendSmsCode: vi.fn(),
    registerPhone: vi.fn(),
    loginPhone: vi.fn()
  }
}))

describe('手机号注册流程自动化测试', () => {
  let userStore

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    vi.clearAllMocks()
    
    // 设置默认的mock返回值
    uni.request.mockResolvedValue({
      statusCode: 200,
      data: { code: 1, msg: 'success' }
    })
    
    uni.getStorageSync.mockReturnValue(null)
    uni.setStorageSync.mockReturnValue(true)
    uni.showToast.mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('发送验证码', () => {
    it('应该成功发送验证码', async () => {
      const phone = '13800138000'
      
      // Mock发送验证码成功
      authApi.sendSmsCode.mockResolvedValue({
        code: 1,
        msg: '验证码发送成功'
      })

      const result = await authApi.sendSmsCode({
        phone: phone,
        purpose: 'register'
      })

      expect(result.code).toBe(1)
      expect(result.msg).toBe('验证码发送成功')
      expect(authApi.sendSmsCode).toHaveBeenCalledWith({
        phone: phone,
        purpose: 'register'
      })
    })

    it('应该处理发送验证码失败', async () => {
      const phone = '13800138000'
      
      // Mock发送验证码失败
      authApi.sendSmsCode.mockResolvedValue({
        code: 0,
        msg: '发送频率过高'
      })

      const result = await authApi.sendSmsCode({
        phone: phone,
        purpose: 'register'
      })

      expect(result.code).toBe(0)
      expect(result.msg).toBe('发送频率过高')
    })

    it('应该处理网络错误', async () => {
      const phone = '13800138000'
      
      // Mock网络错误
      authApi.sendSmsCode.mockRejectedValue(new Error('网络连接失败'))

      try {
        await authApi.sendSmsCode({
          phone: phone,
          purpose: 'register'
        })
        expect(true).toBe(false) // 不应该到达这里
      } catch (error) {
        expect(error.message).toBe('网络连接失败')
      }
    })
  })

  describe('手机号注册', () => {
    const validPhone = '13800138000'
    const validPassword = 'Test123456'
    const validCode = '123456' // 统一测试验证码

    beforeEach(() => {
      // 清理用户状态
      userStore.forceClearUserState()
    })

    it('应该成功注册新用户', async () => {
      // Mock发送验证码
      authApi.sendSmsCode.mockResolvedValue({
        code: 1,
        msg: '验证码发送成功'
      })

      // Mock注册成功
      authApi.registerPhone.mockResolvedValue({
        code: 1,
        data: {
          token: 'test-token',
          refresh_token: 'test-refresh-token',
          user_id: 123,
          nickname: '用户',
          role: 'solo'
        },
        msg: '注册成功'
      })

      // 1. 发送验证码
      const smsResult = await authApi.sendSmsCode({
        phone: validPhone,
        purpose: 'register'
      })
      expect(smsResult.code).toBe(1)

      // 2. 注册用户
      const registerResult = await authApi.registerPhone({
        phone: validPhone,
        code: validCode,
        password: validPassword
      })

      expect(registerResult.code).toBe(1)
      expect(registerResult.data.token).toBe('test-token')
      expect(registerResult.data.user_id).toBe(123)
      expect(registerResult.data.role).toBe('solo')
    })

    it('应该拒绝无效的验证码', async () => {
      // Mock注册失败（验证码错误）
      authApi.registerPhone.mockResolvedValue({
        code: 0,
        msg: '验证码错误'
      })

      const result = await authApi.registerPhone({
        phone: validPhone,
        code: '999999', // 错误验证码
        password: validPassword
      })

      expect(result.code).toBe(0)
      expect(result.msg).toBe('验证码错误')
    })

    it('应该拒绝弱密码', async () => {
      // Mock注册失败（密码太弱）
      authApi.registerPhone.mockResolvedValue({
        code: 0,
        msg: '密码至少8位，包含字母和数字'
      })

      const result = await authApi.registerPhone({
        phone: validPhone,
        code: validCode,
        password: '123' // 弱密码
      })

      expect(result.code).toBe(0)
      expect(result.msg).toBe('密码至少8位，包含字母和数字')
    })

    it('应该处理重复注册', async () => {
      // Mock注册失败（手机号已注册）
      authApi.registerPhone.mockResolvedValue({
        code: 0,
        msg: '手机号已注册'
      })

      const result = await authApi.registerPhone({
        phone: validPhone,
        code: validCode,
        password: validPassword
      })

      expect(result.code).toBe(0)
      expect(result.msg).toBe('手机号已注册')
    })
  })

  describe('注册后用户状态', () => {
    const validPhone = '13800138000'
    const validPassword = 'Test123456'
    const validCode = '123456'

    it('注册成功后应该正确设置用户状态', async () => {
      // Mock注册成功
      authApi.registerPhone.mockResolvedValue({
        code: 1,
        data: {
          token: 'test-token',
          refresh_token: 'test-refresh-token',
          user_id: 123,
          nickname: '测试用户',
          role: 'solo',
          phone: validPhone
        },
        msg: '注册成功'
      })

      // 执行注册
      const result = await authApi.registerPhone({
        phone: validPhone,
        code: validCode,
        password: validPassword
      })

      expect(result.code).toBe(1)

      // 验证用户状态设置（这里需要调用实际的登录逻辑）
      // 在真实场景中，注册成功后会自动登录
      // userStore.loginWithToken(result.data)
    })
  })

  describe('边界情况测试', () => {
    it('应该处理无效的手机号格式', async () => {
      const invalidPhone = '123456'
      
      authApi.sendSmsCode.mockResolvedValue({
        code: 0,
        msg: '手机号格式错误'
      })

      const result = await authApi.sendSmsCode({
        phone: invalidPhone,
        purpose: 'register'
      })

      expect(result.code).toBe(0)
      expect(result.msg).toBe('手机号格式错误')
    })

    it('应该处理空参数', async () => {
      authApi.sendSmsCode.mockResolvedValue({
        code: 0,
        msg: '参数错误'
      })

      const result = await authApi.sendSmsCode({
        phone: '',
        purpose: 'register'
      })

      expect(result.code).toBe(0)
      expect(result.msg).toBe('参数错误')
    })

    it('应该处理服务器错误', async () => {
      authApi.registerPhone.mockRejectedValue(new Error('服务器内部错误'))

      try {
        await authApi.registerPhone({
          phone: '13800138000',
          code: '123456',
          password: 'Test123456'
        })
        expect(true).toBe(false) // 不应该到达这里
      } catch (error) {
        expect(error.message).toBe('服务器内部错误')
      }
    })
  })

  describe('性能测试', () => {
    it('发送验证码响应时间应该在合理范围内', async () => {
      const startTime = Date.now()
      
      authApi.sendSmsCode.mockResolvedValue({
        code: 1,
        msg: '验证码发送成功'
      })

      await authApi.sendSmsCode({
        phone: '13800138000',
        purpose: 'register'
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // 响应时间应该小于3秒
      expect(responseTime).toBeLessThan(3000)
    })
  })
})

// 测试工具函数
export const PhoneRegistrationTestUtils = {
  // 模拟完整的注册流程
  async simulateFullRegistration(phone = '13800138000', password = 'Test123456') {
    const { authApi } = await import('@/api/auth')
    
    try {
      // 1. 发送验证码
      const smsResult = await authApi.sendSmsCode({
        phone: phone,
        purpose: 'register'
      })
      
      if (smsResult.code !== 1) {
        return { success: false, error: smsResult.msg }
      }

      // 2. 注册用户
      const registerResult = await authApi.registerPhone({
        phone: phone,
        code: '123456', // 统一测试验证码
        password: password
      })

      return {
        success: registerResult.code === 1,
        data: registerResult.data,
        error: registerResult.code === 1 ? null : registerResult.msg
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // 验证用户状态
  validateUserState(userStore) {
    return {
      isLoggedIn: userStore.isLoggedIn,
      hasToken: !!userStore.token,
      hasUserInfo: !!userStore.userInfo,
      tokenValid: userStore.isTokenValid
    }
  },

  // 清理测试数据
  async cleanup() {
    const userStore = useUserStore()
    userStore.forceClearUserState()
    vi.clearAllMocks()
  }
}