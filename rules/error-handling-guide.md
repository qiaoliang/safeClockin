# 错误处理指南

## 概述

本文档定义了 SafeGuard 前端项目的统一错误处理模式，确保错误处理的一致性、可维护性和用户体验。

## 错误处理原则

1. **一致性** - 全项目使用统一的错误处理模式
2. **用户友好** - 错误提示应该清晰、易懂
3. **可追踪** - 错误信息应该包含足够的上下文
4. **优雅降级** - 错误发生时提供合理的降级方案

## 错误分类

### 1. 网络错误

```javascript
// 网络连接失败
const NETWORK_ERROR = 'NETWORK_ERROR'

// 请求超时
const TIMEOUT_ERROR = 'TIMEOUT_ERROR'

// 服务器错误 (5xx)
const SERVER_ERROR = 'SERVER_ERROR'

// 客户端错误 (4xx)
const CLIENT_ERROR = 'CLIENT_ERROR'
```

### 2. 业务错误

```javascript
// 用户未登录
const UNAUTHORIZED = 'UNAUTHORIZED'

// 权限不足
const FORBIDDEN = 'FORBIDDEN'

// 资源不存在
const NOT_FOUND = 'NOT_FOUND'

// 数据验证失败
const VALIDATION_ERROR = 'VALIDATION_ERROR'

// 业务逻辑错误
const BUSINESS_ERROR = 'BUSINESS_ERROR'
```

### 3. 客户端错误

```javascript
// 参数错误
const PARAM_ERROR = 'PARAM_ERROR'

// 状态错误
const STATE_ERROR = 'STATE_ERROR'

// 未知错误
const UNKNOWN_ERROR = 'UNKNOWN_ERROR'
```

## 统一错误处理

### 1. 创建错误处理工具

```javascript
// utils/errorHandler.js

/**
 * 错误码映射表
 */
const ERROR_CODE_MAP = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '没有权限执行此操作',
  404: '请求的资源不存在',
  500: '服务器错误，请稍后重试',
  502: '网关错误，请稍后重试',
  503: '服务暂时不可用',
  504: '请求超时，请稍后重试'
}

/**
 * 业务错误码映射表
 */
const BUSINESS_ERROR_MAP = {
  'USER_NOT_FOUND': '用户不存在',
  'INVALID_CREDENTIALS': '用户名或密码错误',
  'TOKEN_EXPIRED': '登录已过期',
  'PERMISSION_DENIED': '权限不足',
  'DATA_VALIDATION_FAILED': '数据验证失败',
  'RESOURCE_CONFLICT': '资源冲突'
}

/**
 * 获取错误提示信息
 * @param {Error|Object} error - 错误对象
 * @returns {string} 错误提示信息
 */
export function getErrorMessage(error) {
  if (!error) return '操作失败，请重试'

  // 处理 HTTP 状态码错误
  if (error.statusCode || error.status) {
    const statusCode = error.statusCode || error.status
    return ERROR_CODE_MAP[statusCode] || `请求失败 (${statusCode})`
  }

  // 处理业务错误码
  if (error.code || error.errorCode) {
    const errorCode = error.code || error.errorCode
    return BUSINESS_ERROR_MAP[errorCode] || error.message || '操作失败'
  }

  // 处理网络错误
  if (error.message && error.message.includes('Network')) {
    return '网络连接失败，请检查网络设置'
  }

  // 处理超时错误
  if (error.message && error.message.includes('timeout')) {
    return '请求超时，请稍后重试'
  }

  // 默认错误信息
  return error.message || '操作失败，请重试'
}

/**
 * 显示错误提示
 * @param {Error|Object} error - 错误对象
 * @param {Object} options - 配置选项
 */
export function showErrorToast(error, options = {}) {
  const message = getErrorMessage(error)

  uni.showToast({
    title: message,
    icon: 'none',
    duration: 3000,
    ...options
  })

  // 记录错误日志
  logError(error)
}

/**
 * 记录错误日志
 * @param {Error|Object} error - 错误对象
 */
export function logError(error) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    message: error.message || 'Unknown error',
    stack: error.stack,
    code: error.code || error.errorCode,
    statusCode: error.statusCode || error.status,
    url: window.location.href,
    userAgent: navigator.userAgent
  }

  // 在开发环境打印详细错误
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ 错误详情:', errorInfo)
    console.error('调用栈:', error.stack)
  }

  // 在生产环境上报错误
  if (process.env.NODE_ENV === 'production') {
    // TODO: 上报到错误监控系统
    // reportError(errorInfo)
  }
}

/**
 * 处理 API 错误
 * @param {Error|Object} error - 错误对象
 * @returns {Promise<void>}
 */
export async function handleApiError(error) {
  const statusCode = error.statusCode || error.status

  // 处理 401 未授权错误
  if (statusCode === 401) {
    const userStore = useUserStore()
    await userStore.logout()

    uni.showModal({
      title: '提示',
      content: '登录已过期，请重新登录',
      showCancel: false,
      success: () => {
        uni.redirectTo({
          url: '/pages/login/login'
        })
      }
    })
    return
  }

  // 处理 403 权限错误
  if (statusCode === 403) {
    showErrorToast(error)
    uni.navigateBack()
    return
  }

  // 处理其他错误
  showErrorToast(error)
}

/**
 * 创建错误对象
 * @param {string} code - 错误码
 * @param {string} message - 错误信息
 * @param {number} statusCode - HTTP 状态码
 * @returns {Error} 错误对象
 */
export function createError(code, message, statusCode = 500) {
  const error = new Error(message)
  error.code = code
  error.statusCode = statusCode
  return error
}
```

