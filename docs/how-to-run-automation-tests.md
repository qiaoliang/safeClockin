# 如何编写和运行自动化测试

本文档将指导您如何编写和方便地运行 SafeGuard 前端项目的自动化测试。

## 📋 目录

- [测试架构概览](#测试架构概览)
- [快速开始](#快速开始)
- [编写单元测试](#编写单元测试)
- [编写集成测试](#编写集成测试)
- [编写端到端测试](#编写端到端测试)
- [运行测试](#运行测试)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 测试架构概览

SafeGuard 前端采用三层测试架构：

```
tests/
├── unit/                    # 单元测试 - 测试独立函数和组件
├── integration/             # 集成测试 - 测试API交互
├── e2e/                     # 端到端测试 - 测试真实后端交互
├── setup.js                 # 单元测试环境配置
├── setup.integration.js     # 集成测试环境配置
├── setup.e2e.js             # E2E测试环境配置
└── Makefile                 # 测试命令统一入口
```

### 测试类型对比

| 测试类型 | 速度 | 隔离性 | 真实性 | 适用场景 |
|---------|------|--------|--------|----------|
| 单元测试 | ⚡ 毫秒级 | 🔄 完全隔离 | 🎭 Mock | 函数逻辑、工具类 |
| 集成测试 | 🔥 秒级 | 🌐 API Mock | 🔧 模拟环境 | API交互、数据流 |
| 端到端测试 | 🐌 分钟级 | 🌍 真实环境 | ✅ 完全真实 | 完整业务流程 |

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 运行所有测试

```bash
# 使用 Makefile（推荐）
make test-all

# 或分别运行
make test-unit
make test-integration
make test-e2e
```

### 3. 查看可用命令

```bash
make help
```

## 编写单元测试

单元测试专注于测试独立的函数和组件，不依赖外部服务。

### 基本结构

```javascript
// tests/unit/example.test.js
import { describe, it, expect, beforeEach } from 'vitest'

describe('功能模块名称', () => {
  beforeEach(() => {
    // 测试前的准备工作
  })

  it('应该完成特定功能', () => {
    // Arrange - 准备测试数据
    const input = 'test input'
    
    // Act - 执行被测试的函数
    const result = functionToTest(input)
    
    // Assert - 验证结果
    expect(result).toBe('expected output')
  })
})
```

### 实际示例

```javascript
// tests/unit/utils.test.js
import { describe, it, expect } from 'vitest'

describe('工具函数测试', () => {
  describe('手机号验证', () => {
    it('应该验证有效的手机号', () => {
      const validatePhone = (phone) => /^1[3-9]\d{9}$/.test(phone)
      
      expect(validatePhone('13800138000')).toBe(true)
      expect(validatePhone('18900138999')).toBe(true)
    })

    it('应该拒绝无效的手机号', () => {
      const validatePhone = (phone) => /^1[3-9]\d{9}$/.test(phone)
      
      expect(validatePhone('12800138000')).toBe(false)
      expect(validatePhone('1380013800')).toBe(false)
    })
  })

  describe('日期格式化', () => {
    it('应该正确格式化日期', () => {
      const formatDate = (date) => {
        const d = new Date(date)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
      
      expect(formatDate('2023-12-01')).toBe('2023-12-01')
      expect(formatDate('2023-1-1')).toBe('2023-01-01')
    })
  })
})
```

### Mock 使用

```javascript
// tests/unit/auth.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authApi } from '@/api/auth'

// Mock API 模块
vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn()
  }
}))

describe('认证功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该成功登录', async () => {
    // Mock API 响应
    authApi.login.mockResolvedValue({
      code: 1,
      data: { token: 'test-token' }
    })

    // 执行登录
    const result = await authApi.login({ code: 'test-code' })

    // 验证结果
    expect(result.code).toBe(1)
    expect(authApi.login).toHaveBeenCalledWith({ code: 'test-code' })
  })
})
```

## 编写集成测试

集成测试使用 MSW (Mock Service Worker) 模拟 API 响应，测试前后端交互。

### 基本结构

```javascript
// tests/integration/example.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { server } from '../setup.integration.js'

describe('API 集成测试', () => {
  beforeEach(() => {
    // 每个测试前重置处理程序
    server.resetHandlers()
  })

  afterEach(() => {
    // 清理工作
  })

  it('应该与 API 正确交互', async () => {
    // 测试代码
  })
})
```

### 实际示例

```javascript
// tests/integration/phone-registration.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { TEST_VERIFICATION_CODE, testUtils, server } from '../setup.integration.js'
import { http } from 'msw'

describe('手机注册集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resetHandlers()
  })

  describe('发送验证码', () => {
    it('应该成功发送验证码', async () => {
      const response = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: '13800138000',
          purpose: 'register'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.data.code).toBe(1)
      expect(response.data.msg).toBe('验证码发送成功')
    })

    it('应该拒绝无效手机号', async () => {
      const response = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: '123456',
          purpose: 'register'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.data.code).toBe(0)
      expect(response.data.msg).toBe('手机号格式错误')
    })
  })

  describe('自定义 API 响应', () => {
    it('应该处理自定义错误', async () => {
      // 临时覆盖 API 响应
      server.use(
        http.post('/api/sms/send_code', () => {
          return Response.json({
            code: 0,
            msg: '服务暂时不可用'
          }, { status: 503 })
        })
      )

      const response = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: {
          phone: '13800138000',
          purpose: 'register'
        }
      })

      expect(response.statusCode).toBe(503)
      expect(response.data.msg).toBe('服务暂时不可用')
    })
  })
})
```

### 测试工具函数

```javascript
// tests/integration/test-utils.js
import { TEST_VERIFICATION_CODE } from '../setup.integration.js'

export const PhoneTestUtils = {
  // 模拟完整注册流程
  async simulateFullRegistration(phone = '13800138000', password = 'Test123456') {
    try {
      // 1. 发送验证码
      const smsResponse = await uni.request({
        url: '/api/sms/send_code',
        method: 'POST',
        data: { phone, purpose: 'register' }
      })
      
      if (smsResponse.data.code !== 1) {
        return { success: false, error: smsResponse.data.msg, step: 'sms' }
      }

      // 2. 注册用户
      const registerResponse = await uni.request({
        url: '/api/auth/register_phone',
        method: 'POST',
        data: { phone, code: TEST_VERIFICATION_CODE, password }
      })

      if (registerResponse.data.code !== 1) {
        return { success: false, error: registerResponse.data.msg, step: 'register' }
      }

      return { success: true, data: registerResponse.data.data }
    } catch (error) {
      return { success: false, error: error.message, step: 'exception' }
    }
  },

  // 验证注册结果
  validateRegistrationResult(result, expectedPhone) {
    return {
      success: result.success,
      hasToken: !!result.data?.token,
      hasUserId: !!result.data?.user_id,
      correctPhone: result.data?.phone === expectedPhone,
      correctRole: result.data?.role === 'solo'
    }
  }
}
```

## 编写端到端测试

端到端测试连接真实后端服务，验证完整的业务流程。

### 基本结构

```javascript
// tests/e2e/example.test.js
import { describe, it, expect, beforeEach } from 'vitest'

describe('端到端测试', () => {
  beforeEach(() => {
    // 清理存储和状态
    global.uni.getStorageSync.mockReturnValue(null)
    global.storage.get.mockReturnValue(null)
  })

  it('应该完成完整的业务流程', async () => {
    // 测试真实后端交互
  })
})
```

### 实际示例

```javascript
// tests/e2e/phone-registration-real.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { request } from '@/api/request.js'

describe('手机注册真实后端测试', () => {
  const TEST_PHONE = '13800138999'
  const TEST_CODE = '123456' // 调试验证码

  beforeEach(() => {
    // 清理认证状态
    global.uni.getStorageSync.mockReturnValue(null)
  })

  it('应该能够发送验证码', async () => {
    const response = await request({
      url: '/api/sms/send_code',
      method: 'POST',
      data: {
        phone: TEST_PHONE,
        purpose: 'register'
      },
      header: {
        'X-Debug-Code': '1' // 启用调试模式
      },
      suppressErrorLog: true
    })

    expect(response.code).toBe(1)
    expect(response.data.message).toBe('验证码已发送')
    expect(response.data.debug_code).toBe(TEST_CODE)
  })

  it('应该能够注册新用户', async () => {
    // 先发送验证码
    await request({
      url: '/api/sms/send_code',
      method: 'POST',
      data: {
        phone: TEST_PHONE,
        purpose: 'register'
      },
      header: { 'X-Debug-Code': '1' },
      suppressErrorLog: true
    })

    // 使用验证码注册
    const response = await request({
      url: '/api/auth/register_phone',
      method: 'POST',
      data: {
        phone: TEST_PHONE,
        code: TEST_CODE,
        nickname: 'E2E测试用户',
        password: 'Test123456'
      },
      suppressErrorLog: true
    })

    expect(response.code).toBe(1)
    expect(response.data.token).toBeDefined()
    expect(response.data.user_id).toBeDefined()
  })
})
```

### 环境配置

```javascript
// tests/e2e/env-config.test.js
import { describe, it, expect } from 'vitest'
import config, { getAPIBaseURL } from '@/config'

describe('环境配置测试', () => {
  it('应该使用正确的环境配置', () => {
    // E2E 测试默认使用 func 环境
    expect(config.env).toBe('func')
    expect(getAPIBaseURL()).toBe('http://localhost:9999')
  })

  it('应该支持环境变量覆盖', () => {
    // 测试环境变量覆盖
    const originalUrl = process.env.BASE_URL_FOR_SAFEGUARD
    process.env.BASE_URL_FOR_SAFEGUARD = 'http://test.example.com'
    
    // 重新导入配置
    delete require.cache[require.resolve('@/config')]
    const { getAPIBaseURL } = require('@/config')
    
    expect(getAPIBaseURL()).toBe('http://test.example.com')
    
    // 恢复原始配置
    process.env.BASE_URL_FOR_SAFEGUARD = originalUrl
  })
})
```

## 运行测试

### 使用 Makefile（推荐）

```bash
# 查看所有命令
make help

# 运行特定类型测试
make test-unit          # 单元测试
make test-integration   # 集成测试
make test-e2e          # 端到端测试

# 运行所有测试
make test-all

# 开发模式
make test-watch         # 监视模式运行单元测试
make test-quick         # 快速检查（仅单元测试）

# 高级功能
make test-coverage      # 生成覆盖率报告
make test-performance   # 显示测试耗时
make test-ci           # CI/CD 严格模式
```

### 使用 npm 命令

```bash
# 单元测试
npm run test            # 监视模式
npm run test:run        # 一次性运行

# 集成测试
npm run test:func       # 监视模式
npm run test:func:run   # 一次性运行

# 端到端测试
npm run test:e2e        # 监视模式
npm run test:e2e:run    # 自动管理后端服务
npm run test:e2e:direct # 直接运行（需手动启动后端）
```

### 使用 vitest 直接运行

```bash
# 运行特定测试文件
npx vitest tests/unit/utils.test.js

# 运行特定配置
npx vitest --config vitest.integration.config.js

# 生成覆盖率报告
npx vitest --coverage

# 详细输出
npx vitest --reporter=verbose
```

## 最佳实践

### 1. 测试命名规范

```javascript
// ✅ 好的命名
describe('手机号注册流程', () => {
  test('应该成功发送验证码', () => {})
  test('应该拒绝无效的手机号格式', () => {})
  test('应该在网络错误时显示正确提示', () => {})
})

// ❌ 避免的命名
test('test1', () => {})
test('注册测试', () => {})
```

### 2. 测试结构（AAA 模式）

```javascript
test('应该正确计算用户年龄', () => {
  // Arrange - 准备
  const birthDate = '1990-01-01'
  const currentDate = '2023-01-01'
  
  // Act - 执行
  const age = calculateAge(birthDate, currentDate)
  
  // Assert - 验证
  expect(age).toBe(33)
})
```

### 3. 测试隔离

```javascript
describe('用户状态管理', () => {
  beforeEach(() => {
    // 每个测试前重置状态
    vi.clearAllMocks()
    userStore.$reset()
  })

  afterEach(() => {
    // 每个测试后清理
    server.resetHandlers()
  })
})
```

### 4. 测试数据管理

```javascript
// tests/fixtures/user-data.js
export const VALID_USER = {
  phone: '13800138000',
  password: 'Test123456',
  code: '123456'
}

export const INVALID_USER = {
  phone: '123456',
  password: '123'
}

// 在测试中使用
import { VALID_USER, INVALID_USER } from '../fixtures/user-data.js'

test('应该接受有效用户数据', () => {
  const result = validateUser(VALID_USER)
  expect(result.isValid).toBe(true)
})
```

### 5. 错误处理测试

```javascript
test('应该正确处理网络错误', async () => {
  // 模拟网络错误
  testUtils.mockApiError('/api/auth/login', '网络连接失败')
  
  const result = await login({ phone: '13800138000', code: '123456' })
  
  expect(result.success).toBe(false)
  expect(result.error).toBe('网络连接失败')
})
```

### 6. 异步测试

```javascript
test('应该正确处理异步操作', async () => {
  // 使用 async/await
  const result = await asyncFunction()
  
  // 或使用 Promise
  return asyncFunction().then(result => {
    expect(result).toBeDefined()
  })
})
```

## 常见问题

### Q: 测试失败："uni is not defined"

**A**: 确保在测试文件中导入了 setup 文件：

```javascript
// tests/setup.js 或对应的 setup 文件
global.uni = {
  request: vi.fn(),
  showToast: vi.fn(),
  // ... 其他 uni API
}
```

### Q: MSW 拦截失败

**A**: 检查 setup.integration.js 配置：

```javascript
// 确保在 beforeAll 中启动服务器
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error'
  })
})

// 确保在测试后重置
afterEach(() => {
  server.resetHandlers()
})
```

### Q: E2E 测试连接后端失败

**A**: 检查后端服务状态：

```bash
# 检查后端服务
make test-check

# 手动启动后端
cd ../backend
source venv_py312/bin/activate
python run.py 0.0.0.0 8080
```

### Q: 测试缓存问题

**A**: 清理缓存：

```bash
make test-clean

# 或手动清理
rm -rf node_modules/.cache/vitest/
rm -rf coverage/
```

### Q: 测试运行缓慢

**A**: 优化策略：

1. 使用 `test.skip()` 跳过不必要的测试
2. 并行运行测试：`npx vitest run --threads`
3. 使用更快的 Mock 策略
4. 减少不必要的异步等待

### Q: 如何测试 Vue 组件

**A**: 使用 Vue Test Utils：

```javascript
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

test('应该正确渲染组件', () => {
  const wrapper = mount(MyComponent, {
    props: {
      message: 'Hello World'
    }
  })
  
  expect(wrapper.text()).toContain('Hello World')
})
```

## 进阶技巧

### 1. 自定义匹配器

```javascript
import { expect } from 'vitest'

// 自定义匹配器
expect.extend({
  toBeValidPhone(received) {
    const isValid = /^1[3-9]\d{9}$/.test(received)
    return {
      pass: isValid,
      message: () => `expected ${received} to be a valid phone number`
    }
  }
})

// 使用自定义匹配器
test('手机号验证', () => {
  expect('13800138000').toBeValidPhone()
})
```

### 2. 测试覆盖率配置

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

### 3. 快照测试

```javascript
test('组件快照测试', () => {
  const wrapper = mount(MyComponent)
  expect(wrapper.html()).toMatchSnapshot()
})
```

### 4. 性能测试

```javascript
test('函数性能测试', () => {
  const startTime = performance.now()
  
  // 执行函数
  const result = expensiveFunction()
  
  const endTime = performance.now()
  const duration = endTime - startTime
  
  expect(duration).toBeLessThan(100) // 应该在 100ms 内完成
})
```

## 总结

通过本指南，您应该能够：

1. **编写三类测试**：单元、集成、端到端测试
2. **使用测试工具**：Vitest、MSW、Vue Test Utils
3. **运行测试命令**：Makefile、npm scripts、vitest
4. **遵循最佳实践**：命名规范、测试结构、错误处理
5. **解决常见问题**：配置、环境、调试技巧

记住：好的测试不仅验证功能正确性，更是代码设计的驱动力。保持测试简单、快速、可靠，让测试成为开发的助力而非负担。

---

📚 **相关文档**：
- [前端测试指南](./how-to-run-tests.md)
- [微信小程序构建指南](./how-to-build-mp-weixin.md)
- [API 文档](../backend/docs/API/API_in_summary.md)