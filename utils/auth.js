// utils/auth.js
import { useUserStore } from '@/store/modules/user'
import { getHomePageByRole } from './router'

export async function handleLoginSuccess(response) {
  const userStore = useUserStore()
  
  try {
    await userStore.login(response.code, response.userInfo)
    
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