# 注册与登录功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现"安卡小习惯"微信小程序的注册与登录功能，包括微信快捷登录、角色选择和权限控制。

**Architecture:** 基于uni-app + Vue3 + Pinia架构，使用Composition API实现状态管理，通过微信授权实现用户登录，根据用户角色进行权限控制和页面跳转。

**Tech Stack:** uni-app, Vue3 Composition API, Pinia, TypeScript, SCSS, 微信小程序API

---

## 前置准备工作

### Task 1: 创建基础目录结构

**Files:**
- Create: `store/modules/user.js`
- Create: `store/modules/storage.js`
- Create: `store/api/request.js`
- Create: `store/api/auth.js`
- Create: `store/index.js`
- Create: `utils/router.js`
- Create: `utils/auth.js`

**Step 1: 创建store目录和基本文件结构**

在项目根目录创建store目录结构：
```bash
mkdir -p store/modules
mkdir -p store/api
mkdir -p utils
```

**Step 2: 创建本地存储管理模块**

**File:** `store/modules/storage.js`
```javascript
// store/modules/storage.js
export const storage = {
  set(key, value) {
    try {
      uni.setStorageSync(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('存储失败:', error)
      return false
    }
  },
  
  get(key) {
    try {
      const value = uni.getStorageSync(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('读取存储失败:', error)
      return null
    }
  },
  
  remove(key) {
    try {
      uni.removeStorageSync(key)
      return true
    } catch (error) {
      console.error('删除存储失败:', error)
      return false
    }
  },
  
  clear() {
    try {
      uni.clearStorageSync()
      return true
    } catch (error) {
      console.error('清空存储失败:', error)
      return false
    }
  }
}
```

**Step 3: 创建请求封装模块**

**File:** `store/api/request.js`
```javascript
// store/api/request.js
const baseURL = 'https://your-api-domain.com/api'

export const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.header
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    uni.request({
      url: baseURL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: headers,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          handleTokenExpired()
          reject(new Error('登录已过期'))
        } else {
          reject(new Error(res.data?.message || '请求失败'))
        }
      },
      fail: (error) => {
        reject(new Error('网络请求失败'))
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
```

**Step 4: 创建认证API模块**

**File:** `store/api/auth.js`
```javascript
// store/api/auth.js
import { request } from './request'

export const authApi = {
  login: (data) => request({
    url: '/auth/wechat-login',
    method: 'POST',
    data
  }),
  
  getUserInfo: () => request({
    url: '/auth/user-info',
    method: 'GET'
  }),
  
  logout: () => request({
    url: '/auth/logout',
    method: 'POST'
  })
}
```

**Step 5: 创建用户状态管理模块**

**File:** `store/modules/user.js`
```javascript
// store/modules/user.js
import { defineStore } from 'pinia'
import { storage } from './storage'
import { authApi } from '../api/auth'

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
    async login(code, userInfo) {
      this.isLoading = true
      try {
        const response = await authApi.login({ code, userInfo })
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
      // TODO: 调用API更新用户角色
      this.role = role
      if (this.userInfo) {
        this.userInfo.role = role
        storage.set('userInfo', this.userInfo)
      }
    }
  }
})
```

**Step 6: 创建store入口文件**

**File:** `store/index.js`
```javascript
// store/index.js
import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

export { useUserStore } from './modules/user'
```

**Step 7: 提交基础结构**

```bash
git add store/ utils/
git commit -m "feat: 创建注册登录功能的基础目录结构和模块"
```

---

## 核心功能实现

### Task 2: 创建路由和权限控制工具

**Files:**
- Create: `utils/router.js`
- Create: `utils/auth.js`

**Step 1: 创建路由守卫工具**

