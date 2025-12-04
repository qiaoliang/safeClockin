// store/modules/user.js
import { defineStore } from 'pinia'
import { storage } from './storage'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: null,
    isLoggedIn: false,
    role: null,
    isLoading: false,
    currentProcessingCode: null  // 用于存储当前正在处理的code，防止重复使用
  }),
  
  getters: {
    isSoloUser: (state) => state.role === 'solo',
    isSupervisor: (state) => state.role === 'supervisor',
    isCommunityWorker: (state) => state.role === 'community'
  },
  
  actions: {
    
    async login(loginData) {
      this.isLoading = true
      // 定义code变量在更广的作用域，确保finally块中可以访问
      let code = null
      try {
        // 检查是否正在处理相同的code，防止重复请求
        code = typeof loginData === 'string' ? loginData : loginData.code;
        if (this.currentProcessingCode === code) {
          throw new Error('登录凭证正在处理中，请勿重复提交')
        }
        
        this.currentProcessingCode = code
        
        // 使用真实API调用
        const apiResponse = await authApi.login(loginData)
        console.log('登录API响应:', apiResponse)
        
        // 检查API响应是否成功
        if (apiResponse.code !== 1) {
          console.error('登录API返回错误:', apiResponse)
          throw new Error(`登录失败: ${apiResponse.msg || '未知错误'}`)
        }
        
        // 适配真实API响应格式 - 从data中获取token和其他信息
        const tokenData = {
          token: apiResponse.data?.token,
          refresh_token: apiResponse.data?.refresh_token,
          userId: apiResponse.data?.user_id,
          role: apiResponse.data?.role || null, // 从后端直接获取角色
          isVerified: apiResponse.data?.is_verified || false,
          createdAt: new Date().toISOString(),
          is_new_user: apiResponse.data?.is_new_user || false
        }
        
        // 验证必需的字段是否存在
        if (!tokenData.token) {
          throw new Error('登录响应中缺少token')
        }
        
        this.setToken(tokenData.token)
        this.isLoggedIn = true
        
        storage.set('token', tokenData.token)
        // 如果响应中包含refresh token，也保存它
        if (tokenData.refresh_token) {
          storage.set('refreshToken', tokenData.refresh_token)
        }
        
        // 登录成功后立即获取完整的用户信息，确保昵称等信息是最新的
        await this.fetchUserInfo()
        
        return tokenData
      } catch (error) {
        console.error('登录过程发生错误:', error)
        throw error
      } finally {
        // 清除当前处理的code
        if (code && this.currentProcessingCode === code) {
          this.currentProcessingCode = null
        }
        this.isLoading = false
      }
    },
    
    async updateUserInfo(userData) {
      this.isLoading = true
      try {
        const response = await authApi.updateUserProfile(userData)
        console.log('更新用户信息响应:', response)
        
        // 检查API响应是否成功
        if (response.code !== 1) {
          console.error('更新用户信息API返回错误:', response)
          throw new Error(`更新用户信息失败: ${response.msg || '未知错误'}`)
        }
        
        // 更新本地存储的用户信息 - 现在使用更新后的用户信息
        if (this.userInfo) {
          // 对于更新用户信息，我们可能需要重新获取用户信息
          // 或者直接更新传入的字段
          Object.assign(this.userInfo, userData)
          storage.set('userInfo', this.userInfo)
        }
        
        return response
      } catch (error) {
        console.error('更新用户信息失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async fetchUserInfo() {
      this.isLoading = true
      try {
        const response = await authApi.getUserProfile()
        console.log('获取用户信息响应:', response)
        
        // 检查API响应是否成功
        if (response.code !== 1) {
          console.error('获取用户信息API返回错误:', response)
          throw new Error(`获取用户信息失败: ${response.msg || '未知错误'}`)
        }
        
        this.setUserInfo(response.data)
        storage.set('userInfo', response.data)
        
        return response.data
      } catch (error) {
        console.error('获取用户信息失败:', error)
        
        // 如果获取用户信息失败，但是token仍然有效，我们可以尝试从本地存储中获取用户信息
        // 或者至少保持当前的用户状态而不完全失败
        const localUserInfo = storage.get('userInfo')
        if (localUserInfo) {
          this.setUserInfo(localUserInfo)
          console.log('从本地存储恢复用户信息')
        }
        
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    logout() {
      authApi.logout().catch(() => {})
      this.userInfo = null
      this.token = null
      this.isLoggedIn = false
      this.role = null
      
      storage.remove('token')
      storage.remove('refreshToken')
      const cached = storage.get('userInfo')
      if (cached && (cached.wechatOpenid || cached.wechat_openid)) {
        storage.set('userInfo', cached)
      }
    },
    
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      this.role = userInfo.role
    },
    
    setToken(token) {
      this.token = token
    },
    
    initUserState() {
      const token = storage.get('token')
      const refreshToken = storage.get('refreshToken')
      const userInfo = storage.get('userInfo')
      
      if (token && userInfo) {
        this.token = token
        this.userInfo = userInfo
        this.role = userInfo.role
        this.isLoggedIn = true
      }
      if (!token && userInfo) {
        this.userInfo = userInfo
        this.role = userInfo.role
        this.isLoggedIn = false
      }
    },
    
    async updateUserRole(role) {
      // 更新角色
      this.role = role
      if (this.userInfo) {
        this.userInfo.role = role
        await this.updateUserInfo({ role })
        storage.set('userInfo', this.userInfo)
      }
    }
  }
})
