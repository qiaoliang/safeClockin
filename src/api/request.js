import { storage } from '@/store/modules/storage'
import { useUserStore } from '@/store/modules/user'
import config, { getAPIBaseURL } from '@/config'

// 使用配置文件中的 baseURL
const baseURL = getAPIBaseURL()
// 用于跟踪token刷新状态，防止并发刷新
let isRefreshing = false
let refreshSubscribers = []

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback)
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

function decodeToken(token) {
  try {
    if (typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const padding = '='.repeat((4 - payload.length % 4) % 4)
    const decodedPayload = atob((payload + padding).replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodedPayload)
  } catch (e) {
    console.error('解析token失败:', e)
    return null
  }
}

function isTokenExpired(token) {
  if (!token) return true
  const payload = decodeToken(token)
  if (!payload || !payload.exp) return false
  const currentTime = Date.now() / 1000
  const bufferTime = 5 * 60
  return payload.exp - bufferTime < currentTime
}

async function refreshToken() {
  const userStore = useUserStore()
  const refreshToken = userStore.refreshToken
  if (!refreshToken) {
    return null
  }
  
  try {
    const response = await uni.request({
      url: baseURL + '/api/refresh_token',
      method: 'POST',
      data: {
        refresh_token: refreshToken
      },
      header: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.statusCode === 200 && response.data.code === 1) {
      const newToken = response.data.data.token
      const newRefreshToken = response.data.data.refresh_token
      
      // 通过 userStore 更新 token，自动触发持久化
      userStore.updateTokens(newToken, newRefreshToken)
      
      return newToken
    }
  } catch (error) {
    console.error('刷新token失败:', error)
    return null
  }
  
  return null
}

// 检查token是否为空或无效
function validateToken(token) {
  return token !== undefined && token !== null && token !== '' && 
         (typeof token !== 'string' || token.trim() !== '')
}

// 导出测试需要的函数
export { validateToken, decodeToken, isTokenExpired, refreshToken, NO_TOKEN_REQUIRED_URLS }

// 显示过期确认对话框
function showExpiredTokenDialog() {
  return new Promise((resolve) => {
    uni.showModal({
      title: '提示',
      content: '用户登录已过期，请重新登录',
      showCancel: false,
      confirmText: '确定',
      success: () => {
        resolve()
      }
    })
    
    // 5秒后自动跳转
    setTimeout(() => {
      uni.hideToast()
      uni.hideLoading()
      resolve()
    }, 5000)
  })
}

// 处理token过期
async function handleTokenExpired() {
  const userStore = useUserStore()
  
  // 通过 userStore 处理 token 过期
  userStore.handleTokenExpired()
  
  await showExpiredTokenDialog()
  
  // 重新定向到登录页
  uni.redirectTo({
    url: '/pages/login/login'
  })
}

// Layer 2: 业务逻辑验证 - 兼容性函数
function buildQueryStringCompat(params) {
  if (!params || typeof params !== 'object') {
    return ''
  }
  
  const parts = []
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // 安全编码键和值
      const encodedKey = encodeURIComponent(key)
      const encodedValue = encodeURIComponent(String(value))
      parts.push(`${encodedKey}=${encodedValue}`)
    }
  })
  
  return parts.join('&')
}

// Layer 1: 入口点验证 - 增强URL验证函数
function isValidURL(url) {
  // 基础类型和空值检查
  if (typeof url !== 'string' || !url.trim()) {
    console.error('❌ Layer 1验证失败: URL不是有效字符串或为空')
    return false
  }
  
  // 去除首尾空白
  let trimmedUrl = url.trim()
  
  // 清理微信小程序环境添加的后缀信息
  // 微信小程序会在console.log中自动添加环境信息，如：(env: macOS,mp,1.06.2504060; lib: 3.11.3)
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
        const validPathRegex = /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/
        return validPathRegex.test(pathOnly)
      } else if (trimmedUrl.startsWith('http')) {
        // 简单的HTTP URL格式检查
        const httpUrlRegex = /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/
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
      const validPathRegex = /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/
      const isValidPath = validPathRegex.test(pathOnly)
      console.log('Layer 1兜底路径验证结果:', isValidPath, '路径:', pathOnly)
      return isValidPath
    }
    
    return false
  }
}

