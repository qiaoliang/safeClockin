// 测试微信用户缓存机制
import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from '@/store/modules/user'
import { storage } from '@/store/modules/storage'

describe('微信用户缓存机制测试', () => {
  let userStore

  beforeEach(() => {
    userStore = useUserStore()
    // 确保userState结构完整
    userStore._ensureUserStateIntegrity()
  })

  afterEach(() => {
    // 清理存储
    storage.clear()
  })

  it('应该能够保存微信用户信息到缓存', () => {
    const userStore = useUserStore()
    
    // 设置用户信息
    userStore.userState.profile.nickname = '测试用户'
    userStore.userState.profile.avatarUrl = 'https://example.com/avatar.jpg'
    
    // 保存缓存
    userStore._saveWechatUserCache()
    
    // 验证缓存已保存
    const cacheData = storage.get('safeguard_cache')
    expect(cacheData).toBeTruthy()
    expect(cacheData.nickname).toBe('测试用户')
    expect(cacheData.avatarUrl).toBe('https://example.com/avatar.jpg')
    expect(cacheData.timestamp).toBeTruthy()
  })

  it('应该能够获取有效的微信用户缓存', () => {
    const userStore = useUserStore()
    
    // 先保存一个缓存
    const cacheData = {
      nickname: '测试用户',
      avatarUrl: 'https://example.com/avatar.jpg',
      timestamp: Date.now()
    }
    storage.set('safeguard_cache', cacheData)
    
    // 获取缓存
    const retrievedCache = userStore.getWechatUserCache()
    
    expect(retrievedCache).toBeTruthy()
    expect(retrievedCache.nickname).toBe('测试用户')
    expect(retrievedCache.avatarUrl).toBe('https://example.com/avatar.jpg')
  })

  it('应该返回null如果缓存已过期', () => {
    const userStore = useUserStore()
    
    // 保存一个过期的缓存（8天前）
    const expiredCache = {
      nickname: '过期用户',
      avatarUrl: 'https://example.com/expired.jpg',
      timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000) // 8天前
    }
    storage.set('safeguard_cache', expiredCache)
    
    // 获取缓存
    const retrievedCache = userStore.getWechatUserCache()
    
    expect(retrievedCache).toBeNull()
  })

  it('应该能够清理微信用户缓存', () => {
    const userStore = useUserStore()
    
    // 先保存一个缓存
    storage.set('safeguard_cache', { nickname: '测试用户', avatarUrl: 'avatar.jpg', timestamp: Date.now() })
    
    // 验证缓存存在
    expect(storage.get('safeguard_cache')).toBeTruthy()
    
    // 清理缓存
    userStore.clearWechatUserCache()
    
    // 验证缓存已清理
    expect(storage.get('safeguard_cache')).toBeNull()
  })

  it('应该能够更新微信用户缓存', () => {
    const userStore = useUserStore()
    
    // 更新缓存
    userStore.updateWechatUserCache('新用户', 'https://example.com/new-avatar.jpg')
    
    // 验证缓存已更新
    const cacheData = storage.get('safeguard_cache')
    expect(cacheData.nickname).toBe('新用户')
    expect(cacheData.avatarUrl).toBe('https://example.com/new-avatar.jpg')
  })

  it('退出登录时应该保存微信用户信息到缓存', () => {
    const userStore = useUserStore()
    
    // 设置用户状态
    userStore.userState.profile.nickname = '退出用户'
    userStore.userState.profile.avatarUrl = 'https://example.com/logout-avatar.jpg'
    userStore.userState.auth.token = 'fake-token'
    userStore.isLoggedIn = true
    
    // 执行退出登录
    userStore.logout()
    
    // 验证用户状态已清理
    expect(userStore.isLoggedIn).toBe(false)
    expect(userStore.userState.auth.token).toBeNull()
    
    // 验证微信用户信息已保存到缓存
    const cacheData = storage.get('safeguard_cache')
    expect(cacheData).toBeTruthy()
    expect(cacheData.nickname).toBe('退出用户')
    expect(cacheData.avatarUrl).toBe('https://example.com/logout-avatar.jpg')
  })
})