### 2. API 请求错误处理

```javascript
// api/request.js - 修改请求拦截器

import { handleApiError, logError } from '@/utils/errorHandler'

export async function request(options) {
  try {
    const response = await uni.request({
      url: getAPIBaseURL() + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...options.header
      }
    })

    // 检查 HTTP 状态码
    if (response.statusCode >= 400) {
      const error = {
        statusCode: response.statusCode,
        message: response.data?.message || '请求失败',
        code: response.data?.code
      }
      throw error
    }

    // 检查业务状态码
    if (response.data.code !== 1) {
      const error = {
        statusCode: response.statusCode,
        message: response.data.msg || '操作失败',
        code: response.data.code
      }
      throw error
    }

    return response.data
  } catch (error) {
    // 统一处理错误
    await handleApiError(error)
    throw error
  }
}
```

## 异步函数错误处理

### 1. 标准 async/await 错误处理

```javascript
// ✅ 推荐：使用 try-catch
const loadData = async () => {
  try {
    const response = await api.getData()
    return response.data
  } catch (error) {
    console.error('Failed to load data:', error)
    showErrorToast(error)
    throw error
  }
}

// ❌ 避免：使用 .catch()
const loadData = () => {
  return api.getData()
    .then(response => response.data)
    .catch(error => {
      console.error('Failed to load data:', error)
      showErrorToast(error)
    })
}
```

### 2. 错误边界处理

```javascript
// ✅ 提供降级方案
const loadData = async () => {
  try {
    const response = await api.getData()
    return response.data
  } catch (error) {
    console.error('Failed to load data:', error)

    // 尝试从缓存加载数据
    const cachedData = await loadFromCache()
    if (cachedData) {
      console.log('Using cached data')
      return cachedData
    }

    // 显示错误提示
    showErrorToast(error)

    // 返回默认数据
    return getDefaultData()
  }
}
```

### 3. 重试机制

```javascript
// utils/retry.js

/**
 * 带重试的异步函数
 * @param {Function} fn - 异步函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise<any>}
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      console.warn(`Retry ${i + 1}/${maxRetries} failed:`, error.message)

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// 使用示例
const loadData = async () => {
  try {
    const data = await retry(() => api.getData(), 3, 1000)
    return data
  } catch (error) {
    showErrorToast(error)
    throw error
  }
}
```

