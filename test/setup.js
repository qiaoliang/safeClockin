// test/setup.js
import { vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// 初始化 Pinia
const pinia = createPinia()
setActivePinia(pinia)

// Mock secure.js utilities
vi.mock('@/utils/secure', () => ({
  SENSITIVE_KEYS: ['userState', 'token', 'refreshToken', 'userInfo', 'cached_user_info', 'secure_seed'],
  encodeObject: vi.fn((obj) => JSON.stringify(obj)),
  decodeObject: vi.fn((str) => JSON.parse(str))
}))

// 检查后端服务是否启动的函数
async function checkBackendService() {
  const backendPort = 9999
  const backendHost = 'localhost'
  
  return new Promise((resolve) => {
    const req = require('http').request({
      hostname: backendHost,
      port: backendPort,
      path: '/api/count',
      method: 'GET',
      timeout: 10000 // 等待10秒
    }, (res) => {
      resolve(true)
    })
    
    req.on('error', () => {
      resolve(false)
    })
    
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    
    req.end()
  })
}

// 在所有测试开始前检查后端服务
beforeAll(async () => {
  console.log('🔍 检查后端服务状态...')
  
  const isBackendRunning = await checkBackendService()
  
  if (!isBackendRunning) {
    console.error('❌ 后端服务未启动！')
    console.error('请先启动后端服务：')
    console.error('1. cd backend')
    console.error('2. source venv_py312/bin/activate')
    console.error('3. python run.py 0.0.0.0 9999')
    console.error('4. 等待服务启动完成后重新运行测试')
    process.exit(1)
  }
  
  console.log('✅ 后端服务运行正常')
})

// Mock uni-app APIs
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
  request: vi.fn(({ success }) => {
    // Default successful response
    if (success) {
      success({
        statusCode: 200,
        data: { code: 1, data: {}, msg: 'success' }
      })
    }
  }),
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