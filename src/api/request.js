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
  return new Promise(async (resolve, reject) => {
    // 获取 token，优先从 storage 获取
    // 完全依赖 userStore 获取 token
    const userStore = useUserStore()
    let token = userStore.token
    const fullUrl = baseURL + options.url
    
    if (!(options && options.suppressErrorLog)) {
      console.log('发起请求:', {
        url: fullUrl,
        method: options.method || 'GET',
        data: options.data
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
        // 验证 token 是否包含非 ASCII 字符
        if (/[\u0080-\uFFFF]/.test(token)) {
          console.warn('Token 包含非 ASCII 字符，尝试清理...')
          // 尝试清理 token：移除非 ASCII 字符
          token = token.replace(/[^\x00-\x7F]/g, '')
          console.warn('Token 已清理，移除了非 ASCII 字符')
        }
        
        // 验证清理后的 token 是否有效
        if (!token || token.length < 10) {
          console.error('Token 清理后无效或过短，放弃使用')
          delete headers['Authorization']
        } else {
          headers['Authorization'] = `Bearer ${token}`
          if (!(options && options.suppressErrorLog)) {
            console.log('请求发送 - Authorization header 设置:', `Bearer ${token.substring(0, 20)}...`)
          }
        }
      } catch (error) {
        console.error('Token 处理失败:', error)
        delete headers['Authorization']
      }
    } else {
      if (!(options && options.suppressErrorLog)) {
        console.log('请求发送 - 未找到本地存储的token')
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