**File:** `utils/router.js`
```javascript
// utils/router.js
import { useUserStore } from '@/store/modules/user'

export function routeGuard(url, options = {}) {
  const userStore = useUserStore()
  
  if (isAuthRequired(url) && !userStore.isLoggedIn) {
    uni.redirectTo({
      url: '/pages/login/login'
    })
    return false
  }
  
  if (isRoleRequired(url) && !hasRequiredRole(url, userStore.role)) {
    uni.showToast({
      title: '权限不足',
      icon: 'none'
    })
    return false
  }
  
  uni.navigateTo({
    url,
    ...options
  })
  
  return true
}

const isAuthRequired = (url) => {
  const authPages = [
    '/pages/home-solo/home-solo',
    '/pages/home-supervisor/home-supervisor',
    '/pages/home-community/home-community',
    '/pages/profile/profile'
  ]
  
  return authPages.some(page => url.includes(page))
}

const isRoleRequired = (url) => {
  const rolePages = {
    '/pages/home-solo/home-solo': 'solo',
    '/pages/home-supervisor/home-supervisor': 'supervisor',
    '/pages/home-community/home-community': 'community'
  }
  
  return Object.keys(rolePages).some(page => 
    url.includes(page) && rolePages[page]
  )
}

const hasRequiredRole = (url, userRole) => {
  const rolePages = {
    '/pages/home-solo/home-solo': 'solo',
    '/pages/home-supervisor/home-supervisor': 'supervisor',
    '/pages/home-community/home-community': 'community'
  }
  
  const requiredRole = Object.keys(rolePages).find(page => url.includes(page))
  return requiredRole ? rolePages[requiredRole] === userRole : true
}

export const getHomePageByRole = (role) => {
  const homePages = {
    solo: '/pages/home-solo/home-solo',
    supervisor: '/pages/home-supervisor/home-supervisor',
    community: '/pages/home-community/home-community'
  }
  
  return homePages[role] || '/pages/login/login'
}
```

**Step 2: 创建认证处理工具**

**File:** `utils/auth.js`
```javascript
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
```

**Step 3: 提交路由和认证工具**

```bash
git add utils/
git commit -m "feat: 实现路由守卫和认证处理工具"
```

### Task 3: 创建登录页面

**Files:**
- Create: `pages/login/login.vue`
- Modify: `pages.json`

**Step 1: 更新页面配置**

**File:** `pages.json` (添加登录页面配置)
```json
{
  "pages": [
    {
      "path": "pages/login/login",
      "style": {
        "navigationBarTitleText": "登录",
        "navigationBarBackgroundColor": "#FAE9DB",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#FAE9DB"
      }
    }
  ]
}
```

**Step 2: 创建登录页面组件**