## 组件错误处理

### 1. 错误状态管理

```vue
<template>
  <view class="data-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <uni-load-more status="loading" />
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-state">
      <text class="error-message">{{ errorMessage }}</text>
      <button class="retry-button" @click="retry">
        重试
      </button>
    </view>

    <!-- 成功状态 -->
    <view v-else class="success-state">
      <slot :data="data" />
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getErrorMessage } from '@/utils/errorHandler'

const props = defineProps<{
  loadData: () => Promise<any>
}>()

const emit = defineEmits<{
  error: [error: Error]
  success: [data: any]
}>()

const loading = ref(true)
const error = ref(null)
const data = ref(null)

const errorMessage = computed(() => {
  return error.value ? getErrorMessage(error.value) : ''
})

const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    const result = await props.loadData()
    data.value = result
    emit('success', result)
  } catch (err) {
    error.value = err
    emit('error', err)
  } finally {
    loading.value = false
  }
}

const retry = () => {
  loadData()
}

onMounted(() => {
  loadData()
})
</script>
```

### 2. 表单验证错误

```vue
<script setup>
import { ref } from 'vue'

const formData = ref({
  username: '',
  password: ''
})

const errors = ref({})

const validateForm = () => {
  errors.value = {}

  // 用户名验证
  if (!formData.value.username) {
    errors.value.username = '请输入用户名'
  } else if (formData.value.username.length < 3) {
    errors.value.username = '用户名至少需要3个字符'
  }

  // 密码验证
  if (!formData.value.password) {
    errors.value.password = '请输入密码'
  } else if (formData.value.password.length < 6) {
    errors.value.password = '密码至少需要6个字符'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    uni.showToast({
      title: '请检查表单填写',
      icon: 'none'
    })
    return
  }

  try {
    await api.login(formData.value)
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })
  } catch (error) {
    showErrorToast(error)
  }
}
</script>
```

## 全局错误处理

### 1. 全局错误处理器

```javascript
// main.js

import { logError } from '@/utils/errorHandler'

// 捕获 Vue 错误
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Error Info:', info)

  logError({
    message: err.message,
    stack: err.stack,
    component: vm?.$options?.name,
    info
  })

  // 显示错误提示
  uni.showToast({
    title: '应用发生错误',
    icon: 'none'
  })
}

// 捕获 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)

  logError({
    message: event.reason?.message || 'Unhandled Promise Rejection',
    stack: event.reason?.stack
  })

  event.preventDefault()
})

// 捕获全局错误
window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error)

  logError({
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  })
})
```

## 错误日志记录

### 1. 日志级别

```javascript
// utils/logger.js

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
}

class Logger {
  constructor() {
    this.level = process.env.NODE_ENV === 'development' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO
  }

  debug(message, data) {
    if (this.level === LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, data)
    }
  }

  info(message, data) {
    if (this.level !== LOG_LEVELS.ERROR) {
      console.info(`[INFO] ${message}`, data)
    }
  }

  warn(message, data) {
    console.warn(`[WARN] ${message}`, data)
  }

  error(message, error) {
    console.error(`[ERROR] ${message}`, error)
  }
}

export const logger = new Logger()
```

### 2. 错误上报

```javascript
// utils/errorReporter.js

/**
 * 上报错误到监控系统
 * @param {Object} errorInfo - 错误信息
 */
export async function reportError(errorInfo) {
  // 只在生产环境上报
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  try {
    // TODO: 集成错误监控系统（如 Sentry）
    // await fetch('/api/error-report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorInfo)
    // })
  } catch (err) {
    console.error('Failed to report error:', err)
  }
}
```

## 错误处理最佳实践

### 1. 提供用户友好的错误提示

```javascript
// ❌ 不友好
catch (error) {
  console.error(error)
  alert('Error: ' + error.message)
}

// ✅ 友好
catch (error) {
  console.error(error)
  showErrorToast(error)
}
```

