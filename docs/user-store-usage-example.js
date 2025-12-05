// 用户状态管理使用示例
// 展示如何在 Vue 组件中使用重构后的用户 store

import { mapState, mapActions, mapGetters } from 'pinia'
import { useUserStore } from '@/store'

export default {
  computed: {
    // 方式1：直接使用 store
    userStore() {
      return useUserStore()
    },
    
    // 方式2：映射状态
    ...mapState(useUserStore, ['isLoggedIn', 'isLoading']),
    
    // 方式3：映射 getters
    ...mapGetters(useUserStore, ['isSoloUser', 'isSupervisor', 'isCommunityWorker', 'isTokenValid']),
    
    // 方式4：便捷访问用户信息
    userInfo() {
      return this.userStore.userInfo
    },
    token() {
      return this.userStore.token
    }
  },
  
  methods: {
    // 映射 actions
    ...mapActions(useUserStore, ['login', 'logout', 'fetchUserInfo', 'updateUserInfo']),
    
    // 示例：登录处理
    async handleLogin(code) {
      try {
        await this.login(code)
        uni.showToast({ title: '登录成功', icon: 'success' })
        
        // 登录成功后的跳转
        if (this.isSoloUser) {
          uni.switchTab({ url: '/pages/home-solo/home-solo' })
        } else if (this.isSupervisor) {
          uni.switchTab({ url: '/pages/home-supervisor/home-supervisor' })
        } else if (this.isCommunityWorker) {
          uni.switchTab({ url: '/pages/home-community/home-community' })
        }
      } catch (error) {
        uni.showToast({ title: error.message, icon: 'error' })
      }
    },
    
    // 示例：更新用户信息
    async updateProfile(userData) {
      try {
        await this.updateUserInfo(userData)
        uni.showToast({ title: '更新成功', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: '更新失败', icon: 'error' })
      }
    },
    
    // 示例：缓存管理
    updateCheckinCache(checkinData) {
      this.userStore.updateCache({
        checkinData,
        cachedUserInfo: this.userInfo
      })
    },
    
    // 示例：Token 刷新
    async ensureTokenValid() {
      if (!this.isTokenValid) {
        try {
          await this.userStore.refreshTokenIfNeeded()
        } catch (error) {
          console.error('Token 刷新失败:', error)
          // 跳转到登录页
          uni.redirectTo({ url: '/pages/login/login' })
        }
      }
    }
  },
  
  // 生命周期钩子
  onLoad() {
    // 初始化用户状态
    this.userStore.initUserState()
  },
  
  onShow() {
    // 页面显示时检查 Token 有效性
    if (this.isLoggedIn) {
      this.ensureTokenValid()
    }
  }
}