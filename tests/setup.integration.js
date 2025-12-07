import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http } from 'msw'
import { createPinia, setActivePinia } from 'pinia'

// Mock uni API
global.uni = {
  request: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  clearStorageSync: vi.fn()
}

// 统一测试验证码
export const TEST_VERIFICATION_CODE = '123456'

// Mock 服务器基础URL - 使用通配符匹配所有localhost和127.0.0.1的请求
const API_BASE_URL = 'http://localhost:9999'

// 定义 API handlers - 使用正则表达式匹配所有localhost和127.0.0.1的请求
export const apiHandlers = [
  // 发送短信验证码
  http.post(/http:\/\/(localhost|127\.0\.0\.1):\d+\/api\/sms\/send_code/, async ({ request }) => {
    const { phone } = await request.json()
    
    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return Response.json({
        code: 0,
        data: {},
        msg: '手机号格式错误'
      }, { status: 400 })
    }
    
    // 模拟发送成功
    return Response.json({
      code: 1,
      data: {},
      msg: '验证码发送成功'
    })
  }),

  // 手机号注册
  http.post(/http:\/\/(localhost|127\.0\.0\.1):\d+\/api\/auth\/register_phone/, async ({ request }) => {
    const { phone, code, password } = await request.json()
    
    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return Response.json({
        code: 0,
        data: {},
        msg: '手机号格式错误'
      }, { status: 400 })
    }
    
    // 验证验证码
    if (code !== TEST_VERIFICATION_CODE) {
      return Response.json({
        code: 0,
        data: {},
        msg: '验证码错误'
      }, { status: 400 })
    }
    
    // 验证密码强度
    if (!password || password.length < 8 || !/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return Response.json({
        code: 0,
        data: {},
        msg: '密码至少8位，包含字母和数字'
      }, { status: 400 })
    }
    
    // 模拟重复注册检查（简单模拟）
    if (phone === '13900139000') {
      return Response.json({
        code: 0,
        data: {},
        msg: '手机号已注册'
      }, { status: 400 })
    }
    
    // 注册成功
    return Response.json({
      code: 1,
      data: {
        token: 'test-jwt-token-' + Date.now(),
        refresh_token: 'test-refresh-token-' + Date.now(),
        user_id: Math.floor(Math.random() * 1000) + 1,
        nickname: '新用户',
        role: 'solo',
        phone: phone,
        login_type: 'new_user'
      },
      msg: '注册成功'
    })
  }),

  // 手机号登录
  http.post(/http:\/\/(localhost|127\.0\.0\.1):\d+\/api\/auth\/login_phone/, async ({ request }) => {
    const { phone, code } = await request.json()
    
    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return Response.json({
        code: 0,
        data: {},
        msg: '手机号格式错误'
      }, { status: 400 })
    }
    
    // 验证验证码
    if (code !== TEST_VERIFICATION_CODE) {
      return Response.json({
        code: 0,
        data: {},
        msg: '验证码错误'
      }, { status: 400 })
    }
    
    // 登录成功
    return Response.json({
      code: 1,
      data: {
        token: 'test-jwt-token-' + Date.now(),
        refresh_token: 'test-refresh-token-' + Date.now(),
        user_id: Math.floor(Math.random() * 1000) + 1,
        nickname: '测试用户',
        role: 'solo',
        phone: phone,
        login_type: 'existing_user'
      },
      msg: '登录成功'
    })
  }),

  // 获取用户信息
  http.get(/http:\/\/(localhost|127\.0\.0\.1):\d+\/api\/user\/profile/, ({ request }) => {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({
        code: 0,
        data: {},
        msg: '未授权访问'
      }, { status: 401 })
    }
    
    return Response.json({
      code: 1,
      data: {
        user_id: 123,
        wechat_openid: 'test-openid',
        phone_number: '13800138000',
        nickname: '测试用户',
        avatar_url: 'https://example.com/avatar.jpg',
        role: 'solo',
        community_id: null,
        status: 'active'
      },
      msg: 'success'
    })
  }),

  // 更新用户信息
  http.post(/http:\/\/(localhost|127\.0\.0\.1):\d+\/api\/user\/profile/, ({ request }) => {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({
        code: 0,
        data: {},
        msg: '未授权访问'
      }, { status: 401 })
    }
    
    return Response.json({
      code: 1,
      data: {
        message: '用户信息更新成功'
      },
      msg: 'success'
    })
  })
]

// 设置 mock 服务器
export const server = setupServer(...apiHandlers)

// 全局测试设置
let globalPinia

beforeAll(() => {
  // 启动 mock 服务器
  server.listen({
    onUnhandledRequest: 'error'
  })
  
  // 设置全局 Pinia
  globalPinia = createPinia()
  setActivePinia(globalPinia)
})

// 每个测试后重置 handlers
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})

// 所有测试后关闭服务器
afterAll(() => {
  server.close()
})

// 导出测试工具函数
export const testUtils = {
  // 模拟网络延迟
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 创建测试用户数据
  createTestUser: (overrides = {}) => ({
    user_id: 123,
    nickname: '测试用户',
    phone: '13800138000',
    role: 'solo',
    ...overrides
  }),
  
  // 模拟 API 错误
  mockApiError: (endpoint, errorMessage = '服务器错误') => {
    // 将endpoint转换为正则表达式，匹配所有localhost和127.0.0.1
    const endpointPattern = endpoint.replace(/^\/api\//, '/api/')
    const regex = new RegExp(`http://(localhost|127\.0\.0\.1):\\d+${endpointPattern}`)
    
    server.use(
      http.post(regex, () => {
        return Response.json({
          code: 0,
          data: {},
          msg: errorMessage
        }, { status: 500 })
      })
    )
  },
  
  // 模拟网络延迟
  mockNetworkDelay: (endpoint, delay = 2000) => {
    // 将endpoint转换为正则表达式，匹配所有localhost和127.0.0.1
    const endpointPattern = endpoint.replace(/^\/api\//, '/api/')
    const regex = new RegExp(`http://(localhost|127\.0\.0\.1):\\d+${endpointPattern}`)
    
    server.use(
      http.post(regex, async () => {
        await testUtils.delay(delay)
        return Response.json({
          code: 1,
          data: {},
          msg: 'success'
        })
      })
    )
  }
}