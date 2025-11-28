// api/request.js
const baseURL = 'https://flask-7pin-202852-6-1383741966.sh.run.tcloudbase.com' // 真实API地址

export const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const fullUrl = baseURL + options.url
    
    console.log('发起请求:', {
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data
    })
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.header
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    uni.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data || {},
      header: headers,
      success: (res) => {
		console.log('fullUrl',fullUrl)
        console.log('请求响应:', res)
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
      },
      fail: (error) => {
        console.error('请求失败:', error)
        reject(new Error(`网络请求失败: ${JSON.stringify(error)}`))
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