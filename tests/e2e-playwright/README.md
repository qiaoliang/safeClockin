# Playwright E2E 测试框架

## 概述

Playwright E2E 测试框架用于端到端自动化测试，模拟真实用户操作，验证应用的完整功能流程。

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

3. **测试数据准备**：确保测试用户数据已存在
   - 超级管理员：13900000001 / Test123456
   - 社区管理员：13900000002 / Test123456
   - 社区专员：13900000003 / Test123456
   - 普通用户：13900000004 / Test123456

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
```

### 环境变量

```bash
# 设置 Web 服务器地址
export BASE_URL="http://localhost:8081"

# 设置后端 API 地址
export BASE_URL_FOR_SAFEGUARD="http://localhost:9999"

# 运行测试
npm run test:playwright
```

## 测试结构

```
tests/e2e-playwright/
├── helpers/           # 测试辅助函数
│   ├── auth.js       # 认证相关辅助函数
│   └── navigation.js # 导航相关辅助函数
├── fixtures/         # 测试夹具
│   └── test-data.js  # 测试数据
└── specs/            # 测试用例
    └── login.spec.js # 登录测试
```

## 编写测试用例

### 基本测试用例示例

```javascript
import { test, expect } from '@playwright/test';

test('示例测试', async ({ page }) => {
  // 导航到页面
  await page.goto('/pages/LOGIN/index.html');
  
  // 执行操作
  await page.locator('input[type="tel"]').fill('13900000001');
  await page.locator('input[type="password"]').fill('Test123456');
  await page.locator('button:has-text("登录")').click();
  
  // 验证结果
  await expect(page.locator('[data-testid="user-nickname"]')).toBeVisible();
});
```

### 使用辅助函数

```javascript
import { test } from '@playwright/test';
import { loginWithPhoneAndPassword } from '../helpers/auth.js';
import { navigateToLoginPage } from '../helpers/navigation.js';
import { TEST_USERS } from '../fixtures/test-data.js';

test('使用辅助函数登录', async ({ page }) => {
  await navigateToLoginPage(page);
  await loginWithPhoneAndPassword(page, TEST_USERS.SUPER_ADMIN.phone, TEST_USERS.SUPER_ADMIN.password);
});
```

## 测试报告

测试完成后，会生成 HTML 测试报告：

```bash
# 查看测试报告
npx playwright show-report
```

报告位置：`playwright-report/index.html`

## 调试技巧

### 1. 使用调试模式

```bash
npm run test:playwright:debug
```

### 2. 使用有头模式

```bash
npm run test:playwright:headed
```

### 3. 查看截图和视频

失败的测试会自动生成截图和视频：
- 截图：`test-results/`
- 视频：`test-results/`

### 4. 添加断点

```javascript
test('调试测试', async ({ page }) => {
  await page.goto('/pages/LOGIN/index.html');
  
  // 添加断点
  await page.pause();
  
  // 继续执行
  await page.locator('button').click();
});
```

## 常见问题

### 1. 后端服务未启动

错误：`后端服务未运行，请先启动后端服务`

解决：启动后端服务
```bash
cd backend
./localrun.sh
```

### 2. Web 服务器未启动

错误：`Web 服务器未运行，正在启动...`

解决：脚本会自动启动 Web 服务器，无需手动操作

### 3. 测试超时

错误：`Test timeout of 60000ms exceeded`

解决：增加测试超时时间
```javascript
test.setTimeout(120000); // 2分钟
```

### 4. 元素未找到

错误：`locator.click: Target closed`

解决：增加等待时间
```javascript
await page.waitForSelector('button', { timeout: 10000 });
await page.locator('button').click();
```

## 最佳实践

1. **使用辅助函数**：封装常用操作，提高代码复用性
2. **添加清晰的断言**：每个测试用例应该有明确的验证点
3. **使用测试数据夹具**：统一管理测试数据
4. **保持测试独立性**：每个测试用例应该独立运行，不依赖其他测试
5. **添加有意义的描述**：测试用例名称应该清晰描述测试内容
6. **使用 data-testid**：在页面元素上添加 `data-testid` 属性，提高测试稳定性

## 持续集成

在 CI 环境中运行测试：

```yaml
- name: Run E2E Tests
  run: |
    npm run test:playwright
  env:
    BASE_URL: http://localhost:8081
    BASE_URL_FOR_SAFEGUARD: http://localhost:9999
```

## 参考资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [Playwright API 参考](https://playwright.dev/docs/api/class-playwright)