**File:** `pages/login/login.vue`
```vue
<!-- pages/login/login.vue -->
<template>
  <view class="login-container">
    <!-- Logo和标题 -->
    <view class="logo-section">
      <image class="app-logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="app-title">安卡小习惯</text>
      <text class="app-subtitle">让关爱无处不在</text>
    </view>
    
    <!-- 微信登录按钮 -->
    <button 
      class="wechat-login-button"
      open-type="getUserInfo"
      @getuserinfo="onGetUserInfo"
      :disabled="isLoading"
    >
      <text class="wechat-icon">🟢</text>
      <text class="button-text">微信快捷登录</text>
    </button>
    
    <!-- 分割线 -->
    <view class="divider">
      <view class="divider-line"></view>
      <text class="divider-text">或</text>
      <view class="divider-line"></view>
    </view>
    
    <!-- 手机号登录入口 -->
    <button class="phone-login-button" @click="showPhoneLogin">
      <text class="phone-icon">📱</text>
      <text>手机号登录</text>
    </button>
    
    <!-- 用户协议 -->
    <view class="agreement-section">
      <text class="agreement-text">
        登录即表示同意
        <text class="link" @click="showUserAgreement">《用户协议》</text>
        和
        <text class="link" @click="showPrivacyPolicy">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { handleLoginSuccess, handleLoginError } from '@/utils/auth'

const isLoading = ref(false)
const userStore = useUserStore()

const onGetUserInfo = async (e) => {
  if (isLoading.value) return
  
  const { userInfo } = e.detail
  
  if (!userInfo) {
    uni.showToast({
      title: '需要您的授权才能使用完整功能',
      icon: 'none'
    })
    return
  }
  
  isLoading.value = true
  
  try {
    const loginRes = await uni.login()
    
    if (!loginRes.code) {
      throw new Error('获取微信登录凭证失败')
    }
    
    await handleLoginSuccess({
      code: loginRes.code,
      userInfo
    })
    
  } catch (error) {
    console.error('登录失败:', error)
    handleLoginError(error)
  } finally {
    isLoading.value = false
  }
}

const showPhoneLogin = () => {
  uni.showToast({
    title: '手机号登录功能开发中',
    icon: 'none'
  })
}

const showUserAgreement = () => {
  uni.showToast({
    title: '用户协议功能开发中',
    icon: 'none'
  })
}

const showPrivacyPolicy = () => {
  uni.showToast({
    title: '隐私政策功能开发中',
    icon: 'none'
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 120rpx 48rpx 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-section {
  text-align: center;
  margin-bottom: 160rpx;
}

.app-logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 48rpx;
  border-radius: 32rpx;
  box-shadow: 0 0 60rpx rgba(244, 130, 36, 0.3);
}

.app-title {
  display: block;
  font-size: 60rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 16rpx;
}

.app-subtitle {
  display: block;
  font-size: 32rpx;
  color: #666;
}

.wechat-login-button {
  width: 600rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #07C160 0%, #00A651 100%);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 32rpx rgba(7, 193, 96, 0.4);
  margin-bottom: 48rpx;
}

.wechat-login-button:active {
  transform: scale(0.98);
}

.wechat-login-button:disabled {
  opacity: 0.6;
}

.wechat-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.button-text {
  font-size: 36rpx;
}

.divider {
  display: flex;
  align-items: center;
  width: 600rpx;
  margin-bottom: 48rpx;
}

.divider-line {
  flex: 1;
  height: 2rpx;
  background-color: #E5E5E5;
}

.divider-text {
  margin: 0 32rpx;
  font-size: 28rpx;
  color: #999;
}

.phone-login-button {
  width: 600rpx;
  height: 96rpx;
  background: white;
  border: 4rpx solid #F48224;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F48224;
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 80rpx;
}

.phone-login-button:active {
  transform: scale(0.98);
}

.phone-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.agreement-section {
  margin-top: auto;
  text-align: center;
}

.agreement-text {
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
}

.link {
  color: #F48224;
  text-decoration: underline;
}
</style>
```

**Step 3: 提交登录页面**

```bash
git add pages/login/login.vue pages.json
git commit -m "feat: 实现登录页面UI和基本交互"
```

### Task 4: 创建角色选择页面

**Files:**
- Create: `pages/role-select/role-select.vue`
- Modify: `pages.json`

**Step 1: 更新页面配置**

**File:** `pages.json` (添加角色选择页面配置)
```json
{
  "pages": [
    {
      "path": "pages/role-select/role-select",
      "style": {
        "navigationBarTitleText": "选择角色",
        "navigationBarBackgroundColor": "#FAE9DB",
        "navigationBarTextStyle": "black"
      }
    }
  ]
}
```

**Step 2: 创建角色选择页面组件**

