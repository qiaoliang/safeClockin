# 前端自动化测试指南

本文档详细说明了前端项目中不同类型测试的目的、工作原理和运行方法。

## 📁 测试目录结构

```
tests/
├── unit/                    # 单元测试
│   ├── api-business-logic.test.js
│   └── userstore-unified-storage.test.js
├── integration/             # 集成测试
│   └── phone-registration-direct.test.js
├── e2e/                     # 端到端测试
│   └── phone-registration-e2e.test.js
├── setup.js                 # 单元测试配置
├── setup.integration.js     # 集成测试配置
├── vitest.config.js         # 单元测试配置文件
├── vitest.integration.config.js # 集成测试配置文件
└── phone-registration.test.config.js # 测试数据配置
```

## 🧪 测试类型详解

### 1. 单元测试 (Unit Tests)

**目录**: `tests/unit/`

**目的**:
- 测试纯前端逻辑，不依赖外部服务
- 验证组件、工具函数、状态管理的独立功能
- 确保代码模块按预期工作

**工作原理**:
- 使用 Vitest + Vue Test Utils
- 通过 Mock 隔离外部依赖
- 快速执行，通常毫秒级完成

**主要测试用例**:
- `api-business-logic.test.js` - API业务逻辑测试
- `userstore-unified-storage.test.js` - 用户状态管理测试

**运行方法**:
```bash
# 监听模式（文件变化自动重跑）
npm run test:unit

# 一次性运行
npm run test:unit:run
```

### 2. 集成测试 (Integration Tests)

**目录**: `tests/integration/`

**目的**:
- 测试前端与后端API的交互
- 验证HTTP请求、响应处理
- 模拟真实的网络环境

**工作原理**:
- 使用 MSW (Mock Service Worker) 拦截网络请求
- 在Service Worker层面模拟API响应
- 无需真实后端服务，完全独立运行

**核心技术栈**:
- **MSW**: 拦截和模拟HTTP请求
- **统一验证码**: `123456`
- **Mock服务器**: `http://localhost:9999`

**主要测试用例**:
- `phone-registration-direct.test.js` - 手机号注册流程测试

**测试覆盖范围**:
- ✅ 发送验证码API（成功/失败/格式验证）
- ✅ 手机号注册API（成功/验证码错误/密码强度）
- ✅ 错误处理（网络错误/服务器错误）
- ✅ 性能测试（响应时间验证）
- ✅ 边界情况（无效输入/并发请求）

**运行方法**:
```bash
# 监听模式（推荐开发时使用）
npm run test:func

# 一次性运行（推荐CI/CD使用）
npm run test:func:run
```

**配置文件**:
- `setup.integration.js` - MSW配置和API处理器
- `vitest.integration.config.js` - 集成测试专用配置

### 3. 端到端测试 (E2E Tests)

**目录**: `tests/e2e/`

**目的**:
- 模拟真实用户交互流程
- 测试完整的用户场景
- 验证UI组件和用户行为

**工作原理**:
- 使用 Vue Test Utils 挂载组件
- 模拟用户操作（点击、输入等）
- 验证UI状态变化和用户反馈

**主要测试用例**:
- `phone-registration-e2e.test.js` - 手机号注册UI交互测试

**运行方法**:
```bash
# 运行E2E测试
npm test -- phone-registration-e2e.test.js --run
```

## 🚀 快速开始

### 运行所有测试

```bash
# 运行单元测试
npm run test:unit:run

# 运行集成测试
npm run test:func:run

# 运行E2E测试
npm test -- phone-registration-e2e.test.js --run
```

### 开发模式测试

```bash
# 单元测试监听模式
npm run test:unit

# 集成测试监听模式
npm run test:func
```

### 运行特定测试文件

```bash
# 运行单个单元测试
npm test -- userstore-unified-storage.test.js --run

# 运行单个集成测试
npm test -- phone-registration-direct.test.js --config vitest.integration.config.js --run
```

## 📊 测试配置详解

### 单元测试配置 (`vitest.config.js`)

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    // 排除集成测试
    exclude: ['**/integration/**', '**/e2e/**']
  }
})
```

### 集成测试配置 (`vitest.integration.config.js`)

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.integration.js'],
    // 只运行集成测试
    include: ['tests/integration/**/*.test.js']
  }
})
```

