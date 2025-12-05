// test/setup.js
import { vi } from 'vitest'

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