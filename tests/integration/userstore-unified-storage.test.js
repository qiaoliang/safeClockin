import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import { storage } from '@/store/modules/storage'
import { server } from '../setup.integration.js'

// Mock storage
vi.mock('@/store/modules/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  }
}))

describe('UserStore 统一存储系统测试', () => {
  let userStore

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    vi.clearAllMocks()
  })

  describe('userState 结构完整性', () => {
    it('应该确保 userState 结构完整', () => {
      // 重置 userState 为空
      userStore.userState = null
      
      // 调用完整性检查
      userStore._ensureUserStateIntegrity()
      
      // 验证结构完整
      expect(userStore.userState).toHaveProperty('auth')
      expect(userStore.userState).toHaveProperty('profile')
      expect(userStore.userState).toHaveProperty('cache')
      
      expect(userStore.userState.auth).toHaveProperty('token')
      expect(userStore.userState.auth).toHaveProperty('refreshToken')
      expect(userStore.userState.auth).toHaveProperty('secureSeed')
      expect(userStore.userState.auth).toHaveProperty('loginTime')
      expect(userStore.userState.auth).toHaveProperty('expiresAt')
      
      expect(userStore.userState.profile).toHaveProperty('userId')
      expect(userStore.userState.profile).toHaveProperty('nickname')
      expect(userStore.userState.profile).toHaveProperty('avatarUrl')
      expect(userStore.userState.profile).toHaveProperty('role')
      expect(userStore.userState.profile).toHaveProperty('phone')
      expect(userStore.userState.profile).toHaveProperty('wechatOpenid')
      expect(userStore.userState.profile).toHaveProperty('isVerified')
      
      expect(userStore.userState.cache).toHaveProperty('checkinData')
      expect(userStore.userState.cache).toHaveProperty('lastUpdate')
      expect(userStore.userState.cache).toHaveProperty('cachedUserInfo')
    })

    it('应该修复不完整的 userState 结构', () => {
      // 设置不完整的结构
      userStore.userState = {
        auth: { token: 'test-token' }
        // 缺少 profile 和 cache
      }
      
      // 调用完整性检查
      userStore._ensureUserStateIntegrity()
      
      // 验证结构被修复
      expect(userStore.userState.auth).toHaveProperty('refreshToken')
      expect(userStore.userState.auth).toHaveProperty('secureSeed')
      expect(userStore.userState).toHaveProperty('profile')
      expect(userStore.userState).toHaveProperty('cache')
    })
  })

  describe('持久化存储', () => {
    it('应该只保存 userState 到 storage', () => {
      // 设置用户状态
      userStore.userState.auth.token = 'test-token'
      userStore.userState.auth.refreshToken = 'test-refresh'
      userStore.userState.profile.nickname = 'test-user'
      
      // 调用持久化
      userStore._persistUserState()
      
      // 验证只调用了 storage.set('userState')
      expect(storage.set).toHaveBeenCalledWith('userState', JSON.stringify(userStore.userState))
      expect(storage.set).toHaveBeenCalledTimes(1)
    })

    it('应该从 storage 恢复 userState', () => {
      const mockUserState = {
        auth: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          secureSeed: 'test-seed',
          loginTime: '2023-12-06T10:00:00.000Z',
          expiresAt: '2023-12-06T12:00:00.000Z'
        },
        profile: {
          userId: 123,
          nickname: 'test-user',
          avatarUrl: 'test-avatar',
          role: 'solo',
          phone: '13800138000',
          wechatOpenid: 'test-openid',
          isVerified: true
        },
        cache: {
          checkinData: { test: 'data' },
          lastUpdate: Date.now(),
          cachedUserInfo: { test: 'info' }
        }
      }
      
      storage.get.mockReturnValue(JSON.stringify(mockUserState))
      
      // 调用恢复
      const result = userStore._restoreUserState()
      
      // 验证恢复成功
      expect(result).toBe(true)
      expect(userStore.userState).toEqual(mockUserState)
      expect(userStore.isLoggedIn).toBe(true)
    })

    it('应该处理无效的 userState 数据', () => {
      storage.get.mockReturnValue('invalid-json')
      
      // 调用恢复
      const result = userStore._restoreUserState()
      
      // 验证恢复失败
      expect(result).toBe(false)
      expect(userStore.isLoggedIn).toBe(false)
    })
  })

  describe('token 管理', () => {
    it('应该正确更新 token 和 refreshToken', () => {
      const newToken = 'new-token'
      const newRefreshToken = 'new-refresh-token'
      
      // 调用更新
      userStore.updateTokens(newToken, newRefreshToken)
      
      // 验证更新
      expect(userStore.userState.auth.token).toBe(newToken)
      expect(userStore.userState.auth.refreshToken).toBe(newRefreshToken)
      expect(storage.set).toHaveBeenCalledWith('userState', JSON.stringify(userStore.userState))
    })

    it('应该正确处理 token 过期', () => {
      // 设置初始状态
      userStore.userState.auth.token = 'test-token'
      userStore.userState.auth.refreshToken = 'test-refresh'
      userStore.isLoggedIn = true
      
      // 调用过期处理
      userStore.handleTokenExpired()
      
      // 验证状态
      expect(userStore.userState.auth.token).toBeNull()
      expect(userStore.userState.auth.refreshToken).toBeNull()
      expect(userStore.userState.auth.expiresAt).toBeNull()
      expect(userStore.isLoggedIn).toBe(false)
      expect(storage.set).toHaveBeenCalledWith('login_scene', 'relogin')
    })
  })

  describe('初始化', () => {
    it('应该正确初始化用户状态', () => {
      const mockUserState = {
        auth: { token: 'test-token', expiresAt: '2099-12-06T12:00:00.000Z' },
        profile: { nickname: 'test-user', role: 'solo' },
        cache: {}
      }
      
      storage.get.mockReturnValue(JSON.stringify(mockUserState))
      
      // 调用初始化
      userStore.initUserState()
      
      // 验证初始化
      expect(userStore.userState).toEqual(mockUserState)
      expect(userStore.isLoggedIn).toBe(true)
    })

    it('应该处理过期的 token', () => {
      const mockUserState = {
        auth: { token: 'test-token', expiresAt: '2020-12-06T12:00:00.000Z' },
        profile: { nickname: 'test-user', role: 'solo' },
        cache: {}
      }
      
      storage.get.mockReturnValue(JSON.stringify(mockUserState))
      
      // 调用初始化
      userStore.initUserState()
      
      // 验证过期处理
      expect(userStore.isLoggedIn).toBe(false)
    })
  })
})

// 每个测试后重置服务器状态
afterEach(() => {
  server.resetHandlers()
})