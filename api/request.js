import { storage } from '@/store/modules/storage'
// api/request.js
//const baseURL = 'https://flask-7pin-202852-6-1383741966.sh.run.tcloudbase.com' // 真实API地址
const baseURL ='http://localhost:9999'
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
  const refreshToken = storage.get('refreshToken') || uni.getStorageSync('refreshToken')
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
      
      storage.set('token', newToken)
      storage.set('refreshToken', newRefreshToken)
      
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
  // 保存用户基本信息，不清除微信绑定状态
  const userInfo = storage.get('userInfo') || uni.getStorageSync('userInfo')
  
  // 只清除认证相关信息，保留用户基本信息
  uni.removeStorageSync('token')
  uni.removeStorageSync('refreshToken')
  
  // 标记为重新登录场景
  storage.set('login_scenario', 'relogin')
  uni.setStorageSync('login_scenario', 'relogin')
  
  await showExpiredTokenDialog()
  
  // 重新定向到登录页，但保留用户信息以便识别
  uni.redirectTo({
    url: '/pages/login/login'
  })
}

// 不需要token验证的API白名单
const NO_TOKEN_REQUIRED_URLS = [
  '/api/login',           // 微信登录
  '/api/send_sms',        // 发送短信验证码
  '/api/login_phone',     // 手机号登录
  '/api/user/profile'     // 获取用户信息（首次登录时需要）
]

export const request = (options) => {
  return new Promise(async (resolve, reject) => {
    let token = storage.get('token') || uni.getStorageSync('token')
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
    
    // 只对需要token的请求进行验证
    if (!isNoTokenRequired) {
      // 检查token是否存在且有效
      if (!token || !validateToken(token)) {
        handleTokenExpired()
        reject(new Error('Token无效或不存在'))
        return
      }
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
            options.header = {
              ...options.header,
              'Authorization': `Bearer ${newToken}`
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
      headers['Authorization'] = `Bearer ${token}`
      if (!(options && options.suppressErrorLog)) {
        console.log('请求发送 - Authorization header 设置:', `Bearer ${token.substring(0, 20)}...`)
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


