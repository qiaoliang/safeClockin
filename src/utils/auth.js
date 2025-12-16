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
    
    // 如果有用户信息，先保存到 store
    if (response.userInfo) {
      // 临时保存用户信息到 store 的缓存中，供登录时使用
      userStore.updateCache({
        tempUserInfo: {
          nickname: response.userInfo.nickName,
          avatarUrl: response.userInfo.avatarUrl
        }
      })
    }
    
    // 构建登录请求数据
    let loginData
    let hasUserInfo = false
    
    if (typeof response === 'string') {
      // 只传入了code（非首次登录）
      // 检查是否有本地缓存的微信用户信息
      const wechatCache = userStore.getWechatUserCache()
      if (wechatCache && wechatCache.nickname && wechatCache.avatarUrl) {
        // 使用缓存的用户信息进行登录
        loginData = {
          code: response,
          nickname: wechatCache.nickname,
          avatar_url: wechatCache.avatarUrl
        }
        hasUserInfo = true
        console.log('✅ 使用本地缓存的微信用户信息登录')
      } else {
        // 没有缓存，需要获取用户信息
        console.warn('⚠️ 缺少微信用户信息缓存，需要重新获取')
        throw new Error('NEED_USER_INFO')
      }
    } else {
      // 获取 code
      const code = response.code
      
      // 检查 store 中是否有缓存用户信息
      const cachedUserInfo = userStore.userState?.cache?.tempUserInfo
      if (cachedUserInfo && cachedUserInfo.nickname && cachedUserInfo.avatarUrl) {
        // 首次登录，包含code和用户信息
        loginData = {
          code: code,
          nickname: cachedUserInfo.nickname,
          avatar_url: cachedUserInfo.avatarUrl
        }
        hasUserInfo = true
      } else {
        // 尝试使用本地缓存的微信用户信息
        const wechatCache = userStore.getWechatUserCache()
        if (wechatCache && wechatCache.nickname && wechatCache.avatarUrl) {
          loginData = {
            code: code,
            nickname: wechatCache.nickname,
            avatar_url: wechatCache.avatarUrl
          }
          hasUserInfo = true
          console.log('✅ 使用本地缓存的微信用户信息登录')
        } else {
          // 没有任何缓存信息，需要获取用户信息
          console.warn('⚠️ 缺少微信用户信息，需要重新获取')
          throw new Error('NEED_USER_INFO')
        }
      }
    }
    
    // 验证必需参数
    if (!hasUserInfo || !loginData.nickname || !loginData.avatar_url) {
      console.error('❌ 登录数据缺少必需参数:', loginData)
      throw new Error('NEED_USER_INFO')
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
    
    if (!userInfo?.role) {
      // 新用户需要选择角色
      uni.redirectTo({
        url: '/pages/role-select/role-select'
      })
    } else if (userInfo.role === 'community' && !userInfo.isVerified) {
      // 社区工作人员需要身份验证
      uni.redirectTo({
        url: '/pages/community-auth/community-auth'
      })
    } else {
      // 已有角色的用户直接跳转到对应首页
      const homePage = getHomePageByRole(userInfo.role)
      
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
    
    // 检查是否是缺少用户信息的错误
    if (error.message?.includes('缺少nickname参数') || 
        error.message?.includes('缺少avatar_url参数') ||
        error.message?.includes('缺少用户昵称信息') ||
        error.message?.includes('缺少用户头像信息') ||
        error.message?.includes('重新进行微信授权')) {
      console.log('检测到缺少用户信息错误，需要重新获取用户信息')
      
      // 尝试从当前页面获取用户信息
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      
      // 如果当前页面是登录页面且有 showUserInfoForm 方法
      if (currentPage && typeof currentPage.showUserInfoForm === 'function') {
        // 重新获取微信登录凭证
        try {
          const loginRes = await uni.login()
          if (loginRes.code) {
            currentPage.loginCode = loginRes.code
            currentPage.showUserInfoForm.value = true
            return // 不显示错误提示，直接显示用户信息表单
          }
        } catch (loginError) {
          console.error('重新获取登录凭证失败:', loginError)
        }
      }
      
      // 如果无法自动处理，显示友好提示
      uni.showModal({
        title: '需要用户信息',
        content: '登录需要您的微信昵称和头像信息，请重新授权',
        showCancel: false,
        confirmText: '确定'
      })
      return
    }
    
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
  try { uni.setStorageSync('token', mockResponse.token) } catch(e) {}
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
