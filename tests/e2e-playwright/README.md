# Playwright E2E 测试框架

## 概述

Playwright E2E 测试框架用于端到端自动化测试，模拟真实用户操作，验证应用的完整功能流程。

**新特性**：框架已重构为 Page Object Model (POM) 架构，使用 `data-testid` 选择器，提供更稳定、可维护的测试。

## 架构设计

### Page Object Model (POM)

框架采用 POM 设计模式，将页面元素和操作封装为 Page Object 类：

```
tests/e2e-playwright/
├── pages/                     # Page Objects
│   ├── BasePage.js            # 基础页面类
│   ├── LoginPage.js           # 登录页
│   ├── PhoneLoginPage.js      # 手机登录页
│   ├── HomePage.js            # 首页
│   ├── ProfilePage.js         # 个人中心
│   ├── CommunityListPage.js   # 社区列表
│   ├── CreateCommunityPage.js # 创建社区
│   └── EventClosePage.js      # 事件关闭
├── utils/                     # 工具类
│   ├── selectors.js           # 统一的 data-testid 选择器
│   └── wait-helpers.js        # 智能等待辅助函数
├── helpers/                   # 辅助函数
│   ├── api-client.js          # API 客户端（数据清理）
│   ├── auth.js                # 认证辅助
│   └── navigation.js          # 导航辅助
├── fixtures/                  # 测试夹具
│   ├── base.fixture.js        # 自定义 fixtures
│   └── test-data.mjs          # 测试数据管理
└── specs/                     # 测试用例
    ├── login.refactored.spec.js          # 登录测试（新）
    ├── create-community.refactored.spec.js # 创建社区测试（新）
    └── *.spec.js              # 其他测试
```

### 选择器策略

框架优先使用 `data-testid` 属性进行元素定位，提高测试稳定性：

```javascript
// ❌ 不推荐：CSS 类名选择器
page.locator('.login-button')

// ✅ 推荐：data-testid 选择器
page.locator('data-testid=login-submit-button')
```

### 智能等待策略

使用智能等待替代硬编码的 `waitForTimeout`：

```javascript
// ❌ 不推荐：硬编码等待
await page.waitForTimeout(3000);

// ✅ 推荐：智能等待
await page.waitForLoadState('networkidle');
await page.waitForSelector('data-testid=home-page');
```

## 前置要求

1. **后端服务运行**：确保后端服务已启动
   ```bash
   cd backend
   ./localrun.sh
   ```

2. **Web 应用构建**：确保 H5 应用已构建
   ```bash
   cd frontend
   ./scripts/h5build.sh
   ```

3. **测试用户数据**：
   - 超级管理员：`13141516171` / `F1234567`
   - 社区管理员：`13900000002` / `Test123456`
   - 社区专员：`13900000003` / `Test123456`
   - 普通用户：`13900000004` / `Test123456`

## 安装依赖

```bash
cd frontend
npm install
npx playwright install chromium
```

## 运行测试

### 基本用法

```bash
# 运行所有测试（无头模式）
npm run test:playwright

# 使用 UI 模式运行测试
npm run test:playwright:ui

# 使用调试模式运行测试
npm run test:playwright:debug

# 使用有头模式运行测试（显示浏览器窗口）
npm run test:playwright:headed

# 运行特定测试文件
npx playwright test login.spec.js

# 运行重构后的新测试
npx playwright test login.refactored.spec.js
```

### 环境变量

```bash
# 设置 Web 服务器地址（HTTPS）
export BASE_URL="https://localhost:8081"

# 设置后端 API 地址
export BASE_URL_FOR_SAFEGUARD="http://localhost:9999"

# 运行测试
npm run test:playwright
```

## 编写测试用例

### 使用 Page Objects

```javascript
import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { HomePage } from '../pages/HomePage.js';

test('超级管理员登录', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // 导航并登录
  await loginPage.goto();
  await loginPage.loginAsSuperAdmin();

  // 验证
  const homePage = new HomePage(page);
  await homePage.isLoaded();
});
```

