// tests/setup.e2e.js
import { vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// 初始化 Pinia
const pinia = createPinia()
setActivePinia(pinia)

// 禁用 MSW (Mock Service Worker) - E2E 测试需要真实后端
import { beforeAll, afterEach } from 'vitest'

// 确保 MSW 不会拦截真实请求
beforeAll(() => {
  // 如果项目中使用了 MSW，这里需要确保它被禁用
  if (typeof global.navigator !== 'undefined' && global.navigator.serviceWorker) {
    // 尝试取消注册任何可能存在的 service worker
    global.navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister())
    })
  }
})

// Mock secure.js utilities
vi.mock('@/utils/secure', () => ({
  SENSITIVE_KEYS: ['userState', 'token', 'refreshToken', 'userInfo', 'cached_user_info', 'secure_seed'],
  encodeObject: vi.fn((obj) => JSON.stringify(obj)),
  decodeObject: vi.fn((str) => JSON.parse(str))
}))

// Mock uni-app APIs - E2E 测试使用真实的网络请求
// 但保留其他 API 的 mock
global.uni = {
  getStorageSync: vi.fn((key) => {
    // Default mock behavior
    return null
  }),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  redirectTo: vi.fn(),
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  showModal: vi.fn(({ success }) => {
    // Auto-confirm modal dialogs in tests
    if (success) success({ confirm: true })
  }),
  showToast: vi.fn(),
  hideToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  // 注意：不 mock request 函数，让 E2E 测试使用真实的网络请求
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    platform: 'h5',
    version: '1.0.0'
  })),
  onNetworkStatusChange: vi.fn(),
  offNetworkStatusChange: vi.fn()
}

// Mock storage module
const mockStorage = {
  data: {},
  get: vi.fn((key) => mockStorage.data[key] || null),
  set: vi.fn((key, value) => {
    mockStorage.data[key] = value
  }),
  remove: vi.fn((key) => {
    delete mockStorage.data[key]
  }),
  clear: vi.fn(() => {
    mockStorage.data = {}
  })
}

global.storage = mockStorage

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  mockStorage.data = {}
})

// E2E 测试前检查后端服务是否启动
beforeAll(async () => {
  // 设置环境变量，确保使用 func 环境配置
  process.env.UNI_ENV = 'func'
  
  // 可以通过 BASE_URL_FOR_SAFEGUARD 环境变量覆盖默认配置
  const backendUrl = process.env.BASE_URL_FOR_SAFEGUARD || 'http://localhost:8080'
  const maxRetries = 10
  const retryInterval = 3000 // 3秒
  
  console.log(`🔍 检查后端服务是否启动: ${backendUrl}`)
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 使用 Node.js 的 http 模块而不是 fetch，因为某些环境下 fetch 可能不可用
      const http = await import('http')
      const https = await import('https')
      const url = new URL(backendUrl)
      const client = url.protocol === 'https:' ? https : http
      
      const response = await new Promise((resolve, reject) => {
        const req = client.request(`${url.origin}/api/count`, (res) => {
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => resolve({ ok: res.statusCode === 200, statusCode: res.statusCode, data }))
        })
        req.on('error', reject)
        req.setTimeout(5000, () => {
          req.destroy()
          reject(new Error('Request timeout'))
        })
        req.end()
      })
      
      if (response.ok) {
        console.log('✅ 后端服务已启动，可以开始 E2E 测试')
        return
      }
    } catch (error) {
      console.log(`❌ 后端服务未响应，重试中... (${i + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, retryInterval))
    }
  }
  
  throw new Error(`❌ 后端服务未启动或无法访问: ${process.env.BASE_URL_FOR_SAFEGUARD || 'http://localhost:8080'}`)
}, 60000) // 60秒超时