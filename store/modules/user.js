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
    isLoading: false
  }),
  
  getters: {
    isSoloUser: (state) => state.role === 'solo',
    isSupervisor: (state) => state.role === 'supervisor',
    isCommunityWorker: (state) => state.role === 'community'
  },
  
  actions: {
    async login(code) {
      this.isLoading = true
      try {
        // 使用真实API调用
        const apiResponse = await authApi.login(code)
        console.log('登录API响应:', apiResponse)
        
        // 适配真实API响应格式
        const response = {
          token: apiResponse.token || 'default_token_' + Date.now(),
          data: {
            userId: apiResponse.userId || 'user_' + Date.now(),
            role: apiResponse.role || null, // 新用户默认没有角色
            isVerified: apiResponse.isVerified || false,
            createdAt: new Date().toISOString()
          }
        }
        
        this.setToken(response.token)
        this.setUserInfo(response.data)
        this.isLoggedIn = true
        
        storage.set('token', response.token)
        storage.set('userInfo', response.data)
        
        return response
      } catch (error) {
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async updateUserInfo(userData) {
      this.isLoading = true
      try {
        const response = await authApi.updateUserProfile(userData)
        console.log('更新用户信息响应:', response)
        
        // 更新本地存储的用户信息
        if (this.userInfo) {
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
        
        this.setUserInfo(response)
        storage.set('userInfo', response)
        
        return response
      } catch (error) {
        console.error('获取用户信息失败:', error)
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
      storage.remove('userInfo')
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
      const userInfo = storage.get('userInfo')
      
      if (token && userInfo) {
        this.token = token
        this.userInfo = userInfo
        this.role = userInfo.role
        this.isLoggedIn = true
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