### 使用自定义 Fixtures

```javascript
import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

test('使用自定义 fixture', async ({ loginPage }) => {
  // loginPage 已自动注入
  await loginPage.goto();
  await loginPage.isLoaded();
});
```

### 使用 API 客户端管理数据

```javascript
import { test } from '@playwright/test';
import { ApiClient, createAuthenticatedApiClient } from '../helpers/api-client.js';
import { TEST_USERS, TestDataTracker } from '../fixtures/test-data.mjs';

test('创建和清理测试数据', async () => {
  const tracker = new TestDataTracker();

  // 创建 API 客户端
  const apiClient = await createAuthenticatedApiClient(
    TEST_USERS.SUPER_ADMIN.phone,
    TEST_USERS.SUPER_ADMIN.password
  );

  // 创建测试社区
  const response = await apiClient.createCommunity({
    name: `测试社区_${Date.now()}`,
    location: '测试地址',
  });

  if (response.code === 1 && response.data?.community_id) {
    tracker.trackCommunity(response.data.community_id);
  }

  // 测试结束自动清理
  const result = await tracker.cleanupAll();
  expect(result.success).toBe(true);
});
```

### 智能等待示例

```javascript
import { waitForPageStable, waitForTextContent } from '../utils/wait-helpers.js';

test('使用智能等待', async ({ page }) => {
  await page.goto('/');

  // 等待页面稳定
  await waitForPageStable(page);

  // 等待特定文本出现
  await waitForTextContent(page, '安全守护');
});
```

## 测试数据管理

### TestDataTracker

用于追踪和自动清理测试数据：

```javascript
import { TestDataTracker } from '../fixtures/test-data.mjs';

test('追踪测试数据', async () => {
  const tracker = new TestDataTracker();

  // 记录创建的数据
  tracker.trackCommunity(communityId);
  tracker.trackUser(userId, true); // true 表示测试结束后删除用户
  tracker.trackEvent(eventId);
  tracker.trackRule(ruleId);

  // 测试结束后自动清理
  // afterEach 中调用 await tracker.cleanupAll();
});
```

### API 客户端

提供与后端 API 交互的方法：

```javascript
import { ApiClient } from '../helpers/api-client.js';

const apiClient = new ApiClient();

// 登录
await apiClient.loginWithPassword(phone, password);

// 创建社区
await apiClient.createCommunity({ name, location });

// 删除社区
await apiClient.deleteCommunity(communityId);

// 关闭事件
await apiClient.closeEvent(eventId, reason);
```

## 添加新的 Page Object

### 1. 创建 Page Object 类

```javascript
// pages/MyNewPage.js
import { BasePage } from './BasePage.js';
import { mySelectors } from '../utils/selectors.js';

export class MyNewPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = mySelectors;
  }

  async goto() {
    await super.goto('/pages/my-page');
  }

  async isLoaded() {
    await this.waitForElementVisible(this.selectors.container);
  }

  async clickButton() {
    await this.safeClick(this.selectors.button);
  }
}
```

### 2. 添加选择器定义

```javascript
// utils/selectors.js
export const mySelectors = {
  container: 'data-testid=my-page',
  button: 'data-testid=my-button',
};
```

### 3. 在应用中添加 data-testid

```vue
<!-- src/pages/my-page/my-page.vue -->
<template>
  <view data-testid="my-page">
    <button data-testid="my-button" @click="handleClick">
      点击我
    </button>
  </view>
</template>
```

### 4. 在测试中使用

```javascript
import { test } from '@playwright/test';
import { MyNewPage } from '../pages/MyNewPage.js';

test('测试新页面', async ({ page }) => {
  const myPage = new MyNewPage(page);
  await myPage.goto();
  await myPage.isLoaded();
  await myPage.clickButton();
});
```