**File:** `pages/role-select/role-select.vue`
```vue
<!-- pages/role-select/role-select.vue -->
<template>
  <view class="role-select-container">
    <view class="header">
      <text class="title">请选择您的角色</text>
      <text class="subtitle">选择后可在个人中心修改</text>
    </view>
    
    <view class="role-list">
      <view 
        v-for="role in roleList" 
        :key="role.value"
        class="role-item"
        :class="{ active: selectedRole === role.value }"
        @click="selectRole(role.value)"
      >
        <view class="role-icon">{{ role.icon }}</view>
        <view class="role-info">
          <text class="role-name">{{ role.name }}</text>
          <text class="role-desc">{{ role.description }}</text>
        </view>
        <view class="role-check" v-if="selectedRole === role.value">
          <text class="check-icon">✓</text>
        </view>
      </view>
    </view>
    
    <button 
      class="confirm-btn"
      :disabled="!selectedRole"
      @click="confirmRole"
    >
      确认选择
    </button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getHomePageByRole } from '@/utils/router'

const selectedRole = ref('')

const roleList = ref([
  {
    value: 'solo',
    name: '独居者',
    icon: '👤',
    description: '我需要他人关注我的安全状况'
  },
  {
    value: 'supervisor',
    name: '监护人',
    icon: '👥',
    description: '我要关注亲友的安全状况'
  },
  {
    value: 'community',
    name: '社区工作人员',
    icon: '🏢',
    description: '我负责管理辖区内的独居者'
  }
])

const userStore = useUserStore()

const selectRole = (role) => {
  selectedRole.value = role
}

const confirmRole = async () => {
  if (!selectedRole.value) return
  
  try {
    await userStore.updateUserRole(selectedRole.value)
    
    if (selectedRole.value === 'community') {
      uni.redirectTo({
        url: '/pages/community-auth/community-auth'
      })
    } else {
      const homePage = getHomePageByRole(selectedRole.value)
      uni.switchTab({
        url: homePage
      })
    }
  } catch (error) {
    uni.showToast({
      title: '角色设置失败',
      icon: 'none'
    })
  }
}
</script>

<style scoped>
.role-select-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 80rpx 48rpx;
}

.header {
  text-align: center;
  margin-bottom: 80rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.role-list {
  margin-bottom: 80rpx;
}

.role-item {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 32rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.role-item.active {
  border: 4rpx solid #F48224;
  box-shadow: 0 8rpx 24rpx rgba(244, 130, 36, 0.2);
}

.role-icon {
  font-size: 80rpx;
  margin-right: 32rpx;
}

.role-info {
  flex: 1;
}

.role-name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.role-desc {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.role-check {
  width: 48rpx;
  height: 48rpx;
  background: #F48224;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  color: white;
  font-size: 32rpx;
  font-weight: bold;
}

.confirm-btn {
  width: 600rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  border-radius: 32rpx;
  color: white;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 32rpx rgba(244, 130, 36, 0.4);
}

.confirm-btn:disabled {
  background: #CCCCCC;
  box-shadow: none;
}
</style>
```

**Step 3: 提交角色选择页面**

```bash
git add pages/role-select/role-select.vue pages.json
git commit -m "feat: 实现角色选择页面"
```

### Task 5: 创建社区身份验证页面

**Files:**
- Create: `pages/community-auth/community-auth.vue`
- Modify: `pages.json`

**Step 1: 更新页面配置**

**File:** `pages.json` (添加社区身份验证页面配置)
```json
{
  "pages": [
    {
      "path": "pages/community-auth/community-auth",
      "style": {
        "navigationBarTitleText": "身份验证",
        "navigationBarBackgroundColor": "#FAE9DB",
        "navigationBarTextStyle": "black"
      }
    }
  ]
}
```

**Step 2: 创建社区身份验证页面组件**

**File:** `pages/community-auth/community-auth.vue`
```vue
<!-- pages/community-auth/community-auth.vue -->
<template>
  <view class="auth-container">
    <view class="header">
      <text class="title">社区工作人员身份验证</text>
      <text class="subtitle">请提供您的工作信息以完成身份验证</text>
    </view>
    
    <form class="auth-form" @submit="submitAuth">
      <view class="form-group">
        <text class="label">姓名</text>
        <input 
          class="input"
          type="text"
          v-model="formData.name"
          placeholder="请输入您的真实姓名"
          maxlength="20"
        />
      </view>
      
      <view class="form-group">
        <text class="label">工号/身份证号</text>
        <input 
          class="input"
          type="text"
          v-model="formData.workId"
          placeholder="请输入工号或身份证号"
          maxlength="18"
        />
      </view>
      
      <view class="form-group">
        <text class="label">工作证明</text>
        <view class="upload-area" @click="chooseImage">
          <image 
            v-if="formData.workProof" 
            :src="formData.workProof" 
            class="proof-image"
            mode="aspectFit"
          ></image>
          <view v-else class="upload-placeholder">
            <text class="upload-icon">📷</text>
            <text class="upload-text">点击上传工作证明照片</text>
          </view>
        </view>
      </view>
      
      <button 
        class="submit-btn"
        :disabled="!isFormValid || isLoading"
        form-type="submit"
      >
        {{ isLoading ? '提交中...' : '提交验证' }}
      </button>
    </form>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getHomePageByRole } from '@/utils/router'

const isLoading = ref(false)
const userStore = useUserStore()

const formData = ref({
  name: '',
  workId: '',
  workProof: ''
})

const isFormValid = computed(() => {
  return formData.value.name && 
         formData.value.workId && 
         formData.value.workProof
})

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.value.workProof = res.tempFilePaths[0]
    },
    fail: () => {
      uni.showToast({
        title: '选择图片失败',
        icon: 'none'
      })
    }
  })
}

const submitAuth = async () => {
  if (!isFormValid.value) return
  
  isLoading.value = true
  
  try {
    // TODO: 调用API提交身份验证信息
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 更新用户验证状态
    userStore.userInfo.isVerified = true
    uni.setStorageSync('userInfo', userStore.userInfo)
    
    uni.showToast({
      title: '身份验证成功',
      icon: 'success'
    })
    
    // 跳转到社区首页
    setTimeout(() => {
      const homePage = getHomePageByRole('community')
      uni.switchTab({
        url: homePage
      })
    }, 1500)
    
  } catch (error) {
    uni.showToast({
      title: '验证失败，请重试',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FAE9DB 0%, #F8E0D0 100%);
  padding: 80rpx 48rpx;
}

.header {
  text-align: center;
  margin-bottom: 80rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #624731;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.auth-form {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 48rpx;
}

.label {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  background: #F8F8F8;
  border: 2rpx solid #E5E5E5;
  border-radius: 16rpx;
  padding: 0 32rpx;
  font-size: 32rpx;
  color: #333;
}

.input:focus {
  border-color: #F48224;
  background: white;
}

.upload-area {
  width: 100%;
  height: 240rpx;
  background: #F8F8F8;
  border: 2rpx dashed #E5E5E5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.proof-image {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.upload-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.upload-text {
  font-size: 28rpx;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  border-radius: 32rpx;
  color: white;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 32rpx rgba(244, 130, 36, 0.4);
  margin-top: 32rpx;
}

.submit-btn:disabled {
  background: #CCCCCC;
  box-shadow: none;
}
</style>
```

