// utils/auth.js
import { useUserStore } from '@/store/modules/user'
import { storage } from '@/store/modules/storage'
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
    // 确保response存在且包含code字段
    if (!response || (typeof response !== 'string' && !response.code)) {
      throw new Error('登录凭证无效或缺失')
    }
    
    // 如果有用户信息，先保存到 store 的缓存中，供登录时使用
    if (response.userInfo) {
      // 临时保存用户信息到 store 的缓存中，供登录时使用
      userStore.updateCache({
        tempUserInfo: {
          nickname: response.userInfo.nickName,
          avatarUrl: response.userInfo.avatarUrl
        }
      })
    }
    
    // 简化逻辑：只检查本地缓存完整性
    const code = typeof response === 'string' ? response : response.code
    let loginData
    let hasUserInfo = false
    
    // Defense-in-depth: 检查用户信息缓存但不强制要求
    const wechatCache = userStore.getWechatUserCache()
    const tempUserInfo = userStore.userState?.cache?.tempUserInfo
    
    // 优先使用临时缓存（当前会话获取的用户信息）
    if (tempUserInfo && tempUserInfo.nickname && tempUserInfo.avatarUrl) {
      loginData = {
        code: code,
        nickname: tempUserInfo.nickname,
        avatar_url: tempUserInfo.avatarUrl
      }
      hasUserInfo = true
      console.log('✅ 使用临时缓存的用户信息登录')
    } 
    // 其次使用持久化缓存
    else if (wechatCache && wechatCache.nickname && wechatCache.avatarUrl) {
      loginData = {
        code: code,
        nickname: wechatCache.nickname,
        avatar_url: wechatCache.avatarUrl
      }
      hasUserInfo = true
      console.log('✅ 使用持久化缓存的用户信息登录')
    } 
    // 没有缓存信息 - Defense-in-depth: 允许仅用code登录
    else {
      console.warn('⚠️ 缺少用户信息缓存，使用仅code登录（后端将提供默认值）')
      loginData = { code: code }
      hasUserInfo = false
    }
    
    // Defense-in-depth: 验证参数但不强制失败
    if (loginData.nickname && loginData.avatar_url) {
      console.log('✅ 完整用户信息可用')
    } else {
      console.log('ℹ️ 使用简化登录模式，后端将处理缺失的用户信息')
    }
    
    await userStore.login(loginData)
    
    // 用户信息应该已经在login方法中获取了，这里可以跳过或进行刷新
    // 但为了确保获取最新的信息，我们仍然调用一次fetchUserInfo
    try {
      await userStore.fetchUserInfo()
      
      // 登录成功后，更新微信用户缓存
      const userInfo = userStore.userInfo
      if (userInfo && userInfo.nickname && userInfo.avatarUrl) {
        userStore.updateWechatUserCache(userInfo.nickname, userInfo.avatarUrl)
      }
    } catch (fetchError) {
      console.error('获取用户信息失败，但登录成功:', fetchError)
      // 如果获取用户信息失败，但登录成功，继续执行后续逻辑
      // 这样可以避免因获取用户信息失败导致整个登录流程失败
    }
    
    // 根据用户状态进行页面跳转
    const userInfo = userStore.userInfo

    // 直接跳转到首页
    const homePage = getHomePageByRole(userInfo?.role)

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
  } catch (error) {
    console.error('登录成功处理失败:', error)
    
    // Defense-in-depth: 简化错误处理，移除对用户信息缺失的特殊处理
    // 因为后端现在支持仅code登录并提供默认用户信息
    console.log('登录错误详情:', {
      message: error.message,
      type: error.type,
      stack: error.stack
    })
    
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
    } else if (error.message?.includes('JSON')) {
      errorMessage = '服务器响应格式错误，请稍后重试'
    } else if (error.message === 'NEED_USER_INFO') {
      errorMessage = '需要获取用户信息'
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
  // 保持与storage模块兼容：字符串则使用storage.set
  try { uni.setStorageSync('token', mockResponse.token) } catch(e) {
    // Ignore storage errors
  }
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
