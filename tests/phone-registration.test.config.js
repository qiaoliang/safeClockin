// 手机号注册测试配置文件
export const TEST_CONFIG = {
  // 测试用手机号
  TEST_PHONE: '13800138000',
  
  // 测试用密码
  TEST_PASSWORD: 'Test123456',
  
  // 统一测试验证码
  TEST_VERIFICATION_CODE: '123456',
  
  // API超时设置
  API_TIMEOUT: 5000,
  
  // 测试环境设置
  ENVIRONMENT: 'test',
  
  // Mock数据
  MOCK_DATA: {
    // 成功发送验证码响应
    SMS_SUCCESS: {
      code: 1,
      msg: '验证码发送成功'
    },
    
    // 成功注册响应
    REGISTER_SUCCESS: {
      code: 1,
      data: {
        token: 'test-token-12345',
        refresh_token: 'test-refresh-token-67890',
        user_id: 12345,
        nickname: '测试用户',
        role: 'solo',
        phone: '13800138000',
        avatar_url: null,
        is_verified: false
      },
      msg: '注册成功'
    },
    
    // 验证码错误响应
    CODE_ERROR: {
      code: 0,
      msg: '验证码错误'
    },
    
    // 手机号已存在响应
    PHONE_EXISTS: {
      code: 0,
      msg: '手机号已注册'
    },
    
    // 密码强度不足响应
    PASSWORD_WEAK: {
      code: 0,
      msg: '密码至少8位，包含字母和数字'
    },
    
    // 网络错误
    NETWORK_ERROR: new Error('网络连接失败'),
    
    // 服务器错误
    SERVER_ERROR: new Error('服务器内部错误')
  },
  
  // 测试场景
  TEST_SCENARIOS: {
    // 正常注册流程
    NORMAL_REGISTRATION: 'normal_registration',
    
    // 验证码错误
    WRONG_CODE: 'wrong_code',
    
    // 密码强度不足
    WEAK_PASSWORD: 'weak_password',
    
    // 手机号已存在
    PHONE_EXISTS: 'phone_exists',
    
    // 网络异常
    NETWORK_ERROR: 'network_error',
    
    // 表单验证
    FORM_VALIDATION: 'form_validation'
  },
  
  // 性能基准
  PERFORMANCE_BENCHMARKS: {
    // API响应时间（毫秒）
    API_RESPONSE_TIME: 3000,
    
    // 完整注册流程时间（毫秒）
    REGISTRATION_FLOW_TIME: 5000,
    
    // 页面渲染时间（毫秒）
    PAGE_RENDER_TIME: 1000
  },
  
  // 测试数据清理配置
  CLEANUP_CONFIG: {
    // 测试后是否清理用户状态
    CLEANUP_USER_STATE: true,
    
    // 测试后是否清理Mock
    CLEANUP_MOCKS: true,
    
    // 测试后是否清理存储
    CLEANUP_STORAGE: true
  }
}

// 便捷的测试数据生成器
export const TestDataGenerator = {
  // 生成随机手机号
  generateRandomPhone() {
    const prefixes = ['138', '139', '150', '151', '152', '158', '159', '182', '183', '184']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
    return prefix + suffix
  },
  
  // 生成随机密码
  generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  },
  
  // 生成测试用户数据
  generateTestUser(overrides = {}) {
    return {
      phone: TEST_CONFIG.TEST_PHONE,
      password: TEST_CONFIG.TEST_PASSWORD,
      code: TEST_CONFIG.TEST_VERIFICATION_CODE,
      agree: true,
      ...overrides
    }
  }
}

// Mock工具函数
export const MockUtils = {
  // 设置API Mock
  setupApiMocks() {
    const { authApi } = require('@/api/auth')
    
    return {
      mockSendSmsCode: vi.spyOn(authApi, 'sendSmsCode'),
      mockRegisterPhone: vi.spyOn(authApi, 'registerPhone'),
      mockLoginPhone: vi.spyOn(authApi, 'loginPhone')
    }
  },
  
  // 设置Uni API Mock
  setupUniMocks() {
    return {
      mockRequest: vi.spyOn(uni, 'request'),
      mockShowToast: vi.spyOn(uni, 'showToast'),
      mockShowModal: vi.spyOn(uni, 'showModal'),
      mockNavigateTo: vi.spyOn(uni, 'navigateTo'),
      mockRedirectTo: vi.spyOn(uni, 'redirectTo'),
      mockReLaunch: vi.spyOn(uni, 'reLaunch'),
      mockGetStorageSync: vi.spyOn(uni, 'getStorageSync'),
      mockSetStorageSync: vi.spyOn(uni, 'setStorageSync'),
      mockRemoveStorageSync: vi.spyOn(uni, 'removeStorageSync'),
      mockClearStorageSync: vi.spyOn(uni, 'clearStorageSync')
    }
  },
  
  // 清理所有Mock
  cleanupAllMocks() {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  }
}

// 测试断言工具
export const TestAssertions = {
  // 断言API调用
  assertApiCall(mockFn, expectedParams, expectedTimes = 1) {
    expect(mockFn).toHaveBeenCalledTimes(expectedTimes)
    if (expectedParams) {
      expect(mockFn).toHaveBeenCalledWith(expectedParams)
    }
  },
  
  // 断言Toast提示
  assertToast(expectedMessage, expectedIcon = 'none') {
    expect(uni.showToast).toHaveBeenCalledWith({
      title: expectedMessage,
      icon: expectedIcon
    })
  },
  
  // 断言用户状态
  assertUserState(userStore, expectedState) {
    Object.keys(expectedState).forEach(key => {
      expect(userStore[key]).toBe(expectedState[key])
    })
  },
  
  // 断言性能
  assertPerformance(startTime, maxDuration) {
    const duration = Date.now() - startTime
    expect(duration).toBeLessThan(maxDuration)
  }
}

// 测试报告生成器
export const TestReportGenerator = {
  // 生成测试报告
  generateReport(testResults) {
    const totalTests = testResults.length
    const passedTests = testResults.filter(result => result.passed).length
    const failedTests = totalTests - passedTests
    
    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        passRate: ((passedTests / totalTests) * 100).toFixed(2) + '%'
      },
      details: testResults,
      timestamp: new Date().toISOString()
    }
  },
  
  // 保存测试报告
  saveReport(report, filename = 'phone-registration-test-report.json') {
    // 在实际环境中可以保存到文件或发送到测试平台
    console.log('Test Report:', JSON.stringify(report, null, 2))
  }
}

export default TEST_CONFIG