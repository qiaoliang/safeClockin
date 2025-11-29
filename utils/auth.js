// utils/auth.js
import { useUserStore } from '@/store/modules/user'
import { getHomePageByRole } from './router'

// 用于跟踪当前登录状态，防止重复提交
let isLoginProcessing = false

export async function handleLoginSuccess(response) {
  // 防止重复登录处理
  if (isLoginProcessing) {
    uni.showToast({
      title: '登录处理中，请稍候...',
      icon: 'none',
      duration: 1500
    })
    return
  }
  
  isLoginProcessing = true
  
  const userStore = useUserStore()
  
  try {
    // 调用用户store的登录方法，仅传递code，用户信息将通过专门的接口更新
    await userStore.login(response.code)
    
    // 如果提供了用户信息，更新到用户资料中
    if (response.userInfo) {
      await userStore.updateUserInfo(response.userInfo)
    }
    
    // 根据用户状态进行页面跳转
    if (!userStore.userInfo?.role) {
      // 新用户需要选择角色
      uni.redirectTo({
        url: '/pages/role-select/role-select'
      })
    } else if (userStore.userInfo.role === 'community' && !userStore.userInfo.isVerified) {
      // 社区工作人员需要身份验证
      uni.redirectTo({
        url: '/pages/community-auth/community-auth'
      })
    } else {
      // 已有角色的用户直接跳转到对应首页
      const homePage = getHomePageByRole(userStore.userInfo.role)
      
      // 检查是否为tabbar页面，如果是则使用switchTab，否则使用redirectTo
      const tabbarPages = [
        '/pages/home-solo/home-solo',
        '/pages/profile/profile'
      ]
      
      if (tabbarPages.includes(homePage)) {
        uni.switchTab({
          url: homePage
        })
      } else {
        uni.redirectTo({
          url: homePage
        })
      }
      
      // 显示登录成功提示
      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })
    }
  } catch (error) {
    console.error('登录成功处理失败:', error)
    
    // 根据错误类型显示不同提示
    let errorMessage = '登录失败，请重试'
    if (error.message?.includes('网络')) {
      errorMessage = '网络连接失败，请检查网络设置'
    } else if (error.message?.includes('服务器') || error.message?.includes('登录API')) {
      errorMessage = '服务器繁忙或网络问题，请稍后重试'
    } else if (error.message?.includes('微信API')) {
      errorMessage = '微信登录服务暂时不可用，请稍后重试'
    } else if (error.message?.includes('code been used')) {
      errorMessage = '登录凭证已失效，请重新登录'
    }
    
    uni.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000
    })
  } finally {
    isLoginProcessing = false
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
  
  // 检查错误是否包含特定的微信API错误信息
  if (error && typeof error === 'object' && error.message) {
    if (error.message.includes('code been used')) {
      message = '登录凭证已使用，请重新登录'
    } else if (error.message.includes('网络')) {
      message = '网络连接失败，请检查网络设置'
    } else if (error.message.includes('服务器') || error.message.includes('登录API')) {
      message = '服务器繁忙，请稍后重试'
    } else if (error.message.includes('微信API')) {
      message = '微信登录服务暂时不可用，请稍后重试'
    } else if (error.message.includes('登录凭证')) {
      message = error.message
    }
  } else {
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
  }
  
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}