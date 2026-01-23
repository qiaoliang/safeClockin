# Playwright 登录测试规范文档

## 文档信息
- **版本**: 1.0.0
- **创建日期**: 2026-01-23
- **最后更新**: 2026-01-23
- **作者**: TDD Orchestrator
- **状态**: Draft

---

## 目录
1. [问题分析](#问题分析)
2. [根本原因分析](#根本原因分析)
3. [测试场景](#测试场景)
4. [边界条件](#边界条件)
5. [验收标准](#验收标准)
6. [测试实施指南](#测试实施指南)
7. [故障排查指南](#故障排查指南)

---

## 1. 问题分析

### 1.1 当前问题描述

**症状**:
- Playwright E2E 测试在尝试登录时失败
- 错误信息: "未找到手机号登录按钮"
- 页面内容为空(页面没有正确加载)

**测试环境**:
- H5 应用运行在 `https://localhost:8081`
- 后端 API 运行在 `http://localhost:9999`
- 使用 Playwright 进行浏览器自动化测试

**涉及文件**:
- 测试辅助函数: `tests/e2e-playwright/helpers/auth.js`
- 登录页面: `src/pages/login/login.vue`
- 手机号登录页面: `src/pages/phone-login/phone-login.vue`

### 1.2 当前登录流程

```
1. 导航到登录页面 (/pages/login/login)
2. 点击"手机号登录"按钮 (data-testid="phone-login-button")
3. 跳转到手机号登录页面 (/pages/phone-login/phone-login?mode=login)
4. 切换到"密码登录"标签 (data-testid="tab-password-login")
5. 输入手机号 (data-testid="phone-input")
6. 输入密码 (data-testid="password-input")
7. 点击登录按钮 (data-testid="login-submit-button")
8. 验证跳转到首页
```

### 1.3 问题影响范围

**影响范围**:
- 所有依赖登录流程的 E2E 测试
- 用户注册测试
- 社区管理测试
- 监督邀请测试
- 事件管理测试

**失败率**: 目前未统计，但预计影响所有使用 `loginWithPhoneAndPassword` 的测试

---

## 2. 根本原因分析

### 2.1 直接原因

**页面未正确加载**:
- 页面内容为空，说明 H5 应用未正确渲染
- 可能的原因:
  1. H5 服务器未启动或不可访问
  2. 页面路由配置错误
  3. JavaScript 错误导致页面渲染失败
  4. 网络请求超时或失败
  5. SSL 证书问题(HTTPS)

### 2.2 选择器问题

**当前选择器策略**:
```javascript
// 在 auth.js 中使用的选择器
phoneLoginBtn: 'text=手机号登录',  // 文本选择器
passwordTab: '.tab',                // CSS 类选择器
submitBtn: 'uni-button.submit',     // uni-app 组件选择器
phoneInput: 'input[type="number"]', // 类型选择器
passwordInput: 'input[type="password"]' // 类型选择器
```

**问题**:
1. **文本选择器不可靠**: `text=手机号登录` 依赖于文本内容，如果文本变化或国际化，测试会失败
2. **uni-app 组件选择器**: `uni-button.submit` 在 H5 环境下可能被编译为其他元素
3. **缺少 data-testid**: 部分关键元素没有 `data-testid` 属性

### 2.3 时序问题

**可能的时序问题**:
1. 页面加载未完成就尝试查找元素
2. Vue 组件挂载延迟
3. 网络请求导致的异步加载
4. 动画效果导致元素不可见

### 2.4 环境配置问题

**环境变量检查**:
- `BASE_URL`: Web 服务器地址
- `ENV_TYPE`: 运行环境(unit/func/uat/prod)
- `ignoreHTTPSErrors`: Playwright 配置

---

## 3. 测试场景

### 3.1 正常场景测试

#### 场景 1: 手机号密码登录成功

**前置条件**:
- 后端服务正常运行
- H5 应用正常运行
- 测试用户已存在

**测试步骤**:
1. 打开应用首页
2. 验证登录页面加载(检查"安全守护"标题)
3. 点击"手机号登录"按钮
4. 等待跳转到手机号登录页面
5. 点击"密码登录"标签
6. 输入有效手机号
7. 输入有效密码
8. 点击"登录"按钮
9. 等待登录完成
10. 验证跳转到首页
11. 验证显示用户信息

**预期结果**:
- 所有步骤成功执行
- 成功跳转到首页
- 显示正确的用户信息

**选择器**:
```javascript
// 登录页面
loginPageTitle: '[data-testid="login-welcome-title"]'
phoneLoginButton: '[data-testid="phone-login-button"]'

// 手机号登录页面
tabPasswordLogin: '[data-testid="tab-password-login"]'
phoneInput: '[data-testid="phone-input"]'
passwordInput: '[data-testid="password-input"]'
loginSubmitButton: '[data-testid="login-submit-button"]'

// 首页验证
homePageIndicators: ['打卡', '社区', '我的']
```

#### 场景 2: 验证码登录成功

**前置条件**:
- 后端服务正常运行
- H5 应用正常运行
- 测试用户已存在
- 验证码服务正常(测试环境使用固定验证码 123456)

**测试步骤**:
1. 打开应用首页
2. 点击"手机号登录"按钮
3. 保持"验证码登录"标签(默认)
4. 输入有效手机号
5. 点击"获取验证码"按钮
6. 输入验证码(123456)
7. 点击"登录"按钮
8. 等待登录完成
9. 验证跳转到首页

**预期结果**:
- 验证码发送成功
- 登录成功
- 跳转到首页

#### 场景 3: 新用户注册成功

**前置条件**:
- 后端服务正常运行
- H5 应用正常运行
- 手机号未注册

**测试步骤**:
1. 打开应用首页
2. 点击"手机号登录"按钮
3. 点击"注册"标签
4. 输入新手机号
5. 点击"获取验证码"按钮
6. 输入验证码
7. 输入密码(符合密码规则)
8. 勾选用户协议
9. 点击"注册"按钮
10. 等待注册完成
11. 验证跳转到首页

**预期结果**:
- 注册成功
- 自动登录
- 跳转到首页

### 3.2 异常场景测试

#### 场景 4: 手机号格式错误

**测试步骤**:
1. 进入手机号登录页面
2. 输入无效手机号(如: 12345)
3. 点击"获取验证码"或"登录"按钮

**预期结果**:
- 显示错误提示"请输入正确的手机号"
- 不发送网络请求
- 表单验证失败

**测试数据**:
```javascript
const invalidPhones = [
  '12345',           // 太短
  '1234567890123456', // 太长
  'abcdefghijk',     // 非数字
  '',                // 空值
  '123 456 7890'     // 包含空格
]
```

#### 场景 5: 密码错误

**测试步骤**:
1. 进入密码登录页面
2. 输入有效手机号
3. 输入错误密码
4. 点击"登录"按钮

**预期结果**:
- 显示错误提示"用户名或密码错误"
- 不跳转页面
- 保留表单数据

#### 场景 6: 验证码错误

**测试步骤**:
1. 进入验证码登录页面
2. 输入有效手机号
3. 点击"获取验证码"
4. 输入错误验证码(如: 000000)
5. 点击"登录"按钮

**预期结果**:
- 显示错误提示"验证码错误"
- 不跳转页面
- 可以重新输入验证码

#### 场景 7: 用户不存在

**测试步骤**:
1. 使用未注册的手机号尝试登录
2. 输入密码或验证码
3. 点击"登录"按钮

**预期结果**:
- 显示错误提示"账号不存在，请先注册"
- 提示用户注册
- 可能自动切换到注册标签

#### 场景 8: 网络错误

**测试步骤**:
1. 模拟网络断开(使用 Playwright API)
2. 尝试登录
3. 恢复网络

**预期结果**:
- 显示友好的错误提示"网络连接失败，请检查网络设置"
- 不崩溃或卡死
- 网络恢复后可以重试

### 3.3 边界场景测试

#### 场景 9: 重复点击登录按钮

**测试步骤**:
1. 输入正确的登录信息
2. 快速多次点击登录按钮

**预期结果**:
- 只发送一次登录请求
- 按钮显示加载状态
- 防止重复提交

#### 场景 10: 登录超时

**测试步骤**:
1. 模拟后端响应超时
2. 尝试登录

**预期结果**:
- 显示超时错误提示
- 不永久阻塞
- 可以重试

#### 场景 11: 已登录状态

**测试步骤**:
1. 已登录用户打开应用
2. 尝试访问登录页面

**预期结果**:
- 自动跳转到首页
- 或显示"已登录"提示
- 不显示登录表单

#### 场景 12: Token 过期

**测试步骤**:
1. 设置过期的 token
2. 尝试访问需要认证的页面

**预期结果**:
- 自动清除过期 token
- 跳转到登录页面
- 显示"登录已过期"提示

### 3.4 性能测试场景

#### 场景 13: 页面加载性能

**测试步骤**:
1. 测量登录页面加载时间
2. 测量手机号登录页面加载时间
3. 测量登录响应时间

**性能指标**:
- 登录页面加载时间 < 2s
- 登录响应时间 < 1s
- 页面交互响应时间 < 100ms

#### 场景 14: 并发登录测试

**测试步骤**:
1. 多个测试用例同时执行登录
2. 验证数据一致性

**预期结果**:
- 不产生数据冲突
- 正确处理并发请求

---

## 4. 边界条件

### 4.1 输入边界

#### 手机号输入

| 条件 | 测试数据 | 预期结果 |
|------|---------|---------|
| 最小长度 | 13000000000 | 验证通过 |
| 最大长度 | 18999999999 | 验证通过 |
| 少于11位 | 123456789 | 验证失败 |
| 多于11位 | 123456789012 | 验证失败 |
| 非数字 | abcdefghijk | 验证失败 |
| 空值 | '' | 验证失败 |
| 包含特殊字符 | 138@#$%^&* | 验证失败 |

#### 密码输入

| 条件 | 测试数据 | 预期结果 |
|------|---------|---------|
| 最小长度(8位) | Test1234 | 验证通过 |
| 满足复杂性 | Abc12345 | 验证通过 |
| 少于8位 | Test123 | 验证失败 |
| 纯字母 | Testtest | 验证失败 |
| 纯数字 | 12345678 | 验证失败 |
| 空值 | '' | 验证失败 |

#### 验证码输入

| 条件 | 测试数据 | 预期结果 |
|------|---------|---------|
| 有效验证码 | 123456 | 验证通过 |
| 少于6位 | 12345 | 验证失败 |
| 多于6位 | 1234567 | 验证失败 |
| 非数字 | abcdef | 验证失败 |
| 空值 | '' | 验证失败 |

### 4.2 状态边界

| 状态 | 测试条件 | 预期结果 |
|------|---------|---------|
| 未登录 | 清除所有存储 | 显示登录页面 |
| 已登录 | 有效 token | 跳转到首页 |
| Token 过期 | 过期 token | 跳转到登录页 |
| 网络离线 | 断开网络 | 显示离线提示 |
| 服务器错误 | 500 错误 | 显示错误提示 |
| 请求超时 | 超过30秒 | 显示超时提示 |

### 4.3 并发边界

| 场景 | 测试条件 | 预期结果 |
|------|---------|---------|
| 重复点击 | 快速点击多次 | 只发送一次请求 |
| 多标签页 | 同时打开多个标签 | 正确处理登录状态 |
| 设备冲突 | 同一账号多设备登录 | 后登录设备生效 |

### 4.4 环境边界

| 环境 | 条件 | 预期结果 |
|------|------|---------|
| 开发环境 | ENV_TYPE=function | 使用本地 API |
| 测试环境 | ENV_TYPE=unit | 使用模拟数据 |
| 生产环境 | ENV_TYPE=prod | 使用生产 API |
| H5 环境 | 浏览器访问 | 正常显示 |
| 微信小程序 | 微信环境 | 调用微信登录 |

---

## 5. 验收标准

### 5.1 功能验收标准

#### 5.1.1 登录功能

- [ ] **必须**: 使用有效手机号和密码能成功登录
- [ ] **必须**: 登录成功后正确跳转到首页
- [ ] **必须**: 登录成功后用户信息正确显示
- [ ] **必须**: 错误的手机号或密码显示友好的错误提示
- [ ] **必须**: 登录失败不丢失表单数据

#### 5.1.2 验证码登录

- [ ] **必须**: 能成功发送验证码
- [ ] **必须**: 验证码60秒倒计时正常工作
- [ ] **必须**: 使用有效验证码能成功登录
- [ ] **必须**: 验证码错误显示正确提示
- [ ] **必须**: 验证码过期后需要重新获取

#### 5.1.3 用户注册

- [ ] **必须**: 新用户能成功注册
- [ ] **必须**: 注册成功后自动登录
- [ ] **必须**: 注册时必须勾选用户协议
- [ ] **必须**: 密码强度验证正确工作
- [ ] **必须**: 已注册手机号提示直接登录

#### 5.1.4 表单验证

- [ ] **必须**: 手机号格式验证正确
- [ ] **必须**: 密码强度验证正确
- [ ] **必须**: 验证码格式验证正确
- [ ] **必须**: 空值验证正确
- [ ] **必须**: 实时验证反馈及时

### 5.2 用户体验验收标准

#### 5.2.1 交互体验

- [ ] **必须**: 按钮点击有即时反馈
- [ ] **必须**: 加载状态清晰可见
- [ ] **必须**: 错误提示友好易懂
- [ ] **必须**: 表单输入流畅无卡顿
- [ ] **应该**: 支持键盘操作(回车提交)

#### 5.2.2 视觉体验

- [ ] **必须**: 页面布局美观整洁
- [ ] **必须**: 表单标签清晰可读
- [ ] **必须**: 错误提示醒目明显
- [ ] **必须**: 加载动画流畅自然
- [ ] **应该**: 支持暗黑模式

#### 5.2.3 性能体验

- [ ] **必须**: 登录页面加载时间 < 2s
- [ ] **必须**: 登录响应时间 < 1s
- [ ] **必须**: 表单交互响应 < 100ms
- [ ] **应该**: 首次内容绘制(FCP) < 1s
- [ ] **应该**: 最大内容绘制(LCP) < 2.5s

### 5.3 安全性验收标准

#### 5.3.1 数据安全

- [ ] **必须**: 密码不在前端明文存储
- [ ] **必须**: 密码使用 HTTPS 传输
- [ ] **必须**: Token 安全存储(加密)
- [ ] **必须**: 敏感信息不在日志中暴露
- [ ] **应该**: 支持生物识别登录

#### 5.3.2 防护措施

- [ ] **必须**: 防止暴力破解(验证码)
- [ ] **必须**: 防止 CSRF 攻击
- [ ] **必须**: 防止 XSS 攻击
- [ ] **必须**: 登录失败次数限制
- [ ] **应该**: 异常登录检测

### 5.4 兼容性验收标准

#### 5.4.1 浏览器兼容

- [ ] **必须**: Chrome 最新版本
- [ ] **必须**: Safari 最新版本
- [ ] **必须**: Firefox 最新版本
- [ ] **应该**: Edge 最新版本
- [ ] **应该**: 移动浏览器(iOS Safari, Android Chrome)

#### 5.4.2 设备兼容

- [ ] **必须**: iPhone (375x667)
- [ ] **必须**: Android (360x640)
- [ ] **应该**: iPad (768x1024)
- [ ] **应该**: 平板横屏(1024x768)

#### 5.4.3 网络兼容

- [ ] **必须**: 4G 网络
- [ ] **必须**: WiFi 网络
- [ ] **应该**: 3G 网络
- [ ] **应该**: 弱网环境

### 5.5 可维护性验收标准

#### 5.5.1 代码质量

- [ ] **必须**: 代码符合项目规范
- [ ] **必须**: 所有元素有 `data-testid`
- [ ] **必须**: 选择器稳定可靠
- [ ] **应该**: 代码复用性高
- [ ] **应该**: 注释清晰完整

#### 5.5.2 测试覆盖

- [ ] **必须**: 核心流程100%覆盖
- [ ] **必须**: 异常场景80%覆盖
- [ ] **应该**: 边界条件60%覆盖
- [ ] **应该**: 性能测试覆盖
- [ ] **应该**: 安全测试覆盖

#### 5.5.3 文档完整

- [ ] **必须**: 测试用例文档完整
- [ ] **必须**: 选择器文档清晰
- [ ] **必须**: 故障排查指南
- [ ] **应该**: 最佳实践文档
- [ ] **应该**: 视频教程

---

## 6. 测试实施指南

### 6.1 选择器策略

#### 6.1.1 选择器优先级

```
1. data-testid (最优先)
2. aria-label
3. ID (不推荐,但稳定)
4. Class (需谨慎)
5. Text (最不推荐)
6. CSS 选择器 (复杂选择器)
```

#### 6.1.2 推荐的选择器

**登录页面 (`login.vue`)**:
```javascript
const LOGIN_SELECTORS = {
  // 页面容器
  loginPage: '[data-testid="login-welcome-page"]',

  // 关键元素
  pageTitle: '[data-testid="login-welcome-title"]',
  phoneLoginButton: '[data-testid="phone-login-button"]',
  wechatLoginButton: '[data-testid="wechat-login-button"]',

  // 文本验证
  pageTitleText: 'text=安全守护',
  wechatLoginText: 'text=微信快捷登录',
  phoneLoginText: 'text=手机号登录'
}
```

**手机号登录页面 (`phone-login.vue`)**:
```javascript
const PHONE_LOGIN_SELECTORS = {
  // 页面容器
  container: '.container',

  // 标签页
  tabRegister: '[data-testid="tab-register"]',
  tabCodeLogin: '[data-testid="tab-code-login"]',
  tabPasswordLogin: '[data-testid="tab-password-login"]',

  // 输入框
  phoneInput: '[data-testid="phone-input"]',
  codeInput: '[data-testid="code-input"]',
  passwordInput: '[data-testid="password-input"]',

  // 按钮
  getCodeButton: '[data-testid="get-code-button"]',
  loginSubmitButton: '[data-testid="login-submit-button"]',

  // 其他元素
  agreementCheckbox: '[data-testid="agreement-checkbox"]',
  passwordToggle: '.password-toggle',
  rememberMe: '.remember-me'
}
```

#### 6.1.3 选择器最佳实践

**推荐**:
```javascript
// ✅ 使用 data-testid
await page.click('[data-testid="phone-login-button"]')

// ✅ 使用 aria-label
await page.click('[aria-label="登录"]')

// ✅ 组合选择器
await page.click('.tab[data-testid="tab-password-login"]')
```

**避免**:
```javascript
// ❌ 使用文本选择器(不稳定)
await page.click('text=手机号登录')

// ❌ 使用复杂的 CSS 选择器
await page.click('div > div > button.btn.primary')

// ❌ 使用索引
await page.click('.tab:nth-child(2)')
```

### 6.2 等待策略

#### 6.2.1 等待方法

```javascript
// 1. 等待元素可见
await page.waitForSelector('[data-testid="phone-login-button"]', {
  state: 'visible',
  timeout: 5000
})

// 2. 等待网络空闲
await page.waitForLoadState('networkidle')

// 3. 等待导航完成
await page.waitForURL('**/phone-login')

// 4. 等待特定条件
await page.waitForFunction(() => {
  return document.querySelector('[data-testid="phone-login-button"]') !== null
})

// 5. 固定等待(最后的选择)
await page.waitForTimeout(1000)
```

#### 6.2.2 推荐的等待流程

```javascript
async function waitForLoginPage(page) {
  // 1. 等待页面容器
  await page.waitForSelector('[data-testid="login-welcome-page"]', {
    state: 'attached',
    timeout: 10000
  })

  // 2. 等待关键元素可见
  await page.waitForSelector('[data-testid="phone-login-button"]', {
    state: 'visible',
    timeout: 5000
  })

  // 3. 等待网络空闲
  await page.waitForLoadState('networkidle', {
    timeout: 5000
  }).catch(() => {
    // 网络空闲超时不是致命错误
    console.warn('网络空闲超时,继续执行')
  })

  // 4. 验证页面内容
  const pageTitle = await page.textContent('[data-testid="login-welcome-title"]')
  expect(pageTitle).toContain('安全守护')
}
```

### 6.3 页面对象模式

#### 6.3.1 登录页面对象

```javascript
// tests/e2e-playwright/pages/LoginPage.js

export class LoginPage {
  constructor(page) {
    this.page = page

    // 选择器
    this.selectors = {
      loginPage: '[data-testid="login-welcome-page"]',
      pageTitle: '[data-testid="login-welcome-title"]',
      phoneLoginButton: '[data-testid="phone-login-button"]',
      wechatLoginButton: '[data-testid="wechat-login-button"]'
    }
  }

  /**
   * 等待登录页面加载
   */
  async waitForLoad() {
    await this.page.waitForSelector(this.selectors.loginPage, {
      state: 'visible',
      timeout: 10000
    })
    return this
  }

  /**
   * 点击手机号登录按钮
   */
  async clickPhoneLogin() {
    await this.page.click(this.selectors.phoneLoginButton, {
      timeout: 5000
    })
    return this
  }

  /**
   * 点击微信登录按钮
   */
  async clickWechatLogin() {
    await this.page.click(this.selectors.wechatLoginButton)
    return this
  }

  /**
   * 验证页面标题
   */
  async verifyPageTitle() {
    const title = await this.page.textContent(this.selectors.pageTitle)
    expect(title).toBe('安全守护')
    return this
  }
}
```

#### 6.3.2 手机号登录页面对象

```javascript
// tests/e2e-playwright/pages/PhoneLoginPage.js

export class PhoneLoginPage {
  constructor(page) {
    this.page = page

    // 选择器
    this.selectors = {
      container: '.container',
      tabRegister: '[data-testid="tab-register"]',
      tabCodeLogin: '[data-testid="tab-code-login"]',
      tabPasswordLogin: '[data-testid="tab-password-login"]',
      phoneInput: '[data-testid="phone-input"]',
      codeInput: '[data-testid="code-input"]',
      passwordInput: '[data-testid="password-input"]',
      getCodeButton: '[data-testid="get-code-button"]',
      loginSubmitButton: '[data-testid="login-submit-button"]',
      agreementCheckbox: '[data-testid="agreement-checkbox"]'
    }
  }

  /**
   * 等待页面加载
   */
  async waitForLoad() {
    await this.page.waitForSelector(this.selectors.container, {
      state: 'visible',
      timeout: 10000
    })
    return this
  }

  /**
   * 切换到密码登录标签
   */
  async switchToPasswordTab() {
    await this.page.click(this.selectors.tabPasswordLogin)
    await this.page.waitForTimeout(500) // 等待标签切换动画
    return this
  }

  /**
   * 切换到验证码登录标签
   */
  async switchToCodeTab() {
    await this.page.click(this.selectors.tabCodeLogin)
    await this.page.waitForTimeout(500)
    return this
  }

  /**
   * 切换到注册标签
   */
  async switchToRegisterTab() {
    await this.page.click(this.selectors.tabRegister)
    await this.page.waitForTimeout(500)
    return this
  }

  /**
   * 输入手机号
   */
  async enterPhone(phone) {
    await this.page.fill(this.selectors.phoneInput, phone)
    return this
  }

  /**
   * 输入密码
   */
  async enterPassword(password) {
    await this.page.fill(this.selectors.passwordInput, password)
    return this
  }

  /**
   * 输入验证码
   */
  async enterCode(code) {
    await this.page.fill(this.selectors.codeInput, code)
    return this
  }

  /**
   * 点击获取验证码
   */
  async clickGetCode() {
    await this.page.click(this.selectors.getCodeButton)
    return this
  }

  /**
   * 点击登录按钮
   */
  async clickLogin() {
    await this.page.click(this.selectors.loginSubmitButton)
    return this
  }

  /**
   * 勾选用户协议
   */
  async checkAgreement() {
    await this.page.check(this.selectors.agreementCheckbox)
    return this
  }

  /**
   * 使用密码登录
   */
  async loginWithPassword(phone, password) {
    return this
      .switchToPasswordTab()
      .enterPhone(phone)
      .enterPassword(password)
      .clickLogin()
  }

  /**
   * 使用验证码登录
   */
  async loginWithCode(phone, code) {
    return this
      .switchToCodeTab()
      .enterPhone(phone)
      .clickGetCode()
      .enterCode(code)
      .clickLogin()
  }

  /**
   * 注册新用户
   */
  async register(phone, code, password) {
    return this
      .switchToRegisterTab()
      .enterPhone(phone)
      .clickGetCode()
      .enterCode(code)
      .enterPassword(password)
      .checkAgreement()
      .clickLogin()
  }
}
```

### 6.4 测试用例示例

#### 6.4.1 基础登录测试

```javascript
// tests/e2e-playwright/specs/login-basic.spec.js

import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { PhoneLoginPage } from '../pages/PhoneLoginPage'
import { TEST_USERS } from '../fixtures/test-data.mjs'

test.describe('登录基础测试', () => {
  let loginPage
  let phoneLoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    phoneLoginPage = new PhoneLoginPage(page)

    // 清除登录状态
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('应该成功显示登录页面', async ({ page }) => {
    await page.goto('/')
    await loginPage.waitForLoad()
    await loginPage.verifyPageTitle()
  })

  test('应该成功使用密码登录', async ({ page }) => {
    const user = TEST_USERS.SUPER_ADMIN

    await page.goto('/')
    await loginPage.waitForLoad()
    await loginPage.clickPhoneLogin()

    // 等待跳转到手机号登录页面
    await page.waitForURL('**/phone-login')
    await phoneLoginPage.waitForLoad()

    // 执行登录
    await phoneLoginPage.loginWithPassword(user.phone, user.password)

    // 等待登录完成
    await page.waitForTimeout(5000)
    await page.waitForLoadState('networkidle')

    // 验证跳转到首页
    const pageText = await page.textContent('body')
    expect(pageText).toContain('我的')
  })

  test('应该显示密码错误提示', async ({ page }) => {
    await page.goto('/')
    await loginPage.waitForLoad()
    await loginPage.clickPhoneLogin()

    await page.waitForURL('**/phone-login')
    await phoneLoginPage.waitForLoad()

    // 使用错误密码登录
    await phoneLoginPage
      .switchToPasswordTab()
      .enterPhone(TEST_USERS.SUPER_ADMIN.phone)
      .enterPassword('WrongPassword123')
      .clickLogin()

    // 等待错误提示
    await page.waitForTimeout(2000)

    // 验证错误提示(根据实际页面调整选择器)
    const errorMessage = await page.textContent('body')
    expect(errorMessage).toMatch(/密码|登录失败/)
  })
})
```

#### 6.4.2 注册流程测试

```javascript
// tests/e2e-playwright/specs/register.spec.js

import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { PhoneLoginPage } from '../pages/PhoneLoginPage'
import { generate137PhoneNumber } from '../helpers/auth.js'

test.describe('用户注册测试', () => {
  let loginPage
  let phoneLoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    phoneLoginPage = new PhoneLoginPage(page)
  })

  test('应该成功注册新用户', async ({ page }) => {
    const phone = generate137PhoneNumber()
    const password = 'Test123456'
    const code = '123456' // 测试环境固定验证码

    await page.goto('/')
    await loginPage.waitForLoad()
    await loginPage.clickPhoneLogin()

    await page.waitForURL('**/phone-login')
    await phoneLoginPage.waitForLoad()

    // 执行注册
    await phoneLoginPage.register(phone, code, password)

    // 等待注册完成
    await page.waitForTimeout(5000)
    await page.waitForLoadState('networkidle')

    // 验证跳转到首页
    const pageText = await page.textContent('body')
    expect(pageText).toContain('我的')
  })

  test('应该验证密码强度', async ({ page }) => {
    await page.goto('/')
    await loginPage.waitForLoad()
    await loginPage.clickPhoneLogin()

    await page.waitForURL('**/phone-login')
    await phoneLoginPage.waitForLoad()

    // 使用弱密码
    await phoneLoginPage
      .switchToRegisterTab()
      .enterPhone('13900000000')
      .enterPassword('12345678') // 纯数字,不符合要求
      .clickLogin()

    // 等待验证提示
    await page.waitForTimeout(1000)

    // 验证错误提示
    const errorMessage = await page.textContent('body')
    expect(errorMessage).toMatch(/密码.*包含字母/)
  })
})
```

### 6.5 调试技巧

#### 6.5.1 截图和录屏

```javascript
test('调试登录测试', async ({ page }) => {
  // 截图
  await page.screenshot({
    path: 'screenshots/login-page.png',
    fullPage: true
  })

  // 执行操作

  // 失败时自动截图
  test.fail(true)
  // Playwright 会在失败时自动保存截图
})
```

#### 6.5.2 查看页面内容

```javascript
test('查看页面内容', async ({ page }) => {
  await page.goto('/')

  // 打印整个页面内容
  const pageContent = await page.textContent('body')
  console.log('页面内容:', pageContent.substring(0, 500))

  // 打印特定元素
  const buttonText = await page.textContent('[data-testid="phone-login-button"]')
  console.log('按钮文本:', buttonText)

  // 打印所有元素属性
  const element = await page.$('[data-testid="phone-login-button"]')
  const attributes = await element.evaluate((el) => {
    return Array.from(el.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value
    }))
  })
  console.log('元素属性:', attributes)
})
```

#### 6.5.3 慢动作模式

```javascript
// 在 playwright.config.js 中配置
{
  use: {
    launchOptions: {
      slowMo: 1000 // 每个操作延迟1秒
    }
  }
}

// 或在代码中
test('慢动作测试', async ({ page }) => {
  // 暂时使用慢动作
  await page.setDefaultTimeout(10000)
  await page.slowMo = 500

  // 执行测试
})
```

---

## 7. 故障排查指南

### 7.1 常见问题诊断

#### 问题 1: "未找到手机号登录按钮"

**症状**:
```
Error: locator.click: Target closed
=========================== lessons ========================

等待超时: 5000ms
期望: 'visible'
接收: 'detached'
```

**诊断步骤**:

1. **检查页面是否加载**:
```javascript
await page.goto('/')
await page.waitForTimeout(3000)

const pageContent = await page.textContent('body')
console.log('页面内容:', pageContent.substring(0, 500))

// 检查是否有 JavaScript 错误
page.on('pageerror', (error) => {
  console.error('页面错误:', error)
})
```

2. **检查选择器是否正确**:
```javascript
// 尝试不同的选择器
const selectors = [
  '[data-testid="phone-login-button"]',
  'text=手机号登录',
  '.phone-login-button',
  'button[type="button"]'
]

for (const selector of selectors) {
  const count = await page.locator(selector).count()
  console.log(`选择器 ${selector}: ${count} 个元素`)
}
```

3. **检查元素是否在视口内**:
```javascript
const button = page.locator('[data-testid="phone-login-button"]')

// 检查是否可见
const isVisible = await button.isVisible()
console.log('按钮可见:', isVisible)

// 检查是否在视口内
const isInViewport = await button.isInViewport()
console.log('在视口内:', isInViewport)

// 滚动到元素
await button.scrollIntoViewIfNeeded()
```

4. **检查网络请求**:
```javascript
// 监听所有网络请求
page.on('request', (request) => {
  console.log('请求:', request.url())
})

page.on('response', (response) => {
  console.log('响应:', response.url(), response.status())
})
```

**解决方案**:

- **方案1**: 增加等待时间
```javascript
await page.waitForSelector('[data-testid="phone-login-button"]', {
  state: 'visible',
  timeout: 15000 // 增加到15秒
})
```

- **方案2**: 使用更稳定的选择器
```javascript
// 优先使用 data-testid
await page.click('[data-testid="phone-login-button"]')
```

- **方案3**: 检查并修复页面加载问题
```javascript
// 等待页面完全加载
await page.waitForLoadState('domcontentloaded')
await page.waitForLoadState('networkidle')
```

#### 问题 2: 页面内容为空

**症状**:
```javascript
const pageContent = await page.textContent('body')
console.log(pageContent) // 输出: ''
```

**诊断步骤**:

1. **检查 H5 服务器是否运行**:
```bash
# 检查服务器是否启动
curl https://localhost:8081

# 检查端口是否监听
lsof -i :8081
```

2. **检查 Playwright 配置**:
```javascript
// playwright.config.js
{
  use: {
    baseURL: 'https://localhost:8081', // 确认正确
    ignoreHTTPSErrors: true           // 忽略 HTTPS 错误
  }
}
```

3. **检查页面 URL**:
```javascript
await page.goto('/')
console.log('当前 URL:', page.url())

// 应该显示: https://localhost:8081/#/pages/login/login
```

4. **检查控制台错误**:
```javascript
// 监听控制台消息
page.on('console', (msg) => {
  console.log('控制台:', msg.text())
})

// 监听页面错误
page.on('pageerror', (error) => {
  console.error('页面错误:', error.message)
  console.error('错误堆栈:', error.stack)
})
```

**解决方案**:

- **方案1**: 启动 H5 服务器
```bash
# 使用项目提供的脚本
cd /Users/qiaoliang/working/code/safeGuard/frontend
npm run build:func
python scripts/start-h5-https.sh
```

- **方案2**: 检查并修复构建错误
```bash
# 重新构建
npm run build:func

# 检查构建输出
ls -la dist/build/h5/
```

- **方案3**: 使用 HTTP 服务器(开发环境)
```javascript
// 临时使用 HTTP 而不是 HTTPS
// playwright.config.js
{
  use: {
    baseURL: 'http://localhost:8081'
  }
}
```

#### 问题 3: 登录后未跳转到首页

**症状**:
```javascript
// 登录成功,但仍在登录页面
const pageText = await page.textContent('body')
expect(pageText).toContain('我的') // 失败
```

**诊断步骤**:

1. **检查登录响应**:
```javascript
// 监听登录 API 响应
page.on('response', async (response) => {
  if (response.url().includes('/login')) {
    const data = await response.json()
    console.log('登录响应:', data)

    // 检查响应状态
    console.log('状态码:', response.status())
    console.log('响应码:', data.code)
    console.log('消息:', data.msg)
  }
})
```

2. **检查 Token 存储**:
```javascript
// 等待登录完成后检查
await page.waitForTimeout(3000)

const localStorage = await page.evaluate(() => {
  return {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userInfo: localStorage.getItem('user_info')
  }
})

console.log('本地存储:', localStorage)
```

3. **检查页面跳转**:
```javascript
// 监听页面导航
page.on('framenavigated', (frame) => {
  console.log('页面跳转:', frame.url())
})

// 或者检查当前 URL
console.log('当前 URL:', page.url())
```

**解决方案**:

- **方案1**: 增加登录等待时间
```javascript
await phoneLoginPage.clickLogin()

// 等待登录完成
await page.waitForTimeout(5000)
await page.waitForLoadState('networkidle')
```

- **方案2**: 等待特定 URL
```javascript
await phoneLoginPage.clickLogin()

// 等待跳转到首页
await page.waitForURL('**/pages/index/index', {
  timeout: 10000
})
```

- **方案3**: 检查并修复后端登录逻辑
```javascript
// 确保后端返回正确的 token 和用户信息
// 检查后端日志
```

#### 问题 4: 选择器不稳定

**症状**:
```javascript
// 有时能找到元素,有时找不到
const count = await page.locator('.tab').count()
console.log(count) // 输出: 0, 1, 或 2 (不稳定)
```

**诊断步骤**:

1. **检查页面结构**:
```javascript
// 打印页面 HTML 结构
const html = await page.innerHTML('body')
console.log('页面 HTML:', html.substring(0, 1000))
```

2. **检查动态类名**:
```javascript
// 检查元素的所有类名
const element = await page.$('.tab')
const classNames = await element.evaluate((el) => {
  return el.className
})
console.log('类名:', classNames)
```

3. **检查元素状态**:
```javascript
const element = page.locator('.tab')

// 检查各种状态
console.log('可见:', await element.isVisible())
console.log('附加:', await element.isAttached())
console.log('隐藏:', await element.isHidden())
console.log('启用:', await element.isEnabled())
```

**解决方案**:

- **方案1**: 使用 data-testid
```javascript
// 在源代码中添加
// <button data-testid="phone-login-button">手机号登录</button>

// 在测试中使用
await page.click('[data-testid="phone-login-button"]')
```

- **方案2**: 使用更具体的选择器
```javascript
// ❌ 太宽泛
await page.click('.tab')

// ✅ 更具体
await page.click('.tab[data-testid="tab-password-login"]')

// ✅ 或者使用文本
await page.click('.tab:has-text("密码登录")')
```

- **方案3**: 使用相对定位
```javascript
// 先找到父元素,再找子元素
const container = await page.$('.tabs')
const tab = await container.$('[data-testid="tab-password-login"]')
await tab.click()
```

### 7.2 日志和调试

#### 7.2.1 启用详细日志

```javascript
// playwright.config.js
export default defineConfig({
  // ...
  use: {
    // 启用详细日志
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 输出目录
  outputDir: 'playwright-test-result',

  // 报告器
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['junit', { outputFile: 'playwright-test-result/e2e-results.xml' }]
  ]
})
```

#### 7.2.2 自定义日志

```javascript
// 创建日志工具
class Logger {
  constructor(testTitle) {
    this.testTitle = testTitle
    this.logs = []
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString()
    const logEntry = { timestamp, message, data }
    this.logs.push(logEntry)
    console.log(`[${timestamp}] ${message}`, data || '')
  }

  saveToFile() {
    const fs = require('fs')
    const filename = `logs/${this.testTitle}-${Date.now()}.json`
    fs.writeFileSync(filename, JSON.stringify(this.logs, null, 2))
  }
}

// 在测试中使用
test('带日志的测试', async ({ page }) => {
  const logger = new Logger('login-test')

  logger.log('开始测试')
  await page.goto('/')

  logger.log('页面加载完成', { url: page.url() })

  try {
    await page.click('[data-testid="phone-login-button"]')
    logger.log('点击成功')
  } catch (error) {
    logger.log('点击失败', { error: error.message })
    logger.saveToFile()
    throw error
  }

  logger.log('测试完成')
  logger.saveToFile()
})
```

#### 7.2.3 性能监控

```javascript
test('性能监控', async ({ page }) => {
  // 监控页面加载性能
  const metrics = await page.evaluate(() => {
    const timing = performance.timing
    return {
      // 页面加载时间
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,

      // DNS 查询时间
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,

      // 服务器响应时间
      serverTime: timing.responseEnd - timing.requestStart,

      // DOM 解析时间
      domParseTime: timing.domComplete - timing.domInteractive,

      // 首次内容绘制
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime
    }
  })

  console.log('性能指标:', metrics)

  // 验证性能指标
  expect(metrics.pageLoadTime).toBeLessThan(3000)
  expect(metrics.firstPaint).toBeLessThan(1000)
})
```

### 7.3 环境问题排查

#### 7.3.1 检查网络连接

```javascript
test('检查网络连接', async ({ page }) => {
  // 检查后端 API
  try {
    const response = await page.request.get('http://localhost:9999/api/health')
    console.log('后端健康检查:', response.status())
  } catch (error) {
    console.error('后端连接失败:', error.message)
  }

  // 检查 H5 服务器
  try {
    const response = await page.request.get('https://localhost:8081')
    console.log('H5 服务器响应:', response.status())
  } catch (error) {
    console.error('H5 服务器连接失败:', error.message)
  }
})
```

#### 7.3.2 检查环境变量

```javascript
test('检查环境变量', async ({ page }) => {
  const envVars = await page.evaluate(() => {
    return {
      BASE_URL: process.env.BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      ENV_TYPE: process.env.ENV_TYPE
    }
  })

  console.log('环境变量:', envVars)

  // 验证环境变量
  expect(envVars.BASE_URL).toBeDefined()
  expect(envVars.ENV_TYPE).toBe('func')
})
```

#### 7.3.3 检查 SSL 证书

```bash
# 检查 SSL 证书
openssl s_client -connect localhost:8081 -showcerts

# 如果证书有问题,重新生成
cd scripts
python generate-cert.py
```

### 7.4 快速诊断清单

使用此清单快速诊断问题:

- [ ] H5 服务器是否运行?(检查 https://localhost:8081)
- [ ] 后端 API 是否运行?(检查 http://localhost:9999)
- [ ] 页面 URL 是否正确?(应该包含 #/pages/login/login)
- [ ] 页面内容是否为空?(检查 body 文本)
- [ ] 选择器是否正确?(使用 data-testid)
- [ ] 是否有 JavaScript 错误?(检查控制台)
- [ ] 是否有网络错误?(检查网络面板)
- [ ] Token 是否正确存储?(检查 localStorage)
- [ ] 登录响应是否正确?(检查 API 响应)
- [ ] 页面跳转是否正确?(检查 URL 变化)

---

## 8. 附录

### 8.1 术语表

| 术语 | 定义 |
|------|------|
| E2E | End-to-End,端到端测试 |
| Playwright | 微软开发的浏览器自动化测试框架 |
| data-testid | 专门用于测试的 HTML 属性 |
| Page Object Model | 页面对象模式,一种测试设计模式 |
| Selector | 选择器,用于定位页面元素 |
| Network Idle | 网络空闲状态,没有活跃的网络请求 |
| TDD | Test-Driven Development,测试驱动开发 |
| Red-Green-Refactor | TDD 的核心循环 |

### 8.2 参考资源

**官方文档**:
- [Playwright 官方文档](https://playwright.dev/)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)

**项目文档**:
- `/Users/qiaoliang/working/code/safeGuard/frontend/CLAUDE.md`
- `/Users/qiaoliang/working/code/safeGuard/frontend/rules/code-style-guide.md`
- `/Users/qiaoliang/working/code/safeGuard/frontend/rules/error-handling-guide.md`

**最佳实践**:
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Best Practices](https://testingjavascript.com/)
- [Page Object Model](https://www.selenium.dev/documentation/test-practices/bdd/page-object-model/)

### 8.3 变更历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|---------|
| 1.0.0 | 2026-01-23 | TDD Orchestrator | 初始版本 |

### 8.4 反馈和贡献

如有问题或建议,请:
1. 创建 Issue
2. 提交 Pull Request
3. 联系项目维护者

---

**文档结束**