// 不需要token验证的API白名单
const NO_TOKEN_REQUIRED_URLS = [
  '/api/auth/login_wechat', // 微信登录
  '/api/send_sms',        // 发送短信验证码（旧接口）
  '/api/sms/send_code',   // 发送短信验证码（新接口）
  '/api/login_phone',     // 手机号登录
  '/api/auth/login_phone', // 手机号登录（新接口）
  '/api/auth/login_phone_code', // 验证码登录
  '/api/auth/login_phone_password', // 密码登录
  '/api/auth/register_phone', // 手机号注册

  '/api/logout'           // 登出（可能token已失效）
]

export const request = (options) => {
  return new Promise((resolve, reject) => {
    (async () => {
      // 获取 token，优先从 storage 获取
      // 完全依赖 userStore 获取 token
      const userStore = useUserStore()
    let token = userStore.token
    
    // === 系统化调试：诊断请求URL ===
    let requestUrl = options.url
    let queryParams = ''
    
    // Layer 3: 环境守卫 - 全面环境检测
    const environmentInfo = {
      urlSearchParamsSupported: typeof URLSearchParams !== 'undefined',
      platform: '', // 将在下面检测
      userAgent: '',
      hasNetwork: true, // 将在下面检测
      storageAvailable: false // 将在下面检测
    }
    
    // 检测平台环境
    try {
      // #ifdef MP-WEIXIN
      environmentInfo.platform = 'mp-weixin'
      // #endif
      
      // #ifdef H5
      environmentInfo.platform = 'h5'
      // #endif
      
      // #ifdef APP-PLUS
      environmentInfo.platform = 'app-plus'
      // #endif
    } catch (e) {
      environmentInfo.platform = 'unknown'
    }
    
    // 检测网络状态
    try {
      environmentInfo.hasNetwork = uni.getNetworkType ? 
        new Promise(resolve => {
          uni.getNetworkType({
            success: (res) => resolve(res.networkType !== 'none'),
            fail: () => resolve(false)
          })
        }) : true
    } catch (e) {
      console.warn('⚠️ Layer 3环境守卫: 无法检测网络状态')
    }
    
    // 检测存储可用性
    try {
      environmentInfo.storageAvailable = typeof uni !== 'undefined' && uni.getStorageSync
    } catch (e) {
      environmentInfo.storageAvailable = false
    }
    
    // 环境守卫日志
    if (!environmentInfo.urlSearchParamsSupported) {
      console.warn('⚠️ Layer 3环境守卫: URLSearchParams不可用，使用兼容方案')
    }
    
    if (environmentInfo.platform === 'unknown') {
      console.warn('⚠️ Layer 3环境守卫: 无法确定运行平台')
    }
    
    if (!environmentInfo.storageAvailable) {
      console.warn('⚠️ Layer 3环境守卫: 存储功能不可用')
    }
    
    console.log('🔍 Layer 3环境守卫: 环境信息', environmentInfo)
    
    // 检查是否为GET请求且有data参数
    const method = options.method || 'GET'
    if (method === 'GET' && options.data && Object.keys(options.data).length > 0) {
      console.log('🔍 系统化调试 - GET请求诊断:')
      console.log('  原始URL:', requestUrl)
      console.log('  data参数:', options.data)
      console.log('  URLSearchParams支持:', environmentInfo.urlSearchParamsSupported ? '是' : '否')
      
      // Layer 4: 调试仪表 - 全面调试和取证记录
      const debugContext = {
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substr(2, 9),
        method: method,
        originalUrl: options.url,
        dataType: typeof options.data,
        dataKeys: Object.keys(options.data),
        dataValues: Object.values(options.data),
        environmentInfo: environmentInfo,
        stackTrace: new Error().stack?.split('\n').slice(1, 5) // 记录调用栈
      }
      
      console.log('🔍 Layer 4调试仪表 - 请求取证上下文:')
      console.table(debugContext)
      
      // 敏感数据脱敏记录
      const sanitizedData = {}
      Object.entries(options.data).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 50) {
          sanitizedData[key] = value.substring(0, 20) + '...'
        } else {
          sanitizedData[key] = value
        }
      })
      console.log('🔍 Layer 4调试仪表 - 脱敏数据:', sanitizedData)
      
      if (environmentInfo.urlSearchParamsSupported) {
        // 使用URLSearchParams
        try {
          const params = new URLSearchParams()
          Object.entries(options.data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value))
            }
          })
          queryParams = params.toString()
          console.log('✅ 使用URLSearchParams生成查询参数')
        } catch (error) {
          console.error('❌ URLSearchParams错误:', error)
          // 降级到兼容方案
          queryParams = buildQueryStringCompat(options.data)
        }
      } else {
        // 使用兼容方案
        queryParams = buildQueryStringCompat(options.data)
        console.log('✅ 使用兼容方案生成查询参数')
      }
      
      if (queryParams) {
        requestUrl = requestUrl.includes('?') 
          ? `${requestUrl}&${queryParams}`
          : `${requestUrl}?${queryParams}`
        console.log('  生成的查询参数:', queryParams)
        console.log('  最终URL:', requestUrl)
        
        // Layer 1: 入口点验证 - 验证URL格式
        if (!isValidURL(requestUrl)) {
          console.error('❌ 入口点验证失败: 生成的URL无效')
          console.error('  原始URL:', options.url)
          console.error('  查询参数:', queryParams)
          console.error('  最终URL:', requestUrl)
          // URL无效，直接拒绝请求
          reject(new Error('生成的URL无效，请检查请求参数'))
          return
        }
      }
    }
    
    const fullUrl = baseURL + requestUrl
    
    if (!(options && options.suppressErrorLog)) {
      console.log('发起请求:', {
        url: fullUrl,
        method: method,
        data: options.data,
        queryParams: queryParams
      })
    }
    
    // 检查是否为不需要token的API
    const isNoTokenRequired = NO_TOKEN_REQUIRED_URLS.some(url => 
      options.url.includes(url)
    )
    
    console.log('🔍 请求URL:', options.url, '是否需要Token:', !isNoTokenRequired, '当前Token:', token ? '存在' : '不存在')
    
    // 只对需要token的请求进行验证
    if (!isNoTokenRequired) {
      // 检查token是否存在且有效
      if (!token || !validateToken(token)) {
        console.warn('⚠️ Token验证失败，触发登出流程')
        handleTokenExpired()
        reject(new Error('Token无效或不存在'))
        return
      }
    } else {
      console.log('✅ 该请求不需要Token验证')
    }
    
    // 检查token是否即将过期，如果是则刷新
    if (token && isTokenExpired(token)) {
      if (!isRefreshing) {
        isRefreshing = true
        
        const newToken = await refreshToken()
        
        isRefreshing = false
        
        if (newToken) {
          token = newToken
          onRefreshed(newToken)
          console.log('Token刷新成功')
        } else {
          // 刷新失败，执行登出逻辑
          handleTokenExpired()
          reject(new Error('Token已过期且刷新失败'))
          return
        }
      } else {
        // 如果正在刷新，将请求加入队列
        return new Promise((queueResolve, queueReject) => {
          addRefreshSubscriber((newToken) => {
            // 验证新 token 的有效性
            let processedToken = newToken
            if (newToken && /[\u0080-\uFFFF]/.test(newToken)) {
              console.warn('新 Token 包含非 ASCII 字符，尝试清理...')
              // 尝试清理 token：移除非 ASCII 字符
              processedToken = newToken.replace(/[^\x00-\x7F]/g, '')
              console.warn('新 Token 已清理，移除了非 ASCII 字符')
            }
            
            // 验证清理后的 token 是否有效
            if (!processedToken || processedToken.length < 10) {
              console.error('新 Token 清理后无效或过短，放弃使用')
              // 不设置 Authorization header
            } else {
              options.header = {
                ...options.header,
                'Authorization': `Bearer ${processedToken}`
              }
            }
            
            uni.request({
              url: fullUrl,
              method: options.method || 'GET',
              data: options.data || {},
              header: {
                'Content-Type': 'application/json',
                ...options.header
              },
              success: (res) => {
                handleResponse(res, fullUrl, resolve, reject, options)
              },
              fail: (error) => {
                if (options && options.nonBlocking) {
                  resolve({ statusCode: 0, error })
                } else {
                  reject(new Error(`网络请求失败: ${JSON.stringify(error)}`))
                }
              }
            })
          })
        })
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.header
    }
    
    if (token) {
      // 确保 token 是有效的 ASCII 字符串
      try {
        console.log('🔍 Token调试 - 原始token:', token ? `长度: ${token.length}, 前20字符: ${token.substring(0, 20)}...` : 'null')
        
        // 验证 token 是否包含非 ASCII 字符
        if (/[\u0080-\uFFFF]/.test(token)) {
          console.warn('Token 包含非 ASCII 字符，尝试清理...')
          // 尝试清理 token：移除非 ASCII 字符
          const originalToken = token
          token = token.replace(/[^\x00-\x7F]/g, '')
          console.warn(`Token 已清理: 原始长度 ${originalToken.length} -> 清理后长度 ${token.length}`)
          console.warn('清理后的token前20字符:', token.substring(0, 20))
        }
        
        // 验证清理后的 token 是否有效
        if (!token || token.length < 10) {
          console.error('Token 清理后无效或过短，放弃使用')
          console.error('清理后的token:', token ? `长度: ${token.length}, 内容: ${token}` : 'null')
          delete headers['Authorization']
        } else {
          headers['Authorization'] = `Bearer ${token}`
          if (!(options && options.suppressErrorLog)) {
            console.log('✅ 请求发送 - Authorization header 设置:', `Bearer ${token.substring(0, 20)}...`)
          }
        }
      } catch (error) {
        console.error('Token 处理失败:', error)
        delete headers['Authorization']
      }
    } else {
      if (!(options && options.suppressErrorLog)) {
        console.log('⚠️ 请求发送 - 未找到本地存储的token')
      }
    }
    
    uni.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data || {},
      header: headers,
      success: (res) => {
        handleResponse(res, fullUrl, resolve, reject, options)
      },
      fail: (error) => {
        if (!(options && options.suppressErrorLog)) console.error('请求失败:', error)
        if (options && options.nonBlocking) {
          resolve({ statusCode: 0, error })
        } else {
          reject(new Error(`网络请求失败: ${JSON.stringify(error)}`))
        }
      }
    })
    })()
  })
}

