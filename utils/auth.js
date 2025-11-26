// utils/auth.js
import { useUserStore } from '@/store/modules/user'
import { getHomePageByRole } from './router'

export async function handleLoginSuccess(response) {
  const userStore = useUserStore()
  
  try {
    // 模拟登录API调用
    await mockLoginAPI(response.code, response.userInfo)
    
    if (!userStore.userInfo.role) {
      uni.redirectTo({
        url: '/pages/role-select/role-select'
      })
    } else if (userStore.userInfo.role === 'community' && !userStore.userInfo.isVerified) {
      uni.redirectTo({
        url: '/pages/community-auth/community-auth'
      })
    } else {
      const homePage = getHomePageByRole(userStore.userInfo.role)
      uni.switchTab({
        url: homePage
      })
    }
  } catch (error) {
    console.error('登录成功处理失败:', error)
    uni.showToast({
      title: '登录失败，请重试',
      icon: 'none'
    })
  }
}

// 模拟登录API
async function mockLoginAPI(code, userInfo) {
  const userStore = useUserStore()
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 模拟登录响应
  const mockResponse = {
    token: 'mock_token_' + Date.now(),
    data: {
      ...userInfo,
      userId: 'user_' + Date.now(),
      role: null, // 新用户默认没有角色
      isVerified: false,
      createdAt: new Date().toISOString()
    }
  }
  
  // 设置用户信息
  userStore.setToken(mockResponse.token)
  userStore.setUserInfo(mockResponse.data)
  userStore.isLoggedIn = true
  
  // 保存到本地存储
  uni.setStorageSync('token', mockResponse.token)
  uni.setStorageSync('userInfo', mockResponse.data)
}

export function handleLoginError(error) {
  let message = '登录失败，请重试'
  
  switch (error.type) {
    case 'NETWORK_ERROR':
      message = '网络连接失败，请检查网络设置'
      break
    case 'USER_DENIED':
      message = '需要您的授权才能使用完整功能'
      break
    case 'SERVER_ERROR':
      message = '服务器繁忙，请稍后重试'
      break
    case 'INVALID_CODE':
      message = '登录凭证无效，请重试'
      break
  }
  
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}