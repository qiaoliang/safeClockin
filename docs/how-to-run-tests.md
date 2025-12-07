# 前端自动化测试指南

本文档详细说明了前端项目中不同类型测试的目的、工作原理和运行方法。

## 📁 测试目录结构

```
tests/
├── unit/                    # 保存单元测试的目录
├── integration/             # 保存集成测试的目录（需要 Mock 后端的服务）
├── e2e/                     # 保存端到端测试（需要启动后端服务）
├── setup.js                 # 单元测试配置
├── setup.integration.js     # 集成测试配置
├── setup.e2e.js             # E2E测试配置（包含后端服务检查）
├── vitest.config.js         # 单元测试配置文件
├── vitest.integration.config.js # 集成测试配置文件
└── vitest.e2e.config.js     # E2E测试配置文件
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
- **Mock服务器**: 拦截所有 `localhost` 和 `127.0.0.1` 的请求（任意端口）


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
- 测试与真实后端服务的完整交互
- 验证API调用的实际响应
- 确保前后端接口兼容性

**工作原理**:
- 自动检查并启动后端服务（如果需要）
- 使用真实的网络请求
- 根据环境变量配置不同的后端地址

**环境配置**:
- 使用 `src/config/` 中的配置文件
- 支持 unit、func、uat、prod 四种环境
- 可通过 `BASE_URL_FOR_SAFEGUARD` 环境变量覆盖

**运行方法**:
```bash
# 自动检查并启动后端服务，然后运行所有E2E测试
npm run test:e2e:run

# 直接运行E2E测试（假设后端已启动）
npm run test:e2e:direct

# 监听模式运行E2E测试
npm run test:e2e
```

**辅助脚本**:
- `scripts/e2e-helper.sh` - 后端服务管理脚本
- `scripts/run-e2e-tests.sh` - E2E测试运行脚本

## 🌍 环境配置系统

### 配置文件结构

```
src/config/
├── index.js          # 主配置入口，根据环境变量选择配置
├── unit.js           # 单元测试环境
├── func.js           # 功能测试环境
├── uat.js            # UAT环境
└── prod.js           # 生产环境
```

### 环境变量

- `UNI_ENV`: 指定当前环境（unit/func/uat/prod）
- `BASE_URL_FOR_SAFEGUARD`: 覆盖默认API地址（主要用于测试）

## 🔨 微信小程序构建

### 构建命令

```bash
# 构建 func 环境的微信小程序
npm run build:func

# 构建 unit 环境的微信小程序
npm run build:unit

# 构建 uat 环境的微信小程序
npm run build:uat

# 构建 prod 环境的微信小程序
npm run build:prod
```

### 构建脚本工作原理

构建脚本 (`scripts/mpbuild.sh`) 会：

1. **清理旧构建**：删除 `src/unpackage/dist/build/mp-weixin` 目录
2. **动态修改配置**：
   - 根据 `UNI_ENV` 环境变量修改配置文件
   - func 环境使用 `http://localhost:9999` 作为 API baseURL
   - 生成简化的配置文件，避免 `process` 未定义错误
3. **执行构建**：使用 HBuilderX CLI 构建微信小程序
4. **验证输出**：确保 `app.json` 文件存在
5. **恢复源文件**：清理临时修改的配置文件

### 构建输出

构建完成后，微信小程序文件位于：
```
src/unpackage/dist/build/mp-weixin/
├── app.js
├── app.json
├── app.wxss
├── project.config.json
├── pages/
├── components/
├── static/
└── config/
    ├── index.js      # 简化后的配置，直接使用对应环境的配置
    ├── func.js       # func 环境配置（baseURL: http://localhost:9999）
    └── ...
```

### 微信开发者工具配置

如果微信开发者工具提示找不到 `app.json`：

1. 关闭微信开发者工具
2. 重新打开微信开发者工具
3. 使用"导入项目"功能
4. 选择项目路径：`src/unpackage/dist/build/mp-weixin`
5. 输入 AppID：`wx55a59cbcd4156ce4`

### 环境特定配置

- **func 环境**：
  - API baseURL: `http://localhost:9999`
  - 调试模式：开启
  - 适用于本地开发和功能测试

- **prod 环境**：
  - API baseURL: `https://flask-7pin-202852-6-1383741966.sh.run.tcloudbase.com`
  - 调试模式：关闭
  - 适用于生产环境

### 使用示例

```javascript
// 在代码中使用配置
import config, { getAPIBaseURL } from '@/config'

// 获取当前环境的API地址
const baseURL = getAPIBaseURL()

// 检查当前环境
console.log('当前环境:', config.env)
```

## 🚀 快速开始