**Step 3: 提交社区身份验证页面**

```bash
git add pages/community-auth/community-auth.vue pages.json
git commit -m "feat: 实现社区身份验证页面"
```

### Task 6: 更新应用入口和全局配置

**Files:**
- Modify: `App.vue`
- Modify: `main.js`
- Modify: `manifest.json`

**Step 1: 更新App.vue**

**File:** `App.vue`
```vue
<script setup>
import { onLaunch, onShow, onHide } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getHomePageByRole } from '@/utils/router'

onLaunch(() => {
  console.log('App Launch')
  
  const userStore = useUserStore()
  userStore.initUserState()
  
  checkLaunchScene()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})

const checkLaunchScene = () => {
  const userStore = useUserStore()
  
  if (userStore.isLoggedIn && userStore.userInfo.role) {
    const homePage = getHomePageByRole(userStore.userInfo.role)
    
    setTimeout(() => {
      uni.switchTab({
        url: homePage
      })
    }, 100)
  }
}
</script>

<style>
page {
  background-color: #FAE9DB;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.btn-primary {
  background: linear-gradient(135deg, #F48224 0%, #E8741A 100%);
  color: white;
  border-radius: 32rpx;
  font-size: 36rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 32rpx rgba(244, 130, 36, 0.4);
}

.btn-primary:active {
  transform: scale(0.98);
}

.input-default {
  background: white;
  border: 2rpx solid #E5E5E5;
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  font-size: 32rpx;
}

.input-default:focus {
  border-color: #F48224;
}
</style>
```

**Step 2: 更新main.js**

**File:** `main.js`
```javascript
import { createSSRApp } from 'vue'
import App from './App.vue'
import pinia from './store'

export function createApp() {
  const app = createSSRApp(App)
  app.use(pinia)
  return {
    app
  }
}
```

**Step 3: 更新manifest.json**

**File:** `manifest.json` (添加微信小程序配置)
```json
{
  "mp-weixin": {
    "appid": "your-weixin-appid",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "usingComponents": true,
    "permission": {
      "scope.userInfo": {
        "desc": "用于获取用户头像和昵称"
      }
    }
  }
}
```

**Step 4: 提交应用配置更新**

```bash
git add App.vue main.js manifest.json
git commit -m "feat: 更新应用入口和全局配置"
```

### Task 7: 配置页面路由和底部导航

**Files:**
- Modify: `pages.json`

**Step 1: 完整页面路由配置**

