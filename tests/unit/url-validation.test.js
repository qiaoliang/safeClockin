import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// 模拟request.js中的isValidURL函数
function isValidURL(url) {
  // 基础类型和空值检查
  if (typeof url !== 'string' || !url.trim()) {
    console.error('❌ Layer 1验证失败: URL不是有效字符串或为空')
    return false
  }
  
  // 去除首尾空白
  let trimmedUrl = url.trim()
  
  // 清理微信小程序环境添加的后缀信息
  const wechatEnvSuffix = /\(env:.*?; lib:.*?\)$/
  if (wechatEnvSuffix.test(trimmedUrl)) {
    trimmedUrl = trimmedUrl.replace(wechatEnvSuffix, '').trim()
  }
  
  // 长度检查 - 防止过长URL导致内存问题
  if (trimmedUrl.length > 2048) {
    console.error('❌ Layer 1验证失败: URL过长', trimmedUrl.length)
    return false
  }
  
  // 危险字符检查 - 防止注入攻击
  const dangerousChars = /[<>"{}|\\^`[\]]/g
  if (dangerousChars.test(trimmedUrl)) {
    console.error('❌ Layer 1验证失败: URL包含危险字符', trimmedUrl)
    return false
  }
  
  // JavaScript协议检查 - 防止XSS
  if (trimmedUrl.toLowerCase().includes('javascript:')) {
    console.error('❌ Layer 1验证失败: URL包含javascript协议')
    return false
  }
  
  // 路径遍历攻击检查
  if (trimmedUrl.includes('../') || trimmedUrl.includes('..\\')) {
    console.error('❌ Layer 1验证失败: URL包含路径遍历字符')
    return false
  }
  
  // 验证URL结构
  try {
    // 检查URL构造函数是否可用
    if (typeof URL === 'undefined') {
      console.warn('⚠️ URL构造函数不可用，使用替代验证方案')
      // 替代验证方案：基本URL格式检查
      if (trimmedUrl.startsWith('/')) {
        const pathOnly = trimmedUrl.split('?')[0]
        const validPathRegex = /^\/[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]*$/
        return validPathRegex.test(pathOnly)
      } else if (trimmedUrl.startsWith('http')) {
        // 简单的HTTP URL格式检查
        const httpUrlRegex = /^https?:\/\/[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+$/
        return httpUrlRegex.test(trimmedUrl)
      }
      return false
    }
    
    // 对于相对URL，添加基础URL进行验证
    const testUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `http://example.com${trimmedUrl.startsWith('/') ? trimmedUrl : '/' + trimmedUrl}`
    const parsedUrl = new URL(testUrl)
    
    // 验证协议
    if (parsedUrl.protocol && !['http:', 'https:'].includes(parsedUrl.protocol)) {
      console.error('❌ Layer 1验证失败: 不支持的协议', parsedUrl.protocol)
      return false
    }
    
    // 验证主机名（如果是完整URL）
    if (parsedUrl.hostname) {
      // 防止内网IP访问（可选，根据业务需求）
      const internalIPPattern = /^(localhost|127\.0\.0\.1|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|192\.168\.|169\.254\.)/
      if (internalIPPattern.test(parsedUrl.hostname)) {
        console.warn('⚠️ Layer 1警告: URL包含内网地址', parsedUrl.hostname)
      }
    }
    
    return true
  } catch (e) {
    console.error('❌ Layer 1验证失败: URL解析错误', e.message, 'URL:', trimmedUrl)
    
    // 最后的兜底检查：对于相对URL，检查基本格式
    if (trimmedUrl.startsWith('/')) {
      const pathOnly = trimmedUrl.split('?')[0]
      // 更严格的路径验证
      const validPathRegex = /^\/[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]*$/
      const isValidPath = validPathRegex.test(pathOnly)
      console.log('Layer 1兜底路径验证结果:', isValidPath, '路径:', pathOnly)
      return isValidPath
    }
    
    return false
  }
}

describe('URL验证函数测试', () => {
  let originalURL
  
  beforeEach(() => {
    // 保存原始的URL构造函数
    originalURL = global.URL
  })
  
  afterEach(() => {
    // 恢复原始的URL构造函数
    global.URL = originalURL
  })
  
  it('应该验证有效的相对URL', () => {
    expect(isValidURL('/api/community-checkin/rules?community_id=3')).toBe(true)
    expect(isValidURL('/api/user/profile')).toBe(true)
  })
  
  it('应该验证有效的绝对URL', () => {
    expect(isValidURL('https://api.example.com/users')).toBe(true)
    expect(isValidURL('http://localhost:9999/api/test')).toBe(true)
  })
  
  it('应该拒绝包含危险字符的URL', () => {
    expect(isValidURL('/api/test<script>')).toBe(false)
    expect(isValidURL('/api/test"')).toBe(false)
    expect(isValidURL('/api/test<>')).toBe(false)
  })
  
  it('应该拒绝javascript协议', () => {
    expect(isValidURL('javascript:alert(1)')).toBe(false)
    expect(isValidURL('JAVASCRIPT:alert(1)')).toBe(false)
  })
  
  it('应该拒绝路径遍历攻击', () => {
    expect(isValidURL('/api/../test')).toBe(false)
    expect(isValidURL('/api/..\\test')).toBe(false)
  })
  
  it('应该拒绝空值和无效类型', () => {
    expect(isValidURL('')).toBe(false)
    expect(isValidURL('   ')).toBe(false)
    expect(isValidURL(null)).toBe(false)
    expect(isValidURL(undefined)).toBe(false)
    expect(isValidURL(123)).toBe(false)
  })
  
  it('应该在URL构造函数不可用时使用替代方案', () => {
    // 模拟URL构造函数不可用的情况
    global.URL = undefined
    
    // 相对URL应该通过正则表达式验证
    expect(isValidURL('/api/community-checkin/rules?community_id=3')).toBe(true)
    expect(isValidURL('/api/user/profile')).toBe(true)
    
    // 绝对URL应该通过正则表达式验证
    expect(isValidURL('https://api.example.com/users')).toBe(true)
    expect(isValidURL('http://localhost:9999/api/test')).toBe(true)
    
    // 无效URL应该被拒绝
    expect(isValidURL('/api/test<script>')).toBe(false)
    expect(isValidURL('javascript:alert(1)')).toBe(false)
  })
  
  it('应该处理过长的URL', () => {
    const longUrl = '/api/test?' + 'a'.repeat(2050)
    expect(isValidURL(longUrl)).toBe(false)
  })
  
  it('应该清理微信小程序环境后缀', () => {
    const urlWithSuffix = '/api/test (env: macOS,mp,1.06.2504060; lib: 3.11.3)'
    expect(isValidURL(urlWithSuffix)).toBe(true)
  })
})