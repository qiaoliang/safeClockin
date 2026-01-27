import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * 用于端到端自动化测试
 */

// 所有临时文件都保存在 /tmp 目录下
const TEMP_DIR = '/tmp/playwright';

export default defineConfig({
  testDir: './tests/e2e-playwright',

  // 测试匹配模式（包括 pre-pom 文件）
  testMatch: [
    '**/*.spec.js',
    '**/*.spec.pre-pom.js'
  ],

  // 并行运行测试（禁用以避免SQLite数据库锁定）
  fullyParallel: false,

  // 在 CI 环境中失败时重试
  retries: process.env.CI ? 2 : 0,

  // 使用单线程运行测试（避免SQLite数据库锁定）
  workers: 1,

  // 测试结果输出目录
  outputDir: `${TEMP_DIR}/test-result`,

  // 测试报告
  reporter: [
    ['html', { outputFolder: `${TEMP_DIR}/report` }],
    ['list'],
    ['junit', { outputFile: `${TEMP_DIR}/test-result/e2e-results.xml` }]
  ],

  // 全局设置
  use: {
    // 基础 URL（Web 服务器地址）
    baseURL: process.env.BASE_URL || 'https://localhost:8081',

    // 截图和视频配置
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 截图和视频输出目录
    screenshotDir: `${TEMP_DIR}/screenshots`,
    videoDir: `${TEMP_DIR}/videos`,
    traceDir: `${TEMP_DIR}/traces`,

    // 超时配置
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // 视口大小 - 使用桌面分辨率确保所有元素可见
    viewport: { width: 1280, height: 720 }, // HD 桌面分辨率

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