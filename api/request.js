// api/request.js
//const baseURL = 'https://flask-7pin-202852-6-1383741966.sh.run.tcloudbase.com' // 真实API地址
const baseURL ='http://localhost:9090'
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
    const payload = token.split('.')[1]
    // 补齐base64 padding
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
  if (!payload || !payload.exp) return true
  // 检查是否已过期（提前5分钟刷新，以防时间不同步）
  const currentTime = Date.now() / 1000
  const bufferTime = 5 * 60 // 5分钟缓冲时间
  return payload.exp - bufferTime < currentTime
}

async function refreshToken() {
  const refreshToken = uni.getStorageSync('refreshToken')
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
      
      // 更新本地存储
      uni.setStorageSync('token', newToken)
      uni.setStorageSync('refreshToken', newRefreshToken)
      
      return newToken
    }
  } catch (error) {
    console.error('刷新token失败:', error)
    return null
  }
  
  return null
}

export const request = (options) => {
  return new Promise(async (resolve, reject) => {
    let token = uni.getStorageSync('token')
    const fullUrl = baseURL + options.url
    
    console.log('发起请求:', {
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data
    })
    
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
                handleResponse(res, fullUrl, resolve, reject)
              },
              fail: (error) => {
                reject(new Error(`网络请求失败: ${JSON.stringify(error)}`))
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
      console.log('请求发送 - Authorization header 设置:', `Bearer ${token.substring(0, 20)}...`) // 只打印token前20个字符用于调试
    } else {
      console.log('请求发送 - 未找到本地存储的token')
    }
    
    uni.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data || {},
      header: headers,
      success: (res) => {
        handleResponse(res, fullUrl, resolve, reject)
      },
      fail: (error) => {
        console.error('请求失败:', error)
        reject(new Error(`网络请求失败: ${JSON.stringify(error)}`))
      }
    })
  })
}

function handleResponse(res, fullUrl, resolve, reject) {
  console.log('fullUrl', fullUrl)
  console.log('请求响应:', res)
  
  // 检查响应是否包含HTML（可能后端返回了错误页面）
  if (res.data && typeof res.data === 'string' && res.data.includes('<!DOCTYPE html')) {
    console.error('服务器返回了HTML页面而不是JSON数据:', res.data)
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
    console.error('服务器返回错误:', res.statusCode, res.data)
    reject(new Error(`请求失败: ${res.statusCode} - FullURL:${fullUrl} - ${JSON.stringify(res.data)}`))
  }
}

function handleTokenExpired() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('refreshToken')
  uni.removeStorageSync('userInfo')
  uni.redirectTo({
    url: '/pages/login/login'
  })
  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 2000
  })
}