import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { testUtils, server } from '../setup.integration.js'
import { http } from 'msw'

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

describe('前端集成测试 - 微信与手机注册流程优化', () => {
  beforeEach(() => {
    // 重置 uni API mock
    vi.clearAllMocks()
    
    // 设置默认的 uni API mock
    uni.request.mockImplementation(({ url, method, data, header }) => {
      // 直接返回 MSW 处理的结果
      return fetch(`http://localhost:9999${url}`, {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...header
        },
        body: data ? JSON.stringify(data) : undefined
      }).then(async (response) => {
        const responseData = await response.json()
        return {
          statusCode: response.status,
          data: responseData
        }
      })
    })
    
    uni.showToast.mockReturnValue(true)
    uni.getStorageSync.mockReturnValue(null)
    uni.setStorageSync.mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 响应转换函数（与auth.js中的逻辑相同）
  function transformResponse(response) {
    if (response && response.code === 1 && response.data) {
      const transformedData = {};
      for (const [key, value] of Object.entries(response.data)) {
        if (key === 'user_id') {
          transformedData['userId'] = value;
        } else if (key === 'wechat_openid') {
          transformedData['wechatOpenid'] = value;
        } else if (key === 'phone_number') {
          transformedData['phoneNumber'] = value;
        } else if (key === 'avatar_url') {
          transformedData['avatarUrl'] = value;
        } else if (key === 'refresh_token') {
          transformedData['refreshToken'] = value;
        } else if (key === 'login_type') {
          transformedData['loginType'] = value;
          transformedData['isNewUser'] = value === 'new_user';
        } else {
          transformedData[key] = value;
        }
      }
      response.data = transformedData;
    }
    return response;
  }

  describe('响应转换逻辑测试', () => {
    it('应该正确转换微信登录响应', () => {
      const mockWechatLogin = {
        code: 1,
        data: {
          token: 'wx_token_123',
          refresh_token: 'wx_refresh_456',
          user_id: 1001,
          wechat_openid: 'wx_openid_789',
          phone_number: null,
          nickname: '微信用户',
          avatar_url: 'http://wx.qlogo.cn/mmopen/xxx',
          role: 'solo',
          login_type: 'existing_user'
        },
        msg: 'success'
      }
      
      const transformed = transformResponse(mockWechatLogin)
      
      // 验证关键字段
      const hasWechatFields = ['token', 'refreshToken', 'userId', 'wechatOpenid', 'loginType', 'isNewUser']
        .every(field => field in transformed.data)
      
      expect(hasWechatFields).toBe(true)
      expect(transformed.data.loginType).toBe('existing_user')
      expect(transformed.data.isNewUser).toBe(false)
    })

    it('应该正确转换新用户注册响应', () => {
      const mockPhoneRegister = {
        code: 1,
        data: {
          token: 'phone_token_123',
          refresh_token: 'phone_refresh_456',
          user_id: 1002,
          wechat_openid: 'phone_new_789',
          phone_number: '138****0001',
          nickname: '新用户',
          avatar_url: null,
          role: 'solo',
          login_type: 'new_user'
        },
        msg: 'success'
      }
      
      const transformed = transformResponse(mockPhoneRegister)
      
      expect(transformed.data.loginType).toBe('new_user')
      expect(transformed.data.isNewUser).toBe(true)
    })

    it('应该处理手机号已存在的错误响应', () => {
      const mockPhoneExists = {
        code: 0,
        data: {
          code: 'PHONE_EXISTS'
        },
        msg: '该手机号已注册，请直接登录'
      }
      
      // 模拟前端处理逻辑
      const isPhoneExistsError = mockPhoneExists.code === 0 && 
                               mockPhoneExists.data && 
                               mockPhoneExists.data.code === 'PHONE_EXISTS'
      
      expect(isPhoneExistsError).toBe(true)
    })
  })

  describe('用户状态管理测试', () => {
    it('应该正确管理登录后的用户状态', () => {
      const mockUserStore = {
        userState: {
          auth: {},
          profile: {}
        }
      }
      
      const mockWechatLogin = {
        code: 1,
        data: {
          token: 'wx_token_123',
          refresh_token: 'wx_refresh_456',
          user_id: 1001,
          wechat_openid: 'wx_openid_789',
          phone_number: null,
          nickname: '微信用户',
          avatar_url: 'http://wx.qlogo.cn/mmopen/xxx',
          role: 'solo',
          login_type: 'existing_user'
        },
        msg: 'success'
      }
      
      // 模拟userStore.login处理逻辑
      function simulateLogin(apiResponse) {
        const transformed = transformResponse(apiResponse)
        mockUserStore.userState.auth = {
          token: transformed.data?.token,
          refreshToken: transformed.data?.refreshToken || transformed.data?.refresh_token
        }
        
        mockUserStore.userState.profile = {
          userId: transformed.data?.userId || transformed.data?.user_id,
          nickname: transformed.data?.nickname,
          avatarUrl: transformed.data?.avatarUrl || transformed.data?.avatar_url,
          role: transformed.data?.role,
          phone: transformed.data?.phoneNumber || transformed.data?.phone_number,
          wechatOpenid: transformed.data?.wechatOpenid || transformed.data?.wechat_openid
        }
        
        return mockUserStore
      }
      
      const afterLogin = simulateLogin(mockWechatLogin)
      
      // 验证兼容性
      const hasValidProfile = !!afterLogin.userState.profile.userId && 
                            !!afterLogin.userState.profile.wechatOpenid
      
      expect(hasValidProfile).toBe(true)
      expect(afterLogin.userState.auth.token).toBe('wx_token_123')
      expect(afterLogin.userState.auth.refreshToken).toBe('wx_refresh_456')
      expect(afterLogin.userState.profile.userId).toBe(1001)
      expect(afterLogin.userState.profile.wechatOpenid).toBe('wx_openid_789')
    })
  })

  describe('账号合并场景测试', () => {
    it('应该处理账号合并场景', async () => {
      // 模拟账号合并的API响应
      server.use(
        http.post('http://localhost:9999/api/auth/merge_account', async () => {
          return Response.json({
            code: 1,
            data: {
              message: '账号已合并',
              merged_user_id: 1004,
              original_wechat_id: 'wx_openid_789',
              bound_phone_id: 'phone_user_456'
            },
            msg: 'success'
          })
        })
      )
      
      const response = await uni.request({
        url: '/api/auth/merge_account',
        method: 'POST',
        data: {
          wechat_openid: 'wx_openid_789',
          phone_number: '13800138000'
        }
      })
      
      expect(response.statusCode).toBe(200)
      expect(response.data.code).toBe(1)
      expect(response.data.data.message).toBe('账号已合并')
    })
  })

  describe('完整注册登录流程测试', () => {
    it('应该完成微信登录流程', async () => {
      // 模拟微信登录API
      server.use(
        http.post('http://localhost:9999/api/auth/wechat_login', async () => {
          return Response.json({
            code: 1,
            data: {
              token: 'wx_token_123',
              refresh_token: 'wx_refresh_456',
              user_id: 1001,
              wechat_openid: 'wx_openid_789',
              phone_number: null,
              nickname: '微信用户',
              avatar_url: 'http://wx.qlogo.cn/mmopen/xxx',
              role: 'solo',
              login_type: 'existing_user'
            },
            msg: 'success'
          })
        })
      )
      
      const response = await uni.request({
        url: '/api/auth/wechat_login',
        method: 'POST',
        data: {
          code: 'wx_auth_code'
        }
      })
      
      expect(response.statusCode).toBe(200)
      expect(response.data.code).toBe(1)
      
      const transformed = transformResponse(response.data)
      expect(transformed.data.loginType).toBe('existing_user')
      expect(transformed.data.isNewUser).toBe(false)
    })

    it('应该完成手机号注册流程', async () => {
      const phone = '13800138000'
      const password = 'Test123456'
      
      // 1. 发送验证码
      const smsResponse = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: phone,
          purpose: 'register'
        }
      })
      
      expect(smsResponse.statusCode).toBe(200)
      expect(smsResponse.data.code).toBe(1)
      
      // 2. 注册用户
      const registerResponse = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: {
          phone: phone,
          code: '123456',
          password: password
        }
      })
      
      expect(registerResponse.statusCode).toBe(200)
      expect(registerResponse.data.code).toBe(1)
      
      const transformed = transformResponse(registerResponse.data)
      expect(transformed.data.loginType).toBe('new_user')
      expect(transformed.data.isNewUser).toBe(true)
    })

    it('应该处理手机号登录流程', async () => {
      const phone = '13800138001'
      
      // 1. 发送验证码
      const smsResponse = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: phone,
          purpose: 'login'
        }
      })
      
      expect(smsResponse.statusCode).toBe(200)
      expect(smsResponse.data.code).toBe(1)
      
      // 2. 登录用户
      const loginResponse = await uni.request({
        url: '/api/auth/login_phone',
        method: 'POST',
        data: {
          phone: phone,
          code: '123456'
        }
      })
      
      expect(loginResponse.statusCode).toBe(200)
      expect(loginResponse.data.code).toBe(1)
      
      const transformed = transformResponse(loginResponse.data)
      expect(transformed.data.loginType).toBe('existing_user')
      expect(transformed.data.isNewUser).toBe(false)
    })
  })

  describe('错误处理和边界情况测试', () => {
    it('应该处理网络错误', async () => {
      testUtils.mockApiError('/api/auth/wechat_login', '网络连接失败')
      
      const response = await uni.request({
        url: '/api/auth/wechat_login',
        method: 'POST',
        data: {
          code: 'wx_auth_code'
        }
      })
      
      expect(response.statusCode).toBe(500)
      expect(response.data.code).toBe(0)
      expect(response.data.msg).toBe('网络连接失败')
    })

    it('应该处理API响应格式错误', () => {
      const malformedResponse = {
        code: 1,
        // 缺少data字段
        msg: 'success'
      }
      
      // 应该不会抛出错误
      expect(() => transformResponse(malformedResponse)).not.toThrow()
      
      const transformed = transformResponse(malformedResponse)
      expect(transformed).toEqual(malformedResponse)
    })

    it('应该处理空响应', () => {
      const emptyResponse = null
      const undefinedResponse = undefined
      
      expect(() => transformResponse(emptyResponse)).not.toThrow()
      expect(() => transformResponse(undefinedResponse)).not.toThrow()
      
      expect(transformResponse(emptyResponse)).toBe(null)
      expect(transformResponse(undefinedResponse)).toBe(undefined)
    })

    it('应该处理失败响应', () => {
      const errorResponse = {
        code: 0,
        data: {
          error: '登录失败'
        },
        msg: '用户名或密码错误'
      }
      
      const transformed = transformResponse(errorResponse)
      expect(transformed).toEqual(errorResponse)
    })
  })

  describe('性能和兼容性测试', () => {
    it('响应转换应该在合理时间内完成', () => {
      const largeResponse = {
        code: 1,
        data: {
          token: 'token'.repeat(1000),
          refresh_token: 'refresh'.repeat(1000),
          user_id: 1001,
          wechat_openid: 'openid'.repeat(100),
          phone_number: '13800138000',
          nickname: '用户'.repeat(100),
          avatar_url: 'url'.repeat(100),
          role: 'solo',
          login_type: 'existing_user'
        },
        msg: 'success'
      }
      
      const startTime = Date.now()
      const transformed = transformResponse(largeResponse)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(100) // 应该在100ms内完成
      expect(transformed.data.userId).toBe(1001)
      expect(transformed.data.wechatOpenid).toBe('openid'.repeat(100))
    })

    it('应该保持向后兼容性', () => {
      const oldFormatResponse = {
        code: 1,
        data: {
          token: 'token',
          user_id: 1001,
          wechat_openid: 'openid'
        },
        msg: 'success'
      }
      
      const newFormatResponse = {
        code: 1,
        data: {
          token: 'token',
          userId: 1001,
          wechatOpenid: 'openid'
        },
        msg: 'success'
      }
      
      // 旧格式应该能正确转换
      const transformedOld = transformResponse(oldFormatResponse)
      expect(transformedOld.data.userId).toBe(1001)
      expect(transformedOld.data.wechatOpenid).toBe('openid')
      
      // 新格式应该保持不变
      const transformedNew = transformResponse(newFormatResponse)
      expect(transformedNew.data.userId).toBe(1001)
      expect(transformedNew.data.wechatOpenid).toBe('openid')
    })
  })
})