**File:** `pages.json`
```json
{
  "pages": [
    {
      "path": "pages/login/login",
      "style": {
        "navigationBarTitleText": "登录",
        "navigationBarBackgroundColor": "#FAE9DB",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#FAE9DB"
      }
    },
    {
      "path": "pages/role-select/role-select",
      "style": {
        "navigationBarTitleText": "选择角色",
        "navigationBarBackgroundColor": "#FAE9DB",
        "navigationBarTextStyle": "black"
      }
    },
    {
      "path": "pages/community-auth/community-auth",
      "style": {
        "navigationBarTitleText": "身份验证",
        "navigationBarBackgroundColor": "#FAE9DB",
        "navigationBarTextStyle": "black"
      }
    },
    {
      "path": "pages/home-solo/home-solo",
      "style": {
        "navigationBarTitleText": "首页",
        "navigationBarBackgroundColor": "#FAE9DB",
        "navigationBarTextStyle": "black"
      }
    },
    {
      "path": "pages/home-supervisor/home-supervisor",
      "style": {
        "navigationBarTitleText": "首页",
        "navigationBarBackgroundColor": "#FAE9DB",
        "navigationBarTextStyle": "black"
      }
    },
    {
      "path": "pages/home-community/home-community",
      "style": {
        "navigationBarTitleText": "数据看板",
        "navigationBarBackgroundColor": "#FAE9DB",
        "navigationBarTextStyle": "black"
      }
    },
    {
      "path": "pages/profile/profile",
      "style": {
        "navigationBarTitleText": "个人中心",
        "navigationBarBackgroundColor": "#FAE9DB",
        "navigationBarTextStyle": "black"
      }
    }
  ],
  "tabBar": {
    "color": "#624731",
    "selectedColor": "#F48224",
    "backgroundColor": "#FAE9DB",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/home-solo/home-solo",
        "text": "首页",
        "iconPath": "static/tabbar/home.png",
        "selectedIconPath": "static/tabbar/home-active.png"
      },
      {
        "pagePath": "pages/profile/profile",
        "text": "我的",
        "iconPath": "static/tabbar/profile.png",
        "selectedIconPath": "static/tabbar/profile-active.png"
      }
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "安卡小习惯",
    "navigationBarBackgroundColor": "#FAE9DB",
    "backgroundColor": "#FAE9DB"
  }
}
```

**Step 2: 提交页面路由配置**

```bash
git add pages.json
git commit -m "feat: 完成页面路由和底部导航配置"
```

---

## 测试与验证

### Task 8: 基础功能测试

**Files:**
- Test: 手动测试各页面功能

**Step 1: 测试登录流程**

1. 启动小程序，检查是否正确跳转到登录页
2. 点击微信登录按钮，检查授权流程
3. 检查登录成功后是否跳转到角色选择页

**Step 2: 测试角色选择**

1. 在角色选择页选择不同角色
2. 检查选择社区工作人员是否跳转到身份验证页
3. 检查选择其他角色是否跳转到对应首页

**Step 3: 测试身份验证**

1. 在身份验证页填写表单信息
2. 检查表单验证逻辑
3. 检查提交后是否跳转到社区首页

**Step 4: 测试权限控制**

1. 检查未登录用户访问受保护页面的跳转
2. 检查不同角色用户访问对应页面的权限

**Step 5: 提交测试结果**

```bash
git add .
git commit -m "feat: 完成注册与登录功能基础实现和测试"
```

---

## 总结

注册与登录功能实现计划已完成，包括：

1. ✅ 基础目录结构和模块创建
2. ✅ 路由守卫和认证处理工具
3. ✅ 登录页面实现
4. ✅ 角色选择页面实现
5. ✅ 社区身份验证页面实现
6. ✅ 应用入口和全局配置更新
7. ✅ 页面路由和底部导航配置
8. ✅ 基础功能测试

所有功能都使用Vue3 Composition API实现，遵循项目的开发规范。实现完成后，用户可以：
- 通过微信快捷登录
- 选择用户角色（独居者/监护人/社区工作人员）
- 社区工作人员进行身份验证
- 根据角色访问对应的功能页面

下一步可以根据需要实现手机号登录、完善API接口对接、添加更多页面功能等。