### MSW配置 (`setup.integration.js`)

```javascript
import { setupServer } from 'msw/node'
import { http } from 'msw'

// 统一测试验证码
export const TEST_VERIFICATION_CODE = '123456'

// API处理器
export const apiHandlers = [
  http.post('/api/sms/send_code', async ({ request }) => {
    const { phone } = await request.json()
    // 验证逻辑和响应模拟
  }),
  http.post('/api/auth/register_phone', async ({ request }) => {
    const { phone, code, password } = await request.json()
    // 注册逻辑验证
  })
]

// 启动Mock服务器
export const server = setupServer(...apiHandlers)
```

## 🎯 测试数据配置

### 统一测试数据 (`phone-registration.test.config.js`)

```javascript
export const TEST_CONFIG = {
  // 测试用手机号
  TEST_PHONE: '13800138000',
  
  // 测试用密码
  TEST_PASSWORD: 'Test123456',
  
  // 统一测试验证码
  TEST_VERIFICATION_CODE: '123456',
  
  // Mock响应数据
  MOCK_DATA: {
    SMS_SUCCESS: { code: 1, msg: '验证码发送成功' },
    REGISTER_SUCCESS: {
      code: 1,
      data: { token: 'test-token', user_id: 123 },
      msg: '注册成功'
    }
  }
}
```

## 🔧 调试和故障排除

### 查看测试详情

```bash
# 详细输出模式
npm run test:func:run --reporter=verbose

# 生成覆盖率报告
npm run test:func:run --coverage
```

### 调试单个测试

```javascript
// 在测试文件中使用console.log
console.log('用户状态:', userStore.$state)

// 使用vitest调试工具
import { test, expect } from 'vitest'

test('调试示例', () => {
  // 在浏览器中调试
  debugger
  expect(true).toBe(true)
})
```

### 常见问题解决

1. **测试失败: "uni is not defined"**
   ```bash
   # 确保在setup.js中正确mock了uni API
   ```

2. **MSW拦截失败**
   ```bash
   # 检查setup.integration.js是否正确配置
   # 确保在beforeAll中启动server
   ```

3. **测试数据污染**
   ```bash
   # 在beforeEach中清理状态
   userStore.forceClearUserState()
   ```

## 📈 测试最佳实践

### 1. 测试命名规范

```javascript
// ✅ 好的命名
describe('手机号注册流程', () => {
  test('应该成功发送验证码', () => {})
  test('应该拒绝无效的手机号', () => {})
})

// ❌ 避免的命名
test('test1', () => {})
test('注册测试', () => {})
```

### 2. 测试结构

```javascript
// 推荐的测试结构
describe('功能模块', () => {
  beforeEach(() => {
    // 准备测试数据
  })
  
  afterEach(() => {
    // 清理测试状态
  })
  
  test('具体测试用例', () => {
    // Arrange - 准备
    // Act - 执行
    // Assert - 验证
  })
})
```

### 3. Mock使用原则

```javascript
// ✅ 适当使用Mock
vi.mock('@/api/auth', () => ({
  authApi: {
    sendSmsCode: vi.fn()
  }
}))

// ❌ 过度Mock（集成测试中应避免）
// 集成测试应该使用MSW而不是直接Mock API
```

## 📋 测试检查清单

在提交代码前，确保：

- [ ] 所有单元测试通过: `npm run test:unit:run`
- [ ] 所有集成测试通过: `npm run test:func:run`
- [ ] 新功能有对应的测试用例
- [ ] 测试覆盖了主要功能路径
- [ ] 测试覆盖了错误处理场景
- [ ] 使用了统一的测试验证码 `123456`

## 🎉 总结

通过这套完整的测试体系，我们实现了：

- **快速反馈**: 单元测试毫秒级完成
- **API测试**: 集成测试完全独立，无需后端
- **用户验证**: E2E测试确保真实用户体验
- **持续集成**: 所有测试可在CI/CD中稳定运行

这套测试架构确保了代码质量和功能稳定性，同时保持了开发效率。