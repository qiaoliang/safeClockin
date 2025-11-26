// store/api/request.js
const baseURL = 'https://your-api-domain.com/api'

export const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.header
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    uni.request({
      url: baseURL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: headers,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          handleTokenExpired()
          reject(new Error('登录已过期'))
        } else {
          reject(new Error(res.data?.message || '请求失败'))
        }
      },
      fail: (error) => {
        reject(new Error('网络请求失败'))
      }
    })
  })
}

function handleTokenExpired() {
  uni.removeStorageSync('token')
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