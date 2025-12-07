// store/modules/user.js
import { defineStore } from 'pinia'
import { storage } from './storage'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    // 核心用户状态 - 统一管理所有用户相关数据
    userState: {
      // 认证信息
      auth: {
        token: null,
        refreshToken: null,
        secureSeed: null,
        loginTime: null,
        expiresAt: null
      },
      // 用户基本信息
      profile: {
        userId: null,
        nickname: null,
        avatarUrl: null,
        role: null,
        phone: null,
        wechatOpenid: null,
        isVerified: false
      },
      // 缓存数据
      cache: {
        checkinData: null,
        lastUpdate: null,
        cachedUserInfo: null
      }
    },
    
    // 运行时状态
    isLoggedIn: false,
    isLoading: false,
    currentProcessingCode: null
  }),
  
  getters: {
    // 便捷访问器
    token: (state) => state.userState.auth.token,
    refreshToken: (state) => state.userState.auth.refreshToken,
    userInfo: (state) => state.userState.profile,
    role: (state) => state.userState.profile.role,
    
    // 角色判断
    isSoloUser: (state) => state.userState.profile.role === 'solo',
    isSupervisor: (state) => state.userState.profile.role === 'supervisor',
    isCommunityWorker: (state) => state.userState.profile.role === 'community',
    
    // 认证状态
    isTokenValid: (state) => {
      const { token, expiresAt } = state.userState.auth
      if (!token) return false
      if (!expiresAt) return true // 没有过期时间则认为有效
      return new Date() < new Date(expiresAt)
    },
    
    // 缓存状态
    isCacheExpired: (state) => {
      const { lastUpdate } = state.userState.cache
      if (!lastUpdate) return true
      const CACHE_DURATION = 30 * 60 * 1000 // 30分钟
      return Date.now() - lastUpdate > CACHE_DURATION
    }
  },
  
  actions: {
    // 持久化用户状态到 storage
    _persistUserState() {
      const userState = JSON.stringify(this.userState)
      storage.set('userState', userState)
    },
    
    // 确保 userState 结构完整
    _ensureUserStateIntegrity() {
      if (!this.userState || typeof this.userState !== 'object') {
        this.userState = {
          auth: {
            token: null,
            refreshToken: null,
            secureSeed: null,
            loginTime: null,
            expiresAt: null
          },
          profile: {
            userId: null,
            nickname: null,
            avatarUrl: null,
            role: null,
            phone: null,
            wechatOpenid: null,
            isVerified: false
          },
          cache: {
            checkinData: null,
            lastUpdate: null,
            cachedUserInfo: null
          }
        }
      }
      
      // 确保子结构完整
      if (!this.userState.auth) {
        this.userState.auth = {
          token: null,
          refreshToken: null,
          secureSeed: null,
          loginTime: null,
          expiresAt: null
        }
      }
      
      if (!this.userState.profile) {
        this.userState.profile = {
          userId: null,
          nickname: null,
          avatarUrl: null,
          role: null,
          phone: null,
          wechatOpenid: null,
          isVerified: false
        }
      }
      
      if (!this.userState.cache) {
        this.userState.cache = {
          checkinData: null,
          lastUpdate: null,
          cachedUserInfo: null
        }
      }
    },

    // 从 storage 恢复用户状态
    _restoreUserState() {
      try {
        // 确保 userState 结构完整
        this._ensureUserStateIntegrity()
        
        // 优先尝试从新的 userState 恢复
        const savedState = storage.get('userState')
        console.log('🔍 诊断: savedState =', savedState)
        console.log('🔍 诊断: savedState 类型 =', typeof savedState)
        
        if (savedState) {
          console.log('🔍 诊断: savedState.auth =', savedState.auth)
          console.log('🔍 诊断: savedState.auth 类型 =', typeof savedState.auth)
          if (savedState.auth) {
            console.log('🔍 诊断: savedState.auth.token =', savedState.auth.token)
          }
          
          // 更宽松的验证逻辑 - 只要是对象就尝试恢复
          if (savedState && typeof savedState === 'object') {
            // 确保基本结构存在，如果缺失则补充
            const restoredState = {
              auth: savedState.auth || {
                token: null,
                refreshToken: null,
                secureSeed: null,
                loginTime: null,
                expiresAt: null
              },
              profile: savedState.profile || {
                userId: null,
                nickname: null,
                avatarUrl: null,
                role: null,
                phone: null,
                wechatOpenid: null,
                isVerified: false
              },
              cache: savedState.cache || {
                checkinData: null,
                lastUpdate: null,
                cachedUserInfo: null
              }
            }
            
            this.userState = restoredState
            this.isLoggedIn = !!this.userState.auth.token
            console.log('✅ 从 userState 恢复用户状态')
            return true
          } else {
            console.warn('⚠️ userState 数据格式异常，清理并重置')
            // 删除损坏的数据，但先备份关键信息
            const wechatOpenid = savedState?.profile?.wechatOpenid
            storage.remove('userState')
            
            // 重新初始化状态，保留微信OpenID
            this._ensureUserStateIntegrity()
            if (wechatOpenid) {
              this.userState.profile.wechatOpenid = wechatOpenid
            }
          }
        }
        
        console.log('📱 无有效用户状态，保持未登录')
        return false
      } catch (error) {
        console.error('恢复用户状态失败:', error)
        // 确保即使出错也有完整的 userState 结构
        this._ensureUserStateIntegrity()
        return false
      }
    },
    
    // 清理所有用户相关的 storage
    _clearUserStorage() {
      // 清理新的统一存储
      storage.remove('userState')
      
      // 清理旧的分散存储
      storage.remove('token')
      storage.remove('refreshToken')
      storage.remove('userInfo')
      storage.remove('cached_user_info')
      storage.remove('secure_seed')
      storage.remove('checkinCache')
    },
    
    async login(loginData) {
      this.isLoading = true
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
        
        // 更新用户状态
        const now = new Date()
        this.userState.auth = {
          token: apiResponse.data?.token,
          refreshToken: apiResponse.data?.refreshToken || apiResponse.data?.refresh_token,
          secureSeed: this.userState.auth.secureSeed,
          loginTime: now.toISOString(),
          expiresAt: apiResponse.data?.expires_at || null
        }
        
        this.userState.profile = {
          userId: apiResponse.data?.userId || apiResponse.data?.user_id,
          nickname: apiResponse.data?.nickname || apiResponse.data?.nickName,
          avatarUrl: apiResponse.data?.avatarUrl || apiResponse.data?.avatar_url,
          role: apiResponse.data?.role || null,
          phone: apiResponse.data?.phoneNumber || apiResponse.data?.phone_number,
          wechatOpenid: apiResponse.data?.wechatOpenid || apiResponse.data?.wechat_openid,
          isVerified: apiResponse.data?.is_verified || false
        }
        
        this.isLoggedIn = true
        
        // 持久化状态
        this._persistUserState()
        
        // 登录成功后立即获取完整的用户信息
        await this.fetchUserInfo()
        
        return apiResponse.data
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
        
        // 更新用户状态
        Object.assign(this.userState.profile, userData)
        
        // 持久化状态
        this._persistUserState()
        
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
        
        // 更新用户状态
        this.userState.profile = {
          ...this.userState.profile,
          ...response.data
        }
        this.userState.cache.lastUpdate = Date.now()
        
        // 持久化状态
        this._persistUserState()
        
        return response.data
      } catch (error) {
        console.error('获取用户信息失败:', error)
        
        // 如果获取用户信息失败，但token仍然有效，保持当前状态
        if (this.isTokenValid) {
          console.log('Token有效，保持当前用户状态')
        }
        
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    logout() {
      // 调用登出API
      authApi.logout().catch(() => {})
      
      // 保留必要信息用于快速重新登录
      const wechatOpenid = this.userState.profile.wechatOpenid
      
      // 重置用户状态
      this.userState = {
        auth: {
          token: null,
          refreshToken: null,
          secureSeed: this.userState.auth.secureSeed, // 保留安全种子
          loginTime: null,
          expiresAt: null
        },
        profile: {
          userId: null,
          nickname: null,
          avatarUrl: null,
          role: null,
          phone: null,
          wechatOpenid, // 保留微信OpenID用于快速登录
          isVerified: false
        },
        cache: {
          checkinData: null,
          lastUpdate: null,
          cachedUserInfo: null
        }
      }
      
      this.isLoggedIn = false
      
      // 清理存储
      this._clearUserStorage()
      
      // 保留必要信息在 userState 中
      if (wechatOpenid) {
        this.userState.profile.wechatOpenid = wechatOpenid
      }
    },
    
    // 初始化用户状态
    initUserState() {
      console.log('=== 开始初始化用户状态 ===')
      
      // 确保 userState 结构完整
      this._ensureUserStateIntegrity()
      
      // 尝试从存储恢复状态
      const restored = this._restoreUserState()
      
      if (restored) {
        console.log('✅ 用户状态恢复成功')
        console.log('用户昵称:', this.userState.profile.nickname)
        console.log('用户角色:', this.userState.profile.role)
        console.log('Token有效:', this.isTokenValid)
        
        // 如果Token无效，清理状态
        if (!this.isTokenValid) {
          console.log('⚠️ Token已过期，清理用户状态')
          this.logout()
        }
      } else {
        console.log('📱 用户未登录，状态已清空')
      }
      
      console.log('=== 用户状态初始化完成 ===')
    },
    
    // 更新用户角色
    async updateUserRole(role) {
      this.userState.profile.role = role
      await this.updateUserInfo({ role })
    },
    
    // 缓存管理
    updateCache(cacheData) {
      // 确保 userState 和 cache 存在
      if (!this.userState) {
        this.userState = { cache: {} }
      }
      if (!this.userState.cache) {
        this.userState.cache = {}
      }
      
      this.userState.cache = {
        ...this.userState.cache,
        ...cacheData,
        lastUpdate: Date.now()
      }
      this._persistUserState()
    },
    
    clearCache() {
      // 确保 userState 存在
      if (!this.userState) {
        this.userState = {}
      }
      
      this.userState.cache = {
        checkinData: null,
        lastUpdate: null,
        cachedUserInfo: null
      }
      this._persistUserState()
    },
    
    // 检查并刷新 Token
    async refreshTokenIfNeeded() {
      if (!this.userState.auth.refreshToken) {
        throw new Error('无刷新Token')
      }
      
      if (this.isTokenValid) {
        return this.userState.auth.token
      }
      
      try {
        const response = await authApi.refreshToken(this.userState.auth.refreshToken)
        if (response.code === 1) {
          this.userState.auth.token = response.data.token
          this.userState.auth.expiresAt = response.data.expires_at
          this._persistUserState()
          return response.data.token
        }
        throw new Error('刷新Token失败')
      } catch (error) {
        console.error('刷新Token失败:', error)
        this.logout()
        throw error
      }
    },

    // 更新 token 和 refreshToken（用于 token 刷新）
    updateTokens(newToken, newRefreshToken) {
      this.userState.auth.token = newToken
      this.userState.auth.refreshToken = newRefreshToken
      this._persistUserState()
    },

    // 处理 token 过期
    handleTokenExpired() {
      // 标记为重新登录场景
      storage.set('login_scene', 'relogin')
      uni.setStorageSync('login_scene', 'relogin')
      
      // 清除认证信息，但保留用户基本信息
      this.userState.auth.token = null
      this.userState.auth.refreshToken = null
      this.userState.auth.expiresAt = null
      this.isLoggedIn = false
      
      this._persistUserState()
    },

    // 强制清理用户状态（用于调试和异常恢复）
    forceClearUserState() {
      console.log('🧹 强制清理用户状态')
      this.userState = {
        auth: {
          token: null,
          refreshToken: null,
          secureSeed: null,
          loginTime: null,
          expiresAt: null
        },
        profile: {
          userId: null,
          nickname: null,
          avatarUrl: null,
          role: null,
          phone: null,
          wechatOpenid: null,
          isVerified: false
        },
        cache: {
          checkinData: null,
          lastUpdate: null,
          cachedUserInfo: null
        }
      }
      this.isLoggedIn = false
      this.isLoading = false
      this.currentProcessingCode = null
      
      // 清理存储
      storage.clear()
      uni.clearStorageSync()
      
      console.log('✅ 用户状态已强制清理')
    },

    // 诊断用户状态（用于调试）
    diagnoseUserState() {
      console.log('🔍 用户状态诊断开始')
      
      // 检查 userState 结构
      console.log('诊断: userState 类型 =', typeof this.userState)
      if (this.userState) {
        console.log('诊断: userState.auth =', this.userState.auth)
        console.log('诊断: userState.auth.token =', this.userState.auth.token)
        console.log('诊断: userState.profile =', this.userState.profile)
      }
      
      // 检查存储状态
      const storedUserState = storage.get('userState')
      console.log('诊断: 存储的userState =', storedUserState ? '存在' : '不存在')
      
      // 检查运行时状态
      console.log('诊断: isLoggedIn =', this.isLoggedIn)
      console.log('诊断: isTokenValid =', this.isTokenValid)
      
      console.log('🔍 用户状态诊断结束')
      
      return {
        hasUserState: !!this.userState,
        hasToken: !!this.userState?.auth?.token,
        isLoggedIn: this.isLoggedIn,
        isTokenValid: this.isTokenValid,
        hasStoredData: !!storedUserState
      }
    }
  }
})