// 导出测试工具函数
export const FrontendIntegrationUtils = {
  // 响应转换函数
  transformResponse(response) {
    if (response && response.code === 1 && response.data) {
      const transformedData = {};
      for (const [key, value] of Object.entries(response.data)) {
        if (key === 'user_id') {
          transformedData['userId'] = value;
        } else if (key === 'wechat_openid') {
          transformedData['wechatOpenid'] = value;
        } else if (key === 'phone_number') {
          transformedData['phoneNumber'] = value;
        } else if (key === 'avatar_url') {
          transformedData['avatarUrl'] = value;
        } else if (key === 'refresh_token') {
          transformedData['refreshToken'] = value;
        } else if (key === 'login_type') {
          transformedData['loginType'] = value;
          transformedData['isNewUser'] = value === 'new_user';
        } else {
          transformedData[key] = value;
        }
      }
      response.data = transformedData;
    }
    return response;
  },

  // 验证转换结果
  validateTransformedResponse(response, expectedFields = []) {
    const hasRequiredFields = expectedFields.every(field => field in response.data)
    return {
      success: response.code === 1,
      hasRequiredFields,
      fieldCount: Object.keys(response.data).length
    }
  },

  // 清理测试环境
  async cleanup() {
    server.resetHandlers()
    vi.clearAllMocks()
  }
}