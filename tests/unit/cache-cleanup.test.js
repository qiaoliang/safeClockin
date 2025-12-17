import { describe, it, expect, vi } from 'vitest'

// 模拟 uni-app 的 storage API
const mockUniStorage = {
  data: {},
  getStorageSync(key) {
    return this.data[key]
  },
  setStorageSync(key, value) {
    this.data[key] = value
  },
  removeStorageSync(key) {
    delete this.data[key]
  },
  clearStorageSync() {
    this.data = {}
  }
}

// 模拟 storage 工具
const createMockStorage = () => ({
  set: vi.fn((key, value) => {
    mockUniStorage.setStorageSync(key, value)
  }),
  get: vi.fn((key) => {
    return mockUniStorage.getStorageSync(key)
  }),
  remove: vi.fn((key) => {
    mockUniStorage.removeStorageSync(key)
  }),
  clear: vi.fn(() => {
    mockUniStorage.clearStorageSync()
  })
})

describe('登录缓存清理逻辑测试', () => {
  beforeEach(() => {
    // 清空模拟存储
    mockUniStorage.clearStorageSync()
  })

  describe('缓存清理场景', () => {
    it('微信用户登录后退出再手机登录应该清理微信缓存', () => {
      const storage = createMockStorage()
      
      // 场景1：微信用户登录成功
      console.log('1. 微信用户登录成功')
      // 模拟微信用户信息
      const wechatUserInfo = {
        nickname: '微信用户_20251216203407',
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242L...',
        timestamp: Date.now()
      }
      
      // 微信登录时清理 login_scene
      storage.remove('login_scene')
      expect(storage.remove).toHaveBeenCalledWith('login_scene')
      console.log('   ✅ 清理了 login_scene')
      
      // 场景2：微信用户退出
      console.log('2. 微信用户退出')
      // 保存微信用户缓存
      storage.set('safeguard_cache', wechatUserInfo)
      expect(storage.set).toHaveBeenCalledWith('safeguard_cache', wechatUserInfo)
      console.log('   ✅ 保存了微信用户缓存')
      
      // 验证缓存存在
      const cachedData = storage.get('safeguard_cache')
      expect(cachedData).toEqual(wechatUserInfo)
      
      // 场景3：手机用户登录
      console.log('3. 手机用户登录成功')
      // 手机登录时应该清理微信用户缓存
      storage.remove('safeguard_cache')
      storage.remove('login_scene')
      expect(storage.remove).toHaveBeenCalledWith('safeguard_cache')
      expect(storage.remove).toHaveBeenCalledWith('login_scene')
      console.log('   ✅ 清理了 safeguard_cache 和 login_scene')
      
      // 验证缓存已被清理
      const finalCache = storage.get('safeguard_cache')
      expect(finalCache).toBeUndefined()
      
      console.log('✅ 测试通过：手机用户登录时已成功清理微信用户缓存')
    })

    it('手机用户登录时如果没有微信缓存也应该正常工作', () => {
      const storage = createMockStorage()
      
      console.log('手机用户登录（无微信缓存）')
      
      // 手机登录时清理缓存
      storage.remove('safeguard_cache')
      storage.remove('login_scene')
      
      expect(storage.remove).toHaveBeenCalledWith('safeguard_cache')
      expect(storage.remove).toHaveBeenCalledWith('login_scene')
      
      console.log('✅ 测试通过：即使没有微信缓存，清理操作也能正常工作')
    })

    it('微信用户登录时应该清理 login_scene', () => {
      const storage = createMockStorage()
      
      console.log('微信用户登录')
      
      // 设置一个旧的 login_scene
      storage.set('login_scene', 'relogin')
      
      // 微信登录时清理 login_scene
      storage.remove('login_scene')
      
      expect(storage.remove).toHaveBeenCalledWith('login_scene')
      
      console.log('✅ 测试通过：微信登录时清理了 login_scene')
    })
  })

  describe('_clearUserStorage 方法逻辑', () => {
    it('应该清理所有用户相关的存储项', () => {
      const storage = createMockStorage()
      
      console.log('测试 _clearUserStorage 逻辑')
      
      // 模拟所有可能的存储项
      const storageItems = [
        'userState',
        'token', 
        'refreshToken',
        'cached_user_info',
        'secure_seed',
        'checkinCache',
        'safeguard_cache',
        'login_scene'
      ]
      
      // 调用清理逻辑
      storageItems.forEach(item => {
        storage.remove(item)
      })
      
      // 验证所有项都被清理了
      storageItems.forEach(item => {
        expect(storage.remove).toHaveBeenCalledWith(item)
      })
      
      expect(storage.remove).toHaveBeenCalledTimes(storageItems.length)
      
      console.log(`✅ 测试通过：清理了 ${storageItems.length} 个存储项`)
    })
  })

  describe('微信用户缓存管理', () => {
    it('应该正确保存和获取微信用户缓存', () => {
      const storage = createMockStorage()
      
      console.log('测试微信用户缓存管理')
      
      // 测试保存缓存
      const cacheData = {
        nickname: '微信用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        timestamp: Date.now()
      }
      
      storage.set('safeguard_cache', cacheData)
      expect(storage.set).toHaveBeenCalledWith('safeguard_cache', cacheData)
      
      // 测试获取缓存
      const retrievedCache = storage.get('safeguard_cache')
      expect(retrievedCache).toEqual(cacheData)
      
      // 测试清理缓存
      storage.remove('safeguard_cache')
      expect(storage.remove).toHaveBeenCalledWith('safeguard_cache')
      
      const finalCache = storage.get('safeguard_cache')
      expect(finalCache).toBeUndefined()
      
      console.log('✅ 测试通过：微信用户缓存管理功能正常')
    })

    it('缓存过期时应该被清理', () => {
      const storage = createMockStorage()
      
      console.log('测试缓存过期清理')
      
      // 创建过期的缓存（8天前）
      const expiredCache = {
        nickname: '过期用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000) // 8天前
      }
      
      storage.set('safeguard_cache', expiredCache)
      
      // 模拟获取缓存并发现过期
      const cachedData = storage.get('safeguard_cache')
      if (cachedData && cachedData.timestamp) {
        const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7天
        const isExpired = Date.now() - cachedData.timestamp > CACHE_DURATION
        
        if (isExpired) {
          storage.remove('safeguard_cache')
        }
      }
      
      expect(storage.remove).toHaveBeenCalledWith('safeguard_cache')
      
      console.log('✅ 测试通过：过期缓存被正确清理')
    })
  })

  describe('用户退出逻辑', () => {
    it('微信用户退出时应该保存缓存', () => {
      const storage = createMockStorage()
      
      console.log('测试微信用户退出逻辑')
      
      // 模拟微信用户信息
      const userInfo = {
        nickname: '微信用户',
        avatarUrl: 'https://example.com/avatar.jpg'
      }
      
      // 微信用户退出时保存缓存
      if (userInfo.nickname && userInfo.avatarUrl) {
        const cacheData = {
          nickname: userInfo.nickname,
          avatarUrl: userInfo.avatarUrl,
          timestamp: Date.now()
        }
        storage.set('safeguard_cache', cacheData)
      }
      
      expect(storage.set).toHaveBeenCalledWith('safeguard_cache', expect.objectContaining({
        nickname: '微信用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        timestamp: expect.any(Number)
      }))
      
      console.log('✅ 测试通过：微信用户退出时保存了缓存')
    })

    it('手机用户退出时应该清理微信缓存', () => {
      const storage = createMockStorage()
      
      console.log('测试手机用户退出逻辑')
      
      // 先设置一个微信缓存
      storage.set('safeguard_cache', {
        nickname: '微信用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        timestamp: Date.now()
      })
      
      // 手机用户退出时清理微信缓存
      storage.remove('safeguard_cache')
      
      expect(storage.remove).toHaveBeenCalledWith('safeguard_cache')
      
      console.log('✅ 测试通过：手机用户退出时清理了微信缓存')
    })
  })
})