function handleResponse(res, fullUrl, resolve, reject, options = {}) {
  if (!options.suppressErrorLog) {
    console.log('fullUrl', fullUrl)
    console.log('请求响应:', res)
  }
  
  // 检查响应是否包含HTML（可能后端返回了错误页面）
  if (res.data && typeof res.data === 'string' && res.data.includes('<!DOCTYPE html')) {
    if (options.nonBlocking) {
      resolve({ statusCode: res.statusCode, data: res.data })
      return
    }
    if (!options.suppressErrorLog) console.error('服务器返回了HTML页面而不是JSON数据:', res.data)
    reject(new Error('服务器返回了错误页面，不是预期的JSON格式'))
    return
  }
  
  if (res.statusCode === 200) {
    // 检查业务层面的错误 - 如果code为0表示错误
    if (res.data && res.data.code === 0) {
      // 检查是否是token相关的错误（更精确的匹配）
      if (res.data.msg && 
          (res.data.msg.includes('token无效') || 
           res.data.msg.includes('token已过期') || 
           res.data.msg.includes('登录已过期'))) {
        handleTokenExpired()
        reject(new Error('登录已过期或token无效'))
      } else {
        // 不是token相关的错误，直接返回响应
        resolve(res.data)
      }
    } else {
      resolve(res.data)
    }
  } else if (res.statusCode === 401) {
    handleTokenExpired()
    reject(new Error('登录已过期'))
  } else {
    if (options.nonBlocking) {
      resolve({ statusCode: res.statusCode, data: res.data })
    } else {
      if (!options.suppressErrorLog) console.error('服务器返回错误:', res.statusCode, res.data)
      reject(new Error(`请求失败: ${res.statusCode} - FullURL:${fullUrl} - ${JSON.stringify(res.data)}`))
    }
  }
}