### 运行所有测试

```bash
# 运行单元测试
npm run test:unit:run

# 运行集成测试
npm run test:func:run

# 运行E2E测试（自动管理后端服务）
npm run test:e2e:run
```

### 开发模式测试

```bash
# 单元测试监听模式
npm run test:unit

# 集成测试监听模式
npm run test:func

# E2E测试监听模式
npm run test:e2e
```

### 运行特定测试文件

```bash
# 运行单个单元测试
npm test -- userstore-unified-storage.test.js --run

# 运行单个集成测试
npm test -- phone-registration-direct.test.js --config vitest.integration.config.js --run

# 运行单个E2E测试
npm test -- real-backend-e2e.test.js --config vitest.e2e.config.js --run
```

## 🛠️ 后端服务管理

### 自动管理（推荐）

```bash
# E2E测试会自动检查并启动后端服务
npm run test:e2e:run
```

### 手动管理

```bash
# 检查后端服务状态
./scripts/e2e-helper.sh check

# 启动后端服务
./scripts/e2e-helper.sh start

# 停止后端服务
./scripts/e2e-helper.sh stop

# 重启后端服务
./scripts/e2e-helper.sh restart
```

### 自定义后端地址

```bash
# 使用自定义后端地址运行测试
BASE_URL_FOR_SAFEGUARD=http://localhost:9999 npm run test:e2e:run

# 使用远程后端服务
BASE_URL_FOR_SAFEGUARD=https://your-backend-server.com npm run test:e2e:run
```

## 📊 测试配置详解

### 单元测试配置 (`vitest.config.js`)

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    // 排除集成测试和E2E测试
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

### E2E测试配置 (`vitest.e2e.config.js`)

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.e2e.js'],
    // 只运行E2E测试
    include: ['tests/e2e/**/*.test.js'],
    testTimeout: 30000, // 增加超时时间
    hookTimeout: 30000
  }
})
```

### E2E测试设置 (`setup.e2e.js`)

```javascript
// E2E测试前检查后端服务是否启动
beforeAll(async () => {
  // 设置环境变量，确保使用 func 环境配置
  process.env.UNI_ENV = 'func'
  
  const backendUrl = process.env.BASE_URL_FOR_SAFEGUARD || 'http://localhost:8080'
  
  // 检查后端服务是否启动，最多重试10次
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch(`${backendUrl}/api/count`)
      if (response.ok) {
        console.log('✅ 后端服务已启动')
        return
      }
    } catch (error) {
      console.log(`❌ 后端服务未响应，重试中... (${i + 1}/10)`)
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  
  throw new Error(`❌ 后端服务未启动: ${backendUrl}`)
})
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

3. **E2E测试后端服务连接失败**
   ```bash
   # 检查后端服务是否启动
   ./scripts/e2e-helper.sh check
   
   # 手动启动后端服务
   ./scripts/e2e-helper.sh start
   ```

4. **配置未生效**
   ```bash
   # 检查环境变量
   echo $UNI_ENV
   
   # 清理缓存
   rm -rf node_modules/.cache
   npm install
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
// ✅ 适当使用Mock（单元测试）
vi.mock('@/api/auth', () => ({
  authApi: {
    sendSmsCode: vi.fn()
  }
}))

// ✅ 使用MSW（集成测试）
// 在setup.integration.js中配置API处理器

// ✅ 使用真实后端（E2E测试）
// 不使用Mock，直接请求真实后端服务
```

## 📋 测试检查清单

在提交代码前，确保：

- [ ] 所有单元测试通过: `npm run test:unit:run`
- [ ] 所有集成测试通过: `npm run test:func:run`
- [ ] 所有E2E测试通过: `npm run test:e2e:run`
- [ ] 新功能有对应的测试用例
- [ ] 测试覆盖了主要功能路径
- [ ] 测试覆盖了错误处理场景
- [ ] 使用了统一的测试验证码 `123456`
- [ ] 配置系统测试通过: `npm run test:unit:run -- tests/unit/config.test.js`

## 🎉 总结

通过这套完整的测试体系，我们实现了：

- **快速反馈**: 单元测试毫秒级完成
- **API测试**: 集成测试完全独立，无需后端
- **真实验证**: E2E测试确保与真实后端的兼容性
- **环境隔离**: 配置系统支持多环境测试
- **自动化**: 后端服务自动管理，减少手动操作
- **持续集成**: 所有测试可在CI/CD中稳定运行

这套测试架构确保了代码质量和功能稳定性，同时保持了开发效率。通过环境配置系统，我们可以轻松地在不同环境之间切换，确保应用在各种场景下都能正常工作。