### 2. 记录足够的上下文信息

```javascript
// ❌ 信息不足
catch (error) {
  console.error('Error occurred')
}

// ✅ 信息完整
catch (error) {
  console.error('Failed to load user data:', {
    userId: userId.value,
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack
  })
}
```

### 3. 提供降级方案

```javascript
// ✅ 有降级方案
const loadUserData = async () => {
  try {
    const data = await api.getUserData()
    return data
  } catch (error) {
    console.error('Failed to load user data:', error)

    // 返回缓存数据
    const cachedData = getCachedUserData()
    if (cachedData) {
      return cachedData
    }

    // 返回默认数据
    return getDefaultUserData()
  }
}
```

### 4. 避免吞没错误

```javascript
// ❌ 吞没错误
try {
  await api.getData()
} catch (error) {
  // 什么都不做
}

// ✅ 正确处理
try {
  await api.getData()
} catch (error) {
  logError(error)
  showErrorToast(error)
  throw error
}
```

## 特殊场景处理

### 1. 离线场景

```javascript
const checkNetworkStatus = async () => {
  try {
    const networkStatus = await uni.getNetworkType()
    return networkStatus.networkType !== 'none'
  } catch (error) {
    console.error('Failed to check network status:', error)
    return false
  }
}

const loadDataWithOfflineCheck = async () => {
  const isOnline = await checkNetworkStatus()

  if (!isOnline) {
    // 离线模式，从缓存加载
    const cachedData = await loadFromCache()
    if (cachedData) {
      return cachedData
    }

    uni.showToast({
      title: '网络不可用，请检查网络设置',
      icon: 'none'
    })
    throw new Error('Network unavailable')
  }

  // 在线模式，从服务器加载
  return await api.getData()
}
```

### 2. 取消请求

```javascript
// utils/requestManager.js

class RequestManager {
  constructor() {
    this.pendingRequests = new Map()
  }

  generateRequestId() {
    return Date.now() + Math.random().toString(36).substr(2, 9)
  }

  async request(options) {
    const requestId = this.generateRequestId()

    return new Promise((resolve, reject) => {
      const requestTask = uni.request({
        ...options,
        success: (res) => {
          this.pendingRequests.delete(requestId)
          resolve(res)
        },
        fail: (err) => {
          this.pendingRequests.delete(requestId)
          reject(err)
        }
      })

      this.pendingRequests.set(requestId, requestTask)
    })
  }

  cancelRequest(requestId) {
    const requestTask = this.pendingRequests.get(requestId)
    if (requestTask) {
      requestTask.abort()
      this.pendingRequests.delete(requestId)
    }
  }

  cancelAllRequests() {
    this.pendingRequests.forEach((requestTask, requestId) => {
      requestTask.abort()
      this.pendingRequests.delete(requestId)
    })
  }
}

export const requestManager = new RequestManager()
```

## 测试错误处理

```javascript
// tests/unit/errorHandler.test.js

import { describe, it, expect, vi } from 'vitest'
import { getErrorMessage, showErrorToast } from '@/utils/errorHandler'

describe('errorHandler', () => {
  it('should return correct error message for 401', () => {
    const error = { statusCode: 401 }
    expect(getErrorMessage(error)).toBe('登录已过期，请重新登录')
  })

  it('should return correct error message for network error', () => {
    const error = new Error('Network Error')
    expect(getErrorMessage(error)).toBe('网络连接失败，请检查网络设置')
  })

  it('should show toast with error message', () => {
    const showToastSpy = vi.spyOn(uni, 'showToast')
    const error = { statusCode: 404 }

    showErrorToast(error)

    expect(showToastSpy).toHaveBeenCalledWith({
      title: '请求的资源不存在',
      icon: 'none',
      duration: 3000
    })
  })
})
```

## 参考资料

- [Vue 3 错误处理](https://cn.vuejs.org/guide/essentials/error-handling.html)
- [MDN 错误处理](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)