## 最佳实践

### 1. 使用 Page Objects

✅ **推荐**：封装页面操作到 Page Object

```javascript
const loginPage = new LoginPage(page);
await loginPage.loginAsSuperAdmin();
```

❌ **不推荐**：直接操作 DOM

```javascript
await page.goto('/pages/login/login.html');
await page.locator('input').fill('13141516171');
await page.locator('button').click();
```

### 2. 使用 data-testid

✅ **推荐**：使用 data-testid 选择器

```javascript
await page.locator('data-testid=login-submit-button').click();
```

❌ **不推荐**：使用 CSS 类名

```javascript
await page.locator('.submit-btn').click();
```

### 3. 智能等待

✅ **推荐**：使用智能等待

```javascript
await page.waitForLoadState('networkidle');
await waitForElementVisible(page, selector);
```

❌ **不推荐**：硬编码等待

```javascript
await page.waitForTimeout(3000);
```

### 4. 测试数据清理

✅ **推荐**：自动清理测试数据

```javascript
test.afterEach(async () => {
  await tracker.cleanupAll();
});
```

❌ **不推荐**：不清理测试数据

```javascript
// 没有清理逻辑，测试数据堆积
```

### 5. 使用断言

✅ **推荐**：添加明确的断言

```javascript
await expect(page.locator('data-testid=user-name')).toHaveText('测试用户');
```

❌ **不推荐**：没有断言

```javascript
await page.click('button'); // 没有验证结果
```

## 测试报告

### HTML 报告

```bash
# 查看测试报告
npx playwright show-report
```

报告位置：`playwright-report/index.html`

### 截图和视频

失败的测试会自动生成截图和视频：
- 截图：`test-results/`
- 视频：`test-results/`

## 调试技巧

### 1. 使用 UI 模式

```bash
npm run test:playwright:ui
```

### 2. 使用调试模式

```bash
npm run test:playwright:debug
```

### 3. 添加断点

```javascript
test('调试测试', async ({ page }) => {
  await page.goto('/');

  // 添加断点
  await page.pause();

  // 继续执行
  await page.locator('button').click();
});
```

### 4. 使用有头模式

```bash
npm run test:playwright:headed
```

## 常见问题

### 1. 后端服务未启动

**错误**：`ECONNREFUSED`

**解决**：启动后端服务
```bash
cd backend
./localrun.sh
```

### 2. 元素未找到

**错误**：`TimeoutError: locator.click: Target closed`

**解决**：
1. 检查是否添加了 `data-testid` 属性
2. 使用智能等待而非硬编码等待
3. 增加 `timeout` 参数

### 3. 测试超时

**错误**：`Test timeout of 60000ms exceeded`

**解决**：增加测试超时时间
```javascript
test.setTimeout(120000); // 2分钟
```

### 4. 数据清理失败

**错误**：`API 请求失败`

**解决**：检查 API 客户端配置，确保后端服务运行正常

## 持续集成

在 CI 环境中运行测试：

```yaml
- name: Run E2E Tests
  run: |
    npm run test:playwright
  env:
    BASE_URL: https://localhost:8081
    BASE_URL_FOR_SAFEGUARD: http://localhost:9999
```

## 迁移指南

### 从旧架构迁移到新架构

1. **添加 data-testid 属性**
   - 在应用组件中添加 `data-testid` 属性
   - 参考现有的 `selectors.js` 定义

2. **创建 Page Object**
   - 继承 `BasePage` 类
   - 实现页面操作方法

3. **使用智能等待**
   - 替换 `waitForTimeout` 为 `waitForLoadState`
   - 使用 `waitForElementVisible` 等辅助函数

4. **实现数据清理**
   - 使用 `ApiClient` 管理测试数据
   - 使用 `TestDataTracker` 追踪数据

## 参考资源

- [Playwright 官方文档](https://playwright.dev/)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
