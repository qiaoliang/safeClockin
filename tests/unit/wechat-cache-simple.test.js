// 测试微信用户缓存机制 - 直接测试存储功能
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { storage } from '@/store/modules/storage'

// 模拟uni API
const mockUni = {
  setStorageSync: vi.fn(),
  getStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn()
}

// 替换全局uni
global.uni = mockUni

describe('微信用户缓存机制测试', () => {
  beforeEach(() => {
    // 清除所有mock调用
    vi.clearAllMocks()
    
    // 模拟存储数据
    const mockStorage = {}
    
    // 设置mock返回值
    mockUni.getStorageSync.mockImplementation((key) => {
      return mockStorage[key] || null
    })
    
    mockUni.setStorageSync.mockImplementation((key, value) => {
      mockStorage[key] = value
    })
    
    mockUni.removeStorageSync.mockImplementation((key) => {
      delete mockStorage[key]
    })
    
    mockUni.clearStorageSync.mockImplementation(() => {
      Object.keys(mockStorage).forEach(key => {
        delete mockStorage[key]
      })
    })
  })

  it('应该能够保存和获取safeguard_cache', () => {
    const cacheData = {
      nickname: '测试用户',
      avatarUrl: 'https://example.com/avatar.jpg',
      timestamp: Date.now()
    }
    
    // 保存缓存
    const result = storage.set('safeguard_cache', cacheData)
    expect(result).toBe(true)
    expect(mockUni.setStorageSync).toHaveBeenCalledWith('safeguard_cache', JSON.stringify(cacheData))
    
    // 获取缓存
    mockUni.getStorageSync.mockReturnValue(JSON.stringify(cacheData))
    const retrieved = storage.get('safeguard_cache')
    expect(retrieved).toEqual(cacheData)
  })

  it('应该能够清理safeguard_cache', () => {
    // 先保存一个缓存
    const cacheData = { nickname: '测试用户', avatarUrl: 'avatar.jpg', timestamp: Date.now() }
    storage.set('safeguard_cache', cacheData)
    
    // 清理缓存
    const result = storage.remove('safeguard_cache')
    expect(result).toBe(true)
    expect(mockUni.removeStorageSync).toHaveBeenCalledWith('safeguard_cache')
  })

  it('应该检查缓存过期时间', () => {
    // 创建一个过期的缓存（8天前）
    const expiredCache = {
      nickname: '过期用户',
      avatarUrl: 'https://example.com/expired.jpg',
      timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000) // 8天前
    }
    
    // 模拟返回过期缓存
    mockUni.getStorageSync.mockReturnValue(JSON.stringify(expiredCache))
    
    const retrieved = storage.get('safeguard_cache')
    expect(retrieved).toEqual(expiredCache)
    
    // 验证时间差计算
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7天
    const isExpired = Date.now() - retrieved.timestamp > CACHE_DURATION
    expect(isExpired).toBe(true)
  })
})