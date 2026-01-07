import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * 用于端到端自动化测试
 */
export default defineConfig({
  testDir: './tests/e2e-playwright',
  
  // 并行运行测试（禁用以避免SQLite数据库锁定）
  fullyParallel: false,
  
  // 在 CI 环境中失败时重试
  retries: process.env.CI ? 2 : 0,
  
  // 使用单线程运行测试（避免SQLite数据库锁定）
  workers: 1,
  
  // 测试报告
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }]
  ],
  
  // 全局设置
  use: {
    // 基础 URL（Web 服务器地址）
    baseURL: process.env.BASE_URL || 'http://localhost:8081',
    
    // 截图和视频配置
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 超时配置
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // 视口大小
    viewport: { width: 375, height: 667 }, // iPhone SE 尺寸
    
    // 忽略 HTTPS 错误（自签名证书）
    ignoreHTTPSErrors: true,
  },
  
  // 测试超时
  timeout: 60000,
  
  // 全局超时配置
  expect: {
    timeout: 10000
  },
  
  // 项目配置（多浏览器支持）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 如果需要测试其他浏览器，可以取消注释
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // 注意：Web 服务器由 run-playwright-e2e.sh 脚本管理，不在此配置
  // 使用 start-h5-https.sh 启动 HTTPS 服务器
});